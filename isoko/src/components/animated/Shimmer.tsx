import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radius } from '@/theme';

interface Props {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

/** Grey placeholder with a moving shine, shown while content loads. */
export function Shimmer({ width = '100%', height = 16, borderRadius = radius.sm, style }: Props) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.set(withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1));
  }, [x]);
  const shine = useAnimatedStyle(() => ({ transform: [{ translateX: `${x.value * 100}%` }] }));

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, shine]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Placeholder in the shape of a listing card. */
export function ListingCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <View style={{ width: wide ? 260 : '100%', gap: 10 }}>
      <Shimmer height={wide ? 170 : 210} borderRadius={radius.lg} />
      <Shimmer width="70%" height={16} />
      <Shimmer width="40%" height={14} />
    </View>
  );
}
