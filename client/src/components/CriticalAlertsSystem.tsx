import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle,
  Bell,
  Mail,
  Phone,
  Settings,
  Clock,
  User,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Shield,
  CheckCircle,
  X,
  Send,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CriticalAlert {
  id: string;
  patientId: string;
  patientName: string;
  vitalType: 'heartRate' | 'bloodPressure' | 'bloodOxygen' | 'temperature';
  value: number | { systolic: number; diastolic: number };
  threshold: number | { systolic: number; diastolic: number };
  severity: 'warning' | 'critical' | 'emergency';
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  doctorEmail?: string;
  emailSent: boolean;
  emailSentAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notes?: string;
}

interface AlertThreshold {
  vitalType: string;
  criticalMin?: number;
  criticalMax?: number;
  warningMin?: number;
  warningMax?: number;
}

export default function CriticalAlertsSystem() {
  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null);
  const [alertFilter, setAlertFilter] = useState('active');
  const [severityFilter, setSeverityFilter] = useState('all');

  const queryClient = useQueryClient();

  // Fetch critical alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/critical-alerts', alertFilter, severityFilter],
    refetchInterval: 10000, // Check every 10 seconds for new alerts
  });

  // Fetch alert thresholds
  const { data: thresholds } = useQuery({
    queryKey: ['/api/alert-thresholds'],
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      const response = await fetch(`/api/critical-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      const response = await fetch(`/api/critical-alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    },
  });

  // Send alert email mutation
  const sendAlertEmailMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/critical-alerts/${alertId}/send-email`, {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    },
  });

  const mockAlerts: CriticalAlert[] = alerts || [
    {
      id: 'ALT001',
      patientId: 'PAT001',
      patientName: 'Sarah Johnson',
      vitalType: 'heartRate',
      value: 180,
      threshold: 120,
      severity: 'critical',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'active',
      doctorEmail: 'dr.smith@hospital.com',
      emailSent: true,
      emailSentAt: new Date(Date.now() - 12 * 60 * 1000)
    },
    {
      id: 'ALT002',
      patientId: 'PAT002',
      patientName: 'Michael Chen',
      vitalType: 'bloodOxygen',
      value: 85,
      threshold: 90,
      severity: 'emergency',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'acknowledged',
      doctorEmail: 'dr.brown@hospital.com',
      emailSent: true,
      emailSentAt: new Date(Date.now() - 4 * 60 * 1000),
      acknowledgedBy: 'Dr. Brown',
      acknowledgedAt: new Date(Date.now() - 2 * 60 * 1000)
    },
    {
      id: 'ALT003',
      patientId: 'PAT003',
      patientName: 'Emma Davis',
      vitalType: 'bloodPressure',
      value: { systolic: 200, diastolic: 120 },
      threshold: { systolic: 180, diastolic: 110 },
      severity: 'critical',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      status: 'resolved',
      doctorEmail: 'dr.wilson@hospital.com',
      emailSent: true,
      emailSentAt: new Date(Date.now() - 43 * 60 * 1000),
      acknowledgedBy: 'Dr. Wilson',
      acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 10 * 60 * 1000),
      notes: 'Patient responded well to medication adjustment'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'emergency': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 border-red-200';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVitalIcon = (vitalType: string) => {
    switch (vitalType) {
      case 'heartRate': return <Heart className="w-4 h-4 text-red-500" />;
      case 'bloodPressure': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'bloodOxygen': return <Droplets className="w-4 h-4 text-cyan-500" />;
      case 'temperature': return <Thermometer className="w-4 h-4 text-orange-500" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatVitalValue = (vitalType: string, value: any) => {
    switch (vitalType) {
      case 'heartRate':
        return `${value} BPM`;
      case 'bloodPressure':
        return `${value.systolic}/${value.diastolic} mmHg`;
      case 'bloodOxygen':
        return `${value}%`;
      case 'temperature':
        return `${value}°C`;
      default:
        return String(value);
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredAlerts = mockAlerts.filter(alert => {
    const statusMatch = alertFilter === 'all' || alert.status === alertFilter;
    const severityMatch = severityFilter === 'all' || alert.severity === severityFilter;
    return statusMatch && severityMatch;
  });

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
            <Shield className="w-8 h-8 text-red-600" />
            Critical Alerts System
          </h2>
          <p className="text-gray-600 mt-1">Monitor and manage critical patient health alerts</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
          
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Severity</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="emergency">Emergency</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure Thresholds
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-red-600">
                  {mockAlerts.filter(a => a.status === 'active').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {mockAlerts.filter(a => a.status === 'acknowledged').length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {mockAlerts.filter(a => a.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-3xl font-bold text-blue-600">
                  {mockAlerts.filter(a => a.emailSent).length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md ${
                  alert.severity === 'emergency' ? 'border-red-300 bg-red-50' :
                  alert.severity === 'critical' ? 'border-red-200 bg-red-25' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getVitalIcon(alert.vitalType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{alert.patientName}</h4>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Patient ID:</span> {alert.patientId} •{' '}
                        <span className="font-medium">Vital:</span> {alert.vitalType} •{' '}
                        <span className="font-medium">Value:</span> {formatVitalValue(alert.vitalType, alert.value)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(alert.timestamp)}
                        </span>
                        {alert.emailSent && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Mail className="w-3 h-3" />
                            Email sent
                          </span>
                        )}
                        {alert.doctorEmail && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {alert.doctorEmail}
                          </span>
                        )}
                      </div>
                      
                      {alert.notes && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Notes:</strong> {alert.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.status === 'active' && (
                      <>
                        {!alert.emailSent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendAlertEmailMutation.mutate(alert.id)}
                            disabled={sendAlertEmailMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Email
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlertMutation.mutate({ alertId: alert.id })}
                          disabled={acknowledgeAlertMutation.isPending}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Acknowledge
                        </Button>
                      </>
                    )}
                    
                    {alert.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        onClick={() => resolveAlertMutation.mutate({ alertId: alert.id })}
                        disabled={resolveAlertMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Timeline for acknowledged/resolved alerts */}
                {(alert.acknowledgedAt || alert.resolvedAt) && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      {alert.acknowledgedAt && (
                        <span>
                          Acknowledged by {alert.acknowledgedBy} at {alert.acknowledgedAt.toLocaleString()}
                        </span>
                      )}
                      {alert.resolvedAt && (
                        <span>
                          Resolved at {alert.resolvedAt.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredAlerts.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts Found</h3>
                <p className="text-gray-600">
                  No critical alerts match the current filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}