import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { handleApiError, handleDeviceError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Zap, 
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryLow,
  Gauge,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { hc03Sdk, Detection, type ECGData, type BloodOxygenData, type BloodPressureData, type TemperatureData, type BatteryData } from '@/lib/hc03-sdk';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HC03Device {
  id: string;
  deviceId: string;
  deviceName: string;
  batteryLevel: number;
  chargingStatus: boolean;
  connectionStatus: string;
  lastConnected: string;
}

interface VitalReading {
  type: Detection;
  value: number | string;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'fair' | 'poor';
  additionalData?: any;
}

export default function HC03DeviceManager({ patientId }: { patientId: string }) {
  const [connectedDevice, setConnectedDevice] = useState<HC03Device | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeDetections, setActiveDetections] = useState<Set<Detection>>(new Set());
  const [vitalReadings, setVitalReadings] = useState<VitalReading[]>([]);
  const [latestReadings, setLatestReadings] = useState<Record<Detection, VitalReading>>({} as Record<Detection, VitalReading>);
  const [devices, setDevices] = useState<HC03Device[]>([]);
  const [connectionHealth, setConnectionHealth] = useState({
    isHealthy: false,
    lastHeartbeat: null as Date | null,
    reconnectAttempts: 0,
    signalStrength: 0
  });
  const [realTimeStatus, setRealTimeStatus] = useState({
    connected: false,
    deviceName: '',
    deviceId: '',
    signalStrength: 0
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load patient's HC03 devices
  useEffect(() => {
    loadPatientDevices();
  }, [patientId]);

  // Monitor connection health and update real-time status
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      if (hc03Sdk.isDeviceConnected()) {
        const status = hc03Sdk.getConnectionStatus();
        const activeDetectionsList = hc03Sdk.getActiveDetections();
        
        setRealTimeStatus({
          connected: status.connected,
          deviceName: status.deviceName || 'HC03 Device',
          deviceId: status.deviceId || '',
          signalStrength: status.signalStrength || 0
        });
        
        setConnectionHealth(prev => ({
          isHealthy: status.connected && activeDetectionsList.length > 0,
          lastHeartbeat: status.connected ? new Date() : prev.lastHeartbeat,
          reconnectAttempts: status.connected ? 0 : prev.reconnectAttempts,
          signalStrength: status.signalStrength || 0
        }));
        
        // Update active detections
        setActiveDetections(new Set(activeDetectionsList));
      } else {
        // Connection lost - just update status, let SDK handle reconnection
        setRealTimeStatus({
          connected: false,
          deviceName: connectedDevice?.deviceName || '',
          deviceId: connectedDevice?.deviceId || '',
          signalStrength: 0
        });
        
        setConnectionHealth(prev => ({
          isHealthy: false,
          lastHeartbeat: prev.lastHeartbeat,
          reconnectAttempts: prev.reconnectAttempts + (prev.reconnectAttempts > 0 ? 0 : 1),
          signalStrength: 0
        }));
        
        // Show connection lost message if we had a connected device
        if (connectedDevice) {
          setConnectionError('Connection lost. Please reconnect manually.');
          // Update backend with disconnected status
          updateDeviceConnectionStatus(connectedDevice.deviceId, 'disconnected').catch(() => {
            console.log('Failed to update device connection status on disconnect');
          });
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(healthCheckInterval);
  }, [connectedDevice]);


  const loadPatientDevices = async () => {
    try {
      const response = await apiRequest(`/api/hc03/devices/${patientId}`) as unknown as HC03Device[];
      setDevices(response);
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'loadDevices', error as Error, { patientId });
    }
  };

  // Connect to HC03 device with enhanced error handling
  const connectToDevice = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Check if Bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported on this device');
      }

      await hc03Sdk.initialize();
      const device = await hc03Sdk.connectDevice();
      
      const deviceData = {
        deviceId: device.id,
        deviceName: device.name || 'HC03 Device',
        patientId: patientId,
        batteryLevel: 100,
        chargingStatus: false
      };

      // Register device with backend
      const registeredDevice = await apiRequest('/api/hc03/devices', 'POST', deviceData) as unknown as HC03Device;

      // Update device connection status to 'connected'
      await updateDeviceConnectionStatus(registeredDevice.deviceId, 'connected');

      setConnectedDevice(registeredDevice);
      setConnectionError(null);
      
      // Set up data callbacks
      setupDataCallbacks();
      
      toast({
        title: "Device Connected",
        description: `Connected to ${device.name}`,
      });
      
      await loadPatientDevices();
      
    } catch (error) {
      const err = error as Error;
      let errorMessage = "Failed to connect to HC03 device";
      
      // Provide specific error messages based on DOMException names
      if (err.name === 'NotSupportedError' || err.message.includes('Bluetooth not supported')) {
        errorMessage = "Bluetooth is not supported on this device";
      } else if (err.name === 'NotAllowedError' || err.message.includes('not allowed')) {
        errorMessage = "Bluetooth permission denied. Please allow Bluetooth access.";
      } else if (err.name === 'NotFoundError' || err.message.includes('not found')) {
        errorMessage = "No HC03 device found nearby. Please make sure device is turned on.";
      } else if (err.name === 'NetworkError' || err.message.includes('GATT')) {
        errorMessage = "Failed to connect to device. Please try again.";
      } else if (err.name === 'SecurityError') {
        errorMessage = "Secure context required. Please use HTTPS.";
      }
      
      setConnectionError(errorMessage);
      handleDeviceError('HC03DeviceManager', 'connectDevice', err, { patientId });
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [patientId, toast]);


  // Set up data callbacks for different detection types
  const setupDataCallbacks = () => {
    // ECG data callback
    hc03Sdk.setCallback(Detection.ECG, (data: ECGData) => {
      const reading: VitalReading = {
        type: Detection.ECG,
        value: data.hr,
        unit: 'BPM',
        timestamp: new Date(),
        quality: data.touch ? 'good' : 'poor',
        additionalData: {
          moodIndex: data.moodIndex,
          hrv: data.hrv,
          respiratoryRate: data.respiratoryRate,
          waveData: data.wave
        }
      };
      addVitalReading(reading);
      saveEcgData(data);
    });

    // Blood Oxygen callback
    hc03Sdk.setCallback(Detection.OX, (data: BloodOxygenData) => {
      const reading: VitalReading = {
        type: Detection.OX,
        value: data.bloodOxygen,
        unit: '%',
        timestamp: new Date(),
        quality: data.fingerDetection ? 'good' : 'poor',
        additionalData: {
          heartRate: data.heartRate,
          waveData: data.bloodOxygenWaveData
        }
      };
      addVitalReading(reading);
      saveBloodOxygenData(data);
    });

    // Blood Pressure callback
    hc03Sdk.setCallback(Detection.BP, (data: BloodPressureData) => {
      const reading: VitalReading = {
        type: Detection.BP,
        value: `${data.ps}/${data.pd}`,
        unit: 'mmHg',
        timestamp: new Date(),
        quality: 'good',
        additionalData: {
          systolic: data.ps,
          diastolic: data.pd,
          heartRate: data.hr,
          progress: data.progress
        }
      };
      addVitalReading(reading);
      saveBloodPressureData(data);
    });

    // Temperature callback
    hc03Sdk.setCallback(Detection.BT, (data: TemperatureData) => {
      const reading: VitalReading = {
        type: Detection.BT,
        value: data.temperature,
        unit: '°C',
        timestamp: new Date(),
        quality: 'good'
      };
      addVitalReading(reading);
      saveTemperatureData(data);
    });

    // Battery callback
    hc03Sdk.setCallback(Detection.BATTERY, (data: BatteryData) => {
      if (connectedDevice) {
        updateDeviceBattery(connectedDevice.deviceId, data.batteryLevel, data.chargingStatus);
      }
    });
  };

  // Save data functions
  const saveEcgData = async (data: ECGData) => {
    try {
      await apiRequest('/api/hc03/data/ecg', 'POST', {
        patientId,
        deviceId: connectedDevice?.deviceId,
        waveData: data.wave,
        heartRate: data.hr,
        moodIndex: data.moodIndex,
        rrInterval: data.rr,
        hrv: data.hrv,
        respiratoryRate: data.respiratoryRate,
        fingerDetected: data.touch
      });
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'saveEcgData', error as Error, { deviceId: connectedDevice?.deviceId });
    }
  };

  const saveBloodOxygenData = async (data: BloodOxygenData) => {
    try {
      await apiRequest('/api/hc03/data/blood-oxygen', 'POST', {
        patientId,
        deviceId: connectedDevice?.deviceId,
        bloodOxygen: data.bloodOxygen,
        heartRate: data.heartRate,
        fingerDetected: data.fingerDetection,
        waveData: data.bloodOxygenWaveData
      });
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'saveBloodOxygenData', error as Error, { deviceId: connectedDevice?.deviceId });
    }
  };

  const saveBloodPressureData = async (data: BloodPressureData) => {
    try {
      await apiRequest('/api/hc03/data/blood-pressure', 'POST', {
        patientId,
        deviceId: connectedDevice?.deviceId,
        systolic: data.ps,
        diastolic: data.pd,
        heartRate: data.hr,
        measurementProgress: data.progress
      });
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'saveBloodPressureData', error as Error, { deviceId: connectedDevice?.deviceId });
    }
  };

  const saveTemperatureData = async (data: TemperatureData) => {
    try {
      await apiRequest('/api/hc03/data/temperature', 'POST', {
        patientId,
        deviceId: connectedDevice?.deviceId,
        temperature: data.temperature,
        measurementSite: 'forehead'
      });
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'saveTemperatureData', error as Error, { deviceId: connectedDevice?.deviceId });
    }
  };

  const updateDeviceBattery = async (deviceId: string, batteryLevel: number, chargingStatus: boolean) => {
    try {
      await apiRequest(`/api/hc03/devices/${deviceId}/battery`, 'PATCH', { batteryLevel, chargingStatus });
      
      setConnectedDevice(prev => prev ? { ...prev, batteryLevel, chargingStatus } : null);
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'updateDeviceBattery', error as Error, { deviceId });
    }
  };

  const updateDeviceConnectionStatus = async (deviceId: string, status: 'connected' | 'disconnected' | 'syncing') => {
    try {
      await apiRequest(`/api/hc03/devices/${deviceId}/status`, 'PATCH', { status });
      
      setConnectedDevice(prev => prev ? { ...prev, connectionStatus: status, lastConnected: new Date().toISOString() } : null);
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'updateDeviceConnectionStatus', error as Error, { deviceId, status });
    }
  };

  // Start detection
  const startDetection = useCallback(async (detection: Detection) => {
    if (!hc03Sdk.isDeviceConnected()) {
      toast({
        title: "Device Not Connected",
        description: "Please connect an HC03 device first",
        variant: "destructive",
      });
      return;
    }

    try {
      await hc03Sdk.startDetect(detection);
      setActiveDetections(prev => new Set([...Array.from(prev), detection]));
      
      toast({
        title: "Detection Started",
        description: `Started ${getDetectionName(detection)} monitoring`,
      });
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'startDetection', error as Error, { deviceId: connectedDevice?.deviceId, detection });
      toast({
        title: "Detection Failed",
        description: `Failed to start ${getDetectionName(detection)} monitoring`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop detection
  const stopDetection = useCallback(async (detection: Detection) => {
    try {
      await hc03Sdk.stopDetect(detection);
      setActiveDetections(prev => {
        const newSet = new Set(prev);
        newSet.delete(detection);
        return newSet;
      });
      
      toast({
        title: "Detection Stopped",
        description: `Stopped ${getDetectionName(detection)} monitoring`,
      });
    } catch (error) {
      handleDeviceError('HC03DeviceManager', 'stopDetection', error as Error, { deviceId: connectedDevice?.deviceId, detection });
    }
  }, [toast]);

  // Add vital reading
  const addVitalReading = useCallback((reading: VitalReading) => {
    setVitalReadings(prev => [reading, ...prev.slice(0, 99)]); // Keep last 100 readings
    setLatestReadings(prev => ({ ...prev, [reading.type]: reading }));
  }, []);

  // Get detection name
  const getDetectionName = (detection: Detection): string => {
    const names = {
      [Detection.ECG]: 'ECG',
      [Detection.OX]: 'Blood Oxygen',
      [Detection.BP]: 'Blood Pressure',
      [Detection.BT]: 'Temperature',
      [Detection.BATTERY]: 'Battery',
      [Detection.BG]: 'Blood Glucose'
    };
    return names[detection] || detection;
  };

  // Get detection icon
  const getDetectionIcon = (detection: Detection) => {
    const icons = {
      [Detection.ECG]: <Activity className="w-4 h-4" />,
      [Detection.OX]: <Heart className="w-4 h-4" />,
      [Detection.BP]: <Gauge className="w-4 h-4" />,
      [Detection.BT]: <Thermometer className="w-4 h-4" />,
      [Detection.BATTERY]: <Battery className="w-4 h-4" />,
      [Detection.BG]: <Droplets className="w-4 h-4" />
    };
    return icons[detection] || <Activity className="w-4 h-4" />;
  };

  // Get vital status color
  const getVitalStatusColor = (type: Detection, value: number | string): string => {
    if (typeof value === 'string') return 'text-blue-600';
    
    switch (type) {
      case Detection.ECG:
        return value >= 60 && value <= 100 ? 'text-green-600' : 'text-red-600';
      case Detection.OX:
        return value >= 95 ? 'text-green-600' : value >= 90 ? 'text-yellow-600' : 'text-red-600';
      case Detection.BT:
        return value >= 36.1 && value <= 37.2 ? 'text-green-600' : 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connectedDevice ? <Bluetooth className="w-5 h-5 text-blue-600" /> : <BluetoothOff className="w-5 h-5 text-gray-400" />}
            HC03 Device Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedDevice ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{connectedDevice.deviceName}</h3>
                  <p className="text-sm text-gray-600">Device ID: {connectedDevice.deviceId}</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connected
                </Badge>
              </div>
              
              <div className="flex items-center gap-4">
                {connectedDevice.batteryLevel <= 20 ? (
                  <BatteryLow className="w-5 h-5 text-red-500" />
                ) : (
                  <Battery className="w-5 h-5 text-green-600" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Battery</span>
                    <span>{connectedDevice.batteryLevel}%</span>
                  </div>
                  <Progress value={connectedDevice.batteryLevel} className="h-2" />
                </div>
                {connectedDevice.chargingStatus && (
                  <Zap className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <BluetoothOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No HC03 device connected</p>
              
              <div className="space-y-3">
                <Button onClick={connectToDevice} disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect Device'}
                </Button>
                {connectionError && (
                  <Alert className="text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-Time Connection Health */}
      {realTimeStatus.connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connectionHealth.isHealthy ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
              Connection Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Device</div>
                <div className="font-semibold">{realTimeStatus.deviceName}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Signal Strength</div>
                <div className="flex items-center justify-center gap-1">
                  <span className="font-semibold">{realTimeStatus.signalStrength}%</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`w-1 h-3 rounded-sm ${
                          bar <= (realTimeStatus.signalStrength / 25) ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Active Detections</div>
                <div className="font-semibold">{activeDetections.size}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Last Heartbeat</div>
                <div className="text-sm">
                  {connectionHealth.lastHeartbeat ? 
                    connectionHealth.lastHeartbeat.toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            </div>
            
            {connectionHealth.reconnectAttempts > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Connection unstable. Reconnection attempts: {connectionHealth.reconnectAttempts}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detection Controls */}
      {connectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle>Health Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[Detection.ECG, Detection.OX, Detection.BP, Detection.BT, Detection.BG].map((detection) => (
                <div key={detection} className="text-center">
                  <Button
                    variant={activeDetections.has(detection) ? "default" : "outline"}
                    onClick={() => activeDetections.has(detection) ? stopDetection(detection) : startDetection(detection)}
                    className="w-full mb-2"
                  >
                    {getDetectionIcon(detection)}
                    <span className="ml-2">{getDetectionName(detection)}</span>
                  </Button>
                  {activeDetections.has(detection) && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Readings */}
      {Object.keys(latestReadings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(latestReadings).map(([type, reading]) => (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getDetectionIcon(reading.type as Detection)}
                    <span className="font-medium">{getDetectionName(reading.type)}</span>
                  </div>
                  <div className={`text-2xl font-bold ${getVitalStatusColor(reading.type, reading.value as number)}`}>
                    {reading.value} {reading.unit}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {reading.timestamp.toLocaleTimeString()}
                  </div>
                  <Badge 
                    variant={reading.quality === 'good' ? 'default' : reading.quality === 'fair' ? 'secondary' : 'destructive'}
                    className="mt-2"
                  >
                    {reading.quality}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Readings History */}
      {vitalReadings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {vitalReadings.slice(0, 10).map((reading, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    {getDetectionIcon(reading.type)}
                    <div>
                      <span className="font-medium">{getDetectionName(reading.type)}</span>
                      <div className="text-sm text-gray-500">{reading.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getVitalStatusColor(reading.type, reading.value as number)}`}>
                      {reading.value} {reading.unit}
                    </div>
                    <Badge variant={reading.quality === 'good' ? 'default' : 'secondary'} className="text-xs">
                      {reading.quality}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {vitalReadings.some(r => r.quality === 'poor') && (
        <Alert>
          <AlertDescription>
            Some recent readings show poor signal quality. Please ensure proper device placement and contact.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}