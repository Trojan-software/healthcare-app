import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users,
  Activity,
  AlertTriangle,
  Wifi,
  UserPlus,
  Calendar,
  TrendingUp,
  BarChart3,
  Settings,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  Clock,
  Heart,
  Thermometer,
  Droplets,
  CheckCircle,
  XCircle,
  Battery,
  Signal
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import WeeklyReportDashboard from './WeeklyReportDashboard';
import CheckupScheduling from './CheckupScheduling';
import HealthHistoryOverview from './HealthHistoryOverview';
import CriticalAlertsSystem from './CriticalAlertsSystem';
import AdvancedHealthAnalytics from './AdvancedHealthAnalytics';
import PatientManagementModule from './PatientManagementModule';

interface DashboardStats {
  totalPatients: number;
  activeMonitoring: number;
  criticalAlerts: number;
  deviceConnections: number;
  newRegistrations: number;
  complianceRate: number;
}

interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  email: string;
  hospitalName?: string;
  isActive: boolean;
  isVerified: boolean;
  lastReading?: Date;
  deviceStatus: 'online' | 'offline' | 'low_battery';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  complianceRate: number;
}

interface DeviceInfo {
  deviceId: string;
  patientId: string;
  patientName: string;
  lastSync: Date;
  batteryLevel: number;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
  vitalTypesSupported: string[];
  firmwareVersion: string;
}

