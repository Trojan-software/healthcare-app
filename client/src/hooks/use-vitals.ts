import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface VitalSigns {
  id: number;
  patientId: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
  bloodGlucose?: number;
  timestamp: string;
}

export interface VitalSignsInput {
  patientId: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
  bloodGlucose?: number;
}

export function useVitals(patientId: string) {
  const queryClient = useQueryClient();

  const {
    data: vitalsHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery<VitalSigns[]>({
    queryKey: ['/api/vital-signs', patientId],
    enabled: !!patientId,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Derive latest vitals from history (most recent entry) — avoid a duplicate query.
  const latestVitals: VitalSigns | undefined =
    vitalsHistory && vitalsHistory.length > 0 ? vitalsHistory[0] : undefined;

  const recordVitalsMutation = useMutation({
    mutationFn: async (vitals: Omit<VitalSignsInput, 'patientId'>) => {
      const response = await apiRequest('/api/vital-signs', 'POST', { ...vitals, patientId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs', patientId] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  // Thresholds use Celsius — the HC03 device always reports temperature in °C.
  const checkAbnormalVitals = (vitals: Omit<VitalSignsInput, 'patientId'>) => {
    const alerts = [];

    if (vitals.heartRate && (vitals.heartRate < 60 || vitals.heartRate > 100)) {
      alerts.push({
        type: 'critical',
        message: `Abnormal heart rate: ${vitals.heartRate} BPM (Normal: 60-100 BPM)`,
      });
    }

    if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
      if (vitals.bloodPressureSystolic > 140 || vitals.bloodPressureDiastolic > 90) {
        alerts.push({
          type: 'critical',
          message: `High blood pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg (Normal: <140/90 mmHg)`,
        });
      }
    }

    if (vitals.temperature != null) {
      // Temperature is in Celsius (HC03 protocol). Normal: 36.0–38.0 °C.
      if (vitals.temperature > 39.0 || vitals.temperature < 35.0) {
        alerts.push({
          type: 'critical',
          message: `Abnormal temperature: ${vitals.temperature}°C (Normal: 36.0–38.0°C)`,
        });
      } else if (vitals.temperature > 38.0 || vitals.temperature < 36.0) {
        alerts.push({
          type: 'warning',
          message: `Elevated temperature: ${vitals.temperature}°C (Normal: 36.0–38.0°C)`,
        });
      }
    }

    if (vitals.oxygenLevel && vitals.oxygenLevel < 95) {
      alerts.push({
        type: 'critical',
        message: `Low oxygen level: ${vitals.oxygenLevel}% (Normal: ≥95%)`,
      });
    }

    if (vitals.bloodGlucose && (vitals.bloodGlucose > 250 || vitals.bloodGlucose < 70)) {
      alerts.push({
        type: 'critical',
        message: `Abnormal blood glucose: ${vitals.bloodGlucose} mg/dL (Normal: 70–250 mg/dL)`,
      });
    }

    return alerts;
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        return value >= 60 && value <= 100 ? 'normal' : 'abnormal';
      case 'systolic':
        return value < 140 ? 'normal' : 'abnormal';
      case 'diastolic':
        return value < 90 ? 'normal' : 'abnormal';
      case 'temperature':
        // Celsius thresholds (HC03 sends °C)
        return value >= 36.0 && value <= 38.0 ? 'normal' : 'abnormal';
      case 'oxygen':
        return value >= 95 ? 'normal' : 'abnormal';
      case 'glucose':
        return value >= 70 && value <= 180 ? 'normal' : 'abnormal';
      default:
        return 'normal';
    }
  };

  const getVitalsChartData = () => {
    if (!vitalsHistory || vitalsHistory.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedHistory = [...vitalsHistory]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24);

    const labels = sortedHistory.map(v =>
      new Date(v.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Heart Rate (BPM)',
          data: sortedHistory.map(v => v.heartRate ?? null),
          borderColor: 'hsl(var(--alert-red))',
          backgroundColor: 'hsl(var(--alert-red) / 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Blood Pressure Systolic (mmHg)',
          data: sortedHistory.map(v => v.bloodPressureSystolic ?? null),
          borderColor: 'hsl(var(--medical-blue))',
          backgroundColor: 'hsl(var(--medical-blue) / 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Temperature (°C)',
          data: sortedHistory.map(v => v.temperature ?? null),
          borderColor: 'hsl(var(--warning-amber))',
          backgroundColor: 'hsl(var(--warning-amber) / 0.1)',
          tension: 0.4,
          fill: false,
        },
      ],
    };
  };

  return {
    vitalsHistory,
    latestVitals,
    isLoadingHistory,
    isRecording: recordVitalsMutation.isPending,
    historyError,
    recordError: recordVitalsMutation.error,
    recordVitals: recordVitalsMutation.mutate,
    checkAbnormalVitals,
    getVitalStatus,
    getVitalsChartData,
  };
}
