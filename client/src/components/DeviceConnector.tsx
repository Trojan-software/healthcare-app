/**
 * Device Connector Component
 * Provides UI for connecting to Linktop Health Monitor devices
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bluetooth, 
  BluetoothConnected,
  BluetoothOff,
  Battery,
  BatteryCharging,
  BatteryFull,
  RefreshCw,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Loader2
} from 'lucide-react';
import { useDevice } from '@/contexts/DeviceContext';
import { BatteryState } from '@/lib/linktop-sdk';
import { useLanguage } from '@/lib/i18n';

interface DeviceConnectorProps {
  compact?: boolean;
  showMeasurementControls?: boolean;
  onVitalsUpdate?: (vitals: { 
    heartRate?: number; 
    bloodPressure?: { systolic: number; diastolic: number };
    oxygenLevel?: number;
    temperature?: number;
    bloodGlucose?: number;
  }) => void;
}

export default function DeviceConnector({ 
  compact = false, 
  showMeasurementControls = true,
  onVitalsUpdate 
}: DeviceConnectorProps) {
  const { t, isRTL } = useLanguage();
  const {
    deviceState,
    vitalSigns,
    measurementState,
    isBluetoothSupported,
    scanAndConnect,
    disconnect,
    startMeasurement,
    stopMeasurement,
    refreshBattery,
  } = useDevice();

  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleConnect = async () => {
    setActiveAction('connect');
    await scanAndConnect();
    setActiveAction(null);
  };

  const handleDisconnect = async () => {
    setActiveAction('disconnect');
    await disconnect();
    setActiveAction(null);
  };

  const handleMeasurement = async (type: 'ecg' | 'spo2' | 'bloodPressure' | 'temperature' | 'bloodGlucose') => {
    const isActive = measurementState[type]?.active;
    
    if (isActive) {
      await stopMeasurement(type);
    } else {
      setActiveAction(type);
      await startMeasurement(type);
      setActiveAction(null);
    }

    if (onVitalsUpdate && vitalSigns) {
      onVitalsUpdate({
        heartRate: vitalSigns.heartRate || undefined,
        bloodPressure: vitalSigns.bloodPressure || undefined,
        oxygenLevel: vitalSigns.oxygenLevel || undefined,
        temperature: vitalSigns.temperature || undefined,
        bloodGlucose: vitalSigns.bloodGlucose || undefined,
      });
    }
  };

  const getBatteryIcon = () => {
    if (!measurementState.battery) return <Battery className="w-4 h-4" />;
    
    switch (measurementState.battery.state) {
      case BatteryState.CHARGING:
        return <BatteryCharging className="w-4 h-4 text-yellow-500" />;
      case BatteryState.CHARGE_FULL:
        return <BatteryFull className="w-4 h-4 text-green-500" />;
      default:
        return <Battery className="w-4 h-4" />;
    }
  };

  const getBatteryColor = () => {
    if (!measurementState.battery) return 'bg-gray-200';
    const level = measurementState.battery.level;
    if (level >= 60) return 'bg-green-500';
    if (level >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isBluetoothSupported()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <BluetoothOff className="w-6 h-6 text-red-500" />
            <div className={isRTL ? 'text-right' : ''}>
              <p className="font-medium text-red-700">
                {isRTL ? 'البلوتوث غير مدعوم' : 'Bluetooth Not Supported'}
              </p>
              <p className="text-sm text-red-600">
                {isRTL ? 'يرجى استخدام متصفح يدعم Web Bluetooth' : 'Please use a browser that supports Web Bluetooth'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {deviceState.isConnected ? (
          <>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <BluetoothConnected className="w-3 h-3 mr-1" />
              {deviceState.deviceInfo?.name || 'Connected'}
            </Badge>
            {measurementState.battery && (
              <Badge variant="outline" className="gap-1">
                {getBatteryIcon()}
                {measurementState.battery.level}%
              </Badge>
            )}
            <Button size="sm" variant="ghost" onClick={handleDisconnect}>
              {isRTL ? 'قطع الاتصال' : 'Disconnect'}
            </Button>
          </>
        ) : (
          <Button 
            size="sm" 
            onClick={handleConnect}
            disabled={deviceState.isConnecting}
          >
            {deviceState.isConnecting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bluetooth className="w-4 h-4 mr-2" />
            )}
            {isRTL ? 'ربط الجهاز' : 'Connect Device'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {deviceState.isConnected ? (
              <BluetoothConnected className="w-5 h-5 text-green-500" />
            ) : (
              <Bluetooth className="w-5 h-5 text-gray-400" />
            )}
            <span>{isRTL ? 'جهاز مراقبة الصحة' : 'Health Monitor Device'}</span>
          </div>
          {deviceState.isConnected && measurementState.battery && (
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {getBatteryIcon()}
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getBatteryColor()} transition-all`}
                  style={{ width: `${measurementState.battery.level}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{measurementState.battery.level}%</span>
              <Button size="icon" variant="ghost" onClick={refreshBattery}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!deviceState.isConnected ? (
          <div className="text-center py-4">
            <Bluetooth className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">
              {isRTL ? 'لم يتم توصيل أي جهاز' : 'No device connected'}
            </p>
            <Button 
              onClick={handleConnect}
              disabled={deviceState.isConnecting}
              className="gap-2"
              data-testid="button-connect-device"
            >
              {deviceState.isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRTL ? 'جاري الاتصال...' : 'Connecting...'}
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4" />
                  {isRTL ? 'البحث عن الأجهزة' : 'Scan for Devices'}
                </>
              )}
            </Button>
            {deviceState.error && (
              <p className="text-red-500 text-sm mt-2">{deviceState.error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-3 bg-green-50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <BluetoothConnected className="w-6 h-6 text-green-600" />
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="font-medium text-green-800">
                    {deviceState.deviceInfo?.name || 'Health Monitor'}
                  </p>
                  {deviceState.deviceInfo?.firmwareVersion && (
                    <p className="text-xs text-green-600">
                      FW: {deviceState.deviceInfo.firmwareVersion}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
                disabled={activeAction === 'disconnect'}
                data-testid="button-disconnect-device"
              >
                {isRTL ? 'قطع الاتصال' : 'Disconnect'}
              </Button>
            </div>

            {showMeasurementControls && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant={measurementState.spo2.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('spo2')}
                  disabled={activeAction === 'spo2'}
                  data-testid="button-measure-spo2"
                >
                  {activeAction === 'spo2' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Droplets className="w-4 h-4" />
                  )}
                  {measurementState.spo2.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'أكسجين الدم' : 'SpO2')}
                </Button>

                <Button
                  variant={measurementState.ecg.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('ecg')}
                  disabled={activeAction === 'ecg'}
                  data-testid="button-measure-ecg"
                >
                  {activeAction === 'ecg' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  {measurementState.ecg.active ? (isRTL ? 'إيقاف' : 'Stop') : 'ECG'}
                </Button>

                <Button
                  variant={measurementState.bloodPressure.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('bloodPressure')}
                  disabled={activeAction === 'bloodPressure'}
                  data-testid="button-measure-bp"
                >
                  {activeAction === 'bloodPressure' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                  {measurementState.bloodPressure.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'ضغط الدم' : 'BP')}
                </Button>

                <Button
                  variant={measurementState.temperature.active ? "destructive" : "outline"}
                  className="gap-2"
                  onClick={() => handleMeasurement('temperature')}
                  disabled={activeAction === 'temperature'}
                  data-testid="button-measure-temp"
                >
                  {activeAction === 'temperature' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Thermometer className="w-4 h-4" />
                  )}
                  {measurementState.temperature.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'الحرارة' : 'Temp')}
                </Button>

                <Button
                  variant={measurementState.bloodGlucose.active ? "destructive" : "outline"}
                  className="gap-2 col-span-2 md:col-span-1"
                  onClick={() => handleMeasurement('bloodGlucose')}
                  disabled={activeAction === 'bloodGlucose'}
                  data-testid="button-measure-glucose"
                >
                  {activeAction === 'bloodGlucose' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  {measurementState.bloodGlucose.active ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'السكر' : 'Glucose')}
                </Button>
              </div>
            )}

            {(vitalSigns.heartRate || vitalSigns.oxygenLevel || vitalSigns.bloodPressure || vitalSigns.temperature) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  {isRTL ? 'القراءات الحالية' : 'Current Readings'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {vitalSigns.heartRate && (
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Heart className="w-3 h-3 text-red-500" />
                      <span>{vitalSigns.heartRate} bpm</span>
                    </div>
                  )}
                  {vitalSigns.oxygenLevel && (
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span>{vitalSigns.oxygenLevel}%</span>
                    </div>
                  )}
                  {vitalSigns.bloodPressure && (
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Activity className="w-3 h-3 text-green-500" />
                      <span>{vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic}</span>
                    </div>
                  )}
                  {vitalSigns.temperature && (
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Thermometer className="w-3 h-3 text-orange-500" />
                      <span>{vitalSigns.temperature.toFixed(1)}°C</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
