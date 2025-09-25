import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Battery, BatteryLow, Zap, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { handleApiError, handleDeviceError } from '@/lib/errorHandler';
import { useLanguage } from '@/lib/i18n';

interface DeviceBattery {
  deviceId: string;
  batteryLevel: number;
  isCharging: boolean;
}

interface BatteryWidgetProps {
  patientId: string;
  compact?: boolean;
}

export default function BatteryWidget({ patientId, compact = false }: BatteryWidgetProps) {
  const [devicesBattery, setDevicesBattery] = useState<DeviceBattery[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadBatteryData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadBatteryData, 60000);
    return () => clearInterval(interval);
  }, [patientId]);

  const loadBatteryData = async () => {
    try {
      const response = await fetch(`/api/battery/patient/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setDevicesBattery(data);
      }
    } catch (error) {
      handleApiError('BatteryWidget', 'loadBatteryData', error as Error, { patientId });
    } finally {
      setLoading(false);
    }
  };

  const simulateBatteryLevel = async (deviceId: string, level: number) => {
    try {
      await fetch('/api/battery/simulate-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          patientId,
          batteryLevel: level
        })
      });
      
      // Refresh data after simulation
      setTimeout(loadBatteryData, 1000);
    } catch (error) {
      handleDeviceError('BatteryWidget', 'simulateBatteryLevel', error as Error, { deviceId, level });
    }
  };

  const simulateCharging = async (deviceId: string, isCharging: boolean) => {
    try {
      await fetch('/api/battery/simulate-charging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          patientId,
          isCharging,
          method: 'usb'
        })
      });
      
      // Refresh data after simulation
      setTimeout(loadBatteryData, 1000);
    } catch (error) {
      handleDeviceError('BatteryWidget', 'simulateCharging', error as Error, { deviceId, isCharging });
    }
  };

  const getBatteryIcon = (level: number, isCharging: boolean) => {
    if (isCharging) return Zap;
    if (level <= 20) return BatteryLow;
    return Battery;
  };

  const getBatteryColor = (level: number, isCharging: boolean) => {
    if (isCharging) return 'text-green-600';
    if (level <= 10) return 'text-red-600';
    if (level <= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBatteryStatus = (level: number, isCharging: boolean) => {
    if (isCharging) return { status: t('charging'), color: 'bg-green-100 text-green-800' };
    if (level <= 10) return { status: t('critical'), color: 'bg-red-100 text-red-800' };
    if (level <= 20) return { status: t('low'), color: 'bg-yellow-100 text-yellow-800' };
    if (level >= 90) return { status: t('full'), color: 'bg-blue-100 text-blue-800' };
    return { status: t('good'), color: 'bg-green-100 text-green-800' };
  };

  const getDeviceName = (deviceId: string) => {
    const names: Record<string, string> = {
      'HC03-001': t('glucoseMonitor'),
      'HC03-002': t('bloodPressureMonitor'),
      'HC03-003': t('ecgMonitor')
    };
    return names[deviceId] || deviceId;
  };

  if (loading) {
    return (
      <Card className={compact ? 'h-32' : 'h-full'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <Battery className="w-4 h-4 mr-2 text-green-600" />
            {t('deviceBattery')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    const lowestBattery = devicesBattery.reduce((lowest, device) => 
      device.batteryLevel < lowest.batteryLevel ? device : lowest, 
      devicesBattery[0] || { batteryLevel: 100, isCharging: false }
    );

    return (
      <Card className="h-32">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <Battery className="w-4 h-4 mr-2 text-green-600" />
            {t('deviceBattery')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devicesBattery.length > 0 ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {lowestBattery.batteryLevel}%
                </span>
                <div className="flex items-center">
                  {lowestBattery.isCharging && <Zap className="w-4 h-4 text-green-600 mr-1" />}
                  <span className="text-sm text-gray-500">{t('lowest')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="secondary" className={getBatteryStatus(lowestBattery.batteryLevel, lowestBattery.isCharging).color}>
                  {getBatteryStatus(lowestBattery.batteryLevel, lowestBattery.isCharging).status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {devicesBattery.length} {t('devices')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-sm">{t('noDevicesFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Battery className="w-5 h-5 mr-2 text-green-600" />
            {t('deviceBatteryStatus')}
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {devicesBattery.length} {t('devices')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devicesBattery.map((device) => {
            const IconComponent = getBatteryIcon(device.batteryLevel, device.isCharging);
            const status = getBatteryStatus(device.batteryLevel, device.isCharging);
            
            return (
              <div key={device.deviceId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-100`}>
                      <Smartphone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{getDeviceName(device.deviceId)}</p>
                      <p className="text-sm text-gray-600">{device.deviceId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <IconComponent className={`w-5 h-5 ${getBatteryColor(device.batteryLevel, device.isCharging)}`} />
                      <span className="text-lg font-bold">{device.batteryLevel}%</span>
                    </div>
                    <Badge variant="secondary" className={status.color}>
                      {status.status}
                    </Badge>
                  </div>
                </div>
                
                {/* Battery Level Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      device.isCharging ? 'bg-green-500' :
                      device.batteryLevel <= 10 ? 'bg-red-500' :
                      device.batteryLevel <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${device.batteryLevel}%` }}
                  ></div>
                </div>

                {/* Battery Controls */}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateBatteryLevel(device.deviceId, Math.max(0, device.batteryLevel - 10))}
                    disabled={device.batteryLevel <= 0}
                  >
                    -10%
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateBatteryLevel(device.deviceId, Math.min(100, device.batteryLevel + 20))}
                    disabled={device.batteryLevel >= 100}
                  >
                    +20%
                  </Button>
                  <Button 
                    size="sm" 
                    variant={device.isCharging ? "destructive" : "default"}
                    onClick={() => simulateCharging(device.deviceId, !device.isCharging)}
                  >
                    {device.isCharging ? t('stopCharging') : t('startCharging')}
                  </Button>
                </div>
              </div>
            );
          })}
          
          {devicesBattery.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Battery className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>{t('noDevicesFound')}</p>
              <p className="text-sm mt-1">{t('connectHC03Devices')}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}