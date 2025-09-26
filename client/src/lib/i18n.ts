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
  loadingDeviceInformation: string;
  
  // Additional Admin Dashboard
  thisMonth: string;
  requiresImmediateAttention: string;
  deviceConnections: string;
  hc03DevicesOnline: string;
  healthMonitoringStatus: string;
  ecgMonitors: string;
  glucoseMonitors: string;
  averageHeartRate: string;
  
  // Device Monitoring Interface
  deviceMonitoring: string;
  hc03DeviceStatusManagement: string;
  connectedDevices: string;
  selectDeviceToViewDetails: string;
  battery: string;
  lastSync: string;
  readings: string;
  syncNow: string;
  syncing: string;
  connected: string;
  disconnected: string;
  deviceDetails: string;
  deviceInformation: string;
  deviceId: string;
  macAddress: string;
  firmware: string;
  patientAssignment: string;
  patientName: string;
  batteryStatus: string;
  batteryLevel: string;
  charging: string;
  lowBatteryWarning: string;
  status: string;
  supportedVitalSigns: string;
  syncInformation: string;
  totalReadings: string;
  lastReading: string;
  forceSync: string;
  viewHistory: string;
  
  // Help & Support Interface
  helpAndSupport: string;
  frequentlyAskedQuestions: string;
  searchFAQs: string;
  allCategories: string;
  deviceSetup: string;
  bloodPressure: string;
  heartRate: string;
  generalUsage: string;
  troubleshooting: string;
  needMoreHelp: string;
  contactSupportTeam: string;
  available24x7: string;
  noFAQsFound: string;
  tryAdjustingSearchTerms: string;
  watchVideoGuide: string;
  visualStepByStepInstructions: string;
  lastUpdated: string;
  technologyServicesHealthcareSupport: string;
  healthcareSupport: string;
}

