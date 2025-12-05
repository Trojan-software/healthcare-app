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
import HC03DeviceWidget from './HC03DeviceWidget';
import { useLanguage, LanguageSwitcher } from '@/lib/i18n';

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
  const { t, isRTL } = useLanguage();
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalSigns[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string>('');
  const [isEcgInProgress, setIsEcgInProgress] = useState(false);
  const [isBpInProgress, setIsBpInProgress] = useState(false);
  const [isGlucoseInProgress, setIsGlucoseInProgress] = useState(false);
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState<number>(0);
  const [currentChargingStatus, setCurrentChargingStatus] = useState<boolean>(false);
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
  
  // Modal state for detailed views
  const [selectedMetric, setSelectedMetric] = useState<'heartRate' | 'bloodPressure' | 'temperature' | 'oxygenLevel' | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  useEffect(() => {
    if (dashboardData?.user?.patientId) {
      loadVitalsHistory();
    }
  }, [dashboardData]);

  // Save vital signs to backend after measurement
  const saveVitalSignsToBackend = async (measurementData: any, patientId: string) => {
    if (!patientId) return;
    
    try {
      const vitalSignData: any = {
        patientId,
        timestamp: measurementData.timestamp || new Date().toISOString()
      };
      
      // Map measurement data to vital signs API format - WITH VALIDATION
      if (measurementData.type === 'ecg' && measurementData.value?.hr) {
        // Validate heart rate is in physiological range (40-200 bpm)
        const hr = measurementData.value.hr;
        if (hr >= 40 && hr <= 180) {
          vitalSignData.heartRate = hr;
        } else {
          console.warn(`Invalid ECG heart rate: ${hr} bpm - not saving`);
          return; // Don't save invalid measurements
        }
      } else if (measurementData.type === 'bloodOxygen') {
        // Only save blood oxygen data if we have VALID physiological values
        const spo2 = measurementData.value?.bloodOxygen;
        const hr = measurementData.value?.heartRate;
        
        // Validate SpO2 (70-100%) and HR (40-180 bpm)
        const validSpo2 = spo2 && spo2 >= 70 && spo2 <= 100;
        const validHR = hr && hr >= 40 && hr <= 180;
        
        if (!validSpo2 && !validHR) {
          console.log(`[BloodOxygen] Intermediate data - not saving (SpO2: ${spo2}%, HR: ${hr} bpm)`);
          return; // Don't save incomplete/invalid blood oxygen measurements
        }
        
        if (validHR) {
          vitalSignData.heartRate = hr;
        }
        if (validSpo2) {
          vitalSignData.oxygenLevel = spo2;
        }
        
        console.log(`[BloodOxygen] Valid measurement - saving (SpO2: ${spo2}%, HR: ${hr} bpm)`);
      } else if (measurementData.type === 'temperature' && measurementData.value?.temperature) {
        // Validate temperature is in physiological range (30-45°C)
        const temp = measurementData.value.temperature;
        if (temp >= 30 && temp <= 45) {
          vitalSignData.temperature = temp;
        } else {
          console.warn(`Invalid temperature: ${temp}°C - not saving`);
          return;
        }
      } else if (measurementData.type === 'bloodPressure' && measurementData.value) {
        vitalSignData.bloodPressureSystolic = measurementData.value.systolic || measurementData.value.ps;
        vitalSignData.bloodPressureDiastolic = measurementData.value.diastolic || measurementData.value.pd;
        if (measurementData.value.heartRate || measurementData.value.hr) {
          vitalSignData.heartRate = measurementData.value.heartRate || measurementData.value.hr;
        }
      } else if (measurementData.type === 'bloodGlucose' && measurementData.value) {
        vitalSignData.bloodGlucose = measurementData.value.bloodGlucosePaperData || measurementData.value;
      }
      
      // Only save if we have at least one valid vital sign
      const hasValidData = vitalSignData.heartRate || 
                           vitalSignData.bloodPressureSystolic || 
                           vitalSignData.oxygenLevel || 
                           vitalSignData.bloodGlucose;
      
      if (hasValidData) {
        console.log('Saving vital signs to backend:', vitalSignData);
        
        const response = await fetch('/api/vital-signs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vitalSignData)
        });
        
        if (response.ok) {
          console.log('Vital signs saved successfully');
          // Reload vitals history to show new measurement
          await loadVitalsHistory();
        } else {
          console.error('Failed to save vital signs:', await response.text());
        }
      }
    } catch (error) {
      console.error('Error saving vital signs:', error);
    }
  };

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

    if (issues.length === 0) return { status: t('normal'), color: 'bg-green-100 text-green-800' };
    if (issues.length === 1) return { status: t('attention'), color: 'bg-yellow-100 text-yellow-800' };
    return { status: t('critical'), color: 'bg-red-100 text-red-800' };
  };



  // Generate sample historical data for detailed views
  const generateHistoricalData = (type: string, currentValue: any) => {
    const hours = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      let value;
      
      switch (type) {
        case 'heartRate':
          value = Math.floor(Math.random() * 20) + (currentValue - 10);
          break;
        case 'bloodPressure':
          // Parse blood pressure string like "120/80" 
          const parts = String(currentValue).split('/');
          const systolic = parseInt(parts[0]) || 120;
          const diastolic = parseInt(parts[1]) || 80;
          value = {
            systolic: Math.floor(Math.random() * 20) + (systolic - 10),
            diastolic: Math.floor(Math.random() * 20) + (diastolic - 10)
          };
          break;
        case 'temperature':
          value = Math.round((Math.random() * 1.5 + (currentValue - 0.75)) * 10) / 10;
          break;
        case 'oxygenLevel':
          value = Math.floor(Math.random() * 5) + (currentValue - 2);
          break;
        default:
          value = currentValue;
      }
      
      hours.push({ time: time.getHours(), value });
    }
    
    return hours;
  };

  const getVitalStatusForModal = (type: string, value: number | string | { systolic: number; diastolic: number }) => {
    switch (type) {
      case 'heartRate':
        const hr = value as number;
        if (hr < 60 || hr > 100) return { status: t('warning'), color: '#f59e0b' };
        return { status: t('normal'), color: '#10b981' };
      case 'bloodPressure':
        // Handle both object and string formats
        let systolic, diastolic;
        if (typeof value === 'object' && value !== null && 'systolic' in value) {
          systolic = value.systolic;
          diastolic = value.diastolic;
        } else if (typeof value === 'string') {
          const parts = value.split('/');
          systolic = parseInt(parts[0]) || 120;
          diastolic = parseInt(parts[1]) || 80;
        } else {
          systolic = 120;
          diastolic = 80;
        }
        if (systolic > 140 || diastolic > 90) return { status: t('high'), color: '#ef4444' };
        if (systolic < 90 || diastolic < 60) return { status: t('low'), color: '#f59e0b' };
        return { status: t('normal'), color: '#10b981' };
      case 'temperature':
        const temp = typeof value === 'number' ? value : parseFloat(String(value));
        if (temp > 37.5 || temp < 36.0) return { status: t('abnormal'), color: '#f59e0b' };
        return { status: t('normal'), color: '#10b981' };
      case 'oxygenLevel':
        const oxygen = value as number;
        if (oxygen < 95) return { status: t('low'), color: '#ef4444' };
        return { status: t('normal'), color: '#10b981' };
      default:
        return { status: t('normal'), color: '#10b981' };
    }
  };

  const handleExportData = () => {
    if (!selectedMetric || !dashboardData) return;

    try {
      // Get current and historical data
      const currentValue = selectedMetric === 'heartRate' ? dashboardData.vitals.heartRate 
        : selectedMetric === 'bloodPressure' ? dashboardData.vitals.bloodPressure
        : selectedMetric === 'temperature' ? dashboardData.vitals.temperature
        : dashboardData.vitals.oxygenLevel;

      const historicalData = generateHistoricalData(selectedMetric, currentValue);
      const metricName = selectedMetric === 'heartRate' ? 'Heart Rate' 
        : selectedMetric === 'bloodPressure' ? 'Blood Pressure'
        : selectedMetric === 'temperature' ? 'Temperature'
        : 'Blood Oxygen';

      const unit = selectedMetric === 'heartRate' ? 'bpm'
        : selectedMetric === 'bloodPressure' ? 'mmHg'
        : selectedMetric === 'temperature' ? '°C'
        : '%';

      // Create CSV content
      let csvContent = `${metricName} Data Export\n`;
      csvContent += `Patient: ${dashboardData.user.firstName} ${dashboardData.user.lastName}\n`;
      csvContent += `Patient ID: ${dashboardData.user.patientId}\n`;
      csvContent += `Export Date: ${new Date().toLocaleString()}\n`;
      csvContent += `Current Reading: ${currentValue}${unit}\n\n`;
      csvContent += `Time,Value (${unit}),Status\n`;

      // Add 24-hour trend data
      historicalData.forEach((data, index) => {
        const time = new Date();
        time.setHours(time.getHours() - (23 - index));
        const timeStr = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        
        let valueStr;
        let status;
        
        if (selectedMetric === 'bloodPressure' && typeof data.value === 'object') {
          valueStr = `${data.value.systolic}/${data.value.diastolic}`;
          status = data.value.systolic > 140 || data.value.diastolic > 90 ? 'High' 
                 : data.value.systolic < 90 || data.value.diastolic < 60 ? 'Low' : 'Normal';
        } else {
          valueStr = data.value.toString();
          if (selectedMetric === 'heartRate') {
            status = data.value > 100 || data.value < 60 ? 'Abnormal' : 'Normal';
          } else if (selectedMetric === 'temperature') {
            status = data.value > 37.5 || data.value < 36.0 ? 'Abnormal' : 'Normal';
          } else if (selectedMetric === 'oxygenLevel') {
            status = data.value < 95 ? 'Low' : 'Normal';
          } else {
            status = 'Normal';
          }
        }
        
        csvContent += `${timeStr},${valueStr},${status}\n`;
      });

      // Add temperature ranges if it's temperature data
      if (selectedMetric === 'temperature') {
        csvContent += `\nTemperature Reference Ranges:\n`;
        csvContent += `Range,Classification\n`;
        csvContent += `< 36.0°C (96.8°F),Hypothermia\n`;
        csvContent += `36.0-37.2°C (96.8-99.0°F),Normal\n`;
        csvContent += `37.3-37.9°C (99.1-100.2°F),Mild Fever\n`;
        csvContent += `38.0-39.0°C (100.3-102.2°F),Fever\n`;
        csvContent += `39.1-41.0°C (102.3-105.8°F),High Fever\n`;
        csvContent += `> 41.0°C (105.8°F),Hyperthermia\n`;
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${metricName.toLowerCase().replace(' ', '_')}_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      alert(`${metricName} data exported successfully!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const renderDetailedView = () => {
    if (!selectedMetric || !dashboardData) return null;

    const currentValue = selectedMetric === 'heartRate' ? dashboardData.vitals.heartRate 
      : selectedMetric === 'bloodPressure' ? dashboardData.vitals.bloodPressure
      : selectedMetric === 'temperature' ? dashboardData.vitals.temperature
      : dashboardData.vitals.oxygenLevel;

    const historicalData = generateHistoricalData(selectedMetric, currentValue);
    const status = getVitalStatusForModal(selectedMetric, currentValue);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }} onClick={() => setSelectedMetric(null)}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalSlideIn 0.3s ease-out'
        }} onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                backgroundColor: status.color + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                {selectedMetric === 'heartRate' && '💓'}
                {selectedMetric === 'bloodPressure' && '🩸'}
                {selectedMetric === 'temperature' && '🌡️'}
                {selectedMetric === 'oxygenLevel' && '🫁'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  {selectedMetric === 'heartRate' && t('heartRateMonitor')}
                  {selectedMetric === 'bloodPressure' && t('bloodPressureMonitor')}
                  {selectedMetric === 'temperature' && t('temperatureMonitor')}
                  {selectedMetric === 'oxygenLevel' && t('bloodOxygenMonitor')}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  {t('realtimeMonitoring')}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedMetric(null)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Current Reading */}
          <div style={{
            backgroundColor: status.color + '10',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid ' + status.color + '20'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>{t('currentReading')}</p>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: status.color, margin: '0.5rem 0' }}>
                {selectedMetric === 'heartRate' && `${currentValue}`}
                {selectedMetric === 'bloodPressure' && `${currentValue}`}
                {selectedMetric === 'temperature' && `${currentValue}`}
                {selectedMetric === 'oxygenLevel' && `${currentValue}`}
                <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  {selectedMetric === 'heartRate' && 'bpm'}
                  {selectedMetric === 'bloodPressure' && 'mmHg'}
                  {selectedMetric === 'temperature' && '°C'}
                  {selectedMetric === 'oxygenLevel' && '%'}
                </span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                padding: '0.5rem 1rem',
                borderRadius: '9999px',
                backgroundColor: status.color + '20',
                color: status.color
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color }}></div>
                {status.status}
              </div>
            </div>
          </div>

          {/* 24-Hour Trend */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
              {t('hourTrend24')}
            </h3>
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '1rem',
              height: '200px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 600 150">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={30 * i} x2="600" y2={30 * i} stroke="#e2e8f0" strokeWidth="1"/>
                ))}
                {/* Data line */}
                <polyline
                  fill="none"
                  stroke={status.color}
                  strokeWidth="3"
                  points={historicalData.map((data, index) => {
                    const x = (index / 23) * 580 + 10;
                    let y;
                    if (selectedMetric === 'bloodPressure') {
                      y = 150 - ((data.value.systolic - 80) / 80) * 120;
                    } else {
                      const minVal = selectedMetric === 'heartRate' ? 50 : selectedMetric === 'temperature' ? 35 : selectedMetric === 'oxygenLevel' ? 90 : 0;
                      const maxVal = selectedMetric === 'heartRate' ? 100 : selectedMetric === 'temperature' ? 40 : selectedMetric === 'oxygenLevel' ? 100 : 100;
                      y = 150 - ((data.value - minVal) / (maxVal - minVal)) * 120;
                    }
                    return `${x},${Math.max(15, Math.min(135, y))}`;
                  }).join(' ')}
                />
                {/* Time labels */}
                {[0, 6, 12, 18, 24].map(hour => (
                  <text key={hour} x={(hour / 24) * 580 + 10} y="145" textAnchor="middle" fontSize="10" fill="#64748b">
                    {hour === 24 ? '00' : hour.toString().padStart(2, '0')}:00
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Temperature Ranges (only for temperature metric) */}
          {selectedMetric === 'temperature' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem', textAlign: 'center' }}>
                {t('temperatureRanges')}
              </h3>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '1rem' }}>
                {[
                  { range: '< 36.0°C (96.8°F)', label: t('hypothermia'), color: '#3b82f6', icon: '🥶' },
                  { range: '36.0-37.2°C (96.8-99.0°F)', label: t('normal'), color: '#10b981', icon: '😊' },
                  { range: '37.3-37.9°C (99.1-100.2°F)', label: t('mildFever'), color: '#f59e0b', icon: '😐' },
                  { range: '38.0-39.0°C (100.3-102.2°F)', label: t('fever'), color: '#f97316', icon: '🔥' },
                  { range: '39.1-41.0°C (102.3-105.8°F)', label: t('highFever'), color: '#ef4444', icon: '🚨' },
                  { range: '> 41.0°C (105.8°F)', label: t('hyperthermia'), color: '#991b1b', icon: '⚠️' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    marginBottom: index < 5 ? '0.5rem' : 0,
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{item.range}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '500', 
                        color: item.color,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: item.color + '20'
                      }}>
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Tips */}
          <div style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            padding: '1rem',
            border: '1px solid #bbf7d0',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#059669', marginBottom: '0.5rem' }}>
              💡 {t('healthTips')}
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#047857', margin: 0, lineHeight: '1.5' }}>
              {selectedMetric === 'heartRate' && t('heartRateHealthTip')}
              {selectedMetric === 'bloodPressure' && t('bloodPressureHealthTip')}
              {selectedMetric === 'temperature' && t('temperatureHealthTip')}
              {selectedMetric === 'oxygenLevel' && t('oxygenLevelHealthTip')}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              onClick={handleExportData}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              data-testid="button-export-data"
            >
              📊 {t('exportData')}
            </button>
            <button
              onClick={() => setSelectedMetric(null)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
              data-testid="button-close-modal"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">{t('loading')}</p>
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
      <style>
        {`
          @keyframes modalSlideIn {
            0% { 
              transform: scale(0.95) translateY(-10px);
              opacity: 0;
            }
            100% { 
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
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
                <h1 className="text-2xl font-bold">24/7 Tele H - {t('dashboard')}</h1>
                <p className="text-blue-100">{t('welcomeBack')}, {dashboardData.user.firstName} {dashboardData.user.lastName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">{t('patientId')}: {dashboardData.user.patientId}</p>
                <p className="text-blue-100 text-sm">Last updated: {formatTimestamp(dashboardData.vitals.timestamp)}</p>
              </div>
              <LanguageSwitcher />
              <button
                onClick={onLogout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all"
                data-testid="button-logout-patient"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Vitals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setSelectedMetric('heartRate')} data-testid="card-heart-rate">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.heartRate}</div>
                <div className="text-blue-100 text-sm">{t('heartRate')} ({t('bpm')})</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('heartRate'))}`}>
                  {getTrendIcon(getVitalTrend('heartRate'))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setSelectedMetric('bloodPressure')} data-testid="card-blood-pressure">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">
                  {isBpInProgress ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="text-lg">Measuring...</span>
                    </div>
                  ) : (
                    dashboardData.vitals.bloodPressure
                  )}
                </div>
                <div className="text-green-100 text-sm">{t('bloodPressure')}</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('bloodPressure'))}`}>
                  {getTrendIcon(getVitalTrend('bloodPressure'))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-rose-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setSelectedMetric('temperature')} data-testid="card-temperature">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.temperature}°C</div>
                <div className="text-pink-100 text-sm">{t('temperature')}</div>
              </div>
              <div className="text-right">
                <Monitor className="w-5 h-5 text-white opacity-80 hover:opacity-100 mb-2" />
                <div className={`text-sm ${getTrendColor(getVitalTrend('temperature'))}`}>
                  {getTrendIcon(getVitalTrend('temperature'))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-400 text-white p-6 rounded-2xl shadow-lg relative cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setSelectedMetric('oxygenLevel')} data-testid="card-oxygen-level">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-3xl font-bold mb-1">{dashboardData.vitals.oxygenLevel}%</div>
                <div className="text-purple-100 text-sm">{t('oxygenLevel')}</div>
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
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('healthTrends')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('healthTrends')}</span>
                <span className="font-medium">{dashboardData.healthScore}/100</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('complianceRate')}</span>
                <span className="font-medium">{dashboardData.complianceRate}%</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('lastActivity')}</span>
                <span className="font-medium">{dashboardData.lastCheckup}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('nextAppointment')}</span>
                <span className="font-medium">{dashboardData.nextAppointment}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Monitoring Widgets */}
        <div className="space-y-6 mt-6">
          {/* HC03 Device Control - Full Width */}
          <HC03DeviceWidget 
            patientId={dashboardData?.user?.patientId || ''}
            onMeasurementStateChange={(type, isInProgress) => {
              if (type === 'ecg') {
                setIsEcgInProgress(isInProgress);
              } else if (type === 'bloodPressure') {
                setIsBpInProgress(isInProgress);
              } else if (type === 'bloodGlucose') {
                setIsGlucoseInProgress(isInProgress);
              }
            }}
            onDataUpdate={(data) => {
              // Handle real-time data updates from HC03 device
              console.log('HC03 data received:', data);
              
              // Track connected device ID for widgets
              if (data.deviceId) {
                setConnectedDeviceId(data.deviceId);
              }
              
              // Update battery status from HC02-F1B51D
              if (data.type === 'battery' && data.value) {
                setCurrentBatteryLevel(data.value.batteryLevel || 0);
                setCurrentChargingStatus(data.value.chargingStatus || false);
              }
              
              // Update vital signs in real-time from HC03 device
              if (dashboardData) {
                setDashboardData(prev => {
                  if (!prev) return prev;
                  
                  const updatedVitals = { ...prev.vitals };
                  
                  // Update based on data type - WITH VALIDATION
                  if (data.type === 'ecg' && data.value?.hr) {
                    // Only update if heart rate is in valid range
                    if (data.value.hr >= 40 && data.value.hr <= 180) {
                      updatedVitals.heartRate = data.value.hr;
                    }
                  } else if (data.type === 'bloodOxygen') {
                    // Only update if values are in valid physiological ranges
                    if (data.value?.heartRate && data.value.heartRate >= 40 && data.value.heartRate <= 180) {
                      updatedVitals.heartRate = data.value.heartRate;
                    }
                    if (data.value?.bloodOxygen && data.value.bloodOxygen >= 70 && data.value.bloodOxygen <= 100) {
                      updatedVitals.oxygenLevel = data.value.bloodOxygen;
                    }
                  } else if (data.type === 'bloodPressure' && data.value) {
                    // Validate blood pressure values
                    const systolic = data.value.systolic || data.value.ps;
                    const diastolic = data.value.diastolic || data.value.pd;
                    if (systolic >= 70 && systolic <= 200 && diastolic >= 40 && diastolic <= 130) {
                      updatedVitals.bloodPressure = `${systolic}/${diastolic}`;
                    }
                  } else if (data.type === 'temperature' && data.value?.temperature) {
                    // Only update if temperature is in valid range (30-45°C)
                    if (data.value.temperature >= 30 && data.value.temperature <= 45) {
                      updatedVitals.temperature = data.value.temperature.toFixed(1);
                    }
                  }
                  
                  // Update timestamp
                  updatedVitals.timestamp = data.timestamp || new Date().toISOString();
                  
                  return {
                    ...prev,
                    vitals: updatedVitals
                  };
                });
                
                // Persist vital signs to backend after measurement
                if (data.type !== 'temperature') {
                  saveVitalSignsToBackend(data, dashboardData.user?.patientId);
                }
              }
            }}
          />
          
          {/* ECG Monitor - Full Width */}
          <EcgWidget 
            deviceId={connectedDeviceId || ""}
            patientId={dashboardData?.user?.patientId || ''} 
            showControls={true}
            compact={false}
            isEcgMeasurementInProgress={isEcgInProgress}
          />
          
          {/* Blood Glucose and Battery - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BloodGlucoseWidget 
              patientId={dashboardData?.user?.patientId || ''} 
              deviceId={connectedDeviceId || undefined}
              showControls={false}
              compact={false}
              isGlucoseMeasurementInProgress={isGlucoseInProgress}
            />
            <BatteryWidget 
              patientId={dashboardData?.user?.patientId || ''} 
              compact={false}
              deviceId={connectedDeviceId || undefined}
              currentBatteryLevel={currentBatteryLevel}
              currentChargingStatus={currentChargingStatus}
            />
          </div>
        </div>

        {/* Vitals History with Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">{t('vitalSigns')} ({vitalsHistory.length} {t('medicalHistory')})</h3>
            <div className="flex space-x-4 items-center">
              <select
                value={selectedVitalType}
                onChange={(e) => setSelectedVitalType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">{t('vitalSigns')}</option>
                <option value="heartRate">{t('heartRate')}</option>
                <option value="bloodPressure">{t('bloodPressure')}</option>
                <option value="temperature">{t('temperature')}</option>
                <option value="oxygenLevel">{t('oxygenLevel')}</option>
                <option value="bloodGlucose">{t('bloodGlucose')}</option>
              </select>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">{t('from')}:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">{t('to')}:</label>
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
                    {t('dateTime')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('heartRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bloodPressure')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('temperature')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('oxygen')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('bloodGlucose')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
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

      {/* Detailed Modal Views */}
      {renderDetailedView()}
    </div>
  );
}