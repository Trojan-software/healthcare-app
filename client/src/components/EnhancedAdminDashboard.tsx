import React, { useState, useEffect } from 'react';
import { authedFetch } from '@/lib/queryClient';
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
import { handleApiError } from '@/lib/errorHandler';
import WeeklyReportDashboard from './WeeklyReportDashboard';
import CheckupScheduling from './CheckupScheduling';
import HealthHistoryOverview from './HealthHistoryOverview';
import CriticalAlertsSystem from './CriticalAlertsSystem';
import AdvancedHealthAnalytics from './AdvancedHealthAnalytics';
import PatientManagementModule from './PatientManagementModule';
import BilingualPatientManagement from './BilingualPatientManagement';
import PrivacyPolicyFooter from './PrivacyPolicyFooter';
import DoctorDashboard from './DoctorDashboard';
import LiveMonitoringDashboard from './LiveMonitoringDashboard';
import MedicalDeviceManagement from './MedicalDeviceManagement';
import AlertsEngine from './AlertsEngine';
import AdminSettings from './AdminSettings';
import AuditLogs from './AuditLogs';

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
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      const response = await authedFetch(`/api/admin/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  // Fetch patients data
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['/api/admin/patients'],
    queryFn: async () => {
      const response = await authedFetch(`/api/admin/patients`);
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    }
  });

  // Fetch devices data
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/admin/devices'],
    queryFn: async () => {
      const response = await authedFetch(`/api/admin/devices`);
      if (!response.ok) throw new Error('Failed to fetch devices');
      return response.json();
    }
  });

  // Default stats to avoid undefined errors — dashboardStats is a flat object from /api/admin/dashboard
  const mockStats: DashboardStats = dashboardStats ? {
    totalPatients:    dashboardStats.totalPatients    ?? 0,
    activeMonitoring: dashboardStats.activePatients   ?? 0,
    criticalAlerts:   dashboardStats.criticalAlerts   ?? 0,
    deviceConnections:dashboardStats.deviceConnections?? 0,
    newRegistrations: dashboardStats.weeklyGrowth     ?? 0,
    complianceRate:   dashboardStats.complianceRate   ?? 0,
  } : {
    totalPatients: 0, activeMonitoring: 0, criticalAlerts: 0,
    deviceConnections: 0, newRegistrations: 0, complianceRate: 0,
  };

  // /api/admin/patients and /api/admin/devices return arrays directly (no wrapper property)
  const mockPatients: PatientRecord[] = Array.isArray(patientsData) ? patientsData : [];
  const mockDevices: DeviceInfo[] = Array.isArray(devicesData) ? devicesData : [];
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
        <h1 className="text-3xl font-bold text-gray-900">{t('adminDashboard')}</h1>
        <p className="text-gray-600 mt-1">{t('managePatientDashboardAccess')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="overview"    data-testid="tab-overview"    className="text-xs px-3 py-1.5">{t('dashboard')}</TabsTrigger>
          <TabsTrigger value="patients"   data-testid="tab-patients"    className="text-xs px-3 py-1.5">{t('patientManagement')}</TabsTrigger>
          <TabsTrigger value="monitoring" data-testid="tab-monitoring"  className="text-xs px-3 py-1.5">Live Monitoring</TabsTrigger>
          <TabsTrigger value="doctor"     data-testid="tab-doctor"      className="text-xs px-3 py-1.5">Doctor View</TabsTrigger>
          <TabsTrigger value="devices"    data-testid="tab-devices"     className="text-xs px-3 py-1.5">Devices</TabsTrigger>
          <TabsTrigger value="alerts"     data-testid="tab-alerts"      className="text-xs px-3 py-1.5">Alerts Engine</TabsTrigger>
          <TabsTrigger value="reports"    data-testid="tab-reports"     className="text-xs px-3 py-1.5">{t('reports')}</TabsTrigger>
          <TabsTrigger value="scheduling" data-testid="tab-scheduling"  className="text-xs px-3 py-1.5">{t('checkupScheduling')}</TabsTrigger>
          <TabsTrigger value="analytics"  data-testid="tab-analytics"   className="text-xs px-3 py-1.5">{t('analytics')}</TabsTrigger>
          <TabsTrigger value="settings"   data-testid="tab-settings"    className="text-xs px-3 py-1.5">Settings</TabsTrigger>
          <TabsTrigger value="audit"      data-testid="tab-audit"       className="text-xs px-3 py-1.5">Audit Logs</TabsTrigger>
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
                    <p className="text-sm font-medium text-gray-600">{t('totalPatients')}</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.totalPatients}</p>
                    <p className="text-xs text-green-600 mt-1">+{mockStats.newRegistrations} {t('thisMonth')}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t('activeMonitors')}</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.activeMonitoring}</p>
                    <p className="text-xs text-gray-600 mt-1">{mockStats.complianceRate}% {t('complianceRate')}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t('criticalAlerts')}</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.criticalAlerts}</p>
                    <p className="text-xs text-red-600 mt-1">{t('requiresImmediateAttention')}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t('deviceConnections')}</p>
                    <p className="text-3xl font-bold text-gray-900">{mockStats.deviceConnections}</p>
                    <p className="text-xs text-gray-600 mt-1">{t('hc03DevicesOnline')}</p>
                  </div>
                  <Wifi className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Monitoring Overview */}
          <div className="space-y-6 mb-8">
            {/* Health Status Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    {t('healthMonitoringStatus')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('ecgMonitors')}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {mockDevices.filter(d => d.connectionStatus === 'connected').length} {t('active')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('glucoseMonitors')}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {mockStats.deviceConnections} {t('devices')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('averageHeartRate')}</span>
                      <span className="font-medium">
                        {dashboardStats?.vitalsAverages?.heartRate != null
                          ? `${Math.round(dashboardStats.vitalsAverages.heartRate)} BPM`
                          : '— BPM'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('criticalAlerts')}</span>
                      <Badge variant={mockStats.criticalAlerts > 0 ? 'destructive' : 'secondary'}>
                        {mockStats.criticalAlerts} {t('active')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Compliance Rate</span>
                      <span className={`font-medium ${mockStats.complianceRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {mockStats.complianceRate.toFixed(1)}%
                      </span>
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

        {/* Live Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <LiveMonitoringDashboard />
        </TabsContent>

        {/* Doctor View Tab */}
        <TabsContent value="doctor" className="space-y-6">
          <DoctorDashboard />
        </TabsContent>

        {/* Device Management Tab */}
        <TabsContent value="devices" className="space-y-6">
          <MedicalDeviceManagement />
        </TabsContent>

        {/* Alerts Engine Tab */}
        <TabsContent value="alerts">
          <AlertsEngine />
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

        {/* Admin Settings Tab */}
        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
      </Tabs>
      
      {/* Privacy Policy Footer */}
      <PrivacyPolicyFooter />
    </div>
  );
}