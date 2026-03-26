import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authedFetch, apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle, CheckCircle, Clock, Mail, Shield, Search,
  RefreshCw, Heart, Droplets, Thermometer, Activity, Filter
} from 'lucide-react';

interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  vitalType: string;
  severity: 'emergency' | 'critical' | 'warning';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  title: string;
  description: string;
  emailSent: boolean;
  isResolved: boolean;
  type: string;
}

const SEVERITY_STYLES = {
  emergency: { card: 'border-l-red-600', badge: 'bg-red-100 text-red-800', dot: 'bg-red-600 animate-pulse' },
  critical:  { card: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  warning:   { card: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
};

const STATUS_STYLES = {
  active:       'bg-red-50 text-red-700',
  acknowledged: 'bg-blue-50 text-blue-700',
  resolved:     'bg-green-50 text-green-700',
};

const VITAL_ICONS: Record<string, any> = {
  heartRate: Heart,
  bloodOxygen: Droplets,
  bloodGlucose: Droplets,
  bloodPressure: Activity,
  temperature: Thermometer,
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AlertsEngine() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const { toast } = useToast();

  const { data: alerts = [], isLoading, refetch } = useQuery<Alert[]>({
    queryKey: ['/api/critical-alerts', filterStatus, filterSeverity],
    queryFn: async () => {
      const params = new URLSearchParams({ filter: filterStatus, severity: filterSeverity });
      const r = await authedFetch(`/api/critical-alerts?${params}`);
      if (!r.ok) throw new Error('Failed to load alerts');
      return r.json();
    },
    refetchInterval: 15000,
  });

  const acknowledge = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/critical-alerts/${id}/acknowledge`, 'POST', {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] }); toast({ title: 'Alert acknowledged' }); },
    onError: () => toast({ title: 'Failed to acknowledge', variant: 'destructive' }),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/critical-alerts/${id}/resolve`, 'POST', {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] }); toast({ title: 'Alert resolved' }); },
    onError: () => toast({ title: 'Failed to resolve', variant: 'destructive' }),
  });

  const sendEmail = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/critical-alerts/${id}/send-email`, 'POST', {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] }); toast({ title: 'Email notification sent' }); },
    onError: () => toast({ title: 'Failed to send email', variant: 'destructive' }),
  });

  const filtered = alerts.filter(a => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (a.patientName ?? '').toLowerCase().includes(term) ||
           String(a.patientId ?? '').toLowerCase().includes(term);
  });

  const counts = {
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    emergency: alerts.filter(a => a.severity === 'emergency').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alerts Engine</h2>
          <p className="text-gray-500 text-sm mt-1">Clinical alert lifecycle management — auto-refreshes every 15s</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Active Alerts</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{counts.active}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Emergency</p>
            <p className="text-3xl font-bold text-orange-700 mt-1">{counts.emergency}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Acknowledged</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{counts.acknowledged}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-500 self-center mr-1">Status:</span>
          {['all', 'active', 'acknowledged', 'resolved'].map(s => (
            <Button key={s} size="sm" variant={filterStatus === s ? 'default' : 'outline'} onClick={() => setFilterStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-gray-500 self-center mr-1">Severity:</span>
          {['all', 'emergency', 'critical', 'warning'].map(s => (
            <Button key={s} size="sm" variant={filterSeverity === s ? 'default' : 'outline'} onClick={() => setFilterSeverity(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const sStyle = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.warning;
            const VitalIcon = VITAL_ICONS[alert.vitalType] ?? AlertTriangle;
            return (
              <Card key={alert.id} className={`border-l-4 ${sStyle.card} hover:shadow-md transition-shadow`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-xl flex-shrink-0 ${alert.severity === 'emergency' ? 'bg-red-100' : alert.severity === 'critical' ? 'bg-orange-100' : 'bg-yellow-100'}`}>
                      <VitalIcon className={`w-5 h-5 ${alert.severity === 'emergency' ? 'text-red-600' : alert.severity === 'critical' ? 'text-orange-600' : 'text-yellow-600'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{alert.patientName}</span>
                        <span className="text-xs text-gray-500">{alert.patientId}</span>
                        <Badge className={sStyle.badge}>{(alert.severity ?? 'low').toUpperCase()}</Badge>
                        <Badge variant="outline" className={STATUS_STYLES[alert.status] ?? STATUS_STYLES['active']}>
                          {((alert.status ?? 'active').charAt(0).toUpperCase() + (alert.status ?? 'active').slice(1))}
                        </Badge>
                        {alert.emailSent && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Notified
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-800 text-sm mt-1">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.description}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(alert.timestamp)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {alert.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline"
                            onClick={() => acknowledge.mutate(alert.id)}
                            disabled={acknowledge.isPending}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-8">
                            <Shield className="w-3 h-3 mr-1" /> Acknowledge
                          </Button>
                          {!alert.emailSent && (
                            <Button size="sm" variant="outline"
                              onClick={() => sendEmail.mutate(alert.id)}
                              disabled={sendEmail.isPending}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs h-8">
                              <Mail className="w-3 h-3 mr-1" /> Notify
                            </Button>
                          )}
                        </>
                      )}
                      {alert.status !== 'resolved' && (
                        <Button size="sm" variant="outline"
                          onClick={() => resolve.mutate(alert.id)}
                          disabled={resolve.isPending}
                          className="text-green-600 border-green-200 hover:bg-green-50 text-xs h-8">
                          <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No alerts match your filters</p>
              <p className="text-sm">Try changing the status or severity filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
