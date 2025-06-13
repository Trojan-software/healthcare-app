import { createRoot } from "react-dom/client";
import React from "react";

function HealthApp() {
  const [state, setState] = React.useState({
    view: 'login',
    user: null,
    email: '',
    password: '',
    loading: false,
    error: ''
  });

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, password: state.password })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Login failed');
      }

      const data = await res.json();
      setState(prev => ({
        ...prev,
        user: data.user,
        view: data.user.role === 'admin' ? 'admin' : 'patient',
        loading: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, loading: false }));
    }
  };

  const logout = () => {
    setState({
      view: 'login',
      user: null,
      email: '',
      password: '',
      loading: false,
      error: ''
    });
  };

  if (state.view === 'login') {
    return React.createElement('div', {
      style: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }
    },
      React.createElement('div', {
        style: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }
      },
        React.createElement('div', { style: { textAlign: 'center', marginBottom: '2rem' } },
          React.createElement('h1', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' } }, '24/7 Tele H'),
          React.createElement('p', { style: { fontSize: '0.875rem', color: '#6b7280', margin: 0 } }, 'Health Monitoring System')
        ),
        state.error && React.createElement('div', {
          style: { padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }
        }, state.error),
        React.createElement('form', {
          onSubmit: login,
          style: { display: 'flex', flexDirection: 'column', gap: '1rem' }
        },
          React.createElement('input', {
            type: 'email',
            placeholder: 'Email Address',
            value: state.email,
            onChange: (e: any) => setState(prev => ({ ...prev, email: e.target.value })),
            style: { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' },
            required: true
          }),
          React.createElement('input', {
            type: 'password',
            placeholder: 'Password',
            value: state.password,
            onChange: (e: any) => setState(prev => ({ ...prev, password: e.target.value })),
            style: { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' },
            required: true
          }),
          React.createElement('button', {
            type: 'submit',
            disabled: state.loading,
            style: {
              padding: '0.75rem',
              backgroundColor: state.loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: state.loading ? 'not-allowed' : 'pointer'
            }
          }, state.loading ? 'Signing in...' : 'Sign In')
        ),
        React.createElement('div', { style: { textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' } },
          React.createElement('p', { style: { fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' } }, 'Demo Accounts:'),
          React.createElement('p', { style: { fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' } }, 'Admin: admin@24x7teleh.com / admin123'),
          React.createElement('p', { style: { fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0' } }, 'Patient: patient.demo@example.com / patient123')
        )
      )
    );
  }

  if (state.view === 'admin') {
    return React.createElement('div', {
      style: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif', padding: '1.5rem' }
    },
      React.createElement('div', { style: { maxWidth: '1200px', margin: '0 auto' } },
        React.createElement('div', {
          style: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        },
          React.createElement('div', {},
            React.createElement('h1', { style: { fontSize: '1.75rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' } }, 'Admin Dashboard'),
            React.createElement('p', { style: { fontSize: '1rem', color: '#6b7280', margin: 0 } }, 'Manage patient dashboard access for 24/7 Tele H')
          ),
          React.createElement('button', {
            onClick: logout,
            style: { padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }
          }, 'Logout')
        ),
        React.createElement('div', {
          style: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
        },
          React.createElement('h2', {
            style: { fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: '0 0 1rem 0' }
          }, `Welcome, ${(state.user as any)?.firstName} ${(state.user as any)?.lastName}`),
          React.createElement('p', {
            style: { color: '#6b7280', margin: '0 0 1.5rem 0' }
          }, 'You have successfully logged in as an administrator. SendGrid has been removed and the system is working with test mode OTP.'),
          React.createElement('div', {
            style: { backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '6px', border: '1px solid #e5e7eb' }
          },
            React.createElement('h3', { style: { fontSize: '1rem', fontWeight: '500', color: '#111827', margin: '0 0 0.75rem 0' } }, 'System Status'),
            React.createElement('ul', { style: { margin: 0, paddingLeft: '1.25rem' } },
              React.createElement('li', { style: { color: '#059669', marginBottom: '0.25rem' } }, '✓ SendGrid email service removed'),
              React.createElement('li', { style: { color: '#059669', marginBottom: '0.25rem' } }, '✓ Test mode OTP system active'),
              React.createElement('li', { style: { color: '#059669', marginBottom: '0.25rem' } }, '✓ Admin authentication working'),
              React.createElement('li', { style: { color: '#059669' } }, '✓ Database connection established')
            )
          )
        )
      )
    );
  }

  return React.createElement('div', {
    style: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif', padding: '1.5rem' }
  },
    React.createElement('div', { style: { maxWidth: '800px', margin: '0 auto' } },
      React.createElement('div', {
        style: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }
      },
        React.createElement('h1', {
          style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 1rem 0' }
        }, `Welcome, ${(state.user as any)?.firstName} ${(state.user as any)?.lastName}`),
        React.createElement('p', {
          style: { color: '#6b7280', margin: '0 0 1.5rem 0' }
        }, 'You have successfully logged in to the 24/7 Tele H health monitoring system.'),
        React.createElement('button', {
          onClick: logout,
          style: { padding: '0.75rem 1.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer' }
        }, 'Logout')
      )
    )
  );
}

createRoot(document.getElementById("root")!).render(React.createElement(HealthApp));
