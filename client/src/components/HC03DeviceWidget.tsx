import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/i18n';
import { 
  Bluetooth, 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  Battery,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { useHC03Bluetooth } from '@/hooks/useHC03Bluetooth';
import { DetectionType } from '@/services/BluetoothService';

interface HC03DeviceWidgetProps {
  patientId: string;
  onDataUpdate?: (data: any) => void;
}

export default function HC03DeviceWidget({ patientId, onDataUpdate }: HC03DeviceWidgetProps) {
  const { t, isRTL } = useLanguage();
  const {
    deviceStatus,
    activeDetections,
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
  const [selectedMeasurement, setSelectedMeasurement] = useState<DetectionType | null>(null);

  // Handle device scan
  const handleScan = useCallback(async () => {
    try {
      const devices = await scanForDevices();
      setAvailableDevices(devices);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  }, [scanForDevices]);

  // Handle connection
  const handleConnect = useCallback(async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
      setAvailableDevices([]);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  }, [connectToDevice]);

  // Start measurement
  const handleStartMeasurement = useCallback(async (type: DetectionType) => {
    try {
      await startMeasurement(type);
      setSelectedMeasurement(type);
      
      // Notify parent component
      if (onDataUpdate) {
        const reading = latestReadings.get(type);
        if (reading) {
          onDataUpdate({ type, data: reading });
        }
      }
    } catch (error) {
      console.error('Failed to start measurement:', error);
    }
  }, [startMeasurement, latestReadings, onDataUpdate]);

  // Stop measurement
  const handleStopMeasurement = useCallback(async (type: DetectionType) => {
    try {
      await stopMeasurement(type);
      if (selectedMeasurement === type) {
        setSelectedMeasurement(null);
      }
    } catch (error) {
      console.error('Failed to stop measurement:', error);
    }
  }, [stopMeasurement, selectedMeasurement]);

  // Get measurement icon
  const getMeasurementIcon = (type: DetectionType) => {
    switch (type) {
      case DetectionType.ECG:
        return <Heart className="w-5 h-5" />;
      case DetectionType.OX:
        return <Activity className="w-5 h-5" />;
      case DetectionType.BP:
        return <Gauge className="w-5 h-5" />;
      case DetectionType.BT:
        return <Thermometer className="w-5 h-5" />;
      case DetectionType.BG:
        return <Droplets className="w-5 h-5" />;
      case DetectionType.BATTERY:
        return <Battery className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  // Get measurement label
  const getMeasurementLabel = (type: DetectionType): string => {
    switch (type) {
      case DetectionType.ECG:
        return t?.('ecg') || 'ECG';
      case DetectionType.OX:
        return t?.('bloodOxygen') || 'Blood Oxygen';
      case DetectionType.BP:
        return t?.('bloodPressure') || 'Blood Pressure';
      case DetectionType.BT:
        return t?.('temperature') || 'Temperature';
      case DetectionType.BG:
        return t?.('bloodGlucose') || 'Blood Glucose';
      case DetectionType.BATTERY:
        return t?.('battery') || 'Battery';
      default:
        return type;
    }
  };

  // Get reading value
  const getReadingValue = (type: DetectionType): string => {
    const reading = latestReadings.get(type);
    if (!reading) return '--';

    switch (type) {
      case DetectionType.ECG:
        return `${reading.heartRate || '--'} BPM`;
      case DetectionType.OX:
        return `${reading.bloodOxygen || '--'}%`;
      case DetectionType.BP:
        return `${reading.systolic || '--'}/${reading.diastolic || '--'}`;
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
    <Card className="w-full" data-testid="hc03-device-widget">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className={`w-5 h-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
          {t?.('hc03Device') || 'HC03 Device'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {!isConnected ? (
          <div className="space-y-3">
            <Alert>
              <Bluetooth className="w-4 h-4" />
              <AlertDescription dir={isRTL ? 'rtl' : 'ltr'}>
                {t?.('connectToDevice') || 'Connect to your HC03 device to start monitoring vital signs'}
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full"
              data-testid="button-scan-hc03"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t?.('scanning') || 'Scanning...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t?.('scanDevices') || 'Scan for Devices'}
                </>
              )}
            </Button>

            {availableDevices.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t?.('availableDevices') || 'Available Devices'}:
                </p>
                {availableDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="font-medium">{device.name}</span>
                    <Button
                      onClick={() => handleConnect(device.id)}
                      disabled={isConnecting}
                      size="sm"
                      data-testid={`button-connect-hc03-${device.id}`}
                    >
                      {isConnecting ? t?.('connecting') || 'Connecting...' : t?.('connect') || 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Device Info */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    {deviceStatus.deviceName || 'HC03 Device'}
                  </p>
                  <p className="text-sm text-green-700">
                    {t?.('connected') || 'Connected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {deviceStatus.batteryLevel && (
                  <Badge variant="outline" className="gap-1">
                    <Battery className="w-3 h-3" />
                    {deviceStatus.batteryLevel}%
                  </Badge>
                )}
                <Button
                  onClick={disconnectDevice}
                  variant="outline"
                  size="sm"
                  data-testid="button-disconnect-hc03"
                >
                  {t?.('disconnect') || 'Disconnect'}
                </Button>
              </div>
            </div>

            {/* Measurement Controls */}
            <div className="grid grid-cols-2 gap-3">
              {[
                DetectionType.ECG,
                DetectionType.OX,
                DetectionType.BP,
                DetectionType.BT,
                DetectionType.BG
              ].map((type) => {
                const isActive = activeDetections.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => isActive ? handleStopMeasurement(type) : handleStartMeasurement(type)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    data-testid={`button-measure-${type.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getMeasurementIcon(type)}
                      <span className="text-sm font-medium">
                        {getMeasurementLabel(type)}
                      </span>
                    </div>
                    {isActive ? (
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {getReadingValue(type)}
                        </p>
                        <Badge variant="default" className="mt-1">
                          {t?.('active') || 'Active'}
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t?.('tapToStart') || 'Tap to start'}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
