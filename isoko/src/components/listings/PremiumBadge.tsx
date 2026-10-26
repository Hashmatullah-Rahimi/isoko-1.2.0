import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useI18n } from '@/i18n';
import { colors, gradients, radius } from '@/theme';

/** Gold "Premium" pill shown on Premium listings. */
export function PremiumBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  const md = size === 'md';
  return (
    <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pill, md && styles.md]}>
      <Ionicons name="diamond" size={md ? 13 : 11} color={colors.brandNight} />
      <AppText variant="small" color={colors.brandNight} style={{ fontSize: md ? 13 : 11, fontWeight: '700' }}>
        {t('premium.badge')}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 24, borderRadius: radius.pill },
  md: { height: 30, paddingHorizontal: 12, gap: 6 },
});
