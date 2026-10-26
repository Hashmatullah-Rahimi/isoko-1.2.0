import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { CATEGORIES, TAG_KEY } from '@/constants/categories';
import { useI18n } from '@/i18n';
import { colors, gradients, radius, shadow } from '@/theme';
import type { Listing } from '@/types';
import { formatPrice } from '@/utils/format';
import { isPremium } from '@/services/listings';
import { HeartButton } from './HeartButton';
import { PremiumBadge } from './PremiumBadge';
import { getSpecs } from './specs';

interface Props {
  listing: Listing;
  /** "full" = full-width card in lists, "wide" = card in a sideways row. */
  variant?: 'full' | 'wide';
  index?: number;
  /** Extra content under the card (e.g. owner controls). */
  footer?: React.ReactNode;
}

export function ListingCard({ listing, variant = 'full', index = 0, footer }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const cat = CATEGORIES[listing.category];
  const section = cat.sections.find((s) => s.id === listing.section)!;
  const specs = getSpecs(listing).slice(0, 3);
  const wide = variant === 'wide';
  const photo = listing.photos?.[0];
  const premium = isPremium(listing);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 70).duration(450).springify().damping(18)}>
      <PressableScale
        scaleTo={0.98}
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
        style={[styles.card, shadow.card, premium && styles.premium, wide && { width: 272 }]}
      >
        <View style={[styles.photoWrap, { height: wide ? 172 : 220 }]}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <LinearGradient colors={cat.gradient} style={[StyleSheet.absoluteFill, styles.center]}>
              <Ionicons name={cat.icon} size={48} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          )}
          <LinearGradient colors={gradients.photoFade} style={styles.fade} />
          <View style={styles.topRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
              <View style={[styles.tag, { backgroundColor: cat.color }]}>
                <Ionicons name={section.icon} size={12} color={colors.white} />
                <AppText variant="small" color={colors.white} style={{ fontSize: 12 }}>
                  {t(TAG_KEY[listing.section])}
                </AppText>
              </View>
              {premium && <PremiumBadge />}
            </View>
            <HeartButton listingId={listing.id} size={36} />
          </View>
          <View style={styles.priceRow}>
            <AppText variant="price" color={colors.white}>
              {formatPrice(listing.price, listing.currency, listing.price_period)}
            </AppText>
            {listing.photos.length > 1 && (
              <View style={styles.count}>
                <Ionicons name="images-outline" size={12} color={colors.white} />
                <AppText variant="small" color={colors.white} style={{ fontSize: 11 }}>
                  {listing.photos.length}
                </AppText>
              </View>
            )}
          </View>
        </View>
        <View style={styles.body}>
          <AppText variant="title" color={colors.ink} numberOfLines={1}>
            {listing.title}
          </AppText>
          {!!listing.location && (
            <View style={styles.row}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <AppText variant="small" color={colors.textMuted} numberOfLines={1} style={{ flex: 1 }}>
                {listing.location}
              </AppText>
            </View>
          )}
          {specs.length > 0 && (
            <View style={[styles.row, { gap: 12, marginTop: 4 }]}>
              {specs.map((s) => (
                <View key={s.label} style={styles.row}>
                  <Ionicons name={s.icon} size={14} color={cat.color} />
                  <AppText variant="small" color={colors.text} style={{ fontSize: 12 }}>
                    {s.label}
                  </AppText>
                </View>
              ))}
            </View>
          )}
          {footer}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  premium: { borderWidth: 2, borderColor: colors.gold },
  photoWrap: { width: '100%', backgroundColor: colors.surfaceAlt },
  center: { alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  topRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: radius.pill },
  priceRow: { position: 'absolute', left: 14, right: 14, bottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  count: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, height: 22, borderRadius: radius.pill },
  body: { padding: 14, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
