import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { handleApiError, handleDeviceError } from '@/lib/errorHandler';
import { useLanguage } from '@/lib/i18n';

interface BloodGlucoseReading {
  id: number;
  patientId: string;
  deviceId: string;
  glucoseLevel: number;
  testStripStatus: string;
  measurementType: string;
  timestamp: string;
}

interface BloodGlucoseWidgetProps {
  patientId: string;
  showControls?: boolean;
  compact?: boolean;
}

export default function BloodGlucoseWidget({ patientId, showControls = false, compact = false }: BloodGlucoseWidgetProps) {
  const [glucoseData, setGlucoseData] = useState<BloodGlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [measuring, setMeasuring] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadGlucoseData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadGlucoseData, 30000);
    return () => clearInterval(interval);
  }, [patientId]);

  const loadGlucoseData = async () => {
    try {
      const response = await fetch(`/api/blood-glucose/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setGlucoseData(data);
      }
    } catch (error) {
      handleApiError('BloodGlucoseWidget', 'loadGlucoseData', error as Error, { patientId });
    } finally {
      setLoading(false);
    }
  };

  const startMeasurement = async () => {
    setMeasuring(true);
    try {
      // Simulate measurement with random glucose level
      const glucoseLevel = Math.floor(Math.random() * 100) + 70; // 70-170 mg/dL
      const response = await fetch('/api/blood-glucose/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          deviceId: 'HC03-001',
          glucoseLevel
        })
      });

      if (response.ok) {
        // Refresh data after 4 seconds (after simulation completes)
        setTimeout(() => {
          loadGlucoseData();
          setMeasuring(false);
        }, 4000);
      }
    } catch (error) {
      handleDeviceError('BloodGlucoseWidget', 'startMeasurement', error as Error, { patientId });
      setMeasuring(false);
    }
  };

  const getGlucoseStatus = (level: number, type: string) => {
    if (type === 'fasting') {
      if (level < 70) return { status: t('low'), color: 'bg-red-100 text-red-800', icon: TrendingDown };
      if (level <= 100) return { status: t('normal'), color: 'bg-green-100 text-green-800', icon: Minus };
      if (level <= 125) return { status: t('prediabetic'), color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp };
      return { status: t('high'), color: 'bg-red-100 text-red-800', icon: TrendingUp };
    } else {
      if (level < 70) return { status: t('low'), color: 'bg-red-100 text-red-800', icon: TrendingDown };
      if (level <= 140) return { status: t('normal'), color: 'bg-green-100 text-green-800', icon: Minus };
      if (level <= 180) return { status: t('elevated'), color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp };
      return { status: t('high'), color: 'bg-red-100 text-red-800', icon: TrendingUp };
    }
  };

  const formatMeasurementType = (type: string) => {
    const types: Record<string, string> = {
      'fasting': t('fasting'),
      'post_meal': t('postMeal'),
      'random': t('random'),
      'bedtime': t('bedtime')
    };
    return types[type] || type;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const latestReading = glucoseData[0];
  const trend = glucoseData.length >= 2 ? 
    (glucoseData[0].glucoseLevel - glucoseData[1].glucoseLevel > 5 ? 'up' : 
     glucoseData[1].glucoseLevel - glucoseData[0].glucoseLevel > 5 ? 'down' : 'stable') : 'stable';

  if (loading) {
    return (
      <Card className={compact ? 'h-32' : 'h-full'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <Droplets className="w-4 h-4 mr-2 text-blue-600" />
            {t('bloodGlucose')}
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
    return (
      <Card className="h-32">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <Droplets className="w-4 h-4 mr-2 text-blue-600" />
            {t('bloodGlucose')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestReading ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">
                  {latestReading.glucoseLevel}
                </span>
                <span className="text-sm text-gray-500">mg/dL</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <Badge variant="secondary" className={getGlucoseStatus(latestReading.glucoseLevel, latestReading.measurementType).color}>
                  {getGlucoseStatus(latestReading.glucoseLevel, latestReading.measurementType).status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(latestReading.timestamp)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-sm">{t('noReadings')}</p>
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
            <Droplets className="w-5 h-5 mr-2 text-blue-600" />
            {t('bloodGlucoseMonitor')}
          </div>
          {showControls && (
            <Button 
              onClick={startMeasurement} 
              disabled={measuring}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {measuring ? t('measuring') : t('startTest')}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {latestReading && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold text-blue-600">
                {latestReading.glucoseLevel} mg/dL
              </span>
              <div className="text-right">
                <Badge variant="secondary" className={getGlucoseStatus(latestReading.glucoseLevel, latestReading.measurementType).color}>
                  {getGlucoseStatus(latestReading.glucoseLevel, latestReading.measurementType).status}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  {formatMeasurementType(latestReading.measurementType)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{t('latestReading')}</span>
              <span>{formatTimestamp(latestReading.timestamp)}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">{t('recentReadings')}</h4>
          {glucoseData.slice(0, 5).map((reading) => {
            const status = getGlucoseStatus(reading.glucoseLevel, reading.measurementType);
            const IconComponent = status.icon;
            
            return (
              <div key={reading.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{reading.glucoseLevel} mg/dL</p>
                    <p className="text-sm text-gray-600">
                      {formatMeasurementType(reading.measurementType)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className={status.color}>
                    {status.status}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(reading.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          
          {glucoseData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Droplets className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>{t('noGlucoseReadings')}</p>
              {showControls && (
                <p className="text-sm mt-1">{t('startMeasurementToSeeData')}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}