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
  Signal,
  LogOut
} from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import WeeklyReportDashboard from './WeeklyReportDashboard';
import CheckupScheduling from './CheckupScheduling';
import HealthHistoryOverview from './HealthHistoryOverview';
import CriticalAlertsSystem from './CriticalAlertsSystem';
import AdvancedHealthAnalytics from './AdvancedHealthAnalytics';
import PatientManagementModule from './PatientManagementModule';
import BilingualPatientManagement from './BilingualPatientManagement';
import BloodGlucoseWidget from './BloodGlucoseWidget';
import EcgWidget from './EcgWidget';
import PrivacyPolicyFooter from './PrivacyPolicyFooter';

interface DashboardStats {
  totalPatients: number;
  activeMonitoring: number;
  criticalAlerts: number;
  deviceConnections: number;
  newRegistrations: number;
  complianceRate: number;
}

interface PatientRecord {
  id: number;
  patientId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  hospitalId: string;
  isActive: boolean;
  isVerified: boolean;
  role: string;
  createdAt: string;
  lastReading?: Date;
  deviceStatus?: 'online' | 'offline' | 'low_battery';
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  complianceRate?: number;
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
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { t, isRTL } = useLanguage();

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  // Fetch patients data
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/admin/patients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    }
  });

  // Fetch devices data
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/admin/devices'],
    queryFn: async () => {
      const response = await fetch('/api/admin/devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      return response.json();
    }
  });

  // Default stats to avoid undefined errors
  const mockStats: DashboardStats = dashboardStats?.stats || {
    totalPatients: 0,
    activeMonitoring: 0,
    criticalAlerts: 0,
    deviceConnections: 0,
    newRegistrations: 0,
    complianceRate: 0
  };

  const mockPatients: PatientRecord[] = patientsData?.patients || [];
  const mockDevices: DeviceInfo[] = devicesData?.devices || [];
  const mockHospitals = ['Sheikh Khalifa Medical City', 'Cleveland Clinic Abu Dhabi', 'Mediclinic City Hospital'];

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

  const getTimeAgo = (date: Date | string) => {
    try {
      const now = new Date();
      const targetDate = date instanceof Date ? date : new Date(date);
      
      // Check if the date is valid
      if (isNaN(targetDate.getTime())) {
        return 'Unknown';
      }
      
      const diff = now.getTime() - targetDate.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch (error) {
      console.error('Error parsing date:', date, error);
      return 'Unknown';
    }
  };

  const filteredPatients = mockPatients.filter(patient => {
    const fullName = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim();
    const nameMatch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     (patient.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                     (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const hospitalMatch = hospitalFilter === 'all' || patient.hospitalId === hospitalFilter;
    const statusMatch = statusFilter === 'all' || 
                       (statusFilter === 'active' && patient.isActive) ||
                       (statusFilter === 'inactive' && !patient.isActive);
    return nameMatch && hospitalMatch && statusMatch;
  });

  if (statsLoading || patientsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <p className="text-xs text-gray-600 mt-1">HC03 devices online</p>
                  </div>
                  <Wifi className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Monitoring Overview */}
          <div className="space-y-6 mb-8">
            {/* ECG Monitor - Full Width */}
            <EcgWidget 
              deviceId="HC03-003"
              patientId="PAT001" 
              showControls={false}
              compact={false}
            />
            
            {/* Blood Glucose and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BloodGlucoseWidget 
                patientId="PAT001" 
                showControls={false}
                compact={false}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Health Monitoring Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ECG Monitors</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">2 Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Glucose Monitors</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">3 Devices</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Heart Rate</span>
                      <span className="font-medium">72 BPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stress Levels</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Critical Alerts</span>
                      <Badge variant="destructive">2 Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Compliance Rate</span>
                      <span className="font-medium text-green-600">92%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analytics Overview */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500"
            onClick={() => setActiveTab('analytics')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
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
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">View Alerts</span>
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
      
      {/* Privacy Policy Footer */}
      <PrivacyPolicyFooter />
    </div>
  );
}