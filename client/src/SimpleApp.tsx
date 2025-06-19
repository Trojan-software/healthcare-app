import React from 'react';
import PatientAuthSystem from '@/components/PatientAuthSystem';
import EnhancedAdminDashboard from '@/components/EnhancedAdminDashboard';

export default function SimpleApp() {
  const [state, setState] = React.useState({
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
              onMouseEnter={(e) => {
                if (!state.loading) e.target.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                if (!state.loading) e.target.style.backgroundColor = '#3b82f6';
              }}
            >
              {state.loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={() => {
                // For now, show signup option in console
                console.log('Sign up clicked - Enhanced registration coming soon');
                alert('Enhanced patient registration system available. Please contact admin for account setup.');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#3b82f6';
              }}
            >
              👤 Register as New Patient →
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Demo Accounts:</p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Admin: admin@24x7teleh.com / admin123</p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' }}>Patient: patient.demo@example.com / patient123</p>
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

  return (
    <div style={{ ...styles.page, padding: '0' }}>
      <div style={{ backgroundColor: 'white', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>
            24/7 Tele H - Health Monitoring
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>
            Welcome, {(state.user as any)?.firstName} {(state.user as any)?.lastName}
          </p>
        </div>
        <button onClick={logout} style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <HealthMonitoring />
    </div>
  );
}