import { Heart } from 'lucide-react';
import DeviceWidgetCard from '@/components/DeviceWidgetCard';
import { useDeviceMeasurements } from '@/hooks/useDeviceMeasurements';
import { Line } from 'react-chartjs-2';
import { DetectionType } from '@/contexts/DeviceDataContext';

interface BloodPressureWidgetProps {
  patientId?: string;
  onConnect?: () => void;
}

export default function BloodPressureWidget({ patientId, onConnect }: BloodPressureWidgetProps) {
  const { latestMeasurement, isConnected, connection, measurements, hasData } = useDeviceMeasurements({
    patientId,
    detectionType: DetectionType.BP,
  });

  const getStatus = () => {
    if (!latestMeasurement?.systolic || !latestMeasurement?.diastolic) return 'unknown';
    const sys = latestMeasurement.systolic;
    const dia = latestMeasurement.diastolic;
    
    if (sys >= 180 || dia >= 120) return 'critical';
    if (sys >= 140 || dia >= 90) return 'warning';
    if (sys < 90 || dia < 60) return 'warning';
    return 'good';
  };

  const getStatusText = () => {
    if (!latestMeasurement?.systolic || !latestMeasurement?.diastolic) return 'No data';
    const sys = latestMeasurement.systolic;
    const dia = latestMeasurement.diastolic;
    
    if (sys >= 180 || dia >= 120) return 'Hypertensive crisis';
    if (sys >= 140 || dia >= 90) return 'High blood pressure';
    if (sys < 90 || dia < 60) return 'Low blood pressure';
    return 'Normal';
  };

  // Prepare chart data
  const chartData = {
    labels: measurements.slice(0, 10).reverse().map((m: any, i: number) => `${i + 1}`),
    datasets: [
      {
        label: 'Systolic',
        data: measurements.slice(0, 10).reverse().map((m: any) => m.systolic || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
      {
        label: 'Diastolic',
        data: measurements.slice(0, 10).reverse().map((m: any) => m.diastolic || 0),
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
      legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 12, font: { size: 10 } } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { display: false },
      y: { 
        display: true,
        min: 40,
        max: 200,
        ticks: { stepSize: 40 },
      },
    },
  };

  return (
    <DeviceWidgetCard
      title="Blood Pressure"
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
            <div className="grid grid-cols-3 gap-2">
              <div data-testid="bp-systolic">
                <p className="text-xs text-muted-foreground">Systolic</p>
                <p className="text-2xl font-bold text-foreground">{latestMeasurement.systolic || '--'}</p>
                <p className="text-xs text-muted-foreground">mmHg</p>
              </div>
              <div data-testid="bp-diastolic">
                <p className="text-xs text-muted-foreground">Diastolic</p>
                <p className="text-2xl font-bold text-foreground">{latestMeasurement.diastolic || '--'}</p>
                <p className="text-xs text-muted-foreground">mmHg</p>
              </div>
              <div data-testid="bp-heart-rate">
                <p className="text-xs text-muted-foreground">Pulse</p>
                <p className="text-2xl font-bold text-foreground">{latestMeasurement.heartRate || '--'}</p>
                <p className="text-xs text-muted-foreground">bpm</p>
              </div>
            </div>

            {measurements.length > 1 && (
              <div className="h-32">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No blood pressure data available</p>
            <p className="text-xs mt-1">Connect a device to start monitoring</p>
          </div>
        )}
      </div>
    </DeviceWidgetCard>
  );
}
