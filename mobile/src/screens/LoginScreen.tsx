import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login: saveAuth } = useAuth();

  const [emailOrPatientId, setEmailOrPatientId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => login({ emailOrPatientId, password }),
    onSuccess: async (data) => {
      if (data.success && data.token) {
        await saveAuth(data.token, data.user);
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials. Please try again.');
      }
    },
    onError: (err: Error) => {
      Alert.alert('Login Failed', err.message || 'Network error. Please check your connection.');
    },
  });

  const handleLogin = () => {
    if (!emailOrPatientId.trim()) {
      Alert.alert('Validation', 'Please enter your email or patient ID.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password.');
      return;
    }
    loginMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-gradient-to-b"
      style={{ backgroundColor: '#f0f4ff' }}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6">
          {/* Logo & Title */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: '#1e40af' }}>
              <Ionicons name="shield-checkmark" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-1">24/7 Tele H</Text>
            <Text className="text-base text-gray-500">Healthcare Monitoring</Text>

            {/* DOH Badge */}
            <View className="flex-row items-center gap-2 mt-3 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#dbeafe' }}>
              <Ionicons name="checkmark-circle" size={14} color="#1e40af" />
              <Text className="text-xs font-semibold" style={{ color: '#1e40af' }}>
                DOH Compliant · ADHCC Certified
              </Text>
            </View>
          </View>

          {/* Login Card */}
          <View className="bg-white rounded-3xl p-6 shadow-lg">
            <View className="flex-row items-center gap-2 mb-6">
              <Ionicons name="person-circle-outline" size={22} color="#1e40af" />
              <Text className="text-xl font-bold text-gray-900">Patient Login</Text>
            </View>

            {/* Email / Patient ID */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Email or Patient ID
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <Ionicons name="person-outline" size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter email or patient ID"
                  placeholderTextColor="#9ca3af"
                  value={emailOrPatientId}
                  onChangeText={setEmailOrPatientId}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Password</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <Ionicons name="lock-closed-outline" size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              className="rounded-xl py-4 items-center justify-center"
              style={{ backgroundColor: loginMutation.isPending ? '#93c5fd' : '#1e40af' }}
            >
              {loginMutation.isPending ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-base">Signing in...</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-base">Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity className="items-center mt-4">
              <Text style={{ color: '#1e40af' }} className="text-sm font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Info */}
          <View className="mt-8 items-center">
            <View className="flex-row items-center gap-2">
              <Ionicons name="lock-closed" size={14} color="#6b7280" />
              <Text className="text-xs text-gray-500">
                Secured with end-to-end encryption
              </Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1">
              Connected to 247tech.net · UAE DOH Compliant
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
