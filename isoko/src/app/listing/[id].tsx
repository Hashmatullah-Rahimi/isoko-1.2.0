import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from '@/components/animated/Shimmer';
import { ContactOwnerCard } from '@/components/listings/ContactOwnerCard';
import { EmptyState } from '@/components/listings/EmptyState';
import { HeartButton } from '@/components/listings/HeartButton';
import { MapCard } from '@/components/listings/MapCard';
import { PremiumBadge } from '@/components/listings/PremiumBadge';
import { PhotoCarousel } from '@/components/listings/PhotoCarousel';
import { RequestSheet } from '@/components/listings/RequestSheet';
import { getSpecs } from '@/components/listings/specs';
import { AppText, Badge, Button, IconButton } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { useRequireAccount } from '@/hooks/useRequireAccount';
import { TranslationKey, useI18n } from '@/i18n';
import { fetchListing, isPremium } from '@/services/listings';
import { hasMapPlace } from '@/services/maps';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Listing } from '@/types';
import { formatPrice } from '@/utils/format';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const requireAccount = useRequireAccount();
  const { t } = useI18n();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);

  const PHOTO = Math.round(width * 0.95);

  useEffect(() => {
    fetchListing(id)
      .then(setListing)
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Photo zooms when pulled down and slides slower than the page (parallax).
  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.set(e.contentOffset.y);
  });
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [-PHOTO, 0, PHOTO], [-PHOTO / 2, 0, PHOTO * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-PHOTO, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [PHOTO - 160, PHOTO - 80], [0, 1], Extrapolation.CLAMP),
  }));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Shimmer height={PHOTO} borderRadius={0} />
        <View style={{ padding: spacing.lg, gap: 12 }}>
          <Shimmer width="60%" height={24} />
          <Shimmer width="40%" height={18} />
          <Shimmer height={80} />
        </View>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <EmptyState kind="search" title={t('detail.notFound')} message={t('detail.notFoundText')} actionLabel={t('common.goBack')} onAction={() => router.back()} />
      </View>
    );
  }

  const cat = CATEGORIES[listing.category];
  const section = cat.sections.find((s) => s.id === listing.section)!;
  const specs = getSpecs(listing, true);
  const isMine = session?.user.id === listing.owner_id;
  const actionLabel = t(listing.section === 'rent' ? 'detail.requestRent' : 'detail.requestBuy');
  const kind = listing.section === 'accessory' ? 'accessory' : listing.category;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      {/* Top bar that fades in when you scroll */}
      <Animated.View pointerEvents="none" style={[styles.header, shadow.soft, { height: insets.top + 60, paddingTop: insets.top }, headerStyle]}>
        <AppText variant="title" color={colors.ink} numberOfLines={1} style={{ marginLeft: 70, marginRight: 116 }}>
          {listing.title}
        </AppText>
      </Animated.View>
      <View style={[styles.topButtons, { top: insets.top + 8 }]}>
        <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <IconButton
            icon="share-outline"
            accessibilityLabel="Share"
            onPress={() => Share.share({ message: t('detail.share', { title: listing.title, price: formatPrice(listing.price, listing.currency, listing.price_period) }) })}
          />
          <HeartButton listingId={listing.id} size={44} />
        </View>
      </View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
        <Animated.View style={[{ height: PHOTO }, photoStyle]}>
          <PhotoCarousel photos={listing.photos} height={PHOTO} gradient={cat.gradient} />
        </Animated.View>
        <View style={[styles.sheet, { marginTop: -28 }]}>
          <Animated.View entering={FadeInDown.delay(100).duration(450)} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {isPremium(listing) && <PremiumBadge size="md" />}
            <Badge label={t(cat.labelKey)} icon={cat.icon} color={cat.color} background={cat.soft} />
            <Badge label={t(section.labelKey)} icon={section.icon} color={colors.goldDeep} background={colors.goldSoft} />
            {listing.status !== 'active' && <Badge label={t(`status.${listing.status}` as TranslationKey)} color={colors.danger} background={colors.dangerSoft} />}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).duration(450)} style={{ gap: 6 }}>
            <AppText variant="h1" color={colors.ink}>
              {listing.title}
            </AppText>
            {!!listing.location && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location" size={16} color={cat.color} />
                <AppText variant="body" color={colors.textMuted}>
                  {listing.location}
                </AppText>
              </View>
            )}
          </Animated.View>

          {specs.length > 0 && (
            <Animated.View entering={FadeInDown.delay(220).duration(450)} style={styles.specs}>
              {specs.map((s) => (
                <View key={s.label} style={[styles.spec, shadow.soft]}>
                  <View style={[styles.specIcon, { backgroundColor: cat.soft }]}>
                    <Ionicons name={s.icon} size={18} color={cat.color} />
                  </View>
                  <AppText variant="small" color={colors.ink} numberOfLines={1}>
                    {s.label}
                  </AppText>
                </View>
              ))}
            </Animated.View>
          )}

          {!!listing.description && (
            <Animated.View entering={FadeInDown.delay(280).duration(450)} style={{ gap: 8 }}>
              <AppText variant="h3" color={colors.ink}>
                {t(`detail.about.${kind}` as TranslationKey)}
              </AppText>
              <AppText variant="body" color={colors.text}>
                {listing.description}
              </AppText>
            </Animated.View>
          )}

          {hasMapPlace(listing) && <MapCard listing={listing} color={cat.color} />}

          <ContactOwnerCard listing={listing} isMine={isMine} />

          <View style={styles.safety}>
            <Ionicons name="shield-checkmark" size={18} color={colors.brand} />
            <AppText variant="small" color={colors.text} style={{ flex: 1 }}>
              {t(`detail.safety.${kind}` as TranslationKey)}
            </AppText>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Price + action */}
      <Animated.View entering={FadeInUp.delay(300).springify().damping(18)} style={[styles.bottom, shadow.floating, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <AppText variant="small" color={colors.textMuted}>
            {t(listing.section === 'rent' ? 'detail.rent' : 'detail.price')}
          </AppText>
          <AppText variant="price" color={colors.ink} numberOfLines={1}>
            {formatPrice(listing.price, listing.currency, listing.price_period)}
          </AppText>
        </View>
        {isMine ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {listing.status === 'active' && !isPremium(listing) && (
              <Button title={t('premium.go')} icon="diamond" size="md" variant="gold" onPress={() => router.push({ pathname: '/premium', params: { listing: listing.id } })} />
            )}
            <Button title={t('detail.manage')} icon="settings-outline" size="md" variant="outline" onPress={() => router.push('/owner/listings')} />
          </View>
        ) : (
          <Button
            title={actionLabel}
            icon={listing.section === 'rent' ? 'calendar' : 'cart'}
            size="md"
            gradient={cat.gradient}
            disabled={listing.status !== 'active'}
            onPress={() => {
              if (requireAccount()) setSheet(true);
            }}
          />
        )}
      </Animated.View>

      {!isMine && <RequestSheet listing={listing} visible={sheet} onClose={() => setSheet(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  topButtons: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 6, flexDirection: 'row', justifyContent: 'space-between' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    minHeight: 500,
  },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 14, padding: 6, borderRadius: radius.md, backgroundColor: colors.surface },
  specIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  safety: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.brandSoft },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
});
