import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BloodGlucoseReading {
  id: number;
  patientId: string;
  deviceId: string;
  glucoseLevel: number;
  testStripStatus: string;
  measurementType: string;
  timestamp: string;
}

interface BloodGlucoseMonitorProps {
  patientId: string;
}

export default function BloodGlucoseMonitor({ patientId }: BloodGlucoseMonitorProps) {
  const [readings, setReadings] = useState<BloodGlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadings();
    const interval = setInterval(loadReadings, 30000);
    return () => clearInterval(interval);
  }, [patientId]);

  const loadReadings = async () => {
    try {
      const response = await fetch(`/api/blood-glucose/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setReadings(data);
      }
    } catch (error) {
      console.error('Error loading blood glucose readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGlucoseStatus = (level: number | null | undefined) => {
    if (level === null || level === undefined) return { label: 'Pending', color: 'bg-gray-100 text-gray-600', badge: 'secondary', icon: Minus };
    if (level < 70) return { label: 'Low', color: 'bg-red-100 text-red-800', badge: 'destructive', icon: TrendingDown };
    if (level <= 140) return { label: 'Normal', color: 'bg-green-100 text-green-800', badge: 'default', icon: Minus };
    if (level <= 180) return { label: 'Elevated', color: 'bg-yellow-100 text-yellow-800', badge: 'secondary', icon: TrendingUp };
    return { label: 'High', color: 'bg-red-100 text-red-800', badge: 'destructive', icon: TrendingUp };
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const latestReading = readings[0];
  const status = latestReading ? getGlucoseStatus(latestReading.glucoseLevel) : null;
  const StatusIcon = status?.icon || Minus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Droplets className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-foreground">Blood Glucose Monitor</h2>
      </div>

      {/* Latest Reading Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {latestReading ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Latest Reading</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">
                      {latestReading.glucoseLevel !== null && latestReading.glucoseLevel !== undefined 
                        ? latestReading.glucoseLevel 
                        : '—'} <span className="text-lg">mg/dL</span>
                    </p>
                  </div>
                  {status && (
                    <Badge variant={status.badge as 'default' | 'secondary' | 'destructive'}>
                      {status.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                  <div>
                    <p className="text-xs text-muted-foreground">{latestReading.testStripStatus}</p>
                    <p className="text-sm font-medium text-foreground">{formatDate(latestReading.timestamp)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No readings yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Readings */}
      {readings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Recent Readings</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {readings.map((reading) => {
              const readingStatus = getGlucoseStatus(reading.glucoseLevel);
              const ReadingIcon = readingStatus.icon;
              return (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-4 bg-white border border-border rounded-lg hover:bg-muted/50 transition"
                  data-testid={`glucose-reading-${reading.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${readingStatus.color}`}>
                      <ReadingIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {reading.glucoseLevel !== null && reading.glucoseLevel !== undefined 
                          ? reading.glucoseLevel 
                          : '—'} <span className="text-xs text-muted-foreground">mg/dL</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{reading.testStripStatus || 'fingerstick'}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <Badge variant={readingStatus.badge as 'default' | 'secondary' | 'destructive'} className="mb-1">
                        {readingStatus.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{formatDate(reading.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
