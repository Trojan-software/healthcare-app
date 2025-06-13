import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import AuthWrapper from "@/components/AuthWrapper";
import MobileDashboard from "@/pages/mobile-dashboard";
import SimpleAdminPage from "@/pages/simple-admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AuthWrapper>
          {(user, showProfile, setShowProfile, logout) => <MobileDashboard />}
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
      <Route path="/admin" component={SimpleAdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
