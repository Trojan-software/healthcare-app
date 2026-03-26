import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authedFetch, apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Wifi, WifiOff, Battery, BatteryCharging, Search, RefreshCw,
  Cpu, Signal, AlertTriangle, CheckCircle, Settings, Link
} from 'lucide-react';

interface HcDevice {
  id: number;
  deviceId: string;
  deviceName: string | null;
  deviceType: string;
  macAddress: string | null;
  firmwareVersion: string | null;
  batteryLevel: number | null;
  chargingStatus: boolean;
  connectionStatus: string;
  lastConnected: string | null;
  patientId: string | null;
  supportedMeasurements: string[] | null;
}

const CONNECTION_STYLES: Record<string, { color: string; icon: any; label: string }> = {
  connected: { color: 'bg-green-100 text-green-800', icon: Wifi, label: 'Connected' },
  disconnected: { color: 'bg-red-100 text-red-800', icon: WifiOff, label: 'Disconnected' },
  charging: { color: 'bg-blue-100 text-blue-800', icon: BatteryCharging, label: 'Charging' },
  glucose_complete: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Glucose Done' },
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

function BatteryIndicator({ level, charging }: { level: number | null; charging: boolean }) {
  if (level == null) return <span className="text-gray-400 text-xs">—</span>;
  const color = level > 50 ? 'text-green-500' : level > 20 ? 'text-yellow-500' : 'text-red-500';
  const Icon = charging ? BatteryCharging : Battery;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Icon className="w-4 h-4" /> {level}%
    </span>
  );
}

export default function MedicalDeviceManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const { data: devices = [], isLoading, refetch } = useQuery<HcDevice[]>({
    queryKey: ['/api/admin/devices'],
    queryFn: async () => {
      const r = await authedFetch('/api/admin/devices');
      if (!r.ok) throw new Error('Failed to load devices');
      return r.json();
    },
    refetchInterval: 15000,
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/patients-list'],
    queryFn: async () => {
      const r = await authedFetch('/api/admin/patients-list');
      if (!r.ok) throw new Error('Failed to load patients');
      return r.json();
    },
  });
  const patientMap = Object.fromEntries(patients.map((p: any) => [p.id, p.name]));

  const statusMutation = useMutation({
    mutationFn: ({ deviceId, status }: { deviceId: string; status: string }) =>
      apiRequest(`/api/devices/${deviceId}/status`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/devices'] });
      toast({ title: 'Device status updated' });
    },
    onError: () => toast({ title: 'Failed to update device', variant: 'destructive' }),
  });

  const filtered = devices.filter(d => {
    const matchSearch = !search || (d.deviceId + (d.deviceName ?? '') + (d.patientId ?? '')).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.connectionStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: devices.length,
    connected: devices.filter(d => d.connectionStatus === 'connected').length,
    disconnected: devices.filter(d => d.connectionStatus === 'disconnected').length,
    charging: devices.filter(d => d.chargingStatus || d.connectionStatus === 'charging').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Medical Device Management</h2>
          <p className="text-gray-500 text-sm mt-1">HC03 Bluetooth device registry — auto-refreshes every 15s</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Device Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Devices', value: stats.total, color: 'blue', icon: Cpu },
          { label: 'Connected', value: stats.connected, color: 'green', icon: Wifi },
          { label: 'Disconnected', value: stats.disconnected, color: 'red', icon: WifiOff },
          { label: 'Charging', value: stats.charging, color: 'purple', icon: BatteryCharging },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className={`border-l-4 border-l-${color}-500`}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <Icon className={`w-8 h-8 text-${color}-400`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search device ID, patient…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'connected', 'disconnected', 'charging'].map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Device Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(device => {
            const connStyle = CONNECTION_STYLES[device.connectionStatus] ?? CONNECTION_STYLES.disconnected;
            const ConnIcon = connStyle.icon;
            return (
              <Card key={device.deviceId} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${device.connectionStatus === 'connected' ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Signal className={`w-5 h-5 ${device.connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{device.deviceId}</p>
                        <p className="text-xs text-gray-500">{device.deviceName ?? 'HC03 Device'}</p>
                      </div>
                    </div>
                    <Badge className={connStyle.color}>
                      <ConnIcon className="w-3 h-3 mr-1" />
                      {connStyle.label}
                    </Badge>
                  </div>

                  {/* Device Details Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Type</span>
                      <p className="font-medium text-gray-800 capitalize">{(device.deviceType ?? 'unknown').replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Battery</span>
                      <BatteryIndicator level={device.batteryLevel} charging={device.chargingStatus} />
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Assigned Patient</span>
                      <p className="font-medium text-gray-800 text-xs">
                        {device.patientId ? (patientMap[device.patientId] || device.patientId) : 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Last Connected</span>
                      <p className="font-medium text-gray-800 text-xs">{timeAgo(device.lastConnected)}</p>
                    </div>
                    {device.macAddress && (
                      <div>
                        <span className="text-gray-500 text-xs">MAC Address</span>
                        <p className="font-mono text-xs text-gray-700">{device.macAddress}</p>
                      </div>
                    )}
                    {device.firmwareVersion && (
                      <div>
                        <span className="text-gray-500 text-xs">Firmware</span>
                        <p className="font-mono text-xs text-gray-700">{device.firmwareVersion}</p>
                      </div>
                    )}
                  </div>

                  {/* Supported Measurements */}
                  {device.supportedMeasurements && device.supportedMeasurements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1.5">Supported Measurements</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(device.supportedMeasurements ?? []).map((m: string) => (
                          <span key={m} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{(m ?? '').replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && !isLoading && (
            <div className="col-span-2 text-center py-12 text-gray-400">
              <Cpu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No devices match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
