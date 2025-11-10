import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Users, UserPlus, Shield, Activity, AlertCircle, CheckCircle, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHC03DeviceManager from "./AdminHC03DeviceManager";

const createPatientSchema = z.object({
  patientId: z.string().min(3, "Patient ID must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type CreatePatientData = z.infer<typeof createPatientSchema>;

interface Patient {
  id: number;
  patientId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  mobileNumber: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreatePatientData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      patientId: '',
      email: '',
      firstName: '',
      lastName: '',
      username: '',
      mobileNumber: '',
      password: '',
    },
  });

  // Fetch all patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['/api/admin/patients'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/patients', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      return response.json();
    },
  });

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (data: CreatePatientData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/create-patient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Patient access created",
        description: "Patient dashboard access has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients'] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create patient access",
        variant: "destructive",
      });
    },
  });

  // Update patient access mutation
  const updateAccessMutation = useMutation({
    mutationFn: async ({ patientId, isActive }: { patientId: string; isActive: boolean }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/patient/${patientId}/access`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update patient access');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Access updated",
        description: "Patient access status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/patients'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient access",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePatientData) => {
    createPatientMutation.mutate(data);
  };

  const togglePatientAccess = (patientId: string, currentStatus: boolean) => {
    updateAccessMutation.mutate({ patientId, isActive: !currentStatus });
  };

  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter((p: Patient) => p.isVerified).length,
    inactivePatients: patients.filter((p: Patient) => !p.isVerified).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage patient dashboard access for 24/7 Tele H</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Administrator</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Access</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactive Access</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactivePatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="patients" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="patients">Patient Management</TabsTrigger>
              <TabsTrigger value="devices">Device Management</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
            </TabsList>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Patient Access
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Patient Dashboard Access</DialogTitle>
                  <DialogDescription>
                    Create login credentials for a patient to access their health dashboard
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="TH-12345" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Doe" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="patient@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="patient_username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1234567890" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="Enter secure password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPatientMutation.isPending}
                        className="flex-1"
                      >
                        {createPatientMutation.isPending ? "Creating..." : "Create Access"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle>Patient Dashboard Access</CardTitle>
                <CardDescription>
                  Manage patient login credentials and dashboard access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Loading patients...</p>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No patients found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Create patient dashboard access to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patients.map((patient: Patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {patient.email} • ID: {patient.patientId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={patient.isVerified ? "default" : "secondary"}>
                            {patient.isVerified ? "Active" : "Inactive"}
                          </Badge>
                          <Switch
                            checked={patient.isVerified}
                            onCheckedChange={() => togglePatientAccess(patient.patientId, patient.isVerified)}
                            disabled={updateAccessMutation.isPending}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <AdminHC03DeviceManager 
              onDeviceSelect={(device) => {
                console.log('Selected device:', device);
                // Optional: Handle device selection for detailed view
              }}
            />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  Recent admin activities and patient access changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Activity logging coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}