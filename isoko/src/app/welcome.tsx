import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { BrandBackground } from '@/components/brand/BrandBackground';
import { Logo } from '@/components/brand/Logo';
import { AppText } from '@/components/ui/AppText';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { LanguagePill, LanguageSheet } from '@/components/layout/LanguageSheet';
import { useI18n } from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { colors, gradients, radius, spacing } from '@/theme';
import type { UserRole } from '@/types';

type Mode = 'signup' | 'login';
type IconName = keyof typeof Ionicons.glyphMap;

interface OptionProps {
  icon: IconName;
  title: string;
  text: string;
  gradient: readonly [string, string];
  iconColor: string;
  delay: number;
  onPress: () => void;
}

function OptionCard({ icon, title, text, gradient, iconColor, delay, onPress }: OptionProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify().damping(16)} layout={LinearTransition}>
      <PressableScale onPress={onPress} scaleTo={0.97} style={styles.option}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.optionIcon}>
          <Ionicons name={icon} size={26} color={iconColor} />
        </LinearGradient>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="h3" color={colors.white}>
            {title}
          </AppText>
          <AppText variant="small" color="rgba(255,255,255,0.68)">
            {text}
          </AppText>
        </View>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/**
 * The first screen people see: choose Buyer & Renter, Owner, Broker, or Guest.
 * The switch at the top changes between "Create account" and "Log in".
 */
export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>('signup');
  const [langOpen, setLangOpen] = useState(false);
  const signup = mode === 'signup';

  const goAuth = (role: UserRole) =>
    router.push({ pathname: mode === 'signup' ? '/auth/sign-up' : '/auth/log-in', params: { role } });

  const goGuest = async () => {
    await continueAsGuest();
    router.replace('/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.brandNight }}>
      <StatusBar style="light" />
      <BrandBackground />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl, paddingHorizontal: spacing.lg, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'flex-end', marginBottom: spacing.sm }}>
          <LanguagePill onPress={() => setLangOpen(true)} />
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', gap: spacing.md }}>
          <Logo size={84} />
          <View style={{ alignItems: 'center', gap: 6 }}>
            <AppText variant="display" color={colors.white} align="center">
              {t('welcome.title')}
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.72)" align="center" style={{ maxWidth: 300 }}>
              {t('welcome.subtitle')}
            </AppText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ marginTop: spacing.xxl }}>
          <View>
            <SegmentedControl<Mode>
              value={mode}
              onChange={setMode}
              dark
              color={colors.gold}
              activeTextColor={colors.brandNight}
              options={[
                { id: 'signup', label: t('welcome.createAccount'), icon: 'person-add-outline' },
                { id: 'login', label: t('welcome.logIn'), icon: 'log-in-outline' },
              ]}
            />
          </View>
        </Animated.View>

        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginLeft: 4 }}>
            {t(signup ? 'welcome.createAs' : 'welcome.logInAs')}
          </AppText>
          <OptionCard
            delay={300}
            icon="key"
            title={t('role.customer')}
            text={t(signup ? 'welcome.customerSignup' : 'welcome.customerLogin')}
            gradient={gradients.gold}
            iconColor={colors.brandNight}
            onPress={() => goAuth('customer')}
          />
          <OptionCard
            delay={400}
            icon="business"
            title={t('role.owner')}
            text={t(signup ? 'welcome.ownerSignup' : 'welcome.ownerLogin')}
            gradient={gradients.house}
            iconColor={colors.white}
            onPress={() => goAuth('owner')}
          />
          <OptionCard
            delay={500}
            icon="briefcase"
            title={t('role.broker')}
            text={t(signup ? 'welcome.brokerSignup' : 'welcome.brokerLogin')}
            gradient={gradients.broker}
            iconColor={colors.white}
            onPress={() => goAuth('broker')}
          />
          <OptionCard
            delay={600}
            icon="compass"
            title={t(signup ? 'welcome.guestSignup' : 'welcome.guestLogin')}
            text={t('welcome.guestText')}
            gradient={gradients.car}
            iconColor={colors.white}
            onPress={goGuest}
          />
        </View>

        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeInUp.delay(800)} style={{ marginTop: spacing.xl }}>
          <AppText variant="small" color="rgba(255,255,255,0.45)" align="center">
            {t('welcome.terms')}
          </AppText>
        </Animated.View>
      </ScrollView>
      <LanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  optionIcon: { width: 54, height: 54, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
