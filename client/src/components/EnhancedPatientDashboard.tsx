import React, { useState, useEffect } from 'react';
import { handleApiError } from '@/lib/errorHandler';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Droplets, 
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  Battery,
  Wifi,
  Monitor
} from 'lucide-react';
// import VitalsChart from './VitalsChart';
import BloodGlucoseWidget from './BloodGlucoseWidget';
import BatteryWidget from './BatteryWidget';
import EcgWidget from './EcgWidget';
import HC03DeviceManager from './HC03DeviceManager';
import HeartRateModal from './HeartRateModal';
import BloodPressureModal from './BloodPressureModal';
import TemperatureModal from './TemperatureModal';
import OxygenLevelModal from './OxygenLevelModal';

interface VitalSigns {
  id: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperature: string;
  oxygenLevel: number;
  bloodGlucose?: number;
  timestamp: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  patientId: string;
  email: string;
  mobileNumber: string;
  hospitalId: string;
  fullName: string;
  age: string;
}

interface PatientDashboardData {
  user: User;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenLevel: number;
    bloodGlucose?: number;
    timestamp: string;
  };
  vitalsHistory: VitalSigns[];
  healthScore: number;
  complianceRate: number;
  nextAppointment: string;
  lastCheckup: string;
  alerts: any[];
  checkupHistory: any[];
}

interface EnhancedPatientDashboardProps {
  userId: number;
  onLogout: () => void;
}

