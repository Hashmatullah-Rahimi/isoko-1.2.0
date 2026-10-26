import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingView } from '@/components/animated/FloatingView';
import { ListingCardSkeleton } from '@/components/animated/Shimmer';
import { TAB_BAR_SPACE } from '@/components/layout/AnimatedTabBar';
import { AppText, Chip, SegmentedControl } from '@/components/ui';
import { PressableScale } from '@/components/animated/PressableScale';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { TranslationKey, useI18n } from '@/i18n';
import { fetchListings } from '@/services/listings';
import { colors, radius, shadow, spacing } from '@/theme';
import type { CategoryId, Listing, SectionId } from '@/types';
import { EmptyState } from './EmptyState';
import { Illustration } from './Illustration';
import { ListingCard } from './ListingCard';

const HERO = 230;

/**
 * One full screen for a single category (Houses OR Cars),
 * with its own Buy / Rent / Accessories sections.
 */
export function CategoryBrowser({ categoryId }: { categoryId: CategoryId }) {
  const cat = CATEGORIES[categoryId];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isOwner } = useAuth();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ section?: string }>();

  const [section, setSection] = useState<SectionId>('sale');
  const [accessoryType, setAccessoryType] = useState<string | undefined>();
  const [items, setItems] = useState<Listing[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opened from the home screen with a section chosen (e.g. Houses › Rent).
  const [appliedSection, setAppliedSection] = useState<string | undefined>();
  if (params.section !== appliedSection) {
    setAppliedSection(params.section);
    if (params.section === 'sale' || params.section === 'rent' || params.section === 'accessory') setSection(params.section);
  }

  const activeType = section === 'accessory' ? accessoryType : undefined;
  const key = `${categoryId}|${section}|${activeType ?? ''}`;
  const loading = loadedKey !== key;

  const load = useCallback(async () => {
    try {
      const data = await fetchListings({ category: categoryId, section, accessoryType: activeType });
      setItems(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? t('common.error'));
    } finally {
      setLoadedKey(key);
    }
  }, [categoryId, section, activeType, key, t]);

  // Load whenever the section or accessory type changes.
  useEffect(() => {
    let alive = true;
    fetchListings({ category: categoryId, section, accessoryType: activeType })
      .then((data) => {
        if (!alive) return;
        setItems(data);
        setError(null);
      })
      .catch((e) => alive && setError(e?.message ?? t('common.error')))
      .finally(() => alive && setLoadedKey(key));
    return () => {
      alive = false;
    };
  }, [categoryId, section, activeType, key, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Hero shrinks and fades as you scroll.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, HERO], [-50, 0, HERO * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-150, 0], [1.25, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, HERO * 0.8], [1, 0.2], Extrapolation.CLAMP),
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [HERO * 0.55, HERO * 0.8], [0, 1], Extrapolation.CLAMP),
  }));

  const sectionInfo = cat.sections.find((s) => s.id === section)!;
  const emptyKind = section === 'accessory' ? (categoryId === 'house' ? 'house-accessory' : 'car-accessory') : categoryId;
  const emptyTitleKey = `empty.${categoryId}.${section}` as TranslationKey;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />

      {/* Coloured header behind the list */}
      <Animated.View style={[styles.hero, { height: HERO + insets.top }, heroStyle]}>
        <LinearGradient colors={cat.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <FloatingView distance={10} duration={3000} rotate={4} style={styles.heroArt}>
          <View style={{ opacity: 0.95 }}>
            <Illustration kind={categoryId} size={150} />
          </View>
        </FloatingView>
        <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.lg, gap: 4 }}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <AppText variant="caption" color="rgba(255,255,255,0.75)">
              {t(categoryId === 'house' ? 'browse.kicker.house' : 'browse.kicker.car')}
            </AppText>
            <AppText variant="display" color={colors.white}>
              {t(cat.pluralKey)}
            </AppText>
            <AppText variant="body" color="rgba(255,255,255,0.8)">
              {t(cat.taglineKey)}
            </AppText>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Compact title bar that appears after scrolling */}
      <Animated.View pointerEvents="none" style={[styles.bar, { paddingTop: insets.top, height: insets.top + 54 }, barStyle]}>
        <LinearGradient colors={cat.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <AppText variant="title" color={colors.white}>
          {t(sectionInfo.labelKey)}
        </AppText>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HERO + insets.top - 34, paddingBottom: TAB_BAR_SPACE }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={cat.color} progressViewOffset={HERO} />}
      >
        <View style={styles.sheet}>
          {/* Search */}
          <PressableScale scaleTo={0.98} onPress={() => router.push({ pathname: '/search', params: { category: categoryId } })} style={[styles.search, shadow.soft]}>
            <Ionicons name="search" size={19} color={colors.textMuted} />
            <AppText variant="body" color={colors.textFaint} style={{ flex: 1 }} numberOfLines={1}>
              {t(categoryId === 'house' ? 'browse.search.house' : 'browse.search.car')}
            </AppText>
            <PressableScale
              onPress={() => router.push({ pathname: '/search', params: { category: categoryId, section, filters: '1' } })}
              style={[styles.searchIcon, { backgroundColor: cat.color }]}
              accessibilityLabel={t('filter.title')}
            >
              <Ionicons name="options-outline" size={16} color={colors.white} />
            </PressableScale>
          </PressableScale>

          {/* Buy · Rent · Accessories */}
          <SegmentedControl<SectionId>
            value={section}
            onChange={(s) => {
              setSection(s);
              setAccessoryType(undefined);
            }}
            color={cat.color}
            options={cat.sections.map((s) => ({ id: s.id, label: t(s.shortKey), icon: s.icon }))}
          />

          {/* Accessory types */}
          {section === 'accessory' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: spacing.lg }}>
                <Chip label={t('common.all')} selected={!accessoryType} onPress={() => setAccessoryType(undefined)} color={cat.color} icon="apps-outline" />
                {cat.accessoryTypes.map((a) => (
                  <Chip key={a.id} label={t(a.labelKey)} icon={a.icon} selected={accessoryType === a.id} onPress={() => setAccessoryType(a.id)} color={cat.color} />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <View style={styles.titleRow}>
            <AppText variant="h3" color={colors.ink}>
              {t(sectionInfo.labelKey)}
            </AppText>
            {!loading && items.length > 0 && (
              <AppText variant="small" color={colors.textMuted}>
                {t(items.length === 1 ? 'common.results_one' : 'common.results_other', { n: items.length })}
              </AppText>
            )}
          </View>

          {loading ? (
            <View style={{ gap: spacing.lg }}>
              <ListingCardSkeleton />
              <ListingCardSkeleton />
            </View>
          ) : error ? (
            <EmptyState kind="search" title={t('browse.loadError')} message={error} actionLabel={t('common.tryAgain')} actionIcon="refresh" onAction={onRefresh} gradient={cat.gradient} />
          ) : items.length === 0 ? (
            <EmptyState
              kind={emptyKind}
              title={t(emptyTitleKey)}
              message={t(isOwner ? 'empty.ownerText' : 'empty.customerText')}
              actionLabel={isOwner ? t('empty.post') : undefined}
              actionIcon="add"
              gradient={cat.gradient}
              onAction={() => router.push({ pathname: '/post', params: { category: categoryId, section } })}
            />
          ) : (
            <View style={{ gap: spacing.lg }}>
              {items.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  heroArt: { position: 'absolute', right: -18, bottom: 26 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    minHeight: 600,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  searchIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
});
