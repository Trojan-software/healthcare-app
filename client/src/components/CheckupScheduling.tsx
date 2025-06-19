import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Clock,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  CheckCircle,
  Settings,
  Bell,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CheckupSchedule {
  id: string;
  patientId: string;
  vitalSigns: string[];
  interval: number; // hours
  nextCheckup: Date;
  isActive: boolean;
  createdAt: Date;
  lastCheckup?: Date;
  doctorRecommendation?: string;
}

interface VitalSignOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  normalRange: string;
}

export default function CheckupScheduling() {
  const [selectedVitals, setSelectedVitals] = useState<string[]>([]);
  const [selectedInterval, setSelectedInterval] = useState(4);
  const [doctorNote, setDoctorNote] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const vitalSignOptions: VitalSignOption[] = [
    {
      id: 'heartRate',
      name: 'Heart Rate',
      icon: <Heart className="w-5 h-5 text-red-500" />,
      description: 'Monitor heart rhythm and rate',
      normalRange: '60-100 BPM'
    },
    {
      id: 'bloodPressure',
      name: 'Blood Pressure',
      icon: <Activity className="w-5 h-5 text-blue-500" />,
      description: 'Systolic and diastolic pressure',
      normalRange: '120/80 mmHg'
    },
    {
      id: 'bloodOxygen',
      name: 'Blood Oxygen',
      icon: <Droplets className="w-5 h-5 text-cyan-500" />,
      description: 'Oxygen saturation levels',
      normalRange: '95-100%'
    },
    {
      id: 'temperature',
      name: 'Body Temperature',
      icon: <Thermometer className="w-5 h-5 text-orange-500" />,
      description: 'Core body temperature',
      normalRange: '36.1-37.2°C'
    }
  ];

  // Fetch existing schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['/api/checkup-schedules'],
    refetchInterval: 30000,
  });

  // Create new schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: Partial<CheckupSchedule>) => {
      // For now, simulate API call with mock response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, id: `SCH${Date.now()}` });
        }, 1000);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checkup-schedules'] });
      resetForm();
      toast({
        title: "Schedule Created",
        description: `New checkup schedule created successfully for ${selectedVitals.length} vital signs every ${selectedInterval} hours.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CheckupSchedule>) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checkup-schedules'] });
      setEditingSchedule(null);
      toast({
        title: "Schedule Updated",
        description: "Checkup schedule updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/checkup-schedules'] });
      toast({
        title: "Schedule Deleted",
        description: "Checkup schedule deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle schedule active status
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/checkup-schedules'] });
      toast({
        title: variables.isActive ? "Schedule Resumed" : "Schedule Paused",
        description: `Checkup schedule ${variables.isActive ? 'activated' : 'paused'} successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update schedule status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const mockSchedules: CheckupSchedule[] = (schedules as CheckupSchedule[]) || [
    {
      id: 'SCH001',
      patientId: 'PAT001',
      vitalSigns: ['heartRate', 'bloodPressure'],
      interval: 4,
      nextCheckup: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      isActive: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastCheckup: new Date(Date.now() - 4 * 60 * 60 * 1000),
      doctorRecommendation: 'Monitor blood pressure closely due to recent elevation'
    },
    {
      id: 'SCH002',
      patientId: 'PAT001',
      vitalSigns: ['temperature', 'bloodOxygen'],
      interval: 2,
      nextCheckup: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      isActive: true,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      lastCheckup: new Date(Date.now() - 2 * 60 * 60 * 1000),
      doctorRecommendation: 'Respiratory monitoring post-surgery'
    }
  ];

  const resetForm = () => {
    setSelectedVitals([]);
    setSelectedInterval(4);
    setDoctorNote('');
    setEditingSchedule(null);
  };

  const handleVitalToggle = (vitalId: string) => {
    setSelectedVitals(prev => 
      prev.includes(vitalId) 
        ? prev.filter(v => v !== vitalId)
        : [...prev, vitalId]
    );
  };

  const handleCreateSchedule = () => {
    if (selectedVitals.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one vital sign to monitor.",
        variant: "destructive",
      });
      return;
    }

    const scheduleData = {
      vitalSigns: selectedVitals,
      interval: selectedInterval,
      doctorRecommendation: doctorNote,
      isActive: true,
      nextCheckup: new Date(Date.now() + selectedInterval * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    createScheduleMutation.mutate(scheduleData);
  };

  const handleEditSchedule = (schedule: CheckupSchedule) => {
    setEditingSchedule(schedule.id);
    setSelectedVitals(schedule.vitalSigns);
    setSelectedInterval(schedule.interval);
    setDoctorNote(schedule.doctorRecommendation || '');
  };

  const handleUpdateSchedule = () => {
    if (!editingSchedule || selectedVitals.length === 0) return;

    updateScheduleMutation.mutate({
      id: editingSchedule,
      vitalSigns: selectedVitals,
      interval: selectedInterval,
      doctorRecommendation: doctorNote,
    });
  };

  const getTimeUntilNextCheckup = (nextCheckup: Date) => {
    const now = new Date();
    const diff = nextCheckup.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) return 'Overdue';
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getVitalIcon = (vitalId: string) => {
    const vital = vitalSignOptions.find(v => v.id === vitalId);
    return vital?.icon || <Activity className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          Check-up Scheduling
        </h2>
        <p className="text-gray-600 mt-1">Configure automated vital sign monitoring intervals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vital Signs Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Select Vital Signs to Monitor</h4>
              <div className="grid grid-cols-1 gap-3">
                {vitalSignOptions.map((vital) => (
                  <div
                    key={vital.id}
                    onClick={() => handleVitalToggle(vital.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedVitals.includes(vital.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {vital.icon}
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{vital.name}</h5>
                        <p className="text-sm text-gray-600">{vital.description}</p>
                        <p className="text-xs text-gray-500">Normal: {vital.normalRange}</p>
                      </div>
                      {selectedVitals.includes(vital.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interval Selection */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Check-up Interval</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setSelectedInterval(hours)}
                    className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                      selectedInterval === hours
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Every {hours}h</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor's Note */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Doctor's Recommendation (Optional)</h4>
              <textarea
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                placeholder="Add any specific instructions or notes for this monitoring schedule..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {editingSchedule ? (
                <>
                  <Button
                    onClick={handleUpdateSchedule}
                    disabled={selectedVitals.length === 0 || updateScheduleMutation.isPending}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update Schedule
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleCreateSchedule}
                  disabled={selectedVitals.length === 0 || createScheduleMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Active Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    schedule.isActive
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                        Every {schedule.interval}h
                      </Badge>
                      <Badge variant="outline">
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleScheduleMutation.mutate({
                          id: schedule.id,
                          isActive: !schedule.isActive
                        })}
                        disabled={toggleScheduleMutation.isPending}
                        className="p-2"
                      >
                        {schedule.isActive ? (
                          <Pause className="w-4 h-4 text-gray-600" />
                        ) : (
                          <Play className="w-4 h-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSchedule(schedule)}
                        className="p-2"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete this schedule? This action cannot be undone.`)) {
                            deleteScheduleMutation.mutate(schedule.id);
                          }
                        }}
                        disabled={deleteScheduleMutation.isPending}
                        className="p-2"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Monitoring:</span>
                      <div className="flex items-center gap-1">
                        {schedule.vitalSigns.map((vitalId) => (
                          <span key={vitalId} className="flex items-center gap-1">
                            {getVitalIcon(vitalId)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span>Next check-up: </span>
                      <span className="font-medium">
                        {getTimeUntilNextCheckup(schedule.nextCheckup)}
                      </span>
                    </div>

                    {schedule.lastCheckup && (
                      <div className="text-sm text-gray-600">
                        <span>Last check-up: </span>
                        <span className="font-medium">
                          {schedule.lastCheckup.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {schedule.doctorRecommendation && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Doctor's Note:</strong> {schedule.doctorRecommendation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {mockSchedules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active schedules</p>
                  <p className="text-sm">Create your first check-up schedule to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}