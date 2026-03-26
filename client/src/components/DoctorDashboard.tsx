import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authedFetch } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, AlertTriangle, Activity, Heart, Thermometer, Droplets,
  TrendingUp, Clock, Search, ChevronRight, RefreshCw
} from 'lucide-react';

interface PatientSummary {
  patientId: string;
  patientName: string;
  status: 'critical' | 'attention' | 'normal' | 'no_data';
  lastReading: string | null;
  readingsToday: number;
  alertsCount: number;
  latestVitals: {
    heartRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    oxygenLevel: number | null;
    temperature: number | null;
  } | null;
}

interface DoctorDashboardData {
  summary: {
    totalPatients: number;
    activeAlerts: number;
    criticalAlerts: number;
    patientsWithReadingsToday: number;
  };
  patients: PatientSummary[];
  recentAlerts: any[];
}

const statusConfig = {
  critical: { color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500', label: 'Critical' },
  attention: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500', label: 'Attention' },
  normal: { color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500', label: 'Normal' },
  no_data: { color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', label: 'No Data' },
};

function timeAgo(ts: string | null) {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DoctorDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch, isFetching } = useQuery<DoctorDashboardData>({
    queryKey: ['/api/doctor/dashboard'],
    queryFn: async () => {
      const r = await authedFetch('/api/doctor/dashboard');
      if (!r.ok) throw new Error('Failed to load doctor dashboard');
      return r.json();
    },
    refetchInterval: 30000,
  });

  const patients = (data?.patients ?? []).filter(p => {
    const matchSearch = !search || (p.patientName ?? '').toLowerCase().includes(search.toLowerCase()) || String(p.patientId ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const summary = data?.summary ?? { totalPatients: 0, activeAlerts: 0, criticalAlerts: 0, patientsWithReadingsToday: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Patient care overview — auto-refreshes every 30 seconds</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalPatients}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{summary.criticalAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Alerts</p>
                <p className="text-3xl font-bold text-yellow-700 mt-1">{summary.activeAlerts}</p>
              </div>
              <Activity className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Readings Today</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{summary.patientsWithReadingsToday}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by name or patient ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'critical', 'attention', 'normal', 'no_data'].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s && s !== 'all' ? (s === 'critical' ? 'bg-red-600' : s === 'attention' ? 'bg-yellow-500' : s === 'normal' ? 'bg-green-600' : '') : ''}
            >
              {s === 'all' ? 'All' : s === 'no_data' ? 'No Data' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Patient Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {patients.map(patient => {
            const cfg = statusConfig[patient.status] ?? statusConfig.no_data;
            return (
              <Card key={patient.patientId} className={`border-l-4 ${patient.status === 'critical' ? 'border-l-red-500' : patient.status === 'attention' ? 'border-l-yellow-500' : patient.status === 'normal' ? 'border-l-green-500' : 'border-l-gray-300'} hover:shadow-md transition-shadow`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                        <span className="font-semibold text-gray-900">{patient.patientName || patient.patientId}</span>
                        {patient.alertsCount > 0 && (
                          <Badge variant="destructive" className="text-xs py-0 px-1.5">{patient.alertsCount} alert{patient.alertsCount !== 1 ? 's' : ''}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 ml-4">{patient.patientId}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> {timeAgo(patient.lastReading)}
                      </p>
                    </div>
                  </div>

                  {patient.latestVitals ? (
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      <div className="text-center">
                        <Heart className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{patient.latestVitals.heartRate ?? '—'}</p>
                        <p className="text-[10px] text-gray-400">BPM</p>
                      </div>
                      <div className="text-center">
                        <Activity className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">
                          {patient.latestVitals.bloodPressureSystolic ?? '—'}/{patient.latestVitals.bloodPressureDiastolic ?? '—'}
                        </p>
                        <p className="text-[10px] text-gray-400">mmHg</p>
                      </div>
                      <div className="text-center">
                        <Droplets className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{patient.latestVitals.oxygenLevel ?? '—'}</p>
                        <p className="text-[10px] text-gray-400">SpO2%</p>
                      </div>
                      <div className="text-center">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{patient.latestVitals.temperature?.toFixed(1) ?? '—'}</p>
                        <p className="text-[10px] text-gray-400">°C</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400 mx-auto mb-0.5" />
                        <p className="text-xs font-bold text-gray-800">{patient.readingsToday}</p>
                        <p className="text-[10px] text-gray-400">Today</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center mt-3 italic">No vital signs recorded yet</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {patients.length === 0 && !isLoading && (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No patients match your filters</p>
              <p className="text-sm">Try adjusting the search or status filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
