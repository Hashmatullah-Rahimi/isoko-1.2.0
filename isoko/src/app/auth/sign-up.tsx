import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AuthShell } from '@/components/layout/AuthShell';
import { RolePicker } from '@/components/layout/RolePicker';
import { Illustration } from '@/components/listings/Illustration';
import { AppText, Button, Input } from '@/components/ui';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { useI18n } from '@/i18n';
import { signUp } from '@/services/auth';
import { colors } from '@/theme';
import type { UserRole } from '@/types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<UserRole>(params.role === 'owner' || params.role === 'broker' ? params.role : 'customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = t('err.name');
    if (!EMAIL.test(email.trim())) e.email = t('err.email');
    if (phone.trim().replace(/\D/g, '').length < 7) e.phone = t('err.phone');
    if (password.length < 8) e.password = t('err.password');
    if (confirm !== password) e.confirm = t('err.confirm');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await signUp({ fullName, email, phone, password, role, whatsapp: role !== 'customer' && whatsapp });
      if (data.session) router.replace('/home');
      else setCheckEmail(true); // email confirmation is switched on in Supabase
    } catch (err: any) {
      setErrors({ form: err?.message ?? t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  if (checkEmail) {
    return (
      <AuthShell title={t('signup.checkTitle')} subtitle={t('signup.checkSub')}>
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 12 }}>
          <Animated.View entering={ZoomIn.springify()}>
            <Illustration kind="inbox" size={170} />
          </Animated.View>
          <AppText variant="h2" color={colors.ink} align="center">
            {t('signup.checkEmail')}
          </AppText>
          <AppText variant="body" color={colors.textMuted} align="center">
            {t('signup.checkText', { email: email.trim() })}
          </AppText>
          <Button
            title={t('signup.goLogin')}
            iconRight="arrow-forward"
            style={{ alignSelf: 'stretch', marginTop: 8 }}
            onPress={() => router.replace({ pathname: '/auth/log-in', params: { role } })}
          />
        </View>
      </AuthShell>
    );
  }

  const field = (i: number) => FadeInDown.delay(150 + i * 60).duration(400);

  return (
    <AuthShell title={t('signup.title')} subtitle={t(role === 'owner' ? 'signup.subOwner' : role === 'broker' ? 'signup.subBroker' : 'signup.subCustomer')}>
      <Animated.View entering={field(0)} style={{ gap: 8 }}>
        <AppText variant="caption" color={colors.textMuted}>
          {t('signup.accountType')}
        </AppText>
        <RolePicker value={role} onChange={setRole} />
      </Animated.View>
      <Animated.View entering={field(1)}>
        <Input label={t('field.fullName')} icon="person-outline" placeholder={t('field.fullNamePh')} value={fullName} onChangeText={setFullName} autoComplete="name" error={errors.fullName} />
      </Animated.View>
      <Animated.View entering={field(2)}>
        <Input
          label={t('field.email')}
          icon="mail-outline"
          placeholder={t('field.emailPh')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />
      </Animated.View>
      <Animated.View entering={field(3)}>
        <Input
          label={t('field.phone')}
          icon="call-outline"
          placeholder={t('field.phonePh')}
          keyboardType="phone-pad"
          autoComplete="tel"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          hint={t(role === 'customer' ? 'signup.phoneHintCustomer' : 'signup.phoneHintOwner')}
        />
      </Animated.View>
      {role !== 'customer' && (
        <Animated.View entering={FadeIn.duration(300)}>
          <ToggleRow
            value={whatsapp}
            onChange={setWhatsapp}
            icon="logo-whatsapp"
            iconColor="#1DA851"
            iconBackground="#E3F8EA"
            title={t('signup.whatsapp')}
            hint={t('signup.whatsappHint')}
          />
        </Animated.View>
      )}
      <Animated.View entering={field(4)}>
        <Input
          label={t('field.password')}
          icon="lock-closed-outline"
          placeholder={t('field.passwordPh')}
          password
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          error={errors.password}
        />
      </Animated.View>
      <Animated.View entering={field(5)}>
        <Input label={t('field.confirm')} icon="lock-closed-outline" placeholder={t('field.confirmPh')} password value={confirm} onChangeText={setConfirm} error={errors.confirm} />
      </Animated.View>
      {errors.form && (
        <Animated.View entering={FadeInDown} style={{ backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12 }}>
          <AppText variant="small" color={colors.danger}>
            {errors.form}
          </AppText>
        </Animated.View>
      )}
      <Animated.View entering={field(6)} style={{ gap: 14, marginTop: 6 }}>
        <Button title={t(role === 'owner' ? 'signup.submitOwner' : role === 'broker' ? 'signup.submitBroker' : 'signup.submit')} onPress={submit} loading={loading} iconRight="arrow-forward" />
        <AppText variant="small" color={colors.textMuted} align="center">
          {t('signup.haveAccount')}{' '}
          <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }} onPress={() => router.replace({ pathname: '/auth/log-in', params: { role } })}>
            {t('common.logIn')}
          </AppText>
        </AppText>
      </Animated.View>
    </AuthShell>
  );
}
