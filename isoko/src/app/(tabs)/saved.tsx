import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { ListingCardSkeleton } from '@/components/animated/Shimmer';
import { TAB_BAR_SPACE } from '@/components/layout/AnimatedTabBar';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/listings/EmptyState';
import { ListingCard } from '@/components/listings/ListingCard';
import { Chip } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { fetchFavorites } from '@/services/favorites';
import { colors, spacing } from '@/theme';
import type { CategoryId, Listing } from '@/types';

/** Listings a buyer/renter tapped the heart on. */
export default function Saved() {
  const router = useRouter();
  const { session, isCustomer, favoriteIds } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session || !isCustomer) {
      setLoading(false);
      return;
    }
    try {
      setItems(await fetchFavorites(session.user.id));
    } finally {
      setLoading(false);
    }
  }, [session, isCustomer]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Hide items the moment they're un-hearted.
  const visible = items.filter((l) => favoriteIds.has(l.id) && (filter === 'all' || l.category === filter));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
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
        <ScreenHeader title={t('saved.title')} subtitle={t('saved.sub')} />
        {!session ? (
          <EmptyState
            kind="saved"
            title={t('saved.guestTitle')}
            message={t('saved.guestText')}
            actionLabel={t('saved.createFree')}
            actionIcon="person-add"
            onAction={() => router.push({ pathname: '/auth/sign-up', params: { role: 'customer' } })}
          />
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label={t('common.all')} selected={filter === 'all'} onPress={() => setFilter('all')} icon="apps-outline" />
              <Chip label={t('cat.houses')} selected={filter === 'house'} onPress={() => setFilter('house')} icon="home-outline" color={colors.house} />
              <Chip label={t('cat.cars')} selected={filter === 'car'} onPress={() => setFilter('car')} icon="car-sport-outline" color={colors.car} />
            </View>
            {loading ? (
              <ListingCardSkeleton />
            ) : visible.length === 0 ? (
              <EmptyState
                kind="saved"
                title={t('saved.emptyTitle')}
                message={t('saved.emptyText')}
                actionLabel={t('saved.explore')}
                actionIcon="home"
                onAction={() => router.navigate('/houses')}
              />
            ) : (
              visible.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
