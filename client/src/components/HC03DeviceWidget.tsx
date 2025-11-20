import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { 
  Bluetooth, 
  BluetoothConnected,
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  Battery,
  Waves,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { hc03Sdk, Detection, type ECGData, type BloodOxygenData, type BloodPressureData, type TemperatureData, type BatteryData } from '@/lib/hc03-sdk';
import BluetoothTroubleshootingGuide from '@/components/BluetoothTroubleshootingGuide';

interface HC03DeviceData {
  deviceId: string;
  deviceName: string;
  connectionStatus: 'connected' | 'disconnected' | 'scanning';
  batteryLevel: number;
  chargingStatus: boolean;
  lastConnected: string;
}

interface MeasurementData {
  type: 'ecg' | 'bloodOxygen' | 'bloodPressure' | 'bloodGlucose' | 'temperature' | 'battery';
  value: any;
  timestamp: string;
  deviceId: string;
}

interface HC03DeviceWidgetProps {
  patientId: string;
  onDataUpdate?: (data: MeasurementData) => void;
}

export default function HC03DeviceWidget({ patientId, onDataUpdate }: HC03DeviceWidgetProps) {
  const [devices, setDevices] = useState<HC03DeviceData[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<HC03DeviceData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'scanning' | 'connecting' | 'connected' | 'error'>('idle');
  const [isConnecting, setIsConnecting] = useState(false);
  const [realtimeData, setRealtimeData] = useState<MeasurementData[]>([]);
  const [measurementInProgress, setMeasurementInProgress] = useState<Detection | null>(null);
  const [error, setError] = useState<string>('');
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(true);
  
  const wsConnection = useRef<WebSocket | null>(null);
  const measurementTimeout = useRef<NodeJS.Timeout | null>(null);
  const validDataReceived = useRef<boolean>(false);
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    loadDevices();
    initializeWebSocket();
    initializeHC03SDK();
    
    return () => {
      cleanup();
    };
  }, [patientId]);

  const initializeHC03SDK = async () => {
    try {
      await hc03Sdk.initialize();
      
      // Set up callbacks for each detection type
      hc03Sdk.setCallback(Detection.ECG, handleECGData);
      hc03Sdk.setCallback(Detection.OX, handleBloodOxygenData);
      hc03Sdk.setCallback(Detection.BP, handleBloodPressureData);
      hc03Sdk.setCallback(Detection.BT, handleTemperatureData);
      hc03Sdk.setCallback(Detection.BG, handleBloodGlucoseData);
      hc03Sdk.setCallback(Detection.BATTERY, handleBatteryData);
      
      console.log('HC03 SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HC03 SDK:', error);
      setError(t('error'));
    }
  };

  const handleECGData = (event: any) => {
    if (event.type === 'data') {
      const ecgData = event.data as ECGData;
      const measurementData: MeasurementData = {
        type: 'ecg',
        value: {
          heartRate: ecgData.hr,
          moodIndex: ecgData.moodIndex,
          moodText: hc03Sdk.getMoodText(ecgData.moodIndex),
          rrInterval: ecgData.rr,
          hrv: ecgData.hrv,
          respiratoryRate: ecgData.respiratoryRate,
          fingerDetected: ecgData.touch,
          waveData: ecgData.wave
        },
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      addMeasurementData(measurementData);
    } else if (event.type === 'measurementStarted') {
      setMeasurementInProgress(Detection.ECG);
      toast({
        title: t('measurementStarted'),
        description: t('placeFinger'),
      });
    } else if (event.type === 'measurementCompleted') {
      setMeasurementInProgress(null);
      toast({
        title: t('measurementCompleted'),
        description: t('measurementCompleted'),
      });
    }
  };

  const handleBloodOxygenData = (event: any) => {
    if (event.type === 'data') {
      const oxData = event.data as BloodOxygenData;
      const measurementData: MeasurementData = {
        type: 'bloodOxygen',
        value: {
          bloodOxygen: oxData.bloodOxygen,
          heartRate: oxData.heartRate,
          fingerDetected: oxData.fingerDetection,
          waveData: oxData.bloodOxygenWaveData
        },
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      addMeasurementData(measurementData);
      
      // Auto-stop after receiving valid blood oxygen data (SpO2 > 0 and HR > 0)
      if (oxData.bloodOxygen > 0 && oxData.heartRate > 0 && measurementInProgress === Detection.OX) {
        if (!validDataReceived.current) {
          validDataReceived.current = true;
          
          // Stop measurement after 2 seconds to ensure data is saved
          setTimeout(async () => {
            await stopMeasurement(Detection.OX);
            toast({
              title: "Blood Oxygen Measurement Complete",
              description: `SpO2: ${oxData.bloodOxygen}% | HR: ${oxData.heartRate} bpm`,
            });
          }, 2000);
        }
      }
    } else if (event.type === 'measurementStarted') {
      validDataReceived.current = false;
      setMeasurementInProgress(Detection.OX);
      toast({
        title: "Blood Oxygen Measurement Started",
        description: "Please keep your finger steady on the sensor",
      });
    } else if (event.type === 'measurementCompleted') {
      setMeasurementInProgress(null);
      toast({
        title: "Blood Oxygen Measurement Complete",
        description: "Blood oxygen measurement completed successfully",
      });
    }
  };

  const handleBloodPressureData = (event: any) => {
    if (event.type === 'data') {
      const bpData = event.data as BloodPressureData;
      const measurementData: MeasurementData = {
        type: 'bloodPressure',
        value: {
          systolic: bpData.ps,
          diastolic: bpData.pd,
          heartRate: bpData.hr,
          progress: bpData.progress || 100
        },
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      addMeasurementData(measurementData);
      
      // Auto-stop after receiving valid blood pressure data (systolic > 0 and diastolic > 0)
      if (bpData.ps > 0 && bpData.pd > 0 && measurementInProgress === Detection.BP) {
        if (!validDataReceived.current) {
          validDataReceived.current = true;
          
          // Stop measurement after 2 seconds to ensure data is saved
          setTimeout(async () => {
            await stopMeasurement(Detection.BP);
            toast({
              title: "Blood Pressure Measurement Complete",
              description: `BP: ${bpData.ps}/${bpData.pd} mmHg | HR: ${bpData.hr} bpm`,
            });
          }, 2000);
        }
      }
    } else if (event.type === 'measurementStarted') {
      validDataReceived.current = false;
      setMeasurementInProgress(Detection.BP);
      toast({
        title: "Blood Pressure Measurement Started",
        description: "Please remain still during measurement",
      });
    } else if (event.type === 'measurementCompleted') {
      setMeasurementInProgress(null);
      toast({
        title: "Blood Pressure Measurement Complete",
        description: "Blood pressure measurement completed successfully",
      });
    }
  };

  const handleTemperatureData = (event: any) => {
    if (event.type === 'data') {
      const tempData = event.data as TemperatureData;
      const measurementData: MeasurementData = {
        type: 'temperature',
        value: {
          temperature: tempData.temperature
        },
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      addMeasurementData(measurementData);
    } else if (event.type === 'measurementStarted') {
      setMeasurementInProgress(Detection.BT);
      toast({
        title: "Temperature Measurement Started",
        description: "Measuring body temperature...",
      });
    } else if (event.type === 'measurementCompleted') {
      setMeasurementInProgress(null);
      toast({
        title: "Temperature Measurement Complete",
        description: "Temperature measurement completed successfully",
      });
    }
  };

  const handleBloodGlucoseData = (event: any) => {
    if (event.type === 'data') {
      const measurementData: MeasurementData = {
        type: 'bloodGlucose',
        value: event.data,
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      addMeasurementData(measurementData);
      
      // Auto-stop after receiving valid blood glucose data
      if (event.data?.bloodGlucosePaperData && measurementInProgress === Detection.BG) {
        if (!validDataReceived.current) {
          validDataReceived.current = true;
          
          // Stop measurement after 2 seconds to ensure data is saved
          setTimeout(async () => {
            await stopMeasurement(Detection.BG);
            toast({
              title: "Blood Glucose Measurement Complete",
              description: `Glucose: ${event.data.bloodGlucosePaperData} mmol/L`,
            });
          }, 2000);
        }
      }
    } else if (event.type === 'measurementStarted') {
      validDataReceived.current = false;
      setMeasurementInProgress(Detection.BG);
      toast({
        title: "Blood Glucose Measurement Started",
        description: "Please insert test strip and apply blood sample",
      });
    } else if (event.type === 'measurementCompleted') {
      setMeasurementInProgress(null);
      toast({
        title: "Blood Glucose Measurement Complete",
        description: "Blood glucose measurement completed successfully",
      });
    }
  };

  const handleBatteryData = (event: any) => {
    if (event.type === 'data') {
      const batteryData = event.data as BatteryData;
      
      // Update device battery info
      setSelectedDevice(prev => prev ? {
        ...prev,
        batteryLevel: batteryData.batteryLevel,
        chargingStatus: batteryData.chargingStatus
      } : null);
      
      const measurementData: MeasurementData = {
        type: 'battery',
        value: {
          batteryLevel: batteryData.batteryLevel,
          chargingStatus: batteryData.chargingStatus
        },
        timestamp: new Date().toISOString(),
        deviceId: selectedDevice?.deviceId || ''
      };
      
      addMeasurementData(measurementData);
    }
  };

  const addMeasurementData = (measurementData: MeasurementData) => {
    setRealtimeData(prev => [measurementData, ...prev.slice(0, 9)]);
    
    if (onDataUpdate) {
      onDataUpdate(measurementData);
    }
    
    // Send data via WebSocket for real-time updates
    if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
      wsConnection.current.send(JSON.stringify({
        type: 'hc03_data',
        measurementType: measurementData.type,
        deviceId: selectedDevice?.deviceId,
        patientId,
        data: measurementData.value,
        timestamp: measurementData.timestamp
      }));
    }
  };

  const initializeWebSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/hc03`;
      wsConnection.current = new WebSocket(wsUrl);

      wsConnection.current.onopen = () => {
        // Authenticate
        wsConnection.current?.send(JSON.stringify({
          type: 'auth',
          token
        }));
      };

      wsConnection.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'auth_success':
              // Subscribe to patient data
              wsConnection.current?.send(JSON.stringify({
                type: 'subscribe',
                patientId
              }));
              break;
              
            case 'device_status_update':
              setDevices(prev => prev.map(device => 
                device.deviceId === message.deviceId 
                  ? { ...device, connectionStatus: message.status }
                  : device
              ));
              break;
              
            case 'hc03_data_update':
              // Handle real-time data updates from other sources
              const newData: MeasurementData = {
                type: message.measurementType,
                value: message.data,
                timestamp: message.timestamp,
                deviceId: message.deviceId
              };
              setRealtimeData(prev => [newData, ...prev.slice(0, 9)]);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsConnection.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await fetch(`/api/hc03/devices/patient/${patientId}`);
      if (response.ok) {
        const deviceList = await response.json();
        setDevices(deviceList);
        
        // Auto-select the first connected device
        const connectedDevice = deviceList.find((d: HC03DeviceData) => d.connectionStatus === 'connected');
        if (connectedDevice) {
          setSelectedDevice(connectedDevice);
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const scanForDevices = async () => {
    setIsConnecting(true);
    setConnectionStatus('scanning');
    setError('');
    
    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const errorMessage = isIOS 
          ? 'Web Bluetooth is not supported on iOS Safari. Please install the native iOS app from the App Store to use Bluetooth features.'
          : 'Web Bluetooth is not supported in this browser. Please use Chrome or Edge browser on Android/Desktop, or install the native mobile app.';
        throw new Error(errorMessage);
      }
      
      // Check for Location permission on Android (required for Bluetooth scanning)
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid && 'permissions' in navigator) {
        try {
          console.log('🔍 [HC03] Checking location permission (required on Android)...');
          // @ts-ignore - geolocation permission API
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          console.log('🔍 [HC03] Location permission status:', permissionStatus.state);
          
          if (permissionStatus.state === 'denied') {
            throw new Error('Location permission is required for Bluetooth scanning on Android. Please enable Location in your phone settings, then grant location permission to Chrome when prompted.');
          }
        } catch (permError) {
          console.warn('⚠️ [HC03] Could not check location permission:', permError);
        }
      }
      
      // Check if device is available first
      const isAvailable = await hc03Sdk.isDeviceAvailable();
      if (!isAvailable) {
        throw new Error('HC02/HC03 device is already connected to another application. Please disconnect it from other apps and try again.');
      }
      
      // Use HC03 SDK to connect to device
      console.log('🔍 [HC03] Starting device scan...');
      const device = await hc03Sdk.connectDevice();
      
      if (device) {
        // Register device with backend
        const response = await fetch('/api/hc03/devices/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId: device.id,
            deviceName: device.name || 'HC03 Device',
            macAddress: device.id,
            firmwareVersion: '1.0.0',
            patientId
          })
        });
        
        if (response.ok) {
          const deviceData: HC03DeviceData = {
            deviceId: device.id,
            deviceName: device.name || 'HC03 Device',
            connectionStatus: 'connected',
            batteryLevel: 85, // Will be updated when battery is queried
            chargingStatus: false,
            lastConnected: new Date().toISOString()
          };
          
          setSelectedDevice(deviceData);
          setDevices(prev => [deviceData, ...prev.filter(d => d.deviceId !== device.id)]);
          setConnectionStatus('connected');
          setDeviceInfo(hc03Sdk.getDeviceInfo());
          
          // Clear any previous connection errors
          setError('');
          setShowTroubleshooting(false);
          
          // Query battery level
          setTimeout(() => {
            queryBattery();
          }, 1000);
          
          toast({
            title: "Device Connected",
            description: `Successfully connected to ${device.name}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Error scanning for devices:', error);
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to scan for devices';
      
      if (error.message?.includes('not supported')) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        userMessage = isIOS
          ? 'Web Bluetooth is not supported on iOS. Please install the native iOS app to use Bluetooth features, or access this page from an Android device using Chrome browser.'
          : 'Web Bluetooth is not supported in this browser. Please use Chrome or Edge browser, or install the native mobile app for full Bluetooth support.';
      } else if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        userMessage = 'Device selection was cancelled. Please try again and select your HC03 device from the list.';
      } else if (error.name === 'NotFoundError' || error.message?.includes('No device found')) {
        userMessage = 'No HC03 device found. Make sure your device is turned on, in pairing mode, and nearby.';
      } else if (error.name === 'NotAllowedError' || error.message?.includes('denied')) {
        userMessage = 'Bluetooth access was denied. Please allow Bluetooth permissions in your browser settings.';
      } else if (error.name === 'SecurityError') {
        userMessage = 'Bluetooth access requires a secure connection (HTTPS). Please ensure you\'re using a secure connection.';
      } else if (error.message?.includes('already connected')) {
        userMessage = error.message;
      } else if (error.message) {
        userMessage = error.message;
      }
      
      setError(userMessage);
      setConnectionStatus('error');
      setShowTroubleshooting(true);
      setIsTroubleshootingOpen(true);
      
      toast({
        title: "Connection Failed",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = async () => {
    try {
      await hc03Sdk.disconnect();
      
      // Update device status
      if (selectedDevice) {
        await fetch(`/api/hc03/devices/${selectedDevice.deviceId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'disconnected' })
        });
      }
      
      setConnectionStatus('idle');
      setSelectedDevice(null);
      setDeviceInfo(null);
      setMeasurementInProgress(null);
      
      toast({
        title: "Device Disconnected",
        description: "HC03 device has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  };

  const startMeasurement = async (type: Detection) => {
    if (!hc03Sdk.getConnectionStatus()) {
      toast({
        title: "Device Not Connected",
        description: "Please connect to your HC03 device first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Clear any existing timeout
      if (measurementTimeout.current) {
        clearTimeout(measurementTimeout.current);
      }
      
      // Reset valid data flag
      validDataReceived.current = false;
      
      await hc03Sdk.startDetect(type);
      
      // Set timeout to auto-stop measurement after 30 seconds
      measurementTimeout.current = setTimeout(async () => {
        if (measurementInProgress === type) {
          await stopMeasurement(type);
          toast({
            title: "Measurement Timeout",
            description: "Measurement stopped after 30 seconds. Please try again.",
            variant: "destructive"
          });
        }
      }, 30000);
    } catch (error) {
      console.error(`Error starting ${type} measurement:`, error);
      toast({
        title: "Measurement Error",
        description: `Failed to start ${type} measurement`,
        variant: "destructive"
      });
    }
  };

  const stopMeasurement = async (type: Detection) => {
    if (!hc03Sdk.getConnectionStatus()) return;
    
    try {
      // Clear timeout
      if (measurementTimeout.current) {
        clearTimeout(measurementTimeout.current);
        measurementTimeout.current = null;
      }
      
      await hc03Sdk.stopDetect(type);
      setMeasurementInProgress(null);
      validDataReceived.current = false;
    } catch (error) {
      console.error(`Error stopping ${type} measurement:`, error);
    }
  };

  const queryBattery = async () => {
    if (!hc03Sdk.getConnectionStatus()) return;
    
    try {
      await hc03Sdk.startDetect(Detection.BATTERY);
      // Also try to query from battery service directly
      const batteryLevel = await hc03Sdk.queryBatteryLevel();
      if (batteryLevel !== null) {
        setSelectedDevice(prev => prev ? {
          ...prev,
          batteryLevel: batteryLevel
        } : null);
      }
    } catch (error) {
      console.error('Error querying battery:', error);
    }
  };

  const cleanup = () => {
    if (hc03Sdk.getConnectionStatus()) {
      hc03Sdk.disconnect();
    }
    if (wsConnection.current) {
      wsConnection.current.close();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'scanning': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'scanning': return 'Scanning...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  const getMeasurementIcon = (type: string) => {
    switch (type) {
      case 'ecg': return <Heart className="h-4 w-4 text-red-500" />;
      case 'bloodOxygen': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'bloodPressure': return <Activity className="h-4 w-4 text-green-500" />;
      case 'temperature': return <Thermometer className="h-4 w-4 text-orange-500" />;
      case 'bloodGlucose': return <Droplets className="h-4 w-4 text-purple-500" />;
      case 'battery': return <Battery className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatMeasurementValue = (type: string, value: any) => {
    switch (type) {
      case 'ecg':
        return `HR: ${value.heartRate} BPM, HRV: ${value.hrv}, Mood: ${value.moodText}`;
      case 'bloodOxygen':
        return `SpO2: ${value.bloodOxygen}%, HR: ${value.heartRate} BPM`;
      case 'bloodPressure':
        return `${value.systolic}/${value.diastolic} mmHg, HR: ${value.heartRate} BPM`;
      case 'temperature':
        return `${value.temperature}°C`;
      case 'bloodGlucose':
        return typeof value === 'object' ? JSON.stringify(value) : value.toString();
      case 'battery':
        return `${value.batteryLevel}% ${value.chargingStatus ? '(Charging)' : ''}`;
      default:
        return typeof value === 'object' ? JSON.stringify(value) : value.toString();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            HC03 Device
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(connectionStatus)} text-white`}
            >
              {getStatusText(connectionStatus)}
            </Badge>
            {selectedDevice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeviceDetails(true)}
                data-testid="button-device-details"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Browser Compatibility Warning */}
        {!navigator.bluetooth && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                <div className="space-y-2">
                  <p className="font-semibold">iOS Detected: Web Bluetooth Not Supported</p>
                  <p className="text-sm">iOS Safari doesn't support Web Bluetooth. To use HC03 devices:</p>
                  <ul className="text-sm list-disc ml-5 space-y-1">
                    <li>Install the native iOS app from the App Store</li>
                    <li>Or use an Android device with Chrome browser</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold">Bluetooth Not Available</p>
                  <p className="text-sm">This browser doesn't support Web Bluetooth. For HC03 connectivity:</p>
                  <ul className="text-sm list-disc ml-5 space-y-1">
                    <li>Use Chrome or Edge browser (Android/Desktop)</li>
                    <li>Or install the native mobile app for your device</li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Section */}
        {!selectedDevice ? (
          <div className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                No HC03 device connected. Scan for available devices.
              </p>
              <Button 
                onClick={scanForDevices}
                disabled={isConnecting}
                className="w-full"
                data-testid="button-scan-devices"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Bluetooth className="h-4 w-4 mr-2" />
                    Scan for Devices
                  </>
                )}
              </Button>
            </div>

            {/* Bluetooth Troubleshooting Guide - Shows when connection fails */}
            {showTroubleshooting && error && (
              <Card className="border-red-200 dark:border-red-800 mt-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Alert variant="destructive" className="mb-4" data-testid="alert-connection-error">
                        <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <strong>Connection Error:</strong>
                            <p className="mt-1 text-sm">{error}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={scanForDevices} 
                            disabled={isConnecting}
                            className="ml-4"
                            data-testid="button-retry-connection"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTroubleshooting(false)}
                      className="ml-2"
                      data-testid="button-dismiss-troubleshooting"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Collapsible open={isTroubleshootingOpen} onOpenChange={setIsTroubleshootingOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-lg font-semibold mb-4 w-full hover:underline" data-testid="button-toggle-troubleshooting">
                      {isTroubleshootingOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      Need help connecting?
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <BluetoothTroubleshootingGuide />
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Device Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <BluetoothConnected className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium" data-testid="text-device-name">
                    {selectedDevice.deviceName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDevice.deviceId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                <span className="text-sm" data-testid="text-battery-level">
                  {selectedDevice.batteryLevel}%
                </span>
                {selectedDevice.chargingStatus && (
                  <Badge variant="secondary">{t('chargingStatus')}</Badge>
                )}
              </div>
            </div>

            {/* Measurement Controls */}
            <Tabs defaultValue="measurements" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="measurements">Measurements</TabsTrigger>
                <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="measurements" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement(Detection.ECG)}
                    disabled={measurementInProgress === Detection.ECG}
                    data-testid="button-ecg-measurement"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {measurementInProgress === Detection.ECG ? 'Recording...' : 'ECG'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement(Detection.OX)}
                    disabled={measurementInProgress === Detection.OX}
                    data-testid="button-oxygen-measurement"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    {measurementInProgress === Detection.OX ? 'Measuring...' : 'Blood O₂'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement(Detection.BP)}
                    disabled={measurementInProgress === Detection.BP}
                    data-testid="button-pressure-measurement"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    {measurementInProgress === Detection.BP ? 'Measuring...' : 'Blood Pressure'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement(Detection.BT)}
                    disabled={measurementInProgress === Detection.BT}
                    data-testid="button-temp-measurement"
                  >
                    <Thermometer className="h-4 w-4 mr-2" />
                    {measurementInProgress === Detection.BT ? 'Measuring...' : 'Temperature'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => startMeasurement(Detection.BG)}
                    disabled={measurementInProgress === Detection.BG}
                    className="col-span-2"
                    data-testid="button-glucose-measurement"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    {measurementInProgress === Detection.BG ? 'Measuring...' : 'Blood Glucose'}
                  </Button>
                </div>

                {measurementInProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {measurementInProgress.toUpperCase()} measurement in progress...
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopMeasurement(measurementInProgress)}
                      >
                        Stop
                      </Button>
                    </div>
                    <Progress value={50} className="w-full" />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="realtime" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Recent Measurements</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={queryBattery}
                    data-testid="button-refresh-data"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                {realtimeData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent measurements available
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {realtimeData.map((data, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                        data-testid={`measurement-${data.type}-${index}`}
                      >
                        <div className="flex items-center gap-2">
                          {getMeasurementIcon(data.type)}
                          <span className="text-sm font-medium">
                            {data.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatMeasurementValue(data.type, data.value)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(data.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Disconnect Button */}
            <Button
              variant="destructive"
              onClick={disconnectDevice}
              className="w-full"
              data-testid="button-disconnect"
            >
              {t('disconnectDevice')}
            </Button>
          </div>
        )}

        {/* Device Details Dialog */}
        <Dialog open={showDeviceDetails} onOpenChange={setShowDeviceDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('viewDetails')}</DialogTitle>
            </DialogHeader>
            {selectedDevice && deviceInfo && (
              <div className="space-y-4">
                <div>
                  <label className="font-medium text-gray-600">{t('deviceName')}</label>
                  <p>{selectedDevice.deviceName}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">{t('patientId')}</label>
                  <p>{selectedDevice.deviceId}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">{t('deviceConnection')}</label>
                  <p>{selectedDevice.connectionStatus}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">{t('batteryLevel')}</label>
                  <p>{selectedDevice.batteryLevel}% {selectedDevice.chargingStatus && '(Charging)'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">{t('lastActivity')}</label>
                  <p>{new Date(selectedDevice.lastConnected).toLocaleString()}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Active Measurements</label>
                  <p>{hc03Sdk.getActiveDetections().join(', ') || 'None'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}