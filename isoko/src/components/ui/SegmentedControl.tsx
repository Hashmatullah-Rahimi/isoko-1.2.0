import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, fonts, radius, shadow } from '@/theme';

interface Option<T extends string> {
  id: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  color?: string;
  /** Use on dark backgrounds. */
  dark?: boolean;
  /** Text colour on the selected pill. */
  activeTextColor?: string;
}

/** Tabs with a sliding coloured pill under the selected one. */
export function SegmentedControl<T extends string>({ options, value, onChange, color = colors.brand, dark = false, activeTextColor = colors.white }: Props<T>) {
  const inactive = dark ? 'rgba(255,255,255,0.72)' : colors.textMuted;
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const x = useSharedValue(0);
  const segment = width / options.length;

  useEffect(() => {
    x.set(withSpring(index * segment, { damping: 20, stiffness: 220 }));
  }, [index, segment, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.wrap, dark && { backgroundColor: 'rgba(255,255,255,0.1)' }]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 8)}>
      {width > 0 && <Animated.View style={[styles.pill, shadow.soft, { width: segment, backgroundColor: color }, pill]} />}
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable key={o.id} style={styles.item} onPress={() => onChange(o.id)}>
            {o.icon && <Ionicons name={o.icon} size={15} color={active ? activeTextColor : inactive} />}
            <Animated.Text style={[styles.label, { color: active ? activeTextColor : inactive }]}>{o.label}</Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    height: 48,
  },
  pill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: radius.pill },
  item: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
});
