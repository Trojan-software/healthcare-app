import { apiRequest } from './client';

export interface LoginCredentials {
  emailOrPatientId: string;
  password: string;
}

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  patientId: string;
  mobileNumber: string;
  hospitalId: string;
  age: string;
  role: 'patient' | 'admin';
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  message?: string;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', 'POST', credentials);
}
