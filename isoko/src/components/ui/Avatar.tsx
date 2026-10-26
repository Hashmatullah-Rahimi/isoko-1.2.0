import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { gradients } from '@/theme';
import { initials } from '@/utils/format';
import { AppText } from './AppText';

export function Avatar({ name, uri, size = 44 }: { name?: string | null; uri?: string | null; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  }
  return (
    <LinearGradient
      colors={gradients.house}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <AppText variant={size > 60 ? 'h2' : 'bodyStrong'} color="#fff">
        {initials(name)}
      </AppText>
    </LinearGradient>
  );
}
