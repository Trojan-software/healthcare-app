import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authedFetch, apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Settings, Shield, Bell, Activity, FileText, Save,
  ChevronRight, CheckCircle, AlertTriangle, Lock, Globe
} from 'lucide-react';

interface Setting {
  key: string;
  value: string | null;
  category: string;
  description: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  general:       { icon: Globe,         label: 'General',       color: 'blue' },
  security:      { icon: Lock,          label: 'Security',      color: 'red' },
  alerts:        { icon: AlertTriangle, label: 'Alert Thresholds', color: 'orange' },
  notifications: { icon: Bell,          label: 'Notifications', color: 'purple' },
  compliance:    { icon: Shield,        label: 'Compliance',    color: 'green' },
};

export default function AdminSettings() {
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('general');
  const { toast } = useToast();

  const { data: settings = [], isLoading } = useQuery<Setting[]>({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const r = await authedFetch('/api/admin/settings');
      if (!r.ok) throw new Error('Failed to load settings');
      return r.json();
    },
  });

  // Init local edit state when settings load
  useEffect(() => {
    const vals: Record<string, string> = {};
    settings.forEach(s => { vals[s.key] = s.value ?? ''; });
    setEditValues(vals);
    setDirtyKeys(new Set());
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      const payload = keys.map(k => {
        const s = settings.find(x => x.key === k);
        return { key: k, value: editValues[k], category: s?.category ?? 'general', description: s?.description ?? '' };
      });
      const r = await apiRequest('PUT', '/api/admin/settings/bulk', payload);
      if (!r.ok) throw new Error('Failed to save');
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      setDirtyKeys(new Set());
      toast({ title: 'Settings saved', description: 'All changes have been applied.' });
    },
    onError: () => toast({ title: 'Failed to save settings', variant: 'destructive' }),
  });

  const handleChange = (key: string, value: string) => {
    setEditValues(prev => ({ ...prev, [key]: value }));
    setDirtyKeys(prev => new Set(prev).add(key));
  };

  const handleSave = () => {
    saveMutation.mutate(Array.from(dirtyKeys));
  };

  const categorized = Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => ({
    ...cfg,
    key: cat,
    settings: settings.filter(s => s.category === cat),
  }));

  const currentCategory = categorized.find(c => c.key === activeCategory) ?? categorized[0];

  const INPUT_TYPE: Record<string, string> = {
    session_timeout_minutes: 'number',
    max_login_attempts: 'number',
    alert_hr_critical_max: 'number',
    alert_hr_critical_min: 'number',
    alert_spo2_critical_min: 'number',
    alert_temp_critical_max: 'number',
    alert_bp_sys_max: 'number',
    alert_glucose_max: 'number',
    data_retention_days: 'number',
  };
  const BOOLEAN_KEYS = new Set(['email_notifications', 'sms_notifications', 'audit_log_enabled']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
          <p className="text-gray-500 text-sm mt-1">System configuration, alert thresholds, and compliance settings</p>
        </div>
        {dirtyKeys.size > 0 && (
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving…' : `Save ${dirtyKeys.size} change${dirtyKeys.size > 1 ? 's' : ''}`}
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Left Nav */}
        <nav className="w-52 flex-shrink-0 space-y-1">
          {categorized.map(cat => {
            const Icon = cat.icon;
            const isDirtyCat = cat.settings.some(s => dirtyKeys.has(s.key));
            return (
              <button key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${activeCategory === cat.key ? `bg-${cat.color}-50 text-${cat.color}-700 font-semibold` : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{cat.label}</span>
                {isDirtyCat && <span className="w-2 h-2 rounded-full bg-orange-400" />}
              </button>
            );
          })}
        </nav>

        {/* Settings Panel */}
        <div className="flex-1 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {React.createElement(currentCategory?.icon ?? Settings, { className: 'w-5 h-5' })}
                    {currentCategory?.label} Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentCategory?.settings.map(setting => {
                    const isDirty = dirtyKeys.has(setting.key);
                    const isBool = BOOLEAN_KEYS.has(setting.key);
                    const inputType = INPUT_TYPE[setting.key] ?? 'text';
                    const val = editValues[setting.key] ?? setting.value ?? '';

                    return (
                      <div key={setting.key} className={`p-4 rounded-xl border ${isDirty ? 'border-orange-300 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <label className="text-sm font-semibold text-gray-800">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                              {isDirty && <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px] py-0">Modified</Badge>}
                            </div>
                            {setting.description && (
                              <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                            )}
                            {isBool ? (
                              <div className="flex gap-3 mt-1">
                                {['true', 'false'].map(opt => (
                                  <button key={opt}
                                    onClick={() => handleChange(setting.key, opt)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${val === opt ? (opt === 'true' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300') : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                    {opt === 'true' ? 'Enabled' : 'Disabled'}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <Input type={inputType} value={val} onChange={e => handleChange(setting.key, e.target.value)}
                                className="max-w-xs bg-white text-sm h-8" />
                            )}
                          </div>
                          {setting.updatedAt && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-gray-400">
                                Last updated<br />
                                {new Date(setting.updatedAt).toLocaleDateString()}
                                {setting.updatedBy && <><br />by {setting.updatedBy}</>}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {currentCategory?.settings.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No settings in this category</p>
                  )}
                </CardContent>
              </Card>

              {/* Compliance Notice */}
              {activeCategory === 'compliance' && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-semibold mb-1">DOH/ADHCC Compliance Active</p>
                        <p className="text-green-700">This system operates under UAE Department of Health and ADHCC regulatory standards. Data retention, audit logging, and security settings must comply with local healthcare regulations.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
