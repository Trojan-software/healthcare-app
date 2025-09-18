import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Users, UserCheck, UserX, Calendar, Download, Key, MoreHorizontal } from 'lucide-react';
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
  dateOfBirth?: string;
}

interface PatientFormData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  hospitalId: string;
  dateOfBirth: string;
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
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch hospitals list
  const { data: hospitalsData } = useQuery({
    queryKey: ['/api/hospitals/abudhabi'],
    retry: false
  });

  const hospitals: Hospital[] = (hospitalsData as any)?.hospitals || [
    // Major Government Hospitals
    { id: "SEHA", name: "Sheikh Khalifa Medical City", location: "Abu Dhabi", type: "Government Hospital" },
    { id: "MAFRAQ", name: "Mafraq Hospital", location: "Abu Dhabi", type: "Government Hospital" },
    { id: "ALZAHRA", name: "Al Zahra Hospital", location: "Sharjah", type: "Private Hospital" },
    { id: "CORNICHE", name: "Corniche Hospital", location: "Abu Dhabi", type: "Government Hospital" },
    { id: "ALAIN", name: "Al Ain Hospital", location: "Al Ain", type: "Government Hospital" },
    { id: "TAWAM", name: "Tawam Hospital", location: "Al Ain", type: "Government Hospital" },
    
    // Private Hospitals
    { id: "CLEVELANAD", name: "Cleveland Clinic Abu Dhabi", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "BURJEEL", name: "Burjeel Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "MEDICLINIC", name: "Mediclinic City Hospital", location: "Dubai", type: "Private Hospital" },
    { id: "NMC", name: "NMC Royal Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "ZAYED", name: "Zayed Military Hospital", location: "Abu Dhabi", type: "Military Hospital" },
    { id: "DANAT", name: "Danat Al Emarat Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    
    // Specialized Clinics
    { id: "ALRAZI", name: "Al Razi Medical Complex", location: "Abu Dhabi", type: "Medical Complex" },
    { id: "LIFECARE", name: "LifeCare Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "ABUDHABI_EYE", name: "Abu Dhabi Eye Hospital", location: "Abu Dhabi", type: "Specialized Hospital" },
    { id: "ORTHOSPORTS", name: "Orthosports Medical Center", location: "Abu Dhabi", type: "Sports Medicine Clinic" },
    { id: "ALWAHDA", name: "Al Wahda Medical Center", location: "Abu Dhabi", type: "Medical Center" },
    { id: "MEDEOR", name: "Medeor Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    
    // Primary Healthcare Centers
    { id: "KHALIFA_CITY", name: "Khalifa City Health Center", location: "Abu Dhabi", type: "Primary Healthcare" },
    { id: "MUSAFFAH", name: "Musaffah Health Center", location: "Abu Dhabi", type: "Primary Healthcare" },
    { id: "AIRPORT_ROAD", name: "Airport Road Health Center", location: "Abu Dhabi", type: "Primary Healthcare" },
    { id: "ALBATEEN", name: "Al Bateen Health Center", location: "Abu Dhabi", type: "Primary Healthcare" },
    { id: "SHAKHBOUT", name: "Shakhbout Medical City", location: "Abu Dhabi", type: "Academic Medical Center" },
    
    // Women's & Children's Hospitals
    { id: "LATIFA", name: "Latifa Women and Children Hospital", location: "Dubai", type: "Specialized Hospital" },
    { id: "SANDY", name: "Sandy Medical Center", location: "Abu Dhabi", type: "Women's Health Clinic" },
    { id: "MOTHERS", name: "Mothers & Children Hospital", location: "Abu Dhabi", type: "Specialized Hospital" },
    
    // Rehabilitation Centers
    { id: "REHAB_ABD", name: "Abu Dhabi Rehabilitation Hospital", location: "Abu Dhabi", type: "Rehabilitation Center" },
    { id: "PHYSIO_PLUS", name: "Physio Plus Rehabilitation", location: "Abu Dhabi", type: "Physiotherapy Clinic" },
    
    // Dental & Aesthetic Clinics
    { id: "AMERICAN_DENTAL", name: "American Dental Center", location: "Abu Dhabi", type: "Dental Clinic" },
    { id: "ASTER_CLINIC", name: "Aster Clinic", location: "Abu Dhabi", type: "Multi-specialty Clinic" },
    { id: "BLISS_CLINIC", name: "Bliss Medical Center", location: "Abu Dhabi", type: "Aesthetic Clinic" }
  ];

  // Fetch patients with filters
  const { data: patientsData, isLoading: loadingPatients, error: patientsError } = useQuery({
    queryKey: ['/api/admin/patients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/patients');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      return response.json();
    },
    retry: false
  });

  // Fetch patient statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/patients/stats'],
    retry: false
  });

  const stats: PatientStats = (statsData as any)?.stats || { total: 0, active: 0, inactive: 0, registeredToday: 0, byHospital: {} };
  const allPatients: Patient[] = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.patients || [];

  // Filter patients based on search query, hospital, and status
  const filteredPatients = allPatients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.toLowerCase().trim();
    const searchLower = searchQuery.toLowerCase().trim();
    
    // Search filter
    const matchesSearch = searchQuery === '' || 
      fullName.includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.patientId.toLowerCase().includes(searchLower);
    
    // Hospital filter
    const matchesHospital = selectedHospital === 'all' || patient.hospitalId === selectedHospital;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && patient.isActive) ||
      (statusFilter === 'inactive' && !patient.isActive);
    
    return matchesSearch && matchesHospital && matchesStatus;
  });

  const patients = filteredPatients;

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: PatientFormData) => {
      return await apiRequest('/api/admin/patients', 'POST', patientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients/stats'] });
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Patient account created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create patient account",
        variant: "destructive",
      });
    },
  });

  const handleCreatePatient = (formData: PatientFormData) => {
    createPatientMutation.mutate(formData);
  };

  // Export patient data as JSON
  const handleExportPatient = (patient: Patient) => {
    const exportData = {
      patientId: patient.patientId,
      personalInfo: {
        firstName: patient.firstName,
        middleName: patient.middleName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        email: patient.email,
        mobileNumber: patient.mobileNumber,
      },
      medicalInfo: {
        hospitalId: patient.hospitalId,
        hospitalName: hospitals.find(h => h.id === patient.hospitalId)?.name || patient.hospitalId,
        isActive: patient.isActive,
        registrationDate: patient.createdAt,
        lastActivity: patient.lastActivity,
      },
      exportDate: new Date().toISOString(),
      exportedBy: 'admin@24x7teleh.com'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `patient_${patient.patientId}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Patient Data Exported",
      description: `Patient data for ${patient.firstName} ${patient.lastName} has been exported successfully.`,
    });
  };

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (patientId: string) => {
      return await apiRequest(`/api/patients/${patientId}/reset-password`, 'POST');
    },
    onSuccess: (data: any) => {
      toast({
        title: "Password Reset Successful",
        description: `New temporary password: ${data.temporaryPassword}. Please share this with the patient securely.`,
      });
      setShowResetPasswordDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset patient password",
        variant: "destructive",
      });
    },
  });

  // Helper function to highlight search text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  if (loadingPatients) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (patientsError) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <UserX className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Failed to load patient data</p>
          <p className="text-sm text-gray-600 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Patients</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.registeredToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Management Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patient Management
            </CardTitle>
            
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-patient">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Patient Account</DialogTitle>
                </DialogHeader>
                <CreatePatientForm
                  hospitals={hospitals}
                  onSubmit={handleCreatePatient}
                  isLoading={createPatientMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search patients by name, email, or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Hospitals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hospitals</SelectItem>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Patients Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-medium text-gray-700">Patient ID</th>
                  <th className="text-left p-3 font-medium text-gray-700">Patient</th>
                  <th className="text-left p-3 font-medium text-gray-700">Date of Birth</th>
                  <th className="text-left p-3 font-medium text-gray-700">Contact</th>
                  <th className="text-left p-3 font-medium text-gray-700">Hospital</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-medium text-blue-600">
                        {highlightText(patient.patientId, searchQuery)}
                      </p>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {highlightText(
                            `${patient.firstName} ${patient.middleName ? `${patient.middleName} ` : ''}${patient.lastName}`,
                            searchQuery
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-gray-900">
                        {patient.dateOfBirth ? 
                          new Date(patient.dateOfBirth).toLocaleDateString() : 
                          'Not specified'
                        }
                      </p>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          {highlightText(patient.email, searchQuery)}
                        </p>
                        <p className="text-sm text-gray-600">{patient.mobileNumber}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-gray-900">
                        {hospitals.find(h => h.id === patient.hospitalId)?.name || patient.hospitalId}
                      </p>
                    </td>
                    <td className="p-3">
                      <Badge variant={patient.isActive ? "default" : "secondary"}>
                        {patient.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowViewDialog(true);
                          }}
                          data-testid={`button-view-patient-${patient.id}`}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowEditDialog(true);
                          }}
                          data-testid={`button-edit-patient-${patient.id}`}
                        >
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" data-testid={`button-patient-actions-${patient.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExportPatient(patient)}>
                              <Download className="w-4 h-4 mr-2" />
                              Export Data
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedPatient(patient);
                              setShowResetPasswordDialog(true);
                            }}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {patients.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No patients found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Patient Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg font-semibold">{selectedPatient.firstName} {selectedPatient.middleName || ''} {selectedPatient.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient ID</Label>
                  <p className="text-lg font-semibold">{selectedPatient.patientId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-lg">{selectedPatient.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Mobile Number</Label>
                  <p className="text-lg">{selectedPatient.mobileNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Hospital</Label>
                  <p className="text-lg">{hospitals.find(h => h.id === selectedPatient.hospitalId)?.name || selectedPatient.hospitalId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={selectedPatient.isActive ? "default" : "secondary"}>
                    {selectedPatient.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Registration Date</Label>
                  <p className="text-lg">{new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Activity</Label>
                  <p className="text-lg">{new Date(selectedPatient.lastActivity).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowViewDialog(false)} data-testid="button-close-view">
                  Close
                </Button>
                <Button onClick={() => {
                  setShowViewDialog(false);
                  setShowEditDialog(true);
                }} data-testid="button-edit-from-view">
                  Edit Patient
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <EditPatientForm 
              patient={selectedPatient}
              hospitals={hospitals}
              onSubmit={async (updatedData) => {
                try {
                  await apiRequest(`/api/patients/${selectedPatient.id}`, 'PUT', updatedData);
                  
                  toast({
                    title: "Patient Updated",
                    description: `Patient ${selectedPatient.firstName} ${selectedPatient.lastName} has been updated successfully.`,
                  });
                  setShowEditDialog(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
                } catch (error) {
                  toast({
                    title: "Update Failed",
                    description: "Failed to update patient information.",
                    variant: "destructive"
                  });
                }
              }}
              onCancel={() => setShowEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Patient Password</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Key className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Password Reset Confirmation
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        Are you sure you want to reset the password for:
                      </p>
                      <p className="font-semibold mt-1">
                        {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.patientId})
                      </p>
                      <p className="mt-2">
                        A new temporary password will be generated and should be shared with the patient securely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResetPasswordDialog(false)}
                  data-testid="button-cancel-reset"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => resetPasswordMutation.mutate(selectedPatient.id.toString())}
                  disabled={resetPasswordMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Patient Form Component
function EditPatientForm({ 
  patient, 
  hospitals, 
  onSubmit, 
  onCancel 
}: { 
  patient: Patient; 
  hospitals: Hospital[]; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: patient.firstName,
    middleName: patient.middleName || '',
    lastName: patient.lastName,
    email: patient.email,
    mobileNumber: patient.mobileNumber,
    hospitalId: patient.hospitalId,
    isActive: patient.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="middleName">Middle Name</Label>
          <Input
            id="middleName"
            value={formData.middleName}
            onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="mobileNumber">Mobile Number *</Label>
          <Input
            id="mobileNumber"
            value={formData.mobileNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="hospitalId">Hospital *</Label>
          <Select value={formData.hospitalId} onValueChange={(value) => setFormData(prev => ({ ...prev, hospitalId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Hospital" />
            </SelectTrigger>
            <SelectContent>
              {hospitals.map((hospital) => (
                <SelectItem key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="w-4 h-4"
        />
        <Label htmlFor="isActive">Active Patient</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-edit">
          Cancel
        </Button>
        <Button type="submit" data-testid="button-update-patient">
          Update Patient
        </Button>
      </div>
    </form>
  );
}

// Create Patient Form Component
function CreatePatientForm({ 
  hospitals, 
  onSubmit, 
  isLoading 
}: { 
  hospitals: Hospital[]; 
  onSubmit: (data: PatientFormData) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="middleName">Middle Name</Label>
        <Input
          id="middleName"
          value={formData.middleName}
          onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="mobileNumber">Mobile Number *</Label>
        <Input
          id="mobileNumber"
          value={formData.mobileNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
          placeholder="+971 50 123 4567"
          required
        />
      </div>

      <div>
        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="hospitalId">Hospital / Clinic *</Label>
        <Select 
          value={formData.hospitalId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, hospitalId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Hospital" />
          </SelectTrigger>
          <SelectContent>
            {hospitals.map((hospital) => (
              <SelectItem key={hospital.id} value={hospital.id}>
                {hospital.name} - {hospital.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading} data-testid="button-create-patient">
          {isLoading ? "Creating..." : "Create Patient"}
        </Button>
      </div>
    </form>
  );
}