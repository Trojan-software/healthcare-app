import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authedFetch } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield, Search, RefreshCw, Download, ChevronLeft, ChevronRight,
  LogIn, LogOut, Eye, Edit, AlertTriangle, Trash, Settings, User
} from 'lucide-react';

interface AuditLogEntry {
  id: number;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  status: string;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  login:               { icon: LogIn,       color: 'text-green-600', label: 'Login' },
  logout:              { icon: LogOut,      color: 'text-gray-500',  label: 'Logout' },
  login_failed:        { icon: AlertTriangle, color: 'text-red-500', label: 'Login Failed' },
  view_patient:        { icon: Eye,         color: 'text-blue-500',  label: 'View Patient' },
  update_patient:      { icon: Edit,        color: 'text-orange-500', label: 'Update Patient' },
  submit_vitals:       { icon: Activity,    color: 'text-purple-500', label: 'Submit Vitals' },
  acknowledge_alert:   { icon: Shield,      color: 'text-blue-500',  label: 'Acknowledge Alert' },
  resolve_alert:       { icon: Shield,      color: 'text-green-500', label: 'Resolve Alert' },
  update_setting:      { icon: Settings,    color: 'text-orange-500', label: 'Update Setting' },
  bulk_update_settings:{ icon: Settings,    color: 'text-orange-500', label: 'Bulk Update Settings' },
  delete_patient:      { icon: Trash,       color: 'text-red-600',   label: 'Delete Patient' },
  register_patient:    { icon: User,        color: 'text-green-500', label: 'Register Patient' },
};

function Activity({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}

const PAGE_SIZE = 50;

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const { data, isLoading, refetch } = useQuery<AuditResponse>({
    queryKey: ['/api/admin/audit-logs', page, actionFilter, resourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        ...(actionFilter && { action: actionFilter }),
        ...(resourceFilter && { resource: resourceFilter }),
      });
      const r = await authedFetch(`/api/admin/audit-logs?${params}`);
      if (!r.ok) throw new Error('Failed to load audit logs');
      return r.json();
    },
    refetchInterval: 30000,
  });

  const logs = (data?.logs ?? []).filter(l =>
    !search || (l.userEmail ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.action ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.resource ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExport = () => {
    const headers = ['ID', 'Time', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'IP', 'Status', 'Details'];
    const rows = logs.map(l => [
      l.id, new Date(l.createdAt).toISOString(), l.userEmail ?? '', l.userRole ?? '',
      l.action, l.resource ?? '', l.resourceId ?? '', l.ipAddress ?? '', l.status, l.details ?? ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const ACTION_TYPES = ['login', 'logout', 'login_failed', 'view_patient', 'submit_vitals', 'acknowledge_alert', 'resolve_alert', 'update_setting', 'register_patient'];
  const RESOURCE_TYPES = ['patient', 'vital_signs', 'alert', 'device', 'admin_setting', 'session'];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" /> Audit Logs
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {total.toLocaleString()} total events · DOH/ADHCC compliance traceability · Auto-refreshes every 30s
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search user, action, resource…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 min-w-36">
          <option value="">All Actions</option>
          {ACTION_TYPES.map(a => <option key={a} value={a}>{ACTION_CONFIG[a]?.label ?? a}</option>)}
        </select>
        <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 min-w-36">
          <option value="">All Resources</option>
          {RESOURCE_TYPES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Log Table */}
      <Card>
        <CardContent className="pt-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Time', 'User', 'Role', 'Action', 'Resource', 'IP', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide py-3 px-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="py-3 px-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.map(log => {
                const cfg = ACTION_CONFIG[log.action];
                const Icon = cfg?.icon ?? Shield;
                const details = log.details ? (() => { try { return JSON.parse(log.details); } catch { return null; } })() : null;
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{new Date(log.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div>
                        <p className="text-xs font-medium text-gray-800 truncate max-w-36">{log.userEmail ?? log.userId ?? 'System'}</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-xs capitalize py-0">{log.userRole ?? 'unknown'}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg?.color ?? 'text-gray-400'}`} />
                        <span className="text-xs font-medium text-gray-800 whitespace-nowrap">{cfg?.label ?? log.action}</span>
                      </div>
                      {details && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-36">
                          {Object.entries(details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-gray-600 capitalize">{log.resource ?? '—'}</span>
                      {log.resourceId && <p className="text-[10px] text-gray-400 truncate max-w-28">{log.resourceId}</p>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-gray-500 font-mono">{log.ipAddress ?? '—'}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge className={`text-[10px] py-0 ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                    <Shield className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    No audit logs found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()} events
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 self-center px-2">Page {page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
