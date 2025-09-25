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
  LogOut,
  Monitor,
  Bluetooth,
  BatteryLow
} from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errorHandler';
import { apiRequest } from '@/lib/queryClient';
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
  const [activeTab, setActiveTab] = useState('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { t, isRTL } = useLanguage();

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard']
  });

  // Fetch patients data
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/admin/patients']
  });

  // Fetch devices data
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/admin/devices']
  });

  // Default stats to avoid undefined errors
  const mockStats: DashboardStats = (dashboardStats as any)?.stats || {
    totalPatients: 0,
    activeMonitoring: 0,
    criticalAlerts: 0,
    deviceConnections: 0,
    newRegistrations: 0,
    complianceRate: 0
  };

  const mockPatients: PatientRecord[] = (patientsData as any)?.patients || patientsData || [];
  const mockDevices: DeviceInfo[] = (devicesData as any)?.devices || [];
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
      handleApiError('EnhancedAdminDashboard', 'getTimeAgo', error as Error, { date });
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
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="patients" data-testid="tab-patients">Patient Management</TabsTrigger>
          <TabsTrigger value="devices" data-testid="tab-devices">Device Monitoring</TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">Critical Alerts</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Weekly Reports</TabsTrigger>
          <TabsTrigger value="scheduling" data-testid="tab-scheduling">Check-up Scheduling</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"
              onClick={() => setActiveTab('patients')}
              data-testid="card-total-patients"
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
              data-testid="card-active-monitoring"
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
              data-testid="card-critical-alerts"
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
              data-testid="card-devices"
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
            data-testid="card-analytics"
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
                  data-testid="button-generate-report"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Generate Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('scheduling')}
                  data-testid="button-schedule-checkup"
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Schedule Checkup</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('devices')}
                  data-testid="button-device-settings"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Device Settings</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setActiveTab('alerts')}
                  data-testid="button-view-alerts"
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
          <div className="grid gap-6">
            {/* Device Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Devices</p>
                      <p className="text-2xl font-bold text-gray-900">{mockDevices.length}</p>
                    </div>
                    <Monitor className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Connected</p>
                      <p className="text-2xl font-bold text-green-600">
                        {mockDevices.filter(d => d.connectionStatus === 'connected').length}
                      </p>
                    </div>
                    <Bluetooth className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Low Battery</p>
                      <p className="text-2xl font-bold text-red-600">
                        {mockDevices.filter(d => d.batteryLevel <= 20).length}
                      </p>
                    </div>
                    <BatteryLow className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Device List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  HC03 Device Registry
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Real-time status of all registered HC03 monitoring devices
                </p>
              </CardHeader>
              <CardContent>
                {devicesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : mockDevices.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No devices registered</p>
                    <p className="text-sm text-gray-500">Devices will appear here once patients connect their HC03 monitors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockDevices.map(device => (
                      <div key={device.deviceId} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${device.connectionStatus === 'connected' ? 'bg-green-100' : device.connectionStatus === 'disconnected' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                              <Monitor className={`w-6 h-6 ${device.connectionStatus === 'connected' ? 'text-green-600' : device.connectionStatus === 'disconnected' ? 'text-red-600' : 'text-yellow-600'}`} />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{device.deviceId}</h4>
                                <Badge variant="outline" className="text-xs">HC03</Badge>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">
                                {device.patientName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Patient ID: {device.patientId}
                              </p>
                              <p className="text-xs text-gray-500">
                                {device.patientName}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(device.connectionStatus)}>
                                  {device.connectionStatus === 'connected' ? 'Online' : 
                                   device.connectionStatus === 'disconnected' ? 'Offline' : device.connectionStatus}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                  {device.batteryLevel <= 20 ? (
                                    <BatteryLow className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <Battery className="w-4 h-4 text-green-500" />
                                  )}
                                  <span className={`text-sm font-medium ${device.batteryLevel <= 20 ? 'text-red-600' : 'text-green-600'}`}>
                                    {device.batteryLevel}%
                                  </span>
                                  {device.batteryLevel < 20 && (
                                    <span className="text-xs text-blue-600 ml-1">Charging</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 mb-1">
                                {device.lastSync ? `Last seen: ${getTimeAgo(new Date(device.lastSync))}` : 'Never connected'}
                              </div>
                              
                              {device.firmwareVersion && (
                                <div className="text-xs text-gray-500">
                                  Firmware: v{device.firmwareVersion}
                                </div>
                              )}
                            </div>
                            
                            <Button variant="ghost" size="sm" data-testid={`button-device-${device.deviceId}`}>
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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