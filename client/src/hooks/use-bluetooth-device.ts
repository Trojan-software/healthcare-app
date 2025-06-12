import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen?: Date;
}

export interface HC03Reading {
  type: 'ECG' | 'BloodOxygen' | 'BloodPressure' | 'Temperature' | 'BloodGlucose';
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
  bloodGlucose?: number;
  ecgWaveData?: number[];
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  fingerDetected?: boolean;
  timestamp: Date;
}

export interface DeviceStatus {
  isConnected: boolean;
  deviceId?: string;
  batteryLevel?: number;
  signalStrength?: number;
  lastHeartbeat?: Date;
}

export function useBluetoothDevice() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({ isConnected: false });
  const [activeDetections, setActiveDetections] = useState<Set<string>>(new Set());
  const [recentReadings, setRecentReadings] = useState<HC03Reading[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate device discovery and connection
  const connectToDevice = useCallback(async (deviceId: string) => {
    try {
      // In a real implementation, this would use the HC03 SDK
      // Hc03Sdk.getInstance().connectToDevice(deviceId)
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection time
      
      setDeviceStatus({
        isConnected: true,
        deviceId,
        batteryLevel: 85 + Math.random() * 15,
        signalStrength: -30 - Math.random() * 20,
        lastHeartbeat: new Date()
      });

      toast({
        title: "Device Connected",
        description: "HC03 device connected successfully",
      });

    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to HC03 device",
        variant: "destructive",
      });
    }
  }, [toast]);

  const disconnectDevice = useCallback(() => {
    setDeviceStatus({ isConnected: false });
    setActiveDetections(new Set());
    
    toast({
      title: "Device Disconnected",
      description: "HC03 device disconnected",
    });
  }, [toast]);

  // HC03 SDK Detection Functions
  const startDetection = useCallback((detectionType: string) => {
    if (!deviceStatus.isConnected) {
      toast({
        title: "Device Not Connected",
        description: "Please connect an HC03 device first",
        variant: "destructive",
      });
      return;
    }

    setActiveDetections(prev => new Set(prev).add(detectionType));
    
    // Simulate starting detection based on type
    simulateDetection(detectionType);
  }, [deviceStatus.isConnected, toast]);

  const stopDetection = useCallback((detectionType: string) => {
    setActiveDetections(prev => {
      const newSet = new Set(prev);
      newSet.delete(detectionType);
      return newSet;
    });
  }, []);

  // Simulate HC03 device readings
  const simulateDetection = useCallback((type: string) => {
    const generateReading = () => {
      let reading: HC03Reading;

      switch (type) {
        case 'ECG':
          reading = {
            type: 'ECG',
            heartRate: 60 + Math.random() * 40,
            ecgWaveData: Array.from({length: 100}, () => Math.sin(Math.random() * Math.PI * 2) * 50),
            quality: Math.random() > 0.2 ? 'good' : 'poor',
            fingerDetected: Math.random() > 0.1,
            timestamp: new Date()
          };
          break;

        case 'BloodOxygen':
          reading = {
            type: 'BloodOxygen',
            oxygenLevel: 95 + Math.random() * 5,
            heartRate: 60 + Math.random() * 40,
            quality: Math.random() > 0.15 ? 'excellent' : 'fair',
            fingerDetected: Math.random() > 0.1,
            timestamp: new Date()
          };
          break;

        case 'BloodPressure':
          reading = {
            type: 'BloodPressure',
            bloodPressureSystolic: 110 + Math.random() * 30,
            bloodPressureDiastolic: 70 + Math.random() * 20,
            heartRate: 60 + Math.random() * 40,
            quality: 'good',
            timestamp: new Date()
          };
          break;

        case 'Temperature':
          reading = {
            type: 'Temperature',
            temperature: 98.0 + Math.random() * 2.4,
            quality: 'good',
            timestamp: new Date()
          };
          break;

        case 'BloodGlucose':
          reading = {
            type: 'BloodGlucose',
            bloodGlucose: 80 + Math.random() * 60,
            quality: 'good',
            timestamp: new Date()
          };
          break;

        default:
          return;
      }

      setRecentReadings(prev => [reading, ...prev.slice(0, 19)]);
      return reading;
    };

    const interval = setInterval(() => {
      if (activeDetections.has(type)) {
        generateReading();
      } else {
        clearInterval(interval);
      }
    }, type === 'ECG' ? 1000 : type === 'BloodPressure' ? 5000 : 2000);
  }, [activeDetections]);

  // Save readings to database
  const saveVitalSignsMutation = useMutation({
    mutationFn: async (reading: HC03Reading) => {
      const vitalsData = {
        heartRate: reading.heartRate,
        bloodPressureSystolic: reading.bloodPressureSystolic,
        bloodPressureDiastolic: reading.bloodPressureDiastolic,
        temperature: reading.temperature,
        oxygenLevel: reading.oxygenLevel
      };

      const response = await apiRequest('POST', '/api/vital-signs', vitalsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
    }
  });

  // Auto-save important readings
  useEffect(() => {
    const lastReading = recentReadings[0];
    if (lastReading && (lastReading.type === 'BloodPressure' || lastReading.quality === 'excellent')) {
      saveVitalSignsMutation.mutate(lastReading);
    }
  }, [recentReadings, saveVitalSignsMutation]);

  // Simulate device heartbeat
  useEffect(() => {
    if (deviceStatus.isConnected) {
      const heartbeat = setInterval(() => {
        setDeviceStatus(prev => ({
          ...prev,
          lastHeartbeat: new Date(),
          batteryLevel: Math.max(0, (prev.batteryLevel || 85) - Math.random() * 0.05)
        }));
      }, 10000);

      return () => clearInterval(heartbeat);
    }
  }, [deviceStatus.isConnected]);

  return {
    deviceStatus,
    activeDetections,
    recentReadings,
    connectToDevice,
    disconnectDevice,
    startDetection,
    stopDetection,
    saveReading: saveVitalSignsMutation.mutate,
    isSaving: saveVitalSignsMutation.isPending
  };
}