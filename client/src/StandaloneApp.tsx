import React, { useState, useEffect } from 'react';

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

interface LoginData {
  email: string;
  password: string;
}

interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  bloodGlucose?: number;
  timestamp: string;
}

export default function StandaloneApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [patients, setPatients] = useState<User[]>([]);

  // Demo vital signs data
  const demoVitals: VitalSigns[] = [
    {
      heartRate: 72,
      bloodPressure: '120/80',
      temperature: 36.6,
      oxygenLevel: 98,
      bloodGlucose: 95,
      timestamp: new Date().toISOString()
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setVitals(demoVitals);
        
        if (userData.role === 'admin') {
          const patientsResponse = await fetch('/api/admin/patients');
          if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            setPatients(patientsData);
          }
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setVitals([]);
    setPatients([]);
    setLoginData({ email: '', password: '' });
    setError('');
  };

  // Login Interface
  if (!user) {
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
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              24/7 Tele H Technology Services
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Healthcare Management System
            </p>
            <div style={{
              display: 'inline-block',
              background: '#10b981',
              color: 'white',
              fontSize: '12px',
              padding: '4px 12px',
              borderRadius: '20px',
              marginTop: '12px'
            }}>
              ● System Online
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Email or Patient ID
              </label>
              <input
                type="text"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Enter your email or patient ID"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <strong>Demo Credentials:</strong><br />
            Admin: admin@24x7teleh.com / admin123<br />
            Patient: patient@demo.com / patient123
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user.role === 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            24/7 Tele H - Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </header>

        <main style={{ padding: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Total Patients</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                {patients.length || 156}
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Active Monitors</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>89</p>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Critical Alerts</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>3</p>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Compliance Rate</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>94%</p>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              Patient Management
            </h2>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Patient ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Last Reading</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>P001</td>
                    <td style={{ padding: '12px' }}>Ahmed Al-Mahmoud</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Normal
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>2 hours ago</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>P002</td>
                    <td style={{ padding: '12px' }}>Fatima Al-Zahra</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: '#f59e0b',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Monitor
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>15 minutes ago</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px' }}>P003</td>
                    <td style={{ padding: '12px' }}>Mohammed Hassan</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Critical
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>5 minutes ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Patient Dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937'
        }}>
          24/7 Tele H - My Health Dashboard
        </h1>
        <button
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      <main style={{ padding: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {vitals.length > 0 && vitals.map((vital, index) => (
            <React.Fragment key={index}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Heart Rate</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                  {vital.heartRate} <span style={{ fontSize: '16px' }}>bpm</span>
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Blood Pressure</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {vital.bloodPressure} <span style={{ fontSize: '16px' }}>mmHg</span>
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Temperature</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {vital.temperature}° <span style={{ fontSize: '16px' }}>C</span>
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#1f2937', marginBottom: '8px' }}>Oxygen Level</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                  {vital.oxygenLevel} <span style={{ fontSize: '16px' }}>%</span>
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            Health Status Overview
          </h2>
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                marginRight: '8px'
              }}></div>
              <span style={{ fontWeight: '600', color: '#166534' }}>All Vital Signs Normal</span>
            </div>
            <p style={{ color: '#15803d', fontSize: '14px' }}>
              Your latest readings are within healthy ranges. Continue your regular medication schedule.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}