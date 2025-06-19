import { useState } from 'react';
import EnhancedAdminDashboard from '@/components/EnhancedAdminDashboard';

function App() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-5">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            24/7 Tele H Technology Services
          </h1>
          <p className="text-gray-600 text-sm">
            Advanced Health Monitoring System
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email or Patient ID
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Sign In
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-xs text-gray-500 mb-1">Demo Account</p>
          <p className="text-sm font-medium text-gray-700">
            admin@24x7teleh.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;