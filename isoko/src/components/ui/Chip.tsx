import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { PressableScale } from '@/components/animated/PressableScale';
import { colors, fonts, radius } from '@/theme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Colour when selected (green for houses, blue for cars). */
  color?: string;
}

/** Small selectable pill with a smooth colour change. */
export function Chip({ label, selected = false, onPress, icon, color = colors.brand }: Props) {
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    on.set(withTiming(selected ? 1 : 0, { duration: 220 }));
  }, [on, selected]);

  const box = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [colors.surface, color]),
    borderColor: interpolateColor(on.value, [0, 1], [colors.border, color]),
  }));
  const text = useAnimatedStyle(() => ({
    color: interpolateColor(on.value, [0, 1], [colors.text, colors.white]),
  }));

  return (
    <PressableScale onPress={onPress} scaleTo={0.94}>
      <Animated.View style={[styles.chip, box]}>
        {icon && <Ionicons name={icon} size={15} color={selected ? colors.white : colors.textMuted} />}
        <Animated.Text style={[styles.label, text]}>{label}</Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
});
