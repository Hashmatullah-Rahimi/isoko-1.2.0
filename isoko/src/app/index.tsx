import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BrandBackground } from '@/components/brand/BrandBackground';
import { Logo } from '@/components/brand/Logo';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { colors } from '@/theme';

const WORD = 'Isoko'.split('');

/**
 * Animated intro: the roof draws itself, the road appears, the gold dot pops,
 * then the name slides in letter by letter.
 */
export default function Intro() {
  const router = useRouter();
  const { loading, session, isGuest } = useAuth();
  const { t } = useI18n();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 2100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!introDone || loading) return;
    router.replace(session || isGuest ? '/home' : '/welcome');
  }, [introDone, loading, session, isGuest, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BrandBackground />
      <Animated.View entering={FadeIn.duration(400)}>
        <Logo size={128} animated delay={150} />
      </Animated.View>
      <View style={styles.word}>
        {WORD.map((letter, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(900 + i * 70).springify().damping(12)}>
            <AppText variant="display" color={colors.white} style={{ fontSize: 44, lineHeight: 52 }}>
              {letter}
            </AppText>
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={FadeInUp.delay(1400).duration(500)}>
        <AppText variant="body" color="rgba(255,255,255,0.72)">
          {t('app.tagline')}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandNight, gap: 6 },
  word: { flexDirection: 'row', marginTop: 22 },
});
