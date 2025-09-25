import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  
  // App Info
  appTitle: string;
  appSubtitle: string;
  
  // Login Form
  patientLogin: string;
  emailOrPatientId: string;
  enterEmailOrPatientId: string;
  enterPassword: string;
  rememberMe: string;
  signingIn: string;
  
  // Signup Form
  healthcareMonitoringRegistration: string;
  patientRegistration: string;
  
  // ECG Dashboard - Vital Statistics
  breathsPerMin: string;
  stressLevel: string;
  moodIndex: string;
  
  // ECG Dashboard - Detailed Metrics
  heartRateVariability: string;
  rmssd: string;
  pnn50: string;
  sdnn: string;
  averageRR: string;
  hrRange: string;
  ecgIntervals: string;
  qrsWidth: string;
  qtInterval: string;
  prInterval: string;
  stElevation: string;
  cardiacRhythm: string;
  statusAndAlerts: string;
  moodCategory: string;
  contactQuality: string;
  arrhythmia: string;
  signalStrength: string;
  recordingStatus: string;
  active: string;
  standby: string;
  
  // Status Values
  balance: string;
  poor: string;
  none: string;
  detected: string;
  wide: string;
  yes: string;
  no: string;
  abnormal: string;
  
  // Analysis Sections
  rhythmAnalysis: string;
  dominantRhythm: string;
  pWavePresent: string;
  qrsMorphology: string;
  axisDeviation: string;
  clinicalInterpretation: string;
  overallAssessment: string;
  urgencyLevel: string;
  followupRequired: string;
  riskStratification: string;
  high: string;
  low: string;
  moderate: string;
  highRisk: string;
  lowRisk: string;
  criticalEcgFindings: string;
  
  // Blood Glucose Monitor
  bloodGlucoseMonitor: string;
  startTest: string;
  measuring: string;
  noGlucoseReadings: string;
  startMeasurementToSeeData: string;
  latestReading: string;
  recentReadings: string;
  noReadings: string;
  prediabetic: string;
  
  // Device Battery Status
  deviceBattery: string;
  deviceBatteryStatus: string;
  devices: string;
  noDevicesFound: string;
  connectHC03Devices: string;
  lowest: string;
  charging: string;
  critical: string;
  full: string;
  good: string;
  startCharging: string;
  stopCharging: string;
  
  // Device Names
  glucoseMonitor: string;
  bloodPressureMonitor: string;
  ecgMonitor: string;
  
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
  
  // HC03 Device Specific
  scanningForDevices: string;
  startMeasurement: string;
  stopMeasurement: string;
  measurementStarted: string;
  measurementCompleted: string;
  measurementInProgress: string;
  placeFinger: string;
  removeFingerAndWait: string;
  deviceBatteryLow: string;
  syncNow: string;
  viewDetails: string;
  viewHistory: string;
  exportData: string;
  chargingStatus: string;
  firmwareVersion: string;
  macAddress: string;
  lastSync: string;
  
  // Measurement Types
  ecgMeasurement: string;
  bloodOxygenMeasurement: string;
  bloodPressureMeasurement: string;
  temperatureMeasurement: string;
  bloodGlucoseMeasurement: string;
  batteryStatus: string;
  
  // Status Labels
  scanning: string;
  connecting: string;
  ready: string;
  measuring: string;
  complete: string;
  failed: string;
  
  // Mood Index Terms (HC03 specific)
  chill: string;
  relax: string;
  balance: string;
  excitation: string;
  excitementAnxiety: string;
  
  // Blood Pressure Specific
  systolic: string;
  diastolic: string;
  
  // Blood Glucose Specific
  fasting: string;
  postMeal: string;
  random: string;
  bedtime: string;
  
  // Data Headers
  patientName: string;
  deviceName: string;
  lastMeasurement: string;
  measurementCount: string;
  
  // Units
  bpm: string; // beats per minute
  mmhg: string; // mmHg
  celsius: string; // °C
  percentage: string; // %
  mgdl: string; // mg/dL
  
  // Additional Missing Keys
  unknown: string;
  ecgAnalysisReport: string;
  detailedEcgAnalysis: string;
  backToDashboard: string;
  healthMonitoring: string;
  realtimeVitalSigns: string;
  ecgMonitor: string;
  contact: string;
  noContact: string;
  start: string;
  stop: string;
  export: string;
  share: string;
  history: string;
  from: string;
  to: string;
  
  // Health Monitor Modals
  heartRateMonitor: string;
  temperatureMonitor: string;
  bloodOxygenMonitor: string;
  realtimeMonitoring: string;
  currentReading: string;
  hourTrend24: string;
  temperatureRanges: string;
  healthTips: string;
  
  // Temperature Classifications
  hypothermia: string;
  mildFever: string;
  fever: string;
  highFever: string;
  hyperthermia: string;
  
  // Health Tips
  heartRateHealthTip: string;
  bloodPressureHealthTip: string;
  temperatureHealthTip: string;
  oxygenLevelHealthTip: string;
  
  // Additional Status Labels
  warning: string;
  attention: string;
  
  // Table Headers
  dateTime: string;
  oxygen: string;
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
    
    // App Info
    appTitle: '24/7 Tele H Technology Services',
    appSubtitle: 'Healthcare Monitoring Portal',
    
    // Login Form
    patientLogin: 'Patient Login',
    emailOrPatientId: 'Email Address or Patient ID',
    enterEmailOrPatientId: 'Enter email or patient ID',
    enterPassword: 'Enter your password',
    rememberMe: 'Remember me',
    signingIn: 'Signing in...',
    
    // Signup Form
    healthcareMonitoringRegistration: 'Healthcare Monitoring Registration',
    patientRegistration: 'Patient Registration',
    
    // ECG Dashboard - Vital Statistics
    breathsPerMin: 'Breaths/min',
    stressLevel: 'Stress Level',
    moodIndex: 'Mood Index',
    
    // ECG Dashboard - Detailed Metrics
    heartRateVariability: 'Heart Rate Variability',
    rmssd: 'RMSSD',
    pnn50: 'pNN50',
    sdnn: 'SDNN',
    averageRR: 'Average RR',
    hrRange: 'HR Range',
    ecgIntervals: 'ECG Intervals',
    qrsWidth: 'QRS Width',
    qtInterval: 'QT Interval',
    prInterval: 'PR Interval',
    stElevation: 'ST Elevation',
    cardiacRhythm: 'Cardiac Rhythm',
    statusAndAlerts: 'Status & Alerts',
    moodCategory: 'Mood Category',
    contactQuality: 'Contact Quality',
    arrhythmia: 'Arrhythmia',
    signalStrength: 'Signal Strength',
    recordingStatus: 'Recording Status',
    active: 'Active',
    standby: 'Standby',
    
    // Status Values
    balance: 'Balance',
    poor: 'poor',
    none: 'None',
    detected: 'Detected',
    wide: 'Wide',
    yes: 'Yes',
    no: 'No',
    abnormal: 'Abnormal',
    
    // Analysis Sections
    rhythmAnalysis: 'Rhythm Analysis',
    dominantRhythm: 'Dominant Rhythm',
    pWavePresent: 'P-Wave Present',
    qrsMorphology: 'QRS Morphology',
    axisDeviation: 'Axis Deviation',
    clinicalInterpretation: 'Clinical Interpretation',
    overallAssessment: 'Overall Assessment',
    urgencyLevel: 'Urgency Level',
    followupRequired: 'Follow-up Required',
    riskStratification: 'Risk Stratification',
    high: 'High',
    low: 'Low',
    moderate: 'Moderate',
    highRisk: 'High Risk',
    lowRisk: 'Low Risk',
    criticalEcgFindings: 'Critical ECG Findings',
    
    // Blood Glucose Monitor
    bloodGlucoseMonitor: 'Blood Glucose Monitor',
    startTest: 'Start Test',
    measuring: 'Measuring...',
    noGlucoseReadings: 'No glucose readings available',
    startMeasurementToSeeData: 'Start a measurement to see data',
    latestReading: 'Latest Reading',
    recentReadings: 'Recent Readings',
    noReadings: 'No readings',
    prediabetic: 'Prediabetic',
    
    // Device Battery Status
    deviceBattery: 'Device Battery',
    deviceBatteryStatus: 'Device Battery Status',
    devices: 'Devices',
    noDevicesFound: 'No devices found',
    connectHC03Devices: 'Connect HC03 devices to monitor battery status',
    lowest: 'Lowest',
    charging: 'Charging',
    critical: 'Critical',
    full: 'Full',
    good: 'Good',
    startCharging: 'Start Charging',
    stopCharging: 'Stop Charging',
    
    // Device Names
    glucoseMonitor: 'Glucose Monitor',
    bloodPressureMonitor: 'Blood Pressure',
    ecgMonitor: 'ECG Monitor',
    
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
    critical: 'Critical',
    
    // HC03 Devices
    bluetoothDevices: 'Bluetooth Devices',
    deviceConnection: 'Device Connection',
    connected: 'Connected',
    disconnected: 'Disconnected',
    batteryLevel: 'Battery Level',
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
    
    // HC03 Device Specific
    scanningForDevices: 'Scanning for devices...',
    startMeasurement: 'Start Measurement',
    stopMeasurement: 'Stop Measurement',
    measurementStarted: 'Measurement Started',
    measurementCompleted: 'Measurement Completed',
    measurementInProgress: 'Measurement in Progress',
    placeFinger: 'Please place your finger on the device sensor',
    removeFingerAndWait: 'Remove finger and wait',
    deviceBatteryLow: 'Device battery is low',
    syncNow: 'Sync Now',
    viewDetails: 'View Details',
    viewHistory: 'View History',
    exportData: 'Export Data',
    chargingStatus: 'Charging Status',
    firmwareVersion: 'Firmware Version',
    macAddress: 'MAC Address',
    lastSync: 'Last Sync',
    
    // Measurement Types
    ecgMeasurement: 'ECG Measurement',
    bloodOxygenMeasurement: 'Blood Oxygen Measurement',
    bloodPressureMeasurement: 'Blood Pressure Measurement',
    temperatureMeasurement: 'Temperature Measurement',
    bloodGlucoseMeasurement: 'Blood Glucose Measurement',
    batteryStatus: 'Battery Status',
    
    // Status Labels
    scanning: 'Scanning',
    connecting: 'Connecting',
    ready: 'Ready',
    measuring: 'Measuring',
    complete: 'Complete',
    failed: 'Failed',
    
    // Mood Index Terms (HC03 specific)
    chill: 'Chill',
    relax: 'Relax',
    excitation: 'Excitation',
    excitementAnxiety: 'Excitement/Anxiety',
    
    // Blood Pressure Specific
    systolic: 'Systolic',
    diastolic: 'Diastolic',
    
    // Blood Glucose Specific
    fasting: 'Fasting',
    postMeal: 'Post-Meal',
    random: 'Random',
    bedtime: 'Bedtime',
    
    // Data Headers
    patientName: 'Patient Name',
    deviceName: 'Device Name',
    lastMeasurement: 'Last Measurement',
    measurementCount: 'Measurement Count',
    
    // Units
    bpm: 'bpm',
    mmhg: 'mmHg',
    celsius: '°C',
    percentage: '%',
    mgdl: 'mg/dL',
    
    // Additional Missing Keys
    unknown: 'Unknown',
    ecgAnalysisReport: 'ECG Analysis Report',
    detailedEcgAnalysis: 'Detailed ECG analysis and medical interpretation',
    backToDashboard: 'Back to Dashboard',
    healthMonitoring: 'Health Monitoring',
    realtimeVitalSigns: 'Real-time vital signs from HC03 devices',
    ecgMonitor: 'ECG Monitor',
    contact: 'Contact',
    noContact: 'No Contact',
    start: 'Start',
    stop: 'Stop',
    export: 'Export',
    share: 'Share',
    history: 'History',
    from: 'From',
    to: 'To',
    
    // Health Monitor Modals
    heartRateMonitor: 'Heart Rate Monitor',
    temperatureMonitor: 'Temperature Monitor',
    bloodOxygenMonitor: 'Blood Oxygen Monitor',
    realtimeMonitoring: 'Real-time monitoring with 24-hour trends',
    currentReading: 'Current Reading',
    hourTrend24: '24-Hour Trend',
    temperatureRanges: 'Temperature Ranges',
    healthTips: 'Health Tips',
    
    // Temperature Classifications
    hypothermia: 'Hypothermia',
    mildFever: 'Mild Fever',
    fever: 'Fever',
    highFever: 'High Fever',
    hyperthermia: 'Hyperthermia',
    
    // Health Tips
    heartRateHealthTip: 'Maintain a healthy heart rate through regular exercise, stress management, and adequate sleep. Normal resting heart rate is 60-100 bpm.',
    bloodPressureHealthTip: 'Keep blood pressure in check with a balanced diet, regular exercise, limited sodium, and stress reduction. Normal BP is less than 120/80 mmHg.',
    temperatureHealthTip: 'Body temperature can vary throughout the day. Normal range is 36.1-37.2°C. Stay hydrated and dress appropriately for the weather.',
    oxygenLevelHealthTip: 'Maintain healthy oxygen levels with deep breathing exercises and good posture. Normal oxygen saturation is 95-100%.',
    
    // Additional Status Labels
    warning: 'Warning',
    attention: 'Attention',
    
    // Table Headers
    dateTime: 'Date & Time',
    oxygen: 'Oxygen',
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
    register: 'التسجيل',
    firstName: 'الاسم الأول',
    middleName: 'الاسم الأوسط',
    lastName: 'اسم العائلة',
    mobileNumber: 'رقم الهاتف',
    patientId: 'رقم المريض',
    hospital: 'المستشفى',
    dateOfBirth: 'تاريخ الميلاد',
    createAccount: 'إنشاء حساب',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    forgotPassword: 'نسيت كلمة المرور؟',
    
    // App Info
    appTitle: 'خدمات تكنولوجيا الصحة 24/7',
    appSubtitle: 'بوابة مراقبة الرعاية الصحية',
    
    // Login Form
    patientLogin: 'تسجيل دخول المريض',
    emailOrPatientId: 'عنوان البريد الإلكتروني أو رقم المريض',
    enterEmailOrPatientId: 'أدخل البريد الإلكتروني أو رقم المريض',
    enterPassword: 'أدخل كلمة المرور',
    rememberMe: 'تذكرني',
    signingIn: 'جارٍ تسجيل الدخول...',
    
    // Signup Form
    healthcareMonitoringRegistration: 'تسجيل مراقبة الرعاية الصحية',
    patientRegistration: 'تسجيل المريض',
    
    // ECG Dashboard - Vital Statistics
    breathsPerMin: 'نفس/الدقيقة',
    stressLevel: 'مستوى التوتر',
    moodIndex: 'مؤشر المزاج',
    
    // ECG Dashboard - Detailed Metrics
    heartRateVariability: 'تباين معدل ضربات القلب',
    rmssd: 'متوسط مربع الجذر',
    pnn50: 'نسبة التباين',
    sdnn: 'الانحراف المعياري',
    averageRR: 'متوسط RR',
    hrRange: 'نطاق معدل القلب',
    ecgIntervals: 'فترات تخطيط القلب',
    qrsWidth: 'عرض QRS',
    qtInterval: 'فترة QT',
    prInterval: 'فترة PR',
    stElevation: 'ارتفاع ST',
    cardiacRhythm: 'إيقاع القلب',
    statusAndAlerts: 'الحالة والتنبيهات',
    moodCategory: 'فئة المزاج',
    contactQuality: 'جودة الاتصال',
    arrhythmia: 'عدم انتظام ضربات القلب',
    signalStrength: 'قوة الإشارة',
    recordingStatus: 'حالة التسجيل',
    active: 'نشط',
    standby: 'في الانتظار',
    
    // Status Values
    balance: 'متوازن',
    poor: 'ضعيف',
    none: 'لا يوجد',
    detected: 'مكتشف',
    wide: 'عريض',
    yes: 'نعم',
    no: 'لا',
    abnormal: 'غير طبيعي',
    
    // Analysis Sections
    rhythmAnalysis: 'تحليل الإيقاع',
    dominantRhythm: 'الإيقاع المهيمن',
    pWavePresent: 'وجود موجة P',
    qrsMorphology: 'شكل QRS',
    axisDeviation: 'انحراف المحور',
    clinicalInterpretation: 'التفسير السريري',
    overallAssessment: 'التقييم العام',
    urgencyLevel: 'مستوى الإلحاح',
    followupRequired: 'المتابعة المطلوبة',
    riskStratification: 'تصنيف المخاطر',
    high: 'مرتفع',
    low: 'منخفض',
    moderate: 'متوسط',
    highRisk: 'عالي المخاطر',
    lowRisk: 'منخفض المخاطر',
    criticalEcgFindings: 'نتائج حرجة في تخطيط القلب',
    
    // Blood Glucose Monitor
    bloodGlucoseMonitor: 'مراقب الجلوكوز في الدم',
    startTest: 'بدء الاختبار',
    measuring: 'جاري القياس...',
    noGlucoseReadings: 'لا توجد قراءات للجلوكوز',
    startMeasurementToSeeData: 'ابدأ قياساً لرؤية البيانات',
    latestReading: 'آخر قراءة',
    recentReadings: 'القراءات الحديثة',
    noReadings: 'لا توجد قراءات',
    prediabetic: 'مقدمات السكري',
    
    // Device Battery Status
    deviceBattery: 'بطارية الجهاز',
    deviceBatteryStatus: 'حالة بطارية الجهاز',
    devices: 'الأجهزة',
    noDevicesFound: 'لم يتم العثور على أجهزة',
    connectHC03Devices: 'اربط أجهزة HC03 لمراقبة حالة البطارية',
    lowest: 'الأقل',
    charging: 'يشحن',
    critical: 'حرج',
    full: 'ممتلئة',
    good: 'جيدة',
    startCharging: 'بدء الشحن',
    stopCharging: 'إيقاف الشحن',
    
    // Device Names
    glucoseMonitor: 'مراقب الجلوكوز',
    bloodPressureMonitor: 'مراقب ضغط الدم',
    ecgMonitor: 'مراقب تخطيط القلب',
    
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
    inactive: 'غير نشط',
    registrationDate: 'تاريخ التسجيل',
    lastActivity: 'آخر نشاط',
    
    // Vital Signs
    vitalSigns: 'العلامات الحيوية',
    heartRate: 'معدل ضربات القلب',
    bloodPressure: 'ضغط الدم',
    temperature: 'درجة الحرارة',
    oxygenLevel: 'مستوى الأكسجين',
    bloodGlucose: 'الجلوكوز في الدم',
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
    addDevice: 'إضافة جهاز',
    connectDevice: 'ربط الجهاز',
    disconnectDevice: 'قطع الجهاز',
    deviceStatus: 'حالة الجهاز',
    
    // Alerts & Notifications
    alerts: 'التنبيهات',
    criticalAlert: 'تنبيه حرج',
    lowBattery: 'بطارية منخفضة',
    deviceOffline: 'الجهاز غير متصل',
    abnormalVitals: 'علامات حيوية غير طبيعية',
    emergencyContact: 'اتصال طارئ',
    
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
    
    // HC03 Device Specific
    scanningForDevices: 'البحث عن الأجهزة...',
    startMeasurement: 'بدء القياس',
    stopMeasurement: 'إيقاف القياس',
    measurementStarted: 'تم بدء القياس',
    measurementCompleted: 'تم الانتهاء من القياس',
    measurementInProgress: 'القياس قيد التقدم',
    placeFinger: 'يرجى وضع إصبعك على مستشعر الجهاز',
    removeFingerAndWait: 'قم بإزالة الإصبع والانتظار',
    deviceBatteryLow: 'بطارية الجهاز منخفضة',
    syncNow: 'مزامنة الآن',
    viewDetails: 'عرض التفاصيل',
    viewHistory: 'عرض التاريخ',
    exportData: 'تصدير البيانات',
    chargingStatus: 'حالة الشحن',
    firmwareVersion: 'إصدار البرنامج الثابت',
    macAddress: 'عنوان MAC',
    lastSync: 'آخر مزامنة',
    
    // Measurement Types
    ecgMeasurement: 'قياس تخطيط القلب',
    bloodOxygenMeasurement: 'قياس الأكسجين في الدم',
    bloodPressureMeasurement: 'قياس ضغط الدم',
    temperatureMeasurement: 'قياس درجة الحرارة',
    bloodGlucoseMeasurement: 'قياس الجلوكوز في الدم',
    batteryStatus: 'حالة البطارية',
    
    // Status Labels
    scanning: 'بحث',
    connecting: 'اتصال',
    ready: 'جاهز',
    measuring: 'قياس',
    complete: 'مكتمل',
    failed: 'فشل',
    
    // Mood Index Terms (HC03 specific)
    chill: 'هادئ',
    relax: 'استرخاء',
    balance: 'توازن',
    excitation: 'إثارة',
    excitementAnxiety: 'إثارة/قلق',
    
    // Blood Pressure Specific
    systolic: 'انقباضي',
    diastolic: 'انبساطي',
    
    // Blood Glucose Specific
    fasting: 'صيام',
    postMeal: 'بعد الوجبة',
    random: 'عشوائي',
    bedtime: 'وقت النوم',
    
    // Data Headers
    patientName: 'اسم المريض',
    deviceName: 'اسم الجهاز',
    lastMeasurement: 'آخر قياس',
    measurementCount: 'عدد القياسات',
    
    // Units
    bpm: 'نبضة/دقيقة',
    mmhg: 'ممHg',
    celsius: '°م',
    percentage: '%',
    mgdl: 'ملغ/دل',
    
    // Additional Missing Keys
    unknown: 'غير معروف',
    ecgAnalysisReport: 'تقرير تحليل تخطيط القلب',
    detailedEcgAnalysis: 'تحليل مفصل لتخطيط القلب والتفسير الطبي',
    backToDashboard: 'العودة إلى لوحة القيادة',
    healthMonitoring: 'مراقبة الصحة',
    realtimeVitalSigns: 'العلامات الحيوية في الوقت الفعلي من أجهزة HC03',
    ecgMonitor: 'مراقب تخطيط القلب',
    contact: 'متصل',
    noContact: 'غير متصل',
    start: 'بدء',
    stop: 'إيقاف',
    export: 'تصدير',
    share: 'مشاركة',
    history: 'السجل',
    from: 'من',
    to: 'إلى',
    
    // Health Monitor Modals
    heartRateMonitor: 'مراقب معدل ضربات القلب',
    temperatureMonitor: 'مراقب درجة الحرارة',
    bloodOxygenMonitor: 'مراقب الأكسجين في الدم',
    realtimeMonitoring: 'مراقبة في الوقت الفعلي مع اتجاهات 24 ساعة',
    currentReading: 'القراءة الحالية',
    hourTrend24: 'اتجاه 24 ساعة',
    temperatureRanges: 'نطاقات درجة الحرارة',
    healthTips: 'نصائح صحية',
    
    // Temperature Classifications
    hypothermia: 'انخفاض حرارة الجسم',
    mildFever: 'حمى خفيفة',
    fever: 'حمى',
    highFever: 'حمى عالية',
    hyperthermia: 'ارتفاع حرارة الجسم',
    
    // Health Tips
    heartRateHealthTip: 'حافظ على معدل ضربات قلب صحي من خلال التمارين المنتظمة وإدارة التوتر والنوم الكافي. معدل ضربات القلب الطبيعي أثناء الراحة هو 60-100 نبضة في الدقيقة.',
    bloodPressureHealthTip: 'حافظ على ضغط الدم تحت السيطرة بنظام غذائي متوازن وتمارين منتظمة وتقليل الصوديوم وتقليل التوتر. ضغط الدم الطبيعي أقل من 120/80 ممHg.',
    temperatureHealthTip: 'يمكن أن تختلف درجة حرارة الجسم على مدار اليوم. النطاق الطبيعي هو 36.1-37.2°م. حافظ على رطوبة جسمك والبس ملابس مناسبة للطقس.',
    oxygenLevelHealthTip: 'حافظ على مستويات أكسجين صحية بتمارين التنفس العميق والوضعية الجيدة. تشبع الأكسجين الطبيعي هو 95-100%.',
    
    // Additional Status Labels
    warning: 'تحذير',
    attention: 'انتباه',
    
    // Table Headers
    dateTime: 'التاريخ والوقت',
    oxygen: 'الأكسجين',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translation) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('healthcare-language');
      return (saved as Language) || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('healthcare-language', language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: keyof Translation): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t, isRTL } },
    children
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return React.createElement(
    'div',
    { className: 'flex items-center space-x-2 rtl:space-x-reverse' },
    React.createElement(
      'button',
      {
        onClick: () => setLanguage('en'),
        className: language === 'en' 
          ? 'bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded text-sm font-medium transition-colors'
      },
      'EN'
    ),
    React.createElement(
      'button',
      {
        onClick: () => setLanguage('ar'),
        className: language === 'ar'
          ? 'bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded text-sm font-medium transition-colors'
      },
      'العربية'
    )
  );
}