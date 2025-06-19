import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, LogIn, Hospital, User, Phone, Mail, Lock, Shield, Activity, Users, AlertTriangle, Wifi } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface Hospital {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface AppState {
  view: 'login' | 'register' | 'otp-verify' | 'admin' | 'patient';
  user: User | null;
  pendingEmail: string;
  error: string;
}

export default function ProfessionalApp() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AppState>({
    view: 'login',
    user: null,
    pendingEmail: '',
    error: ''
  });

  // Fetch hospitals for registration
  const { data: hospitals = [] } = useQuery({
    queryKey: ['/api/hospitals/abudhabi'],
    enabled: state.view === 'register'
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        user: data.user,
        view: data.user.role === 'admin' ? 'admin' : 'patient',
        error: ''
      }));
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || 'Login failed'
      }));
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: (data, variables) => {
      setState(prev => ({
        ...prev,
        view: 'otp-verify',
        pendingEmail: variables.email,
        error: ''
      }));
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || 'Registration failed'
      }));
    }
  });

  // OTP verification mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (otpData: { email: string; otp: string }) => {
      return await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(otpData)
      });
    },
    onSuccess: () => {
      setState(prev => ({
        ...prev,
        view: 'login',
        pendingEmail: '',
        error: ''
      }));
    },
    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        error: error.message || 'OTP verification failed'
      }));
    }
  });

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      setState(prev => ({ ...prev, error: 'Please fill in all fields' }));
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      firstName: formData.get('firstName') as string,
      middleName: formData.get('middleName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      mobileNumber: formData.get('mobileNumber') as string,
      hospitalId: formData.get('hospitalId') as string,
      password: formData.get('password') as string
    };

    // Validation
    if (!userData.firstName || !userData.lastName || !userData.email || 
        !userData.mobileNumber || !userData.hospitalId || !userData.password) {
      setState(prev => ({ ...prev, error: 'Please fill in all required fields' }));
      return;
    }

    if (userData.password.length < 6) {
      setState(prev => ({ ...prev, error: 'Password must be at least 6 characters' }));
      return;
    }

    registerMutation.mutate(userData);
  };

  const handleOtpVerify = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const otp = formData.get('otp') as string;
    
    if (!otp || otp.length !== 6) {
      setState(prev => ({ ...prev, error: 'Please enter a valid 6-digit OTP' }));
      return;
    }

    verifyOtpMutation.mutate({ email: state.pendingEmail, otp });
  };

  const logout = () => {
    setState({
      view: 'login',
      user: null,
      pendingEmail: '',
      error: ''
    });
  };

  // Login View
  if (state.view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">24/7 Tele H</CardTitle>
              <CardDescription className="text-gray-600">Health Monitoring System</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><span className="font-medium">Admin:</span> admin@24x7teleh.com / admin123</p>
                    <p><span className="font-medium">Patient:</span> patient.demo@example.com / patient123</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Don't have an account?</p>
              <Button
                onClick={() => setState(prev => ({ ...prev, view: 'register', error: '' }))}
                variant="outline"
                className="w-full h-11 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register as New Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration View
  if (state.view === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Patient Registration</CardTitle>
              <CardDescription className="text-gray-600">Join 24/7 Tele H Health Monitoring System</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Enter first name"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    placeholder="Enter middle name (optional)"
                    className="h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter last name"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="+971XXXXXXXXX"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalId">Affiliated Hospital *</Label>
                <Select name="hospitalId" required>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select your affiliated hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map((hospital: Hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        <div className="flex items-center space-x-2">
                          <Hospital className="h-4 w-4" />
                          <span>{hospital.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {hospital.type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a secure password (min. 6 characters)"
                  required
                  className="h-11"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, view: 'login', error: '' }))}
                  className="flex-1 h-11"
                >
                  Back to Login
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register Patient
                    </>
                  )}
                </Button>
              </div>
            </form>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Registration includes OTP email verification and automatic patient ID generation for secure access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification View
  if (state.view === 'otp-verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
              <CardDescription className="text-gray-600">
                Enter the 6-digit code sent to {state.pendingEmail}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {state.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  className="h-11 text-center text-lg tracking-widest"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Email
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => setState(prev => ({ ...prev, view: 'login', error: '' }))}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  if (state.view === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">24/7 Tele H Admin</h1>
                  <p className="text-sm text-gray-500">Healthcare Management Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {state.user?.firstName} {state.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <Button onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-900">156</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">↗ +12.5%</span>
                  <span className="text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Monitoring</p>
                    <p className="text-3xl font-bold text-gray-900">89</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">↗ +8.2%</span>
                  <span className="text-gray-500 ml-1">vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                    <p className="text-3xl font-bold text-gray-900">7</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-red-600 font-medium">↗ +2</span>
                  <span className="text-gray-500 ml-1">since yesterday</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Device Connections</p>
                    <p className="text-3xl font-bold text-gray-900">142</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wifi className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 font-medium">98.6%</span>
                  <span className="text-gray-500 ml-1">connection rate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Healthcare Management Dashboard</CardTitle>
              <CardDescription>
                Comprehensive patient monitoring system with real-time health analytics, device management, and clinical oversight capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex-col space-y-2">
                  <Users className="h-6 w-6" />
                  <span>Patient Management</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Activity className="h-6 w-6" />
                  <span>Analytics Dashboard</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Wifi className="h-6 w-6" />
                  <span>Device Monitoring</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <AlertTriangle className="h-6 w-6" />
                  <span>System Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Patient Dashboard
  if (state.view === 'patient') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Patient Dashboard</h1>
                  <p className="text-sm text-gray-500">Welcome, {state.user?.firstName} {state.user?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {state.user?.patientId}
                </Badge>
                <Button onClick={logout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Health Monitoring Dashboard</CardTitle>
              <CardDescription>
                Your personal health monitoring and vital signs tracking system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Health Monitoring Coming Soon</h3>
                <p className="text-gray-500">
                  Connect your HC03 device to start monitoring your vital signs and health metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return null;
}