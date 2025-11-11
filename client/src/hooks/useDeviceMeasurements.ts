import { useQuery } from '@tanstack/react-query';
import { useDeviceData, DetectionType } from '@/contexts/DeviceDataContext';
import { useMemo } from 'react';

interface UseDeviceMeasurementsOptions {
  patientId?: string;
  detectionType: DetectionType;
  enabled?: boolean;
}

export function useDeviceMeasurements({ patientId, detectionType, enabled = true }: UseDeviceMeasurementsOptions) {
  const { liveReadings, isConnected, connections } = useDeviceData();

  // Map detection types to API endpoints
  const apiEndpoint = useMemo(() => {
    const endpoints: Record<DetectionType, string | null> = {
      ECG: patientId ? `/api/ecg-data/${patientId}` : null,
      OX: patientId ? `/api/blood-oxygen/${patientId}` : null,
      BP: patientId ? `/api/blood-pressure/${patientId}` : null,
      BG: patientId ? `/api/blood-glucose/${patientId}` : null,
      BT: patientId ? `/api/temperature/${patientId}` : null,
      BATTERY: null, // Battery doesn't have historical data
    };
    return endpoints[detectionType];
  }, [patientId, detectionType]);

  // Fetch historical data from API
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: [apiEndpoint],
    enabled: enabled && !!apiEndpoint,
  });

  // Get live reading from context
  const liveReading = liveReadings[detectionType];
  const hasLiveData = liveReading && Object.keys(liveReading).length > 0;
  const connected = isConnected(detectionType);
  const connection = connections[detectionType];

  // Merge live and historical data
  const measurements = useMemo(() => {
    const historical = Array.isArray(historicalData) ? historicalData : [];
    
    // If we have live data, include it as the most recent measurement
    if (hasLiveData) {
      return [
        {
          ...liveReading,
          timestamp: new Date().toISOString(),
          isLive: true,
        },
        ...historical,
      ];
    }
    
    return historical;
  }, [historicalData, liveReading, hasLiveData]);

  // Get the latest measurement (live or historical)
  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;

  return {
    measurements,
    latestMeasurement,
    liveReading: hasLiveData ? liveReading : null,
    historicalData: Array.isArray(historicalData) ? historicalData : [],
    isConnected: connected,
    connection,
    isLoading,
    error,
    hasData: measurements.length > 0,
  };
}
