import React, { useState, useEffect } from 'react';
import { handleApiError } from '@/lib/errorHandler';
import { useLanguage } from '@/lib/i18n';

interface Device {
  id: string;
  name: string;
  patientId: string;
  patientName: string;
  macAddress: string;
  firmwareVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  lastSync: string;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
  supportedVitals: string[];
  totalReadings: number;
  lastReading: string;
}

interface DeviceMonitoringProps {
  onClose: () => void;
}

export default function DeviceMonitoring({ onClose }: DeviceMonitoringProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    loadDeviceData();
  }, []);

  const loadDeviceData = async () => {
    try {
      // Simulate device data - in production this would come from API
      const deviceData: Device[] = [
        {
          id: 'HC03-001',
          name: 'HC03 Health Monitor',
          patientId: 'PT001',
          patientName: 'John Doe',
          macAddress: '00:1B:44:11:3A:B7',
          firmwareVersion: '2.1.4',
          batteryLevel: 85,
          isCharging: false,
          lastSync: '2025-06-21T15:30:00.000Z',
          connectionStatus: 'connected',
          supportedVitals: ['Heart Rate', 'Blood Pressure', 'Temperature', 'Oxygen Level'],
          totalReadings: 342,
          lastReading: '2025-06-21T15:25:00.000Z'
        },
        {
          id: 'HC03-002',
          name: 'HC03 Health Monitor',
          patientId: 'PT149898',
          patientName: 'Test Patient',
          macAddress: '00:1B:44:11:3A:C8',
          firmwareVersion: '2.1.3',
          batteryLevel: 42,
          isCharging: true,
          lastSync: '2025-06-21T14:45:00.000Z',
          connectionStatus: 'connected',
          supportedVitals: ['Heart Rate', 'Blood Pressure', 'Temperature'],
          totalReadings: 128,
          lastReading: '2025-06-21T14:40:00.000Z'
        },
        {
          id: 'HC03-003',
          name: 'HC03 Health Monitor',
          patientId: 'pt1000',
          patientName: 'Ahmed Eldeip',
          macAddress: '00:1B:44:11:3A:D9',
          firmwareVersion: '2.0.8',
          batteryLevel: 15,
          isCharging: false,
          lastSync: '2025-06-21T12:00:00.000Z',
          connectionStatus: 'disconnected',
          supportedVitals: ['Heart Rate', 'Blood Pressure'],
          totalReadings: 89,
          lastReading: '2025-06-21T11:55:00.000Z'
        }
      ];

      setDevices(deviceData);
      setLoading(false);
    } catch (error) {
      // Log error for debugging but handle gracefully
      handleApiError('DeviceMonitoring', 'loadDeviceData', error as Error, { patientId });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'syncing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'bg-green-500';
    if (level > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatLastSync = (syncTime: string) => {
    const now = new Date();
    const sync = new Date(syncTime);
    const diffMinutes = Math.floor((now.getTime() - sync.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const syncDevice = async (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, connectionStatus: 'syncing' as const }
        : device
    ));

    // Simulate sync process
    setTimeout(() => {
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              connectionStatus: 'connected' as const,
              lastSync: new Date().toISOString(),
              totalReadings: device.totalReadings + Math.floor(Math.random() * 5) + 1
            }
          : device
      ));
    }, 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loadingDeviceInformation')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">{t('deviceMonitoring')}</h2>
              <p className="text-purple-100">{t('hc03DeviceStatusManagement')}</p>
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

        <div className="flex h-[calc(90vh-120px)]">
          {/* Device List */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('connectedDevices')} ({devices.length})</h3>
            
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDevice?.id === device.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800">{device.name}</h4>
                      <p className="text-sm text-gray-600">ID: {device.id}</p>
                      <p className="text-sm text-gray-600">Patient: {device.patientName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.connectionStatus)}`}>
                      {device.connectionStatus.charAt(0).toUpperCase() + device.connectionStatus.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('battery')}:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getBatteryColor(device.batteryLevel)}`}
                            style={{ width: `${device.batteryLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{device.batteryLevel}%</span>
                        {device.isCharging && <span className="text-green-600">⚡</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('lastSync')}:</span>
                      <p className="font-medium">{formatLastSync(device.lastSync)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {device.totalReadings} {t('readings')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        syncDevice(device.id);
                      }}
                      disabled={device.connectionStatus === 'syncing' || device.connectionStatus === 'disconnected'}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                    >
                      {device.connectionStatus === 'syncing' ? t('syncing') : t('syncNow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Details */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedDevice ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-6">{t('deviceDetails')}</h3>
                
                <div className="space-y-6">
                  {/* Device Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('deviceInformation')}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">{t('deviceId')}:</span>
                        <p className="font-medium">{selectedDevice.id}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('macAddress')}:</span>
                        <p className="font-medium">{selectedDevice.macAddress}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('firmware')}:</span>
                        <p className="font-medium">v{selectedDevice.firmwareVersion}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('status')}:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDevice.connectionStatus)}`}>
                          {selectedDevice.connectionStatus.charAt(0).toUpperCase() + selectedDevice.connectionStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Assignment */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('patientAssignment')}</h4>
                    <div className="text-sm">
                      <p><span className="text-gray-500">{t('patientId')}:</span> <span className="font-medium">{selectedDevice.patientId}</span></p>
                      <p><span className="text-gray-500">{t('patientName')}:</span> <span className="font-medium">{selectedDevice.patientName}</span></p>
                    </div>
                  </div>

                  {/* Battery Status */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('batteryStatus')}</h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('batteryLevel')}</span>
                          <span className="font-medium">{selectedDevice.batteryLevel}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getBatteryColor(selectedDevice.batteryLevel)}`}
                            style={{ width: `${selectedDevice.batteryLevel}%` }}
                          ></div>
                        </div>
                      </div>
                      {selectedDevice.isCharging && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <span>⚡</span>
                          <span className="text-sm font-medium">{t('charging')}</span>
                        </div>
                      )}
                    </div>
                    {selectedDevice.batteryLevel < 20 && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
                        ⚠️ {t('lowBatteryWarning')}
                      </div>
                    )}
                  </div>

                  {/* Supported Vitals */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('supportedVitalSigns')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDevice.supportedVitals.map((vital) => (
                        <div key={vital} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{vital}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sync Information */}
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('syncInformation')}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">{t('lastSync')}:</span>
                        <span className="font-medium ml-2">{formatLastSync(selectedDevice.lastSync)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('totalReadings')}:</span>
                        <span className="font-medium ml-2">{selectedDevice.totalReadings}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('lastReading')}:</span>
                        <span className="font-medium ml-2">{formatLastSync(selectedDevice.lastReading)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => syncDevice(selectedDevice.id)}
                        disabled={selectedDevice.connectionStatus === 'syncing' || selectedDevice.connectionStatus === 'disconnected'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-all"
                      >
                        {selectedDevice.connectionStatus === 'syncing' ? t('syncing') : t('forceSync')}
                      </button>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-all">
                        {t('viewHistory')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-lg">{t('selectDeviceToViewDetails')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}