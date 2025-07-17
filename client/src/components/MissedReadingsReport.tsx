import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/i18n';
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Clock, 
  Download,
  Mail,
  Phone,
  X,
  Search,
  Filter
} from 'lucide-react';

interface MissedReading {
  patientId: string;
  patientName: string;
  email: string;
  mobileNumber: string;
  hospitalId: string;
  expectedReadingDate: string;
  missedDays: number;
  readingType: 'heart_rate' | 'blood_pressure' | 'temperature' | 'oxygen_level' | 'blood_glucose' | 'ecg';
  priority: 'low' | 'medium' | 'high' | 'critical';
  lastReading: string | null;
  complianceRate: number;
}

interface MissedReadingsReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MissedReadingsReport({ isOpen, onClose }: MissedReadingsReportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [readingTypeFilter, setReadingTypeFilter] = useState<'all' | string>('all');
  const [daysFilter, setDaysFilter] = useState<'all' | '1' | '3' | '7' | '14'>('all');
  
  const { t, isRTL } = useLanguage();

  // Fetch missed readings data
  const { data: missedReadingsData, isLoading } = useQuery({
    queryKey: ['/api/missed-readings'],
    enabled: isOpen,
    retry: false
  });

  // Mock data for missed readings (replace with actual API data)
  const mockMissedReadings: MissedReading[] = [
    {
      patientId: 'PT001',
      patientName: 'أحمد محمد علي',
      email: 'ahmed.ali@email.com',
      mobileNumber: '+971501234567',
      hospitalId: 'SEHA',
      expectedReadingDate: '2025-01-15',
      missedDays: 3,
      readingType: 'heart_rate',
      priority: 'high',
      lastReading: '2025-01-12',
      complianceRate: 65
    },
    {
      patientId: 'PT005',
      patientName: 'Sarah Al Mansouri',
      email: 'sarah.mansouri@email.com',
      mobileNumber: '+971509876543',
      hospitalId: 'MAFRAQ',
      expectedReadingDate: '2025-01-14',
      missedDays: 5,
      readingType: 'blood_glucose',
      priority: 'critical',
      lastReading: '2025-01-10',
      complianceRate: 45
    },
    {
      patientId: 'PT012',
      patientName: 'محمد عبدالله الزعابي',
      email: 'mohammed.alzaabi@email.com',
      mobileNumber: '+971505555555',
      hospitalId: 'ALZAHRA',
      expectedReadingDate: '2025-01-16',
      missedDays: 1,
      readingType: 'blood_pressure',
      priority: 'medium',
      lastReading: '2025-01-15',
      complianceRate: 80
    },
    {
      patientId: 'PT008',
      patientName: 'Fatima Al Hashemi',
      email: 'fatima.hashemi@email.com',
      mobileNumber: '+971507777777',
      hospitalId: 'CORNICHE',
      expectedReadingDate: '2025-01-13',
      missedDays: 7,
      readingType: 'temperature',
      priority: 'medium',
      lastReading: '2025-01-08',
      complianceRate: 55
    }
  ];

  const allMissedReadings = missedReadingsData || mockMissedReadings;

  // Filter missed readings
  const filteredMissedReadings = Array.isArray(allMissedReadings) ? allMissedReadings.filter((reading: any) => {
    const matchesSearch = searchQuery === '' || 
      reading.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || reading.priority === priorityFilter;
    const matchesType = readingTypeFilter === 'all' || reading.readingType === readingTypeFilter;
    const matchesDays = daysFilter === 'all' || 
      (daysFilter === '1' && reading.missedDays === 1) ||
      (daysFilter === '3' && reading.missedDays <= 3) ||
      (daysFilter === '7' && reading.missedDays <= 7) ||
      (daysFilter === '14' && reading.missedDays <= 14);

    return matchesSearch && matchesPriority && matchesType && matchesDays;
  }) : [];

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      low: isRTL ? 'منخفض' : 'Low',
      medium: isRTL ? 'متوسط' : 'Medium',
      high: isRTL ? 'عالي' : 'High',
      critical: isRTL ? 'حرج' : 'Critical'
    };

    return (
      <Badge className={variants[priority as keyof typeof variants]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getReadingTypeLabel = (type: string) => {
    const labels = {
      heart_rate: isRTL ? 'معدل ضربات القلب' : 'Heart Rate',
      blood_pressure: isRTL ? 'ضغط الدم' : 'Blood Pressure',
      temperature: isRTL ? 'درجة الحرارة' : 'Temperature',
      oxygen_level: isRTL ? 'مستوى الأكسجين' : 'Oxygen Level',
      blood_glucose: isRTL ? 'الجلوكوز في الدم' : 'Blood Glucose',
      ecg: isRTL ? 'تخطيط القلب' : 'ECG'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const exportReport = () => {
    const csvContent = [
      ['Patient ID', 'Patient Name', 'Email', 'Mobile', 'Hospital', 'Reading Type', 'Missed Days', 'Priority', 'Last Reading', 'Compliance Rate'],
      ...filteredMissedReadings.map((reading: any) => [
        reading.patientId,
        reading.patientName,
        reading.email,
        reading.mobileNumber,
        reading.hospitalId,
        getReadingTypeLabel(reading.readingType),
        reading.missedDays.toString(),
        reading.priority,
        reading.lastReading || 'Never',
        `${reading.complianceRate}%`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `missed-readings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-6xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>{isRTL ? 'تقرير القراءات الفائتة' : 'Missed Readings Report'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${isRTL ? 'rtl:text-right' : ''}`}>
                <div className="relative">
                  <Search className={`absolute top-3 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={isRTL ? 'البحث في المرضى' : 'Search patients'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'الأولوية' : 'Priority'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'جميع الأولويات' : 'All Priorities'}</SelectItem>
                    <SelectItem value="low">{isRTL ? 'منخفض' : 'Low'}</SelectItem>
                    <SelectItem value="medium">{isRTL ? 'متوسط' : 'Medium'}</SelectItem>
                    <SelectItem value="high">{isRTL ? 'عالي' : 'High'}</SelectItem>
                    <SelectItem value="critical">{isRTL ? 'حرج' : 'Critical'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={readingTypeFilter} onValueChange={setReadingTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'نوع القراءة' : 'Reading Type'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'جميع القراءات' : 'All Types'}</SelectItem>
                    <SelectItem value="heart_rate">{isRTL ? 'معدل ضربات القلب' : 'Heart Rate'}</SelectItem>
                    <SelectItem value="blood_pressure">{isRTL ? 'ضغط الدم' : 'Blood Pressure'}</SelectItem>
                    <SelectItem value="temperature">{isRTL ? 'درجة الحرارة' : 'Temperature'}</SelectItem>
                    <SelectItem value="oxygen_level">{isRTL ? 'مستوى الأكسجين' : 'Oxygen Level'}</SelectItem>
                    <SelectItem value="blood_glucose">{isRTL ? 'الجلوكوز في الدم' : 'Blood Glucose'}</SelectItem>
                    <SelectItem value="ecg">{isRTL ? 'تخطيط القلب' : 'ECG'}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={daysFilter} onValueChange={(value) => setDaysFilter(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'الأيام الفائتة' : 'Missed Days'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'جميع الأيام' : 'All Days'}</SelectItem>
                    <SelectItem value="1">{isRTL ? 'يوم واحد' : '1 Day'}</SelectItem>
                    <SelectItem value="3">{isRTL ? '3 أيام أو أقل' : '3 Days or Less'}</SelectItem>
                    <SelectItem value="7">{isRTL ? '7 أيام أو أقل' : '7 Days or Less'}</SelectItem>
                    <SelectItem value="14">{isRTL ? '14 يوم أو أقل' : '14 Days or Less'}</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={exportReport}
                  className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}
                >
                  <Download className="w-4 h-4" />
                  <span>{isRTL ? 'تصدير التقرير' : 'Export Report'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className={`text-center ${isRTL ? 'rtl:text-right' : ''}`}>
                  <div className="text-2xl font-bold text-red-600">{filteredMissedReadings.length}</div>
                  <div className="text-sm text-gray-600">{isRTL ? 'إجمالي القراءات الفائتة' : 'Total Missed Readings'}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className={`text-center ${isRTL ? 'rtl:text-right' : ''}`}>
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredMissedReadings.filter((r: any) => r.priority === 'critical').length}
                  </div>
                  <div className="text-sm text-gray-600">{isRTL ? 'حالات حرجة' : 'Critical Cases'}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className={`text-center ${isRTL ? 'rtl:text-right' : ''}`}>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(filteredMissedReadings.reduce((sum: any, r: any) => sum + r.complianceRate, 0) / filteredMissedReadings.length) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">{isRTL ? 'متوسط معدل الالتزام' : 'Avg Compliance Rate'}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className={`text-center ${isRTL ? 'rtl:text-right' : ''}`}>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(filteredMissedReadings.reduce((sum: any, r: any) => sum + r.missedDays, 0) / filteredMissedReadings.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">{isRTL ? 'متوسط الأيام الفائتة' : 'Avg Missed Days'}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missed Readings Table */}
          <Card>
            <CardHeader>
              <CardTitle className={`${isRTL ? 'text-right' : ''}`}>
                {isRTL ? `المرضى ذوو القراءات الفائتة (${filteredMissedReadings.length})` : 
                         `Patients with Missed Readings (${filteredMissedReadings.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                </div>
              ) : filteredMissedReadings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {isRTL ? 'لا توجد قراءات فائتة' : 'No missed readings found'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full ${isRTL ? 'rtl:text-right' : ''}`}>
                    <thead>
                      <tr className="border-b">
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'المريض' : 'Patient'}
                        </th>
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'الاتصال' : 'Contact'}
                        </th>
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'نوع القراءة' : 'Reading Type'}
                        </th>
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'الأيام الفائتة' : 'Missed Days'}
                        </th>
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'الأولوية' : 'Priority'}
                        </th>
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'آخر قراءة' : 'Last Reading'}
                        </th>
                        <th className={`py-2 px-4 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? 'معدل الالتزام' : 'Compliance'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMissedReadings.map((reading: any, index: any) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="font-medium">{reading.patientName}</div>
                              <div className="text-sm text-gray-600">{reading.patientId}</div>
                              <div className="text-sm text-gray-500">{reading.hospitalId}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className={`flex items-center space-x-1 text-sm ${isRTL ? 'space-x-reverse' : ''}`}>
                                <Mail className="w-3 h-3" />
                                <span>{reading.email}</span>
                              </div>
                              <div className={`flex items-center space-x-1 text-sm ${isRTL ? 'space-x-reverse' : ''}`}>
                                <Phone className="w-3 h-3" />
                                <span>{reading.mobileNumber}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{getReadingTypeLabel(reading.readingType)}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{reading.missedDays}</span>
                              <span className="text-sm text-gray-500">
                                {isRTL ? 'يوم' : 'days'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getPriorityBadge(reading.priority)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              {reading.lastReading ? 
                                new Date(reading.lastReading).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US') : 
                                (isRTL ? 'لم يسبق' : 'Never')
                              }
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    reading.complianceRate >= 80 ? 'bg-green-500' :
                                    reading.complianceRate >= 60 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${reading.complianceRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{reading.complianceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}