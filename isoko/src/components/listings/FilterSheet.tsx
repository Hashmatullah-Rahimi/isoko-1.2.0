import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Chip, Input } from '@/components/ui';
import { appConfig } from '@/config/app';
import { CAR_FUELS, CAR_TRANSMISSIONS, HOUSE_PROPERTY_TYPES } from '@/constants/categories';
import { useI18n } from '@/i18n';
import type { ListingFilter, SortOrder } from '@/services/listings';
import { colors, radius, spacing } from '@/theme';
import type { CategoryId, SectionId } from '@/types';
import { translateStored } from './specs';

/** Everything the person chose in the filter sheet (text fields stay as typed). */
export interface Filters {
  sort: SortOrder;
  currency: string;
  minPrice: string;
  maxPrice: string;
  location: string;
  minBedrooms?: number;
  minBathrooms?: number;
  propertyType?: string;
  furnished?: boolean;
  parking?: boolean;
  minYear: string;
  fuel?: string;
  transmission?: string;
}

export const EMPTY_FILTERS: Filters = {
  sort: 'newest',
  currency: appConfig.currencies[0],
  minPrice: '',
  maxPrice: '',
  location: '',
  minYear: '',
};

const toNumber = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return v.trim() === '' || Number.isNaN(n) ? undefined : n;
};

/** Which filters apply, given the chosen category and section. */
function scope(category?: CategoryId, section?: SectionId) {
  const accessory = section === 'accessory';
  return { house: category === 'house' && !accessory, car: category === 'car' && !accessory };
}

/** Turns the sheet's choices into a search for the server. */
export function toListingFilter(f: Filters, category?: CategoryId, section?: SectionId): ListingFilter {
  const s = scope(category, section);
  return {
    sort: f.sort,
    currency: f.currency,
    minPrice: toNumber(f.minPrice),
    maxPrice: toNumber(f.maxPrice),
    location: f.location.trim() || undefined,
    ...(s.house
      ? { minBedrooms: f.minBedrooms, minBathrooms: f.minBathrooms, propertyType: f.propertyType, furnished: f.furnished, parking: f.parking }
      : {}),
    ...(s.car ? { minYear: toNumber(f.minYear), fuel: f.fuel, transmission: f.transmission } : {}),
  };
}

/** How many filters are switched on (for the little number on the filter button). */
export function countFilters(f: Filters, category?: CategoryId, section?: SectionId) {
  const s = scope(category, section);
  let n = 0;
  if (f.sort !== 'newest') n++;
  if (f.minPrice.trim() || f.maxPrice.trim()) n++;
  if (f.location.trim()) n++;
  if (s.house) n += [f.minBedrooms, f.minBathrooms, f.propertyType, f.furnished, f.parking].filter(Boolean).length;
  if (s.car) n += [f.minYear.trim(), f.fuel, f.transmission].filter(Boolean).length;
  return n;
}

function Title({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={17} color={colors.textMuted} />
      <AppText variant="bodyStrong" color={colors.ink}>
        {children}
      </AppText>
    </View>
  );
}

interface Props {
  initial: Filters;
  category?: CategoryId;
  section?: SectionId;
  color: string;
  onApply: (f: Filters) => void;
  onClose: () => void;
}

