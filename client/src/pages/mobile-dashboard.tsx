import { useState } from "react";
import { Settings, Bluetooth, Heart, TrendingUp, Users, Calendar, AlertTriangle, ArrowLeft, History, UserCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import MobileVitalSignsInput from "@/components/MobileVitalSignsInput";
import VitalSignsHistory from "@/components/VitalSignsHistory";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AlertsPanel from "@/components/AlertsPanel";
import ReminderSettings from "@/components/ReminderSettings";
import AuthWrapper from "@/components/AuthWrapper";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activePatients: number;
  checkupsToday: number;
  criticalAlerts: number;
  completionRate: number;
}

function MobileDashboardContent({ user, showProfile, setShowProfile, logout }: any) {
  const [activeTab, setActiveTab] = useState<'monitor' | 'bluetooth' | 'history' | 'analytics' | 'settings'>('monitor');

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
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile App Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg bg-white">
                <img 
                  src="/attached_assets/logo2_1749727548844.JPG" 
                  alt="24/7 Tele H Technology Services"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">24/7 Tele H</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Technology Services</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => setShowProfile(true)}
                variant="outline" 
                size="sm" 
                className="px-3 py-1 text-xs"
              >
                <User className="h-4 w-4 mr-1" />
                Profile
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Button>
              </Link>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile App Content */}
      <div className="px-4 pb-20">
        {/* Quick Stats */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardStats.checkupsToday}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Today</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardStats.criticalAlerts}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Alerts</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dashboardStats.completionRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm">
            <div className="grid grid-cols-5 gap-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mb-1" />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <MobileVitalSignsInput />
              <div className="grid grid-cols-1 gap-4">
                <AlertsPanel />
                <ReminderSettings />
              </div>
            </div>
          )}

          {activeTab === 'bluetooth' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">HC03 Device Info</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">Measurements</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
                      <div>• ECG Monitor</div>
                      <div>• Blood Oxygen</div>
                      <div>• Blood Pressure</div>
                      <div>• Temperature</div>
                      <div>• Blood Glucose</div>
                      <div>• Heart Rate</div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2 text-sm">Requirements</h4>
                    <div className="grid grid-cols-1 gap-1 text-xs text-amber-800 dark:text-amber-200">
                      <div>• Bluetooth 4.0+ enabled</div>
                      <div>• Location permissions granted</div>
                      <div>• Device within 10 meters range</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <VitalSignsHistory />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <AnalyticsDashboard />
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Health Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Weekly Trend</p>
                      <p className="text-xs text-green-700 dark:text-green-300">Improving</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Compliance</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Excellent</p>
                    </div>
                    <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-lg">95%</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Next Check-up</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">In 2 hours</p>
                    </div>
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <ReminderSettings />
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Device Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-sync HC03</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sync readings automatically</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Background scan</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Keep scanning for devices</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Data validation</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Verify before saving</p>
                    </div>
                    <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-lg">Strict</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Privacy & Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Encrypt data</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Protect health data</p>
                    </div>
                    <div className="w-12 h-6 bg-blue-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Share research data</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Anonymous health research</p>
                    </div>
                    <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default function MobileDashboard() {
  return (
    <AuthWrapper>
      {(user, showProfile, setShowProfile, logout) => (
        <MobileDashboardContent 
          user={user}
          showProfile={showProfile}
          setShowProfile={setShowProfile}
          logout={logout}
        />
      )}
    </AuthWrapper>
  );
}