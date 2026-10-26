import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandBackground } from '@/components/brand/BrandBackground';
import { Logo } from '@/components/brand/Logo';
import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { useI18n } from '@/i18n';
import { LanguagePill, LanguageSheet } from './LanguageSheet';
import { colors, radius, spacing } from '@/theme';

interface Props {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/** Dark brand header with a white form card that slides up from the bottom. */
export function AuthShell({ title, subtitle, children }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNight }}>
      <StatusBar style="light" />
      <BrandBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <IconButton
                icon="chevron-back"
                background="rgba(255,255,255,0.12)"
                color={colors.white}
                elevated={false}
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
                accessibilityLabel={t('common.back')}
              />
              <LanguagePill onPress={() => setLangOpen(true)} />
            </View>
            <Animated.View entering={FadeInDown.duration(500)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Logo size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="h1" color={colors.white}>
                  {title}
                </AppText>
                <AppText variant="small" color="rgba(255,255,255,0.7)">
                  {subtitle}
                </AppText>
              </View>
            </Animated.View>
          </View>
          <Animated.View entering={SlideInDown.duration(550).springify().damping(20)} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
            {children}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
});
