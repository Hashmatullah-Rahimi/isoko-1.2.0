import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts, radius } from '@/theme';
import { AppText } from './AppText';

interface Props extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  hint?: string;
  /** Shows a show/hide eye for passwords. */
  password?: boolean;
  suffix?: string;
}

/** Text field with a label, icon and an animated focus colour. */
export function Input({ label, icon, error, hint, password, suffix, multiline, style, onFocus, onBlur, ...rest }: Props) {
  const [hidden, setHidden] = useState(!!password);
  const focus = useSharedValue(0);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: error ? colors.danger : interpolateColor(focus.value, [0, 1], [colors.border, colors.brand]),
    backgroundColor: interpolateColor(focus.value, [0, 1], [colors.surface, '#FBFEFD']),
  }));

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <AppText variant="small" color={colors.text}>
          {label}
        </AppText>
      )}
      <Animated.View style={[styles.box, multiline && { minHeight: 120, alignItems: 'flex-start', paddingTop: 14 }, boxStyle]}>
        {icon && <Ionicons name={icon} size={19} color={colors.textMuted} style={multiline ? { marginTop: 1 } : undefined} />}
        <TextInput
          {...rest}
          multiline={multiline}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textFaint}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: 180 }));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: 180 }));
            onBlur?.(e);
          }}
          style={[styles.input, multiline && { textAlignVertical: 'top', minHeight: 96 }, style]}
        />
        {suffix && (
          <AppText variant="small" color={colors.textMuted}>
            {suffix}
          </AppText>
        )}
        {password && (
          <Pressable hitSlop={10} onPress={() => setHidden((h) => !h)}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <AppText variant="small" color={colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" color={colors.textFaint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingVertical: 12 },
});
