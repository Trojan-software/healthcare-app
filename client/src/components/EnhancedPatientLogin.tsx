import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Building2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const loginSchema = z.object({
  emailOrPatientId: z.string().min(1, 'Please enter your email or patient ID'),
  password: z.string().min(1, 'Please enter your password'),
  rememberMe: z.boolean().optional()
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onShowSignup: () => void;
}

export default function EnhancedPatientLogin({ onLoginSuccess, onShowSignup }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPatientId: '',
      password: '',
      rememberMe: false
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return await apiRequest('/api/auth/login', 'POST', data);
    },
    onSuccess: (response: any) => {
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setLoginError(response.message || 'Login failed');
      }
    },
    onError: (error: any) => {
      setLoginError(error.message || 'Login failed. Please check your credentials.');
    }
  });

  const onSubmit = (data: LoginForm) => {
    setLoginError('');
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-8">
      <div className="w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            24/7 Tele H Technology Services
          </h1>
          <p className="text-gray-600">Healthcare Monitoring Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Login Error */}
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{loginError}</p>
                </div>
              )}

              {/* Email or Patient ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address or Patient ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...form.register('emailOrPatientId')}
                    type="text"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email or patient ID"
                  />
                </div>
                {form.formState.errors.emailOrPatientId && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.emailOrPatientId.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...form.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-600 text-sm mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    {...form.register('rememberMe')}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-600">Remember me</label>
                </div>
                <a href="#" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  'Signing in...'
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Demo Accounts */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Demo Accounts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Patient Demo:</span>
                    <Badge variant="outline" className="text-xs">
                      patient.demo@example.com / patient123
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Admin Access:</span>
                    <Badge variant="outline" className="text-xs">
                      admin@24x7teleh.com / admin123
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Don't have an account?
                </p>
                <button
                  type="button"
                  onClick={onShowSignup}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <User className="w-4 h-4" />
                  Register as New Patient
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Building2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 text-sm">Abu Dhabi Hospitals</h4>
            <p className="text-xs text-gray-600">Connected to major healthcare facilities</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 text-sm">Secure Monitoring</h4>
            <p className="text-xs text-gray-600">24/7 health tracking & alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}