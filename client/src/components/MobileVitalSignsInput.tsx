import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Smartphone, 
  Heart, 
  Thermometer, 
  Wind, 
  Activity,
  Zap,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface VitalSignsData {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
  bloodGlucose?: number;
}

interface DeviceReading {
  type: string;
  value: number;
  unit: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  timestamp: Date;
  deviceConnected: boolean;
}

export default function MobileVitalSignsInput() {
  const [vitals, setVitals] = useState<VitalSignsData>({});
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [currentReading, setCurrentReading] = useState<DeviceReading | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate HC03 device connection status
  useEffect(() => {
    const checkConnection = setInterval(() => {
      // Simulate device connection status
      setIsDeviceConnected(Math.random() > 0.3);
    }, 5000);

    return () => clearInterval(checkConnection);
  }, []);

  const recordVitalsMutation = useMutation({
    mutationFn: async (vitalsData: VitalSignsData) => {
      const response = await apiRequest('POST', '/api/vital-signs', vitalsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      
      toast({
        title: "Vitals Recorded",
        description: "Vital signs have been saved successfully",
      });
      
      // Clear form after successful save
      setVitals({});
      setCurrentReading(null);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save vital signs",
        variant: "destructive",
      });
    },
  });

  const simulateDeviceReading = async (type: string) => {
    setIsReading(true);
    setReadingProgress(0);
    
    // Simulate reading progress
    const progressInterval = setInterval(() => {
      setReadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Wait for progress to complete
    await new Promise(resolve => setTimeout(resolve, 2200));
    
    let reading: DeviceReading;
    let vitalUpdate: Partial<VitalSignsData> = {};

    switch (type) {
      case 'heartRate':
        const hr = 60 + Math.random() * 40;
        reading = {
          type: 'Heart Rate',
          value: hr,
          unit: 'BPM',
          quality: hr > 100 || hr < 60 ? 'poor' : 'good',
          timestamp: new Date(),
          deviceConnected: isDeviceConnected
        };
        vitalUpdate.heartRate = Math.round(hr);
        break;
        
      case 'bloodPressure':
        const systolic = 110 + Math.random() * 30;
        const diastolic = 70 + Math.random() * 20;
        reading = {
          type: 'Blood Pressure',
          value: systolic,
          unit: 'mmHg',
          quality: systolic > 140 || diastolic > 90 ? 'poor' : 'good',
          timestamp: new Date(),
          deviceConnected: isDeviceConnected
        };
        vitalUpdate.bloodPressureSystolic = Math.round(systolic);
        vitalUpdate.bloodPressureDiastolic = Math.round(diastolic);
        break;
        
      case 'temperature':
        const temp = 98.0 + Math.random() * 2.4;
        reading = {
          type: 'Body Temperature',
          value: temp,
          unit: '°F',
          quality: temp > 100.4 || temp < 96.8 ? 'poor' : 'good',
          timestamp: new Date(),
          deviceConnected: isDeviceConnected
        };
        vitalUpdate.temperature = Math.round(temp * 10) / 10;
        break;
        
      case 'oxygen':
        const oxygen = 95 + Math.random() * 5;
        reading = {
          type: 'Blood Oxygen',
          value: oxygen,
          unit: '%',
          quality: oxygen < 95 ? 'poor' : 'excellent',
          timestamp: new Date(),
          deviceConnected: isDeviceConnected
        };
        vitalUpdate.oxygenLevel = Math.round(oxygen);
        break;
        
      case 'glucose':
        const glucose = 80 + Math.random() * 60;
        reading = {
          type: 'Blood Glucose',
          value: glucose,
          unit: 'mg/dL',
          quality: glucose > 140 || glucose < 70 ? 'poor' : 'good',
          timestamp: new Date(),
          deviceConnected: isDeviceConnected
        };
        vitalUpdate.bloodGlucose = Math.round(glucose);
        break;
        
      default:
        return;
    }

    setCurrentReading(reading);
    setVitals(prev => ({ ...prev, ...vitalUpdate }));
    setIsReading(false);
    setReadingProgress(0);

    toast({
      title: "Reading Complete",
      description: `${reading.type}: ${reading.value} ${reading.unit}`,
    });
  };

  const handleManualInput = (field: keyof VitalSignsData, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setVitals(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleSave = () => {
    if (Object.keys(vitals).length === 0) {
      toast({
        title: "No Data",
        description: "Please take some readings or enter values manually",
        variant: "destructive",
      });
      return;
    }
    
    recordVitalsMutation.mutate(vitals);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-400';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fair':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-medical-blue" />
            <span>Mobile Vital Signs Monitor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={`${isDeviceConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
              {isDeviceConnected ? 'Device Connected' : 'Device Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Reading Display */}
        {currentReading && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Latest Reading</h4>
              {getQualityIcon(currentReading.quality)}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {currentReading.value} {currentReading.unit}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{currentReading.type}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getQualityColor(currentReading.quality)}`}>
                  {currentReading.quality}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {currentReading.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reading Progress */}
        {isReading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taking measurement...</span>
              <span className="text-sm text-muted-foreground">{readingProgress}%</span>
            </div>
            <Progress value={readingProgress} className="h-2" />
          </div>
        )}

        {/* Device Reading Buttons */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">HC03 Device Readings</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => simulateDeviceReading('heartRate')}
              disabled={isReading || !isDeviceConnected}
              variant="outline"
              className="flex items-center space-x-2 h-auto p-4"
            >
              <Heart className="h-5 w-5 text-red-500" />
              <div className="text-left">
                <p className="font-medium">Heart Rate</p>
                <p className="text-xs text-muted-foreground">ECG Monitor</p>
              </div>
            </Button>

            <Button
              onClick={() => simulateDeviceReading('bloodPressure')}
              disabled={isReading || !isDeviceConnected}
              variant="outline"
              className="flex items-center space-x-2 h-auto p-4"
            >
              <Activity className="h-5 w-5 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">Blood Pressure</p>
                <p className="text-xs text-muted-foreground">Cuff Monitor</p>
              </div>
            </Button>

            <Button
              onClick={() => simulateDeviceReading('temperature')}
              disabled={isReading || !isDeviceConnected}
              variant="outline"
              className="flex items-center space-x-2 h-auto p-4"
            >
              <Thermometer className="h-5 w-5 text-amber-500" />
              <div className="text-left">
                <p className="font-medium">Temperature</p>
                <p className="text-xs text-muted-foreground">IR Sensor</p>
              </div>
            </Button>

            <Button
              onClick={() => simulateDeviceReading('oxygen')}
              disabled={isReading || !isDeviceConnected}
              variant="outline"
              className="flex items-center space-x-2 h-auto p-4"
            >
              <Wind className="h-5 w-5 text-cyan-500" />
              <div className="text-left">
                <p className="font-medium">Blood Oxygen</p>
                <p className="text-xs text-muted-foreground">SpO2 Sensor</p>
              </div>
            </Button>

            <Button
              onClick={() => simulateDeviceReading('glucose')}
              disabled={isReading || !isDeviceConnected}
              variant="outline"
              className="flex items-center space-x-2 h-auto p-4 col-span-2"
            >
              <Zap className="h-5 w-5 text-purple-500" />
              <div className="text-left">
                <p className="font-medium">Blood Glucose</p>
                <p className="text-xs text-muted-foreground">Test Strip Required</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Manual Input Section */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-foreground">Manual Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="heartRate">Heart Rate (BPM)</Label>
              <Input
                id="heartRate"
                type="number"
                placeholder="72"
                value={vitals.heartRate || ''}
                onChange={(e) => handleManualInput('heartRate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="temperature">Temperature (°F)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="98.6"
                value={vitals.temperature || ''}
                onChange={(e) => handleManualInput('temperature', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="systolic">Systolic BP (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                value={vitals.bloodPressureSystolic || ''}
                onChange={(e) => handleManualInput('bloodPressureSystolic', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="diastolic">Diastolic BP (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                value={vitals.bloodPressureDiastolic || ''}
                onChange={(e) => handleManualInput('bloodPressureDiastolic', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="oxygen">Blood Oxygen (%)</Label>
              <Input
                id="oxygen"
                type="number"
                placeholder="98"
                value={vitals.oxygenLevel || ''}
                onChange={(e) => handleManualInput('oxygenLevel', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="glucose">Blood Glucose (mg/dL)</Label>
              <Input
                id="glucose"
                type="number"
                placeholder="100"
                value={vitals.bloodGlucose || ''}
                onChange={(e) => handleManualInput('bloodGlucose', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Current Values Summary */}
        {Object.keys(vitals).length > 0 && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-foreground">Current Session Values</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {vitals.heartRate && (
                <div className="flex justify-between">
                  <span>Heart Rate:</span>
                  <span className="font-medium">{vitals.heartRate} BPM</span>
                </div>
              )}
              {vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic && (
                <div className="flex justify-between">
                  <span>Blood Pressure:</span>
                  <span className="font-medium">{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic} mmHg</span>
                </div>
              )}
              {vitals.temperature && (
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span className="font-medium">{vitals.temperature}°F</span>
                </div>
              )}
              {vitals.oxygenLevel && (
                <div className="flex justify-between">
                  <span>Blood Oxygen:</span>
                  <span className="font-medium">{vitals.oxygenLevel}%</span>
                </div>
              )}
              {vitals.bloodGlucose && (
                <div className="flex justify-between">
                  <span>Blood Glucose:</span>
                  <span className="font-medium">{vitals.bloodGlucose} mg/dL</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={recordVitalsMutation.isPending || Object.keys(vitals).length === 0}
          className="w-full btn-medical"
        >
          {recordVitalsMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Vital Signs
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}