import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History,
  Calendar,
  Filter,
  Search,
  Download,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface VitalSignRecord {
  id: string;
  timestamp: Date;
  deviceId: string;
  readings: {
    heartRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    bloodOxygen?: number;
    temperature?: number;
  };
  status: 'normal' | 'warning' | 'critical';
  notes?: string;
}

interface DayGroup {
  date: string;
  records: VitalSignRecord[];
  summary: {
    totalReadings: number;
    normalReadings: number;
    warningReadings: number;
    criticalReadings: number;
    averages: {
      heartRate?: number;
      bloodPressure?: { systolic: number; diastolic: number };
      bloodOxygen?: number;
      temperature?: number;
    };
  };
}

export default function HealthHistoryOverview() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedVitalType, setSelectedVitalType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Fetch health history data
  const { data: healthHistory, isLoading } = useQuery({
    queryKey: ['/api/health-history', dateRange, selectedVitalType, statusFilter],
    refetchInterval: 60000,
  });

  const mockHealthData: DayGroup[] = Array.isArray(healthHistory) ? healthHistory : [
    {
      date: '2024-01-15',
      records: [
        {
          id: 'REC001',
          timestamp: new Date('2024-01-15T08:00:00'),
          deviceId: 'HC03-001',
          readings: {
            heartRate: 78,
            bloodPressureSystolic: 125,
            bloodPressureDiastolic: 82,
            bloodOxygen: 98,
            temperature: 36.7
          },
          status: 'normal'
        },
        {
          id: 'REC002',
          timestamp: new Date('2024-01-15T12:00:00'),
          deviceId: 'HC03-001',
          readings: {
            heartRate: 155,
            bloodPressureSystolic: 180,
            bloodPressureDiastolic: 110,
            bloodOxygen: 89,
            temperature: 38.2
          },
          status: 'critical',
          notes: 'Emergency reading - patient experiencing chest pain'
        },
        {
          id: 'REC003',
          timestamp: new Date('2024-01-15T16:00:00'),
          deviceId: 'HC03-001',
          readings: {
            heartRate: 92,
            bloodPressureSystolic: 140,
            bloodPressureDiastolic: 95,
            bloodOxygen: 94,
            temperature: 37.1
          },
          status: 'warning'
        },
        {
          id: 'REC004',
          timestamp: new Date('2024-01-15T20:00:00'),
          deviceId: 'HC03-001',
          readings: {
            heartRate: 75,
            bloodPressureSystolic: 128,
            bloodPressureDiastolic: 85,
            bloodOxygen: 97,
            temperature: 36.8
          },
          status: 'normal'
        }
      ],
      summary: {
        totalReadings: 4,
        normalReadings: 2,
        warningReadings: 1,
        criticalReadings: 1,
        averages: {
          heartRate: 100,
          bloodPressure: { systolic: 143, diastolic: 93 },
          bloodOxygen: 94.5,
          temperature: 37.2
        }
      }
    },
    {
      date: '2024-01-14',
      records: [
        {
          id: 'REC005',
          timestamp: new Date('2024-01-14T08:00:00'),
          deviceId: 'HC03-001',
          readings: {
            heartRate: 72,
            bloodPressureSystolic: 120,
            bloodPressureDiastolic: 80,
            bloodOxygen: 98,
            temperature: 36.6
          },
          status: 'normal'
        },
        {
          id: 'REC006',
          timestamp: new Date('2024-01-14T14:00:00'),
          deviceId: 'HC03-001',
          readings: {
            heartRate: 76,
            bloodPressureSystolic: 122,
            bloodPressureDiastolic: 78,
            bloodOxygen: 97,
            temperature: 36.8
          },
          status: 'normal'
        }
      ],
      summary: {
        totalReadings: 2,
        normalReadings: 2,
        warningReadings: 0,
        criticalReadings: 0,
        averages: {
          heartRate: 74,
          bloodPressure: { systolic: 121, diastolic: 79 },
          bloodOxygen: 97.5,
          temperature: 36.7
        }
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getVitalIcon = (vitalType: string) => {
    switch (vitalType) {
      case 'heartRate': return <Heart className="w-4 h-4 text-red-500" />;
      case 'bloodPressure': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'bloodOxygen': return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'temperature': return <Thermometer className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatReadings = (readings: VitalSignRecord['readings']) => {
    const formattedReadings = [];
    
    if (readings.heartRate) {
      formattedReadings.push(`HR: ${readings.heartRate} BPM`);
    }
    if (readings.bloodPressureSystolic && readings.bloodPressureDiastolic) {
      formattedReadings.push(`BP: ${readings.bloodPressureSystolic}/${readings.bloodPressureDiastolic}`);
    }
    if (readings.bloodOxygen) {
      formattedReadings.push(`SpO2: ${readings.bloodOxygen}%`);
    }
    if (readings.temperature) {
      formattedReadings.push(`Temp: ${readings.temperature}°C`);
    }
    
    return formattedReadings.join(' • ');
  };

  const exportData = () => {
    console.log('Exporting health history data:', { dateRange, selectedVitalType, statusFilter });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
            <History className="w-8 h-8 text-blue-600" />
            Health History Overview
          </h2>
          <p className="text-gray-600 mt-1">Chronological view of all recorded vital signs and health data</p>
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
            <option value="all">All Vitals</option>
            <option value="heartRate">Heart Rate</option>
            <option value="bloodPressure">Blood Pressure</option>
            <option value="bloodOxygen">Blood Oxygen</option>
            <option value="temperature">Temperature</option>
          </select>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="normal">Normal</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Health History Timeline */}
      <div className="space-y-4">
        {mockHealthData.map((dayGroup) => (
          <Card key={dayGroup.date} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleDayExpansion(dayGroup.date)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">
                      {new Date(dayGroup.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {dayGroup.summary.totalReadings} readings recorded
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {dayGroup.summary.criticalReadings > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {dayGroup.summary.criticalReadings} Critical
                      </Badge>
                    )}
                    {dayGroup.summary.warningReadings > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {dayGroup.summary.warningReadings} Warning
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dayGroup.summary.normalReadings} Normal
                    </Badge>
                  </div>
                  
                  {expandedDays.has(dayGroup.date) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            {expandedDays.has(dayGroup.date) && (
              <CardContent className="pt-0">
                {/* Daily Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Daily Averages</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {dayGroup.summary.averages.heartRate && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>HR: {dayGroup.summary.averages.heartRate} BPM</span>
                      </div>
                    )}
                    {dayGroup.summary.averages.bloodPressure && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span>
                          BP: {dayGroup.summary.averages.bloodPressure.systolic}/{dayGroup.summary.averages.bloodPressure.diastolic}
                        </span>
                      </div>
                    )}
                    {dayGroup.summary.averages.bloodOxygen && (
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-500" />
                        <span>SpO2: {dayGroup.summary.averages.bloodOxygen}%</span>
                      </div>
                    )}
                    {dayGroup.summary.averages.temperature && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <span>Temp: {dayGroup.summary.averages.temperature}°C</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Records */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Individual Readings</h4>
                  {dayGroup.records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-600 min-w-[80px]">
                          {record.timestamp.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusIcon(record.status)}
                          <span className="ml-1 capitalize">{record.status}</span>
                        </Badge>
                        
                        <div className="text-sm text-gray-700">
                          {formatReadings(record.readings)}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Device: {record.deviceId}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Notes Section */}
                {dayGroup.records.some(record => record.notes) && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-gray-900">Notes & Observations</h4>
                    {dayGroup.records
                      .filter(record => record.notes)
                      .map(record => (
                        <div key={record.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {record.timestamp.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-blue-700">{record.notes}</p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        
        {mockHealthData.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Data Found</h3>
              <p className="text-gray-600">
                No vital sign readings found for the selected date range and filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}