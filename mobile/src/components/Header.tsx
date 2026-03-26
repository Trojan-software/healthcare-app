import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export default function Header({ title, subtitle, onBack, rightAction }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-blue-800 px-4 pb-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        {onBack ? (
          <TouchableOpacity onPress={onBack} className="w-9 h-9 items-center justify-center">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View className="w-9" />
        )}

        <View className="flex-1 items-center">
          <Text className="text-white text-lg font-bold">{title}</Text>
          {subtitle && (
            <Text className="text-blue-200 text-xs mt-0.5">{subtitle}</Text>
          )}
        </View>

        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            className="w-9 h-9 items-center justify-center"
          >
            <Ionicons name={rightAction.icon} size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View className="w-9" />
        )}
      </View>
    </View>
  );
}
