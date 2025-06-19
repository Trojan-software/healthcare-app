import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnhancedAdminDashboard from '@/components/EnhancedAdminDashboard';
import PatientDashboardFixed from '@/components/PatientDashboardFixed';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'auth' | 'admin' | 'patient'>('auth');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return await apiRequest('/api/auth/login', 'POST', data);
    },
    onSuccess: (response: any) => {
      if (response.success && response.user) {
        const user = response.user;
        setCurrentUser(user);
        if (user.role === 'admin' || user.email === 'admin@24x7teleh.com') {
          setCurrentView('admin');
        } else {
          setCurrentView('patient');
        }
        setError('');
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.email && loginData.password) {
      loginMutation.mutate(loginData);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('auth');
    setLoginData({ email: '', password: '' });
    setError('');
  };

  if (currentView === 'admin' && currentUser) {
    return <EnhancedAdminDashboard />;
  }

  if (currentView === 'patient' && currentUser) {
    return <PatientDashboardFixed user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            24/7 Tele H Technology Services
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Advanced Health Monitoring System
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email or Patient ID</Label>
              <Input
                id="email"
                type="text"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email or patient ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Demo Login: admin@24x7teleh.com / admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
