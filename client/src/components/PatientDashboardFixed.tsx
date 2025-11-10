import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/lib/errorHandler';
import { useLanguage } from '@/lib/i18n';

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
  const { t, isRTL } = useLanguage();
  // Component verification logs removed for production

  // Local state for vital signs with default values
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.6,
    bloodOxygen: 98,
    timestamp: new Date()
  });

  // Modal state for detailed views
  const [selectedMetric, setSelectedMetric] = useState<'heartRate' | 'bloodPressure' | 'temperature' | 'bloodOxygen' | null>(null);

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
        if (hr < 60 || hr > 100) return { status: t('elevated'), color: '#f59e0b' };
        return { status: t('normal'), color: '#10b981' };
      case 'bloodPressure':
        const bp = value as { systolic: number; diastolic: number };
        if (bp.systolic > 140 || bp.diastolic > 90) return { status: t('high'), color: '#ef4444' };
        if (bp.systolic < 90 || bp.diastolic < 60) return { status: t('elevated'), color: '#f59e0b' };
        return { status: t('normal'), color: '#10b981' };
      case 'temperature':
        const temp = value as number;
        if (temp > 37.5 || temp < 36.0) return { status: t('elevated'), color: '#f59e0b' };
        return { status: t('normal'), color: '#10b981' };
      case 'bloodOxygen':
        const oxygen = value as number;
        if (oxygen < 95) return { status: t('elevated'), color: '#ef4444' };
        return { status: t('normal'), color: '#10b981' };
      default:
        return { status: t('normal'), color: '#10b981' };
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

  // Generate sample historical data for detailed views
  const generateHistoricalData = (type: string, currentValue: any) => {
    const hours = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      let value;
      
      switch (type) {
        case 'heartRate':
          value = Math.floor(Math.random() * 20) + (currentValue - 10);
          break;
        case 'bloodPressure':
          value = {
            systolic: Math.floor(Math.random() * 20) + (currentValue.systolic - 10),
            diastolic: Math.floor(Math.random() * 20) + (currentValue.diastolic - 10)
          };
          break;
        case 'temperature':
          value = Math.round((Math.random() * 1.5 + (currentValue - 0.75)) * 10) / 10;
          break;
        case 'bloodOxygen':
          value = Math.floor(Math.random() * 5) + (currentValue - 2);
          break;
        default:
          value = currentValue;
      }
      
      hours.push({ time: time.getHours(), value });
    }
    
    return hours;
  };

  const renderDetailedView = () => {
    if (!selectedMetric) return null;

    const historicalData = generateHistoricalData(selectedMetric, vitals[selectedMetric]);
    const status = getVitalStatus(selectedMetric, vitals[selectedMetric]);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }} onClick={() => setSelectedMetric(null)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out'
        }} onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                backgroundColor: status.color + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                {selectedMetric === 'heartRate' && '💓'}
                {selectedMetric === 'bloodPressure' && '🩸'}
                {selectedMetric === 'temperature' && '🌡️'}
                {selectedMetric === 'bloodOxygen' && '🫁'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  {selectedMetric === 'heartRate' && t('heartRate')}
                  {selectedMetric === 'bloodPressure' && t('bloodPressure')}
                  {selectedMetric === 'temperature' && t('temperature')}
                  {selectedMetric === 'bloodOxygen' && t('oxygenLevel')}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  {t('vitalSigns')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedMetric(null)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Current Reading */}
          <div style={{
            backgroundColor: 'linear-gradient(135deg, ' + status.color + '10, ' + status.color + '05)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid ' + status.color + '20'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Current Reading</p>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: status.color, margin: '0.5rem 0' }}>
                {selectedMetric === 'heartRate' && `${vitals.heartRate}`}
                {selectedMetric === 'bloodPressure' && `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`}
                {selectedMetric === 'temperature' && `${vitals.temperature.toFixed(1)}`}
                {selectedMetric === 'bloodOxygen' && `${vitals.bloodOxygen}`}
                <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  {selectedMetric === 'heartRate' && 'bpm'}
                  {selectedMetric === 'bloodPressure' && 'mmHg'}
                  {selectedMetric === 'temperature' && '°C'}
                  {selectedMetric === 'bloodOxygen' && '%'}
                </span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                backgroundColor: status.color + '20',
                color: status.color
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color }}></div>
                {status.status}
              </div>
            </div>
          </div>

          {/* 24-Hour Trend */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
              24-Hour Trend
            </h3>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '1rem',
              height: '200px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 600 150">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={30 * i} x2="600" y2={30 * i} stroke="#e2e8f0" strokeWidth="1"/>
                ))}
                {/* Data line */}
                <polyline
                  fill="none"
                  stroke={status.color}
                  strokeWidth="3"
                  points={historicalData.map((data, index) => {
                    const x = (index / 23) * 580 + 10;
                    let y;
                    if (selectedMetric === 'bloodPressure') {
                      y = 150 - ((data.value.systolic - 80) / 80) * 120;
                    } else {
                      const minVal = selectedMetric === 'heartRate' ? 50 : selectedMetric === 'temperature' ? 35 : selectedMetric === 'bloodOxygen' ? 90 : 0;
                      const maxVal = selectedMetric === 'heartRate' ? 100 : selectedMetric === 'temperature' ? 40 : selectedMetric === 'bloodOxygen' ? 100 : 100;
                      y = 150 - ((data.value - minVal) / (maxVal - minVal)) * 120;
                    }
                    return `${x},${Math.max(15, Math.min(135, y))}`;
                  }).join(' ')}
                />
                {/* Time labels */}
                {[0, 6, 12, 18, 24].map(hour => (
                  <text key={hour} x={(hour / 24) * 580 + 10} y="145" textAnchor="middle" fontSize="10" fill="#64748b">
                    {hour === 24 ? '00' : hour.toString().padStart(2, '0')}:00
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Health Tips */}
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#059669', marginBottom: '0.5rem' }}>
              💡 Health Tips
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#047857', margin: 0, lineHeight: '1.5' }}>
              {selectedMetric === 'heartRate' && 'Maintain a healthy heart rate through regular exercise, stress management, and adequate sleep. Normal resting heart rate is 60-100 bpm.'}
              {selectedMetric === 'bloodPressure' && 'Keep blood pressure in check with a balanced diet, regular exercise, limited sodium, and stress reduction. Normal BP is less than 120/80 mmHg.'}
              {selectedMetric === 'temperature' && 'Body temperature can vary throughout the day. Normal range is 36.1-37.2°C. Stay hydrated and dress appropriately for the weather.'}
              {selectedMetric === 'bloodOxygen' && 'Maintain healthy oxygen levels with deep breathing exercises and good posture. Normal oxygen saturation is 95-100%.'}
            </p>
          </div>
        </div>
      </div>
    );
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
          <p style={{ color: '#64748b', fontSize: '1rem' }}>{t('loading')}</p>
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
          @keyframes modalSlideIn {
            0% { 
              transform: scale(0.95) translateY(-10px);
              opacity: 0;
            }
            100% { 
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }
          .metric-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .metric-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          }
        `}
      </style>
      
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              24/7 Tele H - {t('dashboard')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              {t('welcomeBack')}, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                {t('patientId')}: {user?.patientId || 'N/A'}
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
                {t('connected')}
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
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Vital Signs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Heart Rate */}
          <div 
            className="metric-card"
            onClick={() => setSelectedMetric('heartRate')}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)', 
              border: '1px solid #e2e8f0' 
            }}
            data-testid="card-heart-rate"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('heartRate')}</h3>
              <span style={{ fontSize: '1.5rem' }}>💓</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('heartRate', vitals.heartRate).color }}>
              {vitals.heartRate} <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}>{t('bpm')}</span>
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
          <div 
            className="metric-card"
            onClick={() => setSelectedMetric('bloodPressure')}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)', 
              border: '1px solid #e2e8f0' 
            }}
            data-testid="card-blood-pressure"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('bloodPressure')}</h3>
              <span style={{ fontSize: '1.5rem' }}>🩸</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('bloodPressure', vitals.bloodPressure).color }}>
              {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}> {t('mmhg')}</span>
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
          <div 
            className="metric-card"
            onClick={() => setSelectedMetric('temperature')}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)', 
              border: '1px solid #e2e8f0' 
            }}
            data-testid="card-temperature"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('temperature')}</h3>
              <span style={{ fontSize: '1.5rem' }}>🌡️</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('temperature', vitals.temperature).color }}>
              {vitals.temperature.toFixed(1)} <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}>{t('celsius')}</span>
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
          <div 
            className="metric-card"
            onClick={() => setSelectedMetric('bloodOxygen')}
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)', 
              border: '1px solid #e2e8f0' 
            }}
            data-testid="card-blood-oxygen"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('oxygenLevel')}</h3>
              <span style={{ fontSize: '1.5rem' }}>🫁</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: getVitalStatus('bloodOxygen', vitals.bloodOxygen).color }}>
              {vitals.bloodOxygen} <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 'normal' }}>{t('percentage')}</span>
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('lastActivity')}</h3>
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('nextAppointment')}</h3>
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
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>{t('healthTrends')}</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>{metrics.healthScore}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>{t('devices')}</h3>
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
              {t('viewHistory')}
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
              {t('connectDevice')}
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
              {t('settings')}
            </button>
          </div>
        </div>
      </main>

      {/* Detailed Modal Views */}
      {renderDetailedView()}
    </div>
  );
}