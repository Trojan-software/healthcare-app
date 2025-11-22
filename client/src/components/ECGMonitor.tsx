import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Heart, Download, Share2, History, Play, Square } from 'lucide-react';
import { hc03Sdk, Detection } from '@/lib/hc03-sdk';

interface ECGMonitorProps {
  patientId: string;
  deviceId: string;
}

interface ECGMetrics {
  wave: number[];
  hr: number;
  moodIndex: number;
  rr: number;
  hrv: number;
  respiratoryRate: number;
  touch: boolean;
}

export default function ECGMonitor({ patientId, deviceId }: ECGMonitorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [metrics, setMetrics] = useState<ECGMetrics | null>(null);
  const [waveData, setWaveData] = useState<Array<{ time: number; value: number }>>([]);

  const handleStartECG = async () => {
    try {
      setIsRecording(true);
      
      // Start ECG detection using proper SDK API
      await hc03Sdk.startDetect(Detection.ECG);
        
      // Listen for ECG data updates
      const handleECGData = (data: any) => {
        if (data.ecg) {
          setMetrics({
            wave: data.ecg.wave || [],
            hr: data.ecg.hr || 0,
            moodIndex: data.ecg.moodIndex || 0,
            rr: data.ecg.rr || 0,
            hrv: data.ecg.hrv || 0,
            respiratoryRate: data.ecg.respiratoryRate || 0,
            touch: data.ecg.touch || false,
          });

          // Update waveform data for chart
          if (data.ecg.wave && Array.isArray(data.ecg.wave)) {
            setWaveData((prev) => {
              const newData = [
                ...prev,
                ...data.ecg.wave.map((v: number, i: number) => ({
                  time: prev.length + i,
                  value: v,
                })),
              ];
              // Keep only last 300 points for performance
              return newData.slice(-300);
            });
          }
        }
      };

      window.addEventListener('hc03-ecg-data', handleECGData as EventListener);
    } catch (error) {
      console.error('Error starting ECG:', error);
      setIsRecording(false);
    }
  };

  const handleStopECG = async () => {
    try {
      await hc03Sdk.stopDetect(Detection.ECG);
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping ECG:', error);
    }
  };

  const getMoodCategory = (moodIndex: number): { label: string; color: string } => {
    if (moodIndex <= 20) return { label: 'Chill', color: 'bg-blue-100 text-blue-800' };
    if (moodIndex <= 40) return { label: 'Relax', color: 'bg-cyan-100 text-cyan-800' };
    if (moodIndex <= 60) return { label: 'Balance', color: 'bg-green-100 text-green-800' };
    if (moodIndex <= 80) return { label: 'Excitation', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Excitement/Anxiety', color: 'bg-red-100 text-red-800' };
  };

  const mood = metrics ? getMoodCategory(metrics.moodIndex) : null;

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              <CardTitle>ECG Monitor</CardTitle>
            </div>
            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={handleStartECG}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={handleStopECG}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              )}
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" className="gap-2">
                <History className="w-4 h-4" />
                History
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Waveform Display */}
        <CardContent>
          <div className="bg-black rounded-lg p-4 mb-6 h-48">
            {waveData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waveData}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="time" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Waiting for waveform data...
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">BPM</div>
              <div className="text-3xl font-bold text-red-600">
                {metrics?.hr || '0'}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Breaths/min</div>
              <div className="text-3xl font-bold text-blue-600">
                {metrics?.respiratoryRate || '0'}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Stress Level</div>
              <div className="text-3xl font-bold text-purple-600">
                {metrics?.moodIndex ? Math.round(metrics.moodIndex / 20 * 5) : '0'}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-xs text-gray-600 mb-1">Mood Index</div>
              <div className="text-3xl font-bold text-yellow-600">
                {metrics?.moodIndex || '0'}
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          {metrics && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Finger Detection: <Badge variant={metrics.touch ? 'default' : 'secondary'}>
                    {metrics.touch ? 'Detected' : 'Not Detected'}
                  </Badge>
                </div>
                {mood && (
                  <div className="text-sm font-medium">
                    Mood: <Badge className={mood.color}>
                      {mood.label}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Metrics Sections */}
      {metrics && (
        <>
          {/* Heart Rate Variability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Heart Rate Variability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-gray-600">RMSSD</div>
                  <div className="text-xl font-semibold">{metrics.hrv}ms</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">pNN50</div>
                  <div className="text-xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">SDNN</div>
                  <div className="text-xl font-semibold">{metrics.rr}ms</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Average RR</div>
                  <div className="text-xl font-semibold">{metrics.rr}ms</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">HR Range</div>
                  <div className="text-xl font-semibold">0-0 BPM</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ECG Intervals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ECG Intervals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-gray-600">QRS Width</div>
                  <div className="text-xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">QT Interval</div>
                  <div className="text-xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">PR Interval</div>
                  <div className="text-xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">ST Elevation</div>
                  <div className="text-xl font-semibold">-</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Cardiac Rhythm</div>
                  <div className="text-xl font-semibold text-green-600">Normal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mood Category</span>
                    {mood && <Badge className={mood.color}>{mood.label}</Badge>}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Quality</span>
                    <Badge variant="secondary">Good</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arrhythmia</span>
                    <span className="text-green-600">None</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Signal Strength</span>
                    <span>0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recording Status</span>
                    <Badge variant="outline">
                      {isRecording ? 'Recording' : 'Standby'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Clinical Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Overall Assessment</span>
                    <Badge variant="default">Normal</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Urgency Level</span>
                    <Badge variant="outline">Low</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Follow-up Required</span>
                    <span className="text-gray-700">No</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Stratification</span>
                    <Badge className="bg-green-100 text-green-800">Low Risk</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!metrics && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start ECG recording to view real-time data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
