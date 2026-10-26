import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

interface Props {
  label: string;
  color?: string;
  background?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export function Badge({ label, color = colors.brand, background = colors.brandSoft, icon, style }: Props) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: background, alignSelf: 'flex-start' },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={12} color={color} />}
      <AppText variant="small" color={color} style={{ fontSize: 12 }}>
        {label}
      </AppText>
    </View>
  );
}
