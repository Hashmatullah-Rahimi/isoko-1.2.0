import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  /** Skip the top safe-area padding (when the parent already adds it). */
  noInset?: boolean;
}

/** Title area at the top of a screen, with an optional back button. */
export function ScreenHeader({ title, subtitle, back, right, noInset }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <View style={{ paddingTop: (noInset ? 0 : insets.top) + spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
      {(back || right) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
          {back ? (
            <IconButton icon="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} accessibilityLabel={t('common.back')} />
          ) : (
            <View />
          )}
          {right}
        </View>
      )}
      <Animated.View entering={FadeInDown.duration(450)} style={{ gap: 4 }}>
        <AppText variant="h1" color={colors.ink}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="body" color={colors.textMuted}>
            {subtitle}
          </AppText>
        )}
      </Animated.View>
    </View>
  );
}
