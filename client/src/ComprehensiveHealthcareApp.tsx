import React, { useState, useEffect } from 'react';
import FAQSection from './components/FAQSection';
import DeviceMonitoring from './components/DeviceMonitoring';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import CheckupScheduling from './components/CheckupScheduling';

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

interface VitalSigns {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  bloodGlucose?: number;
  timestamp: string;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  patientId: string;
  status: string;
  lastActivity: string;
  vitals?: VitalSigns;
  age: number;
}

interface AppState {
  view: 'login' | 'register' | 'admin' | 'patient';
  user: User | null;
  loading: boolean;
  error: string;
}

export default function ComprehensiveHealthcareApp() {
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

  const [adminData, setAdminData] = useState({
    patients: [] as Patient[],
    dashboardStats: null as any,
    searchTerm: '',
    filterStatus: 'all',
    filterHospital: 'all'
  });

  const [modalState, setModalState] = useState({
    showFAQ: false,
    showDeviceMonitoring: false,
    showAdvancedAnalytics: false,
    showCheckupScheduling: false
  });

  const [patientData, setPatientData] = useState({
    vitals: null as VitalSigns | null,
    vitalsHistory: [] as VitalSigns[],
    healthScore: 0,
    nextAppointment: '',
    lastCheckup: ''
  });

  const hospitals: Hospital[] = [
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
  ];

  useEffect(() => {
    if (state.view === 'admin' && state.user) {
      loadAdminData();
    } else if (state.view === 'patient' && state.user) {
      loadPatientData();
    }
  }, [state.view, state.user]);

  const loadAdminData = async () => {
    try {
      const [patientsRes, statsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/dashboard/admin')
      ]);

      if (patientsRes.ok && statsRes.ok) {
        const patients = await patientsRes.json();
        const stats = await statsRes.json();
        setAdminData(prev => ({ ...prev, patients, dashboardStats: stats }));
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadPatientData = async () => {
    if (!state.user) return;

    try {
      const response = await fetch(`/api/dashboard/patient/${state.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPatientData({
          vitals: data.vitals,
          vitalsHistory: data.vitalsHistory || [],
          healthScore: data.healthScore || 85,
          nextAppointment: data.nextAppointment || '',
          lastCheckup: data.lastCheckup || 'Never'
        });
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    }
  };

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

  const generatePatientId = () => {
    const randomNum = Math.floor(Math.random() * 999999) + 100000;
    setFormData(prev => ({ ...prev, patientId: `PT${randomNum}` }));
  };

  const filteredPatients = adminData.patients.filter(patient => {
    const matchesSearch = patient.firstName.toLowerCase().includes(adminData.searchTerm.toLowerCase()) ||
                         patient.lastName.toLowerCase().includes(adminData.searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(adminData.searchTerm.toLowerCase()) ||
                         patient.patientId.toLowerCase().includes(adminData.searchTerm.toLowerCase());
    
    const matchesStatus = adminData.filterStatus === 'all' || patient.status.toLowerCase() === adminData.filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const exportPatientData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Patient ID,Name,Email,Status,Last Activity,Heart Rate,Blood Pressure,Temperature,Oxygen Level\n" +
      filteredPatients.map(patient => 
        `${patient.patientId},"${patient.firstName} ${patient.lastName}",${patient.email},${patient.status},${patient.lastActivity},${patient.vitals?.heartRate || 'N/A'},${patient.vitals?.bloodPressure || 'N/A'},${patient.vitals?.temperature || 'N/A'},${patient.vitals?.oxygenLevel || 'N/A'}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patient_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateWeeklyReport = () => {
    const reportContent = `
24/7 Tele H Technology Services - Weekly Health Report
Generated: ${new Date().toLocaleDateString()}
Report Period: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}

=== EXECUTIVE SUMMARY ===
Total Active Patients: ${adminData.dashboardStats?.totalPatients || 0}
Active Monitoring: ${adminData.dashboardStats?.activePatients || 0}
Critical Alerts: ${adminData.dashboardStats?.criticalAlerts || 0}
System Compliance Rate: ${adminData.dashboardStats?.complianceRate || 0}%

=== PATIENT OVERVIEW ===
${filteredPatients.map((patient, index) => `
${index + 1}. ${patient.firstName} ${patient.lastName} (${patient.patientId})
   Status: ${patient.status}
   Last Activity: ${patient.lastActivity}
   Current Vitals: ${patient.vitals ? `HR: ${patient.vitals.heartRate}, BP: ${patient.vitals.bloodPressure}, Temp: ${patient.vitals.temperature}°C, O2: ${patient.vitals.oxygenLevel}%` : 'No recent data'}
`).join('')}

=== VITAL SIGNS ANALYTICS ===
Average Heart Rate: ${adminData.dashboardStats?.vitalsAverages?.heartRate || 'N/A'} BPM
Average Blood Pressure: ${adminData.dashboardStats?.vitalsAverages?.bloodPressure || 'N/A'}
Average Temperature: ${adminData.dashboardStats?.vitalsAverages?.temperature || 'N/A'}°C
Average Oxygen Level: ${adminData.dashboardStats?.vitalsAverages?.oxygenLevel || 'N/A'}%

=== COMPLIANCE BREAKDOWN ===
Excellent Compliance: ${adminData.dashboardStats?.complianceBreakdown?.excellent || 0} patients
Good Compliance: ${adminData.dashboardStats?.complianceBreakdown?.good || 0} patients
Needs Improvement: ${adminData.dashboardStats?.complianceBreakdown?.needs_improvement || 0} patients

=== ALERT HISTORY ===
${adminData.dashboardStats?.alertHistory?.map((alert: any) => 
  `${alert.type}: ${alert.count} incidents (${alert.severity} severity)`
).join('\n') || 'No alerts recorded'}

=== RECOMMENDATIONS ===
- Continue monitoring patients with critical status
- Follow up with patients showing declining compliance
- Review medication schedules for patients with abnormal vitals
- Schedule preventive checkups for due patients

Report generated by 24/7 Tele H Technology Services
For questions, contact: support@24x7teleh.com
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly_health_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (state.view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex min-h-screen">
          {/* Branding Section */}
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
          </div>

          {/* Login Form */}
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
                    <div>Patient: test@example.com / patient123</div>
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
              <p className="text-gray-600">Join our comprehensive healthcare management system</p>
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
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H9l3-4 3 4h-1v4z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">24/7 Tele H Admin</h1>
                  <p className="text-blue-100">Healthcare Management Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-medium">{state.user.firstName} {state.user.lastName}</p>
                  <p className="text-blue-100 text-sm">Administrator</p>
                </div>
                <button
                  onClick={() => setState({ view: 'login', user: null, loading: false, error: '' })}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Dashboard Stats */}
          {adminData.dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.totalPatients}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    👥
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Active Monitoring</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.activePatients}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    📊
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Critical Alerts</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.criticalAlerts}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    ⚠️
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Compliance Rate</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.complianceRate}%</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    📈
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => setModalState(prev => ({ ...prev, showFAQ: true }))}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            >
              <div className="text-3xl mb-2">❓</div>
              <div>FAQ & Support</div>
              <div className="text-sm text-indigo-100 mt-1">Device guides & help</div>
            </button>

            <button
              onClick={() => setModalState(prev => ({ ...prev, showDeviceMonitoring: true }))}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              <div className="text-3xl mb-2">📱</div>
              <div>Device Monitoring</div>
              <div className="text-sm text-purple-100 mt-1">HC03 status & battery</div>
            </button>

            <button
              onClick={() => setModalState(prev => ({ ...prev, showAdvancedAnalytics: true }))}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-green-700 hover:to-teal-700 shadow-lg"
            >
              <div className="text-3xl mb-2">📊</div>
              <div>Advanced Analytics</div>
              <div className="text-sm text-green-100 mt-1">AI insights & trends</div>
            </button>

            <button
              onClick={() => setModalState(prev => ({ ...prev, showCheckupScheduling: true }))}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-blue-700 hover:to-cyan-700 shadow-lg"
            >
              <div className="text-3xl mb-2">⏰</div>
              <div>Enhanced Scheduling</div>
              <div className="text-sm text-blue-100 mt-1">1-4 hour intervals</div>
            </button>
          </div>

          {/* Patient Management */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Patient Management</h2>
              <div className="flex space-x-4">
                <button
                  onClick={exportPatientData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={generateWeeklyReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Weekly Report
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder="Search patients..."
                value={adminData.searchTerm}
                onChange={(e) => setAdminData(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={adminData.filterStatus}
                onChange={(e) => setAdminData(prev => ({ ...prev, filterStatus: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="normal">Normal</option>
                <option value="critical">Critical</option>
                <option value="attention">Attention</option>
              </select>
              <select
                value={adminData.filterHospital}
                onChange={(e) => setAdminData(prev => ({ ...prev, filterHospital: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Hospitals</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                ))}
              </select>
            </div>

            {/* Patients Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vitals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {adminData.searchTerm && (patient.firstName.toLowerCase().includes(adminData.searchTerm.toLowerCase()) || 
                             patient.lastName.toLowerCase().includes(adminData.searchTerm.toLowerCase())) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: `${patient.firstName} ${patient.lastName}`.replace(
                                  new RegExp(adminData.searchTerm, 'gi'),
                                  '<mark style="background-color: yellow;">$&</mark>'
                                )
                              }} />
                            ) : (
                              `${patient.firstName} ${patient.lastName}`
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {adminData.searchTerm && patient.email.toLowerCase().includes(adminData.searchTerm.toLowerCase()) ? (
                              <span dangerouslySetInnerHTML={{
                                __html: patient.email.replace(
                                  new RegExp(adminData.searchTerm, 'gi'),
                                  '<mark style="background-color: yellow;">$&</mark>'
                                )
                              }} />
                            ) : (
                              patient.email
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adminData.searchTerm && patient.patientId.toLowerCase().includes(adminData.searchTerm.toLowerCase()) ? (
                          <span dangerouslySetInnerHTML={{
                            __html: patient.patientId.replace(
                              new RegExp(adminData.searchTerm, 'gi'),
                              '<mark style="background-color: yellow;">$&</mark>'
                            )
                          }} />
                        ) : (
                          patient.patientId
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                          patient.status === 'Attention' ? 'bg-yellow-100 text-yellow-800' :
                          patient.status === 'Normal' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.lastActivity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.vitals ? (
                          <div className="space-y-1">
                            <div>HR: {patient.vitals.heartRate} BPM</div>
                            <div>BP: {patient.vitals.bloodPressure}</div>
                            <div>O2: {patient.vitals.oxygenLevel}%</div>
                          </div>
                        ) : (
                          'No recent data'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                        <button className="text-green-600 hover:text-green-900">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Modal Components */}
        {modalState.showFAQ && (
          <FAQSection onClose={() => setModalState(prev => ({ ...prev, showFAQ: false }))} />
        )}
        
        {modalState.showDeviceMonitoring && (
          <DeviceMonitoring onClose={() => setModalState(prev => ({ ...prev, showDeviceMonitoring: false }))} />
        )}
        
        {modalState.showAdvancedAnalytics && (
          <AdvancedAnalytics onClose={() => setModalState(prev => ({ ...prev, showAdvancedAnalytics: false }))} />
        )}
        
        {modalState.showCheckupScheduling && (
          <CheckupScheduling onClose={() => setModalState(prev => ({ ...prev, showCheckupScheduling: false }))} />
        )}
      </div>
    );
  }

  if (state.view === 'patient' && state.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Patient Dashboard</h1>
                <p className="text-green-100">Welcome, {state.user.firstName} {state.user.lastName}</p>
              </div>
              <button
                onClick={() => setState({ view: 'login', user: null, loading: false, error: '' })}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Current Vitals */}
          {patientData.vitals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals.heartRate}</div>
                <div className="text-blue-100 text-sm">Heart Rate (BPM)</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals.bloodPressure}</div>
                <div className="text-green-100 text-sm">Blood Pressure</div>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals.temperature}°C</div>
                <div className="text-pink-100 text-sm">Temperature</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-violet-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals.oxygenLevel}%</div>
                <div className="text-purple-100 text-sm">Oxygen Level</div>
              </div>
            </div>
          )}

          {/* Health Overview */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Health Overview</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">All vital signs normal</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Health Score</span>
                  <span className="font-medium">{patientData.healthScore}/100</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Checkup</span>
                  <span className="font-medium">{patientData.lastCheckup}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Appointment</span>
                  <span className="font-medium">{patientData.nextAppointment}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl font-semibold transition-all">
              <div className="text-3xl mb-2">📊</div>
              View Reports
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl font-semibold transition-all">
              <div className="text-3xl mb-2">📱</div>
              HC03 Device
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl font-semibold transition-all">
              <div className="text-3xl mb-2">📅</div>
              Appointments
            </button>
          </div>
        </main>
      </div>
    );
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