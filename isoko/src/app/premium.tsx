import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingView } from '@/components/animated/FloatingView';
import { PressableScale } from '@/components/animated/PressableScale';
import { Shimmer } from '@/components/animated/Shimmer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/listings/EmptyState';
import { PremiumBadge } from '@/components/listings/PremiumBadge';
import { AppText, Button } from '@/components/ui';
import { appConfig } from '@/config/app';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { fetchMyListings, isPremium } from '@/services/listings';
import { fetchMyPremiumRequests, requestPremium } from '@/services/premium';
import { openWhatsApp } from '@/services/whatsapp';
import { colors, gradients, radius, shadow, spacing } from '@/theme';
import type { Listing, PremiumPlan, PremiumRequest } from '@/types';
import { formatDate, formatPrice } from '@/utils/format';

const PLANS: PremiumPlan[] = ['week', 'month'];

/**
 * Owners and brokers ask for a listing to become Premium:
 * shown first, in the "Premium" row on Home, with a gold badge.
 * The Isoko team turns it on after payment.
 */
export default function Premium() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { session, profile } = useAuth();
  const params = useLocalSearchParams<{ listing?: string }>();

  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState<string | undefined>(params.listing);
  const [plan, setPlan] = useState<PremiumPlan>('month');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let alive = true;
      Promise.all([fetchMyListings(session.user.id), fetchMyPremiumRequests(session.user.id)])
        .then(([l, r]) => {
          if (!alive) return;
          setListings(l.filter((x) => x.status === 'active'));
          setRequests(r);
        })
        .catch(() => undefined)
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }, [session]),
  );

  const listing = listings.find((l) => l.id === picked);
  const pending = !!listing && requests.some((r) => r.listing_id === listing.id && r.status === 'pending');
  const { currency, plans, teamWhatsApp } = appConfig.premium;

  const send = async () => {
    if (!session || !listing) return;
    setSending(true);
    try {
      await requestPremium(session.user.id, listing.id, plan);
      setRequests((r) => [{ id: 'new', listing_id: listing.id, owner_id: session.user.id, plan, status: 'pending', created_at: new Date().toISOString() }, ...r]);
      setSent(true);
    } catch (e: any) {
      Alert.alert(t('premium.failed'), e?.message === 'ALREADY_PENDING' ? t('premium.alreadyPending') : (e?.message ?? t('common.error')));
    } finally {
      setSending(false);
    }
  };

  const chatTeam = () =>
    openWhatsApp(
      teamWhatsApp,
      t('premium.waMessage', {
        title: listing?.title ?? '',
        plan: t(plan === 'week' ? 'premium.week' : 'premium.month'),
        price: formatPrice(plans[plan].price, currency),
      }),
    );

  // ---------- Sent ----------
  if (sent && listing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <StatusBar style="dark" />
        <Animated.View entering={ZoomIn.springify().damping(10)} style={{ alignItems: 'center' }}>
          <LinearGradient colors={gradients.gold} style={styles.bigIcon}>
            <Ionicons name="diamond" size={46} color={colors.brandNight} />
          </LinearGradient>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(150)} style={{ gap: 6 }}>
          <AppText variant="h1" color={colors.ink} align="center">
            {t('premium.sentTitle')}
          </AppText>
          <AppText variant="body" color={colors.textMuted} align="center">
            {t('premium.sentText', { phone: profile?.phone || t('premium.yourPhone') })}
          </AppText>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(280)} style={{ gap: 10, marginTop: spacing.md }}>
          {!!teamWhatsApp && <Button title={t('premium.chatTeam')} icon="logo-whatsapp" gradient={['#25D366', '#1DA851']} onPress={chatTeam} />}
          <Button title={t('common.done')} variant="outline" onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }} showsVerticalScrollIndicator={false}>
        <ScreenHeader back title={t('premium.title')} subtitle={t('premium.sub')} />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          {/* What Premium gives you */}
          <Animated.View entering={FadeInDown.duration(450)}>
            <LinearGradient colors={gradients.night} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, shadow.card]}>
              <FloatingView distance={6} style={styles.heroIcon}>
                <LinearGradient colors={gradients.gold} style={styles.diamond}>
                  <Ionicons name="diamond" size={28} color={colors.brandNight} />
                </LinearGradient>
              </FloatingView>
              <AppText variant="h2" color={colors.white}>
                {t('premium.heroTitle')}
              </AppText>
              {(['premium.benefit1', 'premium.benefit2', 'premium.benefit3'] as const).map((k, i) => (
                <Animated.View key={k} entering={FadeInDown.delay(150 + i * 90)} style={styles.benefit}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
                  <AppText variant="body" color="rgba(255,255,255,0.86)" style={{ flex: 1 }}>
                    {t(k)}
                  </AppText>
                </Animated.View>
              ))}
            </LinearGradient>
          </Animated.View>

          {/* 1. Which listing */}
          <AppText variant="h3" color={colors.ink}>
            {t('premium.pickListing')}
          </AppText>
          {loading ? (
            <View style={{ gap: 10 }}>
              <Shimmer height={76} />
              <Shimmer height={76} />
            </View>
          ) : listings.length === 0 ? (
            <EmptyState
              kind="house"
              compact
              title={t('premium.noListings')}
              message={t('premium.noListingsText')}
              actionLabel={t('empty.post')}
              actionIcon="add"
              onAction={() => router.navigate('/post')}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {listings.map((l, i) => {
                const active = l.id === picked;
                const cat = CATEGORIES[l.category];
                const already = isPremium(l);
                const waiting = requests.some((r) => r.listing_id === l.id && r.status === 'pending');
                return (
                  <Animated.View key={l.id} entering={FadeInDown.delay(Math.min(i, 6) * 60).duration(350)}>
                    <PressableScale onPress={() => setPicked(l.id)} style={[styles.pick, active && styles.pickActive]}>
                      <View style={styles.thumb}>
                        {l.photos[0] ? (
                          <Image source={{ uri: l.photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        ) : (
                          <LinearGradient colors={cat.gradient} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                            <Ionicons name={cat.icon} size={22} color={colors.white} />
                          </LinearGradient>
                        )}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="bodyStrong" color={colors.ink} numberOfLines={1}>
                          {l.title}
                        </AppText>
                        <AppText variant="small" color={already ? colors.goldDeep : waiting ? colors.car : colors.textMuted} numberOfLines={1}>
                          {already
                            ? t('premium.until', { date: formatDate(new Date(l.featured_until!), false) })
                            : waiting
                              ? t('premium.waiting')
                              : formatPrice(l.price, l.currency, l.price_period)}
                        </AppText>
                      </View>
                      {already ? <PremiumBadge /> : <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? colors.goldDeep : colors.textFaint} />}
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* 2. How long */}
          {listings.length > 0 && (
            <>
              <AppText variant="h3" color={colors.ink}>
                {t('premium.pickPlan')}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {PLANS.map((p) => {
                  const active = p === plan;
                  return (
                    <PressableScale key={p} onPress={() => setPlan(p)} style={[styles.plan, shadow.soft, active && styles.planActive]}>
                      {p === 'month' && (
                        <View style={styles.best}>
                          <AppText variant="small" color={colors.brandNight} style={{ fontSize: 11, fontWeight: '700' }}>
                            {t('premium.bestValue')}
                          </AppText>
                        </View>
                      )}
                      <AppText variant="bodyStrong" color={active ? colors.goldDeep : colors.ink}>
                        {t(p === 'week' ? 'premium.week' : 'premium.month')}
                      </AppText>
                      <AppText variant="h2" color={colors.ink}>
                        {formatPrice(plans[p].price, currency)}
                      </AppText>
                      <AppText variant="small" color={colors.textMuted}>
                        {t('premium.days', { n: plans[p].days })}
                      </AppText>
                    </PressableScale>
                  );
                })}
              </View>

              <View style={styles.note}>
                <Ionicons name="information-circle" size={18} color={colors.goldDeep} />
                <AppText variant="small" color={colors.text} style={{ flex: 1 }}>
                  {t('premium.how')}
                </AppText>
              </View>

              <Button
                title={pending ? t('premium.waiting') : listing && isPremium(listing) ? t('premium.extend') : t('premium.request')}
                icon="diamond"
                variant="gold"
                disabled={!listing || pending}
                loading={sending}
                onPress={send}
              />
              {!listing && (
                <AppText variant="small" color={colors.textMuted} align="center">
                  {t('premium.pickFirst')}
                </AppText>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, padding: spacing.lg, gap: 10, overflow: 'hidden' },
  heroIcon: { alignSelf: 'flex-start', marginBottom: 4 },
  diamond: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bigIcon: { width: 110, height: 110, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  pickActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  thumb: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  plan: { flex: 1, padding: 14, paddingTop: 18, gap: 4, borderRadius: radius.lg, borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surface },
  planActive: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  best: { position: 'absolute', top: -10, right: 10, paddingHorizontal: 8, height: 20, borderRadius: 10, backgroundColor: colors.gold, justifyContent: 'center' },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: colors.goldSoft },
});
