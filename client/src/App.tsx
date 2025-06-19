export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui'
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
            Advanced Health Monitoring System
          </p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Email or Patient ID
          </label>
          <input
            type="text"
            defaultValue="admin@24x7teleh.com"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Password
          </label>
          <input
            type="password"
            defaultValue="admin123"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <button
          onClick={() => alert('Healthcare Management System Ready!\n\nDemo Credentials:\nadmin@24x7teleh.com / admin123\n\nSystem includes:\n✓ Patient Management\n✓ Vital Signs Monitoring\n✓ Weekly Health Reports\n✓ PDF Export\n✓ Real-time Analytics')}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Sign In
        </button>
        
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            margin: '0 0 4px 0'
          }}>
            Demo Account
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            margin: 0
          }}>
            admin@24x7teleh.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}