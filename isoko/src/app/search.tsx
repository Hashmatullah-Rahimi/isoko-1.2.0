import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { EmptyState } from '@/components/listings/EmptyState';
import { countFilters, EMPTY_FILTERS, Filters, FilterSheet, toListingFilter } from '@/components/listings/FilterSheet';
import { ListingCard } from '@/components/listings/ListingCard';
import { AppText, Chip, IconButton } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { useI18n } from '@/i18n';
import { fetchListings } from '@/services/listings';
import { colors, fonts, radius, shadow, spacing } from '@/theme';
import type { CategoryId, Listing, SectionId } from '@/types';

export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, tn } = useI18n();
  const params = useLocalSearchParams<{ category?: string; section?: string; filters?: string }>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | undefined>(params.category === 'house' || params.category === 'car' ? params.category : undefined);
  const [section, setSection] = useState<SectionId | undefined>(
    params.section === 'sale' || params.section === 'rent' || params.section === 'accessory' ? params.section : undefined,
  );
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  // Opened from the filter button on Houses / Cars: show the filters straight away.
  const [filterOpen, setFilterOpen] = useState(params.filters === '1');
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const activeFilters = countFilters(filters, category, section);

  // Wait until typing pauses, then search.
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim() && !category && !section && activeFilters === 0) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        setResults(await fetchListings({ search: query, category, section, ...toListingFilter(filters, category, section), limit: 40 }));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, category, section, filters, activeFilters]);

  const color = category ? CATEGORIES[category].color : colors.brand;
  const searched = !!query.trim() || !!category || !!section || activeFilters > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + spacing.xs }}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(350)} style={styles.top}>
        <IconButton icon="chevron-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
        <View style={[styles.box, shadow.soft]}>
          <Ionicons name="search" size={19} color={colors.textMuted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.ph')}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            returnKeyType="search"
          />
          {loading ? <ActivityIndicator color={color} /> : query ? <Ionicons name="close-circle" size={20} color={colors.textFaint} onPress={() => setQuery('')} /> : null}
        </View>
        <PressableScale
          onPress={() => setFilterOpen(true)}
          style={[styles.filterBtn, shadow.soft, activeFilters > 0 && { backgroundColor: color }]}
          accessibilityLabel={t('filter.title')}
        >
          <Ionicons name="options-outline" size={20} color={activeFilters > 0 ? colors.white : colors.ink} />
          {activeFilters > 0 && (
            <View style={[styles.count, { borderColor: color }]}>
              <AppText variant="small" color={color} style={{ fontSize: 11, fontWeight: '700' }}>
                {activeFilters}
              </AppText>
            </View>
          )}
        </PressableScale>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
          data={[
            { key: 'house', node: <Chip label={t('cat.houses')} icon="home-outline" color={colors.house} selected={category === 'house'} onPress={() => setCategory(category === 'house' ? undefined : 'house')} /> },
            { key: 'car', node: <Chip label={t('cat.cars')} icon="car-sport-outline" color={colors.car} selected={category === 'car'} onPress={() => setCategory(category === 'car' ? undefined : 'car')} /> },
            { key: 'sale', node: <Chip label={t('tag.sale')} icon="pricetag-outline" color={color} selected={section === 'sale'} onPress={() => setSection(section === 'sale' ? undefined : 'sale')} /> },
            { key: 'rent', node: <Chip label={t('tag.rent')} icon="calendar-outline" color={color} selected={section === 'rent'} onPress={() => setSection(section === 'rent' ? undefined : 'rent')} /> },
            { key: 'acc', node: <Chip label={t('sec.short.accessory')} icon="construct-outline" color={color} selected={section === 'accessory'} onPress={() => setSection(section === 'accessory' ? undefined : 'accessory')} /> },
          ]}
          renderItem={({ item }) => item.node}
        />
      </Animated.View>

      <FlatList
        data={results}
        keyExtractor={(l) => l.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}
        renderItem={({ item, index }) => <ListingCard listing={item} index={index} />}
        ListHeaderComponent={
          searched && !loading && results.length > 0 ? (
            <AppText variant="small" color={colors.textMuted}>
              {tn('common.results', results.length)}
            </AppText>
          ) : undefined
        }
        ListEmptyComponent={
          loading ? undefined : searched ? (
            <EmptyState kind="search" title={t('search.noMatch')} message={t('search.noMatchText')} compact />
          ) : (
            <EmptyState kind="search" title={t('search.startTitle')} message={t('search.startText')} compact />
          )
        }
      />
      {filterOpen && (
        <FilterSheet initial={filters} category={category} section={section} color={color} onApply={setFilters} onClose={() => setFilterOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.lg },
  box: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
});
