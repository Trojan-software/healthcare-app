import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBLE } from '../contexts/BLEContext';
import Header from '../components/Header';

type MeasurementType = 'ecg' | 'bloodPressure' | 'oxygenLevel' | 'temperature' | 'bloodGlucose';

const measurements: { type: MeasurementType; label: string; icon: string; unit: string; color: string }[] = [
  { type: 'bloodPressure', label: 'Blood Pressure', icon: 'fitness', unit: 'mmHg', color: '#1e40af' },
  { type: 'oxygenLevel', label: 'Oxygen Level', icon: 'water', unit: '%', color: '#0891b2' },
  { type: 'temperature', label: 'Temperature', icon: 'thermometer', unit: '°C', color: '#ea580c' },
  { type: 'bloodGlucose', label: 'Blood Glucose', icon: 'droplet', unit: 'mg/dL', color: '#7c3aed' },
  { type: 'ecg', label: 'ECG', icon: 'pulse', unit: 'rhythm', color: '#dc2626' },
];

interface Props {
  navigation: any;
}

export default function DeviceConnectScreen({ navigation }: Props) {
  const {
    isBluetoothAvailable,
    isScanning,
    connectedDevice,
    vitals,
    activeMeasurement,
    scanAndConnect,
    disconnect,
    startMeasurement,
    stopMeasurement,
  } = useBLE();

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="HC03 Device"
        subtitle="Bluetooth Health Monitor"
        onBack={() => navigation.goBack()}
      />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Bluetooth Status */}
        {!isBluetoothAvailable && (
          <View className="p-4 rounded-xl mb-4 flex-row items-center gap-3"
            style={{ backgroundColor: '#fef2f2' }}>
            <Ionicons name="bluetooth-outline" size={24} color="#dc2626" />
            <View className="flex-1">
              <Text className="text-red-800 font-semibold">Bluetooth Disabled</Text>
              <Text className="text-red-600 text-sm mt-0.5">
                Please enable Bluetooth to connect to your HC03 device.
              </Text>
            </View>
          </View>
        )}

        {/* Device Status Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center"
                style={{ backgroundColor: connectedDevice ? '#dcfce7' : '#f3f4f6' }}
              >
                <Ionicons
                  name={connectedDevice ? 'bluetooth' : 'bluetooth-outline'}
                  size={28}
                  color={connectedDevice ? '#16a34a' : '#6b7280'}
                />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900">HC03 Device</Text>
                <Text className="text-sm text-gray-500">Linktop Health Monitor</Text>
              </View>
            </View>
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: connectedDevice ? '#dcfce7' : '#f3f4f6' }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: connectedDevice ? '#16a34a' : '#6b7280' }}
              >
                {connectedDevice ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>

          {connectedDevice && (
            <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#f0fdf4' }}>
              <Text className="text-green-700 text-sm font-medium">
                Device: {connectedDevice.name || 'HC03 Health Monitor'}
              </Text>
              <Text className="text-green-600 text-xs mt-0.5">
                ID: {connectedDevice.id?.slice(0, 16)}...
              </Text>
            </View>
          )}

          {/* Connect / Disconnect Button */}
          <TouchableOpacity
            onPress={connectedDevice ? disconnect : scanAndConnect}
            disabled={isScanning || !isBluetoothAvailable}
            className="py-4 rounded-xl items-center justify-center flex-row gap-2"
            style={{
              backgroundColor: connectedDevice
                ? '#fef2f2'
                : isScanning
                ? '#dbeafe'
                : '#1e40af',
            }}
          >
            {isScanning ? (
              <>
                <ActivityIndicator size="small" color="#2563eb" />
                <Text className="font-bold" style={{ color: '#2563eb' }}>
                  Scanning for HC03...
                </Text>
              </>
            ) : connectedDevice ? (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
                <Text className="font-bold text-red-600">Disconnect Device</Text>
              </>
            ) : (
              <>
                <Ionicons name="search-outline" size={20} color="white" />
                <Text className="font-bold text-white">Scan & Connect HC03</Text>
              </>
            )}
          </TouchableOpacity>

          {isScanning && (
            <Text className="text-center text-xs text-gray-500 mt-2">
              Scanning for 15 seconds... Make sure HC03 is powered on.
            </Text>
          )}
        </View>

        {/* Measurements */}
        {connectedDevice && (
          <>
            <Text className="text-gray-700 font-bold text-base mb-3">Start Measurements</Text>
            {measurements.map(({ type, label, icon, unit, color }) => {
              const isActive = activeMeasurement === type;

              // Map measurement type to the correct vitals key(s) — bloodPressure and ecg
              // use composite / differently-named keys, so we resolve display value explicitly.
              const resolveDisplayValue = (): string | null => {
                switch (type) {
                  case 'bloodPressure':
                    return vitals.bloodPressureSystolic
                      ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} ${unit}`
                      : null;
                  case 'oxygenLevel':
                    return vitals.oxygenLevel != null
                      ? `${vitals.oxygenLevel} ${unit}`
                      : null;
                  case 'temperature':
                    return vitals.temperature != null
                      ? `${vitals.temperature.toFixed(1)} ${unit}`
                      : null;
                  case 'bloodGlucose':
                    return vitals.bloodGlucose != null
                      ? `${vitals.bloodGlucose} ${unit}`
                      : null;
                  case 'ecg':
                    return vitals.ecgData && vitals.ecgData.length > 0
                      ? `${vitals.ecgData.length} data points`
                      : null;
                  default:
                    return null;
                }
              };

              const displayValue = resolveDisplayValue();

              return (
                <View key={type} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: color + '20' }}
                      >
                        <Ionicons name={icon as any} size={20} color={color} />
                      </View>
                      <View>
                        <Text className="font-semibold text-gray-900">{label}</Text>
                        {displayValue !== null && (
                          <Text className="text-sm font-bold mt-0.5" style={{ color }}>
                            {displayValue}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => (isActive ? stopMeasurement() : startMeasurement(type))}
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: isActive ? '#fef2f2' : color + '15' }}
                    >
                      {isActive ? (
                        <View className="flex-row items-center gap-1">
                          <ActivityIndicator size="small" color={color} />
                          <Text className="text-xs font-bold" style={{ color }}>Stop</Text>
                        </View>
                      ) : (
                        <Text className="text-xs font-bold" style={{ color }}>Measure</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Info */}
        <View className="mt-4 p-4 rounded-xl mb-8" style={{ backgroundColor: '#eff6ff' }}>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="information-circle-outline" size={18} color="#1e40af" />
            <Text className="text-blue-800 font-semibold text-sm">About HC03</Text>
          </View>
          <Text className="text-blue-700 text-xs leading-5">
            The HC03 (Linktop Health Monitor) connects via Bluetooth BLE and measures blood pressure,
            oxygen saturation, temperature, blood glucose, and ECG. Ensure the device is powered on
            and within 10 meters before scanning.
          </Text>
          {Platform.OS === 'android' && (
            <Text className="text-blue-600 text-xs mt-2 font-medium">
              ℹ️ Android requires Location permission for Bluetooth scanning.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
