import { useEffect, useState } from 'react';
import ComprehensiveHealthcareApp from './ComprehensiveHealthcareApp';
import EnhancedAdminDashboard from './components/EnhancedAdminDashboard';

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
      <div data-testid="text-admin-wired">
        <EnhancedAdminDashboard />
      </div>
    );
  }

  return <ComprehensiveHealthcareApp />;
}