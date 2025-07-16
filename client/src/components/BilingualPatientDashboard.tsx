import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { useQuery } from '@tanstack/react-query';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Bluetooth,
  Battery,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  User,
  LogOut,
  Gauge,
  Zap,
  Play,
  Download,
  FileText,
  Pause,
  Square
} from 'lucide-react';
import PrivacyPolicyFooter from './PrivacyPolicyFooter';
import { useToast } from '@/hooks/use-toast';
import BatteryWidget from './BatteryWidget';
import BloodGlucoseWidget from './BloodGlucoseWidget';
import EcgWidget from './EcgWidget';
import BluetoothConnectionManager from './BluetoothConnectionManager';

interface VitalSigns {
  id: number;
  patientId: string;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: string;
  oxygenLevel: number;
  bloodGlucose?: number;
  timestamp: string;
}

interface PatientDashboardData {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    patientId: string;
  };
  latestVitals: VitalSigns;
  healthScore: number;
  complianceRate: number;
  nextAppointment: string | null;
  upcomingReminders: Array<{
    id: number;
    type: string;
    message: string;
    scheduledFor: string;
  }>;
}

export default function BilingualPatientDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTests, setActiveTests] = useState<{[key: string]: boolean}>({
    heartRate: false,
    bloodPressure: false,
    temperature: false,
    oxygenLevel: false,
    bloodGlucose: false,
    ecg: false
  });
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();

  // Get patient ID from localStorage or URL params
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const patientId = user.patientId || 'PAT001';

  // Fetch patient dashboard data
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: [`/api/dashboard/patient/${user.id}`],
    enabled: !!user.id,
    retry: false
  });

  const dashboard: PatientDashboardData = dashboardData || {
    user: { id: 0, firstName: '', lastName: '', email: '', patientId: '' },
    latestVitals: null,
    healthScore: 0,
    complianceRate: 0,
    nextAppointment: null,
    upcomingReminders: []
  };

  // Fetch vital signs history
  const { data: vitalSignsData } = useQuery({
    queryKey: [`/api/vital-signs/${patientId}`],
    retry: false
  });

  const vitalSigns: VitalSigns[] = vitalSignsData || [];

  const getVitalStatus = (vital: string, value: number): 'normal' | 'elevated' | 'high' | 'critical' => {
    switch (vital) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'elevated';
        if (value < 40 || value > 120) return 'high';
        if (value < 30 || value > 150) return 'critical';
        return 'normal';
      case 'systolic':
        if (value > 130) return 'elevated';
        if (value > 140) return 'high';
        if (value > 180) return 'critical';
        return 'normal';
      case 'temperature':
        const temp = parseFloat(value.toString());
        if (temp > 37.5 || temp < 36.0) return 'elevated';
        if (temp > 38.5 || temp < 35.0) return 'high';
        if (temp > 40.0 || temp < 34.0) return 'critical';
        return 'normal';
      case 'oxygen':
        if (value < 95) return 'elevated';
        if (value < 90) return 'high';
        if (value < 85) return 'critical';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50';
      case 'elevated': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      normal: isRTL ? 'طبيعي' : 'Normal',
      elevated: isRTL ? 'مرتفع' : 'Elevated',
      high: isRTL ? 'عالي' : 'High',
      critical: isRTL ? 'حرج' : 'Critical'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const startTest = (testType: string) => {
    setActiveTests(prev => ({ ...prev, [testType]: true }));
    toast({
      title: isRTL ? 'بدء الاختبار' : 'Test Started',
      description: isRTL ? `تم بدء اختبار ${getTestName(testType)}` : `${getTestName(testType)} test started`,
    });
  };

  const stopTest = (testType: string) => {
    setActiveTests(prev => ({ ...prev, [testType]: false }));
    toast({
      title: isRTL ? 'توقف الاختبار' : 'Test Stopped',
      description: isRTL ? `تم إيقاف اختبار ${getTestName(testType)}` : `${getTestName(testType)} test stopped`,
    });
  };

  const getTestName = (testType: string) => {
    const names = {
      heartRate: isRTL ? 'معدل ضربات القلب' : 'Heart Rate',
      bloodPressure: isRTL ? 'ضغط الدم' : 'Blood Pressure',
      temperature: isRTL ? 'درجة الحرارة' : 'Temperature',
      oxygenLevel: isRTL ? 'مستوى الأكسجين' : 'Oxygen Level',
      bloodGlucose: isRTL ? 'الجلوكوز في الدم' : 'Blood Glucose',
      ecg: isRTL ? 'تخطيط القلب' : 'ECG'
    };
    return names[testType as keyof typeof names] || testType;
  };

  const exportReadingsReport = () => {
    const reportData = vitalSigns.map(vital => ({
      Date: new Date(vital.timestamp).toLocaleDateString(),
      Time: new Date(vital.timestamp).toLocaleTimeString(),
      'Heart Rate': vital.heartRate,
      'Blood Pressure': `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`,
      'Temperature': vital.temperature,
      'Oxygen Level': vital.oxygenLevel,
      'Blood Glucose': vital.bloodGlucose || 'N/A'
    }));

    const csvContent = [
      Object.keys(reportData[0] || {}).join(','),
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-readings-${patientId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: isRTL ? 'تصدير التقرير' : 'Report Exported',
      description: isRTL ? 'تم تصدير تقرير القراءات بنجاح' : 'Readings report exported successfully',
    });
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return t('normal');
      case 'elevated': return t('elevated');
      case 'high': return t('high');
      case 'critical': return t('critical');
      default: return status;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className={`px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('welcomeBack')}, {dashboard.user.firstName}
              </h1>
              <p className="text-sm text-gray-600">
                {isRTL ? `رقم المريض: ${dashboard.user.patientId}` : `Patient ID: ${dashboard.user.patientId}`}
              </p>
            </div>
          </div>
          <div className={`flex items-center space-x-4 ${isRTL ? 'space-x-reverse' : ''}`}>
            <LanguageSwitcher />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
              }}
              className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="vitals">{t('vitalSigns')}</TabsTrigger>
            <TabsTrigger value="devices">{t('devices')}</TabsTrigger>
            <TabsTrigger value="reports">{t('reports')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Health Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-medium text-gray-600">{isRTL ? 'نقاط الصحة' : 'Health Score'}</p>
                      <p className="text-3xl font-bold text-green-600">{dashboard.healthScore || 85}/100</p>
                    </div>
                    <Heart className="w-8 h-8 text-green-500" />
                  </div>
                  <Progress value={dashboard.healthScore || 85} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-medium text-gray-600">{t('complianceRate')}</p>
                      <p className="text-3xl font-bold text-blue-600">{dashboard.complianceRate || 92}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                  </div>
                  <Progress value={dashboard.complianceRate || 92} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-medium text-gray-600">{t('connectedDevices')}</p>
                      <p className="text-3xl font-bold text-purple-600">3</p>
                    </div>
                    <Bluetooth className="w-8 h-8 text-purple-500" />
                  </div>
                  <Badge variant="secondary" className="mt-2">{t('online')}</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm font-medium text-gray-600">{t('nextAppointment')}</p>
                      <p className="text-lg font-bold text-orange-600">
                        {dashboard.nextAppointment ? new Date(dashboard.nextAppointment).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US') : isRTL ? 'غير مجدول' : 'Not scheduled'}
                      </p>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Latest Vital Signs */}
            {dashboard.latestVitals && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Activity className="w-5 h-5" />
                    {isRTL ? 'آخر العلامات الحيوية' : 'Latest Vital Signs'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`flex items-center space-x-3 p-3 rounded-lg ${isRTL ? 'space-x-reverse' : ''} ${getStatusColor(getVitalStatus('heartRate', dashboard.latestVitals.heartRate))}`}>
                      <Heart className="w-5 h-5" />
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="text-sm font-medium">{t('heartRate')}</p>
                        <p className="text-lg font-bold">{dashboard.latestVitals.heartRate} {isRTL ? 'ن/د' : 'BPM'}</p>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(getVitalStatus('heartRate', dashboard.latestVitals.heartRate))}
                        </Badge>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-lg ${isRTL ? 'space-x-reverse' : ''} ${getStatusColor(getVitalStatus('systolic', dashboard.latestVitals.bloodPressureSystolic))}`}>
                      <Gauge className="w-5 h-5" />
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="text-sm font-medium">{t('bloodPressure')}</p>
                        <p className="text-lg font-bold">{dashboard.latestVitals.bloodPressureSystolic}/{dashboard.latestVitals.bloodPressureDiastolic}</p>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(getVitalStatus('systolic', dashboard.latestVitals.bloodPressureSystolic))}
                        </Badge>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-lg ${isRTL ? 'space-x-reverse' : ''} ${getStatusColor(getVitalStatus('temperature', parseFloat(dashboard.latestVitals.temperature)))}`}>
                      <Thermometer className="w-5 h-5" />
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="text-sm font-medium">{t('temperature')}</p>
                        <p className="text-lg font-bold">{dashboard.latestVitals.temperature}°C</p>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(getVitalStatus('temperature', parseFloat(dashboard.latestVitals.temperature)))}
                        </Badge>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-3 p-3 rounded-lg ${isRTL ? 'space-x-reverse' : ''} ${getStatusColor(getVitalStatus('oxygen', dashboard.latestVitals.oxygenLevel))}`}>
                      <Droplets className="w-5 h-5" />
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className="text-sm font-medium">{t('oxygenLevel')}</p>
                        <p className="text-lg font-bold">{dashboard.latestVitals.oxygenLevel}%</p>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(getVitalStatus('oxygen', dashboard.latestVitals.oxygenLevel))}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vital Signs Tab */}
          <TabsContent value="vitals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ECG Widget */}
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <Activity className="w-5 h-5" />
                    {isRTL ? 'مراقبة تخطيط القلب' : 'ECG Monitoring'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EcgWidget patientId={patientId} deviceId="HC03-003" />
                </CardContent>
              </Card>

              {/* Blood Glucose Widget */}
              <BloodGlucoseWidget patientId={patientId} deviceId="HC03-001" />

              {/* Battery Widget */}
              <BatteryWidget patientId={patientId} deviceId="HC03-002" />
            </div>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <BluetoothConnectionManager patientId={patientId} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <FileText className="w-5 h-5" />
                    <span>{isRTL ? 'تقارير القراءات' : 'Readings Reports'}</span>
                  </div>
                  <Button 
                    onClick={exportReadingsReport}
                    className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isRTL ? 'تصدير' : 'Export'}</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Individual Test Controls */}
                  <Card>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Heart className="w-5 h-5 text-red-500" />
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-medium">{isRTL ? 'معدل ضربات القلب' : 'Heart Rate'}</p>
                            <p className="text-sm text-gray-600">{isRTL ? 'مراقبة مستمرة' : 'Continuous monitoring'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={activeTests.heartRate ? "destructive" : "default"}
                          onClick={() => activeTests.heartRate ? stopTest('heartRate') : startTest('heartRate')}
                        >
                          {activeTests.heartRate ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              {isRTL ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {isRTL ? 'بدء' : 'Start'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Gauge className="w-5 h-5 text-blue-500" />
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-medium">{isRTL ? 'ضغط الدم' : 'Blood Pressure'}</p>
                            <p className="text-sm text-gray-600">{isRTL ? 'قياس دوري' : 'Periodic measurement'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={activeTests.bloodPressure ? "destructive" : "default"}
                          onClick={() => activeTests.bloodPressure ? stopTest('bloodPressure') : startTest('bloodPressure')}
                        >
                          {activeTests.bloodPressure ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              {isRTL ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {isRTL ? 'بدء' : 'Start'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Thermometer className="w-5 h-5 text-orange-500" />
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-medium">{isRTL ? 'درجة الحرارة' : 'Temperature'}</p>
                            <p className="text-sm text-gray-600">{isRTL ? 'قياس حراري' : 'Thermal measurement'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={activeTests.temperature ? "destructive" : "default"}
                          onClick={() => activeTests.temperature ? stopTest('temperature') : startTest('temperature')}
                        >
                          {activeTests.temperature ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              {isRTL ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {isRTL ? 'بدء' : 'Start'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Droplets className="w-5 h-5 text-cyan-500" />
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-medium">{isRTL ? 'مستوى الأكسجين' : 'Oxygen Level'}</p>
                            <p className="text-sm text-gray-600">{isRTL ? 'قياس الأكسجين' : 'Oxygen measurement'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={activeTests.oxygenLevel ? "destructive" : "default"}
                          onClick={() => activeTests.oxygenLevel ? stopTest('oxygenLevel') : startTest('oxygenLevel')}
                        >
                          {activeTests.oxygenLevel ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              {isRTL ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {isRTL ? 'بدء' : 'Start'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Zap className="w-5 h-5 text-purple-500" />
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-medium">{isRTL ? 'الجلوكوز في الدم' : 'Blood Glucose'}</p>
                            <p className="text-sm text-gray-600">{isRTL ? 'قياس السكري' : 'Glucose measurement'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={activeTests.bloodGlucose ? "destructive" : "default"}
                          onClick={() => activeTests.bloodGlucose ? stopTest('bloodGlucose') : startTest('bloodGlucose')}
                        >
                          {activeTests.bloodGlucose ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              {isRTL ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {isRTL ? 'بدء' : 'Start'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Activity className="w-5 h-5 text-green-500" />
                          <div className={isRTL ? 'text-right' : ''}>
                            <p className="font-medium">{isRTL ? 'تخطيط القلب' : 'ECG'}</p>
                            <p className="text-sm text-gray-600">{isRTL ? 'مراقبة القلب' : 'Heart monitoring'}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={activeTests.ecg ? "destructive" : "default"}
                          onClick={() => activeTests.ecg ? stopTest('ecg') : startTest('ecg')}
                        >
                          {activeTests.ecg ? (
                            <>
                              <Square className="w-3 h-3 mr-1" />
                              {isRTL ? 'إيقاف' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              {isRTL ? 'بدء' : 'Start'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Privacy Policy Footer */}
      <PrivacyPolicyFooter />
    </div>
  );
}