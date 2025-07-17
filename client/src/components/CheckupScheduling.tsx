import React, { useState, useEffect } from 'react';
import { handleApiError } from '@/lib/errorHandler';

interface ScheduleSettings {
  patientId: string;
  vitalsToMonitor: string[];
  checkupInterval: number; // in hours
  isActive: boolean;
  nextCheckup: string;
  reminderPreference: 'email' | 'sms' | 'both';
}

interface CheckupSchedulingProps {
  patientId?: string;
  onClose?: () => void;
}

export default function CheckupScheduling({ patientId, onClose }: CheckupSchedulingProps) {
  const [schedules, setSchedules] = useState<ScheduleSettings[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(patientId || '');
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleSettings>>({
    vitalsToMonitor: ['heartRate'],
    checkupInterval: 4,
    isActive: true,
    reminderPreference: 'email'
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const availableVitals = [
    { id: 'heartRate', name: 'Heart Rate', icon: '❤️' },
    { id: 'bloodPressure', name: 'Blood Pressure', icon: '🩺' },
    { id: 'temperature', name: 'Temperature', icon: '🌡️' },
    { id: 'oxygenLevel', name: 'Oxygen Level', icon: '🫁' },
    { id: 'bloodGlucose', name: 'Blood Glucose', icon: '🩸' }
  ];

  const intervalOptions = [
    { value: 1, label: '1 Hour' },
    { value: 2, label: '2 Hours' },
    { value: 3, label: '3 Hours' },
    { value: 4, label: '4 Hours' },
    { value: 6, label: '6 Hours' },
    { value: 8, label: '8 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' }
  ];

  useEffect(() => {
    loadPatients();
    loadSchedules();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      handleApiError('CheckupScheduling', 'loadPatients', error as Error);
    }
  };

  const loadSchedules = async () => {
    try {
      // In production, this would load existing schedules from API
      const mockSchedules: ScheduleSettings[] = [
        {
          patientId: 'PT001',
          vitalsToMonitor: ['heartRate', 'bloodPressure'],
          checkupInterval: 4,
          isActive: true,
          nextCheckup: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          reminderPreference: 'email'
        },
        {
          patientId: 'PT149898',
          vitalsToMonitor: ['heartRate', 'temperature', 'oxygenLevel'],
          checkupInterval: 2,
          isActive: false,
          nextCheckup: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          reminderPreference: 'both'
        }
      ];
      setSchedules(mockSchedules);
    } catch (error) {
      handleApiError('CheckupScheduling', 'loadSchedules', error as Error);
    }
  };

  const createSchedule = async () => {
    if (!selectedPatient || !newSchedule.vitalsToMonitor?.length) {
      alert('Please select a patient and at least one vital sign to monitor');
      return;
    }

    setLoading(true);
    try {
      const schedule: ScheduleSettings = {
        patientId: selectedPatient,
        vitalsToMonitor: newSchedule.vitalsToMonitor || [],
        checkupInterval: newSchedule.checkupInterval || 4,
        isActive: true,
        nextCheckup: new Date(Date.now() + (newSchedule.checkupInterval || 4) * 60 * 60 * 1000).toISOString(),
        reminderPreference: newSchedule.reminderPreference || 'email'
      };

      // In production, this would be sent to API
      setSchedules(prev => [...prev, schedule]);
      
      // Reset form
      setNewSchedule({
        vitalsToMonitor: ['heartRate'],
        checkupInterval: 4,
        isActive: true,
        reminderPreference: 'email'
      });
      setSelectedPatient('');

      alert('Checkup schedule created successfully!');
    } catch (error) {
      handleApiError('CheckupScheduling', 'createSchedule', error as Error);
      alert('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = async (patientId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.patientId === patientId 
        ? { ...schedule, isActive: !schedule.isActive }
        : schedule
    ));
  };

  const deleteSchedule = async (patientId: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(prev => prev.filter(schedule => schedule.patientId !== patientId));
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.patientId === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
  };

  const formatNextCheckup = (nextCheckup: string) => {
    const date = new Date(nextCheckup);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Due now';
    if (diffHours < 24) return `In ${diffHours} hours`;
    const diffDays = Math.floor(diffHours / 24);
    return `In ${diffDays} days`;
  };

  const renderContent = () => (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Schedule */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create Checkup Schedule</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient
              </label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vitals to Monitor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableVitals.map((vital) => (
                  <label key={vital.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSchedule.vitalsToMonitor?.includes(vital.id) || false}
                      onChange={(e) => {
                        const vitals = newSchedule.vitalsToMonitor || [];
                        if (e.target.checked) {
                          setNewSchedule(prev => ({
                            ...prev,
                            vitalsToMonitor: [...vitals, vital.id]
                          }));
                        } else {
                          setNewSchedule(prev => ({
                            ...prev,
                            vitalsToMonitor: vitals.filter(v => v !== vital.id)
                          }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">{vital.icon} {vital.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Checkup Interval
              </label>
              <select
                value={newSchedule.checkupInterval}
                onChange={(e) => setNewSchedule(prev => ({ 
                  ...prev, 
                  checkupInterval: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {intervalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Every {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Preference
              </label>
              <select
                value={newSchedule.reminderPreference}
                onChange={(e) => setNewSchedule(prev => ({ 
                  ...prev, 
                  reminderPreference: e.target.value as 'email' | 'sms' | 'both'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="email">Email Only</option>
                <option value="sms">SMS Only</option>
                <option value="both">Email & SMS</option>
              </select>
            </div>

            <button
              onClick={createSchedule}
              disabled={loading || !selectedPatient}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-all"
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </div>

        {/* Existing Schedules */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Schedules ({schedules.length})</h3>
          
          <div className="space-y-4">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>No schedules created yet</p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.patientId}
                  className={`border rounded-lg p-4 ${
                    schedule.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {getPatientName(schedule.patientId)}
                      </h4>
                      <p className="text-sm text-gray-600">ID: {schedule.patientId}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleSchedule(schedule.patientId)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.patientId)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Interval:</span>
                      <p className="font-medium">Every {schedule.checkupInterval} hours</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Checkup:</span>
                      <p className="font-medium">{formatNextCheckup(schedule.nextCheckup)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-gray-500 text-sm">Monitoring:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {schedule.vitalsToMonitor.map((vitalId) => {
                        const vital = availableVitals.find(v => v.id === vitalId);
                        return (
                          <span
                            key={vitalId}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {vital?.icon} {vital?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Reminders:</span>
                    <span className="ml-1 font-medium capitalize">{schedule.reminderPreference}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold mb-2">Checkup Scheduling</h2>
                <p className="text-green-100">Manage patient monitoring schedules</p>
              </div>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  return renderContent();
}