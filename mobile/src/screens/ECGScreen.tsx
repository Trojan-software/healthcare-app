import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useBLE } from '../contexts/BLEContext';
import Header from '../components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 200;

function ECGChart({ data }: { data: number[] }) {
  if (!data || data.length < 2) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-gray-400 text-sm">No ECG data — start measurement</Text>
      </View>
    );
  }

  const display = data.slice(-250);
  const min = Math.min(...display);
  const max = Math.max(...display);
  const range = max - min || 1;
  const padding = 10;
  const plotWidth = CHART_WIDTH - 2 * padding;
  const plotHeight = CHART_HEIGHT - 2 * padding;

  const points = display
    .map((val, i) => {
      const x = padding + (i / (display.length - 1)) * plotWidth;
      const y = CHART_HEIGHT - padding - ((val - min) / range) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={{ backgroundColor: '#0a0a0a', borderRadius: 12 }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
        <Line
          key={i}
          x1={padding}
          y1={padding + r * plotHeight}
          x2={CHART_WIDTH - padding}
          y2={padding + r * plotHeight}
          stroke="#1a3a1a"
          strokeWidth={0.5}
        />
      ))}
      <Polyline
        points={points}
        fill="none"
        stroke="#00ff41"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface Props {
  navigation: any;
}

export default function ECGScreen({ navigation }: Props) {
  const { connectedDevice, vitals, activeMeasurement, startMeasurement, stopMeasurement } = useBLE();
  const isRecording = activeMeasurement === 'ecg';

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="ECG Monitor"
        subtitle="Electrocardiogram"
        onBack={() => navigation.goBack()}
      />

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View
          className="p-4 rounded-2xl mb-4 flex-row items-center gap-3"
          style={{ backgroundColor: connectedDevice ? (isRecording ? '#dcfce7' : '#eff6ff') : '#f3f4f6' }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: connectedDevice ? '#1e40af20' : '#6b728020' }}
          >
            <Ionicons name="pulse" size={22} color={connectedDevice ? '#1e40af' : '#6b7280'} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">
              {isRecording ? 'Recording ECG...' : connectedDevice ? 'Ready to Record' : 'No Device Connected'}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5">
              {isRecording
                ? `${vitals.ecgData?.length ?? 0} data points captured`
                : connectedDevice
                ? 'Press Start to begin ECG recording'
                : 'Connect HC03 device first'}
            </Text>
          </View>
          {isRecording && <ActivityIndicator size="small" color="#16a34a" />}
        </View>

        {/* ECG Chart */}
        <View className="mb-4">
          <Text className="text-gray-700 font-bold text-sm mb-2">ECG Waveform</Text>
          <ECGChart data={vitals.ecgData ?? []} />
        </View>

        {/* Heart Rate from ECG */}
        {vitals.heartRate && (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <View className="flex-row items-center gap-3">
              <Ionicons name="heart" size={24} color="#dc2626" />
              <View>
                <Text className="text-gray-500 text-xs">Heart Rate (from ECG)</Text>
                <Text className="text-3xl font-bold text-gray-900">
                  {vitals.heartRate} <Text className="text-base font-normal text-gray-500">bpm</Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Controls */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('DeviceConnect')}
            className="flex-1 py-4 rounded-xl items-center border border-gray-200 bg-white"
            disabled={!!connectedDevice}
          >
            <Ionicons name="bluetooth" size={20} color={connectedDevice ? '#16a34a' : '#6b7280'} />
            <Text className="text-xs font-semibold text-gray-700 mt-1">
              {connectedDevice ? 'Connected' : 'Connect HC03'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (isRecording ? stopMeasurement() : startMeasurement('ecg'))}
            disabled={!connectedDevice}
            className="flex-2 flex-1 py-4 rounded-xl items-center"
            style={{
              backgroundColor: !connectedDevice ? '#e5e7eb' : isRecording ? '#fef2f2' : '#dc2626',
            }}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'radio-button-on'}
              size={22}
              color={!connectedDevice ? '#9ca3af' : isRecording ? '#dc2626' : 'white'}
            />
            <Text
              className="text-xs font-bold mt-1"
              style={{
                color: !connectedDevice ? '#9ca3af' : isRecording ? '#dc2626' : 'white',
              }}
            >
              {isRecording ? 'Stop Recording' : 'Start ECG'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="p-4 rounded-xl" style={{ backgroundColor: '#eff6ff' }}>
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="information-circle-outline" size={16} color="#1e40af" />
            <Text className="text-blue-800 font-semibold text-sm">ECG Guide</Text>
          </View>
          <Text className="text-blue-700 text-xs leading-5">
            Place the HC03 electrodes on your wrists and remain still during recording.
            A minimum of 30 seconds is recommended for a reliable ECG reading.
            This is for monitoring purposes only — consult your physician for diagnosis.
          </Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
