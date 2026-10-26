import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useId } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText, Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { directionsUrl, googleMapsUrl, openUrl } from '@/services/maps';
import { colors, radius, shadow } from '@/theme';
import type { Listing } from '@/types';

/** A drawn street map (no API key needed) with a bouncing pin. */
function MapArt({ color }: { color: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.set(withRepeat(withSequence(withTiming(-8, { duration: 600 }), withTiming(0, { duration: 600 })), -1));
  }, [bounce]);
  const pinStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <View style={styles.art}>
      <Svg width="100%" height="100%" viewBox="0 0 340 150" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`land${uid}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#EEF3EA" />
            <Stop offset="1" stopColor="#E3ECE2" />
          </LinearGradient>
        </Defs>
        <Rect width="340" height="150" fill={`url(#land${uid})`} />
        {/* park and water */}
        <Path d="M0 108 C40 96 70 120 110 112 L110 150 L0 150 Z" fill="#CFE6D4" />
        <Path d="M250 0 C262 30 300 40 340 34 L340 0 Z" fill="#CFE0F5" />
        {/* blocks */}
        {[
          [20, 14, 58, 34],
          [92, 14, 64, 34],
          [190, 62, 52, 34],
          [262, 62, 60, 36],
          [128, 108, 58, 30],
          [212, 112, 64, 30],
        ].map(([x, y, w, h], i) => (
          <Rect key={i} x={x} y={y} width={w} height={h} rx={6} fill="#FFFFFF" opacity={0.9} />
        ))}
        {/* streets */}
        <Path d="M0 56 L340 56" stroke="#FFFFFF" strokeWidth={10} />
        <Path d="M0 100 L340 104" stroke="#FFFFFF" strokeWidth={8} />
        <Path d="M172 0 L180 150" stroke="#FFFFFF" strokeWidth={10} />
        <Path d="M78 56 L60 150" stroke="#FFFFFF" strokeWidth={6} />
        <Path d="M250 0 L246 56" stroke="#FFFFFF" strokeWidth={6} />
        <Path d="M0 56 L340 56" stroke="#F4D58A" strokeWidth={2} strokeDasharray="8 8" />
        <Circle cx={176} cy={80} r={26} fill={color} opacity={0.12} />
        <Circle cx={176} cy={80} r={12} fill={color} opacity={0.18} />
      </Svg>
      <Animated.View style={[styles.pin, pinStyle]}>
        <Ionicons name="location" size={40} color={color} />
      </Animated.View>
    </View>
  );
}

/** "Location" card on the listing page: map preview + Google Maps buttons. */
export function MapCard({ listing, color, delay = 300 }: { listing: Listing; color: string; delay?: number }) {
  const { t } = useI18n();
  const exact = listing.latitude != null && listing.longitude != null;

  const open = (url: string) => openUrl(url).catch(() => Alert.alert(t('map.cantOpen'), t('common.error')));

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} style={[styles.card, shadow.soft]}>
      <PressableScale scaleTo={0.98} onPress={() => open(googleMapsUrl(listing))} accessibilityLabel={t('map.open')}>
        <MapArt color={color} />
        <View style={styles.googleTag}>
          <Ionicons name="logo-google" size={12} color={colors.ink} />
          <AppText variant="small" color={colors.ink} style={{ fontSize: 11 }}>
            Maps
          </AppText>
        </View>
      </PressableScale>
      <View style={{ padding: 14, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.icon, { backgroundColor: color + '1F' }]}>
            <Ionicons name={exact ? 'navigate' : 'location'} size={18} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" color={colors.ink}>
              {t('map.title')}
            </AppText>
            <AppText variant="small" color={colors.textMuted} numberOfLines={2}>
              {listing.location || t('map.pinned')}
              {exact ? ` · ${t('map.exact')}` : ''}
            </AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title={t('map.open')} icon="logo-google" size="md" variant="outline" style={{ flex: 1 }} onPress={() => open(googleMapsUrl(listing))} />
          <Button title={t('map.directions')} icon="navigate" size="md" gradient={[color, color]} style={{ flex: 1 }} onPress={() => open(directionsUrl(listing))} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  art: { height: 150, width: '100%', backgroundColor: '#EEF3EA' },
  pin: { position: 'absolute', left: '50%', top: 42, marginLeft: -20 },
  googleTag: { position: 'absolute', right: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)' },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
