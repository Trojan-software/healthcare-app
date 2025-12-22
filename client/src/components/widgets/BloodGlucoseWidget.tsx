import { Droplet } from 'lucide-react';
import DeviceWidgetCard from '@/components/DeviceWidgetCard';
import { useDeviceMeasurements } from '@/hooks/useDeviceMeasurements';
import { Line } from 'react-chartjs-2';
import { DetectionType } from '@/contexts/DeviceDataContext';

interface BloodGlucoseWidgetProps {
  patientId?: string;
  onConnect?: () => void;
}

export default function BloodGlucoseWidget({ patientId, onConnect }: BloodGlucoseWidgetProps) {
  const { latestMeasurement, isConnected, connection, measurements, hasData } = useDeviceMeasurements({
    patientId,
    detectionType: DetectionType.BG,
  });

  const getStatus = () => {
    if (!latestMeasurement?.glucoseLevel) return 'unknown';
    const glucose = latestMeasurement.glucoseLevel;
    if (glucose < 50 || glucose > 300) return 'critical';
    if (glucose < 70 || glucose > 180) return 'warning';
    return 'good';
  };

  const getStatusText = () => {
    if (!latestMeasurement?.glucoseLevel) return 'No data';
    const glucose = latestMeasurement.glucoseLevel;
    if (glucose < 50) return 'Severely low';
    if (glucose > 300) return 'Dangerously high';
    if (glucose < 70) return 'Low';
    if (glucose > 180) return 'High';
    return 'Normal';
  };

  // Prepare chart data
  const chartData = {
    labels: measurements.slice(0, 10).reverse().map((m: any, i: number) => `${i + 1}`),
    datasets: [
      {
        label: 'Glucose',
        data: measurements.slice(0, 10).reverse().map((m: any) => m.glucoseLevel || 0),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
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
        min: 40,
        max: 400,
        ticks: { stepSize: 80 },
      },
    },
  };

  return (
    <DeviceWidgetCard
      title="Blood Glucose"
      icon={<Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
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
              <div data-testid="glucose-level">
                <p className="text-xs text-muted-foreground">Glucose Level</p>
                <p className="text-3xl font-bold text-foreground">{latestMeasurement.glucoseLevel || '--'}</p>
                <p className="text-xs text-muted-foreground">mg/dL</p>
              </div>
              <div data-testid="glucose-type">
                <p className="text-xs text-muted-foreground">Measurement Type</p>
                <p className="text-sm font-semibold capitalize">{latestMeasurement.measurementType || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground mt-1">{latestMeasurement.testStripStatus || 'Strip OK'}</p>
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
            <p className="text-sm">No blood glucose data available</p>
            <p className="text-xs mt-1">Connect a device to start monitoring</p>
          </div>
        )}
      </div>
    </DeviceWidgetCard>
  );
}
