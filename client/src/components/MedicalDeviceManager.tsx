import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  Bluetooth,
  BluetoothOff,
  Battery,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import {
  getUnktopSdk,
  DetectionType,
  type DeviceInfo,
  type TemperatureData,
  type BloodOxygenData,
  type EcgData,
  type BloodPressureResult,
  type BloodPressureProcess,
  type BloodGlucosePaperData,
  type BatteryLevelData,
} from '@/lib/unktop-sdk';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useDeviceData } from '@/contexts/DeviceDataContext';

interface MeasurementDisplay {
  type: DetectionType;
  value: string;
  unit: string;
  timestamp: Date;
  status: 'good' | 'warning' | 'critical';
}

interface MedicalDeviceManagerProps {
  patientId: string;
  allowedDevices?: DetectionType[];
}

const DEVICE_CONFIG = {
  [DetectionType.ECG]: {
    label: 'ECG Monitor',
    icon: Activity,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  [DetectionType.OX]: {
    label: 'Blood Oxygen (SpO2)',
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  [DetectionType.BP]: {
    label: 'Blood Pressure',
    icon: Gauge,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  [DetectionType.BG]: {
    label: 'Blood Glucose',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  [DetectionType.BT]: {
    label: 'Temperature',
    icon: Thermometer,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  [DetectionType.BATTERY]: {
    label: 'Battery',
    icon: Battery,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
  },
};

export default function MedicalDeviceManager({ 
  patientId, 
  allowedDevices = [
    DetectionType.OX,
    DetectionType.BP,
    DetectionType.BG,
    DetectionType.BT,
  ]
}: MedicalDeviceManagerProps) {
  const [sdk] = useState(() => getUnktopSdk());
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DetectionType>(allowedDevices[0]);
  const [activeMeasurements, setActiveMeasurements] = useState<Set<DetectionType>>(new Set());
  const [measurements, setMeasurements] = useState<Map<DetectionType, MeasurementDisplay>>(new Map());
  const [error, setError] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const { toast } = useToast();
  const { updateConnection, updateReading, clearReading } = useDeviceData();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sdk.disconnect();
    };
  }, [sdk]);

  // Monitor connection status
  useEffect(() => {
    const handleDisconnect = () => {
      setIsConnected(false);
      setDeviceInfo(null);
      setActiveMeasurements(new Set());
      
      // Clear connection state in context
      allowedDevices.forEach(type => {
        updateConnection(type, {
          deviceId: null,
          deviceName: null,
          connected: false,
          detectionType: null,
        });
        clearReading(type);
      });
      
      toast({
        title: "Device Disconnected",
        description: "The medical device has been disconnected.",
        variant: "destructive",
      });
    };

    sdk.on('disconnected', handleDisconnect);

    return () => {
      sdk.off('disconnected', handleDisconnect);
    };
  }, [sdk, toast, allowedDevices, updateConnection, clearReading]);

  // Connect to device
  const connectDevice = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const result = await sdk.connectDevice({
        deviceType: selectedDeviceType,
      });

      if (!result.ok) {
        setError(result.error || 'Failed to connect');
        toast({
          title: "Connection Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const info = sdk.getDeviceInfo();
      setDeviceInfo(info);
      setIsConnected(true);

      // Update context with connection state
      updateConnection(selectedDeviceType, {
        deviceId: info?.deviceId || null,
        deviceName: info?.deviceName || null,
        connected: true,
        detectionType: selectedDeviceType,
      });

      // Register device with backend
      if (info) {
        try {
          await apiRequest('/api/hc03/devices', 'POST', {
            deviceId: info.deviceId,
            deviceName: info.deviceName,
            deviceType: selectedDeviceType,
            supportedMeasurements: allowedDevices,
            patientId,
            connectionStatus: 'connected',
          });
        } catch (apiError) {
          console.error('Failed to register device:', apiError);
        }
      }

      // Query battery level
      queryBattery();

      toast({
        title: "Device Connected",
        description: `Connected to ${info?.deviceName || 'medical device'}`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to device');
      toast({
        title: "Connection Error",
        description: err.message || 'Failed to connect to device',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect device
  const disconnectDevice = async () => {
    try {
      // Stop all active measurements
      for (const detectionType of Array.from(activeMeasurements)) {
        await sdk.stopDetect(detectionType);
      }

      await sdk.disconnect();
      setIsConnected(false);
      setDeviceInfo(null);
      setActiveMeasurements(new Set());
      setMeasurements(new Map());
      setBatteryLevel(null);

      toast({
        title: "Device Disconnected",
        description: "Successfully disconnected from device",
      });
    } catch (err: any) {
      toast({
        title: "Disconnection Error",
        description: err.message || 'Failed to disconnect',
        variant: "destructive",
      });
    }
  };

  // Query battery level
  const queryBattery = async () => {
    try {
      const batteryPromise = await sdk.startDetect(DetectionType.BATTERY) as any;
      if (batteryPromise.then) {
        batteryPromise.then((data: BatteryLevelData) => {
          setBatteryLevel(data.batteryLevel);
        });
      }
    } catch (err) {
      console.error('Failed to query battery:', err);
    }
  };

  // Start measurement
  const startMeasurement = async (detectionType: DetectionType) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect a device first",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await sdk.startDetect(detectionType);
      
      // Setup listeners based on detection type
      if (detectionType === DetectionType.ECG) {
        stream.data.listen((data: EcgData) => {
          handleEcgData(data);
        });
      } else if (detectionType === DetectionType.OX) {
        stream.dataSubscription.listen((data: BloodOxygenData) => {
          handleBloodOxygenData(data);
        });
      } else if (detectionType === DetectionType.BP) {
        stream.listen((data: BloodPressureResult | BloodPressureProcess) => {
          handleBloodPressureData(data);
        });
      } else if (detectionType === DetectionType.BG) {
        stream.listen((data: BloodGlucosePaperData) => {
          handleGlucoseData(data);
        });
      } else if (detectionType === DetectionType.BT) {
        stream.then((data: TemperatureData) => {
          handleTemperatureData(data);
        });
      }

      setActiveMeasurements(prev => new Set([...Array.from(prev), detectionType]));
      
      toast({
        title: "Measurement Started",
        description: `Started ${DEVICE_CONFIG[detectionType].label} measurement`,
      });
    } catch (err: any) {
      toast({
        title: "Measurement Error",
        description: err.message || 'Failed to start measurement',
        variant: "destructive",
      });
    }
  };

  // Stop measurement
  const stopMeasurement = async (detectionType: DetectionType) => {
    try {
      await sdk.stopDetect(detectionType);
      setActiveMeasurements(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(detectionType);
        return newSet;
      });

      toast({
        title: "Measurement Stopped",
        description: `Stopped ${DEVICE_CONFIG[detectionType].label} measurement`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to stop measurement',
        variant: "destructive",
      });
    }
  };

  // Data handlers
  const handleEcgData = async (data: EcgData) => {
    if (data.type === 'HR' && data.heartRate) {
      const measurement: MeasurementDisplay = {
        type: DetectionType.ECG,
        value: data.heartRate.toString(),
        unit: 'BPM',
        timestamp: new Date(),
        status: data.heartRate > 100 || data.heartRate < 60 ? 'warning' : 'good',
      };
      setMeasurements(prev => new Map(prev).set(DetectionType.ECG, measurement));

      // Save to backend
      try {
        await apiRequest('/api/ecg/data', 'POST', {
          patientId,
          deviceId: deviceInfo?.deviceId || 'unknown',
          heartRate: data.heartRate,
          moodIndex: data.moodIndex,
          rrInterval: data.rrInterval,
          hrv: data.hrv,
          respiratoryRate: data.respiratoryRate,
          fingerDetected: data.fingerDetected,
        });
        
        // Update context with live reading
        updateReading(DetectionType.ECG, {
          heartRate: data.heartRate,
          moodIndex: data.moodIndex,
          rrInterval: data.rrInterval,
          hrv: data.hrv,
          respiratoryRate: data.respiratoryRate,
          fingerDetected: data.fingerDetected,
          wave: data.wave,
        });
      } catch (err) {
        console.error('Failed to save ECG data:', err);
      }
    }
  };

  const handleBloodOxygenData = async (data: BloodOxygenData) => {
    const measurement: MeasurementDisplay = {
      type: DetectionType.OX,
      value: `${data.bloodOxygen}% / ${data.heartRate} BPM`,
      unit: '',
      timestamp: new Date(),
      status: data.bloodOxygen < 95 ? 'warning' : 'good',
    };
    setMeasurements(prev => new Map(prev).set(DetectionType.OX, measurement));

    // Save to backend
    try {
      await apiRequest('/api/blood-oxygen/data', 'POST', {
        patientId,
        deviceId: deviceInfo?.deviceId || 'unknown',
        bloodOxygen: data.bloodOxygen,
        heartRate: data.heartRate,
        fingerDetected: data.fingerDetection,
      });
      
      // Update context with live reading
      updateReading(DetectionType.OX, {
        bloodOxygen: data.bloodOxygen,
        heartRate: data.heartRate,
        fingerDetected: data.fingerDetection,
        wave: data.waveData,
      });
    } catch (err) {
      console.error('Failed to save blood oxygen data:', err);
    }
  };

  const handleBloodPressureData = async (data: BloodPressureResult | BloodPressureProcess) => {
    if ('systolic' in data) {
      const measurement: MeasurementDisplay = {
        type: DetectionType.BP,
        value: `${data.systolic}/${data.diastolic}`,
        unit: 'mmHg',
        timestamp: new Date(),
        status: data.systolic > 140 || data.diastolic > 90 ? 'warning' : 'good',
      };
      setMeasurements(prev => new Map(prev).set(DetectionType.BP, measurement));

      // Save to backend
      try {
        await apiRequest('/api/blood-pressure/data', 'POST', {
          patientId,
          deviceId: deviceInfo?.deviceId || 'unknown',
          systolic: data.systolic,
          diastolic: data.diastolic,
          heartRate: data.heartRate,
        });
        
        // Update context with live reading
        updateReading(DetectionType.BP, {
          systolic: data.systolic,
          diastolic: data.diastolic,
          heartRate: data.heartRate,
        });
      } catch (err) {
        console.error('Failed to save blood pressure data:', err);
      }
    }
  };

  const handleGlucoseData = async (data: BloodGlucosePaperData) => {
    if ('data' in data) {
      const measurement: MeasurementDisplay = {
        type: DetectionType.BG,
        value: data.data.toString(),
        unit: data.unit,
        timestamp: new Date(),
        status: data.data > 140 || data.data < 70 ? 'warning' : 'good',
      };
      setMeasurements(prev => new Map(prev).set(DetectionType.BG, measurement));

      // Save to backend
      try {
        await apiRequest('/api/blood-glucose/data', 'POST', {
          patientId,
          deviceId: deviceInfo?.deviceId || 'unknown',
          glucoseLevel: data.data,
          measurementType: 'capillary',
        });
        
        // Update context with live reading
        updateReading(DetectionType.BG, {
          glucoseLevel: data.data,
          measurementType: 'capillary',
        });
      } catch (err) {
        console.error('Failed to save glucose data:', err);
      }
    }
  };

  const handleTemperatureData = async (data: TemperatureData) => {
    const measurement: MeasurementDisplay = {
      type: DetectionType.BT,
      value: data.temperature.toFixed(1),
      unit: data.unit === 'celsius' ? '°C' : '°F',
      timestamp: new Date(),
      status: data.temperature > 38 || data.temperature < 36 ? 'warning' : 'good',
    };
    setMeasurements(prev => new Map(prev).set(DetectionType.BT, measurement));

    // Save to backend
    try {
      await apiRequest('/api/temperature/data', 'POST', {
        patientId,
        deviceId: deviceInfo?.deviceId || 'unknown',
        temperature: data.temperature,
        measurementSite: data.measurementSite || 'oral',
      });
      
      // Update context with live reading
      updateReading(DetectionType.BT, {
        temperature: data.temperature,
        measurementSite: data.measurementSite || 'oral',
        unit: data.unit === 'celsius' ? 'C' : 'F',
      });
    } catch (err) {
      console.error('Failed to save temperature data:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Bluetooth className="h-5 w-5 text-blue-600" />
            ) : (
              <BluetoothOff className="h-5 w-5 text-gray-400" />
            )}
            Medical Device Manager
          </CardTitle>
          {batteryLevel !== null && (
            <Badge variant="outline" className="gap-1">
              <Battery className="h-3 w-3" />
              {batteryLevel}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Section */}
        {!isConnected ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Device Type</label>
              <Select
                value={selectedDeviceType}
                onValueChange={(value) => setSelectedDeviceType(value as DetectionType)}
                disabled={isConnecting}
              >
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedDevices.map((deviceType) => {
                    const config = DEVICE_CONFIG[deviceType];
                    const Icon = config.icon;
                    return (
                      <SelectItem key={deviceType} value={deviceType}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={connectDevice}
              disabled={isConnecting}
              className="w-full"
              data-testid="button-connect-device"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Connect Device
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Device Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">{deviceInfo?.deviceName}</p>
                  <p className="text-xs text-muted-foreground">Device ID: {deviceInfo?.deviceId}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectDevice}
                data-testid="button-disconnect-device"
              >
                Disconnect
              </Button>
            </div>

            {/* Measurement Controls */}
            <Tabs defaultValue={allowedDevices[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${allowedDevices.length}, 1fr)` }}>
                {allowedDevices.map((deviceType) => {
                  const config = DEVICE_CONFIG[deviceType];
                  const Icon = config.icon;
                  return (
                    <TabsTrigger key={deviceType} value={deviceType} data-testid={`tab-${deviceType}`}>
                      <Icon className="h-4 w-4" />
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {allowedDevices.map((deviceType) => {
                const config = DEVICE_CONFIG[deviceType];
                const Icon = config.icon;
                const isActive = activeMeasurements.has(deviceType);
                const measurement = measurements.get(deviceType);

                return (
                  <TabsContent key={deviceType} value={deviceType} className="space-y-4">
                    <Card className={config.borderColor}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          {config.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {measurement && (
                          <div className={`p-4 rounded-lg ${config.bgColor}`}>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold">{measurement.value}</span>
                              {measurement.unit && (
                                <span className="text-sm text-muted-foreground">{measurement.unit}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {measurement.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        )}

                        <Button
                          onClick={() => isActive ? stopMeasurement(deviceType) : startMeasurement(deviceType)}
                          variant={isActive ? "destructive" : "default"}
                          className="w-full"
                          data-testid={`button-${isActive ? 'stop' : 'start'}-${deviceType}`}
                        >
                          {isActive ? (
                            <>
                              <Activity className="h-4 w-4 mr-2 animate-pulse" />
                              Stop Measurement
                            </>
                          ) : (
                            <>
                              <Activity className="h-4 w-4 mr-2" />
                              Start Measurement
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
