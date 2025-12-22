import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Droplets, 
  Gauge,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import HC03DeviceManager from '@/components/HC03DeviceManager';
import ECGReport from '@/components/ECGReport';
import ECGMonitor from '@/components/ECGMonitor';
import BloodGlucoseMonitor from '@/components/BloodGlucoseMonitor';
import ConsolidatedVitalsTable from '@/components/ConsolidatedVitalsTable';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/lib/i18n';

export default function HealthMonitoringPage() {
  const { t, isRTL } = useLanguage();
  const patientId = "DEMO001"; // In real app, get from auth context
  const [showECGReport, setShowECGReport] = useState(false);
  const [isGlucoseMeasuring, setIsGlucoseMeasuring] = useState(false);

  // Fetch comprehensive health data
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['/api/hc03/data/comprehensive', patientId],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const { data: devices } = useQuery({
    queryKey: ['/api/hc03/devices', patientId],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getLatestReading = (dataArray: any[]) => {
    return dataArray && dataArray.length > 0 ? dataArray[0] : null;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        if (value >= 60 && value <= 100) return { status: t('normal'), color: 'text-green-600' };
        if (value > 100) return { status: t('high'), color: 'text-red-600' };
        return { status: t('elevated'), color: 'text-yellow-600' };
      case 'bloodOxygen':
        if (value >= 95) return { status: t('normal'), color: 'text-green-600' };
        if (value >= 90) return { status: t('elevated'), color: 'text-yellow-600' };
        return { status: t('critical'), color: 'text-red-600' };
      case 'temperature':
        if (value >= 36.1 && value <= 37.2) return { status: t('normal'), color: 'text-green-600' };
        return { status: t('elevated'), color: 'text-orange-600' };
      case 'systolic':
        if (value < 120) return { status: t('normal'), color: 'text-green-600' };
        if (value < 140) return { status: t('elevated'), color: 'text-yellow-600' };
        return { status: t('high'), color: 'text-red-600' };
      default:
        return { status: t('unknown'), color: 'text-gray-600' };
    }
  };

  const latestEcg = getLatestReading((healthData as any)?.ecg);
  const latestOxygen = getLatestReading((healthData as any)?.bloodOxygen);
  const latestBP = getLatestReading((healthData as any)?.bloodPressure);
  const latestTemp = getLatestReading((healthData as any)?.temperature);
  const latestGlucose = getLatestReading((healthData as any)?.bloodGlucose);

  // Show ECG Report if requested
  if (showECGReport) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('ecgAnalysisReport')}</h1>
            <p className="text-gray-600 mt-1">{t('detailedEcgAnalysis')}</p>
          </div>
          <Button 
            onClick={() => setShowECGReport(false)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {t('backToDashboard')}
          </Button>
        </div>
        
        {/* ECG Report Component */}
        <ECGReport patientId={patientId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('healthMonitoring')}</h1>
          <p className="text-gray-600 mt-1">{t('realtimeVitalSigns')}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowECGReport(true)}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            View ECG Report
          </Button>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Live Monitoring Active</span>
          </div>
        </div>
      </div>

      {/* Current Vital Signs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Heart Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestEcg ? (
                <span className={getVitalStatus('heartRate', latestEcg.heartRate).color}>
                  {latestEcg.heartRate} BPM
                </span>
              ) : (
                <span className="text-gray-400">-- BPM</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestEcg ? (
                <>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimestamp(latestEcg.timestamp)}
                </>
              ) : (
                'No recent data'
              )}
            </p>
            {latestEcg && (
              <Badge 
                variant={getVitalStatus('heartRate', latestEcg.heartRate).status === 'normal' ? 'default' : 'destructive'}
                className="mt-2"
              >
                {getVitalStatus('heartRate', latestEcg.heartRate).status}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Blood Oxygen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Oxygen</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestOxygen ? (
                <span className={getVitalStatus('bloodOxygen', latestOxygen.bloodOxygen).color}>
                  {latestOxygen.bloodOxygen}%
                </span>
              ) : (
                <span className="text-gray-400">--%</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestOxygen ? (
                <>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimestamp(latestOxygen.timestamp)}
                </>
              ) : (
                'No recent data'
              )}
            </p>
            {latestOxygen && (
              <Badge 
                variant={getVitalStatus('bloodOxygen', latestOxygen.bloodOxygen).status === 'normal' ? 'default' : 'destructive'}
                className="mt-2"
              >
                {getVitalStatus('bloodOxygen', latestOxygen.bloodOxygen).status}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Blood Pressure */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <Gauge className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestBP ? (
                <span className={getVitalStatus('systolic', latestBP.systolic).color}>
                  {latestBP.systolic}/{latestBP.diastolic}
                </span>
              ) : (
                <span className="text-gray-400">--/--</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestBP ? (
                <>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimestamp(latestBP.timestamp)}
                </>
              ) : (
                'No recent data'
              )}
            </p>
            {latestBP && (
              <Badge 
                variant={getVitalStatus('systolic', latestBP.systolic).status === 'normal' ? 'default' : 'destructive'}
                className="mt-2"
              >
                {getVitalStatus('systolic', latestBP.systolic).status}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestTemp ? (
                <span className={getVitalStatus('temperature', parseFloat(latestTemp.temperature)).color}>
                  {latestTemp.temperature}°C
                </span>
              ) : (
                <span className="text-gray-400">--°C</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestTemp ? (
                <>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimestamp(latestTemp.timestamp)}
                </>
              ) : (
                'No recent data'
              )}
            </p>
            {latestTemp && (
              <Badge 
                variant={getVitalStatus('temperature', parseFloat(latestTemp.temperature)).status === 'normal' ? 'default' : 'destructive'}
                className="mt-2"
              >
                {getVitalStatus('temperature', parseFloat(latestTemp.temperature)).status}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="device" className="space-y-6">
        <TabsList>
          <TabsTrigger value="device">Device Manager</TabsTrigger>
          <TabsTrigger value="ecg">ECG Monitor</TabsTrigger>
          <TabsTrigger value="history">Recent History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Device Manager Tab */}
        <TabsContent value="device">
          <HC03DeviceManager patientId={patientId} />
        </TabsContent>

        {/* ECG Monitor Tab */}
        <TabsContent value="ecg">
          <ECGMonitor patientId={patientId} deviceId="HC02-F1B51D" />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Consolidated Vital Signs Table - ONE ROW PER CHECK WITH ALL VITALS */}
          <ConsolidatedVitalsTable patientId={patientId} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ECG History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  ECG Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(healthData as any)?.ecg?.slice(0, 10).map((reading: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{reading.heartRate} BPM</div>
                        <div className="text-sm text-gray-500">
                          HRV: {reading.hrv} | Mood: {reading.moodIndex}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(reading.timestamp)}
                        </div>
                        <Badge variant={reading.fingerDetected ? 'default' : 'secondary'}>
                          {reading.fingerDetected ? 'Good Signal' : 'Poor Signal'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!(healthData as any)?.ecg || (healthData as any).ecg.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No ECG data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blood Pressure History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Blood Pressure Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(healthData as any)?.bloodPressure?.slice(0, 10).map((reading: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{reading.systolic}/{reading.diastolic} mmHg</div>
                        <div className="text-sm text-gray-500">
                          HR: {reading.heartRate} BPM
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(reading.timestamp)}
                        </div>
                        <Badge variant={getVitalStatus('systolic', reading.systolic).status === 'normal' ? 'default' : 'destructive'}>
                          {getVitalStatus('systolic', reading.systolic).status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!(healthData as any)?.bloodPressure || (healthData as any).bloodPressure.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No blood pressure data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blood Oxygen History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Blood Oxygen Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(healthData as any)?.bloodOxygen?.slice(0, 10).map((reading: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{reading.bloodOxygen}%</div>
                        <div className="text-sm text-gray-500">
                          HR: {reading.heartRate} BPM
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(reading.timestamp)}
                        </div>
                        <Badge variant={reading.fingerDetected ? 'default' : 'secondary'}>
                          {reading.fingerDetected ? 'Good Signal' : 'Poor Signal'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!(healthData as any)?.bloodOxygen || (healthData as any).bloodOxygen.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No blood oxygen data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Temperature History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  Temperature Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {(healthData as any)?.temperature?.slice(0, 10).map((reading: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{reading.temperature}°C</div>
                        <div className="text-sm text-gray-500">
                          Site: {reading.measurementSite || 'Forehead'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(reading.timestamp)}
                        </div>
                        <Badge variant={getVitalStatus('temperature', parseFloat(reading.temperature)).status === 'normal' ? 'default' : 'destructive'}>
                          {getVitalStatus('temperature', parseFloat(reading.temperature)).status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!(healthData as any)?.temperature || (healthData as any).temperature.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No temperature data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blood Glucose Monitor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5" />
                  Blood Glucose Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BloodGlucoseMonitor 
                  patientId={patientId}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Device Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(devices) ? devices.map((device: any) => (
                    <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{device.deviceName}</div>
                        <div className="text-sm text-gray-500">ID: {device.deviceId}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={device.connectionStatus === 'connected' ? 'default' : 'secondary'}>
                          {device.connectionStatus}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          Battery: {device.batteryLevel}%
                        </div>
                      </div>
                    </div>
                  )) : null}
                  {(!Array.isArray(devices) || devices.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No devices registered</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Data Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Data Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>ECG Readings (24h)</span>
                    <span className="font-medium">{(healthData as any)?.ecg?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blood Pressure (24h)</span>
                    <span className="font-medium">{(healthData as any)?.bloodPressure?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blood Oxygen (24h)</span>
                    <span className="font-medium">{(healthData as any)?.bloodOxygen?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature (24h)</span>
                    <span className="font-medium">{(healthData as any)?.temperature?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blood Glucose (24h)</span>
                    <span className="font-medium">{(healthData as any)?.bloodGlucose?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alerts Section */}
      {(latestEcg && getVitalStatus('heartRate', latestEcg.heartRate).status !== 'normal') ||
       (latestOxygen && getVitalStatus('bloodOxygen', latestOxygen.bloodOxygen).status !== 'normal') ||
       (latestBP && getVitalStatus('systolic', latestBP.systolic).status !== 'normal') ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Health Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {latestEcg && getVitalStatus('heartRate', latestEcg.heartRate).status !== 'normal' && (
                <p className="text-orange-700">⚠️ Heart rate is {getVitalStatus('heartRate', latestEcg.heartRate).status}</p>
              )}
              {latestOxygen && getVitalStatus('bloodOxygen', latestOxygen.bloodOxygen).status !== 'normal' && (
                <p className="text-orange-700">⚠️ Blood oxygen level is {getVitalStatus('bloodOxygen', latestOxygen.bloodOxygen).status}</p>
              )}
              {latestBP && getVitalStatus('systolic', latestBP.systolic).status !== 'normal' && (
                <p className="text-orange-700">⚠️ Blood pressure is {getVitalStatus('systolic', latestBP.systolic).status}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}