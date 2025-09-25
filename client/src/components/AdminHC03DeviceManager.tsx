import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Bluetooth, 
  BluetoothConnected,
  Heart, 
  Activity, 
  Thermometer, 
  Droplets,
  Battery,
  Monitor,
  Settings,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface HC03DeviceData {
  deviceId: string;
  deviceName: string;
  patientId: string;
  patientName?: string;
  connectionStatus: 'connected' | 'disconnected' | 'scanning';
  batteryLevel: number;
  chargingStatus: boolean;
  lastConnected: string;
  firmwareVersion?: string;
  macAddress?: string;
}

interface HC03MeasurementSummary {
  patientId: string;
  deviceId: string;
  patientName: string;
  lastEcg?: string;
  lastBloodOxygen?: string;
  lastBloodPressure?: string;
  lastBloodGlucose?: string;
  lastTemperature?: string;
  measurementCount: number;
}

interface AdminHC03DeviceManagerProps {
  onDeviceSelect?: (device: HC03DeviceData) => void;
}

export default function AdminHC03DeviceManager({ onDeviceSelect }: AdminHC03DeviceManagerProps) {
  const [devices, setDevices] = useState<HC03DeviceData[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<HC03MeasurementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<HC03DeviceData | null>(null);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Set up periodic refresh
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load patients first
      const patientsResponse = await fetch('/api/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData);
        
        // Load devices for each patient
        const allDevices: HC03DeviceData[] = [];
        const allMeasurements: HC03MeasurementSummary[] = [];
        
        for (const patient of patientsData) {
          if (patient.patientId) {
            try {
              // Load devices for this patient
              const devicesResponse = await fetch(`/api/hc03/devices/patient/${patient.patientId}`);
              if (devicesResponse.ok) {
                const patientDevices = await devicesResponse.json();
                
                const enhancedDevices = patientDevices.map((device: any) => ({
                  ...device,
                  patientName: `${patient.firstName} ${patient.lastName}`
                }));
                allDevices.push(...enhancedDevices);
                
                // Load measurement summary for each device
                for (const device of patientDevices) {
                  const measurementSummary = await loadMeasurementSummary(patient.patientId, device.deviceId);
                  if (measurementSummary) {
                    allMeasurements.push({
                      ...measurementSummary,
                      patientName: `${patient.firstName} ${patient.lastName}`
                    });
                  }
                }
              }
            } catch (error) {
              console.error(`Error loading devices for patient ${patient.patientId}:`, error);
            }
          }
        }
        
        setDevices(allDevices);
        setMeasurements(allMeasurements);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load device data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMeasurementSummary = async (patientId: string, deviceId: string): Promise<HC03MeasurementSummary | null> => {
    try {
      // Load recent measurements for each type
      const [ecgRes, oxygenRes, pressureRes, glucoseRes, tempRes] = await Promise.all([
        fetch(`/api/hc03/ecg/${patientId}?limit=1`),
        fetch(`/api/hc03/blood-oxygen/${patientId}?limit=1`),
        fetch(`/api/hc03/blood-pressure/${patientId}?limit=1`),
        fetch(`/api/hc03/blood-glucose/${patientId}?limit=1`),
        fetch(`/api/hc03/temperature/${patientId}?limit=1`)
      ]);

      const [ecgData, oxygenData, pressureData, glucoseData, tempData] = await Promise.all([
        ecgRes.ok ? ecgRes.json() : [],
        oxygenRes.ok ? oxygenRes.json() : [],
        pressureRes.ok ? pressureRes.json() : [],
        glucoseRes.ok ? glucoseRes.json() : [],
        tempRes.ok ? tempRes.json() : []
      ]);

      const totalMeasurements = 
        ecgData.length + 
        oxygenData.length + 
        pressureData.length + 
        glucoseData.length + 
        tempData.length;

      return {
        patientId,
        deviceId,
        patientName: '', // Will be set by caller
        lastEcg: ecgData[0]?.timestamp,
        lastBloodOxygen: oxygenData[0]?.timestamp,
        lastBloodPressure: pressureData[0]?.timestamp,
        lastBloodGlucose: glucoseData[0]?.timestamp,
        lastTemperature: tempData[0]?.timestamp,
        measurementCount: totalMeasurements
      };
    } catch (error) {
      console.error('Error loading measurement summary:', error);
      return null;
    }
  };

  const updateDeviceStatus = async (deviceId: string, status: string) => {
    try {
      const response = await fetch(`/api/hc03/devices/${deviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await loadData(); // Refresh data
        toast({
          title: "Status Updated",
          description: `Device ${deviceId} status updated to ${status}`,
        });
      }
    } catch (error) {
      console.error('Error updating device status:', error);
      toast({
        title: "Error",
        description: "Failed to update device status",
        variant: "destructive"
      });
    }
  };

  const getFilteredDevices = () => {
    return devices.filter(device => {
      const matchesSearch = 
        device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.patientId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || device.connectionStatus === statusFilter;
      const matchesPatient = selectedPatient === 'all' || device.patientId === selectedPatient;
      
      return matchesSearch && matchesStatus && matchesPatient;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-500';
      case 'scanning': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'scanning': return 'Scanning';
      default: return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const deviceStats = {
    total: devices.length,
    connected: devices.filter(d => d.connectionStatus === 'connected').length,
    disconnected: devices.filter(d => d.connectionStatus === 'disconnected').length,
    lowBattery: devices.filter(d => d.batteryLevel < 20).length
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            HC03 Device Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading device data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            HC03 Device Manager
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            data-testid="button-refresh-devices"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Device Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Total Devices</p>
                <p className="text-2xl font-bold text-blue-800" data-testid="stat-total-devices">
                  {deviceStats.total}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Connected</p>
                <p className="text-2xl font-bold text-green-800" data-testid="stat-connected-devices">
                  {deviceStats.connected}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Disconnected</p>
                <p className="text-2xl font-bold text-gray-800" data-testid="stat-disconnected-devices">
                  {deviceStats.disconnected}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">Low Battery</p>
                <p className="text-2xl font-bold text-orange-800" data-testid="stat-low-battery-devices">
                  {deviceStats.lowBattery}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
              Search Devices
            </Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by device ID, patient name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-devices"
              />
            </div>
          </div>
          
          <div className="w-48">
            <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
              Connection Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
                <SelectItem value="scanning">Scanning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48">
            <Label htmlFor="patient-filter" className="text-sm font-medium mb-2 block">
              Patient
            </Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger data-testid="select-patient-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.patientId}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Device List */}
        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices">Device Status</TabsTrigger>
            <TabsTrigger value="measurements">Recent Measurements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="devices" className="space-y-4">
            {getFilteredDevices().length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No devices found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredDevices().map((device) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    data-testid={`device-card-${device.deviceId}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {device.connectionStatus === 'connected' ? (
                          <BluetoothConnected className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Bluetooth className="h-5 w-5 text-gray-400" />
                        )}
                        <Badge 
                          className={`${getStatusColor(device.connectionStatus)} text-white`}
                        >
                          {getStatusText(device.connectionStatus)}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="font-medium" data-testid={`device-name-${device.deviceId}`}>
                          {device.deviceName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {device.deviceId} • {device.patientName} ({device.patientId})
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4" />
                          <span className="text-sm" data-testid={`battery-level-${device.deviceId}`}>
                            {device.batteryLevel}%
                          </span>
                          {device.chargingStatus && (
                            <Badge variant="secondary">Charging</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Last: {formatTimestamp(device.lastConnected)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDevice(device);
                            setShowDeviceDetails(true);
                          }}
                          data-testid={`button-view-details-${device.deviceId}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newStatus = device.connectionStatus === 'connected' ? 'disconnected' : 'connected';
                            updateDeviceStatus(device.deviceId, newStatus);
                          }}
                          data-testid={`button-toggle-status-${device.deviceId}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="measurements" className="space-y-4">
            {measurements.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No recent measurements available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {measurements.map((measurement) => (
                  <div
                    key={`${measurement.patientId}-${measurement.deviceId}`}
                    className="p-4 border rounded-lg"
                    data-testid={`measurement-card-${measurement.patientId}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">{measurement.patientName}</p>
                        <p className="text-sm text-gray-500">
                          {measurement.patientId} • {measurement.deviceId}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {measurement.measurementCount} measurements
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-gray-600">ECG</p>
                          <p className="font-medium">
                            {measurement.lastEcg ? formatTimestamp(measurement.lastEcg) : 'No data'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-gray-600">Blood O₂</p>
                          <p className="font-medium">
                            {measurement.lastBloodOxygen ? formatTimestamp(measurement.lastBloodOxygen) : 'No data'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-gray-600">Blood Pressure</p>
                          <p className="font-medium">
                            {measurement.lastBloodPressure ? formatTimestamp(measurement.lastBloodPressure) : 'No data'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="text-gray-600">Blood Glucose</p>
                          <p className="font-medium">
                            {measurement.lastBloodGlucose ? formatTimestamp(measurement.lastBloodGlucose) : 'No data'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-gray-600">Temperature</p>
                          <p className="font-medium">
                            {measurement.lastTemperature ? formatTimestamp(measurement.lastTemperature) : 'No data'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Device Details Dialog */}
      <Dialog open={showDeviceDetails} onOpenChange={setShowDeviceDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-600">Device Name</label>
                  <p>{selectedDevice.deviceName}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Device ID</label>
                  <p>{selectedDevice.deviceId}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Patient</label>
                  <p>{selectedDevice.patientName}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Patient ID</label>
                  <p>{selectedDevice.patientId}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Connection Status</label>
                  <Badge className={`${getStatusColor(selectedDevice.connectionStatus)} text-white`}>
                    {getStatusText(selectedDevice.connectionStatus)}
                  </Badge>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Battery Level</label>
                  <p>{selectedDevice.batteryLevel}%</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Charging Status</label>
                  <p>{selectedDevice.chargingStatus ? 'Charging' : 'Not Charging'}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-600">Firmware Version</label>
                  <p>{selectedDevice.firmwareVersion || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <label className="font-medium text-gray-600">MAC Address</label>
                  <p>{selectedDevice.macAddress || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <label className="font-medium text-gray-600">Last Connected</label>
                  <p>{formatTimestamp(selectedDevice.lastConnected)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}