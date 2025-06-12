import { useState } from "react";
import { Smartphone, Settings, Bluetooth, Heart, TrendingUp, Users, Calendar, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import BluetoothDeviceManager from "@/components/BluetoothDeviceManager";
import MobileVitalSignsInput from "@/components/MobileVitalSignsInput";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AlertsPanel from "@/components/AlertsPanel";
import ReminderSettings from "@/components/ReminderSettings";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activePatients: number;
  checkupsToday: number;
  criticalAlerts: number;
  completionRate: number;
}

export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState<'monitor' | 'bluetooth' | 'analytics' | 'settings'>('monitor');

  // Mock dashboard stats for demonstration
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard-stats'],
    enabled: false, // Disable for now since we need auth
  });

  const dashboardStats = {
    activePatients: 1,
    checkupsToday: 5,
    criticalAlerts: 2,
    completionRate: 95.8
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const tabs = [
    { id: 'monitor', label: 'Monitor', icon: Heart },
    { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-medical-bg">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-medical-blue rounded-xl flex items-center justify-center">
                  <Smartphone className="text-white h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">HealthMonitor Mobile</h1>
                  <p className="text-xs text-muted-foreground">Bluetooth Connected Care</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Main
                </Button>
              </Link>
              <Badge className="bg-green-500 text-white">
                Patient Mode
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mobile Health Dashboard</h1>
              <p className="text-muted-foreground">Today, {currentDate}</p>
            </div>

            {/* Stats Cards - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Today's Readings</p>
                    <p className="text-xl font-bold text-foreground mt-1">{dashboardStats.checkupsToday}</p>
                  </div>
                  <div className="vital-indicator bg-healthcare-green/10">
                    <Calendar className="text-healthcare-green h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active Alerts</p>
                    <p className="text-xl font-bold text-foreground mt-1">{dashboardStats.criticalAlerts}</p>
                  </div>
                  <div className="vital-indicator bg-alert-red/10">
                    <AlertTriangle className="text-alert-red h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="metric-card lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-xl font-bold text-foreground mt-1">{dashboardStats.completionRate}%</p>
                  </div>
                  <div className="vital-indicator bg-medical-blue/10">
                    <TrendingUp className="text-medical-blue h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-medical-blue shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MobileVitalSignsInput />
              </div>
              <div className="space-y-6">
                <AlertsPanel />
                <ReminderSettings />
              </div>
            </div>
          )}

          {activeTab === 'bluetooth' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <BluetoothDeviceManager />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">HC03 Device Information</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Supported Measurements</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• ECG (Electrocardiogram)</li>
                        <li>• Blood Oxygen (SpO2)</li>
                        <li>• Blood Pressure</li>
                        <li>• Body Temperature</li>
                        <li>• Blood Glucose</li>
                        <li>• Heart Rate Variability</li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Connection Requirements</h4>
                      <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                        <li>• Bluetooth 4.0+ enabled</li>
                        <li>• Location permissions</li>
                        <li>• Device within 10 meters</li>
                        <li>• HC03 device powered on</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AnalyticsDashboard />
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">Health Insights</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Weekly Trend</p>
                        <p className="text-xs text-green-700 dark:text-green-300">Improving</p>
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Compliance</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Excellent</p>
                      </div>
                      <Badge className="bg-blue-500 text-white">95%</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Next Check-up</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">In 2 hours</p>
                      </div>
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReminderSettings />
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">Device Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Auto-sync with HC03</p>
                        <p className="text-xs text-muted-foreground">Automatically sync readings when device connects</p>
                      </div>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Background scanning</p>
                        <p className="text-xs text-muted-foreground">Keep scanning for HC03 devices</p>
                      </div>
                      <Button variant="outline" size="sm">On</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Data validation</p>
                        <p className="text-xs text-muted-foreground">Verify readings before saving</p>
                      </div>
                      <Button variant="outline" size="sm">Strict</Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <h3 className="text-lg font-semibold mb-4">Privacy & Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Encrypt local data</p>
                        <p className="text-xs text-muted-foreground">Protect stored health data</p>
                      </div>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Share anonymized data</p>
                        <p className="text-xs text-muted-foreground">Help improve health research</p>
                      </div>
                      <Button variant="outline" size="sm">Opt-in</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}