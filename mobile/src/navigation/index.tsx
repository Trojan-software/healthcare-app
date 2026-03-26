import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import PatientDashboardScreen from '../screens/PatientDashboardScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import VitalsHistoryScreen from '../screens/VitalsHistoryScreen';
import DeviceConnectScreen from '../screens/DeviceConnectScreen';
import ECGScreen from '../screens/ECGScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  PatientDashboard: undefined;
  AdminDashboard: undefined;
  VitalsHistory: { type?: string };
  DeviceConnect: undefined;
  ECG: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-800">
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  const isAdmin = user?.role === 'admin';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isAdmin ? (
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="PatientDashboard" component={PatientDashboardScreen} />
            <Stack.Screen name="VitalsHistory" component={VitalsHistoryScreen} />
            <Stack.Screen name="DeviceConnect" component={DeviceConnectScreen} />
            <Stack.Screen name="ECG" component={ECGScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
