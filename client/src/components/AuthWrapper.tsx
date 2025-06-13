import { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import EmailVerificationForm from "./EmailVerificationForm";
import UserProfile from "./UserProfile";
import ForgotPasswordForm from "./ForgotPasswordForm";

interface User {
  id: number;
  patientId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthWrapperProps {
  children: (user: User, showProfile: boolean, setShowProfile: (show: boolean) => void, logout: () => void) => React.ReactNode;
}

type AuthStep = 'login' | 'register' | 'verify' | 'authenticated' | 'profile' | 'forgot-password';

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [user, setUser] = useState<User | null>(null);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Check for existing authentication
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setAuthStep('authenticated');
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setAuthStep('authenticated');
  };

  const handleRegister = (email: string) => {
    setEmailToVerify(email);
    setAuthStep('verify');
  };

  const handleVerified = () => {
    setAuthStep('login');
  };

  const handleLogout = () => {
    setUser(null);
    setAuthStep('login');
    setShowProfile(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleShowProfile = (show: boolean) => {
    setShowProfile(show);
  };

  if (authStep === 'authenticated' && user) {
    if (showProfile) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
          <UserProfile onLogout={handleLogout} />
        </div>
      );
    }
    return <>{children(user, showProfile, handleShowProfile, handleLogout)}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {authStep === 'login' && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthStep('register')}
            onForgotPassword={() => setAuthStep('forgot-password')}
          />
        )}
        
        {authStep === 'register' && (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthStep('login')}
          />
        )}
        
        {authStep === 'verify' && (
          <EmailVerificationForm
            email={emailToVerify}
            onVerified={handleVerified}
            onBack={() => setAuthStep('register')}
          />
        )}
        
        {authStep === 'forgot-password' && (
          <ForgotPasswordForm
            onBack={() => setAuthStep('login')}
            onSuccess={() => setAuthStep('login')}
          />
        )}
      </div>
    </div>
  );
}