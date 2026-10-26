import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Illustration } from '@/components/listings/Illustration';
import { AppText, Button, IconButton, Input } from '@/components/ui';
import { useI18n } from '@/i18n';
import { sendPasswordReset } from '@/services/auth';
import { colors, spacing } from '@/theme';

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? t('forgot.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.lg }}>
      <IconButton icon="close" onPress={() => router.back()} accessibilityLabel={t('common.close')} />
      <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center' }}>
        <Illustration kind={sent ? 'success' : 'inbox'} size={150} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120)} style={{ gap: 6 }}>
        <AppText variant="h1" color={colors.ink} align="center">
          {t(sent ? 'forgot.sentTitle' : 'forgot.title')}
        </AppText>
        <AppText variant="body" color={colors.textMuted} align="center">
          {sent ? t('forgot.sentText', { email: email.trim() }) : t('forgot.text')}
        </AppText>
      </Animated.View>
      {!sent ? (
        <Animated.View entering={FadeInDown.delay(220)} style={{ gap: spacing.md }}>
          <Input icon="mail-outline" placeholder={t('field.emailPh')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} error={error} />
          <Button title={t('forgot.send')} onPress={submit} loading={loading} disabled={!email.includes('@')} />
        </Animated.View>
      ) : (
        <Button title={t('forgot.back')} onPress={() => router.back()} />
      )}
    </View>
  );
}
