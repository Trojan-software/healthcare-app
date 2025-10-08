import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BluetoothService, 
  DetectionType, 
  ConnectionState,
  type HC03DeviceInfo,
  type ECGData,
  type BloodOxygenData,
  type BloodPressureData,
  type BloodGlucoseData,
  type TemperatureData,
  type BatteryData,
  type BluetoothError
} from '@/services/BluetoothService';

interface HC03Reading {
  type: DetectionType;
  timestamp: number;
  patientId: string;
  deviceId: string;
  data: any;
}

interface DeviceStatus {
  isConnected: boolean;
  connectionState: ConnectionState;
  deviceId?: string;
  deviceName?: string;
  batteryLevel?: number;
  error?: BluetoothError;
}

export function useHC03Bluetooth(patientId: string) {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    isConnected: false,
    connectionState: ConnectionState.DISCONNECTED
  });
  const [activeDetections, setActiveDetections] = useState<Set<DetectionType>>(new Set());
  const [recentReadings, setRecentReadings] = useState<HC03Reading[]>([]);
  const [latestReadings, setLatestReadings] = useState<Map<DetectionType, any>>(new Map());
  
  const bluetoothServiceRef = useRef<BluetoothService | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize Bluetooth service
  useEffect(() => {
    try {
      bluetoothServiceRef.current = new BluetoothService();
      setupEventListeners();
    } catch (error: any) {
      toast({
        title: "Bluetooth Not Supported",
        description: error.message || "Please use a browser that supports Web Bluetooth (Chrome, Edge, Opera)",
        variant: "destructive"
      });
    }

    return () => {
      // Cleanup on unmount
      if (bluetoothServiceRef.current) {
        bluetoothServiceRef.current.disconnect();
      }
    };
  }, []);

  // Setup event listeners for Bluetooth service
  const setupEventListeners = useCallback(() => {
    const service = bluetoothServiceRef.current;
    if (!service) return;

    // Connection state changes
    service.on('connectionStateChanged', ({ currentState, deviceId }: any) => {
      setDeviceStatus(prev => ({
        ...prev,
        connectionState: currentState,
        isConnected: currentState === ConnectionState.CONNECTED,
        deviceId
      }));
    });

    // Connected event
    service.on('connected', ({ deviceId, deviceName }: any) => {
      setDeviceStatus(prev => ({
        ...prev,
        isConnected: true,
        connectionState: ConnectionState.CONNECTED,
        deviceId,
        deviceName
      }));
      
      toast({
        title: "Device Connected",
        description: `Connected to ${deviceName}`,
      });
    });

    // Disconnected event
    service.on('disconnected', () => {
      setDeviceStatus({
        isConnected: false,
        connectionState: ConnectionState.DISCONNECTED
      });
      setActiveDetections(new Set());
      
      toast({
        title: "Device Disconnected",
        description: "HC03 device has been disconnected",
      });
    });

    // Error events
    service.on('bluetoothError', (error: BluetoothError) => {
      setDeviceStatus(prev => ({ ...prev, error }));
      
      toast({
        title: "Bluetooth Error",
        description: error.message,
        variant: "destructive"
      });
    });

    // ECG data
    service.on('ecgData', (data: ECGData) => {
      const reading: HC03Reading = {
        type: DetectionType.ECG,
        timestamp: Date.now(),
        patientId,
        deviceId: deviceStatus.deviceId || '',
        data
      };
      
      setLatestReadings(prev => new Map(prev).set(DetectionType.ECG, data));
      setRecentReadings(prev => [reading, ...prev.slice(0, 99)]);
      
      // Save to database with required patientId
      saveVitalSignsMutation.mutate({
        patientId,
        heartRate: data.heartRate
      });
    });

    // Blood Oxygen data
    service.on('bloodOxygenData', (data: BloodOxygenData) => {
      const reading: HC03Reading = {
        type: DetectionType.OX,
        timestamp: Date.now(),
        patientId,
        deviceId: deviceStatus.deviceId || '',
        data
      };
      
      setLatestReadings(prev => new Map(prev).set(DetectionType.OX, data));
      setRecentReadings(prev => [reading, ...prev.slice(0, 99)]);
      
      // Save to database with required patientId
      saveVitalSignsMutation.mutate({
        patientId,
        oxygenLevel: data.bloodOxygen,
        heartRate: data.heartRate
      });
    });

    // Blood Pressure data
    service.on('bloodPressureData', (data: BloodPressureData) => {
      const reading: HC03Reading = {
        type: DetectionType.BP,
        timestamp: Date.now(),
        patientId,
        deviceId: deviceStatus.deviceId || '',
        data
      };
      
      setLatestReadings(prev => new Map(prev).set(DetectionType.BP, data));
      setRecentReadings(prev => [reading, ...prev.slice(0, 99)]);
      
      // Save to database with required patientId
      saveVitalSignsMutation.mutate({
        patientId,
        bloodPressureSystolic: data.systolic,
        bloodPressureDiastolic: data.diastolic,
        heartRate: data.heartRate
      });
    });

    // Temperature data
    service.on('temperatureData', (data: TemperatureData) => {
      const reading: HC03Reading = {
        type: DetectionType.BT,
        timestamp: Date.now(),
        patientId,
        deviceId: deviceStatus.deviceId || '',
        data
      };
      
      setLatestReadings(prev => new Map(prev).set(DetectionType.BT, data));
      setRecentReadings(prev => [reading, ...prev.slice(0, 99)]);
      
      // Save to database with required patientId
      saveVitalSignsMutation.mutate({
        patientId,
        temperature: data.temperature
      });
    });

    // Blood Glucose data
    service.on('bloodGlucoseData', (data: BloodGlucoseData) => {
      const reading: HC03Reading = {
        type: DetectionType.BG,
        timestamp: Date.now(),
        patientId,
        deviceId: deviceStatus.deviceId || '',
        data
      };
      
      setLatestReadings(prev => new Map(prev).set(DetectionType.BG, data));
      setRecentReadings(prev => [reading, ...prev.slice(0, 99)]);
      
      // Save to database with required patientId
      saveVitalSignsMutation.mutate({
        patientId,
        bloodGlucose: data.glucoseLevel
      });
    });

    // Battery data
    service.on('batteryData', (data: BatteryData) => {
      setDeviceStatus(prev => ({ 
        ...prev, 
        batteryLevel: data.batteryLevel 
      }));
    });

    // Measurement started
    service.on('measurementStarted', ({ type }: any) => {
      setActiveDetections(prev => new Set(prev).add(type));
    });

    // Measurement stopped
    service.on('measurementStopped', ({ type }: any) => {
      setActiveDetections(prev => {
        const newSet = new Set(prev);
        newSet.delete(type);
        return newSet;
      });
    });
  }, [patientId, deviceStatus.deviceId, toast]);

  // Save vital signs mutation
  const saveVitalSignsMutation = useMutation({
    mutationFn: async (vitalsData: any) => {
      return apiRequest('/api/vital-signs', 'POST', vitalsData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
    },
    onError: (error) => {
      console.error('Failed to save vital signs:', error);
    }
  });

  // Scan for devices
  const scanForDevices = useCallback(async (): Promise<HC03DeviceInfo[]> => {
    const service = bluetoothServiceRef.current;
    if (!service) {
      throw new Error('Bluetooth service not initialized');
    }

    try {
      const devices = await service.startScan();
      return devices;
    } catch (error: any) {
      if (error.type === 'permission_denied') {
        toast({
          title: "Permission Denied",
          description: "Please allow Bluetooth access to scan for HC03 devices",
          variant: "destructive"
        });
      }
      throw error;
    }
  }, [toast]);

  // Connect to device
  const connectToDevice = useCallback(async (deviceId: string): Promise<void> => {
    const service = bluetoothServiceRef.current;
    if (!service) {
      throw new Error('Bluetooth service not initialized');
    }

    await service.connect(deviceId, patientId);
  }, [patientId]);

  // Disconnect from device
  const disconnectDevice = useCallback(async (): Promise<void> => {
    const service = bluetoothServiceRef.current;
    if (!service) return;

    await service.disconnect();
  }, []);

  // Start measurement
  const startMeasurement = useCallback(async (type: DetectionType): Promise<void> => {
    const service = bluetoothServiceRef.current;
    if (!service) {
      throw new Error('Bluetooth service not initialized');
    }

    if (!deviceStatus.isConnected) {
      toast({
        title: "Device Not Connected",
        description: "Please connect to an HC03 device first",
        variant: "destructive"
      });
      return;
    }

    await service.startMeasurement(type);
  }, [deviceStatus.isConnected, toast]);

  // Stop measurement
  const stopMeasurement = useCallback(async (type: DetectionType): Promise<void> => {
    const service = bluetoothServiceRef.current;
    if (!service) {
      throw new Error('Bluetooth service not initialized');
    }

    await service.stopMeasurement(type);
  }, []);

  // Get connection health
  const getConnectionHealth = useCallback(() => {
    const service = bluetoothServiceRef.current;
    if (!service) return null;

    return service.getConnectionHealth();
  }, []);

  return {
    // Device status
    deviceStatus,
    activeDetections,
    recentReadings,
    latestReadings,
    
    // Actions
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    startMeasurement,
    stopMeasurement,
    getConnectionHealth,
    
    // State
    isScanning: deviceStatus.connectionState === ConnectionState.SCANNING,
    isConnecting: deviceStatus.connectionState === ConnectionState.CONNECTING,
    isConnected: deviceStatus.isConnected,
    isSaving: saveVitalSignsMutation.isPending
  };
}
