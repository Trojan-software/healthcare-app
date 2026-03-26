import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VitalCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  status?: 'normal' | 'high' | 'low' | 'elevated' | 'unknown';
  isLive?: boolean;
  onPress?: () => void;
}

const statusColors: Record<string, string> = {
  normal: '#16a34a',
  high: '#dc2626',
  low: '#2563eb',
  elevated: '#ca8a04',
  unknown: '#6b7280',
};

const statusLabels: Record<string, string> = {
  normal: 'Normal',
  high: 'High',
  low: 'Low',
  elevated: 'Elevated',
  unknown: '--',
};

export default function VitalCard({
  title,
  value,
  unit,
  icon,
  color,
  bgColor,
  status = 'unknown',
  isLive = false,
  onPress,
}: VitalCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-1 m-1 rounded-2xl p-4 shadow-sm"
      style={{ backgroundColor: bgColor, minWidth: 150 }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {isLive && (
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <Text className="text-xs text-red-500 font-semibold">LIVE</Text>
          </View>
        )}
      </View>

      <Text className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
        {title}
      </Text>

      <View className="flex-row items-end gap-1">
        <Text className="text-2xl font-bold text-gray-900">
          {value === undefined || value === null || value === 0 ? '--' : value}
        </Text>
        <Text className="text-sm text-gray-500 mb-1">{unit}</Text>
      </View>

      {status !== 'unknown' && (
        <View
          className="mt-2 self-start px-2 py-0.5 rounded-full"
          style={{ backgroundColor: statusColors[status] + '20' }}
        >
          <Text className="text-xs font-semibold" style={{ color: statusColors[status] }}>
            {statusLabels[status]}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
