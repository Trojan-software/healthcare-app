import { Activity } from 'lucide-react';
import DeviceWidgetCard from '@/components/DeviceWidgetCard';
import { useDeviceMeasurements } from '@/hooks/useDeviceMeasurements';
import { Line } from 'react-chartjs-2';

interface SpO2WidgetProps {
  patientId?: string;
  onConnect?: () => void;
}

export default function SpO2Widget({ patientId, onConnect }: SpO2WidgetProps) {
  const { latestMeasurement, isConnected, connection, measurements, hasData } = useDeviceMeasurements({
    patientId,
    detectionType: 'OX',
  });

  const getStatus = () => {
    if (!latestMeasurement?.bloodOxygen) return 'unknown';
    const spo2 = latestMeasurement.bloodOxygen;
    if (spo2 < 90) return 'critical';
    if (spo2 < 95) return 'warning';
    return 'good';
  };

  const getStatusText = () => {
    if (!latestMeasurement?.bloodOxygen) return 'No data';
    const spo2 = latestMeasurement.bloodOxygen;
    if (spo2 < 90) return 'Critically low';
    if (spo2 < 95) return 'Below normal';
    return 'Normal';
  };

  // Prepare chart data
  const chartData = {
    labels: measurements.slice(0, 10).reverse().map((m: any, i: number) => `${i + 1}`),
    datasets: [
      {
        label: 'SpO2',
        data: measurements.slice(0, 10).reverse().map((m: any) => m.bloodOxygen || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
        min: 85,
        max: 100,
        ticks: { stepSize: 5 },
      },
    },
  };

  return (
    <DeviceWidgetCard
      title="Blood Oxygen (SpO2)"
      icon={<Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
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
              <div data-testid="spo2-level">
                <p className="text-xs text-muted-foreground">SpO2 Level</p>
                <p className="text-3xl font-bold text-foreground">{latestMeasurement.bloodOxygen || '--'}%</p>
              </div>
              <div data-testid="spo2-heart-rate">
                <p className="text-xs text-muted-foreground">Heart Rate</p>
                <p className="text-2xl font-bold text-foreground">{latestMeasurement.heartRate || '--'}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
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
            <p className="text-sm">No blood oxygen data available</p>
            <p className="text-xs mt-1">Connect a device to start monitoring</p>
          </div>
        )}
      </div>
    </DeviceWidgetCard>
  );
}
