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
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch hospitals list
  const { data: hospitalsData } = useQuery({
    queryKey: ['/api/hospitals/abudhabi'],
    retry: false
  });

  const hospitals: Hospital[] = (hospitalsData as any)?.hospitals || [];

  // Fetch patients with filters
  const { data: patientsData, isLoading: loadingPatients, error: patientsError } = useQuery({
    queryKey: ['/api/admin/patients'],
    retry: false
  });

  // Fetch patient statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/patients/stats'],
    retry: false
  });

  const stats: PatientStats = (statsData as any)?.stats || { total: 0, active: 0, inactive: 0, registeredToday: 0, byHospital: {} };
  const patients: Patient[] = (patientsData as any)?.patients || [];

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
                <Button>
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
                  <th className="text-left p-3 font-medium text-gray-700">Patient</th>
                  <th className="text-left p-3 font-medium text-gray-700">Contact</th>
                  <th className="text-left p-3 font-medium text-gray-700">Hospital</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Created</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.firstName} {patient.middleName && `${patient.middleName} `}{patient.lastName}
                        </p>
                        <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm text-gray-900">{patient.email}</p>
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
                      <p className="text-sm text-gray-900">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            toast({
                              title: "Patient Details",
                              description: `Viewing details for ${patient.firstName} ${patient.lastName} (${patient.patientId})`,
                            });
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const patientData = `Patient Information:
Name: ${patient.firstName} ${patient.middleName || ''} ${patient.lastName}
Patient ID: ${patient.patientId}
Email: ${patient.email}
Mobile: ${patient.mobileNumber}
Hospital: ${hospitals.find(h => h.id === patient.hospitalId)?.name || patient.hospitalId}
Status: ${patient.isActive ? 'Active' : 'Inactive'}
Created: ${new Date(patient.createdAt).toLocaleString()}
Last Activity: ${new Date(patient.lastActivity).toLocaleString()}`;

                            const blob = new Blob([patientData], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `patient-${patient.patientId}-details.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                            
                            toast({
                              title: "Export Complete",
                              description: `Patient details exported for ${patient.firstName} ${patient.lastName}`,
                            });
                          }}
                        >
                          Export
                        </Button>
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
    </div>
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
        <Label htmlFor="hospitalId">Hospital *</Label>
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
                {hospital.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Patient"}
        </Button>
      </div>
    </form>
  );
}