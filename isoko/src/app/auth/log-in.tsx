import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { AuthShell } from '@/components/layout/AuthShell';
import { RolePicker } from '@/components/layout/RolePicker';
import { AppText, Button, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { TranslationKey, useI18n } from '@/i18n';
import { logIn, WrongRoleError } from '@/services/auth';
import { colors } from '@/theme';
import type { UserRole } from '@/types';

const ROLE_LABEL: Record<UserRole, TranslationKey> = { customer: 'role.customer', owner: 'role.owner', broker: 'role.broker' };

export default function LogIn() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ role?: string }>();
  const [role, setRole] = useState<UserRole>(params.role === 'owner' || params.role === 'broker' ? params.role : 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Gentle shake when the login fails.
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const doShake = () => {
    shake.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('login.missing'));
      doShake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await logIn(email, password, role);
      await refreshProfile();
      router.replace('/home');
    } catch (err: any) {
      if (err instanceof WrongRoleError) {
        setError(t('login.wrongRole', { role: t(ROLE_LABEL[err.actualRole]) }));
      } else {
        const msg: string = err?.message ?? '';
        setError(msg.toLowerCase().includes('invalid login') ? t('login.wrong') : msg || t('login.failed'));
      }
      doShake();
    } finally {
      setLoading(false);
    }
  };

  const field = (i: number) => FadeInDown.delay(150 + i * 70).duration(400);

  return (
    <AuthShell title={t('login.title')} subtitle={t(role === 'owner' ? 'login.subOwner' : role === 'broker' ? 'login.subBroker' : 'login.subCustomer')}>
      <Animated.View entering={field(0)} style={{ gap: 8 }}>
        <AppText variant="caption" color={colors.textMuted}>
          {t('login.as')}
        </AppText>
        <RolePicker value={role} onChange={setRole} />
      </Animated.View>
      <Animated.View entering={field(1)} style={[{ gap: 16 }, shakeStyle]}>
        <Input
          label={t('field.email')}
          icon="mail-outline"
          placeholder={t('field.emailPh')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label={t('field.password')}
          icon="lock-closed-outline"
          placeholder={t('login.passwordPh')}
          password
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          onSubmitEditing={submit}
        />
      </Animated.View>
      <Animated.View entering={field(2)}>
        <AppText variant="small" color={colors.brand} align="right" onPress={() => router.push('/auth/forgot-password')}>
          {t('login.forgot')}
        </AppText>
      </Animated.View>
      {error && (
        <Animated.View entering={FadeInDown} style={{ backgroundColor: colors.dangerSoft, padding: 12, borderRadius: 12 }}>
          <AppText variant="small" color={colors.danger}>
            {error}
          </AppText>
        </Animated.View>
      )}
      <Animated.View entering={field(3)} style={{ gap: 14, marginTop: 6 }}>
        <Button title={t('common.logIn')} onPress={submit} loading={loading} iconRight="arrow-forward" />
        <AppText variant="small" color={colors.textMuted} align="center">
          {t('login.new')}{' '}
          <AppText variant="small" color={colors.brand} style={{ fontWeight: '700' }} onPress={() => router.replace({ pathname: '/auth/sign-up', params: { role } })}>
            {t('login.create')}
          </AppText>
        </AppText>
      </Animated.View>
    </AuthShell>
  );
}
