import { useEffect, useState } from 'react';
import ComprehensiveHealthcareApp from './ComprehensiveHealthcareApp';
import EnhancedAdminDashboard from './components/EnhancedAdminDashboard';
import { DeviceDataProvider } from './contexts/DeviceDataContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { LanguageProvider } from './lib/i18n';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple path-based routing without external router
  if (currentPath.startsWith('/admin')) {
    return (
      <LanguageProvider>
        <DeviceDataProvider>
          <DeviceProvider>
            <div data-testid="text-admin-wired">
              <EnhancedAdminDashboard />
            </div>
          </DeviceProvider>
        </DeviceDataProvider>
      </LanguageProvider>
    );
  }

  return (
    <DeviceDataProvider>
      <DeviceProvider>
        <ComprehensiveHealthcareApp />
      </DeviceProvider>
    </DeviceDataProvider>
  );
}