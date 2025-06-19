import { useState } from 'react';
import PatientAuthSystem from '@/components/PatientAuthSystem';
import EnhancedAdminDashboard from '@/components/EnhancedAdminDashboard';
import PatientDashboardFixed from '@/components/PatientDashboardFixed';

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

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin' || user.email === 'admin@24x7teleh.com') {
      setCurrentView('admin');
    } else {
      setCurrentView('patient');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('auth');
  };

  if (currentView === 'admin' && currentUser) {
    return <EnhancedAdminDashboard />;
  }

  if (currentView === 'patient' && currentUser) {
    return <PatientDashboardFixed />;
  }

  return <PatientAuthSystem onAuthSuccess={handleAuthSuccess} />;
}

export default App;
