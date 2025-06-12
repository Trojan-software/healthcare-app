import { useState, useEffect } from 'react';
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
  timestamp: string;
}

export interface VitalSignsInput {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
}

export function useVitals() {
  const queryClient = useQueryClient();

  // Get vital signs history
  const {
    data: vitalsHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery<VitalSigns[]>({
    queryKey: ['/api/vital-signs'],
    staleTime: 30000, // 30 seconds
  });

  // Get latest vital signs
  const {
    data: latestVitals,
    isLoading: isLoadingLatest,
    error: latestError,
  } = useQuery<VitalSigns>({
    queryKey: ['/api/vital-signs/latest'],
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Record new vital signs
  const recordVitalsMutation = useMutation({
    mutationFn: async (vitals: VitalSignsInput) => {
      const response = await apiRequest('POST', '/api/vital-signs', vitals);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch vital signs data
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  // Check if vital signs are abnormal
  const checkAbnormalVitals = (vitals: VitalSignsInput) => {
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
    
    if (vitals.temperature && (vitals.temperature > 100.4 || vitals.temperature < 96.8)) {
      alerts.push({
        type: 'critical',
        message: `Abnormal temperature: ${vitals.temperature}°F (Normal: 96.8-100.4°F)`,
      });
    }
    
    if (vitals.oxygenLevel && vitals.oxygenLevel < 95) {
      alerts.push({
        type: 'critical',
        message: `Low oxygen level: ${vitals.oxygenLevel}% (Normal: ≥95%)`,
      });
    }
    
    return alerts;
  };

  // Get vital signs status
  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        return value >= 60 && value <= 100 ? 'normal' : 'abnormal';
      case 'systolic':
        return value < 140 ? 'normal' : 'abnormal';
      case 'diastolic':
        return value < 90 ? 'normal' : 'abnormal';
      case 'temperature':
        return value >= 96.8 && value <= 100.4 ? 'normal' : 'abnormal';
      case 'oxygen':
        return value >= 95 ? 'normal' : 'abnormal';
      default:
        return 'normal';
    }
  };

  // Transform vitals history for chart display
  const getVitalsChartData = () => {
    if (!vitalsHistory || vitalsHistory.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const sortedHistory = [...vitalsHistory]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-24); // Last 24 readings

    const labels = sortedHistory.map(vital => 
      new Date(vital.timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    );

    const datasets = [
      {
        label: 'Heart Rate (BPM)',
        data: sortedHistory.map(vital => vital.heartRate || null),
        borderColor: 'hsl(var(--alert-red))',
        backgroundColor: 'hsl(var(--alert-red) / 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Blood Pressure (Systolic)',
        data: sortedHistory.map(vital => vital.bloodPressureSystolic || null),
        borderColor: 'hsl(var(--medical-blue))',
        backgroundColor: 'hsl(var(--medical-blue) / 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Temperature (°F)',
        data: sortedHistory.map(vital => vital.temperature || null),
        borderColor: 'hsl(var(--warning-amber))',
        backgroundColor: 'hsl(var(--warning-amber) / 0.1)',
        tension: 0.4,
        fill: false,
      },
    ];

    return { labels, datasets };
  };

  return {
    // Data
    vitalsHistory,
    latestVitals,
    
    // Loading states
    isLoadingHistory,
    isLoadingLatest,
    isRecording: recordVitalsMutation.isPending,
    
    // Error states
    historyError,
    latestError,
    recordError: recordVitalsMutation.error,
    
    // Actions
    recordVitals: recordVitalsMutation.mutate,
    
    // Utilities
    checkAbnormalVitals,
    getVitalStatus,
    getVitalsChartData,
  };
}
