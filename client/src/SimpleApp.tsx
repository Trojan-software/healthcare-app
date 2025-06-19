import { useState } from 'react';
import PatientAuthSystem from '@/components/PatientAuthSystem';
import EnhancedAdminDashboard from '@/components/EnhancedAdminDashboard';
import PatientDashboardFixed from '@/components/PatientDashboardFixed';

export default function SimpleApp() {
  const [state, setState] = useState({
    view: 'auth', // 'auth', 'admin', 'patient'
    user: null,
    loading: false,
    error: ''
  });

  const handleAuthSuccess = (user: any) => {
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
    page: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' },
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' },
    card: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    header: { textAlign: 'center' as const, marginBottom: '2rem' },
    title: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' },
    subtitle: { fontSize: '0.875rem', color: '#6b7280', margin: 0 },
    form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
    input: { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' },
    button: { padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' },
    error: { padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.875rem' },
    demo: { textAlign: 'center' as const, marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' },
    demoText: { fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }
  };

  if (state.view === 'signup') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: '500px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Patient Registration</h1>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>24/7 Tele H Health Monitoring System</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const registrationData = {
              firstName: formData.get('firstName'),
              middleName: formData.get('middleName'),
              lastName: formData.get('lastName'),
              email: formData.get('email'),
              mobileNumber: formData.get('mobileNumber'),
              hospitalId: formData.get('hospitalId'),
              password: formData.get('password')
            };

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
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <input
                name="firstName"
                type="text"
                placeholder="First Name *"
                required
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <input
                name="middleName"
                type="text"
                placeholder="Middle Name"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <input
                name="lastName"
                type="text"
                placeholder="Last Name *"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                name="email"
                type="email"
                placeholder="Email Address *"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                name="mobileNumber"
                type="tel"
                placeholder="Mobile Number (+971XXXXXXXXX) *"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <select
                name="hospitalId"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select Hospital *</option>
                <option value="SEHA">SEHA - Abu Dhabi Health Services</option>
                <option value="SKMC">Sheikh Khalifa Medical City</option>
                <option value="CCAD">Cleveland Clinic Abu Dhabi</option>
                <option value="NMC">NMC Healthcare</option>
                <option value="MEDICLINIC">Mediclinic Middle East</option>
                <option value="BURJEEL">Burjeel Holdings</option>
                <option value="HEALTHPOINT">Healthpoint Hospital</option>
                <option value="PRIME">Prime Hospital</option>
                <option value="LIFECARE">Lifecare Hospital</option>
                <option value="MEDEOR">Medeor Hospital</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <input
                name="password"
                type="password"
                placeholder="Password *"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {state.error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', color: '#dc2626' }}>
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={state.loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: state.loading ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: state.loading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              {state.loading ? 'Registering...' : 'Register Patient'}
            </button>

            <button
              type="button"
              onClick={() => setState(prev => ({ ...prev, view: 'auth' }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              ← Back to Login
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
            <p style={{ fontSize: '0.875rem', color: '#0369a1', margin: '0', textAlign: 'center' }}>
              Registration includes OTP email verification and automatic patient ID generation
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'auth') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>24/7 Tele H</h1>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>Health Monitoring System</p>
          </div>

          {state.error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', color: '#dc2626' }}>
              {state.error}
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
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
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                name="password"
                type="password"
                placeholder="Password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            
            <button
              type="submit"
              disabled={state.loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: state.loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: state.loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {state.loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Demo Accounts:</p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Admin: admin@24x7teleh.com / admin123</p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Patient: patient.demo@example.com / patient123</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Don't have an account?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button" 
                onClick={() => {
                  console.log('Registration button clicked!');
                  setState(prev => ({ ...prev, view: 'signup' }));
                }}
                style={{
                  flex: '1',
                  padding: '0.75rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '48px'
                }}
              >
                Register as New Patient
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



  if (state.view === 'admin') {
    return (
      <div style={{ ...styles.page, padding: '1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>Admin Dashboard</h1>
              <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>Manage patient dashboard access for 24/7 Tele H</p>
            </div>
            <button onClick={logout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
              Logout
            </button>
          </div>

          <EnhancedAdminDashboard />
        </div>
      </div>
    );
  }

  // Force re-render by adding a key prop to bust any potential caching
  return <PatientDashboardFixed key={(state.user as any)?.id || 'patient'} user={state.user as any} onLogout={logout} />;
}