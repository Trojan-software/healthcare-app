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

interface AppState {
  view: 'auth' | 'admin' | 'patient';
  user: User | null;
  loading: boolean;
  error: string;
}

export default function WorkingApp() {
  const [state, setState] = useState<AppState>({
    view: 'auth',
    user: null,
    loading: false,
    error: ''
  });

  const handleAuthSuccess = (user: User) => {
    if (user.role === 'admin' || user.email === 'admin@24x7teleh.com') {
      setState(prev => ({ 
        ...prev, 
        view: 'admin',
        user: user,
        loading: false 
      }));
    } else {
      setState(prev => ({ 
        ...prev, 
        view: 'patient',
        user: user,
        loading: false 
      }));
    }
  };

  const logout = () => {
    setState({
      view: 'auth',
      user: null,
      loading: false,
      error: ''
    });
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  switch (state.view) {
    case 'admin':
      return <EnhancedAdminDashboard />;
    
    case 'patient':
      return state.user ? <PatientDashboardFixed /> : (
        <PatientAuthSystem onAuthSuccess={handleAuthSuccess} />
      );
    
    default:
      return (
        <PatientAuthSystem onAuthSuccess={handleAuthSuccess} />
      );
  }
}