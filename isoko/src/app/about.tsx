import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingView } from '@/components/animated/FloatingView';
import { Logo } from '@/components/brand/Logo';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Button } from '@/components/ui';
import { appConfig } from '@/config/app';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** App version and a button to download the newest update. */
export default function About() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [checking, setChecking] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const checkForUpdate = async () => {
    if (__DEV__ || !Updates.isEnabled) {
      Alert.alert(t('about.updates'), t('about.devOnly'));
      return;
    }
    setChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(t('about.readyTitle'), t('about.readyText'), [
          { text: t('about.later'), style: 'cancel' },
          { text: t('about.restart'), onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        Alert.alert(t('about.upToDate'), t('about.upToDateText', { v: version }));
      }
    } catch (e: any) {
      Alert.alert(t('about.checkFailed'), e?.message ?? t('about.tryLater'));
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
      <ScreenHeader back title={t('about.title')} />
      <View style={{ alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg }}>
        <Animated.View entering={ZoomIn.springify()}>
          <FloatingView>
            <Logo size={110} />
          </FloatingView>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', gap: 4 }}>
          <AppText variant="h2" color={colors.ink}>
            {appConfig.name}
          </AppText>
          <AppText variant="body" color={colors.textMuted}>
            {t('app.tagline')}
          </AppText>
          <AppText variant="small" color={colors.textFaint}>
            {t('about.version', { v: version })}
            {Updates.updateId ? ` · update ${Updates.updateId.slice(0, 8)}` : ''}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(250)} style={{ alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 8 }}>
          <AppText variant="body" color={colors.text}>
            {t('about.text')}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(320)} style={{ alignSelf: 'stretch' }}>
          <Button title={t('about.check')} icon="cloud-download-outline" onPress={checkForUpdate} loading={checking} />
        </Animated.View>
      </View>
    </ScrollView>
  );
}
