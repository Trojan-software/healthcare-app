import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useBLE } from '../contexts/BLEContext';
import { getPatientDashboard } from '../api/vitals';
import VitalCard from '../components/VitalCard';

function getHeartRateStatus(hr: number): 'normal' | 'high' | 'low' {
  if (hr < 60) return 'low';
  if (hr > 100) return 'high';
  return 'normal';
}

function getBPStatus(systolic: number): 'normal' | 'high' | 'elevated' {
  if (systolic < 120) return 'normal';
  if (systolic < 140) return 'elevated';
  return 'high';
}

function getTempStatus(temp: number): 'normal' | 'high' | 'low' {
  if (temp < 36) return 'low';
  if (temp > 37.5) return 'high';
  return 'normal';
}

function getO2Status(o2: number): 'normal' | 'low' {
  return o2 >= 95 ? 'normal' : 'low';
}

function getGlucoseStatus(glucose: number): 'normal' | 'high' | 'low' | 'elevated' {
  if (glucose < 70) return 'low';
  if (glucose <= 100) return 'normal';
  if (glucose <= 140) return 'elevated';
  return 'high';
}

interface Props {
  navigation: any;
}

export default function PatientDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { vitals: liveVitals, connectedDevice } = useBLE();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/patient', user?.id],
    queryFn: () => getPatientDashboard(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const vitals = data?.vitals;
  const hr = liveVitals.heartRate ?? vitals?.heartRate ?? 0;
  const bpParts = vitals?.bloodPressure?.split('/') ?? [];
  const sys = liveVitals.bloodPressureSystolic ?? Number(bpParts[0] ?? 0);
  const dia = liveVitals.bloodPressureDiastolic ?? Number(bpParts[1] ?? 0);
  const temp = liveVitals.temperature ?? Number(vitals?.temperature ?? 0);
  const o2 = liveVitals.oxygenLevel ?? vitals?.oxygenLevel ?? 0;
  const glucose = liveVitals.bloodGlucose ?? vitals?.bloodGlucose ?? 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="px-5 pb-5"
        style={{ backgroundColor: '#1e40af', paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-blue-200 text-sm">Welcome back</Text>
            <Text className="text-white text-xl font-bold">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-blue-300 text-xs mt-0.5">ID: {user?.patientId}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('DeviceConnect')}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: connectedDevice ? '#16a34a30' : '#ffffff20' }}
            >
              <Ionicons
                name={connectedDevice ? 'bluetooth' : 'bluetooth-outline'}
                size={20}
                color={connectedDevice ? '#4ade80' : 'white'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#ffffff20' }}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Score */}
        <View className="flex-row items-center gap-3 bg-white/10 rounded-2xl p-3">
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
            <Text className="text-white text-lg font-bold">{data?.healthScore ?? '--'}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-blue-200 text-xs">Health Score</Text>
            <View className="h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
              <View
                className="h-full rounded-full bg-green-400"
                style={{ width: `${data?.healthScore ?? 0}%` }}
              />
            </View>
          </View>
          <Text className="text-white text-sm">{data?.complianceRate ?? '--'}% Compliance</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Indicator */}
        {connectedDevice && (
          <View className="mx-4 mt-4 p-3 rounded-xl flex-row items-center gap-2"
            style={{ backgroundColor: '#dcfce7' }}>
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-green-800 text-sm font-medium">
              HC03 Device Connected — Live readings active
            </Text>
          </View>
        )}

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <View className="mx-4 mt-4 p-3 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="warning-outline" size={16} color="#dc2626" />
              <Text className="text-red-800 font-semibold text-sm">Active Alerts</Text>
            </View>
            {data.alerts.slice(0, 2).map((alert, idx) => (
              <Text key={idx} className="text-red-700 text-xs mt-1">
                • {alert.message}
              </Text>
            ))}
          </View>
        )}

        {/* Vitals Grid */}
        <View className="px-3 mt-4">
          <Text className="text-gray-700 font-bold text-base px-1 mb-2">Current Vitals</Text>
          <View className="flex-row flex-wrap">
            <VitalCard
              title="Heart Rate"
              value={hr || '--'}
              unit="bpm"
              icon="heart"
              color="#dc2626"
              bgColor="#fff1f2"
              status={hr ? getHeartRateStatus(hr) : 'unknown'}
              isLive={!!liveVitals.heartRate}
              onPress={() => navigation.navigate('VitalsHistory', { type: 'heartRate' })}
            />
            <VitalCard
              title="Blood Pressure"
              value={sys ? `${sys}/${dia}` : '--'}
              unit="mmHg"
              icon="fitness"
              color="#1e40af"
              bgColor="#eff6ff"
              status={sys ? getBPStatus(sys) : 'unknown'}
              isLive={!!liveVitals.bloodPressureSystolic}
              onPress={() => navigation.navigate('VitalsHistory', { type: 'bloodPressure' })}
            />
          </View>
          <View className="flex-row flex-wrap">
            <VitalCard
              title="Temperature"
              value={temp ? temp.toFixed(1) : '--'}
              unit="°C"
              icon="thermometer"
              color="#ea580c"
              bgColor="#fff7ed"
              status={temp ? getTempStatus(temp) : 'unknown'}
              isLive={!!liveVitals.temperature}
              onPress={() => navigation.navigate('VitalsHistory', { type: 'temperature' })}
            />
            <VitalCard
              title="Oxygen Level"
              value={o2 || '--'}
              unit="%"
              icon="water"
              color="#0891b2"
              bgColor="#ecfeff"
              status={o2 ? getO2Status(o2) : 'unknown'}
              isLive={!!liveVitals.oxygenLevel}
              onPress={() => navigation.navigate('VitalsHistory', { type: 'oxygenLevel' })}
            />
          </View>
          <View className="flex-row flex-wrap">
            <VitalCard
              title="Blood Glucose"
              value={glucose || '--'}
              unit="mg/dL"
              icon="droplet"
              color="#7c3aed"
              bgColor="#f5f3ff"
              status={glucose ? getGlucoseStatus(glucose) : 'unknown'}
              isLive={!!liveVitals.bloodGlucose}
              onPress={() => navigation.navigate('VitalsHistory', { type: 'bloodGlucose' })}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('ECG')}
              className="flex-1 m-1 rounded-2xl p-4 items-center justify-center"
              style={{ backgroundColor: '#fdf4ff', minWidth: 150 }}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: '#a21caf20' }}>
                <Ionicons name="pulse" size={20} color="#a21caf" />
              </View>
              <Text className="text-xs text-gray-500 font-medium uppercase">ECG</Text>
              <Text className="text-sm font-bold text-gray-700 mt-1">View ECG</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mt-4 mb-8">
          <Text className="text-gray-700 font-bold text-base mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('DeviceConnect')}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: '#1e40af' }}
            >
              <Ionicons name="bluetooth" size={18} color="white" />
              <Text className="text-white text-xs font-semibold mt-1">Connect HC03</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('VitalsHistory', {})}
              className="flex-1 py-3 rounded-xl items-center border border-blue-200"
              style={{ backgroundColor: '#eff6ff' }}
            >
              <Ionicons name="bar-chart-outline" size={18} color="#1e40af" />
              <Text className="text-xs font-semibold mt-1" style={{ color: '#1e40af' }}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              className="flex-1 py-3 rounded-xl items-center border border-gray-200"
              style={{ backgroundColor: 'white' }}
            >
              <Ionicons name="person-outline" size={18} color="#374151" />
              <Text className="text-xs font-semibold mt-1 text-gray-700">Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
