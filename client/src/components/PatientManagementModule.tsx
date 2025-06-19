import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Users, UserCheck, UserX, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: number;
  patientId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  hospitalId: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  role: string;
}

interface PatientFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  hospitalId: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
  medicalHistory?: string;
}

interface Hospital {
  id: string;
  name: string;
  location: string;
  type: string;
}

interface PatientStats {
  total: number;
  active: number;
  inactive: number;
  registeredToday: number;
  byHospital: Record<string, number>;
}

export default function PatientManagementModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch hospitals list
  const { data: hospitalsData } = useQuery({
    queryKey: ['/api/hospitals/abudhabi'],
    retry: false
  });

  const hospitals: Hospital[] = hospitalsData?.hospitals || [];

  // Fetch patients with filters
  const { data: patientsData, isLoading: loadingPatients, error: patientsError } = useQuery({
    queryKey: ['/api/admin/patients', searchQuery, selectedHospital, statusFilter, currentPage],
    retry: false
  });

  // Fetch patient statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/patients/stats'],
    retry: false
  });

  const stats: PatientStats = statsData?.stats || { total: 0, active: 0, inactive: 0, registeredToday: 0, byHospital: {} };
  const patients: Patient[] = patientsData?.patients || [];

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: PatientFormData) => {
      const response = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create patient');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients/stats'] });
      setShowCreateForm(false);
    }
  });

  // Toggle patient access mutation
  const toggleAccessMutation = useMutation({
    mutationFn: async ({ patientId, isActive }: { patientId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/patients/${patientId}/toggle-access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!response.ok) throw new Error('Failed to update patient access');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients/stats'] });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await fetch(`/api/admin/patients/${patientId}/reset-password`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return response.json();
    },
    onSuccess: (data) => {
      alert(`Password reset successful. New temporary password: ${data.tempPassword}`);
    }
  });

  const handleCreatePatient = (formData: PatientFormData) => {
    createPatientMutation.mutate(formData);
  };

  const handleToggleAccess = (patient: Patient) => {
    toggleAccessMutation.mutate({
      patientId: patient.patientId,
      isActive: !patient.isActive
    });
  };

  const handleResetPassword = (patient: Patient) => {
    if (confirm(`Reset password for ${patient.firstName} ${patient.lastName}?`)) {
      resetPasswordMutation.mutate(patient.patientId);
    }
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
  };

  const styles = {
    container: {
      padding: '2rem',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: '0 0 0.5rem 0'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1rem',
      margin: 0
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1e293b',
      margin: 0
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#64748b',
      margin: '0.25rem 0 0 0'
    },
    filtersSection: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
    },
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      alignItems: 'end'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      backgroundColor: 'white'
    },
    button: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    buttonSecondary: {
      padding: '0.5rem 1rem',
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: '1px solid #3b82f6',
      borderRadius: '6px',
      fontSize: '0.75rem',
      cursor: 'pointer'
    },
    buttonDanger: {
      padding: '0.5rem 1rem',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.75rem',
      cursor: 'pointer'
    },
    patientsTable: {
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    th: {
      backgroundColor: '#f8fafc',
      padding: '1rem',
      textAlign: 'left' as const,
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f3f4f6'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto'
    }
  };

  if (patientsError) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.header, textAlign: 'center', color: '#ef4444' }}>
          <h2>Error Loading Patient Management</h2>
          <p>Failed to load patient data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.title}>Patient Management</h1>
            <p style={styles.subtitle}>Manage patient accounts and monitor health data</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            style={styles.button}
          >
            + Add New Patient
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Patients</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#10b981' }}>{stats.active}</div>
          <div style={styles.statLabel}>Active Patients</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#f59e0b' }}>{stats.inactive}</div>
          <div style={styles.statLabel}>Inactive Patients</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: '#3b82f6' }}>{stats.registeredToday}</div>
          <div style={styles.statLabel}>Registered Today</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersGrid}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Search Patients
            </label>
            <input
              type="text"
              placeholder="Search by name, email, or patient ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Hospital
            </label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              style={styles.select}
            >
              <option value="">All Hospitals</option>
              {hospitals.map(hospital => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              style={styles.select}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedHospital('');
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              style={{ ...styles.button, backgroundColor: '#6b7280' }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div style={styles.patientsTable}>
        {loadingPatients ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', color: '#6b7280' }}>Loading patients...</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Patient ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Mobile</th>
                <th style={styles.th}>Hospital</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patientsData?.patients?.map((patient: Patient) => (
                <tr key={patient.id}>
                  <td style={styles.td}>{patient.patientId}</td>
                  <td style={styles.td}>
                    {patient.firstName} {patient.middleName} {patient.lastName}
                  </td>
                  <td style={styles.td}>{patient.email}</td>
                  <td style={styles.td}>{patient.mobileNumber}</td>
                  <td style={styles.td}>
                    {hospitals.find(h => h.id === patient.hospitalId)?.name || patient.hospitalId}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: patient.isActive ? '#dcfce7' : '#fee2e2',
                      color: patient.isActive ? '#166534' : '#dc2626'
                    }}>
                      {patient.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleViewDetails(patient)}
                        style={styles.buttonSecondary}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleToggleAccess(patient)}
                        style={{
                          ...styles.buttonSecondary,
                          color: patient.isActive ? '#ef4444' : '#10b981',
                          borderColor: patient.isActive ? '#ef4444' : '#10b981'
                        }}
                      >
                        {patient.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(patient)}
                        style={styles.buttonDanger}
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {patientsData?.patients?.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', color: '#6b7280' }}>No patients found</div>
          </div>
        )}

        {/* Pagination */}
        {patientsData?.pagination && patientsData.pagination.totalPages > 1 && (
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                ...styles.button,
                backgroundColor: currentPage === 1 ? '#9ca3af' : '#3b82f6'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '0.75rem', color: '#6b7280' }}>
              Page {currentPage} of {patientsData.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === patientsData.pagination.totalPages}
              style={{
                ...styles.button,
                backgroundColor: currentPage === patientsData.pagination.totalPages ? '#9ca3af' : '#3b82f6'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Patient Modal */}
      {showCreateForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Add New Patient</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <CreatePatientForm
              hospitals={hospitals}
              onSubmit={handleCreatePatient}
              onCancel={() => setShowCreateForm(false)}
              isLoading={createPatientMutation.isPending}
              error={createPatientMutation.error?.message}
            />
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Patient Details</h2>
              <button
                onClick={() => setShowPatientDetails(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <PatientDetailsView patient={selectedPatient} hospitals={hospitals} />
          </div>
        </div>
      )}
    </div>
  );
}

// Create Patient Form Component
interface CreatePatientFormProps {
  hospitals: Hospital[];
  onSubmit: (data: PatientFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

function CreatePatientForm({ hospitals, onSubmit, onCancel, isLoading, error }: CreatePatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobileNumber: '+971',
    hospitalId: '',
    dateOfBirth: '',
    gender: undefined,
    emergencyContact: '',
    medicalHistory: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>First Name *</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Last Name *</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Middle Name</label>
        <input
          type="text"
          value={formData.middleName || ''}
          onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Email *</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Mobile Number *</label>
        <input
          type="tel"
          required
          value={formData.mobileNumber}
          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
          style={inputStyle}
          placeholder="+971XXXXXXXXX"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Hospital *</label>
        <select
          required
          value={formData.hospitalId}
          onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
          style={{ ...inputStyle, backgroundColor: 'white' }}
        >
          <option value="">Select Hospital</option>
          {hospitals.map(hospital => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Creating...' : 'Create Patient'}
        </button>
      </div>
    </form>
  );
}

// Patient Details View Component
interface PatientDetailsViewProps {
  patient: Patient;
  hospitals: Hospital[];
}

function PatientDetailsView({ patient, hospitals }: PatientDetailsViewProps) {
  const hospital = hospitals.find(h => h.id === patient.hospitalId);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Patient ID</label>
          <div style={{ fontWeight: '500' }}>{patient.patientId}</div>
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Status</label>
          <div style={{ fontWeight: '500', color: patient.isActive ? '#10b981' : '#ef4444' }}>
            {patient.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>First Name</label>
          <div style={{ fontWeight: '500' }}>{patient.firstName}</div>
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Last Name</label>
          <div style={{ fontWeight: '500' }}>{patient.lastName}</div>
        </div>
      </div>

      {patient.middleName && (
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Middle Name</label>
          <div style={{ fontWeight: '500' }}>{patient.middleName}</div>
        </div>
      )}

      <div>
        <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email</label>
        <div style={{ fontWeight: '500' }}>{patient.email}</div>
      </div>

      <div>
        <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Mobile Number</label>
        <div style={{ fontWeight: '500' }}>{patient.mobileNumber}</div>
      </div>

      <div>
        <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Hospital</label>
        <div style={{ fontWeight: '500' }}>{hospital?.name || patient.hospitalId}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Created</label>
          <div style={{ fontWeight: '500' }}>
            {new Date(patient.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>Last Activity</label>
          <div style={{ fontWeight: '500' }}>
            {new Date(patient.lastActivity).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}