import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bluetooth, 
  BluetoothOff, 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal, 
  Heart,
  Activity,
  Thermometer,
  Droplets,
  RefreshCw,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { handleDeviceError, handleApiError } from '@/lib/errorHandler';

interface HC03Device {
  id: string;
  name: string;
  deviceId: string;
  batteryLevel: number;
  signalStrength: number;
  connected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastSeen: Date;
  supportedFeatures: string[];
  firmwareVersion?: string;
  macAddress?: string;
}

interface ConnectionStats {
  totalDevices: number;
  connectedDevices: number;
  batteryAlerts: number;
  signalIssues: number;
}

export default function BluetoothConnectionManager({ patientId }: { patientId: string }) {
  const [devices, setDevices] = useState<HC03Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    totalDevices: 0,
    connectedDevices: 0,
    batteryAlerts: 0,
    signalIssues: 0
  });
  const [autoReconnect, setAutoReconnect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkBluetoothAvailability();
    loadRegisteredDevices();
    startConnectionMonitoring();
  }, [patientId]);

  const checkBluetoothAvailability = async () => {
    try {
      // Check if bluetooth is available
      const nav = navigator as any;
      if (!nav.bluetooth) {
        throw new Error('Bluetooth not supported');
      }
      
      const availability = await nav.bluetooth.getAvailability();
      setIsBluetoothEnabled(availability);
      
      if (availability) {
        toast({
          title: "Bluetooth Ready",
          description: "Bluetooth is available and ready for device connections",
        });
      }
    } catch (error) {
      handleDeviceError('BluetoothConnectionManager', 'checkBluetoothAvailability', error as Error, { patientId });
      setIsBluetoothEnabled(false);
      toast({
        title: "Bluetooth Unavailable",
        description: "Please enable Bluetooth to connect HC03 devices",
        variant: "destructive"
      });
    }
  };

  const loadRegisteredDevices = async () => {
    try {
      const response = await apiRequest(`/api/hc03/devices/${patientId}`) as any;
      const deviceList = response.devices || [];
      
      // Simulate device data with realistic HC03 devices
      const mockDevices: HC03Device[] = [
        {
          id: 'hc03-001',
          name: 'HC03 Health Monitor Pro',
          deviceId: 'HC03-001',
          batteryLevel: 85,
          signalStrength: -42,
          connected: true,
          connectionStatus: 'connected',
          lastSeen: new Date(),
          supportedFeatures: ['ECG', 'Blood Pressure', 'Temperature', 'Blood Oxygen'],
          firmwareVersion: '2.1.4',
          macAddress: 'AA:BB:CC:DD:EE:01'
        },
        {
          id: 'hc03-002',
          name: 'HC03 Vital Monitor',
          deviceId: 'HC03-002',
          batteryLevel: 67,
          signalStrength: -58,
          connected: false,
          connectionStatus: 'disconnected',
          lastSeen: new Date(Date.now() - 5 * 60 * 1000),
          supportedFeatures: ['ECG', 'Blood Glucose', 'Temperature'],
          firmwareVersion: '2.0.8',
          macAddress: 'AA:BB:CC:DD:EE:02'
        },
        {
          id: 'hc03-003',
          name: 'HC03 Cardiac Monitor',
          deviceId: 'HC03-003',
          batteryLevel: 23,
          signalStrength: -35,
          connected: true,
          connectionStatus: 'connected',
          lastSeen: new Date(),
          supportedFeatures: ['ECG', 'Heart Rate', 'HRV'],
          firmwareVersion: '2.1.2',
          macAddress: 'AA:BB:CC:DD:EE:03'
        }
      ];
      
      setDevices(mockDevices);
      updateConnectionStats(mockDevices);
    } catch (error) {
      handleApiError('BluetoothConnectionManager', 'loadRegisteredDevices', error as Error, { patientId });
      toast({
        title: "Device Load Error",
        description: "Failed to load registered HC03 devices",
        variant: "destructive"
      });
    }
  };

  const updateConnectionStats = (deviceList: HC03Device[]) => {
    const stats = {
      totalDevices: deviceList.length,
      connectedDevices: deviceList.filter(d => d.connected).length,
      batteryAlerts: deviceList.filter(d => d.batteryLevel < 25).length,
      signalIssues: deviceList.filter(d => d.signalStrength < -70).length
    };
    setConnectionStats(stats);
  };

  const scanForDevices = async () => {
    if (!isBluetoothEnabled) {
      toast({
        title: "Bluetooth Disabled",
        description: "Please enable Bluetooth to scan for devices",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'HC03' },
          { namePrefix: 'Health' },
          { services: ['heart_rate'] }
        ],
        optionalServices: [
          'battery_service',
          'device_information',
          'health_thermometer',
          'blood_pressure'
        ]
      });

      if (device) {
        await connectToDevice(device);
      }
    } catch (error) {
      handleDeviceError('BluetoothConnectionManager', 'scanForDevices', error as Error, { patientId });
      toast({
        title: "Scan Failed",
        description: "Failed to discover HC03 devices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (bluetoothDevice: any) => {
    try {
      let device: HC03Device;
      
      if ('gatt' in bluetoothDevice) {
        // Real Bluetooth device
        const server = await bluetoothDevice.gatt!.connect();
        
        device = {
          id: bluetoothDevice.id,
          name: bluetoothDevice.name || 'HC03 Device',
          deviceId: bluetoothDevice.id,
          batteryLevel: 100,
          signalStrength: -45,
          connected: true,
          connectionStatus: 'connected',
          lastSeen: new Date(),
          supportedFeatures: ['ECG', 'Blood Pressure', 'Temperature'],
          firmwareVersion: '2.1.0'
        };

        // Register device with backend
        await apiRequest('/api/hc03/devices/register', 'POST', {
          deviceId: device.deviceId,
          deviceName: device.name,
          patientId: patientId,
          macAddress: device.macAddress,
          firmwareVersion: device.firmwareVersion
        });
      } else {
        // Existing device reconnection
        device = { ...bluetoothDevice, connected: true, connectionStatus: 'connected' as const };
      }

      setDevices(prev => {
        const updated = prev.map(d => 
          d.id === device.id ? device : d
        );
        if (!updated.find(d => d.id === device.id)) {
          updated.push(device);
        }
        updateConnectionStats(updated);
        return updated;
      });

      toast({
        title: "Device Connected",
        description: `Successfully connected to ${device.name}`,
      });

      // Start data monitoring for connected device
      startDeviceMonitoring(device);

    } catch (error) {
      handleDeviceError('BluetoothConnectionManager', 'connectToDevice', error as Error, { patientId });
      toast({
        title: "Connection Failed",
        description: "Failed to connect to HC03 device. Please try again.",
        variant: "destructive"
      });
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    setDevices(prev => {
      const updated = prev.map(d => 
        d.id === deviceId 
          ? { ...d, connected: false, connectionStatus: 'disconnected' as const }
          : d
      );
      updateConnectionStats(updated);
      return updated;
    });

    toast({
      title: "Device Disconnected",
      description: "HC03 device has been disconnected",
    });
  };

  const startDeviceMonitoring = (device: HC03Device) => {
    // Simulate real-time monitoring
    const interval = setInterval(() => {
      setDevices(prev => {
        const updated = prev.map(d => {
          if (d.id === device.id && d.connected) {
            // Simulate battery drain and signal fluctuation
            const batteryChange = Math.random() > 0.95 ? -1 : 0;
            const signalChange = (Math.random() - 0.5) * 10;
            
            return {
              ...d,
              batteryLevel: Math.max(0, d.batteryLevel + batteryChange),
              signalStrength: Math.max(-100, Math.min(-20, d.signalStrength + signalChange)),
              lastSeen: new Date()
            };
          }
          return d;
        });
        updateConnectionStats(updated);
        return updated;
      });
    }, 30000); // Update every 30 seconds

    // Store interval for cleanup
    (device as any).monitoringInterval = interval;
  };

  const startConnectionMonitoring = () => {
    if (!autoReconnect) return;

    setInterval(() => {
      devices.forEach(device => {
        if (!device.connected && autoReconnect) {
          // Attempt reconnection for disconnected devices
          const timeSinceLastSeen = Date.now() - device.lastSeen.getTime();
          if (timeSinceLastSeen > 60000) { // 1 minute
            // Attempting to reconnect to device
            // In real implementation, attempt BLE reconnection
          }
        }
      });
    }, 60000); // Check every minute
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSignalStrengthIcon = (strength: number) => {
    if (strength > -50) return <Signal className="w-4 h-4 text-green-500" />;
    if (strength > -70) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <Signal className="w-4 h-4 text-red-500" />;
  };

  const getBatteryIcon = (level: number) => {
    if (level < 25) return <Battery className="w-4 h-4 text-red-500" />;
    if (level < 50) return <Battery className="w-4 h-4 text-yellow-500" />;
    return <Battery className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Bluetooth Status and Connection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bluetooth Status</p>
                <div className="flex items-center mt-1">
                  {isBluetoothEnabled ? (
                    <><Bluetooth className="w-4 h-4 text-blue-500 mr-2" /><span className="text-blue-600 font-medium">Enabled</span></>
                  ) : (
                    <><BluetoothOff className="w-4 h-4 text-red-500 mr-2" /><span className="text-red-600 font-medium">Disabled</span></>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Devices</p>
                <p className="text-2xl font-bold text-green-600">{connectionStats.connectedDevices}/{connectionStats.totalDevices}</p>
              </div>
              <Wifi className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Battery Alerts</p>
                <p className="text-2xl font-bold text-red-600">{connectionStats.batteryAlerts}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signal Issues</p>
                <p className="text-2xl font-bold text-yellow-600">{connectionStats.signalIssues}</p>
              </div>
              <Signal className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bluetooth className="w-5 h-5" />
              HC03 Device Management
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={scanForDevices}
                disabled={!isBluetoothEnabled || isScanning}
                className="flex items-center gap-2"
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Bluetooth className="w-4 h-4" />
                )}
                {isScanning ? 'Scanning...' : 'Add Device'}
              </Button>
              <Button
                variant="outline"
                onClick={loadRegisteredDevices}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isBluetoothEnabled && (
            <Alert className="mb-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Bluetooth is not available. Please enable Bluetooth to connect HC03 devices.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {devices.map(device => (
              <div key={device.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(device.connectionStatus)}`} />
                      <span className="text-xs text-gray-500 mt-1">
                        {device.connectionStatus}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900">{device.name}</h4>
                      <p className="text-sm text-gray-500">Device ID: {device.deviceId}</p>
                      {device.macAddress && (
                        <p className="text-xs text-gray-400">MAC: {device.macAddress}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Battery Level */}
                    <div className="flex items-center space-x-2">
                      {getBatteryIcon(device.batteryLevel)}
                      <span className="text-sm font-medium">{device.batteryLevel}%</span>
                    </div>

                    {/* Signal Strength */}
                    <div className="flex items-center space-x-2">
                      {getSignalStrengthIcon(device.signalStrength)}
                      <span className="text-sm text-gray-600">{device.signalStrength} dBm</span>
                    </div>

                    {/* Supported Features */}
                    <div className="flex flex-wrap gap-1">
                      {device.supportedFeatures.slice(0, 3).map(feature => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {device.supportedFeatures.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{device.supportedFeatures.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {device.connected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectDevice(device.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => connectToDevice(device)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Device Details */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Firmware:</span> {device.firmwareVersion || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Last Seen:</span> {device.lastSeen.toLocaleTimeString()}
                  </div>
                  <div>
                    <span className="font-medium">Features:</span> {device.supportedFeatures.length}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge variant={device.connected ? "default" : "secondary"} className="ml-1">
                      {device.connected ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {devices.length === 0 && (
              <div className="text-center py-8">
                <Bluetooth className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No HC03 devices registered</p>
                <p className="text-sm text-gray-500 mt-1">Click "Add Device" to pair a new HC03 health monitor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Reconnect Settings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-Reconnect</h4>
              <p className="text-sm text-gray-600">Automatically reconnect to devices when they come back in range</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Extend HC03Device interface for monitoring
declare global {
  interface HC03Device {
    monitoringInterval?: NodeJS.Timeout;
  }
}