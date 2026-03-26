import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getConsolidatedVitals, VitalSign } from '../api/vitals';
import Header from '../components/Header';

const vitalTypes = [
  { key: 'all', label: 'All', icon: 'list', color: '#374151' },
  { key: 'heartRate', label: 'Heart Rate', icon: 'heart', color: '#dc2626' },
  { key: 'bloodPressure', label: 'Blood Pressure', icon: 'fitness', color: '#1e40af' },
  { key: 'temperature', label: 'Temperature', icon: 'thermometer', color: '#ea580c' },
  { key: 'oxygenLevel', label: 'Oxygen', icon: 'water', color: '#0891b2' },
  { key: 'bloodGlucose', label: 'Glucose', icon: 'droplet', color: '#7c3aed' },
];

function getStatusForVital(vital: VitalSign): { label: string; color: string } {
  const { heartRate, bloodPressureSystolic, temperature, oxygenLevel, bloodGlucose } = vital;
  const issues: string[] = [];
  if (heartRate && (heartRate < 60 || heartRate > 100)) issues.push('HR');
  if (bloodPressureSystolic && bloodPressureSystolic > 140) issues.push('BP');
  if (temperature && Number(temperature) > 37.5) issues.push('Temp');
  if (oxygenLevel && oxygenLevel < 95) issues.push('O₂');
  if (bloodGlucose && (bloodGlucose < 70 || bloodGlucose > 140)) issues.push('Glucose');

  if (issues.length === 0) return { label: 'Normal', color: '#16a34a' };
  if (issues.length <= 1) return { label: 'Warning', color: '#ca8a04' };
  return { label: 'Alert', color: '#dc2626' };
}

interface Props {
  navigation: any;
  route: { params?: { type?: string } };
}

export default function VitalsHistoryScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState(route.params?.type ?? 'all');
  const [refreshing, setRefreshing] = useState(false);

  const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = new Date().toISOString().split('T')[0];

  const { data: vitals = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/vital-signs/consolidated', user?.patientId, fromDate, toDate],
    queryFn: () => getConsolidatedVitals(user!.patientId, fromDate, toDate),
    enabled: !!user?.patientId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const renderVitalValue = (vital: VitalSign) => {
    switch (selectedType) {
      case 'heartRate':
        return { value: `${vital.heartRate} bpm`, icon: 'heart', color: '#dc2626' };
      case 'bloodPressure':
        return { value: `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`, icon: 'fitness', color: '#1e40af' };
      case 'temperature':
        return { value: `${Number(vital.temperature).toFixed(1)} °C`, icon: 'thermometer', color: '#ea580c' };
      case 'oxygenLevel':
        return { value: `${vital.oxygenLevel} %`, icon: 'water', color: '#0891b2' };
      case 'bloodGlucose':
        return { value: vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : 'No reading', icon: 'droplet', color: '#7c3aed' };
      default:
        return { value: `HR: ${vital.heartRate} | BP: ${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`, icon: 'list', color: '#374151' };
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="Vitals History"
        subtitle="Last 7 Days"
        onBack={() => navigation.goBack()}
      />

      {/* Type Filter */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 8 }}
        >
          {vitalTypes.map(({ key, label, icon, color }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedType(key)}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
              style={{
                backgroundColor: selectedType === key ? color : '#f3f4f6',
              }}
            >
              <Ionicons
                name={icon as any}
                size={14}
                color={selectedType === key ? 'white' : color}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: selectedType === key ? 'white' : '#374151' }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {vitals.length === 0 && !isLoading ? (
          <View className="items-center py-16">
            <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 text-base mt-3 font-medium">No readings found</Text>
            <Text className="text-gray-400 text-sm mt-1">Connect your HC03 to record vitals</Text>
          </View>
        ) : (
          vitals.map((vital, idx) => {
            const { value, icon, color } = renderVitalValue(vital);
            const status = getStatusForVital(vital);
            return (
              <View key={vital.id ?? idx} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: color + '20' }}
                    >
                      <Ionicons name={icon as any} size={20} color={color} />
                    </View>
                    <View>
                      <Text className="font-bold text-gray-900 text-sm">{value}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{formatDate(vital.timestamp)}</Text>
                    </View>
                  </View>
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: status.color + '20' }}
                  >
                    <Text className="text-xs font-bold" style={{ color: status.color }}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                {selectedType === 'all' && (
                  <View className="mt-3 pt-3 border-t border-gray-100 flex-row flex-wrap gap-x-4 gap-y-1">
                    <Text className="text-xs text-gray-500">❤️ {vital.heartRate} bpm</Text>
                    <Text className="text-xs text-gray-500">🫀 {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}</Text>
                    <Text className="text-xs text-gray-500">🌡️ {Number(vital.temperature).toFixed(1)}°C</Text>
                    <Text className="text-xs text-gray-500">💧 {vital.oxygenLevel}%</Text>
                    {vital.bloodGlucose && (
                      <Text className="text-xs text-gray-500">🩸 {vital.bloodGlucose} mg/dL</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
