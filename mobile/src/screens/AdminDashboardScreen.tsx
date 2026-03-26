import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getAdminDashboard, getPatients, PatientSummary } from '../api/vitals';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <View className="flex-1 m-1 rounded-2xl p-4 shadow-sm" style={{ backgroundColor: bgColor }}>
      <View className="w-10 h-10 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: color + '20' }}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500 mt-1">{title}</Text>
    </View>
  );
}

interface Props {
  navigation: any;
}

export default function AdminDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const { data: dashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ['/api/dashboard/admin'],
    queryFn: getAdminDashboard,
    refetchInterval: 60000,
  });

  const { data: patients = [], refetch: refetchPatients } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: getPatients,
    refetchInterval: 60000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDashboard(), refetchPatients()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const filteredPatients = patients.filter((p) =>
    p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="px-5 pb-5"
        style={{ backgroundColor: '#1e3a8a', paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-blue-200 text-sm">Admin Panel</Text>
            <Text className="text-white text-xl font-bold">
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#ffffff20' }}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          <View className="flex-row px-1">
            <View className="w-32 bg-white/10 rounded-2xl p-3 mr-2">
              <Text className="text-white text-2xl font-bold">{dashboard?.totalPatients ?? '--'}</Text>
              <Text className="text-blue-200 text-xs mt-1">Total Patients</Text>
            </View>
            <View className="w-32 rounded-2xl p-3 mr-2" style={{ backgroundColor: dashboard?.activeAlerts ? '#dc262640' : '#ffffff10' }}>
              <Text className="text-white text-2xl font-bold">{dashboard?.activeAlerts ?? '--'}</Text>
              <Text className="text-blue-200 text-xs mt-1">Active Alerts</Text>
            </View>
            <View className="w-32 bg-white/10 rounded-2xl p-3 mr-2">
              <Text className="text-white text-2xl font-bold">{dashboard?.complianceRate ?? '--'}%</Text>
              <Text className="text-blue-200 text-xs mt-1">Compliance</Text>
            </View>
            <View className="w-32 bg-white/10 rounded-2xl p-3">
              <Text className="text-white text-2xl font-bold">{dashboard?.criticalPatients ?? '--'}</Text>
              <Text className="text-blue-200 text-xs mt-1">Critical</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-sm text-gray-900"
              placeholder="Search patients by name or ID..."
              placeholderTextColor="#9ca3af"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Patient List */}
        <View className="px-4 mt-4">
          <Text className="text-gray-700 font-bold text-base mb-3">
            Patients ({filteredPatients.length})
          </Text>
          {filteredPatients.map((patient) => (
            <View key={patient.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{ backgroundColor: patient.hasAlert ? '#fef2f2' : '#eff6ff' }}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color={patient.hasAlert ? '#dc2626' : '#1e40af'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900" numberOfLines={1}>
                      {patient.fullName}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5">ID: {patient.patientId}</Text>
                    {patient.lastVitalTimestamp && (
                      <Text className="text-gray-400 text-xs mt-0.5">
                        Last: {new Date(patient.lastVitalTimestamp).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="items-end gap-2">
                  {patient.hasAlert && (
                    <View className="px-2 py-0.5 rounded-full bg-red-100">
                      <Text className="text-xs text-red-700 font-bold">⚠ Alert</Text>
                    </View>
                  )}
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: patient.status === 'active' ? '#dcfce7' : '#f3f4f6' }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: patient.status === 'active' ? '#16a34a' : '#6b7280' }}
                    >
                      {patient.status}
                    </Text>
                  </View>
                  {patient.healthScore !== undefined && (
                    <Text className="text-xs text-gray-500">Score: {patient.healthScore}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}

          {filteredPatients.length === 0 && (
            <View className="items-center py-12">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 text-base mt-3">No patients found</Text>
            </View>
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
