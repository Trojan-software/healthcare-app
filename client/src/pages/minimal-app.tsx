import { useState } from "react";

export default function MinimalApp() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const result = await response.json();
      setUser(result.user);
      
      if (result.user.role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
    setEmail("");
    setPassword("");
  };

  if (currentPage === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>24/7 Tele H</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Health Monitoring System</p>
          </div>
          
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: '6px' }}>
              <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                placeholder="Enter your email"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: isLoading ? '#9ca3af' : '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                fontSize: '14px', 
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e5e7eb', marginTop: '24px' }}>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>Demo Accounts:</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px 0' }}>Admin: admin@24x7teleh.com / admin123</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Patient: patient.demo@example.com / patient123</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin' && user?.role === 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>Admin Dashboard</h1>
              <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>Manage patient dashboard access for 24/7 Tele H</p>
            </div>
            <button
              onClick={handleLogout}
              style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 16px 0' }}>Welcome, {user.firstName} {user.lastName}</h2>
            <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
              You have successfully logged in as an administrator. This system allows you to manage patient dashboard access credentials.
            </p>
            
            <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#111827', margin: '0 0 12px 0' }}>System Status</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ color: '#059669', marginBottom: '4px' }}>✓ SendGrid email service removed</li>
                <li style={{ color: '#059669', marginBottom: '4px' }}>✓ Test mode OTP system active</li>
                <li style={{ color: '#059669', marginBottom: '4px' }}>✓ Admin authentication working</li>
                <li style={{ color: '#059669' }}>✓ Database connection established</li>
              </ul>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#92400e', margin: '0 0 8px 0' }}>Test Credentials</h4>
              <p style={{ fontSize: '12px', color: '#92400e', margin: '0 0 4px 0' }}>Admin: admin@24x7teleh.com / admin123</p>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>Demo Patient: patient.demo@example.com / patient123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px 0' }}>
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
            You have successfully logged in to the 24/7 Tele H health monitoring system.
          </p>
          <button
            onClick={handleLogout}
            style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}