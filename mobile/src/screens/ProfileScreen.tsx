import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface MenuItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-5 py-4 bg-white border-b border-gray-100 active:bg-gray-50"
    >
      <View
        className="w-8 h-8 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: danger ? '#fef2f2' : '#eff6ff' }}
      >
        <Ionicons name={icon as any} size={18} color={danger ? '#dc2626' : '#1e40af'} />
      </View>
      <Text
        className="flex-1 text-base font-medium"
        style={{ color: danger ? '#dc2626' : '#111827' }}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-gray-500 text-sm">{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
}

interface Props {
  navigation: any;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Profile" onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="items-center py-8 bg-white">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: '#1e40af' }}
          >
            <Text className="text-white text-3xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{user?.fullName}</Text>
          <Text className="text-gray-500 text-sm mt-1">{user?.email}</Text>
          <View className="mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: '#dbeafe' }}>
            <Text style={{ color: '#1e40af' }} className="text-xs font-semibold">
              Patient ID: {user?.patientId}
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 mt-4">
          Personal Information
        </Text>
        <View className="rounded-xl overflow-hidden mx-4 shadow-sm">
          <MenuItem icon="mail-outline" label="Email" value={user?.email} />
          <MenuItem icon="call-outline" label="Phone" value={user?.mobileNumber} />
          <MenuItem icon="business-outline" label="Hospital" value={user?.hospitalId} />
          <MenuItem icon="calendar-outline" label="Age" value={user?.age ? `${user.age} years` : '--'} />
        </View>

        {/* Settings */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 mt-4">
          Settings
        </Text>
        <View className="rounded-xl overflow-hidden mx-4 shadow-sm">
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <MenuItem icon="language-outline" label="Language" value="English" onPress={() => {}} />
          <MenuItem icon="shield-checkmark-outline" label="Security" onPress={() => {}} />
          <MenuItem icon="bluetooth-outline" label="Bluetooth Devices" onPress={() => navigation.navigate('DeviceConnect')} />
        </View>

        {/* About */}
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 mt-4">
          About
        </Text>
        <View className="rounded-xl overflow-hidden mx-4 shadow-sm">
          <MenuItem icon="information-circle-outline" label="App Version" value="1.0.0" />
          <MenuItem icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
          <MenuItem icon="shield-outline" label="DOH Compliance" value="Certified" />
        </View>

        {/* Logout */}
        <View className="mx-4 mt-6 mb-8 rounded-xl overflow-hidden shadow-sm">
          <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </ScrollView>
    </View>
  );
}
