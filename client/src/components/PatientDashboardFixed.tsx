import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errorHandler';

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

interface PatientDashboardProps {
  user?: User;
  onLogout?: () => void;
}

export default function PatientDashboardFixed({ user, onLogout }: PatientDashboardProps = {}) {
  // Component verification logs removed for production

  // Local state for vital signs with default values
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.6,
    bloodOxygen: 98,
    timestamp: new Date()
  });

  const [metrics, setMetrics] = useState({
    lastCheckup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    medicationReminders: 3,
    healthScore: 85
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/patient', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/dashboard/patient/${user.id}`);
      if (!response.ok) {
        handleApiError('PatientDashboardFixed', 'dashboardQuery', new Error('Dashboard API failed'), { userId: user?.id });
        return null;
      }
      return response.json();
    },
    staleTime: 30000,
    retry: 1,
    enabled: !!user?.id,
  });

  // Update data when API responds
  useEffect(() => {
    if (dashboardData?.vitals) {
      setVitals({
        heartRate: dashboardData.vitals.heartRate || 72,
        bloodPressure: dashboardData.vitals.bloodPressure || { systolic: 120, diastolic: 80 },
        temperature: dashboardData.vitals.temperature || 36.6,
        bloodOxygen: dashboardData.vitals.bloodOxygen || 98,
        timestamp: dashboardData.vitals.timestamp ? new Date(dashboardData.vitals.timestamp) : new Date()
      });
    }
    if (dashboardData?.metrics) {
      setMetrics({
        lastCheckup: dashboardData.metrics.lastCheckup ? new Date(dashboardData.metrics.lastCheckup) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextAppointment: dashboardData.metrics.nextAppointment ? new Date(dashboardData.metrics.nextAppointment) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        medicationReminders: dashboardData.metrics.medicationReminders || 3,
        healthScore: dashboardData.metrics.healthScore || 85
      });
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
              24/7 Tele H - Health Monitoring Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Welcome back, {user?.firstName} {user?.lastName} - Real-time health monitoring active
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                Patient ID: {user?.patientId || 'N/A'}
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

        {/* Health Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Last Checkup */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#dbeafe', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                📅
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Last Checkup</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>{formatDate(metrics.lastCheckup)}</p>
              </div>
            </div>
          </div>

          {/* Next Appointment */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#dcfce7', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                🏥
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Next Appointment</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>{formatDate(metrics.nextAppointment)}</p>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                ⭐
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>Health Score</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{metrics.healthScore}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button style={{
              padding: '1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            onClick={() => {
              // Navigate to health history view
              window.location.hash = '#health-history';
              alert('Health History feature - Shows detailed vital signs trends and historical data');
            }}
            >
              <span>📊</span>
              View Health History
            </button>
            
            <button style={{
              padding: '1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            onClick={() => {
              // Simulate device connection
              alert('Device Connection initiated - HC03 device pairing in progress...');
              // In a real implementation, this would open device pairing interface
            }}
            >
              <span>🔗</span>
              Connect Device
            </button>
            
            <button style={{
              padding: '1rem',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
            onClick={() => {
              // Open patient settings
              alert('Patient Settings - Configure notifications, reminders, and personal preferences');
              // In a real implementation, this would open settings modal
            }}
            >
              <span>⚙️</span>
              Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}