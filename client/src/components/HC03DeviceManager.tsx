import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  RefreshCw
} from 'lucide-react';
import { useHC03Bluetooth } from '@/hooks/useHC03Bluetooth';
import { DetectionType } from '@/services/BluetoothService';

export default function HC03DeviceManager({ patientId }: { patientId: string }) {
  const {
    deviceStatus,
    activeDetections,
    recentReadings,
    latestReadings,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    startMeasurement,
    stopMeasurement,
    isScanning,
    isConnecting,
    isConnected
  } = useHC03Bluetooth(patientId);

  const [availableDevices, setAvailableDevices] = useState<any[]>([]);

  // Handle device scan
  const handleScanDevices = useCallback(async () => {
    try {
      const devices = await scanForDevices();
      setAvailableDevices(devices);
    } catch (error) {
      console.error('Failed to scan for devices:', error);
    }
  }, [scanForDevices]);

  // Handle device connection
  const handleConnect = useCallback(async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
    } catch (error) {
      console.error('Failed to connect to device:', error);
    }
  }, [connectToDevice]);

  // Handle device disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectDevice();
      setAvailableDevices([]);
    } catch (error) {
      console.error('Failed to disconnect from device:', error);
    }
  }, [disconnectDevice]);

  // Toggle measurement
  const toggleMeasurement = useCallback(async (type: DetectionType) => {
    try {
      if (activeDetections.has(type)) {
        await stopMeasurement(type);
      } else {
        await startMeasurement(type);
      }
    } catch (error) {
      console.error(`Failed to toggle ${type} measurement:`, error);
    }
  }, [activeDetections, startMeasurement, stopMeasurement]);

  // Get detection name
  const getDetectionName = (type: DetectionType): string => {
    switch (type) {
      case DetectionType.ECG: return 'ECG / Heart Rate';
      case DetectionType.OX: return 'Blood Oxygen';
      case DetectionType.BP: return 'Blood Pressure';
      case DetectionType.BT: return 'Temperature';
      case DetectionType.BG: return 'Blood Glucose';
      case DetectionType.BATTERY: return 'Battery Status';
      default: return type;
    }
  };

  // Get detection icon
  const getDetectionIcon = (type: DetectionType) => {
    switch (type) {
      case DetectionType.ECG: return <Heart className="w-5 h-5" />;
      case DetectionType.OX: return <Activity className="w-5 h-5" />;
      case DetectionType.BP: return <Gauge className="w-5 h-5" />;
      case DetectionType.BT: return <Thermometer className="w-5 h-5" />;
      case DetectionType.BG: return <Droplets className="w-5 h-5" />;
      case DetectionType.BATTERY: return <Battery className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  // Get latest reading value
  const getLatestReadingValue = (type: DetectionType): string => {
    const reading = latestReadings.get(type);
    if (!reading) return '--';

    switch (type) {
      case DetectionType.ECG:
        return `${reading.heartRate || '--'} BPM`;
      case DetectionType.OX:
        return `${reading.bloodOxygen || '--'}% SpO2`;
      case DetectionType.BP:
        return `${reading.systolic || '--'}/${reading.diastolic || '--'} mmHg`;
      case DetectionType.BT:
        return `${reading.temperature || '--'}°C`;
      case DetectionType.BG:
        return `${reading.glucoseLevel || '--'} mg/dL`;
      case DetectionType.BATTERY:
        return `${reading.batteryLevel || '--'}%`;
      default:
        return '--';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Bluetooth className="w-5 h-5 text-blue-500" />
            ) : (
              <BluetoothOff className="w-5 h-5 text-gray-400" />
            )}
            HC03 Device Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-3">
              <Alert>
                <AlertDescription>
                  Click "Scan for Devices" to discover nearby HC03 medical devices via Bluetooth.
                  Make sure your device is powered on and in pairing mode.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleScanDevices}
                  disabled={isScanning}
                  data-testid="button-scan-devices"
                  className="flex-1"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-4 h-4 mr-2" />
                      Scan for Devices
                    </>
                  )}
                </Button>
              </div>

              {availableDevices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Available Devices:</p>
                  {availableDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-gray-500">ID: {device.id}</p>
                      </div>
                      <Button
                        onClick={() => handleConnect(device.id)}
                        disabled={isConnecting}
                        size="sm"
                        data-testid={`button-connect-${device.id}`}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">{deviceStatus.deviceName || 'HC03 Device'}</p>
                  <p className="text-sm text-green-700">Connected</p>
                  {deviceStatus.batteryLevel && (
                    <div className="flex items-center gap-2 mt-1">
                      <Battery className="w-4 h-4" />
                      <span className="text-sm">{deviceStatus.batteryLevel}%</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  data-testid="button-disconnect"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Measurements Card */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Vital Signs Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                DetectionType.ECG,
                DetectionType.OX,
                DetectionType.BP,
                DetectionType.BT,
                DetectionType.BG
              ].map((type) => {
                const isActive = activeDetections.has(type);
                return (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg transition-all ${
                      isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getDetectionIcon(type)}
                        <span className="font-medium">{getDetectionName(type)}</span>
                      </div>
                      <Badge variant={isActive ? 'default' : 'outline'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {isActive && (
                      <div className="mb-3">
                        <p className="text-2xl font-bold text-blue-600">
                          {getLatestReadingValue(type)}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => toggleMeasurement(type)}
                      size="sm"
                      variant={isActive ? 'destructive' : 'default'}
                      className="w-full"
                      data-testid={`button-${isActive ? 'stop' : 'start'}-${type.toLowerCase()}`}
                    >
                      {isActive ? `Stop ${getDetectionName(type)}` : `Start ${getDetectionName(type)}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Readings */}
      {recentReadings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentReadings.slice(0, 10).map((reading, index) => (
                <div
                  key={`${reading.type}-${reading.timestamp}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDetectionIcon(reading.type)}
                    <div>
                      <p className="font-medium">{getDetectionName(reading.type)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(reading.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {getLatestReadingValue(reading.type)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
