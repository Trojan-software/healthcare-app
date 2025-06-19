import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Download,
  FileText,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
// Removed PDF imports - using text export instead

interface WeeklyReportData {
  patientId: string;
  patientName: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  vitalSigns: {
    heartRate: {
      average: number;
      min: number;
      max: number;
      readings: number;
      trend: 'up' | 'down' | 'stable';
    };
    bloodPressure: {
      systolic: { average: number; min: number; max: number; };
      diastolic: { average: number; min: number; max: number; };
      readings: number;
      trend: 'up' | 'down' | 'stable';
    };
    bloodOxygen: {
      average: number;
      min: number;
      max: number;
      readings: number;
      trend: 'up' | 'down' | 'stable';
    };
    temperature: {
      average: number;
      min: number;
      max: number;
      readings: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  checkups: {
    scheduled: number;
    completed: number;
    missed: number;
  };
  alerts: {
    critical: number;
    warning: number;
    resolved: number;
  };
  compliance: {
    rate: number;
    missedReadings: number;
    deviceUptime: number;
  };
}

export default function WeeklyReportDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedVitalType, setSelectedVitalType] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState('all');

  // Fetch weekly report data
  const { data: weeklyReport, isLoading } = useQuery({
    queryKey: ['/api/reports/weekly', dateRange, selectedVitalType, selectedPatient],
    refetchInterval: 60000,
  });

  // Fetch patients list for filter
  const { data: patients } = useQuery({
    queryKey: ['/api/admin/patients-list'],
  });

