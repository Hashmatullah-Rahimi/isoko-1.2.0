import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { FloatingView } from '@/components/animated/FloatingView';
import { gradients } from '@/theme';

function Glow({ size, color, opacity }: { size: number; color: string; opacity: number }) {
  const id = `g${color.replace('#', '')}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Deep green gradient with softly floating coloured glows.
 * Used behind the intro, welcome and login screens.
 */
export function BrandBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradients.night} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <FloatingView distance={26} duration={5200} style={{ position: 'absolute', top: -160, right: -140 }}>
        <Glow size={420} color="#14A386" opacity={0.6} />
      </FloatingView>
      <FloatingView distance={30} duration={6400} delay={600} style={{ position: 'absolute', top: 220, left: -180 }}>
        <Glow size={380} color="#F4B740" opacity={0.28} />
      </FloatingView>
      <FloatingView distance={20} duration={5800} delay={1200} style={{ position: 'absolute', bottom: -180, right: -120 }}>
        <Glow size={440} color="#4D6BF2" opacity={0.3} />
      </FloatingView>
      {children}
    </View>
  );
}