export default function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-stats'],
    refetchInterval: 30000,
  });

  // Fetch patient records with filters
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/admin/patients', searchTerm, dateFilter, hospitalFilter, statusFilter],
    refetchInterval: 60000,
  });

  // Fetch device information
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/admin/devices'],
    refetchInterval: 15000,
  });

  // Fetch hospital list for filter
  const { data: hospitals } = useQuery({
    queryKey: ['/api/admin/hospitals'],
  });

  const mockStats: DashboardStats = dashboardStats || {
    totalPatients: 342,
    activeMonitoring: 298,
    criticalAlerts: 7,
    deviceConnections: 289,
    newRegistrations: 23,
    complianceRate: 87.3
  };

  const mockPatients: PatientRecord[] = patients || [
    {
      id: '1',
      patientId: 'PAT001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      hospitalName: 'City General Hospital',
      isActive: true,
      isVerified: true,
      lastReading: new Date(Date.now() - 15 * 60 * 1000),
      deviceStatus: 'online',
      riskLevel: 'moderate',
      complianceRate: 94.2
    },
    {
      id: '2',
      patientId: 'PAT002',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      hospitalName: 'Metro Medical Center',
      isActive: true,
      isVerified: true,
      lastReading: new Date(Date.now() - 2 * 60 * 60 * 1000),
      deviceStatus: 'low_battery',
      riskLevel: 'high',
      complianceRate: 78.5
    },
    {
      id: '3',
      patientId: 'PAT003',
      name: 'Emma Davis',
      email: 'emma.davis@email.com',
      hospitalName: 'City General Hospital',
      isActive: false,
      isVerified: true,
      lastReading: new Date(Date.now() - 24 * 60 * 60 * 1000),
      deviceStatus: 'offline',
      riskLevel: 'low',
      complianceRate: 45.8
    }
  ];

  const mockDevices: DeviceInfo[] = devices || [
    {
      deviceId: 'HC03-001',
      patientId: 'PAT001',
      patientName: 'Sarah Johnson',
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      batteryLevel: 85,
      connectionStatus: 'connected',
      vitalTypesSupported: ['heartRate', 'bloodPressure', 'bloodOxygen', 'temperature'],
      firmwareVersion: '2.1.4'
    },
    {
      deviceId: 'HC03-002',
      patientId: 'PAT002',
      patientName: 'Michael Chen',
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      batteryLevel: 15,
      connectionStatus: 'connected',
      vitalTypesSupported: ['heartRate', 'bloodPressure', 'bloodOxygen', 'temperature'],
      firmwareVersion: '2.1.3'
    },
    {
      deviceId: 'HC03-003',
      patientId: 'PAT003',
      patientName: 'Emma Davis',
      lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000),
      batteryLevel: 0,
      connectionStatus: 'disconnected',
      vitalTypesSupported: ['heartRate', 'bloodPressure', 'bloodOxygen'],
      firmwareVersion: '2.0.9'
    }
  ];

  const mockHospitals = hospitals || [
    'City General Hospital',
    'Metro Medical Center',
    'Regional Health System',
    'University Hospital'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'offline':
      case 'disconnected': return 'bg-red-100 text-red-800 border-red-200';
      case 'low_battery': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'syncing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBatteryIcon = (level: number) => {
    if (level > 50) return <Battery className="w-4 h-4 text-green-500" />;
    if (level > 20) return <Battery className="w-4 h-4 text-yellow-500" />;
    return <Battery className="w-4 h-4 text-red-500" />;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredPatients = mockPatients.filter(patient => {
    const nameMatch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const hospitalMatch = hospitalFilter === 'all' || patient.hospitalName === hospitalFilter;
    const statusMatch = statusFilter === 'all' || 
                       (statusFilter === 'active' && patient.isActive) ||
                       (statusFilter === 'inactive' && !patient.isActive);
    return nameMatch && hospitalMatch && statusMatch;
  });

  if (statsLoading || patientsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enhanced Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive patient management and health monitoring system</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patients">Patient Management</TabsTrigger>
          <TabsTrigger value="devices">Device Monitoring</TabsTrigger>
          <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
          <TabsTrigger value="reports">Weekly Reports</TabsTrigger>
          <TabsTrigger value="scheduling">Check-up Scheduling</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
              onClick={() => setActiveTab('patients')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.totalPatients}</p>
                    <p className="text-xs text-green-600 mt-1">+{mockStats.newRegistrations} this month</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500"
              onClick={() => setActiveTab('patients')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Monitoring</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.activeMonitoring}</p>
                    <p className="text-xs text-gray-600 mt-1">{mockStats.complianceRate}% compliance</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-red-500"
              onClick={() => setActiveTab('alerts')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.criticalAlerts}</p>
                    <p className="text-xs text-red-600 mt-1">Requires immediate attention</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
              onClick={() => setActiveTab('devices')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Device Connections</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.deviceConnections}</p>
                    <p className="text-xs text-green-600 mt-1">96.2% uptime</p>
                  </div>
                  <Wifi className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500"
              onClick={() => setActiveTab('patients')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New Registrations</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.newRegistrations}</p>
                    <p className="text-xs text-gray-600 mt-1">This month</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500"
              onClick={() => setActiveTab('analytics')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Analytics Dashboard</p>
                    <p className="text-3xl font-bold text-gray-900">
                      <BarChart3 className="w-8 h-8 text-indigo-500" />
                    </p>
                    <p className="text-xs text-gray-600 mt-1">AI-powered insights</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('reports')}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Generate Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('scheduling')}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Schedule Checkup</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('devices')}
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Device Settings</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('alerts')}
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">Alert Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Management Tab */}
        <TabsContent value="patients" className="space-y-6">
          <PatientManagementModule />
        </TabsContent>

        {/* Device Monitoring Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Device Monitoring Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDevices.map(device => (
                  <div key={device.deviceId} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Signal className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">{device.deviceId}</h4>
                          <p className="text-sm text-gray-600">
                            Patient: {device.patientName} ({device.patientId})
                          </p>
                          <p className="text-xs text-gray-500">
                            Firmware: {device.firmwareVersion}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(device.connectionStatus)}>
                              {device.connectionStatus}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getBatteryIcon(device.batteryLevel)}
                              <span className="text-sm">{device.batteryLevel}%</span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            Last sync: {getTimeAgo(device.lastSync)}
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Supports: {device.vitalTypesSupported.length} vital types
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Critical Alerts Tab */}
        <TabsContent value="alerts">
          <CriticalAlertsSystem />
        </TabsContent>

        {/* Weekly Reports Tab */}
        <TabsContent value="reports">
          <WeeklyReportDashboard />
        </TabsContent>

        {/* Check-up Scheduling Tab */}
        <TabsContent value="scheduling">
          <CheckupScheduling />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AdvancedHealthAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}