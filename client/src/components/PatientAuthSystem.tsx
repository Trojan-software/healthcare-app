import React, { useState } from 'react';
import EnhancedPatientSignup from './EnhancedPatientSignup';
import EnhancedPatientLogin from './EnhancedPatientLogin';
import HealthMonitoring from '@/pages/health-monitoring';

interface User {
  id: number;
  patientId: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: string;
  hospitalId?: string;
  isVerified: boolean;
}

export default function PatientAuthSystem() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'dashboard'
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleShowSignup = () => {
    setCurrentView('signup');
  };

  const handleShowLogin = () => {
    setCurrentView('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (currentView === 'dashboard' && currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  24/7 Tele H Technology Services
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome, {currentUser.firstName} {currentUser.lastName} | ID: {currentUser.patientId}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HealthMonitoring />
        </div>
      </div>
    );
  }

  if (currentView === 'signup') {
    return <EnhancedPatientSignup />;
  }

  return (
    <EnhancedPatientLogin 
      onLoginSuccess={handleLoginSuccess}
      onShowSignup={handleShowSignup}
    />
  );
}