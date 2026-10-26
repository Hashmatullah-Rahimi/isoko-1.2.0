import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/listings/EmptyState';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

export default function NotFound() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <EmptyState kind="search" title={t('nf.title')} message={t('nf.text')} actionLabel={t('common.goHome')} actionIcon="home" onAction={() => router.replace('/')} />
    </View>
  );
}
