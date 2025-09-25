import React, { useState, useEffect } from 'react';
import EnhancedAdminDashboard from './components/EnhancedAdminDashboard';
import PatientDashboardFixed from './components/PatientDashboardFixed';

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
  dateOfBirth?: string;
  mobileNumber?: string;
}

interface Hospital {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface AppState {
  view: 'login' | 'register' | 'admin' | 'patient' | 'loading';
  user: User | null;
  loading: boolean;
  error: string;
}

export default function ProfessionalHealthcareApp() {
  const [state, setState] = useState<AppState>({
    view: 'login',
    user: null,
    loading: false,
    error: ''
  });

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    patientId: '',
    hospitalId: '',
    dateOfBirth: '',
    acceptTerms: false
  });

  const [hospitals] = useState<Hospital[]>([
    { id: "1", name: "Sheikh Khalifa Medical City", location: "Abu Dhabi", type: "Government" },
    { id: "2", name: "Cleveland Clinic Abu Dhabi", location: "Abu Dhabi", type: "Private" },
    { id: "3", name: "Mediclinic City Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "4", name: "Abu Dhabi Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "5", name: "Al Noor Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "6", name: "Burjeel Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "7", name: "Danat Al Emarat Hospital", location: "Abu Dhabi", type: "Specialized" },
    { id: "8", name: "NMC Royal Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "9", name: "Zayed Military Hospital", location: "Abu Dhabi", type: "Government" },
    { id: "10", name: "Al Corniche Hospital", location: "Abu Dhabi", type: "Government" },
    { id: "11", name: "Mediclinic Airport Road Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "12", name: "LLH Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "13", name: "Medeor 24x7 Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "14", name: "Al Zahra Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "15", name: "Prime Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "16", name: "Healthpoint Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "17", name: "Al Noor Specialty Hospital", location: "Abu Dhabi", type: "Private" },
    { id: "18", name: "Bareen International Hospital", location: "MBZ City", type: "Private" },
    { id: "19", name: "Al Mafraq Hospital", location: "Abu Dhabi", type: "Government" },
    { id: "20", name: "Tawam Hospital", location: "Al Ain", type: "Government" },
    { id: "21", name: "Al Ain Hospital", location: "Al Ain", type: "Government" },
    { id: "22", name: "Oasis Hospital", location: "Al Ain", type: "Private" },
    { id: "23", name: "Mediclinic Al Ain", location: "Al Ain", type: "Private" },
    { id: "24", name: "Al Noor Al Ain Hospital", location: "Al Ain", type: "Private" },
    { id: "25", name: "Burjeel Hospital Al Ain", location: "Al Ain", type: "Private" },
    { id: "26", name: "Al Rahba Hospital", location: "Al Rahba", type: "Government" },
    { id: "27", name: "Zayed Higher Organization Hospital", location: "Abu Dhabi", type: "Specialized" },
    { id: "28", name: "American Center for Psychiatry", location: "Abu Dhabi", type: "Specialized" },
    { id: "29", name: "Imperial College London Diabetes Centre", location: "Abu Dhabi", type: "Specialized" },
    { id: "30", name: "Moorfields Eye Hospital", location: "Abu Dhabi", type: "Specialized" }
  ]);

  const handleLogin = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        // Login successful
        
        setState(prev => ({
          ...prev,
          user: data.user,
          view: data.user.role === 'admin' ? 'admin' : 'patient',
          loading: false
        }));
      } else {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          error: errorData.message || 'Login failed', 
          loading: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Network error. Please try again.', 
        loading: false 
      }));
    }
  };

  const handleRegister = async () => {
    if (!formData.acceptTerms) {
      setState(prev => ({ ...prev, error: 'Please accept the terms and conditions' }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setState(prev => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }

    if (formData.password.length < 8) {
      setState(prev => ({ ...prev, error: 'Password must be at least 8 characters long' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          mobile: formData.mobileNumber,
          patientId: formData.patientId,
          hospitalId: formData.hospitalId,
          dateOfBirth: formData.dateOfBirth
        })
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          view: 'login',
          loading: false,
          error: ''
        }));
        alert('Registration successful! Please login with your credentials.');
      } else {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          error: errorData.message || 'Registration failed', 
          loading: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Network error. Please try again.', 
        loading: false 
      }));
    }
  };

  const handleLogout = () => {
    setState({
      view: 'login',
      user: null,
      loading: false,
      error: ''
    });
  };

  const generatePatientId = () => {
    const randomNum = Math.floor(Math.random() * 999999) + 100000;
    setFormData(prev => ({ ...prev, patientId: `PT${randomNum}` }));
  };

  if (state.view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex min-h-screen">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex flex-col justify-center px-12 text-white">
              <div className="mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H9l3-4 3 4h-1v4z"/>
                  </svg>
                </div>
                <h1 className="text-4xl font-bold mb-4">24/7 Tele H</h1>
                <p className="text-xl text-blue-100 mb-8">Technology Services</p>
                <p className="text-lg text-blue-100/90 leading-relaxed">
                  Advanced Healthcare Management System providing comprehensive patient monitoring, 
                  real-time analytics, and seamless integration with medical devices.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">156+</div>
                  <div className="text-blue-100">Active Patients</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-blue-100">Monitoring</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-blue-100">Uptime</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">30+</div>
                  <div className="text-blue-100">Hospitals</div>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-teal-300/20 rounded-full blur-2xl"></div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <div className="lg:hidden mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">24/7 Tele H</h1>
                  <p className="text-gray-600">Technology Services</p>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                <p className="mt-2 text-gray-600">Sign in to your healthcare dashboard</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleLogin(
                  formData.get('email') as string,
                  formData.get('password') as string
                );
              }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address or Patient ID
                  </label>
                  <input
                    type="text"
                    name="email"
                    defaultValue="admin@24x7teleh.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email or patient ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    defaultValue="admin123"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                  />
                </div>

                {state.error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {state.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state.loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                >
                  {state.loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="space-y-4">
                <div className="text-center">
                  <button
                    onClick={() => setState(prev => ({ ...prev, view: 'register' }))}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    New Patient? Create Account
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-600 text-sm mb-2">Demo Credentials</p>
                  <div className="text-gray-800 font-medium text-sm space-y-1">
                    <div>Admin: admin@24x7teleh.com / admin123</div>
                    <div>Patient: patient.demo@example.com / patient123</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Registration</h1>
              <p className="text-gray-600">Join our healthcare management system</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Middle name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number (UAE Format) *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    required
                    pattern="(\+971|0)[0-9]{9}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+971501234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abu Dhabi Hospital/Clinic *
                </label>
                <select
                  value={formData.hospitalId}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospitalId: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your hospital/clinic</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name} - {hospital.location} ({hospital.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.patientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PT123456"
                  />
                  <button
                    type="button"
                    onClick={generatePatientId}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms and Conditions</span> and 
                  <span className="text-blue-600 hover:underline cursor-pointer"> Privacy Policy</span> of 24/7 Tele H Technology Services.
                </label>
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {state.error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, view: 'login' }))}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={state.loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 transition-all"
                >
                  {state.loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'admin' && state.user) {
    return <EnhancedAdminDashboard />;
  }

  if (state.view === 'patient' && state.user) {
    return <PatientDashboardFixed />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading healthcare system...</p>
      </div>
    </div>
  );
}