/** Bottom sheet with all search filters: price, location, bedrooms, bathrooms and more. */
export function FilterSheet({ initial, category, section, color, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [f, setF] = useState<Filters>(initial);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: x[k] === v ? undefined : v }));
  const s = scope(category, section);

  const SORTS: { id: SortOrder; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'newest', label: t('filter.newest'), icon: 'time-outline' },
    { id: 'priceLow', label: t('filter.priceLow'), icon: 'trending-up-outline' },
    { id: 'priceHigh', label: t('filter.priceHigh'), icon: 'trending-down-outline' },
  ];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')} />
      </Animated.View>
      <KeyboardAvoidingView style={styles.holder} behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none">
        <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <AppText variant="h2" color={colors.ink}>
              {t('filter.title')}
            </AppText>
            <AppText variant="bodyStrong" color={color} onPress={() => setF({ ...EMPTY_FILTERS, currency: f.currency })}>
              {t('filter.reset')}
            </AppText>
          </View>

          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.md }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Sort */}
            <View style={styles.block}>
              <Title icon="swap-vertical">{t('filter.sort')}</Title>
              <View style={styles.wrap}>
                {SORTS.map((o) => (
                  <Chip key={o.id} label={o.label} icon={o.icon} color={color} selected={f.sort === o.id} onPress={() => set('sort', o.id)} />
                ))}
              </View>
            </View>

            {/* Price */}
            <View style={styles.block}>
              <Title icon="cash-outline">{t('filter.price')}</Title>
              <View style={styles.wrap}>
                {appConfig.currencies.map((c) => (
                  <Chip key={c} label={c} color={color} selected={f.currency === c} onPress={() => set('currency', c)} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Input placeholder={t('filter.min')} keyboardType="numeric" value={f.minPrice} onChangeText={(v) => set('minPrice', v)} suffix={f.currency} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input placeholder={t('filter.max')} keyboardType="numeric" value={f.maxPrice} onChangeText={(v) => set('maxPrice', v)} suffix={f.currency} />
                </View>
              </View>
            </View>

            {/* Location */}
            <View style={styles.block}>
              <Title icon="location-outline">{t('filter.location')}</Title>
              <Input icon="navigate-outline" placeholder={t('filter.locationPh')} value={f.location} onChangeText={(v) => set('location', v)} />
            </View>

            {/* Houses */}
            {s.house && (
              <>
                <View style={styles.block}>
                  <Title icon="bed-outline">{t('filter.bedrooms')}</Title>
                  <View style={styles.wrap}>
                    <Chip label={t('filter.any')} color={color} selected={!f.minBedrooms} onPress={() => set('minBedrooms', undefined)} />
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Chip key={n} label={`${n}+`} color={color} selected={f.minBedrooms === n} onPress={() => toggle('minBedrooms', n)} />
                    ))}
                  </View>
                </View>
                <View style={styles.block}>
                  <Title icon="water-outline">{t('filter.bathrooms')}</Title>
                  <View style={styles.wrap}>
                    <Chip label={t('filter.any')} color={color} selected={!f.minBathrooms} onPress={() => set('minBathrooms', undefined)} />
                    {[1, 2, 3, 4].map((n) => (
                      <Chip key={n} label={`${n}+`} color={color} selected={f.minBathrooms === n} onPress={() => toggle('minBathrooms', n)} />
                    ))}
                  </View>
                </View>
                <View style={styles.block}>
                  <Title icon="business-outline">{t('post.propertyType')}</Title>
                  <View style={styles.wrap}>
                    {HOUSE_PROPERTY_TYPES.map((p) => (
                      <Chip key={p} label={translateStored('ptype', p)} color={color} selected={f.propertyType === p} onPress={() => toggle('propertyType', p)} />
                    ))}
                  </View>
                </View>
                <View style={styles.block}>
                  <Title icon="sparkles-outline">{t('filter.extras')}</Title>
                  <View style={styles.wrap}>
                    <Chip label={t('spec.furnished')} icon="cube-outline" color={color} selected={!!f.furnished} onPress={() => toggle('furnished', true)} />
                    <Chip label={t('spec.parking')} icon="car-outline" color={color} selected={!!f.parking} onPress={() => toggle('parking', true)} />
                  </View>
                </View>
              </>
            )}

            {/* Cars */}
            {s.car && (
              <>
                <View style={styles.block}>
                  <Title icon="calendar-outline">{t('filter.yearFrom')}</Title>
                  <Input placeholder="2015" keyboardType="number-pad" maxLength={4} value={f.minYear} onChangeText={(v) => set('minYear', v)} />
                </View>
                <View style={styles.block}>
                  <Title icon="flash-outline">{t('post.fuel')}</Title>
                  <View style={styles.wrap}>
                    {CAR_FUELS.map((x) => (
                      <Chip key={x} label={translateStored('fuel', x)} color={color} selected={f.fuel === x} onPress={() => toggle('fuel', x)} />
                    ))}
                  </View>
                </View>
                <View style={styles.block}>
                  <Title icon="cog-outline">{t('post.gearbox')}</Title>
                  <View style={styles.wrap}>
                    {CAR_TRANSMISSIONS.map((x) => (
                      <Chip key={x} label={translateStored('gear', x)} color={color} selected={f.transmission === x} onPress={() => toggle('transmission', x)} />
                    ))}
                  </View>
                </View>
              </>
            )}

            {!s.house && !s.car && (
              <View style={styles.tip}>
                <Ionicons name="bulb-outline" size={18} color={colors.goldDeep} />
                <AppText variant="small" color={colors.text} style={{ flex: 1 }}>
                  {t(section === 'accessory' ? 'filter.tipAccessory' : 'filter.tip')}
                </AppText>
              </View>
            )}
          </ScrollView>

          <Button
            title={t('filter.show')}
            icon="checkmark"
            gradient={[color, color]}
            onPress={() => {
              onApply(f);
              onClose();
            }}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  holder: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  block: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.goldSoft },
});
