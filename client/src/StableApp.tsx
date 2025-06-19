import React, { useState } from 'react';
import PatientHealthDashboard from './components/PatientHealthDashboard';

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

interface Hospital {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface AppState {
  view: 'auth' | 'signup' | 'admin' | 'patient';
  user: User | null;
  loading: boolean;
  error: string;
}

export default function StableApp() {
  const [state, setState] = useState<AppState>({
    view: 'auth',
    user: null,
    loading: false,
    error: ''
  });

  const [hospitals, setHospitals] = useState<Hospital[]>([
    {
      id: 'sheikh-khalifa',
      name: 'Sheikh Khalifa Medical City',
      location: 'Al Karamah, Abu Dhabi',
      type: 'government'
    },
    {
      id: 'cleveland-clinic',
      name: 'Cleveland Clinic Abu Dhabi',
      location: 'Al Maryah Island, Abu Dhabi',
      type: 'private'
    },
    {
      id: 'zayed-military',
      name: 'Zayed Military Hospital',
      location: 'Al Wathba, Abu Dhabi',
      type: 'government'
    },
    {
      id: 'corniche-hospital',
      name: 'Corniche Hospital',
      location: 'Corniche Road, Abu Dhabi',
      type: 'government'
    },
    {
      id: 'mafraq-hospital',
      name: 'Mafraq Hospital',
      location: 'Mafraq, Abu Dhabi',
      type: 'government'
    },
    {
      id: 'nmc-hospital',
      name: 'NMC Royal Hospital',
      location: 'Khalifa City, Abu Dhabi',
      type: 'private'
    },
    {
      id: 'mediclinic-airport',
      name: 'Mediclinic Airport Road Hospital',
      location: 'Airport Road, Abu Dhabi',
      type: 'private'
    },
    {
      id: 'burjeel-hospital',
      name: 'Burjeel Hospital Abu Dhabi',
      location: 'Al Najda Street, Abu Dhabi',
      type: 'private'
    },
    {
      id: 'seha-hospitals',
      name: 'SEHA - Abu Dhabi Health Services',
      location: 'Multiple Locations, Abu Dhabi',
      type: 'government'
    },
    {
      id: 'al-noor-hospital',
      name: 'Al Noor Hospital Abu Dhabi',
      location: 'Khalifa Street, Abu Dhabi',
      type: 'private'
    }
  ]);

  const handleAuthSuccess = (user: User) => {
    if (user.role === 'admin' || user.email === 'admin@24x7teleh.com') {
      setState(prev => ({ 
        ...prev, 
        view: 'admin',
        user: user,
        loading: false 
      }));
    } else {
      setState(prev => ({ 
        ...prev, 
        view: 'patient',
        user: user,
        loading: false 
      }));
    }
  };

  const logout = () => {
    setState({
      view: 'auth',
      user: null,
      loading: false,
      error: ''
    });
  };

  const styles = {
    page: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'system-ui, -apple-system, sans-serif' },
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' },
    card: { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    header: { textAlign: 'center' as const, marginBottom: '2rem' },
    title: { fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' },
    subtitle: { fontSize: '1rem', color: '#6b7280', margin: 0 },
    form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
    input: { padding: '0.875rem', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '1rem', transition: 'border-color 0.2s' },
    button: { padding: '0.875rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
    error: { padding: '0.875rem', backgroundColor: '#fef2f2', border: '2px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' },
    registerButton: { padding: '0.875rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '1rem' }
  };

  if (state.view === 'signup') {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ ...styles.card, maxWidth: '600px' }}>
            <div style={styles.header}>
              <h1 style={styles.title}>Patient Registration</h1>
              <p style={styles.subtitle}>24/7 Tele H Health Monitoring System</p>
            </div>

            {state.error && (
              <div style={styles.error}>
                {state.error}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const registrationData = {
                firstName: formData.get('firstName') as string,
                middleName: formData.get('middleName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                mobileNumber: formData.get('mobileNumber') as string,
                hospitalId: formData.get('hospitalId') as string,
                password: formData.get('password') as string
              };

              if (!registrationData.firstName || !registrationData.lastName || !registrationData.email || 
                  !registrationData.mobileNumber || !registrationData.hospitalId || !registrationData.password) {
                setState(prev => ({ ...prev, error: 'Please fill in all required fields' }));
                return;
              }

              setState(prev => ({ ...prev, loading: true, error: '' }));
              
              fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData)
              })
              .then(async res => {
                if (!res.ok) {
                  const err = await res.json();
                  throw new Error(err.message || 'Registration failed');
                }
                return res.json();
              })
              .then(data => {
                alert('Registration successful! Please check your email for verification.');
                setState(prev => ({ ...prev, view: 'auth', loading: false, error: '' }));
              })
              .catch(err => {
                setState(prev => ({ ...prev, error: err.message, loading: false }));
              });
            }} style={styles.form}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input
                  name="firstName"
                  type="text"
                  placeholder="First Name *"
                  required
                  style={styles.input}
                />
                <input
                  name="middleName"
                  type="text"
                  placeholder="Middle Name"
                  style={styles.input}
                />
              </div>
              
              <input
                name="lastName"
                type="text"
                placeholder="Last Name *"
                required
                style={styles.input}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address *"
                  required
                  style={styles.input}
                />
                <input
                  name="mobileNumber"
                  type="tel"
                  placeholder="Mobile (+971XXXXXXXXX) *"
                  required
                  style={styles.input}
                />
              </div>
              
              <select
                name="hospitalId"
                required
                style={{ ...styles.input, backgroundColor: 'white' }}
              >
                <option value="">Select Affiliated Hospital *</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name} - {hospital.type}
                  </option>
                ))}
              </select>
              
              <input
                name="password"
                type="password"
                placeholder="Password (min. 6 characters) *"
                required
                minLength={6}
                style={styles.input}
              />
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, view: 'auth', error: '' }))}
                  style={{ ...styles.button, backgroundColor: '#6b7280', flex: 1 }}
                  disabled={state.loading}
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  style={{ ...styles.button, backgroundColor: state.loading ? '#9ca3af' : '#059669', flex: 1 }}
                  disabled={state.loading}
                >
                  {state.loading ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
              <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: '0', textAlign: 'center' }}>
                Registration includes OTP email verification and automatic patient ID generation
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'auth') {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.header}>
              <h1 style={styles.title}>24/7 Tele H</h1>
              <p style={styles.subtitle}>Health Monitoring System</p>
            </div>

            {state.error && (
              <div style={styles.error}>
                {state.error}
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              const password = formData.get('password') as string;
              
              setState(prev => ({ ...prev, loading: true, error: '' }));
              
              fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              })
              .then(async res => {
                if (!res.ok) {
                  const err = await res.json();
                  throw new Error(err.message || 'Login failed');
                }
                return res.json();
              })
              .then(data => {
                handleAuthSuccess(data.user);
              })
              .catch(err => {
                setState(prev => ({ ...prev, error: err.message, loading: false }));
              });
            }} style={styles.form}>
              
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                required
                style={styles.input}
              />
              
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                style={styles.input}
              />
              
              <button
                type="submit"
                style={{ ...styles.button, backgroundColor: state.loading ? '#9ca3af' : '#3b82f6' }}
                disabled={state.loading}
              >
                {state.loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0', fontWeight: '500' }}>Demo Accounts:</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Admin: admin@24x7teleh.com / admin123</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Patient: patient.demo@example.com / patient123</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Don't have an account?
              </p>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, view: 'signup' }))}
                style={styles.registerButton}
              >
                👤 Register as New Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'admin') {
    return (
      <div style={styles.page}>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
                  24/7 Tele H Admin Dashboard
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                  Healthcare Management System
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                    {state.user?.firstName} {state.user?.lastName}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Administrator</p>
                </div>
                <button onClick={logout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>Total Patients</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>156</p>
                  </div>
                  <div style={{ backgroundColor: '#dbeafe', color: '#3b82f6', padding: '0.75rem', borderRadius: '8px', fontSize: '1.5rem' }}>👥</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>↗ +12.5%</span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>vs last month</span>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>Active Monitoring</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>89</p>
                  </div>
                  <div style={{ backgroundColor: '#d1fae5', color: '#10b981', padding: '0.75rem', borderRadius: '8px', fontSize: '1.5rem' }}>📊</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>↗ +8.2%</span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>vs last week</span>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>Critical Alerts</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>7</p>
                  </div>
                  <div style={{ backgroundColor: '#fef3c7', color: '#f59e0b', padding: '0.75rem', borderRadius: '8px', fontSize: '1.5rem' }}>⚠️</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>↗ +2</span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>since yesterday</span>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0, fontWeight: '500' }}>Device Connections</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0.5rem 0' }}>142</p>
                  </div>
                  <div style={{ backgroundColor: '#ede9fe', color: '#8b5cf6', padding: '0.75rem', borderRadius: '8px', fontSize: '1.5rem' }}>🔗</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>98.6%</span>
                  <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>connection rate</span>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '2rem' }}>
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏥</div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
                  Healthcare Management Dashboard
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                  Comprehensive patient monitoring system with real-time health analytics, device management, and clinical oversight capabilities.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                  <button style={{ padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>👥</span>
                    Patient Management
                  </button>
                  <button style={{ padding: '1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                    Analytics Dashboard
                  </button>
                  <button style={{ padding: '1rem', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔗</span>
                    Device Monitoring
                  </button>
                  <button style={{ padding: '1rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                    System Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'patient') {
    const [vitals] = useState({
      heartRate: 72,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 36.6,
      bloodOxygen: 98,
      timestamp: new Date()
    });
    
    const [metrics] = useState({
      lastCheckup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      medicationReminders: 3,
      healthScore: 85
    });

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

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Header */}
        <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                Patient Health Dashboard
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                Welcome back, {state.user?.firstName} {state.user?.lastName}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b', margin: 0 }}>
                  Patient ID: {state.user?.patientId}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#10b981' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  Device Connected
                </div>
              </div>
              <button 
                onClick={logout}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Vital Signs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Health Overview */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1.5rem 0' }}>Health Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                        borderRadius: '4px'
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
                <button style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                  📊 View Health History
                </button>
                <button style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                  💊 Medication Log
                </button>
                <button style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
                  📅 Schedule Checkup
                </button>
                <button style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>
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

  return null;
}