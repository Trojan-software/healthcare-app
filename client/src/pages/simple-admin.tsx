import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, LogOut, CheckCircle, AlertCircle } from "lucide-react";
import { handleApiError } from '@/lib/errorHandler';

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

export default function SimpleAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [createForm, setCreateForm] = useState({
    patientId: '',
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    mobileNumber: '',
    password: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/';
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        window.location.href = '/';
        return;
      }
      setUser(parsedUser);
      fetchPatients();
    } catch (error) {
      window.location.href = '/';
    }
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/patients', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      handleApiError('SimpleAdmin', 'fetchPatients', error as Error, {});
    } finally {
      setLoading(false);
    }
  };

  const createPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/create-patient', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });
      
      if (response.ok) {
        setMessage('Patient access created successfully');
        setCreateForm({
          patientId: '',
          email: '',
          firstName: '',
          lastName: '',
          username: '',
          mobileNumber: '',
          password: '',
        });
        setShowCreateForm(false);
        fetchPatients();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.message}`);
      }
    } catch (error) {
      setMessage('Failed to create patient access');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const togglePatientAccess = async (patientId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/patient/${patientId}/access`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });
      
      if (response.ok) {
        setMessage('Patient access updated successfully');
        fetchPatients();
      }
    } catch (error) {
      setMessage('Failed to update patient access');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.isVerified).length,
    inactivePatients: patients.filter(p => !p.isVerified).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage patient dashboard access for 24/7 Tele H</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Administrator</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Access</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive Access</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactivePatients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Patient Dashboard Access</h2>
                <p className="text-gray-600">Manage patient login credentials and dashboard access permissions</p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="button-add-patient"
              >
                <UserPlus className="w-4 h-4" />
                Create Patient Access
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Patient Dashboard Access</h3>
              <form onSubmit={createPatient} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Patient ID (e.g., TH-12345)"
                  value={createForm.patientId}
                  onChange={(e) => setCreateForm({...createForm, patientId: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  data-testid="input-patient-id"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  data-testid="input-email"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  data-testid="input-first-name"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  data-testid="input-last-name"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  data-testid="input-username"
                />
                <input
                  type="text"
                  placeholder="Mobile Number"
                  value={createForm.mobileNumber}
                  onChange={(e) => setCreateForm({...createForm, mobileNumber: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  data-testid="input-mobile-number"
                />
                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg col-span-2"
                  required
                  minLength={8}
                  data-testid="input-password-create"
                />
                <div className="col-span-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    data-testid="button-create-access-submit"
                  >
                    Create Access
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Patient List */}
          <div className="p-6">
            {patients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No patients found</p>
                <p className="text-sm text-gray-500">Create patient dashboard access to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {patient.email} • ID: {patient.patientId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        patient.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.isVerified ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => togglePatientAccess(patient.patientId, patient.isVerified)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          patient.isVerified
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        data-testid={`button-toggle-access-${patient.patientId}`}
                      >
                        {patient.isVerified ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}