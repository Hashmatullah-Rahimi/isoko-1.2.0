import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListingCardSkeleton } from '@/components/animated/Shimmer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/listings/EmptyState';
import { ListingCard } from '@/components/listings/ListingCard';
import { Badge, Button, Chip, IconButton } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { TranslationKey, useI18n } from '@/i18n';
import { PremiumBadge } from '@/components/listings/PremiumBadge';
import { deleteListing, fetchMyListings, isPremium, setListingStatus } from '@/services/listings';
import { colors, spacing } from '@/theme';
import type { Listing, ListingStatus } from '@/types';

const STATUS_BADGE: Record<ListingStatus, { labelKey: TranslationKey; color: string; bg: string }> = {
  active: { labelKey: 'mine.live', color: colors.success, bg: colors.successSoft },
  sold: { labelKey: 'mine.sold', color: colors.car, bg: colors.carSoft },
  rented: { labelKey: 'mine.rented', color: colors.car, bg: colors.carSoft },
  hidden: { labelKey: 'mine.hidden', color: colors.textMuted, bg: colors.surfaceAlt },
};

/** Owners manage everything they've posted. */
export default function MyListings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<ListingStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      setItems(await fetchMyListings(session.user.id));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const change = async (l: Listing, status: ListingStatus) => {
    try {
      await setListingStatus(l.id, status);
      setItems((list) => list.map((x) => (x.id === l.id ? { ...x, status } : x)));
    } catch (e: any) {
      Alert.alert(t('requests.updateFailed'), e?.message ?? t('common.error'));
    }
  };

  const remove = (l: Listing) =>
    Alert.alert(t('mine.deleteTitle'), t('mine.deleteText', { title: l.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteListing(l);
            setItems((list) => list.filter((x) => x.id !== l.id));
          } catch (e: any) {
            Alert.alert(t('mine.deleteFailed'), e?.message ?? t('common.error'));
          }
        },
      },
    ]);

  const manage = (l: Listing) => {
    const done: ListingStatus = l.section === 'rent' ? 'rented' : 'sold';
    const options = [
      l.status === 'active' ? t(done === 'rented' ? 'mine.markRented' : 'mine.markSold') : t('mine.makeLive'),
      t(l.status === 'hidden' ? 'mine.show' : 'mine.hide'),
      t('common.delete'),
      t('common.cancel'),
    ];
    const run = (i: number) => {
      if (i === 0) change(l, l.status === 'active' ? done : 'active');
      if (i === 1) change(l, l.status === 'hidden' ? 'active' : 'hidden');
      if (i === 2) remove(l);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, destructiveButtonIndex: 2, cancelButtonIndex: 3, title: l.title }, run);
    } else {
      Alert.alert(l.title, undefined, [
        { text: options[0], onPress: () => run(0) },
        { text: options[1], onPress: () => run(1) },
        { text: options[2], style: 'destructive', onPress: () => run(2) },
        { text: options[3], style: 'cancel' },
      ]);
    }
  };

  const visible = items.filter((l) => filter === 'all' || l.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.brand} />}>
        <ScreenHeader
          back
          title={t('mine.title')}
          subtitle={t('mine.posted', { n: items.length })}
          right={<IconButton icon="add" onPress={() => router.navigate('/post')} accessibilityLabel={t('empty.post')} />}
        />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Chip label={t('common.all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label={t('mine.live')} selected={filter === 'active'} onPress={() => setFilter('active')} />
            <Chip label={t('mine.sold')} selected={filter === 'sold'} onPress={() => setFilter('sold')} />
            <Chip label={t('mine.rented')} selected={filter === 'rented'} onPress={() => setFilter('rented')} />
            <Chip label={t('mine.hidden')} selected={filter === 'hidden'} onPress={() => setFilter('hidden')} />
          </View>
          {loading ? (
            <ListingCardSkeleton />
          ) : visible.length === 0 ? (
            <EmptyState
              kind="house"
              title={t(items.length ? 'mine.nothing' : 'mine.emptyFirst')}
              message={t(items.length ? 'mine.nothingText' : 'mine.emptyFirstText')}
              actionLabel={t('empty.post')}
              actionIcon="add"
              onAction={() => router.navigate('/post')}
            />
          ) : (
            visible.map((l, i) => {
              const b = STATUS_BADGE[l.status];
              return (
                <ListingCard
                  key={l.id}
                  listing={l}
                  index={i}
                  footer={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <Badge label={t(b.labelKey)} color={b.color} background={b.bg} />
                      {isPremium(l) && <PremiumBadge />}
                      <View style={{ flex: 1 }} />
                      {l.status === 'active' && !isPremium(l) && (
                        <Button
                          title={t('premium.badge')}
                          icon="diamond-outline"
                          variant="gold"
                          size="sm"
                          onPress={() => router.push({ pathname: '/premium', params: { listing: l.id } })}
                        />
                      )}
                      <Button title={t('mine.manage')} icon="ellipsis-horizontal" variant="secondary" size="sm" onPress={() => manage(l)} />
                    </View>
                  }
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
