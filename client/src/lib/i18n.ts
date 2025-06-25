// Internationalization support for Arabic and English
export type Language = 'en' | 'ar';

export interface Translation {
  // Navigation
  home: string;
  dashboard: string;
  patients: string;
  analytics: string;
  devices: string;
  reports: string;
  settings: string;
  logout: string;
  
  // Authentication
  login: string;
  email: string;
  password: string;
  signIn: string;
  signUp: string;
  register: string;
  firstName: string;
  middleName: string;
  lastName: string;
  mobileNumber: string;
  patientId: string;
  hospital: string;
  dateOfBirth: string;
  createAccount: string;
  alreadyHaveAccount: string;
  forgotPassword: string;
  
  // Dashboard
  welcomeBack: string;
  totalPatients: string;
  activeAlerts: string;
  connectedDevices: string;
  systemStatus: string;
  online: string;
  offline: string;
  
  // Patient Management
  patientManagement: string;
  addPatient: string;
  searchPatients: string;
  viewPatient: string;
  editPatient: string;
  deletePatient: string;
  patientDetails: string;
  fullName: string;
  contactInfo: string;
  status: string;
  active: string;
  inactive: string;
  registrationDate: string;
  lastActivity: string;
  
  // Vital Signs
  vitalSigns: string;
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  oxygenLevel: string;
  bloodGlucose: string;
  ecg: string;
  normal: string;
  elevated: string;
  high: string;
  critical: string;
  
  // HC03 Devices
  bluetoothDevices: string;
  deviceConnection: string;
  connected: string;
  disconnected: string;
  batteryLevel: string;
  signalStrength: string;
  addDevice: string;
  connectDevice: string;
  disconnectDevice: string;
  deviceStatus: string;
  
  // Alerts & Notifications
  alerts: string;
  criticalAlert: string;
  lowBattery: string;
  deviceOffline: string;
  abnormalVitals: string;
  emergencyContact: string;
  
  // Reports
  weeklyReport: string;
  exportReport: string;
  generateReport: string;
  reportSummary: string;
  
  // Common Actions
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  view: string;
  close: string;
  refresh: string;
  loading: string;
  search: string;
  filter: string;
  
  // Time & Date
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  lastWeek: string;
  lastMonth: string;
  
  // Healthcare Specific
  medicalHistory: string;
  allergies: string;
  medications: string;
  checkupSchedule: string;
  nextAppointment: string;
  doctorNotes: string;
  healthTrends: string;
  complianceRate: string;
  
  // Validation Messages
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  passwordTooShort: string;
  passwordsNotMatch: string;
  
  // Success/Error Messages
  success: string;
  error: string;
  saved: string;
  deleted: string;
  updated: string;
  connectionEstablished: string;
  connectionFailed: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    patients: 'Patients',
    analytics: 'Analytics',
    devices: 'Devices',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    
    // Authentication
    login: 'Login',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    register: 'Register',
    firstName: 'First Name',
    middleName: 'Middle Name',
    lastName: 'Last Name',
    mobileNumber: 'Mobile Number',
    patientId: 'Patient ID',
    hospital: 'Hospital',
    dateOfBirth: 'Date of Birth',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    forgotPassword: 'Forgot Password?',
    
    // Dashboard
    welcomeBack: 'Welcome Back',
    totalPatients: 'Total Patients',
    activeAlerts: 'Active Alerts',
    connectedDevices: 'Connected Devices',
    systemStatus: 'System Status',
    online: 'Online',
    offline: 'Offline',
    
    // Patient Management
    patientManagement: 'Patient Management',
    addPatient: 'Add Patient',
    searchPatients: 'Search Patients',
    viewPatient: 'View Patient',
    editPatient: 'Edit Patient',
    deletePatient: 'Delete Patient',
    patientDetails: 'Patient Details',
    fullName: 'Full Name',
    contactInfo: 'Contact Information',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    registrationDate: 'Registration Date',
    lastActivity: 'Last Activity',
    
    // Vital Signs
    vitalSigns: 'Vital Signs',
    heartRate: 'Heart Rate',
    bloodPressure: 'Blood Pressure',
    temperature: 'Temperature',
    oxygenLevel: 'Oxygen Level',
    bloodGlucose: 'Blood Glucose',
    ecg: 'ECG',
    normal: 'Normal',
    elevated: 'Elevated',
    high: 'High',
    critical: 'Critical',
    
    // HC03 Devices
    bluetoothDevices: 'Bluetooth Devices',
    deviceConnection: 'Device Connection',
    connected: 'Connected',
    disconnected: 'Disconnected',
    batteryLevel: 'Battery Level',
    signalStrength: 'Signal Strength',
    addDevice: 'Add Device',
    connectDevice: 'Connect Device',
    disconnectDevice: 'Disconnect Device',
    deviceStatus: 'Device Status',
    
    // Alerts & Notifications
    alerts: 'Alerts',
    criticalAlert: 'Critical Alert',
    lowBattery: 'Low Battery',
    deviceOffline: 'Device Offline',
    abnormalVitals: 'Abnormal Vitals',
    emergencyContact: 'Emergency Contact',
    
    // Reports
    weeklyReport: 'Weekly Report',
    exportReport: 'Export Report',
    generateReport: 'Generate Report',
    reportSummary: 'Report Summary',
    
