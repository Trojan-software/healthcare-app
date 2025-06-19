import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function WorkingHealthApp() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'admin' | 'patient'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setView(data.user.role === 'admin' ? 'admin' : 'patient');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">24/7 Tele H</h1>
            <p className="text-gray-600">Healthcare Management System</p>
            <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mt-3">
              ● System Online
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleLogin(
              formData.get('email') as string,
              formData.get('password') as string
            );
          }}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                defaultValue="admin@24x7teleh.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                defaultValue="admin123"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600 text-sm mb-2">Demo Account</p>
            <div className="text-gray-800 font-medium text-sm">
              admin@24x7teleh.com / admin123
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  🏥
                </div>
                <div>
                  <h1 className="text-2xl font-bold">24/7 Tele H Admin</h1>
                  <p className="text-blue-100">Healthcare Management Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-blue-100 text-sm">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">156</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  👥
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">↗ +12.5%</span>
                <span className="text-gray-500 text-sm ml-2">vs last month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Monitoring</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">89</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  📊
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">↗ +8.2%</span>
                <span className="text-gray-500 text-sm ml-2">vs last week</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Critical Alerts</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">7</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  ⚠️
                </div>
              </div>
              <div className="mt-4">
                <span className="text-yellow-600 text-sm font-medium">↗ +2</span>
                <span className="text-gray-500 text-sm ml-2">since yesterday</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Device Connections</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">142</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  🔗
                </div>
              </div>
              <div className="mt-4">
                <span className="text-green-600 text-sm font-medium">98.6%</span>
                <span className="text-gray-500 text-sm ml-2">connection rate</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-6">🏥</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Healthcare Management Dashboard
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
              Comprehensive patient monitoring system with real-time health analytics, 
              device management, and clinical oversight capabilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
                Patient Management
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
                Analytics Dashboard
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
                Device Monitoring
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
                System Settings
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Patient Dashboard</h1>
              <p className="text-green-100">Welcome, {user?.firstName} {user?.lastName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="text-3xl font-bold mb-2">72</div>
            <div className="text-blue-100 text-sm">Heart Rate (BPM)</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="text-3xl font-bold mb-2">120/80</div>
            <div className="text-green-100 text-sm">Blood Pressure</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="text-3xl font-bold mb-2">36.6°C</div>
            <div className="text-pink-100 text-sm">Temperature</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="text-3xl font-bold mb-2">98%</div>
            <div className="text-purple-100 text-sm">Oxygen Level</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Health Overview</h3>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-700 font-medium">All vital signs normal</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Checkup</span>
                <span className="font-medium">2 days ago</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Next Appointment</span>
                <span className="font-medium">Jun 25, 2025</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl font-semibold transition-all">
            <div className="text-3xl mb-2">📊</div>
            View Reports
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl font-semibold transition-all">
            <div className="text-3xl mb-2">📱</div>
            HC03 Device
          </button>
        </div>
      </main>
    </div>
  );
}