export default function MinimalApp() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #e8eaf6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1e293b',
          textAlign: 'center',
          margin: '0 0 8px 0'
        }}>
          24/7 Tele H Technology Services
        </h1>
        <p style={{
          color: '#64748b',
          textAlign: 'center',
          margin: '0 0 30px 0',
          fontSize: '14px'
        }}>
          Advanced Health Monitoring System
        </p>
        
        <div style={{ marginBottom: '20px' }}>
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
            placeholder="admin@24x7teleh.com"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
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
            placeholder="admin123"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={() => {
            alert('Login functionality will be available once the backend is connected. Demo credentials: admin@24x7teleh.com / admin123');
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#64748b',
            margin: 0
          }}>
            Demo: admin@24x7teleh.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}