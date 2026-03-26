import { apiRequest } from './client';

export interface VitalSign {
  id: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: string;
  oxygenLevel: number;
  bloodGlucose?: number;
  timestamp: string;
}

export interface PatientDashboardData {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    patientId: string;
    email: string;
    mobileNumber: string;
    hospitalId: string;
    age: string;
  };
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenLevel: number;
    bloodGlucose?: number;
    timestamp: string;
  };
  vitalsHistory: VitalSign[];
  healthScore: number;
  complianceRate: number;
  nextAppointment: string;
  lastCheckup: string;
  alerts: Alert[];
  checkupHistory: CheckupHistory[];
}

export interface Alert {
  id: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface CheckupHistory {
  id: number;
  date: string;
  provider: string;
  notes: string;
}

export interface ConsolidatedVitals {
  patientId: string;
  readings: VitalSign[];
}

export interface AdminDashboardData {
  totalPatients: number;
  activeAlerts: number;
  complianceRate: number;
  criticalPatients: number;
  recentPatients: PatientSummary[];
  alertsByType: Record<string, number>;
}

export interface PatientSummary {
  id: number;
  fullName: string;
  patientId: string;
  lastVitalTimestamp: string;
  healthScore: number;
  hasAlert: boolean;
  status: 'active' | 'inactive';
}

export async function getPatientDashboard(userId: number): Promise<PatientDashboardData> {
  return apiRequest<PatientDashboardData>(`/api/dashboard/patient/${userId}`);
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiRequest<AdminDashboardData>('/api/dashboard/admin');
}

export async function getConsolidatedVitals(
  patientId: string,
  from?: string,
  to?: string,
): Promise<VitalSign[]> {
  const params = new URLSearchParams({ patientId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiRequest<VitalSign[]>(`/api/vital-signs/consolidated?${params}`);
}

export async function getPatients(): Promise<PatientSummary[]> {
  return apiRequest<PatientSummary[]>('/api/patients');
}
