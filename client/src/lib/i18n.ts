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
  
  // Admin Dashboard Specific
  systemAdministrator: string;
  teleHAdmin247: string;
  healthcareManagementDashboard: string;
  administrator: string;
  activeMonitoring: string;
  deviceMonitoring: string;
  faqAndSupport: string;
  advancedAnalytics: string;
  enhancedScheduling: string;
  deviceGuidesAndHelp: string;
  hc03StatusAndBattery: string;
  aiInsightsAndTrends: string;
  oneToFourHourIntervals: string;
  exportCSV: string;
  clickToViewAllPatients: string;
  clickToViewActivePatients: string;
  clickToViewCriticalPatients: string;
  clickToViewAnalytics: string;
  searchPatientsDots: string;
  allStatus: string;
  allHospitals: string;
  patient: string;
  actions: string;
  vitals: string;
  
  // Additional Table Headers
  lastActivity: string;
  patientIdHeader: string;
  
  // Status Values
  noData: string;
  normalStatus: string;
  
  // Search and Filters
  searchPatients: string;
  
  // Time Units  
  hour: string;
  hours: string;
  
  // Checkup Scheduling
  checkupScheduling: string;
  managePatientMonitoringSchedules: string;
  createCheckupSchedule: string;
  selectPatient: string;
  choosePatient: string;
  vitalsToMonitor: string;
  checkupInterval: string;
  reminderPreference: string;
  emailOnly: string;
  smsOnly: string;
  emailAndSms: string;
  creating: string;
  createSchedule: string;
  activeSchedules: string;
  noSchedulesCreated: string;
  active: string;
  paused: string;
  interval: string;
  nextCheckup: string;
  monitoring: string;
  reminders: string;
  dueNow: string;
  inHours: string;
  inDays: string;
  every: string;
  pleaseSelectPatientAndVitals: string;
  checkupScheduleCreated: string;
  failedToCreateSchedule: string;
  confirmDeleteSchedule: string;
  
  // Main App Strings
  technologyServices: string;
  welcomeBack: string;
  signInToHealthcareDashboard: string;
  emailOrPatientId: string;
  enterEmailOrPatientId: string;
  enterPassword: string;
  signingIn: string;
  signIn: string;
  
  // Registration Form
  firstName: string;
  middleName: string;
  lastName: string;
  confirmPassword: string;
  creatingAccount: string;
  createAccountSendOtp: string;
  
  // Admin Dashboard
  adminDashboard: string;
  managePatientDashboardAccess: string;
  totalPatients: string;
  activeMonitors: string;
  criticalAlerts: string;
  complianceRate: string;
  patientManagement: string;
  lastReading: string;
  monitor: string;
  syncNow: string;
  viewFullHistory: string;
  
  // Patient Dashboard
  myHealthDashboard: string;
  bpm: string;
  mmHg: string;
  celsius: string;
  percent: string;
  healthStatusOverview: string;
  allVitalSignsNormal: string;
  continueRegularMedication: string;
  nextAppointment: string;
  hc03Device: string;
  startMonitoring: string;
  viewReports: string;
  medicationLog: string;
  scheduleCheckup: string;
  connectHc03Device: string;
  
  // Device and Health Monitoring
  deviceRegistrationRequired: string;
  setupPatientProfile: string;
  newPatientRegistration: string;
  createNewPatientProfile: string;
  existingPatientLogin: string;
  connectToExistingAccount: string;
  guestMode: string;
  abuDhabiHospital: string;
  selectHospitalAbuDhabi: string;
  other: string;
  passwordMinChars: string;
  agreeTermsConditions: string;
  privacyPolicy: string;
  createAccount: string;
  
  // Verification
  verificationMethod: string;
  emailVerification: string;
  receiveOtpEmail: string;
  smsVerification: string;
  receiveOtpSms: string;
  verificationCode: string;
  enterSixDigitCode: string;
  verifyAndConnect: string;
  didntReceiveCode: string;
  resendOtp: string;
  backToRegistration: string;
  registrationSuccessful: string;
  accountCreatedSuccessfully: string;
  registrationDetails: string;
  startingHealthMonitoring: string;
  
  // Error Messages
  pleaseAcceptTerms: string;
  passwordsDoNotMatch: string;
  loginFailed: string;
  registrationFailed: string;
  networkError: string;
  failedToLoadDashboard: string;
  failedToUpdatePatientStatus: string;
  
  // General UI
  notSpecified: string;
  notProvided: string;
  unknown: string;
  justNow: string;
  retry: string;
  
  // Additional Admin Dashboard
  thisMonth: string;
  requiresImmediateAttention: string;
  deviceConnections: string;
  hc03DevicesOnline: string;
  healthMonitoringStatus: string;
  ecgMonitors: string;
  glucoseMonitors: string;
  averageHeartRate: string;
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
    
    // Admin Dashboard Specific
    systemAdministrator: 'System Administrator',
    teleHAdmin247: '24/7 Tele H Admin',
    healthcareManagementDashboard: 'Healthcare Management Dashboard',
    administrator: 'Administrator',
    activeMonitoring: 'Active Monitoring',
    deviceMonitoring: 'Device Monitoring',
    faqAndSupport: 'FAQ & Support',
    advancedAnalytics: 'Advanced Analytics',
    enhancedScheduling: 'Enhanced Scheduling',
    deviceGuidesAndHelp: 'Device guides & help',
    hc03StatusAndBattery: 'HC03 status & battery',
    aiInsightsAndTrends: 'AI insights & trends',
    oneToFourHourIntervals: '1-4 hour intervals',
    exportCSV: 'Export CSV',
    clickToViewAllPatients: 'Click to view all patients',
    clickToViewActivePatients: 'Click to view active patients',
    clickToViewCriticalPatients: 'Click to view critical patients',
    clickToViewAnalytics: 'Click to view analytics',
    searchPatientsDots: 'Search patients...',
    allStatus: 'All Status',
    allHospitals: 'All Hospitals',
    patient: 'Patient',
    actions: 'Actions',
    vitals: 'Vitals',
    
    // Additional Table Headers
    lastActivity: 'Last Activity',
    patientIdHeader: 'Patient ID',
    
    // Status Values
    noData: 'No Data',
    normalStatus: 'Normal',
    
    // Search and Filters
    searchPatients: 'Search patients',
    
    // Additional Status Values and Actions
    notSpecified: 'Not specified',
    noRecentData: 'No recent data',
    viewAction: 'View',
    editAction: 'Edit',
    deactivate: 'Deactivate',
    activate: 'Activate',
    patientDetails: 'Patient Details',
    completePatientInfo: 'Complete patient information and health records',
    
    // Login Screen Branding
    technologyServices: 'Technology Services',
    advancedHealthcareSystem: 'Advanced Healthcare Management System providing comprehensive patient monitoring, real-time analytics, and seamless integration with medical devices.',
    activePatients: 'Active Patients',
    monitoring247: 'Monitoring',
    uptime: 'Uptime',
    hospitals: 'Hospitals',
    
    // Patient Details Modal
    contactAccess: 'Contact & Access',
    currentStatus: 'Current Status',
    registrationStatus: 'Registration Status',
    verified: 'Verified',
    pendingVerification: 'Pending Verification',
    mobileNumber: 'Mobile Number',
    portalAccess: 'Portal Access',
    healthcareDashboardEnabled: 'Healthcare Dashboard Enabled',
    healthStatus: 'Health Status',
    lastActivity: 'Last Activity',
    hospitalAffiliation: 'Hospital Affiliation',
    currentVitalSigns: 'Current Vital Signs',
    heartRateBPM: 'Heart Rate (BPM)',
    bloodPressure: 'Blood Pressure',
    temperature: 'Temperature',
    bloodOxygen: 'Blood Oxygen',
    healthOverview: 'Health Overview',
    recentActivity: 'Recent Activity',
    notAssigned: 'Not assigned',
    emailAddress: 'Email Address',
    dateOfBirth: 'Date of Birth',
    age: 'Age',
    yearsOld: 'years old',
    
    // Edit Patient Modal
    editPatient: 'Edit Patient',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    
    // Checkup Scheduling Modal
    checkupScheduling: 'Checkup Scheduling',
    managePatientMonitoringSchedules: 'Manage patient monitoring schedules',
    createCheckupSchedule: 'Create Checkup Schedule',
    selectPatient: 'Select Patient',
    choosePatient: 'Choose a patient...',
    vitalsToMonitor: 'Vitals to Monitor',
    checkupInterval: 'Checkup Interval',
    reminderPreference: 'Reminder Preference',
    emailOnly: 'Email Only',
    smsOnly: 'SMS Only',
    emailAndSms: 'Email & SMS',
    creating: 'Creating...',
    createSchedule: 'Create Schedule',
    activeSchedules: 'Active Schedules',
    noSchedulesCreated: 'No schedules created yet',
    active: 'Active',
    paused: 'Paused',
    interval: 'Interval:',
    nextCheckup: 'Next Checkup:',
    monitoring: 'Monitoring:',
    reminders: 'Reminders:',
    dueNow: 'Due now',
    inHours: 'In {hours} hours',
    inDays: 'In {days} days',
    every: 'Every',
    hour: 'Hour',
    hours: 'Hours',
    pleaseSelectPatientAndVitals: 'Please select a patient and at least one vital sign to monitor',
    checkupScheduleCreated: 'Checkup schedule created successfully!',
    failedToCreateSchedule: 'Failed to create schedule',
    confirmDeleteSchedule: 'Are you sure you want to delete this schedule?',
    
    // Main App Strings
    technologyServices: 'Technology Services',
    welcomeBack: 'Welcome Back',
    signInToHealthcareDashboard: 'Sign in to your healthcare dashboard',
    emailOrPatientId: 'Email Address or Patient ID',
    enterEmailOrPatientId: 'Enter your email or patient ID',
    enterPassword: 'Enter your password',
    signingIn: 'Signing In...',
    signIn: 'Sign In',
    
    // Registration Form
    firstName: 'First Name',
    middleName: 'Middle Name',
    lastName: 'Last Name',
    confirmPassword: 'Confirm Password',
    creatingAccount: 'Creating Account...',
    createAccountSendOtp: 'Create Account & Send OTP',
    
    // Admin Dashboard
    adminDashboard: 'Admin Dashboard',
    managePatientDashboardAccess: 'Manage patient dashboard access for 24/7 Tele H',
    totalPatients: 'Total Patients',
    activeMonitors: 'Active Monitors',
    criticalAlerts: 'Critical Alerts',
    complianceRate: 'Compliance Rate',
    patientManagement: 'Patient Management',
    lastReading: 'Last Reading',
    monitor: 'Monitor',
    syncNow: 'Sync Now',
    viewFullHistory: 'View Full History',
    
    // Patient Dashboard
    myHealthDashboard: '24/7 Tele H - My Health Dashboard',
    bpm: 'bpm',
    mmHg: 'mmHg',
    celsius: '°C',
    percent: '%',
    healthStatusOverview: 'Health Status Overview',
    allVitalSignsNormal: 'All Vital Signs Normal',
    continueRegularMedication: 'Your latest readings are within healthy ranges. Continue your regular medication schedule.',
    nextAppointment: 'Next Appointment',
    hc03Device: 'HC03 Device',
    startMonitoring: 'Start Monitoring',
    viewReports: 'View Reports',
    medicationLog: 'Medication Log',
    scheduleCheckup: 'Schedule Checkup',
    connectHc03Device: 'Connect HC03 Device',
    
    // Device and Health Monitoring
    deviceRegistrationRequired: 'Device Registration Required',
    setupPatientProfile: 'Set up your patient profile to start monitoring your health with HC03 Health Monitor Pro',
    newPatientRegistration: 'New Patient Registration',
    createNewPatientProfile: 'Create a new patient profile',
    existingPatientLogin: 'Existing Patient Login',
    connectToExistingAccount: 'Connect device to existing account',
    guestMode: 'Use in Guest Mode (Limited Features)',
    abuDhabiHospital: 'Abu Dhabi Hospital/Clinic *',
    selectHospitalAbuDhabi: 'Select a hospital in Abu Dhabi',
    other: 'Other',
    passwordMinChars: 'Password (min. 6 characters) *',
    agreeTermsConditions: 'I agree to the Terms and Conditions',
    privacyPolicy: 'Privacy Policy',
    createAccount: 'Create Account',
    
    // Verification
    verificationMethod: 'Verification Method',
    emailVerification: 'Email Verification',
    receiveOtpEmail: 'Receive OTP via email',
    smsVerification: 'SMS Verification',
    receiveOtpSms: 'Receive OTP via SMS',
    verificationCode: 'Verification Code',
    enterSixDigitCode: 'Enter 6-digit code',
    verifyAndConnect: 'Verify & Connect',
    didntReceiveCode: 'Didn\'t receive the code?',
    resendOtp: 'Resend OTP',
    backToRegistration: 'Back to Registration',
    registrationSuccessful: 'Registration Successful!',
    accountCreatedSuccessfully: 'Your account has been created successfully. You can now log in to access the 24/7 Tele H healthcare monitoring system.',
    registrationDetails: 'Your Registration Details:',
    startingHealthMonitoring: 'Starting health monitoring session...',
    
    // Error Messages
    pleaseAcceptTerms: 'Please accept the terms and conditions',
    passwordsDoNotMatch: 'Passwords do not match',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',
    networkError: 'Network error',
    failedToLoadDashboard: 'Failed to load dashboard data',
    failedToUpdatePatientStatus: 'Failed to update patient status',
    
    // General UI
    notSpecified: 'Not specified',
    notProvided: 'Not provided',
    unknown: 'Unknown',
    justNow: 'Just now',
    retry: 'Retry',
    
    // Additional Admin Dashboard
    thisMonth: 'this month',
    requiresImmediateAttention: 'Requires immediate attention',
    deviceConnections: 'Device Connections',
    hc03DevicesOnline: 'HC03 devices online',
    healthMonitoringStatus: 'Health Monitoring Status',
    ecgMonitors: 'ECG Monitors',
    glucoseMonitors: 'Glucose Monitors',
    averageHeartRate: 'Average Heart Rate',
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
    
    // Admin Dashboard Specific
    systemAdministrator: 'مدير النظام',
    teleHAdmin247: 'إدارة تليه 24/7',
    healthcareManagementDashboard: 'لوحة إدارة الرعاية الصحية',
    administrator: 'مدير',
    activeMonitoring: 'المراقبة النشطة',
    deviceMonitoring: 'مراقبة الأجهزة',
    faqAndSupport: 'الأسئلة الشائعة والدعم',
    advancedAnalytics: 'التحليلات المتقدمة',
    enhancedScheduling: 'الجدولة المحسنة',
    deviceGuidesAndHelp: 'أدلة الأجهزة والمساعدة',
    hc03StatusAndBattery: 'حالة HC03 والبطارية',
    aiInsightsAndTrends: 'رؤى الذكاء الاصطناعي والاتجاهات',
    oneToFourHourIntervals: 'فترات 1-4 ساعات',
    exportCSV: 'تصدير CSV',
    clickToViewAllPatients: 'اضغط لعرض جميع المرضى',
    clickToViewActivePatients: 'اضغط لعرض المرضى النشطين',
    clickToViewCriticalPatients: 'اضغط لعرض المرضى الحرجين',
    clickToViewAnalytics: 'اضغط لعرض التحليلات',
    searchPatientsDots: 'البحث عن المرضى...',
    allStatus: 'جميع الحالات',
    allHospitals: 'جميع المستشفيات',
    patient: 'المريض',
    actions: 'الإجراءات',
    vitals: 'العلامات الحيوية',
    
    // Additional Table Headers
    lastActivity: 'آخر نشاط',
    patientIdHeader: 'رقم المريض',
    
    // Status Values
    noData: 'لا توجد بيانات',
    normalStatus: 'طبيعي',
    
    // Search and Filters
    searchPatients: 'البحث عن المرضى',
    
    // Additional Status Values and Actions
    notSpecified: 'غير محدد',
    noRecentData: 'لا توجد بيانات حديثة',
    viewAction: 'عرض',
    editAction: 'تعديل',
    deactivate: 'إلغاء التفعيل',
    activate: 'تفعيل',
    patientDetails: 'تفاصيل المريض',
    completePatientInfo: 'معلومات المريض الكاملة والسجلات الصحية',
    
    // Login Screen Branding
    technologyServices: 'خدمات التكنولوجيا',
    advancedHealthcareSystem: 'نظام إدارة الرعاية الصحية المتقدم الذي يوفر مراقبة شاملة للمرضى، وتحليلات في الوقت الفعلي، وتكامل سلس مع الأجهزة الطبية.',
    activePatients: 'المرضى النشطون',
    monitoring247: 'المراقبة',
    uptime: 'وقت التشغيل',
    hospitals: 'المستشفيات',
    
    // Patient Details Modal
    contactAccess: 'الاتصال والوصول',
    currentStatus: 'الحالة الحالية',
    registrationStatus: 'حالة التسجيل',
    verified: 'متحقق منه',
    pendingVerification: 'في انتظار التحقق',
    mobileNumber: 'رقم الجوال',
    portalAccess: 'الوصول إلى البوابة',
    healthcareDashboardEnabled: 'لوحة الرعاية الصحية مفعلة',
    healthStatus: 'الحالة الصحية',
    lastActivity: 'آخر نشاط',
    hospitalAffiliation: 'الانتماء للمستشفى',
    currentVitalSigns: 'العلامات الحيوية الحالية',
    heartRateBPM: 'معدل ضربات القلب (ضربة/دقيقة)',
    bloodPressure: 'ضغط الدم',
    temperature: 'درجة الحرارة',
    bloodOxygen: 'أكسجين الدم',
    healthOverview: 'نظرة عامة على الصحة',
    recentActivity: 'النشاط الأخير',
    notAssigned: 'غير مخصص',
    emailAddress: 'عنوان البريد الإلكتروني',
    dateOfBirth: 'تاريخ الميلاد',
    age: 'العمر',
    yearsOld: 'سنة',
    
    // Edit Patient Modal
    editPatient: 'تعديل المريض',
    saveChanges: 'حفظ التغييرات',
    cancel: 'إلغاء',
    close: 'إغلاق',
    
    // Checkup Scheduling Modal
    checkupScheduling: 'جدولة الفحوصات',
    managePatientMonitoringSchedules: 'إدارة جداول مراقبة المرضى',
    createCheckupSchedule: 'إنشاء جدول فحص',
    selectPatient: 'اختر مريض',
    choosePatient: 'اختر مريضاً...',
    vitalsToMonitor: 'العلامات الحيوية للمراقبة',
    checkupInterval: 'فترة الفحص',
    reminderPreference: 'تفضيل التذكير',
    emailOnly: 'البريد الإلكتروني فقط',
    smsOnly: 'رسائل نصية فقط',
    emailAndSms: 'بريد إلكتروني ورسائل نصية',
    creating: 'جاري الإنشاء...',
    createSchedule: 'إنشاء جدول',
    activeSchedules: 'الجداول النشطة',
    noSchedulesCreated: 'لم يتم إنشاء جداول بعد',
    active: 'نشط',
    paused: 'متوقف',
    interval: 'الفترة:',
    nextCheckup: 'الفحص التالي:',
    monitoring: 'المراقبة:',
    reminders: 'التذكيرات:',
    dueNow: 'مستحق الآن',
    inHours: 'خلال {hours} ساعة',
    inDays: 'خلال {days} يوم',
    every: 'كل',
    hour: 'ساعة',
    hours: 'ساعات',
    pleaseSelectPatientAndVitals: 'يرجى اختيار مريض وعلامة حيوية واحدة على الأقل للمراقبة',
    checkupScheduleCreated: 'تم إنشاء جدول الفحص بنجاح!',
    failedToCreateSchedule: 'فشل في إنشاء الجدول',
    confirmDeleteSchedule: 'هل أنت متأكد من رغبتك في حذف هذا الجدول؟',
    
    // Main App Strings
    technologyServices: 'خدمات التكنولوجيا',
    welcomeBack: 'مرحباً بعودتك',
    signInToHealthcareDashboard: 'سجل دخولك إلى لوحة الرعاية الصحية',
    emailOrPatientId: 'البريد الإلكتروني أو رقم المريض',
    enterEmailOrPatientId: 'أدخل بريدك الإلكتروني أو رقم المريض',
    enterPassword: 'أدخل كلمة المرور',
    signingIn: 'جاري تسجيل الدخول...',
    signIn: 'تسجيل الدخول',
    
    // Registration Form
    firstName: 'الاسم الأول',
    middleName: 'الاسم الأوسط',
    lastName: 'اسم العائلة',
    confirmPassword: 'تأكيد كلمة المرور',
    creatingAccount: 'إنشاء الحساب...',
    createAccountSendOtp: 'إنشاء الحساب وإرسال رمز التحقق',
    
    // Admin Dashboard
    adminDashboard: 'لوحة الإدارة',
    managePatientDashboardAccess: 'إدارة وصول المرضى إلى لوحة المراقبة الصحية',
    totalPatients: 'إجمالي المرضى',
    activeMonitors: 'الأجهزة النشطة',
    criticalAlerts: 'تنبيهات حرجة',
    complianceRate: 'معدل الالتزام',
    patientManagement: 'إدارة المرضى',
    lastReading: 'آخر قراءة',
    monitor: 'مراقب',
    syncNow: 'مزامنة الآن',
    viewFullHistory: 'عرض التاريخ الكامل',
    
    // Patient Dashboard
    myHealthDashboard: 'لوحة المراقبة الصحية',
    bpm: 'ضربة/دقيقة',
    mmHg: 'ملم زئبق',
    celsius: 'مئوي',
    percent: '%',
    healthStatusOverview: 'نظرة عامة على الحالة الصحية',
    allVitalSignsNormal: 'جميع العلامات الحيوية طبيعية',
    continueRegularMedication: 'تابع الجدول الدوائي المنتظم',
    nextAppointment: 'الموعد القادم',
    hc03Device: 'جهاز HC03',
    startMonitoring: 'بدء المراقبة',
    viewReports: 'عرض التقارير',
    medicationLog: 'سجل الأدوية',
    scheduleCheckup: 'جدولة فحص',
    connectHc03Device: 'اتصال بجهاز HC03',
    
    // Device and Health Monitoring
    deviceRegistrationRequired: 'تسجيل الجهاز مطلوب',
    setupPatientProfile: 'إعداد ملف المريض لبدء مراقبة الصحة مع جهاز HC03',
    newPatientRegistration: 'تسجيل مريض جديد',
    createNewPatientProfile: 'إنشاء ملف مريض جديد',
    existingPatientLogin: 'دخول مريض موجود',
    connectToExistingAccount: 'ربط الجهاز بحساب موجود',
    guestMode: 'استخدام كضيف (ميزات محدودة)',
    abuDhabiHospital: 'مستشفى أبوظبي/العيادة',
    selectHospitalAbuDhabi: 'اختر مستشفى في أبوظبي',
    other: 'أخرى',
    passwordMinChars: 'كلمة المرور (6 أحرف على الأقل)',
    agreeTermsConditions: 'أوافق على الشروط والأحكام',
    privacyPolicy: 'سياسة الخصوصية',
    createAccount: 'إنشاء حساب',
    
    // Verification
    verificationMethod: 'طريقة التحقق',
    emailVerification: 'تحقق بالبريد الإلكتروني',
    receiveOtpEmail: 'استلام رمز التحقق عبر البريد الإلكتروني',
    smsVerification: 'تحقق بالرسائل النصية',
    receiveOtpSms: 'استلام رمز التحقق عبر الرسائل النصية',
    verificationCode: 'رمز التحقق',
    enterSixDigitCode: 'أدخل الرمز المكون من 6 أرقام',
    verifyAndConnect: 'تحقق واتصال',
    didntReceiveCode: 'لم تستلم الرمز؟',
    resendOtp: 'إعادة إرسال رمز التحقق',
    backToRegistration: 'العودة للتسجيل',
    registrationSuccessful: 'تم التسجيل بنجاح!',
    accountCreatedSuccessfully: 'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول للوصول إلى نظام المراقبة الصحية 24/7',
    registrationDetails: 'تفاصيل التسجيل:',
    startingHealthMonitoring: 'بدء جلسة المراقبة الصحية...',
    
    // Error Messages
    pleaseAcceptTerms: 'يرجى قبول الشروط والأحكام',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة',
    loginFailed: 'فشل في تسجيل الدخول',
    registrationFailed: 'فشل في التسجيل',
    networkError: 'خطأ في الشبكة',
    failedToLoadDashboard: 'فشل في تحميل لوحة البيانات',
    failedToUpdatePatientStatus: 'فشل في تحديث حالة المريض',
    
    // General UI
    notSpecified: 'غير محدد',
    notProvided: 'غير متوفر',
    unknown: 'غير معروف',
    justNow: 'الآن',
    retry: 'إعادة المحاولة',
    
    // Additional Admin Dashboard
    thisMonth: 'هذا الشهر',
    requiresImmediateAttention: 'يتطلب اهتماماً فورياً',
    deviceConnections: 'اتصالات الأجهزة',
    hc03DevicesOnline: 'أجهزة HC03 متصلة',
    healthMonitoringStatus: 'حالة مراقبة الصحة',
    ecgMonitors: 'أجهزة مراقبة القلب',
    glucoseMonitors: 'أجهزة مراقبة الجلوكوز',
    averageHeartRate: 'متوسط معدل ضربات القلب',
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