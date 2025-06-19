import React, { useState, useEffect } from 'react';

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

interface User {
  id: number;
  firstName: string;
  lastName: string;
  patientId: string;
  email: string;
}

interface PatientHealthDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function PatientHealthDashboard({ user, onLogout }: PatientHealthDashboardProps) {
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setVitals({
        heartRate: 72,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 36.6,
        bloodOxygen: 98,
        timestamp: new Date()
      });
      
      setMetrics({
        lastCheckup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        medicationReminders: 3,
        healthScore: 85
      });
      
      setIsConnected(true);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getVitalStatus = (type: string, value: number | { systolic: number; diastolic: number }) => {
    switch (type) {
      case 'heartRate':
        const hr = value as number;
        if (hr < 60 || hr > 100) return { status: 'warning', color: '#f59e0b' };
        return { status: 'normal', color: '#10b981' };
      case 'bloodPressure':
        const bp = value as { systolic: number; diastolic: number };
        if (bp.systolic > 140 || bp.diastolic > 90) return { status: 'high', color: '#ef4444' };
        if (bp.systolic < 90 || bp.diastolic < 60) return { status: 'low', color: '#f59e0b' };
        return { status: 'normal', color: '#10b981' };
      case 'temperature':
        const temp = value as number;
        if (temp > 37.5 || temp < 36.0) return { status: 'abnormal', color: '#f59e0b' };
        return { status: 'normal', color: '#10b981' };
      case 'bloodOxygen':
        const oxygen = value as number;
        if (oxygen < 95) return { status: 'low', color: '#ef4444' };
        return { status: 'normal', color: '#10b981' };
      default:
        return { status: 'normal', color: '#10b981' };
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

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e2e8f0'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#64748b',
      margin: 0
    },
    userInfo: {
      textAlign: 'right' as const
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1.5rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      border: '1px solid #e2e8f0'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0
    },
    vitalValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      margin: '0.5rem 0'
    },
    vitalUnit: {
      fontSize: '0.875rem',
      color: '#64748b',
      fontWeight: 'normal'
    },
    status: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px'
    },
    button: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    buttonSecondary: {
      padding: '0.75rem 1.5rem',
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid #e2e8f0',
      borderTop: '2px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.main, textAlign: 'center', paddingTop: '4rem' }}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Patient Health Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {user.firstName} {user.lastName}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={styles.userInfo}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                Patient ID: {user.patientId}
              </p>
              <div style={{
                ...styles.connectionStatus,
                color: isConnected ? '#10b981' : '#ef4444'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10b981' : '#ef4444'
                }}></div>
                {isConnected ? 'Device Connected' : 'Device Offline'}
              </div>
            </div>
            <button 
              onClick={onLogout}
              style={{ ...styles.button, backgroundColor: '#ef4444' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Vital Signs Grid */}
        <div style={styles.grid}>
          {/* Heart Rate */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Heart Rate</h3>
              <span style={{ fontSize: '1.5rem' }}>💓</span>
            </div>
            {vitals && (
              <>
                <div style={{
                  ...styles.vitalValue,
                  color: getVitalStatus('heartRate', vitals.heartRate).color
                }}>
                  {vitals.heartRate} <span style={styles.vitalUnit}>bpm</span>
                </div>
                <div style={{
                  ...styles.status,
                  backgroundColor: getVitalStatus('heartRate', vitals.heartRate).color + '20',
                  color: getVitalStatus('heartRate', vitals.heartRate).color
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getVitalStatus('heartRate', vitals.heartRate).color
                  }}></div>
                  {getVitalStatus('heartRate', vitals.heartRate).status}
                </div>
              </>
            )}
          </div>

          {/* Blood Pressure */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Blood Pressure</h3>
              <span style={{ fontSize: '1.5rem' }}>🩸</span>
            </div>
            {vitals && (
              <>
                <div style={{
                  ...styles.vitalValue,
                  color: getVitalStatus('bloodPressure', vitals.bloodPressure).color
                }}>
                  {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
                  <span style={styles.vitalUnit}> mmHg</span>
                </div>
                <div style={{
                  ...styles.status,
                  backgroundColor: getVitalStatus('bloodPressure', vitals.bloodPressure).color + '20',
                  color: getVitalStatus('bloodPressure', vitals.bloodPressure).color
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getVitalStatus('bloodPressure', vitals.bloodPressure).color
                  }}></div>
                  {getVitalStatus('bloodPressure', vitals.bloodPressure).status}
                </div>
              </>
            )}
          </div>

          {/* Temperature */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Temperature</h3>
              <span style={{ fontSize: '1.5rem' }}>🌡️</span>
            </div>
            {vitals && (
              <>
                <div style={{
                  ...styles.vitalValue,
                  color: getVitalStatus('temperature', vitals.temperature).color
                }}>
                  {vitals.temperature.toFixed(1)} <span style={styles.vitalUnit}>°C</span>
                </div>
                <div style={{
                  ...styles.status,
                  backgroundColor: getVitalStatus('temperature', vitals.temperature).color + '20',
                  color: getVitalStatus('temperature', vitals.temperature).color
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getVitalStatus('temperature', vitals.temperature).color
                  }}></div>
                  {getVitalStatus('temperature', vitals.temperature).status}
                </div>
              </>
            )}
          </div>

          {/* Blood Oxygen */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Blood Oxygen</h3>
              <span style={{ fontSize: '1.5rem' }}>🫁</span>
            </div>
            {vitals && (
              <>
                <div style={{
                  ...styles.vitalValue,
                  color: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color
                }}>
                  {vitals.bloodOxygen} <span style={styles.vitalUnit}>%</span>
                </div>
                <div style={{
                  ...styles.status,
                  backgroundColor: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color + '20',
                  color: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color
                  }}></div>
                  {getVitalStatus('bloodOxygen', vitals.bloodOxygen).status}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Health Overview and Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
          {/* Health Overview */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Health Overview</h3>
            {metrics && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Last Checkup
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                      {formatDate(metrics.lastCheckup)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Next Appointment
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                      {formatDate(metrics.nextAppointment)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Health Score
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '100px',
                        height: '8px',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '4px'
                      }}>
                        <div style={{
                          width: `${metrics.healthScore}%`,
                          height: '100%',
                          backgroundColor: metrics.healthScore >= 80 ? '#10b981' : metrics.healthScore >= 60 ? '#f59e0b' : '#ef4444',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: '500', color: '#1e293b' }}>
                        {metrics.healthScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Medication Reminders
                    </p>
                    <p style={{ fontSize: '1rem', fontWeight: '500', color: '#f59e0b', margin: 0 }}>
                      {metrics.medicationReminders} pending
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Quick Actions</h3>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button style={styles.button}>
                📊 View Health History
              </button>
              <button style={styles.buttonSecondary}>
                💊 Medication Log
              </button>
              <button style={styles.buttonSecondary}>
                📅 Schedule Checkup
              </button>
              <button style={styles.buttonSecondary}>
                🔗 Connect HC03 Device
              </button>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {vitals && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Last updated: {vitals.timestamp.toLocaleString()}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}