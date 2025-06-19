import React, { useState } from 'react';

export default function App() {
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (email: string, password: string) => {
    if (email === 'admin@24x7teleh.com' && password === 'admin123') {
      setUser({ email, role: 'admin' });
      setView('dashboard');
    } else {
      alert('Invalid credentials. Use: admin@24x7teleh.com / admin123');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  if (view === 'login') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              24/7 Tele H Technology Services
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Healthcare Management System</p>
            <span style={{
              display: 'inline-block',
              background: '#10b981',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              marginTop: '12px'
            }}>
              ● System Online
            </span>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            handleLogin(
              formData.get('email') as string,
              formData.get('password') as string
            );
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Email or Patient ID
              </label>
              <input
                type="text"
                name="email"
                defaultValue="admin@24x7teleh.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#374151',
                fontWeight: '500',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                defaultValue="admin123"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          </form>
          
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f3f4f6',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>Demo Account</p>
            <div style={{ color: '#374151', fontWeight: '600', fontSize: '14px' }}>
              admin@24x7teleh.com / admin123
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <button
            onClick={handleLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              float: 'right'
            }}
          >
            Logout
          </button>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            24/7 Tele H Technology Services
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Comprehensive Healthcare Management Dashboard
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
              156
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Active Patients</div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
              23
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Healthcare Providers</div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
              7
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Critical Alerts</div>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
              94%
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>System Uptime</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              title: 'Patient Management',
              description: 'Complete patient database with search, filtering, and profile management capabilities. Track patient demographics, medical history, and treatment plans.'
            },
            {
              title: 'Vital Signs Monitoring',
              description: 'Real-time tracking of heart rate, blood pressure, temperature, oxygen levels, and blood glucose. Automatic alert system for abnormal readings.'
            },
            {
              title: 'Weekly Health Reports',
              description: 'Comprehensive analytics with vital signs filtering and professional text export functionality. Generate detailed health summaries and trends.'
            },
            {
              title: 'HC03 Device Integration',
              description: 'Bluetooth connectivity for medical devices with ECG, blood oxygen, and blood pressure monitoring. Seamless data synchronization.'
            },
            {
              title: 'Alert System',
              description: 'Critical health event notifications and automated patient compliance monitoring. Real-time alerts for healthcare providers.'
            },
            {
              title: 'Analytics Dashboard',
              description: 'Advanced health trends analysis, compliance reports, and real-time patient status tracking. Data-driven insights for better care.'
            }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                borderLeft: '4px solid #3b82f6'
              }}
            >
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                {feature.title}
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}