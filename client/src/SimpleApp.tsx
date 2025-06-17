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
    return <PatientAuthSystem onAuthSuccess={handleAuthSuccess} />;
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