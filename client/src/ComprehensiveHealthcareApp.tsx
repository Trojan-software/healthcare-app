import React, { useState, useEffect } from 'react';
import { handleApiError } from '@/lib/errorHandler';
import FAQSection from './components/FAQSection';
import DeviceMonitoring from './components/DeviceMonitoring';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import CheckupScheduling from './components/CheckupScheduling';
import EnhancedPatientDashboard from './components/EnhancedPatientDashboard';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import { LanguageProvider, useLanguage, LanguageSwitcher } from './lib/i18n';

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
  dateOfBirth?: string;
  isActive: boolean;
}

interface AppState {
  view: 'login' | 'register' | 'admin' | 'patient' | 'forgot-password';
  user: User | null;
  loading: boolean;
  error: string;
}

function AppContent() {
  const { t, isRTL } = useLanguage();
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
    customHospitalName: '',
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
    showCheckupScheduling: false,
    showEditPatient: false,
    showViewPatient: false
  });

  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('email');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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
        const patientsData = await patientsRes.json();
        const stats = await statsRes.json();
        
        // Map backend data to frontend Patient interface
        const patients = patientsData.map((patient: any) => ({
          ...patient,
          isActive: patient.isVerified // Map isVerified to isActive for frontend
        }));
        
        setAdminData(prev => ({ ...prev, patients, dashboardStats: stats }));
      }
    } catch (error) {
      handleApiError('ComprehensiveHealthcareApp', 'loadAdminData', error as Error, {});
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
      handleApiError('ComprehensiveHealthcareApp', 'loadPatientData', error as Error, { userId: state.user.id });
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
          error: errorData.message || t('loginFailed'), 
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
      setState(prev => ({ ...prev, error: t('pleaseAcceptTerms') }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setState(prev => ({ ...prev, error: t('passwordsDoNotMatch') }));
      return;
    }

    if (formData.password.length < 8) {
      setState(prev => ({ ...prev, error: 'Password must be at least 8 characters long' }));
      return;
    }

    if (formData.hospitalId === 'other' && !formData.customHospitalName.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter the name of your hospital/clinic' }));
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
          customHospitalName: formData.hospitalId === 'other' ? formData.customHospitalName : '',
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
        alert(t('registrationSuccessful'));
      } else {
        const errorData = await response.json();
        setState(prev => ({ 
          ...prev, 
          error: errorData.message || t('registrationFailed'), 
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
    const fullName = `${patient.firstName} ${(patient as any).middleName || ''} ${patient.lastName}`.toLowerCase();
    const searchLower = adminData.searchTerm.toLowerCase();
    
    const matchesSearch = adminData.searchTerm === '' || 
      fullName.includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.patientId.toLowerCase().includes(searchLower);
    
    const matchesStatus = adminData.filterStatus === 'all' || 
      patient.status.toLowerCase() === adminData.filterStatus.toLowerCase();
    
    const matchesHospital = adminData.filterHospital === 'all' || 
      (patient as any).hospitalId === adminData.filterHospital;
    
    return matchesSearch && matchesStatus && matchesHospital;
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
24/7 Health Monitor - Weekly Health Report
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

Report generated by 24/7 Health Monitor
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
                <h1 className="text-4xl font-bold mb-4">24/7 Health Monitor</h1>
                <p className="text-xl text-blue-100 mb-8">{t('technologyServices')}</p>
                <p className="text-lg text-blue-100/90 leading-relaxed">
                  {t('advancedHealthcareSystem')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">156+</div>
                  <div className="text-blue-100">{t('activePatients')}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-blue-100">{t('monitoring247')}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-blue-100">{t('uptime')}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-2xl font-bold">30+</div>
                  <div className="text-blue-100">{t('hospitals')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className={`w-full lg:w-1/2 flex items-center justify-center px-6 py-12 ${isRTL ? 'rtl' : 'ltr'}`}>
            <div className="w-full max-w-md space-y-8">
              <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <div className="lg:hidden mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">24/7 Health Monitor</h1>
                    <p className="text-gray-600">
                      {t('technologyServices')}
                    </p>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {t('welcomeBack')}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {t('signInToHealthcareDashboard')}
                  </p>
                </div>
                <LanguageSwitcher />
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
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('emailOrPatientId')}
                  </label>
                  <input
                    type="text"
                    name="email"
                    required
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={t('enterEmailOrPatientId')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('password')}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={t('enterPassword')}
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
                  data-testid="button-login-submit"
                >
                  {state.loading ? t('signingIn') : t('signIn')}
                </button>
              </form>

              <div className="space-y-4">
                <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                  <button
                    onClick={() => setState(prev => ({ ...prev, view: 'forgot-password' }))}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors mb-4"
                    data-testid="button-forgot-password"
                  >
                    {isRTL ? 'هل نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                </div>
                
                <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                  <button
                    onClick={() => setState(prev => ({ ...prev, view: 'register' }))}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    data-testid="button-go-to-register"
                  >
                    {isRTL ? 'مريض جديد؟ إنشاء حساب' : 'New Patient? Create Account'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.view === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 mt-2">Enter your email to receive password reset instructions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <ForgotPasswordForm 
              onBack={() => setState(prev => ({ ...prev, view: 'login' }))}
              onSuccess={() => setState(prev => ({ ...prev, view: 'login', error: '' }))}
            />
            <div className="text-center mt-6">
              <button
                onClick={() => setState(prev => ({ ...prev, view: 'login' }))}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                data-testid="button-back-to-login"
              >
                Back to Login
              </button>
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
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      hospitalId: e.target.value,
                      customHospitalName: e.target.value !== 'other' ? '' : prev.customHospitalName
                    }))
                  }}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  data-testid="select-hospital"
                >
                  <option value="">Select your hospital/clinic</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name} - {hospital.location} ({hospital.type})
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Custom Hospital Name Field */}
              {formData.hospitalId === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name of Hospital/Clinic *
                  </label>
                  <input
                    type="text"
                    value={formData.customHospitalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customHospitalName: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter hospital/clinic name"
                    data-testid="input-custom-hospital"
                  />
                </div>
              )}

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
                    data-testid="button-generate-patient-id"
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
                  <span className="text-blue-600 hover:underline cursor-pointer"> Privacy Policy</span> of 24/7 Health Monitor.
                </label>
              </div>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {state.error}
                </div>
              )}

              {/* OTP Method Selection */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Verification Method
                </label>
                <div className="flex gap-4">
                  <div 
                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      otpMethod === 'email' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setOtpMethod('email')}
                    data-testid="option-email-verification"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        otpMethod === 'email' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {otpMethod === 'email' && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium text-gray-900">Email Verification</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive OTP via email
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      otpMethod === 'sms' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setOtpMethod('sms')}
                    data-testid="option-sms-verification"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        otpMethod === 'sms' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {otpMethod === 'sms' && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="font-medium text-gray-900">SMS Verification</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive OTP via SMS
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setState(prev => ({ ...prev, view: 'login' }))}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  data-testid="button-back-to-login-register"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={state.loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 transition-all"
                  data-testid="button-create-account"
                >
                  {state.loading ? 'Creating Account...' : `Create Account & Send ${otpMethod === 'email' ? 'Email' : 'SMS'} OTP`}
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
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H9l3-4 3 4h-1v4z"/>
                  </svg>
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h1 className="text-2xl font-bold">{t('teleHAdmin247')}</h1>
                  <p className="text-blue-100">{t('healthcareManagementDashboard')}</p>
                </div>
              </div>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
                <LanguageSwitcher />
                <div className={isRTL ? 'text-left' : 'text-right'}>
                  <p className="font-medium">{state.user.firstName} {state.user.lastName}</p>
                  <p className="text-blue-100 text-sm">{t('administrator')}</p>
                </div>
                <button
                  onClick={() => setState({ view: 'login', user: null, loading: false, error: '' })}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
                  data-testid="button-logout-admin"
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Dashboard Stats */}
          {adminData.dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <button 
                onClick={() => {
                  document.getElementById('patient-management-section')?.scrollIntoView({ behavior: 'smooth' });
                  setAdminData(prev => ({ ...prev, searchTerm: '', filterStatus: 'all', filterHospital: 'all' }));
                }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                data-testid="button-dashboard-total-patients"
              >
                <div className="flex justify-between items-start">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-gray-600 text-sm font-medium">{t('totalPatients')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.totalPatients}</p>
                    <p className="text-blue-600 text-xs mt-1">{t('clickToViewAllPatients')}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    👥
                  </div>
                </div>
              </button>

              <button 
                onClick={() => {
                  document.getElementById('patient-management-section')?.scrollIntoView({ behavior: 'smooth' });
                  setAdminData(prev => ({ ...prev, searchTerm: '', filterStatus: 'Normal', filterHospital: 'all' }));
                }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                data-testid="button-dashboard-active-patients"
              >
                <div className="flex justify-between items-start">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-gray-600 text-sm font-medium">{t('activeMonitoring')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.activePatients}</p>
                    <p className="text-green-600 text-xs mt-1">{t('clickToViewActivePatients')}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    📊
                  </div>
                </div>
              </button>

              <button 
                onClick={() => {
                  document.getElementById('patient-management-section')?.scrollIntoView({ behavior: 'smooth' });
                  setAdminData(prev => ({ ...prev, searchTerm: '', filterStatus: 'Critical', filterHospital: 'all' }));
                }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                data-testid="button-dashboard-critical-alerts"
              >
                <div className="flex justify-between items-start">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-gray-600 text-sm font-medium">{t('criticalAlert')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.criticalAlerts}</p>
                    <p className="text-yellow-600 text-xs mt-1">{t('clickToViewCriticalPatients')}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    ⚠️
                  </div>
                </div>
              </button>

              <button 
                onClick={() => {
                  setModalState(prev => ({ ...prev, showAdvancedAnalytics: true }));
                }}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all cursor-pointer w-full text-left"
                data-testid="button-dashboard-analytics"
              >
                <div className="flex justify-between items-start">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-gray-600 text-sm font-medium">{t('complianceRate')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{adminData.dashboardStats.complianceRate}%</p>
                    <p className="text-purple-600 text-xs mt-1">{t('clickToViewAnalytics')}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    📈
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Advanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => setModalState(prev => ({ ...prev, showFAQ: true }))}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            >
              <div className="text-3xl mb-2">❓</div>
              <div>{t('faqAndSupport')}</div>
              <div className="text-sm text-indigo-100 mt-1">{t('deviceGuidesAndHelp')}</div>
            </button>

            <button
              onClick={() => setModalState(prev => ({ ...prev, showDeviceMonitoring: true }))}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              <div className="text-3xl mb-2">📱</div>
              <div>{t('deviceMonitoring')}</div>
              <div className="text-sm text-purple-100 mt-1">{t('hc03StatusAndBattery')}</div>
            </button>

            <button
              onClick={() => setModalState(prev => ({ ...prev, showAdvancedAnalytics: true }))}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-green-700 hover:to-teal-700 shadow-lg"
            >
              <div className="text-3xl mb-2">📊</div>
              <div>{t('advancedAnalytics')}</div>
              <div className="text-sm text-green-100 mt-1">{t('aiInsightsAndTrends')}</div>
            </button>

            <button
              onClick={() => setModalState(prev => ({ ...prev, showCheckupScheduling: true }))}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-xl font-semibold transition-all hover:from-blue-700 hover:to-cyan-700 shadow-lg"
            >
              <div className="text-3xl mb-2">⏰</div>
              <div>{t('enhancedScheduling')}</div>
              <div className="text-sm text-blue-100 mt-1">{t('oneToFourHourIntervals')}</div>
            </button>
          </div>

          {/* Patient Management */}
          <div id="patient-management-section" className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>{t('patientManagement')}</h2>
              <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
                <button
                  onClick={exportPatientData}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  data-testid="button-export-csv"
                >
                  {t('exportCSV')}
                </button>
                <button
                  onClick={generateWeeklyReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  data-testid="button-weekly-report"
                >
                  {t('weeklyReport')}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <input
                type="text"
                placeholder={t('searchPatientsDots')}
                value={adminData.searchTerm}
                onChange={(e) => setAdminData(prev => ({ ...prev, searchTerm: e.target.value }))}
                className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <select
                value={adminData.filterStatus}
                onChange={(e) => setAdminData(prev => ({ ...prev, filterStatus: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('allStatus')}</option>
                <option value="normal">{t('normalStatus')}</option>
                <option value="critical">{t('critical')}</option>
                <option value="attention">{t('attention')}</option>
              </select>
              <select
                value={adminData.filterHospital}
                onChange={(e) => setAdminData(prev => ({ ...prev, filterHospital: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('allHospitals')}</option>
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
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('patient')}</th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('patientId')}</th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('dateOfBirth')}</th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('status')}</th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('lastActivity')}</th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('vitals')}</th>
                    <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t('actions')}</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.dateOfBirth ? 
                          new Date(patient.dateOfBirth).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          t('notSpecified')
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                          patient.status === 'Attention' ? 'bg-yellow-100 text-yellow-800' :
                          patient.status === 'Normal' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.status === 'Normal' ? t('normalStatus') : 
                           patient.status === 'Critical' ? t('critical') : 
                           patient.status === 'Attention' ? t('attention') : 
                           patient.status === 'No Data' ? t('noData') : 
                           patient.status}
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
                          t('noRecentData')
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded border border-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setModalState(prev => ({ ...prev, showViewPatient: true }));
                            }}
                            data-testid={`button-view-patient-${patient.id}`}
                          >
                            {t('viewAction')}
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900 px-3 py-1 rounded border border-green-600 hover:bg-green-50"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setModalState(prev => ({ ...prev, showEditPatient: true }));
                            }}
                            data-testid={`button-edit-patient-${patient.id}`}
                          >
                            {t('editAction')}
                          </button>
                          <button 
                            className={`px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
                              patient.isActive 
                                ? 'text-orange-600 hover:text-orange-900 border-orange-600 hover:bg-orange-50' 
                                : 'text-green-600 hover:text-green-900 border-green-600 hover:bg-green-50'
                            }`}
                            onClick={async () => {
                              const actionText = patient.isActive ? 'deactivate' : 'activate';
                              const statusText = patient.isActive ? 'inactive' : 'active';
                              
                              if (confirm(`Are you sure you want to ${actionText} patient ${patient.firstName} ${patient.lastName} (${patient.patientId})?`)) {
                                try {
                                  const button = document.querySelector(`[data-testid="button-toggle-status-${patient.id}"]`) as HTMLButtonElement;
                                  if (button) button.disabled = true;
                                  
                                  const response = await fetch(`/api/users/${patient.id}/toggle-status`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json'
                                    }
                                  });

                                  if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.message || 'Failed to update patient status');
                                  }

                                  const result = await response.json();
                                  
                                  // Update the frontend state with the new status
                                  setAdminData(prev => ({
                                    ...prev,
                                    patients: prev.patients.map(p => 
                                      p.id === patient.id 
                                        ? { ...p, isActive: result.updatedUser.isActive }
                                        : p
                                    )
                                  }));
                                  
                                  alert(`Patient ${result.updatedUser.firstName} ${result.updatedUser.lastName} has been set to ${statusText}.`);
                                } catch (error) {
                                  console.error('Error updating patient status:', error);
                                  alert(`Error: ${error instanceof Error ? error.message : 'Failed to update patient status'}. Please try again.`);
                                } finally {
                                  const button = document.querySelector(`[data-testid="button-toggle-status-${patient.id}"]`) as HTMLButtonElement;
                                  if (button) button.disabled = false;
                                }
                              }
                            }}
                            data-testid={`button-toggle-status-${patient.id}`}
                          >
                            {patient.isActive ? t('deactivate') : t('activate')}
                          </button>
                        </div>
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


        {/* View Patient Details Dialog */}
        {modalState.showViewPatient && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h2 className="text-2xl font-bold">{t('patientDetails')}</h2>
                    <p className="text-blue-100">{t('completePatientInfo')}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setModalState(prev => ({ ...prev, showViewPatient: false }));
                      setSelectedPatient(null);
                    }}
                    className="text-white hover:text-gray-200 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
                    data-testid="button-close-view"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Patient Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Personal Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
                        {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                        <p className="text-blue-600 font-semibold">ID: {selectedPatient.patientId}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('emailAddress')}</label>
                        <p className="text-gray-800">{selectedPatient.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('dateOfBirth')}</label>
                        <p className="text-gray-800">
                          {selectedPatient.dateOfBirth ? 
                            new Date(selectedPatient.dateOfBirth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 
                            'Not specified'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('age')}</label>
                        <p className="text-gray-800">{selectedPatient.age} {t('yearsOld')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm mr-2">✓</span>
                      {t('currentStatus')}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('healthStatus')}</label>
                        <div className="mt-1">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            selectedPatient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                            selectedPatient.status === 'Attention' ? 'bg-yellow-100 text-yellow-800' :
                            selectedPatient.status === 'Normal' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedPatient.status === 'Normal' ? t('normalStatus') : 
                             selectedPatient.status === 'Critical' ? t('critical') : 
                             selectedPatient.status === 'Attention' ? t('attention') : 
                             selectedPatient.status === 'No Data' ? t('noData') : 
                             selectedPatient.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('lastActivity')}</label>
                        <p className="text-gray-800">{selectedPatient.lastActivity}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('hospitalAffiliation')}</label>
                        <p className="text-gray-800">
                          {hospitals.find(h => h.id === (selectedPatient as any).hospitalId)?.name || t('notAssigned')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-2">📧</span>
                      {t('contactAccess')}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('registrationStatus')}</label>
                        <div className="mt-1">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            (selectedPatient as any).isVerified ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {(selectedPatient as any).isVerified ? t('verified') : t('pendingVerification')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('mobileNumber')}</label>
                        <p className="text-gray-800">{(selectedPatient as any).mobileNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">{t('portalAccess')}</label>
                        <p className="text-gray-800">{t('healthcareDashboardEnabled')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Vital Signs */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-lg mr-3">💓</span>
                    {t('currentVitalSigns')}
                  </h3>
                  {selectedPatient.vitals ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedPatient.vitals.heartRate}</div>
                          <div className="text-sm text-gray-600">{t('heartRateBPM')}</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedPatient.vitals.bloodPressure}</div>
                          <div className="text-sm text-gray-600">{t('bloodPressure')}</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{selectedPatient.vitals.temperature}°C</div>
                          <div className="text-sm text-gray-600">{t('temperature')}</div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{selectedPatient.vitals.oxygenLevel}%</div>
                          <div className="text-sm text-gray-600">{t('bloodOxygen')}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl text-gray-400">📊</span>
                      </div>
                      <p className="text-gray-500 text-lg">No recent vital signs data available</p>
                      <p className="text-gray-400 text-sm">Connect HC03 device or manually record measurements</p>
                    </div>
                  )}
                </div>

                {/* Medical Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Health Overview */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm mr-2">📋</span>
                      {t('healthOverview')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Health Score</span>
                        <span className="font-semibold text-green-600">Good</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Risk Level</span>
                        <span className="font-semibold text-yellow-600">
                          {selectedPatient.status === 'Critical' ? 'High' :
                           selectedPatient.status === 'Attention' ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Monitoring Status</span>
                        <span className="font-semibold text-blue-600">Active</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Data Collection</span>
                        <span className="font-semibold text-green-600">Real-time</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-2">🕒</span>
                      {t('recentActivity')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 text-sm">📊</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Vital signs recorded</p>
                          <p className="text-xs text-gray-600">{selectedPatient.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 text-sm">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Health status updated</p>
                          <p className="text-xs text-gray-600">Status: {selectedPatient.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-purple-600 text-sm">🔗</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Device connectivity</p>
                          <p className="text-xs text-gray-600">HC03 device synchronized</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setModalState(prev => ({ ...prev, showViewPatient: false, showEditPatient: true }));
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    data-testid="button-edit-from-view"
                  >
                    {t('editPatient')}
                  </button>
                  <button
                    onClick={() => {
                      setModalState(prev => ({ ...prev, showViewPatient: false }));
                      setSelectedPatient(null);
                    }}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    data-testid="button-close-view-modal"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Patient Dialog */}
        {modalState.showEditPatient && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('editPatient')}</h2>
                <button 
                  onClick={() => {
                    setModalState(prev => ({ ...prev, showEditPatient: false }));
                    setSelectedPatient(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="button-close-edit"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const updatedPatient = {
                  ...selectedPatient,
                  firstName: formData.get('firstName') as string,
                  lastName: formData.get('lastName') as string,
                  email: formData.get('email') as string,
                  dateOfBirth: formData.get('dateOfBirth') as string,
                  status: formData.get('status') as string,
                };
                
                // Update patient in the list
                setAdminData(prev => ({
                  ...prev,
                  patients: prev.patients.map(p => 
                    p.id === selectedPatient.id ? updatedPatient : p
                  )
                }));
                
                // Close dialog
                setModalState(prev => ({ ...prev, showEditPatient: false }));
                setSelectedPatient(null);
                
                alert(`Patient ${updatedPatient.firstName} ${updatedPatient.lastName} updated successfully!`);
              }} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')}</label>
                    <input 
                      type="text" 
                      name="firstName"
                      defaultValue={selectedPatient.firstName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')}</label>
                    <input 
                      type="text" 
                      name="lastName"
                      defaultValue={selectedPatient.lastName}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input 
                    type="email" 
                    name="email"
                    defaultValue={selectedPatient.email}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dateOfBirth')}</label>
                  <input 
                    type="date" 
                    name="dateOfBirth"
                    defaultValue={selectedPatient.dateOfBirth || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('status')}</label>
                  <select 
                    name="status"
                    defaultValue={selectedPatient.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Normal">{t('normalStatus')}</option>
                    <option value="Attention">{t('attention')}</option>
                    <option value="Critical">{t('critical')}</option>
                    <option value="No Data">{t('noData')}</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setModalState(prev => ({ ...prev, showEditPatient: false }));
                      setSelectedPatient(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    data-testid="button-cancel-edit"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    data-testid="button-save-patient"
                  >
                    {t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.view === 'patient' && state.user) {
    return (
      <EnhancedPatientDashboard 
        userId={state.user.id} 
        onLogout={() => setState({ view: 'login', user: null, loading: false, error: '' })}
      />
    );
  }

  if (false) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Patient Dashboard</h1>
                <p className="text-green-100">Welcome, {state.user?.firstName} {state.user?.lastName}</p>
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
                <div className="text-3xl font-bold mb-2">{patientData.vitals?.heartRate || 'N/A'}</div>
                <div className="text-blue-100 text-sm">Heart Rate (BPM)</div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals?.bloodPressure || 'N/A'}</div>
                <div className="text-green-100 text-sm">Blood Pressure</div>
              </div>

              <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals?.temperature || 'N/A'}°C</div>
                <div className="text-pink-100 text-sm">Temperature</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-violet-400 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-3xl font-bold mb-2">{patientData.vitals?.oxygenLevel || 'N/A'}%</div>
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

export default function ComprehensiveHealthcareApp() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}