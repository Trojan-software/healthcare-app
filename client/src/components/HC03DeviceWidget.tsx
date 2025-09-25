import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Bluetooth, 
  BluetoothConnected,
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  Battery,
  Waves,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  RefreshCw
} from 'lucide-react';
import { BluetoothService, DetectionType } from '@/services/BluetoothService';

interface HC03DeviceData {
  deviceId: string;
  deviceName: string;
  connectionStatus: 'connected' | 'disconnected' | 'scanning';
  batteryLevel: number;
  chargingStatus: boolean;
  lastConnected: string;
}

interface MeasurementData {
  type: 'ecg' | 'bloodOxygen' | 'bloodPressure' | 'bloodGlucose' | 'temperature';
  value: any;
  timestamp: string;
  deviceId: string;
}

interface HC03DeviceWidgetProps {
  patientId: string;
  onDataUpdate?: (data: MeasurementData) => void;
}

export default function HC03DeviceWidget({ patientId, onDataUpdate }: HC03DeviceWidgetProps) {
  const [devices, setDevices] = useState<HC03DeviceData[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<HC03DeviceData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'scanning' | 'connecting' | 'connected' | 'error'>('idle');
  const [isConnecting, setIsConnecting] = useState(false);
  const [realtimeData, setRealtimeData] = useState<MeasurementData[]>([]);
  const [measurementInProgress, setMeasurementInProgress] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  
  const bluetoothService = useRef<BluetoothService | null>(null);
  const wsConnection = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDevices();
    initializeWebSocket();
    initializeBluetoothService();
    
    return () => {
      cleanup();
    };
  }, [patientId]);

  const initializeBluetoothService = () => {
    bluetoothService.current = new BluetoothService();
    
    // Set up event listeners
    bluetoothService.current.on('connected', (deviceInfo: any) => {
      setConnectionStatus('connected');
      setSelectedDevice(prev => prev ? { ...prev, connectionStatus: 'connected' } : null);
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${deviceInfo.name}`,
      });
    });

    bluetoothService.current.on('disconnected', () => {
      setConnectionStatus('idle');
      setSelectedDevice(prev => prev ? { ...prev, connectionStatus: 'disconnected' } : null);
      toast({
        title: "Device Disconnected",
        description: "HC03 device has been disconnected",
        variant: "destructive"
      });
    });

    bluetoothService.current.on('dataReceived', (data: any) => {
      const measurementData: MeasurementData = {
        type: data.type,
        value: data.value,
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      setRealtimeData(prev => [measurementData, ...prev.slice(0, 9)]);
      
      if (onDataUpdate) {
        onDataUpdate(measurementData);
      }
      
      // Send data via WebSocket for real-time updates
      if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
        wsConnection.current.send(JSON.stringify({
          type: 'hc03_data',
          measurementType: data.type,
          deviceId: selectedDevice?.deviceId,
          patientId,
          data: data.value,
          timestamp: measurementData.timestamp
        }));
      }
    });

    bluetoothService.current.on('measurementStarted', (type: string) => {
      setMeasurementInProgress(type);
      toast({
        title: "Measurement Started",
        description: `${type.toUpperCase()} measurement in progress...`,
      });
    });

    bluetoothService.current.on('measurementCompleted', (type: string) => {
      setMeasurementInProgress(null);
      toast({
        title: "Measurement Complete",
        description: `${type.toUpperCase()} measurement completed successfully`,
      });
    });

    bluetoothService.current.on('error', (error: any) => {
      setError(error.message);
      setConnectionStatus('error');
      toast({
        title: "Device Error",
        description: error.message,
        variant: "destructive"
      });
    });
  };

  const initializeWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/hc03`;
      wsConnection.current = new WebSocket(wsUrl);

      wsConnection.current.onopen = () => {
        // Authenticate
        wsConnection.current?.send(JSON.stringify({
          type: 'auth',
          token
        }));
      };

      wsConnection.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'auth_success':
              // Subscribe to patient data
              wsConnection.current?.send(JSON.stringify({
                type: 'subscribe',
                patientId
              }));
              break;
              
            case 'device_status_update':
              setDevices(prev => prev.map(device => 
                device.deviceId === message.deviceId 
                  ? { ...device, connectionStatus: message.status }
                  : device
              ));
              break;
              
            case 'hc03_data_update':
              // Handle real-time data updates from other sources
              const newData: MeasurementData = {
                type: message.measurementType,
                value: message.data,
                timestamp: message.timestamp,
                deviceId: message.deviceId
              };
              setRealtimeData(prev => [newData, ...prev.slice(0, 9)]);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsConnection.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await fetch(`/api/hc03/devices/patient/${patientId}`);
      if (response.ok) {
        const deviceList = await response.json();
        setDevices(deviceList);
        
        // Auto-select the first connected device
        const connectedDevice = deviceList.find((d: HC03DeviceData) => d.connectionStatus === 'connected');
        if (connectedDevice) {
          setSelectedDevice(connectedDevice);
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const scanForDevices = async () => {
    if (!bluetoothService.current) return;
    
    setIsConnecting(true);
    setConnectionStatus('scanning');
    setError('');
    
    try {
      // First scan for devices
      const deviceList = await bluetoothService.current.startScan();
      
      if (deviceList && deviceList.length > 0) {
        const deviceInfo = deviceList[0]; // Use first found device
        
        // Register device with backend
        const response = await fetch('/api/hc03/devices/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: deviceInfo.id,
            deviceName: deviceInfo.name,
            macAddress: deviceInfo.macAddress || '',
            firmwareVersion: deviceInfo.firmwareVersion || '1.0.0',
            patientId
          })
        });
        
        if (response.ok) {
          // Now connect to the device
          await bluetoothService.current.connect(deviceInfo.id, patientId);
          await loadDevices();
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
      setError(error instanceof Error ? error.message : 'Failed to scan for devices');
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToDevice = async (device: HC03DeviceData) => {
    if (!bluetoothService.current) return;
    
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      await bluetoothService.current.connect(device.deviceId, patientId);
      setSelectedDevice(device);
      
      // Update device status
      await fetch(`/api/hc03/devices/${device.deviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'connected' })
      });
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error connecting to device:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to device');
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = async () => {
    if (!bluetoothService.current || !selectedDevice) return;
    
    try {
      await bluetoothService.current.disconnect();
      
      // Update device status
      await fetch(`/api/hc03/devices/${selectedDevice.deviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'disconnected' })
      });
      
      setConnectionStatus('idle');
      setSelectedDevice(null);
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  };

  const startMeasurement = async (type: 'ecg' | 'bloodOxygen' | 'bloodPressure' | 'bloodGlucose' | 'temperature') => {
    if (!bluetoothService.current || connectionStatus !== 'connected') {
      toast({
        title: "Device Not Connected",
        description: "Please connect to your HC03 device first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let detectionType: DetectionType;
      
      switch (type) {
        case 'ecg':
          detectionType = DetectionType.ECG;
          break;
        case 'bloodOxygen':
          detectionType = DetectionType.OX;
          break;
        case 'bloodPressure':
          detectionType = DetectionType.BP;
          break;
        case 'bloodGlucose':
          detectionType = DetectionType.BG;
          break;
        case 'temperature':
          detectionType = DetectionType.BT;
          break;
        default:
          throw new Error(`Unsupported measurement type: ${type}`);
      }
      
      await bluetoothService.current.startMeasurement(detectionType);
    } catch (error) {
      console.error(`Error starting ${type} measurement:`, error);
      toast({
        title: "Measurement Error",
        description: `Failed to start ${type} measurement`,
        variant: "destructive"
      });
    }
  };

  const queryBattery = async () => {
    if (!bluetoothService.current || connectionStatus !== 'connected') return;
    
    try {
      await bluetoothService.current.queryBattery();
    } catch (error) {
      console.error('Error querying battery:', error);
    }
  };

  const cleanup = () => {
    if (bluetoothService.current) {
      bluetoothService.current.disconnect();
    }
    if (wsConnection.current) {
      wsConnection.current.close();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'scanning': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'scanning': return 'Scanning...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            HC03 Device
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(connectionStatus)} text-white`}
            >
              {getStatusText(connectionStatus)}
            </Badge>
            {selectedDevice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeviceDetails(true)}
                data-testid="button-device-details"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Section */}
        {!selectedDevice ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No HC03 device connected. Scan for available devices.
            </p>
            <Button 
              onClick={scanForDevices}
              disabled={isConnecting}
              className="w-full"
              data-testid="button-scan-devices"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Scan for Devices
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Device Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <BluetoothConnected className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium" data-testid="text-device-name">
                    {selectedDevice.deviceName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevice.deviceId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                <span className="text-sm" data-testid="text-battery-level">
                  {selectedDevice.batteryLevel}%
                </span>
              </div>
            </div>

            {/* Measurement Controls */}
            <Tabs defaultValue="measurements" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="measurements" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement('ecg')}
                    disabled={measurementInProgress === 'ecg'}
                    data-testid="button-ecg-measurement"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {measurementInProgress === 'ecg' ? 'Recording...' : 'ECG'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement('bloodOxygen')}
                    disabled={measurementInProgress === 'bloodOxygen'}
                    data-testid="button-oxygen-measurement"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    {measurementInProgress === 'bloodOxygen' ? 'Measuring...' : 'Blood O₂'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement('bloodPressure')}
                    disabled={measurementInProgress === 'bloodPressure'}
                    data-testid="button-pressure-measurement"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {measurementInProgress === 'bloodPressure' ? 'Measuring...' : 'Blood Pressure'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement('temperature')}
                    disabled={measurementInProgress === 'temperature'}
                    data-testid="button-temp-measurement"
                  >
                    <Thermometer className="h-4 w-4 mr-2" />
                    {measurementInProgress === 'temperature' ? 'Measuring...' : 'Temperature'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement('bloodGlucose')}
                    disabled={measurementInProgress === 'bloodGlucose'}
                    className="col-span-2"
                    data-testid="button-glucose-measurement"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    {measurementInProgress === 'bloodGlucose' ? 'Measuring...' : 'Blood Glucose'}
                  </Button>
                </div>

                {measurementInProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {measurementInProgress.toUpperCase()} measurement in progress...
                      </span>
                    </div>
                    <Progress value={50} className="w-full" />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="realtime" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Recent Measurements</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={queryBattery}
                    data-testid="button-refresh-data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                {realtimeData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent measurements available
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {realtimeData.map((data, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                        data-testid={`measurement-${data.type}-${index}`}
                      >
                        <div className="flex items-center gap-2">
                          {data.type === 'ecg' && <Heart className="h-4 w-4" />}
                          {data.type === 'bloodOxygen' && <Droplets className="h-4 w-4" />}
                          {data.type === 'bloodPressure' && <Activity className="h-4 w-4" />}
                          {data.type === 'temperature' && <Thermometer className="h-4 w-4" />}
                          {data.type === 'bloodGlucose' && <Droplets className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {data.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {typeof data.value === 'object' ? 
                              JSON.stringify(data.value) : 
                              data.value.toString()
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(data.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Disconnect Button */}
            <Button
              variant="destructive"
              onClick={disconnectDevice}
              className="w-full"
              data-testid="button-disconnect"
            >
              Disconnect Device
            </Button>
          </div>
        )}

        {/* Available Devices */}
        {devices.length > 0 && !selectedDevice && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Available Devices</h4>
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <p className="font-medium text-sm">{device.deviceName}</p>
                  <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => connectToDevice(device)}
                  disabled={isConnecting}
                  data-testid={`button-connect-${device.deviceId}`}
                >
                  Connect
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Device Details Dialog */}
      <Dialog open={showDeviceDetails} onOpenChange={setShowDeviceDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Device Name</label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.deviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Device ID</label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.deviceId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Battery Level</label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.batteryLevel}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Charging</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevice.chargingStatus ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Last Connected</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedDevice.lastConnected).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}