export default function EnhancedPatientDashboard({ userId, onLogout }: EnhancedPatientDashboardProps) {
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalSigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVitalType, setSelectedVitalType] = useState('all');
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [error, setError] = useState('');

  // Modal states
  const [heartRateModalOpen, setHeartRateModalOpen] = useState(false);
  const [bloodPressureModalOpen, setBloodPressureModalOpen] = useState(false);
  const [temperatureModalOpen, setTemperatureModalOpen] = useState(false);
  const [oxygenLevelModalOpen, setOxygenLevelModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  useEffect(() => {
    if (dashboardData?.user?.patientId) {
      loadVitalsHistory();
    }
  }, [dashboardData]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard/patient/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError('Network error loading dashboard');
      handleApiError('EnhancedPatientDashboard', 'loadDashboardData', err as Error, { userId });
    } finally {
      setLoading(false);
    }
  };

  const loadVitalsHistory = async () => {
    try {
      if (dashboardData?.user?.patientId) {
        // Loading vitals for patient (logged via structured system)
        const response = await fetch(`/api/vital-signs/${dashboardData.user.patientId}`);
        if (response.ok) {
          const history = await response.json();
          // Vitals history loaded successfully
          setVitalsHistory(history);
        } else {
          handleApiError('EnhancedPatientDashboard', 'loadVitalsHistory', new Error(`Failed to load vitals history: ${response.status}`), { patientId: dashboardData.user.patientId });
        }
      } else {
        // No patient ID available for vitals loading
      }
    } catch (err) {
      handleApiError('EnhancedPatientDashboard', 'loadVitalsHistory', err as Error, { patientId: dashboardData?.user?.patientId });
    }
  };

  const getFilteredVitals = () => {
    if (!vitalsHistory.length) return [];

    let filtered = [...vitalsHistory];

    // Date filtering using custom date range
    if (fromDate && toDate) {
      const fromDateTime = new Date(fromDate + 'T00:00:00');
      const toDateTime = new Date(toDate + 'T23:59:59');
      
      filtered = filtered.filter(vital => {
        const vitalDate = new Date(vital.timestamp);
        return vitalDate >= fromDateTime && vitalDate <= toDateTime;
      });
    }

    // Filter by vital type
    if (selectedVitalType !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(vital => {
        switch (selectedVitalType) {
          case 'heartRate':
            return vital.heartRate != null && vital.heartRate > 0;
          case 'bloodPressure':
            const hasBloodPressure = (vital.bloodPressureSystolic != null && vital.bloodPressureSystolic > 0) && 
                   (vital.bloodPressureDiastolic != null && vital.bloodPressureDiastolic > 0);
            // Blood pressure filter applied
            return hasBloodPressure;
          case 'temperature':
            return vital.temperature != null && vital.temperature !== '';
          case 'oxygenLevel':
            return vital.oxygenLevel != null && vital.oxygenLevel > 0;
          case 'bloodGlucose':
            return vital.bloodGlucose != null && vital.bloodGlucose > 0;
          default:
            return true;
        }
      });
      // Filtering completed successfully
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered.slice(0, 50); // Limit to 50 most recent
  };

  const getVitalTrend = (vitalType: string) => {
    const filtered = getFilteredVitals();
    if (filtered.length < 2) return 'stable';

    let values: number[] = [];
    
    switch (vitalType) {
      case 'heartRate':
        values = filtered.map(v => v.heartRate).filter(v => v != null);
        break;
      case 'bloodPressure':
        values = filtered.map(v => v.bloodPressureSystolic).filter(v => v != null);
        break;
      case 'temperature':
        values = filtered.map(v => parseFloat(v.temperature)).filter(v => !isNaN(v));
        break;
      case 'oxygenLevel':
        values = filtered.map(v => v.oxygenLevel).filter(v => v != null);
        break;
      case 'bloodGlucose':
        values = filtered.map(v => v.bloodGlucose).filter(v => v != null);
        break;
      default:
        return 'stable';
    }

    if (values.length < 2) return 'stable';

    const recent = values.slice(0, Math.min(5, values.length));
    const older = values.slice(Math.min(5, values.length), Math.min(10, values.length));

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent > 5) return 'improving';
    if (changePercent < -5) return 'declining';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVitalStatus = (vital: VitalSigns) => {
    const issues = [];
    
    if (vital.heartRate && (vital.heartRate > 100 || vital.heartRate < 60)) {
      issues.push('Heart Rate');
    }
    if (vital.bloodPressureSystolic && vital.bloodPressureDiastolic && 
        (vital.bloodPressureSystolic > 140 || vital.bloodPressureDiastolic > 90)) {
      issues.push('Blood Pressure');
    }
    if (vital.temperature && (parseFloat(vital.temperature) > 37.5 || parseFloat(vital.temperature) < 36.0)) {
      issues.push('Temperature');
    }
    if (vital.oxygenLevel && vital.oxygenLevel < 95) {
      issues.push('Oxygen Level');
    }

    if (issues.length === 0) return { status: 'Normal', color: 'bg-green-100 text-green-800' };
    if (issues.length === 1) return { status: 'Attention', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Critical', color: 'bg-red-100 text-red-800' };
  };



  const handleVitalMonitor = (vitalType: string) => {
    switch (vitalType) {
      case 'heartRate':
        setHeartRateModalOpen(true);
        break;
      case 'bloodPressure':
        setBloodPressureModalOpen(true);
        break;
      case 'temperature':
        setTemperatureModalOpen(true);
        break;
      case 'oxygenLevel':
        setOxygenLevelModalOpen(true);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading patient dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
            <button 
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              data-testid="button-retry-dashboard"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H9l3-4 3 4h-1v4z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">24/7 Tele H Patient</h1>
                <p className="text-blue-100">Welcome, {dashboardData.user.firstName} {dashboardData.user.lastName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">ID: {dashboardData.user.patientId}</p>
                <p className="text-blue-100 text-sm">Last updated: {formatTimestamp(dashboardData.vitals.timestamp)}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
                data-testid="button-logout-patient"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Vitals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleVitalMonitor('heartRate')}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.heartRate}</div>
                <div className="text-blue-100 text-sm">Heart Rate (BPM)</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('heartRate'))}`}>
                  {getTrendIcon(getVitalTrend('heartRate'))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleVitalMonitor('bloodPressure')}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.bloodPressure}</div>
                <div className="text-green-100 text-sm">Blood Pressure</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('bloodPressure'))}`}>
                  {getTrendIcon(getVitalTrend('bloodPressure'))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleVitalMonitor('temperature')}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.temperature}°C</div>
                <div className="text-pink-100 text-sm">Temperature</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('temperature'))}`}>
                  {getTrendIcon(getVitalTrend('temperature'))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleVitalMonitor('oxygenLevel')}>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.oxygenLevel}%</div>
                <div className="text-purple-100 text-sm">Oxygen Level</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('oxygenLevel'))}`}>
                  {getTrendIcon(getVitalTrend('oxygenLevel'))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Overview */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Health Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Health Score</span>
                <span className="font-medium">{dashboardData.healthScore}/100</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Compliance Rate</span>
                <span className="font-medium">{dashboardData.complianceRate}%</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Checkup</span>
                <span className="font-medium">{dashboardData.lastCheckup}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Next Appointment</span>
                <span className="font-medium">{dashboardData.nextAppointment}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Connection Status Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                HC03 Device Connection Status
              </h3>
              <p className="text-blue-700">Your assigned medical monitoring device</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600 mb-1">Patient ID</div>
              <div className="font-mono text-lg font-bold text-blue-900">{dashboardData?.user?.patientId}</div>
            </div>
          </div>
        </div>

        {/* Health Monitoring Widgets */}
        <div className="space-y-6 mt-6">
          {/* HC03 Device Connection Manager - Full Width */}
          <HC03DeviceManager 
            patientId={dashboardData?.user?.patientId || ''} 
          />
          
          {/* ECG Monitor - Full Width */}
          <EcgWidget 
            deviceId="HC03-003"
            patientId={dashboardData?.user?.patientId || ''} 
            showControls={true}
            compact={false}
          />
          
          {/* Blood Glucose and Battery - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BloodGlucoseWidget 
              patientId={dashboardData?.user?.patientId || ''} 
              showControls={true}
              compact={false}
            />
            <BatteryWidget 
              patientId={dashboardData?.user?.patientId || ''} 
              compact={false}
            />
          </div>
        </div>

        {/* Vitals History with Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Vitals History ({vitalsHistory.length} records)</h3>
            <div className="flex space-x-4 items-center">
              <select
                value={selectedVitalType}
                onChange={(e) => setSelectedVitalType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Vitals</option>
                <option value="heartRate">Heart Rate</option>
                <option value="bloodPressure">Blood Pressure</option>
                <option value="temperature">Temperature</option>
                <option value="oxygenLevel">Oxygen Level</option>
                <option value="bloodGlucose">Blood Glucose Monitor</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">From:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">To:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Pressure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oxygen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Glucose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredVitals().map((vital) => {
                  const status = getVitalStatus(vital);
                  return (
                    <tr key={vital.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(vital.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.heartRate || 'N/A'} BPM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.bloodPressureSystolic && vital.bloodPressureDiastolic 
                          ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}` 
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.temperature ? `${vital.temperature}°C` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.oxygenLevel ? `${vital.oxygenLevel}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {getFilteredVitals().length === 0 && vitalsHistory.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                No vital signs data available for the selected period.
                <br />
                <small>Total records: {vitalsHistory.length}, Date range: {fromDate} to {toDate}</small>
              </div>
            )}
            {vitalsHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No vital signs data available. Loading...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Vital Sign Modals */}
      <HeartRateModal
        isOpen={heartRateModalOpen}
        onClose={() => setHeartRateModalOpen(false)}
        currentHeartRate={dashboardData?.vitals?.heartRate || 0}
        vitalsHistory={vitalsHistory}
        deviceId="HC03-002"
      />
      
      <BloodPressureModal
        isOpen={bloodPressureModalOpen}
        onClose={() => setBloodPressureModalOpen(false)}
        currentBloodPressure={dashboardData?.vitals?.bloodPressure || '120/80'}
        vitalsHistory={vitalsHistory}
        deviceId="HC03-001"
      />
      
      <TemperatureModal
        isOpen={temperatureModalOpen}
        onClose={() => setTemperatureModalOpen(false)}
        currentTemperature={dashboardData?.vitals?.temperature || 36.5}
        vitalsHistory={vitalsHistory}
        deviceId="HC03-004"
      />
      
      <OxygenLevelModal
        isOpen={oxygenLevelModalOpen}
        onClose={() => setOxygenLevelModalOpen(false)}
        currentOxygenLevel={dashboardData?.vitals?.oxygenLevel || 98}
        vitalsHistory={vitalsHistory}
        deviceId="HC03-003"
      />
    </div>
  );
}