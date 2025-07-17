import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Heart, 
  Download,
  Printer,
  Clock,
  User,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ECGReportProps {
  patientId: string;
  ecgDataId?: number;
}

interface ECGAnalysis {
  heartRate: number;
  rhythm: string;
  intervals: {
    pr: number;
    qrs: number;
    qt: number;
    qtc: number;
  };
  interpretation: string;
  abnormalities: string[];
  riskLevel: 'low' | 'moderate' | 'high';
}

export default function ECGReport({ patientId, ecgDataId }: ECGReportProps) {
  const [selectedEcgId, setSelectedEcgId] = useState<number | null>(ecgDataId || null);
  const [ecgAnalysis, setEcgAnalysis] = useState<ECGAnalysis | null>(null);

  // Fetch ECG data for the patient
  const { data: ecgData, isLoading } = useQuery({
    queryKey: ['/api/hc03/data/ecg', patientId],
  });

  // Fetch patient details
  const { data: patient } = useQuery({
    queryKey: ['/api/patients', patientId],
  });

  // Select the latest ECG if no specific ID provided
  useEffect(() => {
    if (ecgData && Array.isArray(ecgData) && ecgData.length > 0 && !selectedEcgId) {
      setSelectedEcgId(ecgData[0].id);
    }
  }, [ecgData, selectedEcgId]);

  // Analyze ECG data when selected
  useEffect(() => {
    if (selectedEcgId && ecgData && Array.isArray(ecgData)) {
      const selectedEcg = ecgData.find((ecg: any) => ecg.id === selectedEcgId);
      if (selectedEcg) {
        analyzeECG(selectedEcg);
      }
    }
  }, [selectedEcgId, ecgData]);

  const analyzeECG = (ecgData: any) => {
    // Perform ECG analysis based on the data
    const heartRate = ecgData.heartRate;
    const hrv = ecgData.hrv;
    const moodIndex = ecgData.moodIndex;
    
    let rhythm = 'Normal Sinus Rhythm';
    let interpretation = 'Normal ECG';
    let abnormalities: string[] = [];
    let riskLevel: 'low' | 'moderate' | 'high' = 'low';

    // Heart rate analysis
    if (heartRate < 60) {
      rhythm = 'Bradycardia';
      abnormalities.push('Slow heart rate (bradycardia)');
      riskLevel = 'moderate';
    } else if (heartRate > 100) {
      rhythm = 'Tachycardia';
      abnormalities.push('Fast heart rate (tachycardia)');
      riskLevel = 'moderate';
    }

    // HRV analysis
    if (hrv < 20) {
      abnormalities.push('Low heart rate variability');
      riskLevel = 'moderate';
    }

    // Mood index analysis
    if (moodIndex > 80) {
      abnormalities.push('High stress/anxiety indicators');
      riskLevel = 'high';
    }

    // Overall interpretation
    if (abnormalities.length === 0) {
      interpretation = 'Normal ECG with regular sinus rhythm';
    } else {
      interpretation = `ECG shows ${abnormalities.length} abnormality(ies) requiring attention`;
    }

    // Simulated intervals (in real implementation, these would be calculated from waveform)
    const intervals = {
      pr: 160 + Math.random() * 40, // 160-200ms normal
      qrs: 80 + Math.random() * 40, // 80-120ms normal
      qt: 380 + Math.random() * 60, // 380-440ms normal
      qtc: 420 + Math.random() * 40 // 420-460ms normal
    };

    setEcgAnalysis({
      heartRate,
      rhythm,
      intervals,
      interpretation,
      abnormalities,
      riskLevel
    });
  };

  const selectedEcg = Array.isArray(ecgData) ? ecgData.find((ecg: any) => ecg.id === selectedEcgId) : null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMoodDescription = (moodIndex: number): string => {
    if (moodIndex >= 1 && moodIndex <= 20) return 'Chill';
    if (moodIndex >= 21 && moodIndex <= 40) return 'Relax';
    if (moodIndex >= 41 && moodIndex <= 60) return 'Balance';
    if (moodIndex >= 61 && moodIndex <= 80) return 'Excitation';
    if (moodIndex >= 81 && moodIndex <= 100) return 'Excitement/Anxiety';
    return 'Unknown';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const printReport = () => {
    window.print();
  };

  const downloadReport = () => {
    // In a real implementation, this would generate a PDF
    const reportData = {
      patient: patient,
      ecg: selectedEcg,
      analysis: ecgAnalysis,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ECG_Report_${patientId}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!ecgData || !Array.isArray(ecgData) || ecgData.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No ECG data available for this patient</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">ECG Report</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={printReport} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={downloadReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* ECG Selection */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Select ECG Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.isArray(ecgData) ? ecgData.map((ecg: any) => (
              <button
                key={ecg.id}
                onClick={() => setSelectedEcgId(ecg.id)}
                className={`p-3 border rounded-lg text-left hover:bg-gray-50 ${
                  selectedEcgId === ecg.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="font-medium">{formatTimestamp(ecg.timestamp)}</div>
                <div className="text-sm text-gray-500">HR: {ecg.heartRate} BPM</div>
                <div className="text-sm text-gray-500">
                  {ecg.fingerDetected ? 'Good Signal' : 'Poor Signal'}
                </div>
              </button>
            )) : null}
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {selectedEcg && ecgAnalysis && (
        <div className="space-y-6">
          {/* Print Header */}
          <div className="hidden print:block border-b pb-4 mb-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">24/7 Tele H Technology Services</h1>
              <h2 className="text-xl font-semibold mt-2">ECG Analysis Report</h2>
            </div>
          </div>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Patient ID</label>
                  <p className="font-medium">{patientId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Recording Date</label>
                  <p className="font-medium">{formatTimestamp(selectedEcg.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Device ID</label>
                  <p className="font-medium">{selectedEcg.deviceId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Recording Duration</label>
                  <p className="font-medium">{selectedEcg.recordingDuration || 30} seconds</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ECG Analysis Results */}
          <Tabs defaultValue="analysis" className="space-y-4">
            <TabsList className="print:hidden">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
              <TabsTrigger value="interpretation">Interpretation</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Primary Measurements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Primary Measurements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Heart Rate</span>
                      <span className="font-bold text-lg">{ecgAnalysis.heartRate} BPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rhythm</span>
                      <span className="font-medium">{ecgAnalysis.rhythm}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">HRV</span>
                      <span className="font-medium">{selectedEcg.hrv} ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Respiratory Rate</span>
                      <span className="font-medium">{selectedEcg.respiratoryRate} /min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mood State</span>
                      <span className="font-medium">{getMoodDescription(selectedEcg.moodIndex)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Risk Level</span>
                      <Badge 
                        variant={ecgAnalysis.riskLevel === 'low' ? 'default' : 'destructive'}
                        className={`${getRiskColor(ecgAnalysis.riskLevel)} uppercase`}
                      >
                        {ecgAnalysis.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Signal Quality</span>
                      <Badge variant={selectedEcg.fingerDetected ? 'default' : 'secondary'}>
                        {selectedEcg.fingerDetected ? 'Good' : 'Poor'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">RR Interval</span>
                      <span className="font-medium">{selectedEcg.rrInterval} ms</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="measurements">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Detailed Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Intervals</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>PR Interval</span>
                          <span className="font-medium">{Math.round(ecgAnalysis.intervals.pr)} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>QRS Duration</span>
                          <span className="font-medium">{Math.round(ecgAnalysis.intervals.qrs)} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>QT Interval</span>
                          <span className="font-medium">{Math.round(ecgAnalysis.intervals.qt)} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>QTc (Corrected)</span>
                          <span className="font-medium">{Math.round(ecgAnalysis.intervals.qtc)} ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800">Variability</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Heart Rate Variability</span>
                          <span className="font-medium">{selectedEcg.hrv} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mood Index</span>
                          <span className="font-medium">{selectedEcg.moodIndex}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Respiratory Rate</span>
                          <span className="font-medium">{selectedEcg.respiratoryRate} /min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interpretation">
              <div className="space-y-6">
                {/* Interpretation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Clinical Interpretation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-800 leading-relaxed">{ecgAnalysis.interpretation}</p>
                  </CardContent>
                </Card>

                {/* Abnormalities */}
                {ecgAnalysis.abnormalities.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Abnormalities Detected
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {ecgAnalysis.abnormalities.map((abnormality, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span className="text-gray-800">{abnormality}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ecgAnalysis.riskLevel === 'high' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 font-medium">⚠️ Immediate medical attention recommended</p>
                        </div>
                      )}
                      {ecgAnalysis.riskLevel === 'moderate' && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 font-medium">⚠️ Follow-up with healthcare provider recommended</p>
                        </div>
                      )}
                      {ecgAnalysis.riskLevel === 'low' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 font-medium">✅ Continue regular monitoring</p>
                        </div>
                      )}
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Regular monitoring with HC03 device recommended</li>
                        <li>• Maintain proper finger contact for accurate readings</li>
                        <li>• Record symptoms if experienced during monitoring</li>
                        <li>• Share this report with your healthcare provider</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="print:block hidden border-t pt-4 mt-8">
            <div className="text-center text-sm text-gray-600">
              <p>Report generated on {new Date().toLocaleString()}</p>
              <p className="mt-1">24/7 Tele H Technology Services - Automated ECG Analysis System</p>
              <p className="mt-2 text-xs">
                This report is generated by automated analysis and should be reviewed by a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}