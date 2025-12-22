import { Heart } from 'lucide-react';
import DeviceWidgetCard from '@/components/DeviceWidgetCard';
import { useDeviceMeasurements } from '@/hooks/useDeviceMeasurements';
import { Line } from 'react-chartjs-2';
import { DetectionType } from '@/contexts/DeviceDataContext';

interface ECGWidgetProps {
  patientId?: string;
  onConnect?: () => void;
}

export default function ECGWidget({ patientId, onConnect }: ECGWidgetProps) {
  const { latestMeasurement, isConnected, connection, measurements, hasData } = useDeviceMeasurements({
    patientId,
    detectionType: DetectionType.ECG,
  });

  const getStatus = () => {
    if (!latestMeasurement?.heartRate) return 'unknown';
    const hr = latestMeasurement.heartRate;
    if (hr < 50 || hr > 120) return 'critical';
    if (hr < 60 || hr > 100) return 'warning';
    return 'good';
  };

  const getStatusText = () => {
    if (!latestMeasurement?.heartRate) return 'No data';
    const hr = latestMeasurement.heartRate;
    if (hr < 50) return 'Bradycardia';
    if (hr > 120) return 'Tachycardia';
    if (hr < 60 || hr > 100) return 'Outside normal range';
    return 'Normal';
  };

  // Prepare chart data
  const chartData = {
    labels: measurements.slice(0, 10).reverse().map((m: any, i: number) => `${i + 1}`),
    datasets: [
      {
        label: 'Heart Rate',
        data: measurements.slice(0, 10).reverse().map((m: any) => m.heartRate || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
        max: 140,
        ticks: { stepSize: 20 },
      },
    },
  };

  return (
    <DeviceWidgetCard
      title="ECG Monitor"
      icon={<Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
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
              <div data-testid="ecg-heart-rate">
                <p className="text-xs text-muted-foreground">Heart Rate</p>
                <p className="text-2xl font-bold text-foreground">{latestMeasurement.heartRate || '--'}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
              <div data-testid="ecg-hrv">
                <p className="text-xs text-muted-foreground">HRV</p>
                <p className="text-2xl font-bold text-foreground">{latestMeasurement.hrv || '--'}</p>
                <p className="text-xs text-muted-foreground">ms</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div data-testid="ecg-mood-index">
                <p className="text-xs text-muted-foreground">Mood Index</p>
                <p className="text-lg font-semibold">{latestMeasurement.moodIndex || '--'}</p>
              </div>
              <div data-testid="ecg-respiratory-rate">
                <p className="text-xs text-muted-foreground">Respiratory Rate</p>
                <p className="text-lg font-semibold">{latestMeasurement.respiratoryRate || '--'} /min</p>
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
            <p className="text-sm">No ECG data available</p>
            <p className="text-xs mt-1">Connect a device to start monitoring</p>
          </div>
        )}
      </div>
    </DeviceWidgetCard>
  );
}
