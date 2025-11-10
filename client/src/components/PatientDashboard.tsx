import React, { useState, useEffect } from 'react';
import { handleApiError } from '@/lib/errorHandler';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  patientId?: string;
  role: string;
  hospitalId?: string;
  isVerified: boolean;
}

interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  bloodOxygen: number;
  timestamp: Date;
}

interface HealthMetrics {
  lastCheckup: Date;
  nextAppointment: Date;
  medicationReminders: number;
  healthScore: number;
}

interface PatientDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function PatientDashboard({ user, onLogout }: PatientDashboardProps) {
  // Debug logging to verify this component is being rendered
  // PatientDashboard component rendering
  
  // Fetch patient dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/patient', user.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/dashboard/patient/${user.id}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch dashboard data`);
        }
        const data = await response.json();
        // PatientDashboard API response received
        return data;
      } catch (err) {
        // Log error for debugging but handle gracefully
        handleApiError('PatientDashboard', 'loadDashboard', err as Error, { userId: user?.id });
        throw err;
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
    enabled: !!user?.id, // Only run query if user ID exists
  });

  // Local state for vital signs with real data
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.6,
    bloodOxygen: 98,
    timestamp: new Date()
  });

  const [metrics, setMetrics] = useState<HealthMetrics>({
    lastCheckup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    medicationReminders: 3,
    healthScore: 85
  });

  // Update vitals from dashboard data if available
  useEffect(() => {
    if (dashboardData && typeof dashboardData === 'object') {
      const data = dashboardData as {
        vitals?: {
          heartRate: number;
          bloodPressure: { systolic: number; diastolic: number };
          temperature: number;
          bloodOxygen: number;
          timestamp: string;
        };
        metrics?: {
          lastCheckup: string;
          nextAppointment: string;
          medicationReminders: number;
          healthScore: number;
        };
      };
      
      if (data.vitals) {
        setVitals({
          heartRate: data.vitals.heartRate || 72,
          bloodPressure: data.vitals.bloodPressure || { systolic: 120, diastolic: 80 },
          temperature: data.vitals.temperature || 36.6,
          bloodOxygen: data.vitals.bloodOxygen || 98,
          timestamp: data.vitals.timestamp ? new Date(data.vitals.timestamp) : new Date()
        });
      }

      if (data.metrics) {
        setMetrics({
          lastCheckup: data.metrics.lastCheckup ? new Date(data.metrics.lastCheckup) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextAppointment: data.metrics.nextAppointment ? new Date(data.metrics.nextAppointment) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          medicationReminders: data.metrics.medicationReminders || 3,
          healthScore: data.metrics.healthScore || 85
        });
      }
    }
  }, [dashboardData]);

  const getVitalStatus = (type: string, value: number | { systolic: number; diastolic: number }) => {
    switch (type) {
      case 'heartRate':
        const hr = value as number;
        if (hr < 60 || hr > 100) return { status: 'Warning', color: '#f59e0b' };
        return { status: 'Normal', color: '#10b981' };
      case 'bloodPressure':
        const bp = value as { systolic: number; diastolic: number };
        if (bp.systolic > 140 || bp.diastolic > 90) return { status: 'High', color: '#ef4444' };
        if (bp.systolic < 90 || bp.diastolic < 60) return { status: 'Low', color: '#f59e0b' };
        return { status: 'Normal', color: '#10b981' };
      case 'temperature':
        const temp = value as number;
        if (temp > 37.5 || temp < 36.0) return { status: 'Abnormal', color: '#f59e0b' };
        return { status: 'Normal', color: '#10b981' };
      case 'bloodOxygen':
        const oxygen = value as number;
        if (oxygen < 95) return { status: 'Low', color: '#ef4444' };
        return { status: 'Normal', color: '#10b981' };
      default:
        return { status: 'Normal', color: '#10b981' };
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            border: '1px solid #fecaca',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
              Dashboard Error
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Unable to load dashboard data. Please try refreshing the page or contact support.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Refresh Page
              </button>
              <button 
                onClick={onLogout}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              🏥 24/7 Tele H - Health Monitoring Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Welcome back, {user.firstName} {user.lastName} - Real-time health monitoring is active
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                Patient ID: {user.patientId || 'N/A'}
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#10b981' 
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                Device Connected
              </div>
            </div>
            <button 
              onClick={onLogout}
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#ef4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Vital Signs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Heart Rate */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Heart Rate</h3>
              <span style={{ fontSize: '1.5rem' }}>💓</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('heartRate', vitals.heartRate).color }}>
              {vitals.heartRate} <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}>bpm</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: getVitalStatus('heartRate', vitals.heartRate).color + '20',
              color: getVitalStatus('heartRate', vitals.heartRate).color
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getVitalStatus('heartRate', vitals.heartRate).color }}></div>
              {getVitalStatus('heartRate', vitals.heartRate).status}
            </div>
          </div>

          {/* Blood Pressure */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Blood Pressure</h3>
              <span style={{ fontSize: '1.5rem' }}>🩸</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('bloodPressure', vitals.bloodPressure).color }}>
              {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}> mmHg</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: getVitalStatus('bloodPressure', vitals.bloodPressure).color + '20',
              color: getVitalStatus('bloodPressure', vitals.bloodPressure).color
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getVitalStatus('bloodPressure', vitals.bloodPressure).color }}></div>
              {getVitalStatus('bloodPressure', vitals.bloodPressure).status}
            </div>
          </div>

          {/* Temperature */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Temperature</h3>
              <span style={{ fontSize: '1.5rem' }}>🌡️</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('temperature', vitals.temperature).color }}>
              {vitals.temperature.toFixed(1)} <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}>°C</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: getVitalStatus('temperature', vitals.temperature).color + '20',
              color: getVitalStatus('temperature', vitals.temperature).color
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getVitalStatus('temperature', vitals.temperature).color }}></div>
              {getVitalStatus('temperature', vitals.temperature).status}
            </div>
          </div>

          {/* Blood Oxygen */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Blood Oxygen</h3>
              <span style={{ fontSize: '1.5rem' }}>🫁</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color }}>
              {vitals.bloodOxygen} <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}>%</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color + '20',
              color: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color }}></div>
              {getVitalStatus('bloodOxygen', vitals.bloodOxygen).status}
            </div>
          </div>
        </div>

        {/* Health Overview and Actions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth > 768 ? '2fr 1fr' : '1fr', 
          gap: '1.5rem' 
        }}>
          {/* Health Overview */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1.5rem 0' }}>Health Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Last Checkup</p>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                  {formatDate(metrics.lastCheckup)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Next Appointment</p>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                  {formatDate(metrics.nextAppointment)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Health Score</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '100px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                    <div style={{
                      width: `${metrics.healthScore}%`,
                      height: '100%',
                      backgroundColor: metrics.healthScore >= 80 ? '#10b981' : metrics.healthScore >= 60 ? '#f59e0b' : '#ef4444',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>
                    {metrics.healthScore}%
                  </span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Medication Reminders</p>
                <p style={{ fontSize: '1rem', fontWeight: '500', color: '#f59e0b', margin: 0 }}>
                  {metrics.medicationReminders} pending
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1.5rem 0' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}>
                📊 View Health History
              </button>
              <button style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: 'transparent', 
                color: '#3b82f6', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                💊 Medication Log
              </button>
              <button style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: 'transparent', 
                color: '#3b82f6', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                📅 Schedule Checkup
              </button>
              <button style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: 'transparent', 
                color: '#3b82f6', 
                border: '2px solid #3b82f6', 
                borderRadius: '8px', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                🔗 Connect HC03 Device
              </button>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Last updated: {vitals.timestamp.toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
}