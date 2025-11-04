import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

export interface Translation {
  abnormal: string;
  abnormalVitals: string;
  abuDhabiHospital: string;
  accountCreatedSuccessfully: string;
  actions: string;
  activate: string;
  active: string;
  activeAlerts: string;
  activeMonitoring: string;
  activeMonitors: string;
  activePatients: string;
  activeSchedules: string;
  addDevice: string;
  addPatient: string;
  adminDashboard: string;
  administrator: string;
  advancedAnalytics: string;
  advancedHealthcareSystem: string;
  age: string;
  agreeTermsConditions: string;
  aiInsightsAndTrends: string;
  alerts: string;
  allCategories: string;
  allHospitals: string;
  allStatus: string;
  allVitalSignsNormal: string;
  allergies: string;
  alreadyHaveAccount: string;
  analytics: string;
  appSubtitle: string;
  appTitle: string;
  arrhythmia: string;
  attention: string;
  available24x7: string;
  averageHeartRate: string;
  averageRR: string;
  axisDeviation: string;
  backToDashboard: string;
  backToRegistration: string;
  balance: string;
  battery: string;
  batteryLevel: string;
  batteryStatus: string;
  bedtime: string;
  bloodGlucose: string;
  bloodGlucoseMeasurement: string;
  bloodGlucoseMonitor: string;
  bloodOxygen: string;
  bloodOxygenMeasurement: string;
  bloodOxygenMonitor: string;
  bloodPressure: string;
  bloodPressureHealthTip: string;
  bloodPressureMeasurement: string;
  bloodPressureMonitor: string;
  bluetoothDevices: string;
  bpm: string;
  breathsPerMin: string;
  cancel: string;
  cardiacRhythm: string;
  celsius: string;
  charging: string;
  chargingStatus: string;
  checkupInterval: string;
  checkupSchedule: string;
  checkupScheduleCreated: string;
  checkupScheduling: string;
  chill: string;
  choosePatient: string;
  clickToViewActivePatients: string;
  clickToViewAllPatients: string;
  clickToViewAnalytics: string;
  clickToViewCriticalPatients: string;
  clinicalInterpretation: string;
  close: string;
  complete: string;
  completePatientInfo: string;
  complianceRate: string;
  confirmDeleteSchedule: string;
  confirmPassword: string;
  connectDevice: string;
  connectHC03Devices: string;
  connectHc03Device: string;
  connectToExistingAccount: string;
  connected: string;
  connectedDevices: string;
  connecting: string;
  connectionEstablished: string;
  connectionFailed: string;
  contact: string;
  contactAccess: string;
  contactInfo: string;
  contactQuality: string;
  contactSupportTeam: string;
  continueRegularMedication: string;
  createAccount: string;
  createAccountSendOtp: string;
  createCheckupSchedule: string;
  createNewPatientProfile: string;
  createSchedule: string;
  creating: string;
  creatingAccount: string;
  critical: string;
  criticalAlert: string;
  criticalAlerts: string;
  criticalEcgFindings: string;
  currentReading: string;
  currentStatus: string;
  currentVitalSigns: string;
  dashboard: string;
  dateOfBirth: string;
  dateTime: string;
  deactivate: string;
  delete: string;
  deletePatient: string;
  deleted: string;
  detailedEcgAnalysis: string;
  detected: string;
  deviceBattery: string;
  deviceBatteryLow: string;
  deviceBatteryStatus: string;
  deviceConnection: string;
  deviceConnections: string;
  deviceDetails: string;
  deviceGuidesAndHelp: string;
  deviceId: string;
  deviceInformation: string;
  deviceMonitoring: string;
  deviceName: string;
  deviceOffline: string;
  deviceRegistrationRequired: string;
  deviceSetup: string;
  deviceStatus: string;
  devices: string;
  diastolic: string;
  didntReceiveCode: string;
  disconnectDevice: string;
  disconnected: string;
  doctorNotes: string;
  dominantRhythm: string;
  dueNow: string;
  ecg: string;
  ecgAnalysisReport: string;
  ecgIntervals: string;
  ecgMeasurement: string;
  ecgMonitor: string;
  ecgMonitors: string;
  edit: string;
  editAction: string;
  editPatient: string;
  elevated: string;
  email: string;
  emailAddress: string;
  emailAndSms: string;
  emailOnly: string;
  emailOrPatientId: string;
  emailVerification: string;
  emergencyContact: string;
  enhancedScheduling: string;
  enterEmailOrPatientId: string;
  enterPassword: string;
  enterSixDigitCode: string;
  error: string;
  every: string;
  excitation: string;
  excitementAnxiety: string;
  existingPatientLogin: string;
  export: string;
  exportCSV: string;
  exportData: string;
  exportReport: string;
  failed: string;
  failedToCreateSchedule: string;
  failedToLoadDashboard: string;
  failedToUpdatePatientStatus: string;
  faqAndSupport: string;
  fasting: string;
  fever: string;
  filter: string;
  firmware: string;
  firmwareVersion: string;
  firstName: string;
  followupRequired: string;
  forceSync: string;
  forgotPassword: string;
  frequentlyAskedQuestions: string;
  from: string;
  full: string;
  fullName: string;
  generalUsage: string;
  generateReport: string;
  glucoseMonitor: string;
  glucoseMonitors: string;
  good: string;
  guestMode: string;
  hc03Device: string;
  hc03DeviceStatusManagement: string;
  hc03DevicesOnline: string;
  hc03StatusAndBattery: string;
  healthMonitoring: string;
  healthMonitoringStatus: string;
  healthOverview: string;
  healthStatus: string;
  healthStatusOverview: string;
  healthTips: string;
  healthTrends: string;
  healthcareDashboardEnabled: string;
  healthcareManagementDashboard: string;
  healthcareMonitoringRegistration: string;
  healthcareSupport: string;
  heartRate: string;
  heartRateBPM: string;
  heartRateHealthTip: string;
  heartRateMonitor: string;
  heartRateVariability: string;
  helpAndSupport: string;
  high: string;
  highFever: string;
  highRisk: string;
  history: string;
  home: string;
  hospital: string;
  hospitalAffiliation: string;
  hospitals: string;
  hour: string;
  hourTrend24: string;
  hours: string;
  hrRange: string;
  hyperthermia: string;
  hypothermia: string;
  inDays: string;
  inHours: string;
  inactive: string;
  interval: string;
  invalidEmail: string;
  invalidPhone: string;
  justNow: string;
  lastActivity: string;
  lastMeasurement: string;
  lastMonth: string;
  lastName: string;
  lastReading: string;
  lastSync: string;
  lastUpdated: string;
  lastWeek: string;
  latestReading: string;
  loading: string;
  loadingDeviceInformation: string;
  login: string;
  loginFailed: string;
  logout: string;
  low: string;
  lowBattery: string;
  lowBatteryWarning: string;
  lowRisk: string;
  lowest: string;
  macAddress: string;
  managePatientDashboardAccess: string;
  managePatientMonitoringSchedules: string;
  measurementCompleted: string;
  measurementCount: string;
  measurementInProgress: string;
  measurementStarted: string;
  measuring: string;
  medicalHistory: string;
  medicationLog: string;
  medications: string;
  mgdl: string;
  middleName: string;
  mildFever: string;
  mmHg: string;
  mmhg: string;
  mobileNumber: string;
  moderate: string;
  monitor: string;
  monitoring: string;
  monitoring247: string;
  moodCategory: string;
  moodIndex: string;
  myHealthDashboard: string;
  needMoreHelp: string;
  networkError: string;
  newPatientRegistration: string;
  nextAppointment: string;
  nextCheckup: string;
  no: string;
  noContact: string;
  noData: string;
  noDevicesFound: string;
  noFAQsFound: string;
  noGlucoseReadings: string;
  noReadings: string;
  noRecentData: string;
  noSchedulesCreated: string;
  none: string;
  normal: string;
  normalStatus: string;
  notAssigned: string;
  notProvided: string;
  notSpecified: string;
  offline: string;
  oneToFourHourIntervals: string;
  online: string;
  other: string;
  overallAssessment: string;
  oxygen: string;
  oxygenLevel: string;
  oxygenLevelHealthTip: string;
  pWavePresent: string;
  password: string;
  passwordMinChars: string;
  passwordTooShort: string;
  passwordsDoNotMatch: string;
  passwordsNotMatch: string;
  patient: string;
  patientAssignment: string;
  patientDetails: string;
  patientId: string;
  patientIdHeader: string;
  patientLogin: string;
  patientManagement: string;
  patientName: string;
  patientRegistration: string;
  patients: string;
  paused: string;
  pendingVerification: string;
  percent: string;
  percentage: string;
  placeFinger: string;
  pleaseAcceptTerms: string;
  pleaseSelectPatientAndVitals: string;
  pnn50: string;
  poor: string;
  portalAccess: string;
  postMeal: string;
  prInterval: string;
  prediabetic: string;
  privacyPolicy: string;
  qrsMorphology: string;
  qrsWidth: string;
  qtInterval: string;
  random: string;
  readings: string;
  ready: string;
  realtimeMonitoring: string;
  realtimeVitalSigns: string;
  receiveOtpEmail: string;
  receiveOtpSms: string;
  recentActivity: string;
  recentReadings: string;
  recordingStatus: string;
  refresh: string;
  register: string;
  registrationDate: string;
  registrationDetails: string;
  registrationFailed: string;
  registrationStatus: string;
  registrationSuccessful: string;
  relax: string;
  rememberMe: string;
  reminderPreference: string;
  reminders: string;
  removeFingerAndWait: string;
  reportSummary: string;
  reports: string;
  required: string;
  requiresImmediateAttention: string;
  resendOtp: string;
  retry: string;
  rhythmAnalysis: string;
  riskStratification: string;
  rmssd: string;
  save: string;
  saveChanges: string;
  saved: string;
  scanning: string;
  scanningForDevices: string;
  scheduleCheckup: string;
  sdnn: string;
  search: string;
  searchFAQs: string;
  searchPatients: string;
  searchPatientsDots: string;
  selectDeviceToViewDetails: string;
  selectHospitalAbuDhabi: string;
  selectPatient: string;
  settings: string;
  setupPatientProfile: string;
  share: string;
  signIn: string;
  signInToHealthcareDashboard: string;
  signUp: string;
  signalStrength: string;
  signingIn: string;
  smsOnly: string;
  smsVerification: string;
  stElevation: string;
  standby: string;
  start: string;
  startCharging: string;
  startMeasurement: string;
  startMeasurementToSeeData: string;
  startMonitoring: string;
  startTest: string;
  startingHealthMonitoring: string;
  status: string;
  statusAndAlerts: string;
  stop: string;
  stopCharging: string;
  stopMeasurement: string;
  stressLevel: string;
  success: string;
  supportedVitalSigns: string;
  syncInformation: string;
  syncNow: string;
  syncing: string;
  systemAdministrator: string;
  systemStatus: string;
  systolic: string;
  technologyServices: string;
  technologyServicesHealthcareSupport: string;
  teleHAdmin247: string;
  temperature: string;
  temperatureHealthTip: string;
  temperatureMeasurement: string;
  temperatureMonitor: string;
  temperatureRanges: string;
  thisMonth: string;
  thisWeek: string;
  to: string;
  today: string;
  totalPatients: string;
  totalReadings: string;
  troubleshooting: string;
  tryAdjustingSearchTerms: string;
  unknown: string;
  updated: string;
  uptime: string;
  urgencyLevel: string;
  verificationCode: string;
  verificationMethod: string;
  verified: string;
  verifyAndConnect: string;
  view: string;
  viewAction: string;
  viewDetails: string;
  viewFullHistory: string;
  viewHistory: string;
  viewPatient: string;
  viewReports: string;
  visualStepByStepInstructions: string;
  vitalSigns: string;
  vitals: string;
  vitalsToMonitor: string;
  warning: string;
  watchVideoGuide: string;
  weeklyReport: string;
  welcomeBack: string;
  wide: string;
  yearsOld: string;
  yes: string;
  yesterday: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    abnormal: 'Abnormal',
    abnormalVitals: 'Abnormal Vitals',
    abuDhabiHospital: 'Abu Dhabi Hospital/Clinic *',
    accountCreatedSuccessfully: 'Your account has been created successfully. You can now log in to access the 24/7 Health Monitor healthcare monitoring system.',
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
    allHospitals: 'All Hospitals',
    allStatus: 'All Status',
    allVitalSignsNormal: 'All Vital Signs Normal',
    allergies: 'Allergies',
    alreadyHaveAccount: 'Already have an account?',
    analytics: 'Analytics',
    appSubtitle: 'Healthcare Monitoring Portal',
    appTitle: '24/7 Health Monitor',
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
    connectHC03Devices: 'Connect HC03 devices to monitor battery status',
    connectHc03Device: 'Connect HC03 Device',
    connectToExistingAccount: 'Connect device to existing account',
    connected: 'Connected',
    connectedDevices: 'Connected Devices',
    connecting: 'Connecting',
    connectionEstablished: 'Connection established',
    connectionFailed: 'Connection failed',
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
    deletePatient: 'Delete Patient',
    deleted: 'Deleted successfully',
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
    deviceSetup: 'Device Setup',
    deviceStatus: 'Device Status',
    devices: 'Devices',
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
    hc03DeviceStatusManagement: 'HC03 Device Status & Management',
    hc03DevicesOnline: 'HC03 devices online',
    hc03StatusAndBattery: 'HC03 status & battery',
    healthMonitoring: 'Health Monitoring',
    healthMonitoringStatus: 'Health Monitoring Status',
    healthOverview: 'Health Overview',
    healthStatus: 'Health Status',
    healthStatusOverview: 'Health Status Overview',
    healthTips: 'Health Tips',
    healthTrends: 'Health Trends',
    healthcareDashboardEnabled: 'Healthcare Dashboard Enabled',
    healthcareManagementDashboard: 'Healthcare Management Dashboard',
    healthcareMonitoringRegistration: 'Healthcare Monitoring Registration',
    healthcareSupport: '24/7 Health Monitor - Healthcare Support',
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
    hourTrend24: '24-Hour Trend',
    hours: 'Hours',
    hrRange: 'HR Range',
    hyperthermia: 'Hyperthermia',
    hypothermia: 'Hypothermia',
    inDays: 'In {days} days',
    inHours: 'In {hours} hours',
    inactive: 'Inactive',
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
    lowRisk: 'Low Risk',
    lowest: 'Lowest',
    macAddress: 'MAC Address',
    managePatientDashboardAccess: 'Manage patient dashboard access for 24/7 Health Monitor',
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
    mmHg: 'mmHg',
    mmhg: 'mmHg',
    mobileNumber: 'Mobile Number',
    moderate: 'Moderate',
    monitor: 'Monitor',
    monitoring: 'Monitoring:',
    monitoring247: 'Monitoring',
    moodCategory: 'Mood Category',
    moodIndex: 'Mood Index',
    myHealthDashboard: '24/7 Health Monitor - My Health Dashboard',
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
    noReadings: 'No readings',
    noRecentData: 'No recent data',
    noSchedulesCreated: 'No schedules created yet',
    none: 'None',
    normal: 'Normal',
    normalStatus: 'Normal',
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
    pWavePresent: 'P-Wave Present',
    password: 'Password',
    passwordMinChars: 'Password (min. 6 characters) *',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordsDoNotMatch: 'Passwords do not match',
    passwordsNotMatch: 'Passwords do not match',
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
    prInterval: 'PR Interval',
    prediabetic: 'Prediabetic',
    privacyPolicy: 'Privacy Policy',
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
    reportSummary: 'Report Summary',
    reports: 'Reports',
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
    signIn: 'Sign In',
    signInToHealthcareDashboard: 'Sign in to your healthcare dashboard',
    signUp: 'Sign Up',
    signalStrength: 'Signal Strength',
    signingIn: 'Signing In...',
    smsOnly: 'SMS Only',
    smsVerification: 'SMS Verification',
    stElevation: 'ST Elevation',
    standby: 'Standby',
    start: 'Start',
    startCharging: 'Start Charging',
    startMeasurement: 'Start Measurement',
    startMeasurementToSeeData: 'Start a measurement to see data',
    startMonitoring: 'Start Monitoring',
    startTest: 'Start Test',
    startingHealthMonitoring: 'Starting health monitoring session...',
    status: 'Status',
    statusAndAlerts: 'Status & Alerts',
    stop: 'Stop',
    stopCharging: 'Stop Charging',
    stopMeasurement: 'Stop Measurement',
    stressLevel: 'Stress Level',
    success: 'Success',
    supportedVitalSigns: 'Supported Vital Signs',
    syncInformation: 'Sync Information',
    syncNow: 'Sync Now',
    syncing: 'Syncing...',
    systemAdministrator: 'System Administrator',
    systemStatus: 'System Status',
    systolic: 'Systolic',
    technologyServices: 'Technology Services',
    technologyServicesHealthcareSupport: '24/7 Health Monitor - Healthcare Support',
    teleHAdmin247: '24/7 Health Monitor Admin',
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
    vitalSigns: 'Vital Signs',
    vitals: 'Vitals',
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
    allHospitals: 'جميع المستشفيات',
    allStatus: 'جميع الحالات',
    allVitalSignsNormal: 'جميع العلامات الحيوية طبيعية',
    allergies: 'الحساسية',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    analytics: 'التحليلات',
    appSubtitle: 'بوابة مراقبة الرعاية الصحية',
    appTitle: 'جهاز مراقبة الصحة 24/7',
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
    connectHC03Devices: 'اربط أجهزة HC03 لمراقبة حالة البطارية',
    connectHc03Device: 'اتصال بجهاز HC03',
    connectToExistingAccount: 'ربط الجهاز بحساب موجود',
    connected: 'متصل',
    connectedDevices: 'الأجهزة المتصلة',
    connecting: 'اتصال',
    connectionEstablished: 'تم تأسيس الاتصال',
    connectionFailed: 'فشل الاتصال',
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
    deletePatient: 'حذف المريض',
    deleted: 'تم الحذف بنجاح',
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
    deviceSetup: 'إعداد الجهاز',
    deviceStatus: 'حالة الجهاز',
    devices: 'الأجهزة',
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
    hc03DeviceStatusManagement: 'حالة وإدارة أجهزة HC03',
    hc03DevicesOnline: 'أجهزة HC03 متصلة',
    hc03StatusAndBattery: 'حالة HC03 والبطارية',
    healthMonitoring: 'مراقبة الصحة',
    healthMonitoringStatus: 'حالة مراقبة الصحة',
    healthOverview: 'نظرة عامة على الصحة',
    healthStatus: 'الحالة الصحية',
    healthStatusOverview: 'نظرة عامة على الحالة الصحية',
    healthTips: 'نصائح صحية',
    healthTrends: 'اتجاهات الصحة',
    healthcareDashboardEnabled: 'لوحة الرعاية الصحية مفعلة',
    healthcareManagementDashboard: 'لوحة إدارة الرعاية الصحية',
    healthcareMonitoringRegistration: 'تسجيل مراقبة الرعاية الصحية',
    healthcareSupport: 'خدمات تكنولوجيا الصحة 24/7 - دعم الرعاية الصحية',
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
    hourTrend24: 'اتجاه 24 ساعة',
    hours: 'ساعات',
    hrRange: 'نطاق معدل القلب',
    hyperthermia: 'ارتفاع حرارة الجسم',
    hypothermia: 'انخفاض حرارة الجسم',
    inDays: 'خلال {days} يوم',
    inHours: 'خلال {hours} ساعة',
    inactive: 'غير نشط',
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
    lowRisk: 'منخفض المخاطر',
    lowest: 'الأقل',
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
    mmHg: 'ملم زئبق',
    mmhg: 'ممHg',
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
    noReadings: 'لا توجد قراءات',
    noRecentData: 'لا توجد بيانات حديثة',
    noSchedulesCreated: 'لم يتم إنشاء جداول بعد',
    none: 'لا يوجد',
    normal: 'طبيعي',
    normalStatus: 'طبيعي',
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
    pWavePresent: 'وجود موجة P',
    password: 'كلمة المرور',
    passwordMinChars: 'كلمة المرور (6 أحرف على الأقل)',
    passwordTooShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة',
    passwordsNotMatch: 'كلمات المرور غير متطابقة',
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
    prInterval: 'فترة PR',
    prediabetic: 'مقدمات السكري',
    privacyPolicy: 'سياسة الخصوصية',
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
    reportSummary: 'ملخص التقرير',
    reports: 'التقارير',
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
    signIn: 'تسجيل الدخول',
    signInToHealthcareDashboard: 'سجل دخولك إلى لوحة الرعاية الصحية',
    signUp: 'إنشاء حساب',
    signalStrength: 'قوة الإشارة',
    signingIn: 'جاري تسجيل الدخول...',
    smsOnly: 'رسائل نصية فقط',
    smsVerification: 'تحقق بالرسائل النصية',
    stElevation: 'ارتفاع ST',
    standby: 'في الانتظار',
    start: 'بدء',
    startCharging: 'بدء الشحن',
    startMeasurement: 'بدء القياس',
    startMeasurementToSeeData: 'ابدأ قياساً لرؤية البيانات',
    startMonitoring: 'بدء المراقبة',
    startTest: 'بدء الاختبار',
    startingHealthMonitoring: 'بدء جلسة المراقبة الصحية...',
    status: 'الحالة',
    statusAndAlerts: 'الحالة والتنبيهات',
    stop: 'إيقاف',
    stopCharging: 'إيقاف الشحن',
    stopMeasurement: 'إيقاف القياس',
    stressLevel: 'مستوى التوتر',
    success: 'نجح',
    supportedVitalSigns: 'العلامات الحيوية المدعومة',
    syncInformation: 'معلومات المزامنة',
    syncNow: 'مزامنة الآن',
    syncing: 'جاري المزامنة...',
    systemAdministrator: 'مدير النظام',
    systemStatus: 'حالة النظام',
    systolic: 'انقباضي',
    technologyServices: 'خدمات التكنولوجيا',
    technologyServicesHealthcareSupport: 'جهاز مراقبة الصحة 24/7 - دعم الرعاية الصحية',
    teleHAdmin247: 'إدارة مراقبة الصحة 24/7',
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
    vitalSigns: 'العلامات الحيوية',
    vitals: 'العلامات الحيوية',
    vitalsToMonitor: 'العلامات الحيوية للمراقبة',
    warning: 'تحذير',
    watchVideoGuide: 'شاهد دليل الفيديو',
    weeklyReport: 'التقرير الأسبوعي',
    welcomeBack: 'مرحباً بعودتك',
    wide: 'عريض',
    yearsOld: 'سنة',
    yes: 'نعم',
    yesterday: 'أمس',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translation) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof Translation): string => {
    return translations[language][key] || key as string;
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