import { useState, createContext, useContext } from 'react';

type Lang = 'en' | 'ar';

const translations = {
  en: {
    appTitle: '24/7 Tele H',
    appSubtitle: 'Healthcare Monitoring',
    patientLogin: 'Patient Login',
    adminLogin: 'Admin Login',
    emailOrPatientId: 'Email or Patient ID',
    password: 'Password',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    forgotPassword: 'Forgot Password?',
    dashboard: 'Dashboard',
    vitals: 'Vitals',
    history: 'History',
    devices: 'Devices',
    profile: 'Profile',
    heartRate: 'Heart Rate',
    bloodPressure: 'Blood Pressure',
    temperature: 'Temperature',
    oxygenLevel: 'Oxygen Level',
    bloodGlucose: 'Blood Glucose',
    ecg: 'ECG',
    normal: 'Normal',
    high: 'High',
    low: 'Low',
    elevated: 'Elevated',
    connect: 'Connect Device',
    disconnect: 'Disconnect',
    scanning: 'Scanning...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    measure: 'Start Measurement',
    stopMeasure: 'Stop Measurement',
    bluetooth: 'Bluetooth',
    noDevice: 'No device connected',
    healthScore: 'Health Score',
    nextAppointment: 'Next Appointment',
    lastCheckup: 'Last Checkup',
    alerts: 'Alerts',
    noAlerts: 'No active alerts',
    welcome: 'Welcome',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    patients: 'Patients',
    totalPatients: 'Total Patients',
    activeAlerts: 'Active Alerts',
    compliance: 'Compliance Rate',
    bpm: 'bpm',
    mmHg: 'mmHg',
    celsius: '°C',
    percent: '%',
    mgdl: 'mg/dL',
  },
  ar: {
    appTitle: '24/7 تيلي إتش',
    appSubtitle: 'مراقبة الرعاية الصحية',
    patientLogin: 'تسجيل دخول المريض',
    adminLogin: 'تسجيل دخول المسؤول',
    emailOrPatientId: 'البريد الإلكتروني أو رقم المريض',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    register: 'تسجيل',
    forgotPassword: 'نسيت كلمة المرور؟',
    dashboard: 'لوحة التحكم',
    vitals: 'العلامات الحيوية',
    history: 'السجل',
    devices: 'الأجهزة',
    profile: 'الملف الشخصي',
    heartRate: 'معدل ضربات القلب',
    bloodPressure: 'ضغط الدم',
    temperature: 'درجة الحرارة',
    oxygenLevel: 'مستوى الأكسجين',
    bloodGlucose: 'سكر الدم',
    ecg: 'رسم القلب',
    normal: 'طبيعي',
    high: 'مرتفع',
    low: 'منخفض',
    elevated: 'مرتفع قليلاً',
    connect: 'توصيل الجهاز',
    disconnect: 'قطع الاتصال',
    scanning: 'جاري البحث...',
    connected: 'متصل',
    disconnected: 'غير متصل',
    measure: 'بدء القياس',
    stopMeasure: 'إيقاف القياس',
    bluetooth: 'بلوتوث',
    noDevice: 'لا يوجد جهاز متصل',
    healthScore: 'نقاط الصحة',
    nextAppointment: 'الموعد القادم',
    lastCheckup: 'آخر فحص',
    alerts: 'التنبيهات',
    noAlerts: 'لا توجد تنبيهات نشطة',
    welcome: 'مرحباً',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    retry: 'إعادة المحاولة',
    save: 'حفظ',
    cancel: 'إلغاء',
    patients: 'المرضى',
    totalPatients: 'إجمالي المرضى',
    activeAlerts: 'التنبيهات النشطة',
    compliance: 'معدل الامتثال',
    bpm: 'نبضة/دقيقة',
    mmHg: 'ملم زئبق',
    celsius: '°م',
    percent: '%',
    mgdl: 'ملغ/ديسيلتر',
  },
};

export type TranslationKey = keyof typeof translations.en;

let currentLang: Lang = 'en';
const listeners: Array<() => void> = [];

export function setLanguage(lang: Lang) {
  currentLang = lang;
  listeners.forEach((l) => l());
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: TranslationKey): string {
  return translations[currentLang][key] ?? key;
}

export function isRTL(): boolean {
  return currentLang === 'ar';
}
