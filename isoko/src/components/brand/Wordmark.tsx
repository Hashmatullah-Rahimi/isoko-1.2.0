import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme';
import { Logo } from './Logo';

/** Logo + the word "Isoko" side by side. */
export function Wordmark({ size = 34, light = false }: { size?: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <Logo size={size} />
      <AppText
        variant="h2"
        color={light ? colors.white : colors.ink}
        style={{ fontSize: size * 0.72, lineHeight: size * 0.9, letterSpacing: -0.5 }}
      >
        Isoko
      </AppText>
    </View>
  );
}
