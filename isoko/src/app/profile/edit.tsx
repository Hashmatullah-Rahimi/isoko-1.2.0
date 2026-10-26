import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, Avatar, Button, Input } from '@/components/ui';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { updateProfile } from '@/services/auth';
import { colors, spacing } from '@/theme';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { session, profile, isOwner, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [waOn, setWaOn] = useState(!!profile?.whatsapp_enabled);
  const [waNumber, setWaNumber] = useState(profile?.whatsapp || profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const waValid = !waOn || waNumber.replace(/\D/g, '').length >= 7;

  const save = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await updateProfile(session.user.id, {
        full_name: name.trim(),
        phone: phone.trim() || null,
        ...(isOwner ? { whatsapp: waNumber.trim() || null, whatsapp_enabled: waOn } : {}),
      });
      await refreshProfile();
      router.back();
    } catch (e: any) {
      Alert.alert(t('edit.saveFailed'), e?.message ?? t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} keyboardShouldPersistTaps="handled">
        <ScreenHeader back title={t('edit.title')} subtitle={session?.user.email ?? ''} />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          <Animated.View entering={FadeInDown.delay(80)} style={{ alignItems: 'center', marginBottom: spacing.sm }}>
            <Avatar name={name} uri={profile?.avatar_url} size={90} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(140)}>
            <Input label={t('field.fullName')} icon="person-outline" value={name} onChangeText={setName} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200)}>
            <Input label={t('field.phone')} icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} hint={t('edit.phoneHint')} />
          </Animated.View>

          {isOwner && (
            <Animated.View entering={FadeInDown.delay(260)} style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <AppText variant="caption" color={colors.textMuted}>
                {t('edit.whatsappTitle')}
              </AppText>
              <ToggleRow value={waOn} onChange={setWaOn} icon="logo-whatsapp" iconColor="#1DA851" iconBackground="#E3F8EA" title={t('edit.whatsappOn')} />
              {waOn && (
                <Animated.View entering={FadeIn.duration(250)}>
                  <Input
                    label={t('edit.whatsappNumber')}
                    icon="logo-whatsapp"
                    keyboardType="phone-pad"
                    value={waNumber}
                    onChangeText={setWaNumber}
                    placeholder="+250 788 123 456"
                    hint={t('edit.whatsappHint')}
                    error={waValid ? null : t('err.phone')}
                  />
                </Animated.View>
              )}
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(320)} style={{ marginTop: spacing.sm }}>
            <Button title={t('common.saveChanges')} icon="checkmark" onPress={save} loading={saving} disabled={name.trim().length < 2 || !waValid} />
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
