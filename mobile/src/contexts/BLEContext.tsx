import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export interface BLEVitals {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenLevel?: number;
  temperature?: number;
  bloodGlucose?: number;
  ecgData?: number[];
}

type MeasurementType = 'ecg' | 'bloodPressure' | 'oxygenLevel' | 'temperature' | 'bloodGlucose';

interface BLEContextValue {
  isBluetoothAvailable: boolean;
  isScanning: boolean;
  connectedDevice: Device | null;
  vitals: BLEVitals;
  activeMeasurement: MeasurementType | null;
  scanAndConnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  startMeasurement: (type: MeasurementType) => Promise<void>;
  stopMeasurement: () => void;
}

const BLEContext = createContext<BLEContextValue | null>(null);

const HC03_SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
const HC03_CHARACTERISTIC_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';

export function BLEProvider({ children }: { children: React.ReactNode }) {
  const managerRef = useRef<BleManager | null>(null);
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [vitals, setVitals] = useState<BLEVitals>({});
  const [activeMeasurement, setActiveMeasurement] = useState<MeasurementType | null>(null);
  const subscriptionRef = useRef<ReturnType<Device['monitorCharacteristicForService']> | null>(null);

  useEffect(() => {
    const manager = new BleManager();
    managerRef.current = manager;

    const subscription = manager.onStateChange((state) => {
      setIsBluetoothAvailable(state === State.PoweredOn);
    }, true);

    return () => {
      subscription.remove();
      manager.destroy();
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version as number;
      if (apiLevel >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  };

  const scanAndConnect = async () => {
    const manager = managerRef.current;
    if (!manager) return;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Required', 'Bluetooth permissions are required to connect to the HC03 device.');
      return;
    }

    setIsScanning(true);
    setVitals({});

    manager.startDeviceScan(
      [HC03_SERVICE_UUID],
      { allowDuplicates: false },
      async (error, device) => {
        if (error) {
          setIsScanning(false);
          Alert.alert('Scan Error', error.message);
          return;
        }

        if (device && (device.name?.includes('HC03') || device.name?.includes('Linktop') || device.name?.includes('UNKTOP'))) {
          manager.stopDeviceScan();
          setIsScanning(false);

          try {
            const connected = await device.connect();
            await connected.discoverAllServicesAndCharacteristics();
            setConnectedDevice(connected);

            connected.onDisconnected(() => {
              setConnectedDevice(null);
              setActiveMeasurement(null);
            });
          } catch (connectError: any) {
            Alert.alert('Connection Error', connectError.message);
          }
        }
      },
    );

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 15000);
  };

  const disconnect = async () => {
    if (connectedDevice) {
      subscriptionRef.current?.remove();
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
      setActiveMeasurement(null);
      setVitals({});
    }
  };

  const parseHC03Data = (base64Data: string, type: MeasurementType) => {
    try {
      const bytes = Buffer.from(base64Data, 'base64');
      switch (type) {
        case 'bloodPressure':
          if (bytes.length >= 3) {
            setVitals((prev) => ({
              ...prev,
              bloodPressureSystolic: bytes[1],
              bloodPressureDiastolic: bytes[2],
              heartRate: bytes[3] || prev.heartRate,
            }));
          }
          break;
        case 'oxygenLevel':
          if (bytes.length >= 2) {
            setVitals((prev) => ({
              ...prev,
              oxygenLevel: bytes[1],
              heartRate: bytes[2] || prev.heartRate,
            }));
          }
          break;
        case 'temperature':
          if (bytes.length >= 2) {
            const temp = ((bytes[1] << 8) | bytes[2]) / 10;
            setVitals((prev) => ({ ...prev, temperature: temp }));
          }
          break;
        case 'bloodGlucose':
          if (bytes.length >= 2) {
            const glucose = (bytes[1] << 8) | bytes[2];
            setVitals((prev) => ({ ...prev, bloodGlucose: glucose }));
          }
          break;
        case 'ecg':
          const ecgPoints = Array.from(bytes).slice(1).map((b) => b - 128);
          setVitals((prev) => ({
            ...prev,
            ecgData: [...(prev.ecgData || []), ...ecgPoints].slice(-500),
          }));
          break;
      }
    } catch {
    }
  };

  const startMeasurement = async (type: MeasurementType) => {
    if (!connectedDevice) {
      Alert.alert('No Device', 'Please connect to HC03 device first.');
      return;
    }

    setActiveMeasurement(type);

    const commandMap: Record<MeasurementType, number[]> = {
      bloodPressure: [0xAA, 0x01, 0xAB],
      oxygenLevel: [0xAA, 0x02, 0xAC],
      temperature: [0xAA, 0x03, 0xAD],
      bloodGlucose: [0xAA, 0x04, 0xAE],
      ecg: [0xAA, 0x05, 0xAF],
    };

    try {
      const command = Buffer.from(commandMap[type]).toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(
        HC03_SERVICE_UUID,
        HC03_CHARACTERISTIC_UUID,
        command,
      );

      subscriptionRef.current?.remove();
      subscriptionRef.current = connectedDevice.monitorCharacteristicForService(
        HC03_SERVICE_UUID,
        HC03_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          parseHC03Data(characteristic.value, type);
        },
      );
    } catch (err: any) {
      Alert.alert('Measurement Error', err.message);
      setActiveMeasurement(null);
    }
  };

  const stopMeasurement = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setActiveMeasurement(null);
  };

  return (
    <BLEContext.Provider
      value={{
        isBluetoothAvailable,
        isScanning,
        connectedDevice,
        vitals,
        activeMeasurement,
        scanAndConnect,
        disconnect,
        startMeasurement,
        stopMeasurement,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
}

export function useBLE() {
  const ctx = useContext(BLEContext);
  if (!ctx) throw new Error('useBLE must be used within BLEProvider');
  return ctx;
}
