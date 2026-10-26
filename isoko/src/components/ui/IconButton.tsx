import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PressableScale } from '@/components/animated/PressableScale';
import { colors, shadow } from '@/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  onPress,
  size = 44,
  color = colors.ink,
  background = colors.surface,
  style,
  elevated = true,
  accessibilityLabel,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, alignItems: 'center', justifyContent: 'center' },
        elevated && shadow.soft,
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={color} />
    </PressableScale>
  );
}
