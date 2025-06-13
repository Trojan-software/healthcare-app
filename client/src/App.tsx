import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthWrapper from "@/components/AuthWrapper";
import MobileDashboard from "@/pages/mobile-dashboard";
import AdminDashboard from "@/components/AdminDashboard";
import NotFound from "@/pages/not-found";

interface User {
  id: number;
  patientId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AuthWrapper>
          {(user, showProfile, setShowProfile, logout) => {
            if (user?.role === 'admin') {
              return <AdminDashboard />;
            }
            return <MobileDashboard />;
          }}
        </AuthWrapper>
      )} />
      <Route path="/dashboard" component={() => (
        <AuthWrapper>
          {(user, showProfile, setShowProfile, logout) => <MobileDashboard />}
        </AuthWrapper>
      )} />
      <Route path="/mobile" component={() => (
        <AuthWrapper>
          {(user, showProfile, setShowProfile, logout) => <MobileDashboard />}
        </AuthWrapper>
      )} />
      <Route path="/mobile-dashboard" component={() => (
        <AuthWrapper>
          {(user, showProfile, setShowProfile, logout) => <MobileDashboard />}
        </AuthWrapper>
      )} />
      <Route path="/admin" component={() => (
        <AuthWrapper>
          {(user, showProfile, setShowProfile, logout) => {
            if (user?.role !== 'admin') {
              return <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
                <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
              </div>;
            }
            return <AdminDashboard />;
          }}
        </AuthWrapper>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
