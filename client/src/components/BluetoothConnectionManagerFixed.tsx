import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bluetooth, 
  BluetoothOff, 
  Battery, 
  Signal, 
  Heart,
  RefreshCw,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hc03Service } from '@/services/HC03NativeService';

interface HC03Device {
  id: string;
  name: string;
  batteryLevel?: number;
  signalStrength?: number;
  connected: boolean;
  lastSeen: Date;
}

interface ConnectionStats {
  totalDevices: number;
  connectedDevices: number;
  batteryAlerts: number;
}

export default function BluetoothConnectionManagerFixed({ patientId }: { patientId: string }) {
  const [devices, setDevices] = useState<HC03Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    totalDevices: 0,
    connectedDevices: 0,
    batteryAlerts: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeBluetoothService();
    checkBluetoothAvailability();
  }, []);

  const initializeBluetoothService = async () => {
    try {
      await hc03Service.initialize();
      console.log('HC03 Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize HC03 service:', error);
      toast({
        title: "Bluetooth Initialization Failed",
        description: "Web Bluetooth API is not supported in this browser",
        variant: "destructive"
      });
    }
  };

  const checkBluetoothAvailability = async () => {
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        setIsBluetoothEnabled(false);
        toast({
          title: "Bluetooth Not Supported",
          description: "Please use Chrome, Edge, or Opera browser for Bluetooth support",
          variant: "destructive"
        });
        return;
      }
      
      const availability = await nav.bluetooth.getAvailability();
      setIsBluetoothEnabled(availability);
      
      if (availability) {
        toast({
          title: "Bluetooth Ready",
          description: "You can now scan for HC03 devices",
        });
      }
    } catch (error) {
      console.error('Bluetooth availability check failed:', error);
      setIsBluetoothEnabled(false);
    }
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
      const foundDevices = await hc03Service.startScan();
      
      if (foundDevices && foundDevices.length > 0) {
        const newDevices: HC03Device[] = foundDevices.map((device: any) => ({
          id: device.id || device.deviceId,
          name: device.name,
          batteryLevel: device.batteryLevel || 100,
          signalStrength: device.signalStrength || -50,
          connected: false,
          lastSeen: new Date()
        }));

        setDevices(prev => {
          const merged = [...prev];
          newDevices.forEach(newDevice => {
            if (!merged.find(d => d.id === newDevice.id)) {
              merged.push(newDevice);
            }
          });
          updateConnectionStats(merged);
          return merged;
        });

        toast({
          title: "Devices Found",
          description: `Found ${foundDevices.length} HC03 device(s)`,
        });
      } else {
        toast({
          title: "No Devices Found",
          description: "No HC03 devices nearby. Make sure devices are powered on.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Scan failed:', error);
      
      if (error.message?.includes('User cancelled')) {
        toast({
          title: "Scan Cancelled",
          description: "Device scan was cancelled",
        });
      } else {
        toast({
          title: "Scan Failed",
          description: error.message || "Failed to scan for HC03 devices",
          variant: "destructive"
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: HC03Device) => {
    try {
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, connected: false, connecting: true }
          : d
      ) as HC03Device[]);

      await hc03Service.connect(device.id, patientId);

      setDevices(prev => {
        const updated = prev.map(d => 
          d.id === device.id 
            ? { ...d, connected: true, connecting: false, lastSeen: new Date() }
            : d
        );
        updateConnectionStats(updated);
        return updated;
      });

      toast({
        title: "Device Connected",
        description: `Successfully connected to ${device.name}`,
      });
    } catch (error: any) {
      setDevices(prev => prev.map(d => 
        d.id === device.id 
          ? { ...d, connected: false, connecting: false }
          : d
      ) as HC03Device[]);

      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to device",
        variant: "destructive"
      });
    }
  };

  const disconnectDevice = async (device: HC03Device) => {
    try {
      await hc03Service.disconnect();

      setDevices(prev => {
        const updated = prev.map(d => 
          d.id === device.id 
            ? { ...d, connected: false }
            : d
        );
        updateConnectionStats(updated);
        return updated;
      });

      toast({
        title: "Device Disconnected",
        description: `Disconnected from ${device.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect",
        variant: "destructive"
      });
    }
  };

  const updateConnectionStats = (deviceList: HC03Device[]) => {
    const stats = {
      totalDevices: deviceList.length,
      connectedDevices: deviceList.filter(d => d.connected).length,
      batteryAlerts: deviceList.filter(d => (d.batteryLevel || 100) < 25).length
    };
    setConnectionStats(stats);
  };

  return (
    <div className="space-y-4">
      {/* Bluetooth Status Header */}
      <Card data-testid="bluetooth-status-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isBluetoothEnabled ? (
                <Bluetooth className="w-5 h-5 text-blue-500" data-testid="bluetooth-enabled-icon" />
              ) : (
                <BluetoothOff className="w-5 h-5 text-gray-400" data-testid="bluetooth-disabled-icon" />
              )}
              <span>HC03 Bluetooth Devices</span>
            </div>
            <Badge variant={isBluetoothEnabled ? "default" : "secondary"} data-testid="bluetooth-status-badge">
              {isBluetoothEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center" data-testid="total-devices-stat">
              <div className="text-2xl font-bold">{connectionStats.totalDevices}</div>
              <div className="text-sm text-muted-foreground">Total Devices</div>
            </div>
            <div className="text-center" data-testid="connected-devices-stat">
              <div className="text-2xl font-bold text-green-600">{connectionStats.connectedDevices}</div>
              <div className="text-sm text-muted-foreground">Connected</div>
            </div>
            <div className="text-center" data-testid="battery-alerts-stat">
              <div className="text-2xl font-bold text-yellow-600">{connectionStats.batteryAlerts}</div>
              <div className="text-sm text-muted-foreground">Low Battery</div>
            </div>
          </div>

          <Button 
            onClick={scanForDevices} 
            disabled={!isBluetoothEnabled || isScanning}
            className="w-full"
            data-testid="scan-devices-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan for HC03 Devices'}
          </Button>
        </CardContent>
      </Card>

      {/* Browser Compatibility Alert */}
      {!isBluetoothEnabled && (
        <Alert data-testid="browser-compatibility-alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Web Bluetooth is not supported in this browser. Please use:
            <ul className="list-disc list-inside mt-2">
              <li>Google Chrome 56+</li>
              <li>Microsoft Edge 79+</li>
              <li>Opera 43+</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Device List */}
      {devices.length > 0 && (
        <Card data-testid="devices-list-card">
          <CardHeader>
            <CardTitle>Available Devices ({devices.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className="border rounded-lg p-4"
                data-testid={`device-${device.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium">{device.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.connected ? (
                      <Badge variant="default" className="bg-green-500" data-testid={`device-${device.id}-connected-badge`}>
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" data-testid={`device-${device.id}-disconnected-badge`}>Disconnected</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  {device.batteryLevel !== undefined && (
                    <div className="flex items-center gap-2">
                      <Battery className="w-4 h-4" />
                      <span>{device.batteryLevel}%</span>
                      <Progress value={device.batteryLevel} className="w-16 h-2" />
                    </div>
                  )}
                  {device.signalStrength !== undefined && (
                    <div className="flex items-center gap-2">
                      <Signal className="w-4 h-4" />
                      <span>{device.signalStrength} dBm</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!device.connected ? (
                    <Button 
                      onClick={() => connectToDevice(device)}
                      size="sm"
                      className="flex-1"
                      data-testid={`device-${device.id}-connect-button`}
                    >
                      Connect
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => disconnectDevice(device)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      data-testid={`device-${device.id}-disconnect-button`}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Devices Message */}
      {devices.length === 0 && !isScanning && (
        <Card data-testid="no-devices-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Bluetooth className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No HC03 devices found</p>
            <p className="text-sm mt-1">Click "Scan for HC03 Devices" to start searching</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
