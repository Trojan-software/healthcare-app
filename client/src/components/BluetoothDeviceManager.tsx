import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import DeviceRegistrationFlow from "./DeviceRegistrationFlow";
import { 
  Bluetooth, 
  BluetoothConnected, 
  Battery, 
  Heart, 
  Thermometer, 
  Wind, 
  Activity,
  Zap,
  Power,
  RefreshCw,
  AlertCircle,
  User
} from "lucide-react";

// HC03 SDK Detection Types
enum Detection {
  BT = 'BT',           // Temperature
  OX = 'OX',           // Blood oxygen
  ECG = 'ECG',         // Electrocardiogram
  BP = 'BP',           // Blood pressure
  BATTERY = 'BATTERY', // Battery
  BG = 'BG'            // Blood sugar
}

interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  signalStrength?: number;
}

interface VitalReading {
  type: Detection;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'fair' | 'poor';
}

interface ECGData {
  wave: number[];
  heartRate: number;
  moodIndex: number;
  rrInterval: number;
  hrv: number;
  respiratoryRate: number;
  fingerDetected: boolean;
}

interface BloodOxygenData {
  bloodOxygen: number;
  heartRate: number;
  fingerDetected: boolean;
  waveData: number[];
}

interface BloodPressureData {
  systolic: number;
  diastolic: number;
  heartRate: number;
  progress: number;
}

