import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius } from '@/theme';
import { AppText } from './AppText';

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
}

/** A row with an on/off switch that slides smoothly. */
export function ToggleRow({ value, onChange, title, hint, icon, iconColor = colors.brand, iconBackground = colors.brandSoft }: Props) {
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.set(withSpring(value ? 1 : 0, { damping: 16, stiffness: 220 }));
  }, [on, value]);

  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [colors.border, '#25D366']) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * 20 }] }));

  return (
    <Pressable onPress={() => onChange(!value)} style={styles.row} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={title}>
      {icon && (
        <View style={[styles.icon, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="bodyStrong" color={colors.ink} style={{ fontSize: 14 }}>
          {title}
        </AppText>
        {hint && (
          <AppText variant="small" color={colors.textMuted} style={{ fontSize: 12 }}>
            {hint}
          </AppText>
        )}
      </View>
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  track: { width: 48, height: 28, borderRadius: 14, padding: 3 },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
});
