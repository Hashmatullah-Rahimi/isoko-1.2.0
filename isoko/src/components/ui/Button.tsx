import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { PressableScale } from '@/components/animated/PressableScale';
import { colors, gradients, radius, shadow } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  /** Override the gradient (e.g. blue for cars). */
  gradient?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  size = 'lg',
  gradient,
  style,
}: Props) {
  const height = size === 'lg' ? 56 : size === 'md' ? 48 : 38;
  const textColor =
    variant === 'primary' || variant === 'danger' || variant === 'gold'
      ? colors.white
      : variant === 'light'
        ? colors.brandDeep
        : variant === 'ghost'
          ? colors.brand
          : colors.ink;
  const finalText = variant === 'gold' ? colors.brandNight : textColor;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={finalText} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={finalText} />}
          <AppText variant={size === 'sm' ? 'small' : 'bodyStrong'} color={finalText}>
            {title}
          </AppText>
          {iconRight && <Ionicons name={iconRight} size={size === 'sm' ? 16 : 20} color={finalText} />}
        </>
      )}
    </View>
  );

  const base: ViewStyle = { height, borderRadius: radius.pill, overflow: 'hidden', opacity: disabled ? 0.5 : 1 };

  const gradientColors =
    gradient ?? (variant === 'gold' ? gradients.gold : variant === 'danger' ? ([colors.danger, '#C93338'] as const) : gradients.house);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        base,
        (variant === 'primary' || variant === 'gold') && shadow.card,
        variant === 'secondary' && { backgroundColor: colors.surfaceAlt },
        variant === 'light' && { backgroundColor: colors.white },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
        style,
      ]}
    >
      {variant === 'primary' || variant === 'gold' || variant === 'danger' ? (
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.fill}>{content}</View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