    // Common Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    refresh: 'Refresh',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    
    // Time & Date
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    
    // Healthcare Specific
    medicalHistory: 'Medical History',
    allergies: 'Allergies',
    medications: 'Medications',
    checkupSchedule: 'Checkup Schedule',
    nextAppointment: 'Next Appointment',
    doctorNotes: 'Doctor Notes',
    healthTrends: 'Health Trends',
    complianceRate: 'Compliance Rate',
    
    // Validation Messages
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsNotMatch: 'Passwords do not match',
    
    // Success/Error Messages
    success: 'Success',
    error: 'Error',
    saved: 'Saved successfully',
    deleted: 'Deleted successfully',
    updated: 'Updated successfully',
    connectionEstablished: 'Connection established',
    connectionFailed: 'Connection failed',
  },
  ar: {
    // Navigation
    home: 'الرئيسية',
    dashboard: 'لوحة القيادة',
    patients: 'المرضى',
    analytics: 'التحليلات',
    devices: 'الأجهزة',
    reports: 'التقارير',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Authentication
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    register: 'تسجيل',
    firstName: 'الاسم الأول',
    middleName: 'الاسم الأوسط',
    lastName: 'اسم العائلة',
    mobileNumber: 'رقم الهاتف المحمول',
    patientId: 'رقم المريض',
    hospital: 'المستشفى',
    dateOfBirth: 'تاريخ الميلاد',
    createAccount: 'إنشاء حساب',
    alreadyHaveAccount: 'هل لديك حساب بالفعل؟',
    forgotPassword: 'نسيت كلمة المرور؟',
    
    // Dashboard
    welcomeBack: 'مرحباً بعودتك',
    totalPatients: 'إجمالي المرضى',
    activeAlerts: 'التنبيهات النشطة',
    connectedDevices: 'الأجهزة المتصلة',
    systemStatus: 'حالة النظام',
    online: 'متصل',
    offline: 'غير متصل',
    
    // Patient Management
    patientManagement: 'إدارة المرضى',
    addPatient: 'إضافة مريض',
    searchPatients: 'البحث عن المرضى',
    viewPatient: 'عرض المريض',
    editPatient: 'تعديل المريض',
    deletePatient: 'حذف المريض',
    patientDetails: 'تفاصيل المريض',
    fullName: 'الاسم الكامل',
    contactInfo: 'معلومات الاتصال',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    registrationDate: 'تاريخ التسجيل',
    lastActivity: 'آخر نشاط',
    
    // Vital Signs
    vitalSigns: 'العلامات الحيوية',
    heartRate: 'معدل ضربات القلب',
    bloodPressure: 'ضغط الدم',
    temperature: 'درجة الحرارة',
    oxygenLevel: 'مستوى الأكسجين',
    bloodGlucose: 'جلوكوز الدم',
    ecg: 'تخطيط القلب',
    normal: 'طبيعي',
    elevated: 'مرتفع',
    high: 'عالي',
    critical: 'حرج',
    
    // HC03 Devices
    bluetoothDevices: 'أجهزة البلوتوث',
    deviceConnection: 'اتصال الجهاز',
    connected: 'متصل',
    disconnected: 'منقطع',
    batteryLevel: 'مستوى البطارية',
    signalStrength: 'قوة الإشارة',
    addDevice: 'إضافة جهاز',
    connectDevice: 'ربط الجهاز',
    disconnectDevice: 'قطع الاتصال',
    deviceStatus: 'حالة الجهاز',
    
    // Alerts & Notifications
    alerts: 'التنبيهات',
    criticalAlert: 'تنبيه حرج',
    lowBattery: 'بطارية منخفضة',
    deviceOffline: 'الجهاز غير متصل',
    abnormalVitals: 'علامات حيوية غير طبيعية',
    emergencyContact: 'جهة اتصال الطوارئ',
    
    // Reports
    weeklyReport: 'التقرير الأسبوعي',
    exportReport: 'تصدير التقرير',
    generateReport: 'إنشاء تقرير',
    reportSummary: 'ملخص التقرير',
    
    // Common Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    close: 'إغلاق',
    refresh: 'تحديث',
    loading: 'جاري التحميل...',
    search: 'بحث',
    filter: 'تصفية',
    
    // Time & Date
    today: 'اليوم',
    yesterday: 'أمس',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    lastWeek: 'الأسبوع الماضي',
    lastMonth: 'الشهر الماضي',
    
    // Healthcare Specific
    medicalHistory: 'التاريخ الطبي',
    allergies: 'الحساسية',
    medications: 'الأدوية',
    checkupSchedule: 'جدول الفحوصات',
    nextAppointment: 'الموعد القادم',
    doctorNotes: 'ملاحظات الطبيب',
    healthTrends: 'اتجاهات الصحة',
    complianceRate: 'معدل الالتزام',
    
    // Validation Messages
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    invalidPhone: 'يرجى إدخال رقم هاتف صحيح',
    passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    passwordsNotMatch: 'كلمات المرور غير متطابقة',
    
    // Success/Error Messages
    success: 'نجح',
    error: 'خطأ',
    saved: 'تم الحفظ بنجاح',
    deleted: 'تم الحذف بنجاح',
    updated: 'تم التحديث بنجاح',
    connectionEstablished: 'تم تأسيس الاتصال',
    connectionFailed: 'فشل الاتصال',
  }
};

// Language context and hooks
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translation) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add/remove RTL class for Tailwind CSS
    if (language === 'ar') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: keyof Translation): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language switcher component
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ar')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'ar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        العربية
      </button>
    </div>
  );
}