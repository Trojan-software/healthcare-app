import { useState } from 'react';
import EnhancedAdminDashboard from '@/components/EnhancedAdminDashboard';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@24x7teleh.com');
  const [password, setPassword] = useState('admin123');

  const handleLogin = () => {
    if (email === 'admin@24x7teleh.com' && password === 'admin123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials. Please use: admin@24x7teleh.com / admin123');
    }
  };

  if (isLoggedIn) {
    return <EnhancedAdminDashboard />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f9ff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          24/7 Tele H Technology Services
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '30px'
        }}>
          Healthcare Management System
        </p>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Email:
          </label>
          <input 
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }} 
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Password:
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }} 
          />
        </div>
        <button 
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
            Demo Login: admin@24x7teleh.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}