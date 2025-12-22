import { Thermometer } from 'lucide-react';
import DeviceWidgetCard from '@/components/DeviceWidgetCard';
import { useDeviceMeasurements } from '@/hooks/useDeviceMeasurements';
import { Line } from 'react-chartjs-2';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DetectionType } from '@/contexts/DeviceDataContext';

interface TemperatureWidgetProps {
  patientId?: string;
  onConnect?: () => void;
}

export default function TemperatureWidget({ patientId, onConnect }: TemperatureWidgetProps) {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const { latestMeasurement, isConnected, connection, measurements, hasData } = useDeviceMeasurements({
    patientId,
    detectionType: DetectionType.BT,
  });

  const convertTemp = (celsius: number | undefined) => {
    if (!celsius) return undefined;
    return unit === 'C' ? celsius : (celsius * 9/5) + 32;
  };

  const getStatus = () => {
    if (!latestMeasurement?.temperature) return 'unknown';
    const temp = latestMeasurement.temperature;
    if (temp > 38.5 || temp < 35) return 'warning';
    if (temp > 39.5 || temp < 34) return 'critical';
    return 'good';
  };

  const getStatusText = () => {
    if (!latestMeasurement?.temperature) return 'No data';
    const temp = latestMeasurement.temperature;
    if (temp > 39.5) return 'High fever';
    if (temp > 38.5) return 'Fever';
    if (temp < 34) return 'Hypothermia';
    if (temp < 35) return 'Low temperature';
    return 'Normal';
  };

  // Prepare chart data
  const chartData = {
    labels: measurements.slice(0, 10).reverse().map((m: any, i: number) => `${i + 1}`),
    datasets: [
      {
        label: 'Temperature',
        data: measurements.slice(0, 10).reverse().map((m: any) => {
          const temp = parseFloat(m.temperature) || 0;
          return unit === 'C' ? temp : (temp * 9/5) + 32;
        }),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { display: false },
      y: { 
        display: true,
        min: unit === 'C' ? 34 : 93,
        max: unit === 'C' ? 42 : 108,
        ticks: { stepSize: unit === 'C' ? 2 : 5 },
      },
    },
  };

  return (
    <DeviceWidgetCard
      title="Body Temperature"
      icon={<Thermometer className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      connected={isConnected}
      deviceName={connection?.deviceName}
      status={getStatus()}
      statusText={getStatusText()}
      lastUpdated={latestMeasurement?.timestamp || latestMeasurement?.recordedAt}
      onConnect={onConnect}
    >
      <div className="space-y-3">
        {latestMeasurement ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div data-testid="temperature-value">
                <p className="text-xs text-muted-foreground">Temperature</p>
                <p className="text-3xl font-bold text-foreground">
                  {convertTemp(latestMeasurement.temperature)?.toFixed(1) || '--'}°{unit}
                </p>
              </div>
              <div data-testid="temperature-site">
                <p className="text-xs text-muted-foreground">Measurement Site</p>
                <p className="text-sm font-semibold capitalize">{latestMeasurement.measurementSite || 'Forehead'}</p>
                <div className="mt-2 flex gap-1">
                  <Button 
                    size="sm" 
                    variant={unit === 'C' ? 'default' : 'outline'}
                    onClick={() => setUnit('C')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    °C
                  </Button>
                  <Button 
                    size="sm" 
                    variant={unit === 'F' ? 'default' : 'outline'}
                    onClick={() => setUnit('F')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    °F
                  </Button>
                </div>
              </div>
            </div>

            {measurements.length > 1 && (
              <div className="h-24">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No temperature data available</p>
            <p className="text-xs mt-1">Connect a device to start monitoring</p>
          </div>
        )}
      </div>
    </DeviceWidgetCard>
  );
}
