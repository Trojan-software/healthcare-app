import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Droplets, 
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  Search,
  UserCheck,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AnimatedHealthComparison from '@/components/AnimatedHealthComparison';

interface HealthMetrics {
  totalPatients: number;
  activeMonitoring: number;
  criticalAlerts: number;
  averageHeartRate: number;
  averageBloodPressure: { systolic: number; diastolic: number };
  averageBloodOxygen: number;
  averageTemperature: number;
  complianceRate: number;
}

interface PatientRisk {
  id: string;
  name: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  lastReading: Date;
  vitals: {
    heartRate: number;
    bloodPressure: { systolic: number; diastolic: number };
    bloodOxygen: number;
    temperature: number;
  };
  alerts: number;
}

interface TrendData {
  date: string;
  heartRate: number;
  bloodPressure: number;
  bloodOxygen: number;
  temperature: number;
  patientCount: number;
}

export default function AdvancedHealthAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch comprehensive health analytics
  const { data: healthMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/health-metrics', selectedTimeframe],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: riskPatients, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/admin/risk-patients', selectedRiskFilter],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const { data: trendData, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/admin/health-trends', selectedTimeframe],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: deviceStatus } = useQuery({
    queryKey: ['/api/admin/device-status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'moderate': return <Clock className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatLastReading = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredPatients = riskPatients?.filter((patient: PatientRisk) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (metricsLoading || patientsLoading || trendsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const mockMetrics: HealthMetrics = healthMetrics || {
    totalPatients: 156,
    activeMonitoring: 89,
    criticalAlerts: 3,
    averageHeartRate: 78,
    averageBloodPressure: { systolic: 125, diastolic: 82 },
    averageBloodOxygen: 97.2,
    averageTemperature: 36.8,
    complianceRate: 85.4
  };

  const mockRiskPatients: PatientRisk[] = riskPatients || [
    {
      id: 'PAT001',
      name: 'Sarah Johnson',
      riskLevel: 'critical',
      lastReading: new Date(Date.now() - 10 * 60 * 1000),
      vitals: { heartRate: 145, bloodPressure: { systolic: 180, diastolic: 110 }, bloodOxygen: 89, temperature: 38.5 },
      alerts: 5
    },
    {
      id: 'PAT002',
      name: 'Michael Chen',
      riskLevel: 'high',
      lastReading: new Date(Date.now() - 25 * 60 * 1000),
      vitals: { heartRate: 105, bloodPressure: { systolic: 150, diastolic: 95 }, bloodOxygen: 92, temperature: 37.8 },
      alerts: 2
    },
    {
      id: 'PAT003',
      name: 'Emma Davis',
      riskLevel: 'moderate',
      lastReading: new Date(Date.now() - 45 * 60 * 1000),
      vitals: { heartRate: 85, bloodPressure: { systolic: 135, diastolic: 88 }, bloodOxygen: 95, temperature: 37.2 },
      alerts: 1
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Advanced Health Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive patient monitoring and health insights</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{mockMetrics.totalPatients}</p>
                <p className="text-xs text-green-600 mt-1">↗ +12.5% vs last period</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Monitoring</p>
                <p className="text-3xl font-bold text-gray-900">{mockMetrics.activeMonitoring}</p>
                <p className="text-xs text-green-600 mt-1">↗ +8.3% vs last period</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-3xl font-bold text-gray-900">{mockMetrics.criticalAlerts}</p>
                <p className="text-xs text-red-600 mt-1">↗ +1 vs last period</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                <p className="text-3xl font-bold text-gray-900">{mockMetrics.complianceRate}%</p>
                <p className="text-xs text-green-600 mt-1">↗ +3.2% vs last period</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="risks">Risk Management</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
          <TabsTrigger value="comparison">Health Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Average Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Average Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Heart Rate</span>
                  </div>
                  <span className="text-lg font-bold">{mockMetrics.averageHeartRate} BPM</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Blood Pressure</span>
                  </div>
                  <span className="text-lg font-bold">
                    {mockMetrics.averageBloodPressure.systolic}/{mockMetrics.averageBloodPressure.diastolic}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Blood Oxygen</span>
                  </div>
                  <span className="text-lg font-bold">{mockMetrics.averageBloodOxygen}%</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Temperature</span>
                  </div>
                  <span className="text-lg font-bold">{mockMetrics.averageTemperature}°C</span>
                </div>
              </CardContent>
            </Card>

            {/* Device Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Device Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-2xl font-bold text-green-600">87</p>
                    <p className="text-sm text-green-700">Online Devices</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-2xl font-bold text-yellow-600">12</p>
                    <p className="text-sm text-yellow-700">Low Battery</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-2xl font-bold text-red-600">3</p>
                    <p className="text-sm text-red-700">Offline</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">94.2%</p>
                    <p className="text-sm text-blue-700">Uptime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold">Heart Rate Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Normal (60-100 BPM)</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Bradycardia (&lt;60 BPM)</span>
                      <span>8%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Tachycardia (&gt;100 BPM)</span>
                      <span>14%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '14%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Blood Oxygen Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Normal (&gt;95%)</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Mild Hypoxia (90-95%)</span>
                      <span>12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Severe Hypoxia (&lt;90%)</span>
                      <span>3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '3%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-semibold">Risk Management Dashboard</h3>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <select 
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredPatients.map((patient: PatientRisk) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-gray-600">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-lg">{patient.name}</h4>
                        <p className="text-sm text-gray-600">ID: {patient.id}</p>
                        <p className="text-xs text-gray-500">Last reading: {formatLastReading(patient.lastReading)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right space-y-1">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">HR:</span>
                            <span className="font-medium ml-1">{patient.vitals.heartRate}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">BP:</span>
                            <span className="font-medium ml-1">
                              {patient.vitals.bloodPressure.systolic}/{patient.vitals.bloodPressure.diastolic}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">SpO2:</span>
                            <span className="font-medium ml-1">{patient.vitals.bloodOxygen}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Temp:</span>
                            <span className="font-medium ml-1">{patient.vitals.temperature}°C</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${getRiskColor(patient.riskLevel)} flex items-center gap-1`}>
                          {getRiskIcon(patient.riskLevel)}
                          {patient.riskLevel.toUpperCase()}
                        </Badge>
                        
                        {patient.alerts > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {patient.alerts} Alert{patient.alerts > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Health Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Patient Growth Trends</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Patients (7d)</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">+15</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Daily Readings</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">847</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Device Utilization</span>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="font-medium">92.3%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Health Score Improvements</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cardiovascular Health</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">+8.2%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Respiratory Function</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">+5.7%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Wellness</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">+12.4%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <AnimatedHealthComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}