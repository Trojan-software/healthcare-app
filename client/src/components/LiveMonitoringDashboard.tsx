import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authedFetch } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Heart, Activity, Thermometer, Droplets, Wifi, WifiOff,
  Battery, Search, RefreshCw, AlertTriangle, CheckCircle, Eye
} from 'lucide-react';

interface MonitoringPatient {
  patientId: string;
  patientName: string;
  email: string;
  hospitalId: string | null;
  status: 'critical' | 'attention' | 'normal' | 'no_data';
  lastReading: string | null;
  vitals: {
    heartRate: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    temperature: number | null;
    oxygenLevel: number | null;
    bloodGlucose: number | null;
  } | null;
  device: {
    deviceId: string;
    connectionStatus: string;
    batteryLevel: number;
  } | null;
}

const STATUS_STYLES = {
  critical: { card: 'border-red-400 bg-red-50', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500 animate-pulse', label: 'CRITICAL' },
  attention: { card: 'border-yellow-400 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500', label: 'ATTENTION' },
  normal: { card: 'border-green-400 bg-green-50', badge: 'bg-green-100 text-green-800', dot: 'bg-green-500', label: 'NORMAL' },
  no_data: { card: 'border-gray-300 bg-gray-50', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: 'NO DATA' },
};

function timeAgo(ts: string | null) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function VitalCell({ value, unit, warn }: { value: number | null | undefined; unit: string; warn?: boolean }) {
  return (
    <div className={`text-center ${warn ? 'text-red-600' : 'text-gray-800'}`}>
      <span className="font-bold text-sm">{value != null ? value : '—'}</span>
      <span className="text-[10px] text-gray-400 block">{unit}</span>
    </div>
  );
}

export default function LiveMonitoringDashboard() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'attention' | 'normal'>('all');
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data = [], isLoading, refetch, dataUpdatedAt } = useQuery<MonitoringPatient[]>({
    queryKey: ['/api/admin/live-monitoring'],
    queryFn: async () => {
      const r = await authedFetch('/api/admin/live-monitoring');
      if (!r.ok) throw new Error('Failed to load monitoring data');
      return r.json();
    },
    refetchInterval: 20000,
  });

  // Live "X seconds since last refresh" counter
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsAgo(Math.round((Date.now() - dataUpdatedAt) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [dataUpdatedAt]);

  const filtered = data.filter(p => {
    const matchSearch = !search || (p.patientName ?? '').toLowerCase().includes(search.toLowerCase()) || String(p.patientId ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    critical: data.filter(p => p.status === 'critical').length,
    attention: data.filter(p => p.status === 'attention').length,
    normal: data.filter(p => p.status === 'normal').length,
    no_data: data.filter(p => p.status === 'no_data').length,
  };

  return (
    <div className="space-y-5">
      {/* Live Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-900">Live Monitoring</h2>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {data.length} patients · Last updated {secondsAgo}s ago · Auto-refreshes every 20s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Now
        </Button>
      </div>

      {/* Status Summary Bar */}
      <div className="grid grid-cols-4 gap-3">
        {([['critical', 'bg-red-500', counts.critical], ['attention', 'bg-yellow-500', counts.attention], ['normal', 'bg-green-500', counts.normal], ['no_data', 'bg-gray-400', counts.no_data]] as const).map(([s, color, count]) => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s as any)}
            className={`rounded-xl p-3 text-left border-2 transition-all ${filter === s ? 'border-gray-900 shadow-md' : 'border-transparent'} ${s === 'critical' ? 'bg-red-50' : s === 'attention' ? 'bg-yellow-50' : s === 'normal' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{s === 'no_data' ? 'No Data' : s}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search patient name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(patient => {
            const s = STATUS_STYLES[patient.status] ?? STATUS_STYLES.no_data;
            const isExpanded = expandedId === patient.patientId;
            return (
              <div key={patient.patientId}
                className={`rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md ${s.card}`}
                onClick={() => setExpandedId(isExpanded ? null : patient.patientId)}
              >
                {/* Patient Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{patient.patientName || patient.patientId}</p>
                      <p className="text-[11px] text-gray-500 truncate">{patient.patientId}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
                    {patient.device && (
                      <div className="flex items-center gap-1">
                        {patient.device.connectionStatus === 'connected'
                          ? <Wifi className="w-3 h-3 text-green-500" />
                          : <WifiOff className="w-3 h-3 text-gray-400" />
                        }
                        {patient.device.batteryLevel != null && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Battery className="w-3 h-3" />{patient.device.batteryLevel}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vitals Row */}
                {patient.vitals ? (
                  <div className="grid grid-cols-5 gap-1 bg-white bg-opacity-70 rounded-lg p-2">
                    <div className="text-center">
                      <Heart className="w-3 h-3 text-red-400 mx-auto mb-0.5" />
                      <p className={`text-xs font-bold ${(patient.vitals.heartRate ?? 0) > 120 || (patient.vitals.heartRate ?? 999) < 50 ? 'text-red-600' : 'text-gray-800'}`}>
                        {patient.vitals.heartRate ?? '—'}
                      </p>
                      <p className="text-[9px] text-gray-400">BPM</p>
                    </div>
                    <div className="text-center">
                      <Activity className="w-3 h-3 text-blue-400 mx-auto mb-0.5" />
                      <p className={`text-xs font-bold ${(patient.vitals.bloodPressureSystolic ?? 0) > 180 ? 'text-red-600' : 'text-gray-800'}`}>
                        {patient.vitals.bloodPressureSystolic ?? '—'}/{patient.vitals.bloodPressureDiastolic ?? '—'}
                      </p>
                      <p className="text-[9px] text-gray-400">BP</p>
                    </div>
                    <div className="text-center">
                      <Droplets className="w-3 h-3 text-cyan-500 mx-auto mb-0.5" />
                      <p className={`text-xs font-bold ${(patient.vitals.oxygenLevel ?? 100) < 90 ? 'text-red-600' : 'text-gray-800'}`}>
                        {patient.vitals.oxygenLevel ?? '—'}
                      </p>
                      <p className="text-[9px] text-gray-400">SpO2%</p>
                    </div>
                    <div className="text-center">
                      <Thermometer className="w-3 h-3 text-orange-400 mx-auto mb-0.5" />
                      <p className={`text-xs font-bold ${(patient.vitals.temperature ?? 0) > 39 ? 'text-red-600' : 'text-gray-800'}`}>
                        {patient.vitals.temperature?.toFixed(1) ?? '—'}
                      </p>
                      <p className="text-[9px] text-gray-400">°C</p>
                    </div>
                    <div className="text-center">
                      <Droplets className="w-3 h-3 text-purple-400 mx-auto mb-0.5" />
                      <p className={`text-xs font-bold ${(patient.vitals.bloodGlucose ?? 0) > 250 ? 'text-red-600' : 'text-gray-800'}`}>
                        {patient.vitals.bloodGlucose ?? '—'}
                      </p>
                      <p className="text-[9px] text-gray-400">Gluc</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-400 text-xs italic">No readings yet</div>
                )}

                <p className="text-[10px] text-gray-400 mt-2 text-right">
                  {timeAgo(patient.lastReading)}
                </p>
              </div>
            );
          })}
          {filtered.length === 0 && !isLoading && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No patients match your current filter</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
