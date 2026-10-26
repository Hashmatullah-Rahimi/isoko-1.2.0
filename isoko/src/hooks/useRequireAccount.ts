import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';

/**
 * Guests can look around freely. When they try to do something that needs
 * an account (save, buy, rent, message, WhatsApp), this asks them to sign up or log in.
 * Returns true if the person already has a Buyer & Renter account.
 */
export function useRequireAccount() {
  const { session, isCustomer, isOwner } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  return useCallback(() => {
    if (session && isCustomer) return true;
    if (session && isOwner) {
      Alert.alert(t('gate.ownerTitle'), t('gate.ownerText'));
      return false;
    }
    Alert.alert(t('gate.title'), t('gate.text'), [
      { text: t('common.notNow'), style: 'cancel' },
      { text: t('common.logIn'), onPress: () => router.push({ pathname: '/auth/log-in', params: { role: 'customer' } }) },
      { text: t('common.signUp'), style: 'default', onPress: () => router.push({ pathname: '/auth/sign-up', params: { role: 'customer' } }) },
    ]);
    return false;
  }, [isCustomer, isOwner, router, session, t]);
}