export default function BluetoothDeviceManager() {
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [activeDetections, setActiveDetections] = useState<Set<Detection>>(new Set());
  const [vitalReadings, setVitalReadings] = useState<VitalReading[]>([]);
  const [ecgData, setEcgData] = useState<ECGData | null>(null);
  const [bloodOxygenData, setBloodOxygenData] = useState<BloodOxygenData | null>(null);
  const [bloodPressureData, setBloodPressureData] = useState<BloodPressureData | null>(null);
  const [temperatureData, setTemperatureData] = useState<number | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [isPatientRegistered, setIsPatientRegistered] = useState(false);
  const { toast } = useToast();

  // Check for existing patient registration
  useEffect(() => {
    const registered = localStorage.getItem('hc03_patient_registered');
    const patientId = localStorage.getItem('hc03_patient_id');
    if (registered && patientId) {
      setIsPatientRegistered(true);
      setCurrentPatientId(patientId);
    }
  }, []);

  // Simulate HC03 SDK functionality for web demo
  const simulateDeviceDiscovery = useCallback(() => {
    setIsScanning(true);
    
    setTimeout(() => {
      const mockDevices: BluetoothDevice[] = [
        {
          id: 'hc03-001',
          name: 'HC03 Health Monitor',
          connected: false,
          batteryLevel: 85,
          signalStrength: -45
        },
        {
          id: 'hc03-002', 
          name: 'HC03 Pro Monitor',
          connected: false,
          batteryLevel: 92,
          signalStrength: -38
        }
      ];
      
      setAvailableDevices(mockDevices);
      setIsScanning(false);
      
      toast({
        title: "Devices Found",
        description: `Found ${mockDevices.length} HC03 devices nearby`,
      });
    }, 3000);
  }, [toast]);

  const connectToDevice = useCallback(async (device: BluetoothDevice) => {
    try {
      // Simulate connection process
      toast({
        title: "Connecting...",
        description: `Connecting to ${device.name}`,
      });

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const connectedDevice = { ...device, connected: true };
      setConnectedDevice(connectedDevice);
      setAvailableDevices(prev => prev.filter(d => d.id !== device.id));
      
      toast({
        title: "Connected Successfully",
        description: `Connected to ${device.name}`,
      });

      // Start battery monitoring
      startDetection(Detection.BATTERY);
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to device",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle patient registration completion
  const handleRegistrationComplete = useCallback((patientId: string) => {
    setCurrentPatientId(patientId);
    setIsPatientRegistered(true);
    
    toast({
      title: "Patient Profile Connected",
      description: `Device linked to patient ${patientId}`,
    });
  }, [toast]);

  // Handle guest mode/skip registration
  const handleSkipRegistration = useCallback(() => {
    const tempId = `GUEST_${Date.now()}`;
    setCurrentPatientId(tempId);
    
    toast({
      title: "Guest Mode Active",
      description: "Limited functionality - register for full features",
      variant: "destructive",
    });
  }, [toast]);

  const disconnectDevice = useCallback(() => {
    if (connectedDevice) {
      // Stop all active detections
      activeDetections.forEach(detection => {
        stopDetection(detection);
      });
      
      setConnectedDevice(null);
      setActiveDetections(new Set());
      setVitalReadings([]);
      setEcgData(null);
      setBloodOxygenData(null);
      setBloodPressureData(null);
      setTemperatureData(null);
      
      toast({
        title: "Disconnected",
        description: "Device disconnected successfully",
      });
    }
  }, [connectedDevice, activeDetections, toast]);

  // HC03 SDK Start Detection
  const startDetection = useCallback((detection: Detection) => {
    if (!connectedDevice) {
      toast({
        title: "No Device Connected",
        description: "Please connect a device first",
        variant: "destructive",
      });
      return;
    }

    setActiveDetections(prev => new Set(prev).add(detection));
    
    // Simulate different detection types with realistic data
    switch (detection) {
      case Detection.ECG:
        simulateECGData();
        break;
      case Detection.OX:
        simulateBloodOxygenData();
        break;
      case Detection.BP:
        simulateBloodPressureData();
        break;
      case Detection.BT:
        simulateTemperatureData();
        break;
      case Detection.BATTERY:
        simulateBatteryData();
        break;
      case Detection.BG:
        simulateBloodGlucoseData();
        break;
    }
    
    toast({
      title: "Detection Started",
      description: `${getDetectionName(detection)} monitoring started`,
    });
  }, [connectedDevice, toast]);

  // HC03 SDK Stop Detection
  const stopDetection = useCallback((detection: Detection) => {
    setActiveDetections(prev => {
      const newSet = new Set(prev);
      newSet.delete(detection);
      return newSet;
    });
    
    toast({
      title: "Detection Stopped",
      description: `${getDetectionName(detection)} monitoring stopped`,
    });
  }, [toast]);

  const getDetectionName = (detection: Detection): string => {
    switch (detection) {
      case Detection.ECG: return 'ECG';
      case Detection.OX: return 'Blood Oxygen';
      case Detection.BP: return 'Blood Pressure';
      case Detection.BT: return 'Temperature';
      case Detection.BATTERY: return 'Battery';
      case Detection.BG: return 'Blood Glucose';
      default: return 'Unknown';
    }
  };

  const getMoodDescription = (moodIndex: number): string => {
    if (moodIndex <= 20) return 'Chill';
    if (moodIndex <= 40) return 'Relax';
    if (moodIndex <= 60) return 'Balance';
    if (moodIndex <= 80) return 'Excitation';
    return 'Excitement/Anxiety';
  };

  // Simulation functions for different vital signs
  const simulateECGData = useCallback(() => {
    const interval = setInterval(() => {
      const mockECG: ECGData = {
        wave: Array.from({length: 100}, () => Math.sin(Math.random() * Math.PI * 2) * 50),
        heartRate: 70 + Math.random() * 30,
        moodIndex: Math.floor(Math.random() * 100),
        rrInterval: 800 + Math.random() * 400,
        hrv: 20 + Math.random() * 60,
        respiratoryRate: 12 + Math.random() * 8,
        fingerDetected: Math.random() > 0.1
      };
      setEcgData(mockECG);
      
      addVitalReading({
        type: Detection.ECG,
        value: mockECG.heartRate,
        unit: 'BPM',
        timestamp: new Date(),
        quality: mockECG.fingerDetected ? 'good' : 'poor'
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const simulateBloodOxygenData = useCallback(() => {
    const interval = setInterval(() => {
      const mockOxygen: BloodOxygenData = {
        bloodOxygen: 95 + Math.random() * 5,
        heartRate: 70 + Math.random() * 30,
        fingerDetected: Math.random() > 0.1,
        waveData: Array.from({length: 50}, () => Math.random() * 100)
      };
      setBloodOxygenData(mockOxygen);
      
      addVitalReading({
        type: Detection.OX,
        value: mockOxygen.bloodOxygen,
        unit: '%',
        timestamp: new Date(),
        quality: mockOxygen.fingerDetected ? 'good' : 'poor'
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const simulateBloodPressureData = useCallback(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      const mockBP: BloodPressureData = {
        systolic: progress < 100 ? 0 : 110 + Math.random() * 30,
        diastolic: progress < 100 ? 0 : 70 + Math.random() * 20,
        heartRate: 70 + Math.random() * 30,
        progress: Math.min(progress, 100)
      };
      setBloodPressureData(mockBP);
      
      if (progress >= 100) {
        addVitalReading({
          type: Detection.BP,
          value: mockBP.systolic,
          unit: 'mmHg',
          timestamp: new Date(),
          quality: 'good'
        });
        clearInterval(interval);
        setTimeout(() => setBloodPressureData(null), 5000);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const simulateTemperatureData = useCallback(() => {
    const interval = setInterval(() => {
      const temp = 98.0 + Math.random() * 2.4;
      setTemperatureData(temp);
      
      addVitalReading({
        type: Detection.BT,
        value: temp,
        unit: '°F',
        timestamp: new Date(),
        quality: 'good'
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const simulateBatteryData = useCallback(() => {
    const interval = setInterval(() => {
      if (connectedDevice) {
        const newBattery = Math.max(0, (connectedDevice.batteryLevel || 85) - Math.random() * 0.1);
        setConnectedDevice(prev => prev ? { ...prev, batteryLevel: newBattery } : null);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [connectedDevice]);

  const simulateBloodGlucoseData = useCallback(() => {
    const interval = setInterval(() => {
      const glucose = 80 + Math.random() * 60;
      
      addVitalReading({
        type: Detection.BG,
        value: glucose,
        unit: 'mg/dL',
        timestamp: new Date(),
        quality: 'good'
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const addVitalReading = useCallback((reading: VitalReading) => {
    setVitalReadings(prev => [reading, ...prev.slice(0, 19)]); // Keep last 20 readings
  }, []);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'good': return 'text-green-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getDetectionIcon = (detection: Detection) => {
    switch (detection) {
      case Detection.ECG: return <Activity className="h-4 w-4" />;
      case Detection.OX: return <Wind className="h-4 w-4" />;
      case Detection.BP: return <Heart className="h-4 w-4" />;
      case Detection.BT: return <Thermometer className="h-4 w-4" />;
      case Detection.BATTERY: return <Battery className="h-4 w-4" />;
      case Detection.BG: return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Registration Flow */}
      <DeviceRegistrationFlow
        isDeviceConnected={!!connectedDevice}
        deviceName={connectedDevice?.name}
        deviceId={connectedDevice?.id}
        onRegistrationComplete={handleRegistrationComplete}
        onSkip={handleSkipRegistration}
      />

      {/* Device Connection Card */}
      <Card className="medical-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bluetooth className="h-5 w-5 text-medical-blue" />
              <span>HC03 Bluetooth Device Manager</span>
            </CardTitle>
            {/* Test Registration Flow Button */}
            <Button 
              onClick={() => {
                localStorage.removeItem('hc03_patient_registered');
                localStorage.removeItem('hc03_patient_id');
                localStorage.removeItem('hc03_temp_user');
                setIsPatientRegistered(false);
                setCurrentPatientId(null);
                toast({
                  title: "Registration Reset",
                  description: "Connect a device to test patient registration",
                });
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Test Registration Flow
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connectedDevice ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Device Discovery</span>
                <Button 
                  onClick={simulateDeviceDiscovery}
                  disabled={isScanning}
                  variant="outline"
                  size="sm"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="mr-2 h-4 w-4" />
                      Scan for Devices
                    </>
                  )}
                </Button>
              </div>
              
              {availableDevices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Available Devices</h4>
                  {availableDevices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-medical-blue/10 rounded-full flex items-center justify-center">
                          <Bluetooth className="h-4 w-4 text-medical-blue" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Battery: {device.batteryLevel}% | Signal: {device.signalStrength}dBm
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => connectToDevice(device)} size="sm">
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <BluetoothConnected className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {connectedDevice.name}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Connected • Battery: {Math.round(connectedDevice.batteryLevel || 0)}%
                    </p>
                  </div>
                </div>
                <Button onClick={disconnectDevice} variant="outline" size="sm">
                  <Power className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>

              {/* Patient Status */}
              {currentPatientId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Patient: {currentPatientId}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {isPatientRegistered ? 'Registered Patient' : 'Guest Mode'}
                        </p>
                      </div>
                    </div>
                    {!isPatientRegistered && (
                      <Badge variant="secondary" className="text-xs">
                        Limited Features
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Detection Controls */}
              <div>
                <h4 className="text-sm font-medium mb-3">Health Monitoring</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(Detection).map(detection => (
                    <Button
                      key={detection}
                      onClick={() => {
                        if (activeDetections.has(detection)) {
                          stopDetection(detection);
                        } else {
                          startDetection(detection);
                        }
                      }}
                      variant={activeDetections.has(detection) ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                    >
                      {getDetectionIcon(detection)}
                      <span className="ml-2">{getDetectionName(detection)}</span>
                      {activeDetections.has(detection) && (
                        <Badge className="ml-auto" variant="secondary">Active</Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Data Display */}
      {connectedDevice && (
        <>
          {/* ECG Data */}
          {ecgData && activeDetections.has(Detection.ECG) && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-500" />
                  <span>Electrocardiogram (ECG)</span>
                  {!ecgData.fingerDetected && (
                    <Badge variant="destructive" className="ml-auto">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Finger Not Detected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-red-500">{Math.round(ecgData.heartRate)}</p>
                    <p className="text-xs text-muted-foreground">Heart Rate (BPM)</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">{Math.round(ecgData.hrv)}</p>
                    <p className="text-xs text-muted-foreground">HRV (ms)</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-500">{Math.round(ecgData.respiratoryRate)}</p>
                    <p className="text-xs text-muted-foreground">Respiratory Rate</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-bold text-purple-500">{getMoodDescription(ecgData.moodIndex)}</p>
                    <p className="text-xs text-muted-foreground">Mood Index: {ecgData.moodIndex}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blood Oxygen Data */}
          {bloodOxygenData && activeDetections.has(Detection.OX) && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wind className="h-5 w-5 text-cyan-500" />
                  <span>Blood Oxygen Monitor</span>
                  {!bloodOxygenData.fingerDetected && (
                    <Badge variant="destructive" className="ml-auto">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Finger Not Detected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                    <p className="text-3xl font-bold text-cyan-600">{Math.round(bloodOxygenData.bloodOxygen)}%</p>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">Blood Oxygen</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{Math.round(bloodOxygenData.heartRate)}</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Heart Rate (BPM)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blood Pressure Data */}
          {bloodPressureData && activeDetections.has(Detection.BP) && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Blood Pressure Monitor</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Measurement Progress</span>
                    <span className="text-sm text-muted-foreground">{bloodPressureData.progress}%</span>
                  </div>
                  <Progress value={bloodPressureData.progress} className="h-2" />
                </div>
                {bloodPressureData.progress >= 100 && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">{Math.round(bloodPressureData.systolic)}</p>
                      <p className="text-xs text-muted-foreground">Systolic (mmHg)</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-500">{Math.round(bloodPressureData.diastolic)}</p>
                      <p className="text-xs text-muted-foreground">Diastolic (mmHg)</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">{Math.round(bloodPressureData.heartRate)}</p>
                      <p className="text-xs text-muted-foreground">Heart Rate (BPM)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Temperature Data */}
          {temperatureData && activeDetections.has(Detection.BT) && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5 text-amber-500" />
                  <span>Body Temperature</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <p className="text-4xl font-bold text-amber-600">{temperatureData.toFixed(1)}°F</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">Body Temperature</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Readings */}
          {vitalReadings.length > 0 && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Recent Vital Readings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {vitalReadings.map((reading, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center space-x-3">
                        {getDetectionIcon(reading.type)}
                        <div>
                          <p className="text-sm font-medium">{getDetectionName(reading.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {reading.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {reading.value.toFixed(1)} {reading.unit}
                        </p>
                        <p className={`text-xs ${getQualityColor(reading.quality)}`}>
                          {reading.quality}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}