  const allReportData: WeeklyReportData[] = (weeklyReport as WeeklyReportData[]) || [
    {
      patientId: 'PAT001',
      patientName: 'Sarah Johnson',
      reportPeriod: {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      vitalSigns: {
        heartRate: { average: 78, min: 65, max: 95, readings: 42, trend: 'stable' },
        bloodPressure: { 
          systolic: { average: 125, min: 110, max: 140 },
          diastolic: { average: 82, min: 70, max: 95 },
          readings: 42, 
          trend: 'stable' 
        },
        bloodOxygen: { average: 97.8, min: 95, max: 99, readings: 42, trend: 'stable' },
        temperature: { average: 36.7, min: 36.2, max: 37.4, readings: 42, trend: 'stable' }
      },
      checkups: { scheduled: 7, completed: 6, missed: 1 },
      alerts: { critical: 0, warning: 2, resolved: 5 },
      compliance: { rate: 92.3, missedReadings: 6, deviceUptime: 94.2 }
    }
  ];

  // Filter report data based on selected patient
  const filteredReportData = allReportData.filter(report => {
    if (selectedPatient === 'all') return true;
    return report.patientId === selectedPatient;
  });

  // Helper function to get vital sign data based on selected type
  const getVitalSignData = (report: WeeklyReportData) => {
    switch (selectedVitalType) {
      case 'heartRate':
        return {
          name: 'Heart Rate',
          data: report.vitalSigns.heartRate,
          unit: 'BPM',
          icon: '❤️',
          average: report.vitalSigns.heartRate.average,
          range: `${report.vitalSigns.heartRate.min}-${report.vitalSigns.heartRate.max}`,
          readings: report.vitalSigns.heartRate.readings
        };
      case 'bloodPressure':
        return {
          name: 'Blood Pressure',
          data: report.vitalSigns.bloodPressure,
          unit: 'mmHg',
          icon: '🩸',
          average: `${report.vitalSigns.bloodPressure.systolic.average}/${report.vitalSigns.bloodPressure.diastolic.average}`,
          range: `${report.vitalSigns.bloodPressure.systolic.min}-${report.vitalSigns.bloodPressure.systolic.max}/${report.vitalSigns.bloodPressure.diastolic.min}-${report.vitalSigns.bloodPressure.diastolic.max}`,
          readings: report.vitalSigns.bloodPressure.readings
        };
      case 'bloodOxygen':
        return {
          name: 'Blood Oxygen',
          data: report.vitalSigns.bloodOxygen,
          unit: '%',
          icon: '🫁',
          average: report.vitalSigns.bloodOxygen.average,
          range: `${report.vitalSigns.bloodOxygen.min}-${report.vitalSigns.bloodOxygen.max}`,
          readings: report.vitalSigns.bloodOxygen.readings
        };
      case 'temperature':
        return {
          name: 'Temperature',
          data: report.vitalSigns.temperature,
          unit: '°C',
          icon: '🌡️',
          average: report.vitalSigns.temperature.average,
          range: `${report.vitalSigns.temperature.min}-${report.vitalSigns.temperature.max}`,
          readings: report.vitalSigns.temperature.readings
        };
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleString();
    const exportDate = new Date().toISOString().split('T')[0];
    
    // PDF Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('24/7 TELE H TECHNOLOGY SERVICES', 20, 20);
    doc.setFontSize(14);
    doc.text('Weekly Health Reports', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Export Date: ${currentDate}`, 20, 40);
    doc.text(`Filters: ${selectedVitalType.toUpperCase()} | ${selectedPatient.toUpperCase()}`, 20, 50);
    
    let yPosition = 70;
    
    filteredReportData.forEach((report: WeeklyReportData) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Patient Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Patient: ${report.patientName} (${report.patientId})`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Show filtered vital signs or all vital signs
      if (selectedVitalType !== 'all') {
        const vitalData = getVitalSignData(report);
        if (vitalData) {
          const tableData = [
            ['Vital Sign', 'Average', 'Range', 'Readings', 'Trend']
          ];
          
          const trendText = vitalData.data?.trend || 'stable';
          tableData.push([
            vitalData.name,
            `${vitalData.average} ${vitalData.unit}`,
            `${vitalData.range} ${vitalData.unit}`,
            vitalData.readings.toString(),
            trendText.toUpperCase()
          ]);
          
          autoTable(doc, {
            head: [tableData[0]],
            body: tableData.slice(1),
            startY: yPosition,
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] },
            margin: { left: 20 }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
      } else {
        // Show all vital signs
        const tableData = [
          ['Vital Sign', 'Average', 'Range', 'Readings', 'Trend'],
          ['Heart Rate', `${report.vitalSigns.heartRate.average} BPM`, `${report.vitalSigns.heartRate.min}-${report.vitalSigns.heartRate.max} BPM`, report.vitalSigns.heartRate.readings.toString(), report.vitalSigns.heartRate.trend.toUpperCase()],
          ['Blood Pressure', `${report.vitalSigns.bloodPressure.systolic.average}/${report.vitalSigns.bloodPressure.diastolic.average} mmHg`, `${report.vitalSigns.bloodPressure.systolic.min}-${report.vitalSigns.bloodPressure.systolic.max}/${report.vitalSigns.bloodPressure.diastolic.min}-${report.vitalSigns.bloodPressure.diastolic.max} mmHg`, report.vitalSigns.bloodPressure.readings.toString(), report.vitalSigns.bloodPressure.trend.toUpperCase()],
          ['Blood Oxygen', `${report.vitalSigns.bloodOxygen.average}%`, `${report.vitalSigns.bloodOxygen.min}-${report.vitalSigns.bloodOxygen.max}%`, report.vitalSigns.bloodOxygen.readings.toString(), report.vitalSigns.bloodOxygen.trend.toUpperCase()],
          ['Temperature', `${report.vitalSigns.temperature.average}°C`, `${report.vitalSigns.temperature.min}-${report.vitalSigns.temperature.max}°C`, report.vitalSigns.temperature.readings.toString(), report.vitalSigns.temperature.trend.toUpperCase()]
        ];
        
        autoTable(doc, {
          head: [tableData[0]],
          body: tableData.slice(1),
          startY: yPosition,
          theme: 'striped',
          headStyles: { fillColor: [66, 139, 202] },
          margin: { left: 20 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
    });
    
    // Save the PDF
    doc.save(`24x7TeleH-Weekly-Health-Report-${exportDate}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Weekly Health Reports
          </h2>
          <p className="text-gray-600 mt-1">Comprehensive weekly analysis of patient vital signs and health trends</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          
          <select 
            value={selectedVitalType}
            onChange={(e) => setSelectedVitalType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Vital Signs</option>
            <option value="heartRate">Heart Rate</option>
            <option value="bloodPressure">Blood Pressure</option>
            <option value="bloodOxygen">Blood Oxygen</option>
            <option value="temperature">Temperature</option>
          </select>
          
          <select 
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Patients</option>
            {((patients as any[]) || []).map((patient: any) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
          
          <Button onClick={generatePDFReport} variant="default" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      {filteredReportData.map((report: WeeklyReportData) => (
        <Card key={report.patientId} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{report.patientName}</CardTitle>
                <p className="text-sm text-gray-600">
                  Report Period: {new Date(report.reportPeriod.startDate).toLocaleDateString()} - {new Date(report.reportPeriod.endDate).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Patient ID: {report.patientId}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Tabs defaultValue="vitals" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
                <TabsTrigger value="checkups">Check-ups</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="vitals" className="space-y-4">
                {/* Show filtered vital signs or all vital signs */}
                {selectedVitalType !== 'all' ? (
                  // Show only selected vital sign
                  (() => {
                    const vitalData = getVitalSignData(report);
                    if (!vitalData) return null;
                    
                    return (
                      <div className="grid grid-cols-1">
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{vitalData.icon}</span>
                              <h3 className="text-lg font-semibold text-gray-900">{vitalData.name}</h3>
                            </div>
                            {getTrendIcon(vitalData.data?.trend || 'stable')}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <p className="text-gray-600">Average</p>
                              <p className="text-xl font-bold text-blue-600">{vitalData.average} {vitalData.unit}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Range</p>
                              <p className="text-xl font-bold text-blue-600">{vitalData.range} {vitalData.unit}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-600">Readings</p>
                              <p className="text-xl font-bold text-blue-600">{vitalData.readings}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Show all vital signs
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Heart Rate */}
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <Heart className="w-6 h-6 text-red-600" />
                        {getTrendIcon(report.vitalSigns.heartRate.trend)}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Heart Rate</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-medium">{report.vitalSigns.heartRate.average} BPM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-medium">{report.vitalSigns.heartRate.min}-{report.vitalSigns.heartRate.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Readings:</span>
                          <span className="font-medium">{report.vitalSigns.heartRate.readings}</span>
                        </div>
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <Activity className="w-6 h-6 text-blue-600" />
                        {getTrendIcon(report.vitalSigns.bloodPressure.trend)}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Blood Pressure</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Avg Systolic:</span>
                          <span className="font-medium">{report.vitalSigns.bloodPressure.systolic.average}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Diastolic:</span>
                          <span className="font-medium">{report.vitalSigns.bloodPressure.diastolic.average}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Readings:</span>
                          <span className="font-medium">{report.vitalSigns.bloodPressure.readings}</span>
                        </div>
                      </div>
                    </div>

                    {/* Blood Oxygen */}
                    <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                      <div className="flex items-center justify-between mb-3">
                        <Droplets className="w-6 h-6 text-cyan-600" />
                        {getTrendIcon(report.vitalSigns.bloodOxygen.trend)}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Blood Oxygen</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-medium">{report.vitalSigns.bloodOxygen.average}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-medium">{report.vitalSigns.bloodOxygen.min}-{report.vitalSigns.bloodOxygen.max}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Readings:</span>
                          <span className="font-medium">{report.vitalSigns.bloodOxygen.readings}</span>
                        </div>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <Thermometer className="w-6 h-6 text-orange-600" />
                        {getTrendIcon(report.vitalSigns.temperature.trend)}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Temperature</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average:</span>
                          <span className="font-medium">{report.vitalSigns.temperature.average}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-medium">{report.vitalSigns.temperature.min}-{report.vitalSigns.temperature.max}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Readings:</span>
                          <span className="font-medium">{report.vitalSigns.temperature.readings}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="checkups" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Scheduled</h4>
                    <p className="text-3xl font-bold text-blue-600">{report.checkups.scheduled}</p>
                    <p className="text-sm text-gray-600">total planned</p>
                  </div>
                  
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Completed</h4>
                    <p className="text-3xl font-bold text-green-600">{report.checkups.completed}</p>
                    <p className="text-sm text-gray-600">successfully done</p>
                  </div>
                  
                  <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Missed</h4>
                    <p className="text-3xl font-bold text-red-600">{report.checkups.missed}</p>
                    <p className="text-sm text-gray-600">requires attention</p>
                  </div>
                  
                  <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Completion Rate</h4>
                    <p className="text-3xl font-bold text-blue-600">
                      {Math.round((report.checkups.completed / report.checkups.scheduled) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">overall compliance</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Critical Alerts</h4>
                    <p className="text-3xl font-bold text-red-600">{report.alerts.critical}</p>
                    <p className="text-sm text-gray-600">require immediate attention</p>
                  </div>
                  
                  <div className="text-center p-6 bg-orange-50 rounded-lg border border-orange-200">
                    <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Warning Alerts</h4>
                    <p className="text-3xl font-bold text-orange-600">{report.alerts.warning}</p>
                    <p className="text-sm text-gray-600">monitor closely</p>
                  </div>
                  
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Resolved Alerts</h4>
                    <p className="text-3xl font-bold text-green-600">{report.alerts.resolved}</p>
                    <p className="text-sm text-gray-600">successfully addressed</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                    <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Compliance Rate</h4>
                    <p className="text-3xl font-bold text-purple-600">{report.compliance.rate}%</p>
                    <p className="text-sm text-gray-600">overall adherence</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Missed Readings</h4>
                    <p className="text-3xl font-bold text-gray-600">{report.compliance.missedReadings}</p>
                    <p className="text-sm text-gray-600">total missed</p>
                  </div>
                  
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Device Uptime</h4>
                    <p className="text-3xl font-bold text-green-600">{report.compliance.deviceUptime}%</p>
                    <p className="text-sm text-gray-600">connectivity rate</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}