import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingView } from '@/components/animated/FloatingView';
import { PressableScale } from '@/components/animated/PressableScale';
import { ListingCardSkeleton } from '@/components/animated/Shimmer';
import { Logo } from '@/components/brand/Logo';
import { TAB_BAR_SPACE } from '@/components/layout/AnimatedTabBar';
import { MessagesButton } from '@/components/layout/MessagesButton';
import { Illustration } from '@/components/listings/Illustration';
import { ListingCard } from '@/components/listings/ListingCard';
import { AppText, Avatar, Button } from '@/components/ui';
import { CATEGORIES, CATEGORY_LIST, CategoryInfo } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { isBackendConfigured } from '@/lib/supabase';
import { fetchCounts, fetchListings, fetchMyListings, fetchPremiumListings } from '@/services/listings';
import { fetchReceivedRequests } from '@/services/requests';
import { colors, gradients, radius, shadow, spacing } from '@/theme';
import type { CategoryId, Listing } from '@/types';
import { greeting } from '@/utils/format';

function CategoryCard({ cat, count, index }: { cat: CategoryInfo; count: number; index: number }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <Animated.View entering={ZoomIn.delay(150 + index * 120).springify().damping(14)} style={{ flex: 1 }}>
      <PressableScale onPress={() => router.navigate(cat.id === 'house' ? '/houses' : '/cars')} style={[styles.catCard, shadow.card]}>
        <LinearGradient colors={cat.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <FloatingView distance={6} duration={2800} delay={index * 400} style={styles.catArt}>
          <Illustration kind={cat.id} size={110} />
        </FloatingView>
        <View style={styles.catIcon}>
          <Ionicons name={cat.icon} size={20} color={cat.color} />
        </View>
        <View style={{ marginTop: 'auto' }}>
          <AppText variant="h2" color={colors.white}>
            {t(cat.pluralKey)}
          </AppText>
          <AppText variant="small" color="rgba(255,255,255,0.82)">
            {count > 0 ? t('home.listings', { n: count }) : t('home.catSub')}
          </AppText>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function SectionShortcuts({ cat, counts, delay }: { cat: CategoryInfo; counts: Record<string, number>; delay: number }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} style={{ gap: 10 }}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.dot, { backgroundColor: cat.color }]} />
          <AppText variant="h3" color={colors.ink}>
            {t(cat.pluralKey)}
          </AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {cat.sections.map((s) => {
          const n = counts[`${cat.id}-${s.id}`] ?? 0;
          return (
            <PressableScale
              key={s.id}
              onPress={() => router.navigate({ pathname: cat.id === 'house' ? '/houses' : '/cars', params: { section: s.id } })}
              style={[styles.shortcut, shadow.soft]}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: cat.soft }]}>
                <Ionicons name={s.icon} size={20} color={cat.color} />
              </View>
              <AppText variant="bodyStrong" color={colors.ink} style={{ fontSize: 13 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {t(s.shortKey)}
              </AppText>
              <AppText variant="small" color={colors.textMuted} style={{ fontSize: 12 }} numberOfLines={1}>
                {n > 0 ? t('home.listed', { n }) : s.id === 'accessory' && cat.id === 'car' ? t('home.partsMore') : t('home.explore')}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </Animated.View>
  );
}

function LatestRow({ category, items, loading }: { category: CategoryId; items: Listing[]; loading: boolean }) {
  const router = useRouter();
  const cat = CATEGORIES[category];
  const { t } = useI18n();
  const isHouse = category === 'house';
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.rowBetween, { paddingHorizontal: spacing.lg }]}>
        <AppText variant="h3" color={colors.ink}>
          {t(isHouse ? 'home.newHouses' : 'home.newCars')}
        </AppText>
        <AppText variant="small" color={cat.color} onPress={() => router.navigate(category === 'house' ? '/houses' : '/cars')}>
          {t('common.seeAll')}
        </AppText>
      </View>
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: spacing.lg }}>
          <ListingCardSkeleton wide />
          <ListingCardSkeleton wide />
        </ScrollView>
      ) : items.length === 0 ? (
        <Animated.View entering={FadeInRight.duration(450)} style={{ paddingHorizontal: spacing.lg }}>
          <View style={[styles.emptyRow, { backgroundColor: cat.soft }]}>
            <FloatingView distance={5}>
              <Illustration kind={category} size={74} />
            </FloatingView>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong" color={colors.ink}>
                {t(isHouse ? 'home.freshHouses' : 'home.freshCars')}
              </AppText>
              <AppText variant="small" color={colors.textMuted}>
                {t(isHouse ? 'home.freshHousesText' : 'home.freshCarsText')}
              </AppText>
            </View>
          </View>
        </Animated.View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: spacing.lg, paddingBottom: 8 }}>
          {items.map((l, i) => (
            <Animated.View key={l.id} entering={FadeInRight.delay(i * 80).duration(400)}>
              <ListingCard listing={l} variant="wide" />
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/** "Premium" row: paid listings, shown near the top of Home. */
function PremiumRow({ items }: { items: Listing[] }) {
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)} style={{ gap: 12 }}>
      <View style={[styles.rowBetween, { paddingHorizontal: spacing.lg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <LinearGradient colors={gradients.gold} style={styles.premiumIcon}>
            <Ionicons name="diamond" size={16} color={colors.brandNight} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <AppText variant="h3" color={colors.ink}>
              {t('premium.badge')}
            </AppText>
            <AppText variant="small" color={colors.textMuted}>
              {t('home.premiumSub')}
            </AppText>
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: spacing.lg, paddingBottom: 8 }}>
        {items.map((l, i) => (
          <Animated.View key={l.id} entering={FadeInRight.delay(i * 80).duration(400)}>
            <ListingCard listing={l} variant="wide" />
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

/** For owners and brokers: an invitation to make a listing Premium. */
function PremiumInvite() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeInDown.delay(160).duration(500)} style={{ paddingHorizontal: spacing.lg }}>
      <PressableScale onPress={() => router.push('/premium')} style={[styles.invite, shadow.soft]}>
        <LinearGradient colors={gradients.gold} style={styles.premiumIcon}>
          <Ionicons name="diamond" size={16} color={colors.brandNight} />
        </LinearGradient>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" color={colors.ink}>
            {t('home.premiumInvite')}
          </AppText>
          <AppText variant="small" color={colors.textMuted}>
            {t('home.premiumInviteText')}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.goldDeep} />
      </PressableScale>
    </Animated.View>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, session, isGuest, isOwner, isBroker } = useAuth();
  const { t } = useI18n();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [houses, setHouses] = useState<Listing[]>([]);
  const [cars, setCars] = useState<Listing[]>([]);
  const [premium, setPremium] = useState<Listing[]>([]);
  const [ownerStats, setOwnerStats] = useState({ listings: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, h, k, p] = await Promise.all([
        fetchCounts(),
        fetchListings({ category: 'house', limit: 8 }),
        fetchListings({ category: 'car', limit: 8 }),
        fetchPremiumListings(),
      ]);
      setCounts(c);
      setPremium(p);
      setHouses(h);
      setCars(k);
      if (isOwner && session) {
        const [mine, reqs] = await Promise.all([fetchMyListings(session.user.id), fetchReceivedRequests(session.user.id)]);
        setOwnerStats({ listings: mine.length, pending: reqs.filter((r) => r.status === 'pending').length });
      }
    } catch {
      // Empty states cover this; pull to refresh to try again.
    }
  }, [isOwner, session]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const total = (id: CategoryId) => (counts[`${id}-sale`] ?? 0) + (counts[`${id}-rent`] ?? 0) + (counts[`${id}-accessory`] ?? 0);
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: TAB_BAR_SPACE, gap: spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.brand}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.duration(500)} style={[styles.rowBetween, { paddingHorizontal: spacing.lg }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="small" color={colors.textMuted}>
              {greeting()}
              {firstName ? `, ${firstName}` : ''} 👋
            </AppText>
            <AppText variant="h1" color={colors.ink}>
              {t(isOwner ? 'home.titleOwner' : 'home.title')}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {session && <MessagesButton />}
            <PressableScale onPress={() => router.navigate('/profile')}>
              {session ? <Avatar name={profile?.full_name} uri={profile?.avatar_url} size={48} /> : <Logo size={48} />}
            </PressableScale>
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ paddingHorizontal: spacing.lg }}>
          <PressableScale scaleTo={0.98} onPress={() => router.push('/search')} style={[styles.search, shadow.soft]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <AppText variant="body" color={colors.textFaint} style={{ flex: 1 }} numberOfLines={1}>
              {t('home.search')}
            </AppText>
            <LinearGradient colors={gradients.house} style={styles.searchBtn}>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
          </PressableScale>
        </Animated.View>

        {!isBackendConfigured && __DEV__ && (
          <View style={[styles.devNote, { marginHorizontal: spacing.lg }]}>
            <Ionicons name="information-circle" size={18} color={colors.warning} />
            <AppText variant="small" color={colors.text} style={{ flex: 1 }}>
              {t('home.devNote')}
            </AppText>
          </View>
        )}

        {/* Owner dashboard */}
        {isOwner && (
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ paddingHorizontal: spacing.lg }}>
            <LinearGradient colors={gradients.night} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.dash, shadow.card]}>
              <View style={styles.rowBetween}>
                <AppText variant="h3" color={colors.white}>
                  {t(isBroker ? 'home.brokerDashboard' : 'home.dashboard')}
                </AppText>
                <Ionicons name="stats-chart" size={20} color={colors.gold} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <PressableScale style={styles.stat} onPress={() => router.push('/owner/listings')}>
                  <AppText variant="h1" color={colors.white}>
                    {ownerStats.listings}
                  </AppText>
                  <AppText variant="small" color="rgba(255,255,255,0.72)">
                    {t('home.myListings')}
                  </AppText>
                </PressableScale>
                <PressableScale style={styles.stat} onPress={() => router.push('/requests')}>
                  <AppText variant="h1" color={colors.gold}>
                    {ownerStats.pending}
                  </AppText>
                  <AppText variant="small" color="rgba(255,255,255,0.72)">
                    {t('home.newRequests')}
                  </AppText>
                </PressableScale>
              </View>
              <Button title={t('home.postNew')} icon="add-circle" variant="gold" size="md" onPress={() => router.navigate('/post')} />
            </LinearGradient>
          </Animated.View>
        )}

        {/* Premium (advertised) listings */}
        {premium.length > 0 ? <PremiumRow items={premium} /> : isOwner && !loading ? <PremiumInvite /> : null}

        {/* Two separate categories */}
        <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: spacing.lg }}>
          {CATEGORY_LIST.map((c, i) => (
            <CategoryCard key={c.id} cat={c} count={total(c.id)} index={i} />
          ))}
        </View>

        {/* Guest invitation */}
        {isGuest && (
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={{ paddingHorizontal: spacing.lg }}>
            <View style={[styles.guest, shadow.soft]}>
              <View style={styles.guestIcon}>
                <Ionicons name="sparkles" size={20} color={colors.goldDeep} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" color={colors.ink}>
                  {t('home.guestTitle')}
                </AppText>
                <AppText variant="small" color={colors.textMuted}>
                  {t('home.guestText')}
                </AppText>
              </View>
              <Ionicons
                name="arrow-forward-circle"
                size={30}
                color={colors.brand}
                onPress={() => router.push({ pathname: '/auth/sign-up', params: { role: 'customer' } })}
              />
            </View>
          </Animated.View>
        )}

        {/* Sections for each category */}
        <View style={{ gap: spacing.xl, paddingHorizontal: spacing.lg }}>
          <SectionShortcuts cat={CATEGORIES.house} counts={counts} delay={300} />
          <SectionShortcuts cat={CATEGORIES.car} counts={counts} delay={400} />
        </View>

        <LatestRow category="house" items={houses} loading={loading} />
        <LatestRow category="car" items={cars} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 58, paddingLeft: 18, paddingRight: 8, borderRadius: radius.pill, backgroundColor: colors.surface },
  searchBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  devNote: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: colors.goldSoft },
  catCard: { height: 196, borderRadius: radius.lg, padding: spacing.md, overflow: 'hidden' },
  catArt: { position: 'absolute', right: -14, top: 18, opacity: 0.95 },
  catIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  shortcut: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, gap: 6 },
  shortcutIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
  dash: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  stat: { flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)' },
  premiumIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.goldSoft, borderWidth: 1, borderColor: '#F7DFA6' },
  guest: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface },
  guestIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
});
