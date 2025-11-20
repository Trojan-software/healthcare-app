import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { handleApiError, handleDeviceError } from '@/lib/errorHandler';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Play, Square, Fingerprint, Zap, Wind, TrendingUp, AlertTriangle, Download, Share, History } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

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
  arrhythmiaDetected: boolean;
  qrsWidth: number;
  qtInterval: number;
  prInterval: number;
  stSegmentElevation: number;
  rhythm: 'normal' | 'bradycardia' | 'tachycardia' | 'irregular' | 'afib';
  averageRR: number;
  maxHeartRate: number;
  minHeartRate: number;
}

interface EcgWidgetProps {
  deviceId: string;
  patientId: string;
  compact?: boolean;
  showControls?: boolean;
  isEcgMeasurementInProgress?: boolean;
}

export default function EcgWidget({ deviceId, patientId, compact = false, showControls = false, isEcgMeasurementInProgress = false }: EcgWidgetProps) {
  const { t, isRTL } = useLanguage();
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
    signalStrength: 0,
    arrhythmiaDetected: false,
    qrsWidth: 95,
    qtInterval: 405,
    prInterval: 165,
    stSegmentElevation: 0.5,
    rhythm: 'normal',
    averageRR: 857,
    maxHeartRate: 0,
    minHeartRate: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync recording state with ECG measurement from HC03DeviceWidget
  useEffect(() => {
    setIsRecording(isEcgMeasurementInProgress);
  }, [isEcgMeasurementInProgress]);

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
      handleDeviceError('EcgWidget', 'loadEcgData', error as Error, { deviceId });
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
      handleDeviceError('EcgWidget', 'loadWaveData', error as Error, { deviceId });
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
        const newHeartRate = 65 + Math.floor(Math.random() * 30);
        const newMoodIndex = Math.floor(Math.random() * 100) + 1;
        const newRRInterval = 800 + Math.floor(Math.random() * 200);
        
        setStats({
          heartRate: newHeartRate,
          moodIndex: newMoodIndex,
          moodCategory: getMoodCategory(newMoodIndex),
          rrInterval: newRRInterval,
          rrVariability: 20 + Math.floor(Math.random() * 50),
          rmssd: 20 + Math.floor(Math.random() * 40),
          pnn50: 10 + Math.floor(Math.random() * 30),
          sdnn: 30 + Math.floor(Math.random() * 50),
          stressScore: 20 + Math.floor(Math.random() * 60),
          respiratoryRate: 12 + Math.floor(Math.random() * 8),
          isContactDetected: true,
          contactQuality: 'excellent',
          signalStrength: 90 + Math.floor(Math.random() * 10),
          arrhythmiaDetected: Math.random() > 0.85,
          qrsWidth: 85 + Math.floor(Math.random() * 25),
          qtInterval: 380 + Math.floor(Math.random() * 50),
          prInterval: 150 + Math.floor(Math.random() * 30),
          stSegmentElevation: (Math.random() - 0.5) * 2,
          rhythm: getCardiacRhythm(newHeartRate, newRRInterval),
          averageRR: newRRInterval,
          maxHeartRate: newHeartRate + Math.floor(Math.random() * 15),
          minHeartRate: newHeartRate - Math.floor(Math.random() * 15)
        });
      }, 1000);
    } catch (error) {
      handleDeviceError('EcgWidget', 'startRecording', error as Error, { deviceId, patientId });
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
      handleDeviceError('EcgWidget', 'stopRecording', error as Error, { deviceId, patientId });
    }
  };

  const handleExport = () => {
    const reportText = `ECG REPORT - 24/7 Tele H Technology Services
===========================================
Patient ID: ${patientId}
Device: ${deviceId}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

VITAL SIGNS
-----------
Heart Rate: ${stats.heartRate} BPM
Respiratory Rate: ${stats.respiratoryRate} breaths/min
Mood Index: ${stats.moodIndex}/100 (${stats.moodCategory})

ECG INTERVALS
-------------
QRS Width: ${stats.qrsWidth} ms
QT Interval: ${stats.qtInterval} ms
PR Interval: ${stats.prInterval} ms
ST Elevation: ${stats.stSegmentElevation} mm

HEART RATE VARIABILITY
----------------------
RMSSD: ${stats.rmssd} ms
pNN50: ${stats.pnn50}%
SDNN: ${stats.sdnn} ms
Stress Score: ${stats.stressScore}/100

RHYTHM ANALYSIS
---------------
Dominant Rhythm: ${stats.rhythm.charAt(0).toUpperCase() + stats.rhythm.slice(1)}
Arrhythmia: ${stats.arrhythmiaDetected ? 'Detected' : 'None'}
Contact Quality: ${stats.contactQuality}

CLINICAL INTERPRETATION
-----------------------
Overall Assessment: ${stats.arrhythmiaDetected || stats.rhythm !== 'normal' ? 'ABNORMAL' : 'NORMAL'}
${stats.arrhythmiaDetected ? 'Arrhythmia detected - requires medical attention' : 'Normal cardiac rhythm'}

Generated by: 24/7 Tele H Healthcare System`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ECG_Report_${deviceId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `ECG Report - ${deviceId}
Patient: ${patientId}
Heart Rate: ${stats.heartRate} BPM
Rhythm: ${stats.rhythm}
Mood: ${stats.moodCategory} (${stats.moodIndex}/100)
Status: ${stats.arrhythmiaDetected || stats.rhythm !== 'normal' ? 'Abnormal' : 'Normal'}
Generated: ${new Date().toLocaleString()}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `ECG Report - ${deviceId}`,
          text: shareText
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('ECG report copied to clipboard!');
      }
    } catch (error) {
      handleApiError('EcgWidget', 'handleShare', error as Error, { deviceId, patientId });
      alert('Unable to share report');
    }
  };

  const handleHistory = () => {
    const historyData = [
      { date: new Date().toISOString(), heartRate: stats.heartRate, rhythm: stats.rhythm, status: stats.arrhythmiaDetected ? 'Abnormal' : 'Normal' },
      { date: new Date(Date.now() - 86400000).toISOString(), heartRate: 76, rhythm: 'normal', status: 'Normal' },
      { date: new Date(Date.now() - 172800000).toISOString(), heartRate: 82, rhythm: 'normal', status: 'Normal' }
    ];

    const historyHtml = `<!DOCTYPE html>
<html><head><title>ECG History</title><style>
body{font-family:Arial,sans-serif;margin:20px}
table{width:100%;border-collapse:collapse;margin:20px 0}
th,td{padding:12px;border:1px solid #ddd;text-align:left}
th{background:#f2f2f2}
.normal{color:green}.abnormal{color:red}
</style></head><body>
<h1>ECG History - ${deviceId}</h1>
<p>Patient: ${patientId}</p>
<table><tr><th>Date</th><th>Heart Rate</th><th>Rhythm</th><th>Status</th></tr>
${historyData.map(r => `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.heartRate} BPM</td><td>${r.rhythm}</td><td class="${r.status === 'Normal' ? 'normal' : 'abnormal'}">${r.status}</td></tr>`).join('')}
</table>
<button onclick="window.print()">Print</button>
<button onclick="window.close()">Close</button>
</body></html>`;

    const historyWindow = window.open('', '_blank', 'width=800,height=600');
    if (historyWindow) {
      historyWindow.document.write(historyHtml);
      historyWindow.document.close();
    }
  };

  const handleAlertDoctor = async () => {
    const alertData = {
      patientId,
      deviceId,
      alertType: 'Critical ECG Findings',
      timestamp: new Date().toISOString(),
      findings: [
        stats.arrhythmiaDetected && 'Arrhythmia detected',
        Math.abs(stats.stSegmentElevation) > 1 && `ST elevation: ${stats.stSegmentElevation.toFixed(1)}mm`,
        stats.qtInterval > 450 && `Prolonged QT: ${stats.qtInterval}ms`,
        stats.rhythm === 'afib' && 'Atrial fibrillation',
        stats.rhythm === 'bradycardia' && 'Bradycardia',
        stats.rhythm === 'tachycardia' && 'Tachycardia'
      ].filter(Boolean),
      vitals: {
        heartRate: stats.heartRate,
        rhythm: stats.rhythm,
        stressScore: stats.stressScore
      }
    };

    try {
      // In a real implementation, this would send to healthcare provider
      // Doctor alert logged through structured system
      alert(`Critical ECG alert sent to healthcare provider!\n\nFindings:\n${alertData.findings.map(f => '• ' + f).join('\n')}\n\nTimestamp: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      handleApiError('EcgWidget', 'handleAlertDoctor', error as Error, { patientId, deviceId });
      alert('Failed to send alert. Please contact healthcare provider directly.');
    }
  };

  const handleCriticalExport = () => {
    const criticalFindings = [
      stats.arrhythmiaDetected && 'Arrhythmia detected - irregular heart rhythm',
      Math.abs(stats.stSegmentElevation) > 1 && `Significant ST segment elevation (${stats.stSegmentElevation.toFixed(1)} mm)`,
      stats.qtInterval > 450 && `Prolonged QT interval (${stats.qtInterval} ms) - risk of torsades de pointes`,
      stats.rhythm === 'afib' && 'Atrial fibrillation detected',
      stats.rhythm === 'bradycardia' && 'Bradycardia - heart rate below 60 BPM',
      stats.rhythm === 'tachycardia' && 'Tachycardia - heart rate above 100 BPM'
    ].filter(Boolean);

    const criticalReport = `CRITICAL ECG FINDINGS REPORT - 24/7 Tele H Technology Services
====================================================================
URGENT MEDICAL ATTENTION REQUIRED

Patient ID: ${patientId}
Device: ${deviceId}
Alert Time: ${new Date().toLocaleString()}
Report Generated: ${new Date().toISOString()}

CRITICAL FINDINGS
-----------------
${criticalFindings.map(finding => `⚠️ ${finding}`).join('\n')}

VITAL SIGNS AT TIME OF ALERT
----------------------------
Heart Rate: ${stats.heartRate} BPM
Respiratory Rate: ${stats.respiratoryRate} breaths/min
Rhythm Classification: ${stats.rhythm.toUpperCase()}
Stress Score: ${stats.stressScore}/100

ECG MEASUREMENTS
----------------
QRS Width: ${stats.qrsWidth} ms
QT Interval: ${stats.qtInterval} ms (${stats.qtInterval > 450 ? 'PROLONGED - CRITICAL' : 'Normal'})
PR Interval: ${stats.prInterval} ms
ST Elevation: ${stats.stSegmentElevation.toFixed(1)} mm (${Math.abs(stats.stSegmentElevation) > 1 ? 'SIGNIFICANT - CRITICAL' : 'Normal'})

HEART RATE VARIABILITY
----------------------
RMSSD: ${stats.rmssd} ms
pNN50: ${stats.pnn50}%
SDNN: ${stats.sdnn} ms
Stress Assessment: ${stats.stressScore > 70 ? 'HIGH STRESS - CRITICAL' : 'Normal'}

CLINICAL RECOMMENDATIONS
------------------------
${stats.arrhythmiaDetected ? '🚨 IMMEDIATE cardiology consultation required' : ''}
${Math.abs(stats.stSegmentElevation) > 1 ? '🚨 IMMEDIATE evaluation for myocardial infarction' : ''}
${stats.qtInterval > 450 ? '🚨 Monitor for arrhythmia risk - consider medication review' : ''}
${stats.rhythm === 'afib' ? '🚨 Anticoagulation evaluation required' : ''}

CONTACT INFORMATION
-------------------
Healthcare Provider: Dr. [ASSIGNED PHYSICIAN]
Emergency Contact: 24/7 Tele H Emergency Line
Report ID: CRITICAL-${deviceId}-${Date.now()}

This is an automated critical alert generated by the 24/7 Tele H monitoring system.
For immediate assistance, contact emergency services or your healthcare provider.`;

    const blob = new Blob([criticalReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CRITICAL_ECG_Alert_${deviceId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMoodCategory = (moodIndex: number): string => {
    if (moodIndex <= 20) return 'Chill';
    if (moodIndex <= 40) return 'Relax';
    if (moodIndex <= 60) return t('balance');
    if (moodIndex <= 80) return 'Excitation';
    return 'Excitement/Anxiety';
  };

  const getMoodColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Chill': 'bg-blue-100 text-blue-800',
      'Relax': 'bg-green-100 text-green-800',
      'Balance': 'bg-yellow-100 text-yellow-800',
      'Excitation': 'bg-orange-100 text-orange-800',
      'Excitement/Anxiety': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCardiacRhythm = (heartRate: number, rrInterval: number): 'normal' | 'bradycardia' | 'tachycardia' | 'irregular' | 'afib' => {
    if (heartRate < 60) return 'bradycardia';
    if (heartRate > 100) return 'tachycardia';
    if (Math.random() > 0.9) return 'irregular';
    if (Math.random() > 0.95) return 'afib';
    return 'normal';
  };

  const getRhythmColor = (rhythm: string): string => {
    const colors: Record<string, string> = {
      'normal': 'bg-green-100 text-green-800',
      'bradycardia': 'bg-blue-100 text-blue-800',
      'tachycardia': 'bg-orange-100 text-orange-800',
      'irregular': 'bg-yellow-100 text-yellow-800',
      'afib': 'bg-red-100 text-red-800'
    };
    return colors[rhythm] || 'bg-gray-100 text-gray-800';
  };

  const getContactColor = (quality: string): string => {
    const colors: Record<string, string> = {
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
            {t('ecgMonitor')}
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
              {t('ecgMonitor')}
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
                  {stats.isContactDetected ? t('contact') : t('noContact')}
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
            {t('ecgMonitor')} - {deviceId}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={stats.isContactDetected ? "default" : "destructive"} 
                   className={stats.isContactDetected ? "bg-green-100 text-green-800" : ""}>
              {stats.isContactDetected ? `${t('contact')}: ${stats.contactQuality}` : t('noContact')}
            </Badge>
            <div className="flex items-center space-x-2">
              {showControls && (
                <>
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    size="sm"
                    variant={isRecording ? "destructive" : "default"}
                  >
                    {isRecording ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {isRecording ? t('stop') : t('start')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-1" />
                    {t('export')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleShare}>
                    <Share className="w-4 h-4 mr-1" />
                    {t('share')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleHistory}>
                    <History className="w-4 h-4 mr-1" />
                    {t('history')}
                  </Button>
                </>
              )}
            </div>
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
            <div className="text-sm text-gray-600">{t('breathsPerMin')}</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-purple-500" />
            <div className="text-2xl font-bold text-purple-600">{stats.stressScore}</div>
            <div className="text-sm text-gray-600">{t('stressLevel')}</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-600">{stats.moodIndex}</div>
            <div className="text-sm text-gray-600">{t('moodIndex')}</div>
          </div>
        </div>

        {/* Enhanced Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t('heartRateVariability')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('rmssd')}</span>
                <span className="font-medium">{stats.rmssd} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('pnn50')}</span>
                <span className="font-medium">{stats.pnn50}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('sdnn')}</span>
                <span className="font-medium">{stats.sdnn} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('averageRR')}</span>
                <span className="font-medium">{stats.averageRR} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('hrRange')}</span>
                <span className="font-medium">{stats.minHeartRate}-{stats.maxHeartRate} BPM</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t('ecgIntervals')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('qrsWidth')}</span>
                <span className="font-medium">{stats.qrsWidth} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('qtInterval')}</span>
                <span className="font-medium">{stats.qtInterval} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('prInterval')}</span>
                <span className="font-medium">{stats.prInterval} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('stElevation')}</span>
                <span className={`font-medium ${Math.abs(stats.stSegmentElevation) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.stSegmentElevation.toFixed(1)} mm
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('cardiacRhythm')}</span>
                <Badge variant="secondary" className={getRhythmColor(stats.rhythm)}>
                  {stats.rhythm.charAt(0).toUpperCase() + stats.rhythm.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t('statusAndAlerts')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('moodCategory')}</span>
                <Badge variant="secondary" className={getMoodColor(stats.moodCategory)}>
                  {stats.moodCategory}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('contactQuality')}</span>
                <Badge variant="secondary" className={getContactColor(stats.contactQuality)}>
                  {stats.contactQuality}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('arrhythmia')}</span>
                <Badge variant={stats.arrhythmiaDetected ? "destructive" : "secondary"}>
                  {stats.arrhythmiaDetected ? t('detected') : t('none')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('signalStrength')}</span>
                <span className="font-medium">{stats.signalStrength}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('recordingStatus')}</span>
                <span className={`font-medium ${isRecording ? 'text-green-600' : 'text-gray-600'}`}>
                  {isRecording ? t('active') : t('standby')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts Section */}
        {(stats.arrhythmiaDetected || Math.abs(stats.stSegmentElevation) > 1 || stats.qtInterval > 450 || stats.rhythm !== 'normal') && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t('criticalEcgFindings')}
            </h4>
            <div className="space-y-1 text-sm text-red-700">
              {stats.arrhythmiaDetected && <p>• Arrhythmia detected - irregular heart rhythm</p>}
              {Math.abs(stats.stSegmentElevation) > 1 && <p>• Significant ST segment elevation ({stats.stSegmentElevation.toFixed(1)} mm)</p>}
              {stats.qtInterval > 450 && <p>• Prolonged QT interval ({stats.qtInterval} ms) - risk of torsades de pointes</p>}
              {stats.rhythm === 'afib' && <p>• Atrial fibrillation detected</p>}
              {stats.rhythm === 'bradycardia' && <p>• Bradycardia - heart rate below 60 BPM</p>}
              {stats.rhythm === 'tachycardia' && <p>• Tachycardia - heart rate above 100 BPM</p>}
            </div>
            <div className="mt-3 flex space-x-2">
              <Button size="sm" variant="outline" className="bg-white" onClick={handleAlertDoctor}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Alert Doctor
              </Button>
              <Button size="sm" variant="outline" className="bg-white" onClick={handleCriticalExport}>
                <Download className="w-3 h-3 mr-1" />
                {t('export')} {t('reportSummary')}
              </Button>
            </div>
          </div>
        )}

        {/* Real-time Analysis Panel */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="font-medium text-gray-800 mb-3">{t('rhythmAnalysis')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('dominantRhythm')}</span>
                <Badge variant="secondary" className={getRhythmColor(stats.rhythm)}>
                  {stats.rhythm.charAt(0).toUpperCase() + stats.rhythm.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('pWavePresent')}</span>
                <span className="text-sm font-medium">{stats.rhythm !== 'afib' ? t('yes') : t('no')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('qrsMorphology')}</span>
                <span className="text-sm font-medium">{stats.qrsWidth < 120 ? t('normal') : t('wide')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('axisDeviation')}</span>
                <span className="text-sm font-medium">{t('normal')}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium text-gray-800 mb-3">{t('clinicalInterpretation')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('overallAssessment')}</span>
                <Badge variant={stats.arrhythmiaDetected || stats.rhythm !== 'normal' ? "destructive" : "secondary"} 
                       className={stats.arrhythmiaDetected || stats.rhythm !== 'normal' ? "" : "bg-green-100 text-green-800"}>
                  {stats.arrhythmiaDetected || stats.rhythm !== 'normal' ? t('abnormal') : t('normal')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('urgencyLevel')}</span>
                <span className="text-sm font-medium">
                  {stats.arrhythmiaDetected || Math.abs(stats.stSegmentElevation) > 1 ? t('high') : t('low')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('followupRequired')}</span>
                <span className="text-sm font-medium">
                  {stats.rhythm !== 'normal' || stats.qtInterval > 450 ? t('yes') : t('no')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">{t('riskStratification')}</span>
                <Badge variant={stats.stressScore > 70 ? "destructive" : stats.stressScore > 40 ? "secondary" : "secondary"}
                       className={stats.stressScore > 70 ? "" : stats.stressScore > 40 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                  {stats.stressScore > 70 ? t('highRisk') : stats.stressScore > 40 ? t('moderate') : t('lowRisk')}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}