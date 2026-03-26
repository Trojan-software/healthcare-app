import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/contexts/AuthContext';
import { BLEProvider } from './src/contexts/BLEContext';
import AppNavigator from './src/navigation';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#1e40af"
          translucent={Platform.OS === 'android'}
        />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BLEProvider>
              <AppNavigator />
            </BLEProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