export const translations: Record<Language, Translation> = {
  en: 
abnormal: 'Abnormal',
    abnormalVitals: 'Abnormal Vitals',
    abuDhabiHospital: 'Abu Dhabi Hospital/Clinic *',
    accountCreatedSuccessfully: 'Your account has been created successfully. You can now log in to access the 24/7 Tele H healthcare monitoring system.',
    actions: 'Actions',
    activate: 'Activate',
    active: 'Active',
    activeAlerts: 'Active Alerts',
    activeMonitoring: 'Active Monitoring',
    activeMonitors: 'Active Monitors',
    activePatients: 'Active Patients',
    activeSchedules: 'Active Schedules',
    addDevice: 'Add Device',
    addPatient: 'Add Patient',
    adminDashboard: 'Admin Dashboard',
    administrator: 'Administrator',
    advancedAnalytics: 'Advanced Analytics',
    advancedHealthcareSystem: 'Advanced Healthcare Management System providing comprehensive patient monitoring, real-time analytics, and seamless integration with medical devices.',
    age: 'Age',
    agreeTermsConditions: 'I agree to the Terms and Conditions',
    aiInsightsAndTrends: 'AI insights & trends',
    alerts: 'Alerts',
    allCategories: 'All Categories',
    allergies: 'Allergies',
    allHospitals: 'All Hospitals',
    allStatus: 'All Status',
    allVitalSignsNormal: 'All Vital Signs Normal',
    alreadyHaveAccount: 'Already have an account?',
    analytics: 'Analytics',
    appSubtitle: 'Healthcare Monitoring Portal',
    appTitle: '24/7 Tele H Technology Services',
    arrhythmia: 'Arrhythmia',
    attention: 'Attention',
    available24x7: '24/7 Available',
    averageHeartRate: 'Average Heart Rate',
    averageRR: 'Average RR',
    axisDeviation: 'Axis Deviation',
    backToDashboard: 'Back to Dashboard',
    backToRegistration: 'Back to Registration',
    balance: 'Balance',
    battery: 'Battery',
    batteryLevel: 'Battery Level',
    batteryStatus: 'Battery Status',
    bedtime: 'Bedtime',
    bloodGlucose: 'Blood Glucose',
    bloodGlucoseMeasurement: 'Blood Glucose Measurement',
    bloodGlucoseMonitor: 'Blood Glucose Monitor',
    bloodOxygen: 'Blood Oxygen',
    bloodOxygenMeasurement: 'Blood Oxygen Measurement',
    bloodOxygenMonitor: 'Blood Oxygen Monitor',
    bloodPressure: 'Blood Pressure',
    bloodPressureHealthTip: 'Keep blood pressure in check with a balanced diet, regular exercise, limited sodium, and stress reduction. Normal BP is less than 120/80 mmHg.',
    bloodPressureMeasurement: 'Blood Pressure Measurement',
    bloodPressureMonitor: 'Blood Pressure',
    bluetoothDevices: 'Bluetooth Devices',
    bpm: 'bpm',
    breathsPerMin: 'Breaths/min',
    cancel: 'Cancel',
    cardiacRhythm: 'Cardiac Rhythm',
    celsius: '°C',
    charging: 'Charging',
    chargingStatus: 'Charging Status',
    checkupInterval: 'Checkup Interval',
    checkupSchedule: 'Checkup Schedule',
    checkupScheduleCreated: 'Checkup schedule created successfully!',
    checkupScheduling: 'Checkup Scheduling',
    chill: 'Chill',
    choosePatient: 'Choose a patient...',
    clickToViewActivePatients: 'Click to view active patients',
    clickToViewAllPatients: 'Click to view all patients',
    clickToViewAnalytics: 'Click to view analytics',
    clickToViewCriticalPatients: 'Click to view critical patients',
    clinicalInterpretation: 'Clinical Interpretation',
    close: 'Close',
    complete: 'Complete',
    completePatientInfo: 'Complete patient information and health records',
    complianceRate: 'Compliance Rate',
    confirmDeleteSchedule: 'Are you sure you want to delete this schedule?',
    confirmPassword: 'Confirm Password',
    connectDevice: 'Connect Device',
    connected: 'Connected',
    connectedDevices: 'Connected Devices',
    connectHc03Device: 'Connect HC03 Device',
    connectHC03Devices: 'Connect HC03 devices to monitor battery status',
    connecting: 'Connecting',
    connectionEstablished: 'Connection established',
    connectionFailed: 'Connection failed',
    connectToExistingAccount: 'Connect device to existing account',
    contact: 'Contact',
    contactAccess: 'Contact & Access',
    contactInfo: 'Contact Information',
    contactQuality: 'Contact Quality',
    contactSupportTeam: 'Contact our support team',
    continueRegularMedication: 'Your latest readings are within healthy ranges. Continue your regular medication schedule.',
    createAccount: 'Create Account',
    createAccountSendOtp: 'Create Account & Send OTP',
    createCheckupSchedule: 'Create Checkup Schedule',
    createNewPatientProfile: 'Create a new patient profile',
    createSchedule: 'Create Schedule',
    creating: 'Creating...',
    creatingAccount: 'Creating Account...',
    critical: 'Critical',
    criticalAlert: 'Critical Alert',
    criticalAlerts: 'Critical Alerts',
    criticalEcgFindings: 'Critical ECG Findings',
    currentReading: 'Current Reading',
    currentStatus: 'Current Status',
    currentVitalSigns: 'Current Vital Signs',
    dashboard: 'Dashboard',
    dateOfBirth: 'Date of Birth',
    dateTime: 'Date & Time',
    deactivate: 'Deactivate',
    delete: 'Delete',
    deleted: 'Deleted successfully',
    deletePatient: 'Delete Patient',
    detailedEcgAnalysis: 'Detailed ECG analysis and medical interpretation',
    detected: 'Detected',
    deviceBattery: 'Device Battery',
    deviceBatteryLow: 'Device battery is low',
    deviceBatteryStatus: 'Device Battery Status',
    deviceConnection: 'Device Connection',
    deviceConnections: 'Device Connections',
    deviceDetails: 'Device Details',
    deviceGuidesAndHelp: 'Device guides & help',
    deviceId: 'Device ID',
    deviceInformation: 'Device Information',
    deviceMonitoring: 'Device Monitoring',
    deviceName: 'Device Name',
    deviceOffline: 'Device Offline',
    deviceRegistrationRequired: 'Device Registration Required',
    devices: 'Devices',
    deviceSetup: 'Device Setup',
    deviceStatus: 'Device Status',
    diastolic: 'Diastolic',
    didntReceiveCode: 'Didn\'t receive the code?',
    disconnectDevice: 'Disconnect Device',
    disconnected: 'Disconnected',
    doctorNotes: 'Doctor Notes',
    dominantRhythm: 'Dominant Rhythm',
    dueNow: 'Due now',
    ecg: 'ECG',
    ecgAnalysisReport: 'ECG Analysis Report',
    ecgIntervals: 'ECG Intervals',
    ecgMeasurement: 'ECG Measurement',
    ecgMonitor: 'ECG Monitor',
    ecgMonitors: 'ECG Monitors',
    edit: 'Edit',
    editAction: 'Edit',
    editPatient: 'Edit Patient',
    elevated: 'Elevated',
    email: 'Email',
    emailAddress: 'Email Address',
    emailAndSms: 'Email & SMS',
    emailOnly: 'Email Only',
    emailOrPatientId: 'Email Address or Patient ID',
    emailVerification: 'Email Verification',
    emergencyContact: 'Emergency Contact',
    enhancedScheduling: 'Enhanced Scheduling',
    enterEmailOrPatientId: 'Enter your email or patient ID',
    enterPassword: 'Enter your password',
    enterSixDigitCode: 'Enter 6-digit code',
    error: 'Error',
    every: 'Every',
    excitation: 'Excitation',
    excitementAnxiety: 'Excitement/Anxiety',
    existingPatientLogin: 'Existing Patient Login',
    export: 'Export',
    exportCSV: 'Export CSV',
    exportData: 'Export Data',
    exportReport: 'Export Report',
    failed: 'Failed',
    failedToCreateSchedule: 'Failed to create schedule',
    failedToLoadDashboard: 'Failed to load dashboard data',
    failedToUpdatePatientStatus: 'Failed to update patient status',
    faqAndSupport: 'FAQ & Support',
    fasting: 'Fasting',
    fever: 'Fever',
    filter: 'Filter',
    firmware: 'Firmware',
    firmwareVersion: 'Firmware Version',
    firstName: 'First Name',
    followupRequired: 'Follow-up Required',
    forceSync: 'Force Sync',
    forgotPassword: 'Forgot Password?',
    frequentlyAskedQuestions: 'Frequently Asked Questions & Device Instructions',
    from: 'From',
    full: 'Full',
    fullName: 'Full Name',
    generalUsage: 'General Usage',
    generateReport: 'Generate Report',
    glucoseMonitor: 'Glucose Monitor',
    glucoseMonitors: 'Glucose Monitors',
    good: 'Good',
    guestMode: 'Use in Guest Mode (Limited Features)',
    hc03Device: 'HC03 Device',
    hc03DevicesOnline: 'HC03 devices online',
    hc03DeviceStatusManagement: 'HC03 Device Status & Management',
    hc03StatusAndBattery: 'HC03 status & battery',
    healthcareDashboardEnabled: 'Healthcare Dashboard Enabled',
    healthcareManagementDashboard: 'Healthcare Management Dashboard',
    healthcareMonitoringRegistration: 'Healthcare Monitoring Registration',
    healthcareSupport: '24/7 Tele H Technology Services - Healthcare Support',
    healthMonitoring: 'Health Monitoring',
    healthMonitoringStatus: 'Health Monitoring Status',
    healthOverview: 'Health Overview',
    healthStatus: 'Health Status',
    healthStatusOverview: 'Health Status Overview',
    healthTips: 'Health Tips',
    healthTrends: 'Health Trends',
    heartRate: 'Heart Rate',
    heartRateBPM: 'Heart Rate (BPM)',
    heartRateHealthTip: 'Maintain a healthy heart rate through regular exercise, stress management, and adequate sleep. Normal resting heart rate is 60-100 bpm.',
    heartRateMonitor: 'Heart Rate Monitor',
    heartRateVariability: 'Heart Rate Variability',
    helpAndSupport: 'Help & Support',
    high: 'High',
    highFever: 'High Fever',
    highRisk: 'High Risk',
    history: 'History',
    home: 'Home',
    hospital: 'Hospital',
    hospitalAffiliation: 'Hospital Affiliation',
    hospitals: 'Hospitals',
    hour: 'Hour',
    hours: 'Hours',
    hourTrend24: '24-Hour Trend',
    hrRange: 'HR Range',
    hyperthermia: 'Hyperthermia',
    hypothermia: 'Hypothermia',
    inactive: 'Inactive',
    inDays: 'In {days} days',
    inHours: 'In {hours} hours',
    interval: 'Interval:',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    justNow: 'Just now',
    lastActivity: 'Last Activity',
    lastMeasurement: 'Last Measurement',
    lastMonth: 'Last Month',
    lastName: 'Last Name',
    lastReading: 'Last Reading',
    lastSync: 'Last Sync',
    lastUpdated: 'Last updated',
    lastWeek: 'Last Week',
    latestReading: 'Latest Reading',
    loading: 'Loading...',
    loadingDeviceInformation: 'Loading device information...',
    login: 'Login',
    loginFailed: 'Login failed',
    logout: 'Logout',
    low: 'Low',
    lowBattery: 'Low Battery',
    lowBatteryWarning: 'Low battery warning - Please charge device soon',
    lowest: 'Lowest',
    lowRisk: 'Low Risk',
    macAddress: 'MAC Address',
    managePatientDashboardAccess: 'Manage patient dashboard access for 24/7 Tele H',
    managePatientMonitoringSchedules: 'Manage patient monitoring schedules',
    measurementCompleted: 'Measurement Completed',
    measurementCount: 'Measurement Count',
    measurementInProgress: 'Measurement in Progress',
    measurementStarted: 'Measurement Started',
    measuring: 'Measuring',
    medicalHistory: 'Medical History',
    medicationLog: 'Medication Log',
    medications: 'Medications',
    mgdl: 'mg/dL',
    middleName: 'Middle Name',
    mildFever: 'Mild Fever',
    mmhg: 'mmHg',
    mmHg: 'mmHg',
    mobileNumber: 'Mobile Number',
    moderate: 'Moderate',
    monitor: 'Monitor',
    monitoring: 'Monitoring:',
    monitoring247: 'Monitoring',
    moodCategory: 'Mood Category',
    moodIndex: 'Mood Index',
    myHealthDashboard: '24/7 Tele H - My Health Dashboard',
    needMoreHelp: 'Need More Help?',
    networkError: 'Network error',
    newPatientRegistration: 'New Patient Registration',
    nextAppointment: 'Next Appointment',
    nextCheckup: 'Next Checkup:',
    no: 'No',
    noContact: 'No Contact',
    noData: 'No Data',
    noDevicesFound: 'No devices found',
    noFAQsFound: 'No FAQs Found',
    noGlucoseReadings: 'No glucose readings available',
    none: 'None',
    noReadings: 'No readings',
    noRecentData: 'No recent data',
    normal: 'Normal',
    normalStatus: 'Normal',
    noSchedulesCreated: 'No schedules created yet',
    notAssigned: 'Not assigned',
    notProvided: 'Not provided',
    notSpecified: 'Not specified',
    offline: 'Offline',
    oneToFourHourIntervals: '1-4 hour intervals',
    online: 'Online',
    other: 'Other',
    overallAssessment: 'Overall Assessment',
    oxygen: 'Oxygen',
    oxygenLevel: 'Oxygen Level',
    oxygenLevelHealthTip: 'Maintain healthy oxygen levels with deep breathing exercises and good posture. Normal oxygen saturation is 95-100%.',
    password: 'Password',
    passwordMinChars: 'Password (min. 6 characters) *',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordsNotMatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    patient: 'Patient',
    patientAssignment: 'Patient Assignment',
    patientDetails: 'Patient Details',
    patientId: 'Patient ID',
    patientIdHeader: 'Patient ID',
    patientLogin: 'Patient Login',
    patientManagement: 'Patient Management',
    patientName: 'Patient Name',
    patientRegistration: 'Patient Registration',
    patients: 'Patients',
    paused: 'Paused',
    pendingVerification: 'Pending Verification',
    percent: '%',
    percentage: '%',
    placeFinger: 'Please place your finger on the device sensor',
    pleaseAcceptTerms: 'Please accept the terms and conditions',
    pleaseSelectPatientAndVitals: 'Please select a patient and at least one vital sign to monitor',
    pnn50: 'pNN50',
    poor: 'poor',
    portalAccess: 'Portal Access',
    postMeal: 'Post-Meal',
    prediabetic: 'Prediabetic',
    prInterval: 'PR Interval',
    privacyPolicy: 'Privacy Policy',
    pWavePresent: 'P-Wave Present',
    qrsMorphology: 'QRS Morphology',
    qrsWidth: 'QRS Width',
    qtInterval: 'QT Interval',
    random: 'Random',
    readings: 'readings',
    ready: 'Ready',
    realtimeMonitoring: 'Real-time monitoring with 24-hour trends',
    realtimeVitalSigns: 'Real-time vital signs from HC03 devices',
    receiveOtpEmail: 'Receive OTP via email',
    receiveOtpSms: 'Receive OTP via SMS',
    recentActivity: 'Recent Activity',
    recentReadings: 'Recent Readings',
    recordingStatus: 'Recording Status',
    refresh: 'Refresh',
    register: 'Register',
    registrationDate: 'Registration Date',
    registrationDetails: 'Your Registration Details:',
    registrationFailed: 'Registration failed',
    registrationStatus: 'Registration Status',
    registrationSuccessful: 'Registration Successful!',
    relax: 'Relax',
    rememberMe: 'Remember me',
    reminderPreference: 'Reminder Preference',
    reminders: 'Reminders:',
    removeFingerAndWait: 'Remove finger and wait',
    reports: 'Reports',
    reportSummary: 'Report Summary',
    required: 'This field is required',
    requiresImmediateAttention: 'Requires immediate attention',
    resendOtp: 'Resend OTP',
    retry: 'Retry',
    rhythmAnalysis: 'Rhythm Analysis',
    riskStratification: 'Risk Stratification',
    rmssd: 'RMSSD',
    save: 'Save',
    saveChanges: 'Save Changes',
    saved: 'Saved successfully',
    scanning: 'Scanning',
    scanningForDevices: 'Scanning for devices...',
    scheduleCheckup: 'Schedule Checkup',
    sdnn: 'SDNN',
    search: 'Search',
    searchFAQs: 'Search FAQs...',
    searchPatients: 'Search patients',
    searchPatientsDots: 'Search patients...',
    selectDeviceToViewDetails: 'Select a device to view details',
    selectHospitalAbuDhabi: 'Select a hospital in Abu Dhabi',
    selectPatient: 'Select Patient',
    settings: 'Settings',
    setupPatientProfile: 'Set up your patient profile to start monitoring your health with HC03 Health Monitor Pro',
    share: 'Share',
    signalStrength: 'Signal Strength',
    signIn: 'Sign In',
    signingIn: 'Signing In...',
    signInToHealthcareDashboard: 'Sign in to your healthcare dashboard',
    signUp: 'Sign Up',
    smsOnly: 'SMS Only',
    smsVerification: 'SMS Verification',
    standby: 'Standby',
    start: 'Start',
    startCharging: 'Start Charging',
    startingHealthMonitoring: 'Starting health monitoring session...',
    startMeasurement: 'Start Measurement',
    startMeasurementToSeeData: 'Start a measurement to see data',
    startMonitoring: 'Start Monitoring',
    startTest: 'Start Test',
    status: 'Status',
    statusAndAlerts: 'Status & Alerts',
    stElevation: 'ST Elevation',
    stop: 'Stop',
    stopCharging: 'Stop Charging',
    stopMeasurement: 'Stop Measurement',
    stressLevel: 'Stress Level',
    success: 'Success',
    supportedVitalSigns: 'Supported Vital Signs',
    syncInformation: 'Sync Information',
    syncing: 'Syncing...',
    syncNow: 'Sync Now',
    systemAdministrator: 'System Administrator',
    systemStatus: 'System Status',
    systolic: 'Systolic',
    technologyServices: 'Technology Services',
    technologyServicesHealthcareSupport: '24/7 Tele H Technology Services - Healthcare Support',
    teleHAdmin247: '24/7 Tele H Admin',
    temperature: 'Temperature',
    temperatureHealthTip: 'Body temperature can vary throughout the day. Normal range is 36.1-37.2°C. Stay hydrated and dress appropriately for the weather.',
    temperatureMeasurement: 'Temperature Measurement',
    temperatureMonitor: 'Temperature Monitor',
    temperatureRanges: 'Temperature Ranges',
    thisMonth: 'this month',
    thisWeek: 'This Week',
    to: 'To',
    today: 'Today',
    totalPatients: 'Total Patients',
    totalReadings: 'Total Readings',
    troubleshooting: 'Troubleshooting',
    tryAdjustingSearchTerms: 'Try adjusting your search terms or category filter.',
    unknown: 'Unknown',
    updated: 'Updated successfully',
    uptime: 'Uptime',
    urgencyLevel: 'Urgency Level',
    verificationCode: 'Verification Code',
    verificationMethod: 'Verification Method',
    verified: 'Verified',
    verifyAndConnect: 'Verify & Connect',
    view: 'View',
    viewAction: 'View',
    viewDetails: 'View Details',
    viewFullHistory: 'View Full History',
    viewHistory: 'View History',
    viewPatient: 'View Patient',
    viewReports: 'View Reports',
    visualStepByStepInstructions: 'Visual step-by-step instructions',
    vitals: 'Vitals',
    vitalSigns: 'Vital Signs',
    vitalsToMonitor: 'Vitals to Monitor',
    warning: 'Warning',
    watchVideoGuide: 'Watch Video Guide',
    weeklyReport: 'Weekly Report',
    welcomeBack: 'Welcome Back',
    wide: 'Wide',
    yearsOld: 'years old',
    yes: 'Yes',
    yesterday: 'Yesterday',
  },
  ar: {
abnormal: 'غير طبيعي',
    abnormalVitals: 'علامات حيوية غير طبيعية',
    abuDhabiHospital: 'مستشفى أبوظبي/العيادة',
    accountCreatedSuccessfully: 'تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول للوصول إلى نظام المراقبة الصحية 24/7',
    actions: 'الإجراءات',
    activate: 'تفعيل',
    active: 'نشط',
    activeAlerts: 'التنبيهات النشطة',
    activeMonitoring: 'المراقبة النشطة',
    activeMonitors: 'الأجهزة النشطة',
    activePatients: 'المرضى النشطون',
    activeSchedules: 'الجداول النشطة',
    addDevice: 'إضافة جهاز',
    addPatient: 'إضافة مريض',
    adminDashboard: 'لوحة الإدارة',
    administrator: 'مدير',
    advancedAnalytics: 'التحليلات المتقدمة',
    advancedHealthcareSystem: 'نظام إدارة الرعاية الصحية المتقدم الذي يوفر مراقبة شاملة للمرضى، وتحليلات في الوقت الفعلي، وتكامل سلس مع الأجهزة الطبية.',
    age: 'العمر',
    agreeTermsConditions: 'أوافق على الشروط والأحكام',
    aiInsightsAndTrends: 'رؤى الذكاء الاصطناعي والاتجاهات',
    alerts: 'التنبيهات',
    allCategories: 'جميع الفئات',
    allergies: 'الحساسية',
    allHospitals: 'جميع المستشفيات',
    allStatus: 'جميع الحالات',
    allVitalSignsNormal: 'جميع العلامات الحيوية طبيعية',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    analytics: 'التحليلات',
    appSubtitle: 'بوابة مراقبة الرعاية الصحية',
    appTitle: 'خدمات تكنولوجيا الصحة 24/7',
    arrhythmia: 'عدم انتظام ضربات القلب',
    attention: 'انتباه',
    available24x7: 'متاح 24/7',
    averageHeartRate: 'متوسط معدل ضربات القلب',
    averageRR: 'متوسط RR',
    axisDeviation: 'انحراف المحور',
    backToDashboard: 'العودة إلى لوحة القيادة',
    backToRegistration: 'العودة للتسجيل',
    balance: 'توازن',
    battery: 'البطارية',
    batteryLevel: 'مستوى البطارية',
    batteryStatus: 'حالة البطارية',
    bedtime: 'وقت النوم',
    bloodGlucose: 'الجلوكوز في الدم',
    bloodGlucoseMeasurement: 'قياس الجلوكوز في الدم',
    bloodGlucoseMonitor: 'مراقب الجلوكوز في الدم',
    bloodOxygen: 'أكسجين الدم',
    bloodOxygenMeasurement: 'قياس الأكسجين في الدم',
    bloodOxygenMonitor: 'مراقب الأكسجين في الدم',
    bloodPressure: 'ضغط الدم',
    bloodPressureHealthTip: 'حافظ على ضغط الدم تحت السيطرة بنظام غذائي متوازن وتمارين منتظمة وتقليل الصوديوم وتقليل التوتر. ضغط الدم الطبيعي أقل من 120/80 ممHg.',
    bloodPressureMeasurement: 'قياس ضغط الدم',
    bloodPressureMonitor: 'مراقب ضغط الدم',
    bluetoothDevices: 'أجهزة البلوتوث',
    bpm: 'ضربة/دقيقة',
    breathsPerMin: 'نفس/الدقيقة',
    cancel: 'إلغاء',
    cardiacRhythm: 'إيقاع القلب',
    celsius: 'مئوي',
    charging: 'يتم الشحن',
    chargingStatus: 'حالة الشحن',
    checkupInterval: 'فترة الفحص',
    checkupSchedule: 'جدول الفحوصات',
    checkupScheduleCreated: 'تم إنشاء جدول الفحص بنجاح!',
    checkupScheduling: 'جدولة الفحوصات',
    chill: 'هادئ',
    choosePatient: 'اختر مريضاً...',
    clickToViewActivePatients: 'اضغط لعرض المرضى النشطين',
    clickToViewAllPatients: 'اضغط لعرض جميع المرضى',
    clickToViewAnalytics: 'اضغط لعرض التحليلات',
    clickToViewCriticalPatients: 'اضغط لعرض المرضى الحرجين',
    clinicalInterpretation: 'التفسير السريري',
    close: 'إغلاق',
    complete: 'مكتمل',
    completePatientInfo: 'معلومات المريض الكاملة والسجلات الصحية',
    complianceRate: 'معدل الالتزام',
    confirmDeleteSchedule: 'هل أنت متأكد من رغبتك في حذف هذا الجدول؟',
    confirmPassword: 'تأكيد كلمة المرور',
    connectDevice: 'ربط الجهاز',
    connected: 'متصل',
    connectedDevices: 'الأجهزة المتصلة',
    connectHc03Device: 'اتصال بجهاز HC03',
    connectHC03Devices: 'اربط أجهزة HC03 لمراقبة حالة البطارية',
    connecting: 'اتصال',
    connectionEstablished: 'تم تأسيس الاتصال',
    connectionFailed: 'فشل الاتصال',
    connectToExistingAccount: 'ربط الجهاز بحساب موجود',
    contact: 'متصل',
    contactAccess: 'الاتصال والوصول',
    contactInfo: 'معلومات الاتصال',
    contactQuality: 'جودة الاتصال',
    contactSupportTeam: 'اتصل بفريق الدعم',
    continueRegularMedication: 'تابع الجدول الدوائي المنتظم',
    createAccount: 'إنشاء حساب',
    createAccountSendOtp: 'إنشاء الحساب وإرسال رمز التحقق',
    createCheckupSchedule: 'إنشاء جدول فحص',
    createNewPatientProfile: 'إنشاء ملف مريض جديد',
    createSchedule: 'إنشاء جدول',
    creating: 'جاري الإنشاء...',
    creatingAccount: 'إنشاء الحساب...',
    critical: 'حرج',
    criticalAlert: 'تنبيه حرج',
    criticalAlerts: 'تنبيهات حرجة',
    criticalEcgFindings: 'نتائج حرجة في تخطيط القلب',
    currentReading: 'القراءة الحالية',
    currentStatus: 'الحالة الحالية',
    currentVitalSigns: 'العلامات الحيوية الحالية',
    dashboard: 'لوحة القيادة',
    dateOfBirth: 'تاريخ الميلاد',
    dateTime: 'التاريخ والوقت',
    deactivate: 'إلغاء التفعيل',
    delete: 'حذف',
    deleted: 'تم الحذف بنجاح',
    deletePatient: 'حذف المريض',
    detailedEcgAnalysis: 'تحليل مفصل لتخطيط القلب والتفسير الطبي',
    detected: 'مكتشف',
    deviceBattery: 'بطارية الجهاز',
    deviceBatteryLow: 'بطارية الجهاز منخفضة',
    deviceBatteryStatus: 'حالة بطارية الجهاز',
    deviceConnection: 'اتصال الجهاز',
    deviceConnections: 'اتصالات الأجهزة',
    deviceDetails: 'تفاصيل الجهاز',
    deviceGuidesAndHelp: 'أدلة الأجهزة والمساعدة',
    deviceId: 'معرف الجهاز',
    deviceInformation: 'معلومات الجهاز',
    deviceMonitoring: 'مراقبة الأجهزة',
    deviceName: 'اسم الجهاز',
    deviceOffline: 'الجهاز غير متصل',
    deviceRegistrationRequired: 'تسجيل الجهاز مطلوب',
    devices: 'الأجهزة',
    deviceSetup: 'إعداد الجهاز',
    deviceStatus: 'حالة الجهاز',
    diastolic: 'انبساطي',
    didntReceiveCode: 'لم تستلم الرمز؟',
    disconnectDevice: 'قطع الجهاز',
    disconnected: 'غير متصل',
    doctorNotes: 'ملاحظات الطبيب',
    dominantRhythm: 'الإيقاع المهيمن',
    dueNow: 'مستحق الآن',
    ecg: 'تخطيط القلب',
    ecgAnalysisReport: 'تقرير تحليل تخطيط القلب',
    ecgIntervals: 'فترات تخطيط القلب',
    ecgMeasurement: 'قياس تخطيط القلب',
    ecgMonitor: 'مراقب تخطيط القلب',
    ecgMonitors: 'أجهزة مراقبة القلب',
    edit: 'تعديل',
    editAction: 'تعديل',
    editPatient: 'تعديل المريض',
    elevated: 'مرتفع',
    email: 'البريد الإلكتروني',
    emailAddress: 'عنوان البريد الإلكتروني',
    emailAndSms: 'بريد إلكتروني ورسائل نصية',
    emailOnly: 'البريد الإلكتروني فقط',
    emailOrPatientId: 'البريد الإلكتروني أو رقم المريض',
    emailVerification: 'تحقق بالبريد الإلكتروني',
    emergencyContact: 'اتصال طارئ',
    enhancedScheduling: 'الجدولة المحسنة',
    enterEmailOrPatientId: 'أدخل بريدك الإلكتروني أو رقم المريض',
    enterPassword: 'أدخل كلمة المرور',
    enterSixDigitCode: 'أدخل الرمز المكون من 6 أرقام',
    error: 'خطأ',
    every: 'كل',
    excitation: 'إثارة',
    excitementAnxiety: 'إثارة/قلق',
    existingPatientLogin: 'دخول مريض موجود',
    export: 'تصدير',
    exportCSV: 'تصدير CSV',
    exportData: 'تصدير البيانات',
    exportReport: 'تصدير التقرير',
    failed: 'فشل',
    failedToCreateSchedule: 'فشل في إنشاء الجدول',
    failedToLoadDashboard: 'فشل في تحميل لوحة البيانات',
    failedToUpdatePatientStatus: 'فشل في تحديث حالة المريض',
    faqAndSupport: 'الأسئلة الشائعة والدعم',
    fasting: 'صيام',
    fever: 'حمى',
    filter: 'تصفية',
    firmware: 'البرنامج الثابت',
    firmwareVersion: 'إصدار البرنامج الثابت',
    firstName: 'الاسم الأول',
    followupRequired: 'المتابعة المطلوبة',
    forceSync: 'فرض المزامنة',
    forgotPassword: 'نسيت كلمة المرور؟',
    frequentlyAskedQuestions: 'الأسئلة الشائعة وتعليمات الأجهزة',
    from: 'من',
    full: 'ممتلئة',
    fullName: 'الاسم الكامل',
    generalUsage: 'الاستخدام العام',
    generateReport: 'إنشاء تقرير',
    glucoseMonitor: 'مراقب الجلوكوز',
    glucoseMonitors: 'أجهزة مراقبة الجلوكوز',
    good: 'جيدة',
    guestMode: 'استخدام كضيف (ميزات محدودة)',
    hc03Device: 'جهاز HC03',
    hc03DevicesOnline: 'أجهزة HC03 متصلة',
    hc03DeviceStatusManagement: 'حالة وإدارة أجهزة HC03',
    hc03StatusAndBattery: 'حالة HC03 والبطارية',
    healthcareDashboardEnabled: 'لوحة الرعاية الصحية مفعلة',
    healthcareManagementDashboard: 'لوحة إدارة الرعاية الصحية',
    healthcareMonitoringRegistration: 'تسجيل مراقبة الرعاية الصحية',
    healthcareSupport: 'خدمات تكنولوجيا الصحة 24/7 - دعم الرعاية الصحية',
    healthMonitoring: 'مراقبة الصحة',
    healthMonitoringStatus: 'حالة مراقبة الصحة',
    healthOverview: 'نظرة عامة على الصحة',
    healthStatus: 'الحالة الصحية',
    healthStatusOverview: 'نظرة عامة على الحالة الصحية',
    healthTips: 'نصائح صحية',
    healthTrends: 'اتجاهات الصحة',
    heartRate: 'معدل ضربات القلب',
    heartRateBPM: 'معدل ضربات القلب (ضربة/دقيقة)',
    heartRateHealthTip: 'حافظ على معدل ضربات قلب صحي من خلال التمارين المنتظمة وإدارة التوتر والنوم الكافي. معدل ضربات القلب الطبيعي أثناء الراحة هو 60-100 نبضة في الدقيقة.',
    heartRateMonitor: 'مراقب معدل ضربات القلب',
    heartRateVariability: 'تباين معدل ضربات القلب',
    helpAndSupport: 'المساعدة والدعم',
    high: 'عالي',
    highFever: 'حمى عالية',
    highRisk: 'عالي المخاطر',
    history: 'السجل',
    home: 'الرئيسية',
    hospital: 'المستشفى',
    hospitalAffiliation: 'الانتماء للمستشفى',
    hospitals: 'المستشفيات',
    hour: 'ساعة',
    hours: 'ساعات',
    hourTrend24: 'اتجاه 24 ساعة',
    hrRange: 'نطاق معدل القلب',
    hyperthermia: 'ارتفاع حرارة الجسم',
    hypothermia: 'انخفاض حرارة الجسم',
    inactive: 'غير نشط',
    inDays: 'خلال {days} يوم',
    inHours: 'خلال {hours} ساعة',
    interval: 'الفترة:',
    invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صحيح',
    invalidPhone: 'يرجى إدخال رقم هاتف صحيح',
    justNow: 'الآن',
    lastActivity: 'آخر نشاط',
    lastMeasurement: 'آخر قياس',
    lastMonth: 'الشهر الماضي',
    lastName: 'اسم العائلة',
    lastReading: 'آخر قراءة',
    lastSync: 'آخر مزامنة',
    lastUpdated: 'آخر تحديث',
    lastWeek: 'الأسبوع الماضي',
    latestReading: 'آخر قراءة',
    loading: 'جاري التحميل...',
    loadingDeviceInformation: 'جاري تحميل معلومات الأجهزة...',
    login: 'تسجيل الدخول',
    loginFailed: 'فشل في تسجيل الدخول',
    logout: 'تسجيل الخروج',
    low: 'منخفض',
    lowBattery: 'بطارية منخفضة',
    lowBatteryWarning: 'تحذير بطارية منخفضة - يرجى شحن الجهاز قريباً',
    lowest: 'الأقل',
    lowRisk: 'منخفض المخاطر',
    macAddress: 'عنوان MAC',
    managePatientDashboardAccess: 'إدارة وصول المرضى إلى لوحة المراقبة الصحية',
    managePatientMonitoringSchedules: 'إدارة جداول مراقبة المرضى',
    measurementCompleted: 'تم الانتهاء من القياس',
    measurementCount: 'عدد القياسات',
    measurementInProgress: 'القياس قيد التقدم',
    measurementStarted: 'تم بدء القياس',
    measuring: 'قياس',
    medicalHistory: 'التاريخ الطبي',
    medicationLog: 'سجل الأدوية',
    medications: 'الأدوية',
    mgdl: 'ملغ/دل',
    middleName: 'الاسم الأوسط',
    mildFever: 'حمى خفيفة',
    mmhg: 'ممHg',
    mmHg: 'ملم زئبق',
    mobileNumber: 'رقم الجوال',
    moderate: 'متوسط',
    monitor: 'مراقب',
    monitoring: 'المراقبة:',
    monitoring247: 'المراقبة',
    moodCategory: 'فئة المزاج',
    moodIndex: 'مؤشر المزاج',
    myHealthDashboard: 'لوحة المراقبة الصحية',
    needMoreHelp: 'تحتاج للمزيد من المساعدة؟',
    networkError: 'خطأ في الشبكة',
    newPatientRegistration: 'تسجيل مريض جديد',
    nextAppointment: 'الموعد القادم',
    nextCheckup: 'الفحص التالي:',
    no: 'لا',
    noContact: 'غير متصل',
    noData: 'لا توجد بيانات',
    noDevicesFound: 'لم يتم العثور على أجهزة',
    noFAQsFound: 'لم يتم العثور على أسئلة شائعة',
    noGlucoseReadings: 'لا توجد قراءات للجلوكوز',
    none: 'لا يوجد',
    noReadings: 'لا توجد قراءات',
    noRecentData: 'لا توجد بيانات حديثة',
    normal: 'طبيعي',
    normalStatus: 'طبيعي',
    noSchedulesCreated: 'لم يتم إنشاء جداول بعد',
    notAssigned: 'غير مخصص',
    notProvided: 'غير متوفر',
    notSpecified: 'غير محدد',
    offline: 'غير متصل',
    oneToFourHourIntervals: 'فترات 1-4 ساعات',
    online: 'متصل',
    other: 'أخرى',
    overallAssessment: 'التقييم العام',
    oxygen: 'الأكسجين',
    oxygenLevel: 'مستوى الأكسجين',
    oxygenLevelHealthTip: 'حافظ على مستويات أكسجين صحية بتمارين التنفس العميق والوضعية الجيدة. تشبع الأكسجين الطبيعي هو 95-100%.',
    password: 'كلمة المرور',
    passwordMinChars: 'كلمة المرور (6 أحرف على الأقل)',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة',
    passwordsNotMatch: 'كلمات المرور غير متطابقة',
    passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    patient: 'المريض',
    patientAssignment: 'تخصيص المريض',
    patientDetails: 'تفاصيل المريض',
    patientId: 'رقم المريض',
    patientIdHeader: 'رقم المريض',
    patientLogin: 'تسجيل دخول المريض',
    patientManagement: 'إدارة المرضى',
    patientName: 'اسم المريض',
    patientRegistration: 'تسجيل المريض',
    patients: 'المرضى',
    paused: 'متوقف',
    pendingVerification: 'في انتظار التحقق',
    percent: '%',
    percentage: '%',
    placeFinger: 'يرجى وضع إصبعك على مستشعر الجهاز',
    pleaseAcceptTerms: 'يرجى قبول الشروط والأحكام',
    pleaseSelectPatientAndVitals: 'يرجى اختيار مريض وعلامة حيوية واحدة على الأقل للمراقبة',
    pnn50: 'نسبة التباين',
    poor: 'ضعيف',
    portalAccess: 'الوصول إلى البوابة',
    postMeal: 'بعد الوجبة',
    prediabetic: 'مقدمات السكري',
    prInterval: 'فترة PR',
    privacyPolicy: 'سياسة الخصوصية',
    pWavePresent: 'وجود موجة P',
    qrsMorphology: 'شكل QRS',
    qrsWidth: 'عرض QRS',
    qtInterval: 'فترة QT',
    random: 'عشوائي',
    readings: 'قراءات',
    ready: 'جاهز',
    realtimeMonitoring: 'مراقبة في الوقت الفعلي مع اتجاهات 24 ساعة',
    realtimeVitalSigns: 'العلامات الحيوية في الوقت الفعلي من أجهزة HC03',
    receiveOtpEmail: 'استلام رمز التحقق عبر البريد الإلكتروني',
    receiveOtpSms: 'استلام رمز التحقق عبر الرسائل النصية',
    recentActivity: 'النشاط الأخير',
    recentReadings: 'القراءات الحديثة',
    recordingStatus: 'حالة التسجيل',
    refresh: 'تحديث',
    register: 'التسجيل',
    registrationDate: 'تاريخ التسجيل',
    registrationDetails: 'تفاصيل التسجيل:',
    registrationFailed: 'فشل في التسجيل',
    registrationStatus: 'حالة التسجيل',
    registrationSuccessful: 'تم التسجيل بنجاح!',
    relax: 'استرخاء',
    rememberMe: 'تذكرني',
    reminderPreference: 'تفضيل التذكير',
    reminders: 'التذكيرات:',
    removeFingerAndWait: 'قم بإزالة الإصبع والانتظار',
    reports: 'التقارير',
    reportSummary: 'ملخص التقرير',
    required: 'هذا الحقل مطلوب',
    requiresImmediateAttention: 'يتطلب اهتماماً فورياً',
    resendOtp: 'إعادة إرسال رمز التحقق',
    retry: 'إعادة المحاولة',
    rhythmAnalysis: 'تحليل الإيقاع',
    riskStratification: 'تصنيف المخاطر',
    rmssd: 'متوسط مربع الجذر',
    save: 'حفظ',
    saveChanges: 'حفظ التغييرات',
    saved: 'تم الحفظ بنجاح',
    scanning: 'بحث',
    scanningForDevices: 'البحث عن الأجهزة...',
    scheduleCheckup: 'جدولة فحص',
    sdnn: 'الانحراف المعياري',
    search: 'بحث',
    searchFAQs: 'البحث في الأسئلة الشائعة...',
    searchPatients: 'البحث عن المرضى',
    searchPatientsDots: 'البحث عن المرضى...',
    selectDeviceToViewDetails: 'اختر جهازاً لعرض التفاصيل',
    selectHospitalAbuDhabi: 'اختر مستشفى في أبوظبي',
    selectPatient: 'اختر مريض',
    settings: 'الإعدادات',
    setupPatientProfile: 'إعداد ملف المريض لبدء مراقبة الصحة مع جهاز HC03',
    share: 'مشاركة',
    signalStrength: 'قوة الإشارة',
    signIn: 'تسجيل الدخول',
    signingIn: 'جاري تسجيل الدخول...',
    signInToHealthcareDashboard: 'سجل دخولك إلى لوحة الرعاية الصحية',
    signUp: 'إنشاء حساب',
    smsOnly: 'رسائل نصية فقط',
    smsVerification: 'تحقق بالرسائل النصية',
    standby: 'في الانتظار',
    start: 'بدء',
    startCharging: 'بدء الشحن',
    startingHealthMonitoring: 'بدء جلسة المراقبة الصحية...',
    startMeasurement: 'بدء القياس',
    startMeasurementToSeeData: 'ابدأ قياساً لرؤية البيانات',
    startMonitoring: 'بدء المراقبة',
    startTest: 'بدء الاختبار',
    status: 'الحالة',
    statusAndAlerts: 'الحالة والتنبيهات',
    stElevation: 'ارتفاع ST',
    stop: 'إيقاف',
    stopCharging: 'إيقاف الشحن',
    stopMeasurement: 'إيقاف القياس',
    stressLevel: 'مستوى التوتر',
    success: 'نجح',
    supportedVitalSigns: 'العلامات الحيوية المدعومة',
    syncInformation: 'معلومات المزامنة',
    syncing: 'جاري المزامنة...',
    syncNow: 'مزامنة الآن',
    systemAdministrator: 'مدير النظام',
    systemStatus: 'حالة النظام',
    systolic: 'انقباضي',
    technologyServices: 'خدمات التكنولوجيا',
    technologyServicesHealthcareSupport: '24/7 Tele H خدمات التكنولوجيا - دعم الرعاية الصحية',
    teleHAdmin247: 'إدارة تليه 24/7',
    temperature: 'درجة الحرارة',
    temperatureHealthTip: 'يمكن أن تختلف درجة حرارة الجسم على مدار اليوم. النطاق الطبيعي هو 36.1-37.2°م. حافظ على رطوبة جسمك والبس ملابس مناسبة للطقس.',
    temperatureMeasurement: 'قياس درجة الحرارة',
    temperatureMonitor: 'مراقب درجة الحرارة',
    temperatureRanges: 'نطاقات درجة الحرارة',
    thisMonth: 'هذا الشهر',
    thisWeek: 'هذا الأسبوع',
    to: 'إلى',
    today: 'اليوم',
    totalPatients: 'إجمالي المرضى',
    totalReadings: 'إجمالي القراءات',
    troubleshooting: 'استكشاف الأخطاء',
    tryAdjustingSearchTerms: 'حاول تعديل مصطلحات البحث أو فلتر الفئة.',
    unknown: 'غير معروف',
    updated: 'تم التحديث بنجاح',
    uptime: 'وقت التشغيل',
    urgencyLevel: 'مستوى الإلحاح',
    verificationCode: 'رمز التحقق',
    verificationMethod: 'طريقة التحقق',
    verified: 'متحقق منه',
    verifyAndConnect: 'تحقق واتصال',
    view: 'عرض',
    viewAction: 'عرض',
    viewDetails: 'عرض التفاصيل',
    viewFullHistory: 'عرض التاريخ الكامل',
    viewHistory: 'عرض التاريخ',
    viewPatient: 'عرض المريض',
    viewReports: 'عرض التقارير',
    visualStepByStepInstructions: 'تعليمات مرئية خطوة بخطوة',
    vitals: 'العلامات الحيوية',
    vitalSigns: 'العلامات الحيوية',
    vitalsToMonitor: 'العلامات الحيوية للمراقبة',
    warning: 'تحذير',
    watchVideoGuide: 'شاهد دليل الفيديو',
    weeklyReport: 'التقرير الأسبوعي',
    welcomeBack: 'مرحباً بعودتك',
    wide: 'عريض',
    yearsOld: 'سنة',
    yes: 'نعم',
    yesterday: 'أمس',
  }};

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