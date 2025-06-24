import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Play, Square, Fingerprint, Zap, Wind, TrendingUp } from 'lucide-react';

interface EcgWavePoint {
  timestamp: number;
  voltage: number;
  lead: string;
}

interface EcgData {
  deviceId: string;
  wavePoints: EcgWavePoint[];
  timestamp: string;
}

interface EcgStats {
  heartRate: number;
  moodIndex: number;
  moodCategory: string;
  rrInterval: number;
  rrVariability: number;
  rmssd: number;
  pnn50: number;
  sdnn: number;
  stressScore: number;
  respiratoryRate: number;
  isContactDetected: boolean;
  contactQuality: string;
  signalStrength: number;
}

interface EcgWidgetProps {
  deviceId: string;
  patientId: string;
  compact?: boolean;
  showControls?: boolean;
}

export default function EcgWidget({ deviceId, patientId, compact = false, showControls = false }: EcgWidgetProps) {
  const [ecgData, setEcgData] = useState<EcgData | null>(null);
  const [stats, setStats] = useState<EcgStats>({
    heartRate: 0,
    moodIndex: 50,
    moodCategory: 'Balance',
    rrInterval: 857,
    rrVariability: 35,
    rmssd: 42,
    pnn50: 15,
    sdnn: 48,
    stressScore: 35,
    respiratoryRate: 16,
    isContactDetected: false,
    contactQuality: 'poor',
    signalStrength: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadEcgData();
    
    // Auto-refresh every 2 seconds when recording
    const interval = setInterval(() => {
      if (isRecording) {
        loadWaveData();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [deviceId, isRecording]);

  useEffect(() => {
    if (ecgData?.wavePoints) {
      drawEcgWave();
    }
  }, [ecgData]);

  const loadEcgData = async () => {
    try {
      const response = await fetch(`/api/ecg/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.wavePoints) {
          setEcgData(data);
        }
      }
    } catch (error) {
      console.error('Error loading ECG data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWaveData = async () => {
    try {
      const response = await fetch(`/api/ecg/wave/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setEcgData(data);
      }
    } catch (error) {
      console.error('Error loading wave data:', error);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await fetch('/api/ecg/start-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, patientId })
      });
      
      // Simulate ECG session after starting
      setTimeout(async () => {
        await fetch('/api/ecg/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, patientId })
        });
        
        // Update stats with simulated data
        setStats({
          heartRate: 65 + Math.floor(Math.random() * 30),
          moodIndex: Math.floor(Math.random() * 100) + 1,
          moodCategory: getMoodCategory(Math.floor(Math.random() * 100) + 1),
          rrInterval: 800 + Math.floor(Math.random() * 200),
          rrVariability: 20 + Math.floor(Math.random() * 50),
          rmssd: 20 + Math.floor(Math.random() * 40),
          pnn50: 10 + Math.floor(Math.random() * 30),
          sdnn: 30 + Math.floor(Math.random() * 50),
          stressScore: 20 + Math.floor(Math.random() * 60),
          respiratoryRate: 12 + Math.floor(Math.random() * 8),
          isContactDetected: true,
          contactQuality: 'excellent',
          signalStrength: 90 + Math.floor(Math.random() * 10)
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting ECG recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      await fetch('/api/ecg/stop-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, patientId })
      });
      
      setIsRecording(false);
      setStats(prev => ({
        ...prev,
        isContactDetected: false,
        contactQuality: 'poor',
        signalStrength: 0
      }));
    } catch (error) {
      console.error('Error stopping ECG recording:', error);
    }
  };

  const getMoodCategory = (moodIndex: number): string => {
    if (moodIndex <= 20) return 'Chill';
    if (moodIndex <= 40) return 'Relax';
    if (moodIndex <= 60) return 'Balance';
    if (moodIndex <= 80) return 'Excitation';
    return 'Excitement/Anxiety';
  };

  const getMoodColor = (category: string): string => {
    const colors = {
      'Chill': 'bg-blue-100 text-blue-800',
      'Relax': 'bg-green-100 text-green-800',
      'Balance': 'bg-yellow-100 text-yellow-800',
      'Excitation': 'bg-orange-100 text-orange-800',
      'Excitement/Anxiety': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getContactColor = (quality: string): string => {
    const colors = {
      'excellent': 'bg-green-100 text-green-800',
      'good': 'bg-blue-100 text-blue-800',
      'fair': 'bg-yellow-100 text-yellow-800',
      'poor': 'bg-red-100 text-red-800'
    };
    return colors[quality] || 'bg-gray-100 text-gray-800';
  };

  const drawEcgWave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ecgData?.wavePoints.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw ECG waveform
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const points = ecgData.wavePoints.slice(-500); // Show last 500 points
    const maxVoltage = 1.5;
    const minVoltage = -0.5;

    points.forEach((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const normalizedVoltage = (point.voltage - minVoltage) / (maxVoltage - minVoltage);
      const y = height - (normalizedVoltage * height);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw current time marker
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 20, 0);
    ctx.lineTo(width - 20, height);
    ctx.stroke();
  };

  if (loading) {
    return (
      <Card className={compact ? 'h-48' : 'h-full'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium">
            <Activity className="w-4 h-4 mr-2 text-green-600" />
            ECG Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="h-48">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-600" />
              ECG Monitor
            </div>
            <Badge variant={isRecording ? "default" : "secondary"} 
                   className={isRecording ? "bg-green-100 text-green-800" : ""}>
              {isRecording ? 'Recording' : 'Standby'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-lg font-bold">{stats.heartRate} BPM</span>
              </div>
              <Badge variant="secondary" className={getMoodColor(stats.moodCategory)}>
                {stats.moodCategory}
              </Badge>
            </div>
            <div className="h-16 bg-gray-50 rounded flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={200} 
                height={60} 
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <Fingerprint className="w-3 h-3" />
                <span className={stats.isContactDetected ? 'text-green-600' : 'text-red-600'}>
                  {stats.isContactDetected ? 'Contact' : 'No Contact'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Wind className="w-3 h-3" />
                <span>{stats.respiratoryRate} BPM</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            ECG Monitor - {deviceId}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={stats.isContactDetected ? "default" : "destructive"} 
                   className={stats.isContactDetected ? "bg-green-100 text-green-800" : ""}>
              {stats.isContactDetected ? `Contact: ${stats.contactQuality}` : 'No Contact'}
            </Badge>
            {showControls && (
              <Button 
                onClick={isRecording ? stopRecording : startRecording}
                size="sm"
                variant={isRecording ? "destructive" : "default"}
              >
                {isRecording ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isRecording ? 'Stop' : 'Start'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* ECG Waveform */}
        <div className="mb-6">
          <div className="h-32 bg-black rounded-lg p-2">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={120} 
              className="w-full h-full"
              style={{ background: 'black' }}
            />
          </div>
        </div>

        {/* Vital Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <Heart className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold text-red-600">{stats.heartRate}</div>
            <div className="text-sm text-gray-600">BPM</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Wind className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{stats.respiratoryRate}</div>
            <div className="text-sm text-gray-600">Breaths/min</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold text-purple-600">{stats.stressScore}</div>
            <div className="text-sm text-gray-600">Stress Level</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-600">{stats.moodIndex}</div>
            <div className="text-sm text-gray-600">Mood Index</div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Heart Rate Variability</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">RMSSD</span>
                <span className="font-medium">{stats.rmssd} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">pNN50</span>
                <span className="font-medium">{stats.pnn50}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SDNN</span>
                <span className="font-medium">{stats.sdnn} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">RR Interval</span>
                <span className="font-medium">{stats.rrInterval} ms</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Status & Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mood Category</span>
                <Badge variant="secondary" className={getMoodColor(stats.moodCategory)}>
                  {stats.moodCategory}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Contact Quality</span>
                <Badge variant="secondary" className={getContactColor(stats.contactQuality)}>
                  {stats.contactQuality}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Signal Strength</span>
                <span className="font-medium">{stats.signalStrength}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recording Status</span>
                <span className={`font-medium ${isRecording ? 'text-green-600' : 'text-gray-600'}`}>
                  {isRecording ? 'Active' : 'Standby'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}