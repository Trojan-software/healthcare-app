import { useState } from "react";
import { Heart, Bell, User, Plus, TrendingUp, Users, Calendar, AlertTriangle, PieChart, Smartphone, Bluetooth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import RegistrationModal from "@/components/RegistrationModal";
import VitalSignsCard from "@/components/VitalSignsCard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AlertsPanel from "@/components/AlertsPanel";
import ReminderSettings from "@/components/ReminderSettings";
import RecentActivity from "@/components/RecentActivity";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activePatients: number;
  checkupsToday: number;
  criticalAlerts: number;
  completionRate: number;
}

export default function Dashboard() {
  const [showRegistration, setShowRegistration] = useState(false);

  // Mock dashboard stats for demonstration
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard-stats'],
    enabled: false, // Disable for now since we need auth
  });

  const dashboardStats = {
    activePatients: 1247,
    checkupsToday: 89,
    criticalAlerts: 7,
    completionRate: 94.2
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-medical-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-medical-blue rounded-xl flex items-center justify-center">
                  <Heart className="text-white h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">HealthMonitor</h1>
                  <p className="text-xs text-muted-foreground">24x7 Patient Care</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-alert-red text-white text-xs">
                  3
                </Badge>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-healthcare-green rounded-full flex items-center justify-center">
                  <User className="text-white h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">Dr. Sarah Johnson</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Registration Modal */}
      <RegistrationModal open={showRegistration} onOpenChange={setShowRegistration} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Patient Dashboard</h1>
              <p className="text-muted-foreground mt-1">Today, {currentDate}</p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Button onClick={() => setShowRegistration(true)} className="btn-healthcare">
                <Plus className="mr-2 h-4 w-4" />
                New Patient
              </Button>
              <Link href="/mobile-dashboard">
                <Button variant="outline" className="border-medical-blue text-medical-blue hover:bg-blue-50 dark:hover:bg-blue-950">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Mobile Dashboard
                </Button>
              </Link>
              <Button className="btn-medical">
                <TrendingUp className="mr-2 h-4 w-4" />
                Reports
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Patients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.activePatients.toLocaleString()}</p>
                  <p className="text-sm text-healthcare-green mt-1">
                    <TrendingUp className="inline mr-1" size={12} />
                    +12% from last month
                  </p>
                </div>
                <div className="vital-indicator bg-medical-blue/10">
                  <Users className="text-medical-blue h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Check-ups Today</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.checkupsToday}</p>
                  <p className="text-sm text-healthcare-green mt-1">
                    <TrendingUp className="inline mr-1" size={12} />
                    +5% from yesterday
                  </p>
                </div>
                <div className="vital-indicator bg-healthcare-green/10">
                  <Calendar className="text-healthcare-green h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.criticalAlerts}</p>
                  <p className="text-sm text-alert-red mt-1">
                    <AlertTriangle className="inline mr-1" size={12} />
                    Requires attention
                  </p>
                </div>
                <div className="vital-indicator bg-alert-red/10">
                  <AlertTriangle className="text-alert-red h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardStats.completionRate}%</p>
                  <p className="text-sm text-healthcare-green mt-1">
                    <TrendingUp className="inline mr-1" size={12} />
                    +2.1% this week
                  </p>
                </div>
                <div className="vital-indicator bg-amber-500/10">
                  <PieChart className="text-amber-500 h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vital Signs & Analytics */}
          <div className="lg:col-span-2 space-y-8">
            <VitalSignsCard />
            <AnalyticsDashboard />
          </div>

          {/* Right Column - Alerts & Settings */}
          <div className="space-y-8">
            <AlertsPanel />
            <ReminderSettings />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
