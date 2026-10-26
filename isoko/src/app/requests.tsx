import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { Shimmer } from '@/components/animated/Shimmer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/listings/EmptyState';
import { AppText, Badge, Button } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { TranslationKey, useI18n } from '@/i18n';
import { startConversationFromRequest } from '@/services/messages';
import { answerRequest, fetchOwnerPhone, fetchReceivedRequests, fetchSentRequests } from '@/services/requests';
import { colors, radius, shadow, spacing } from '@/theme';
import type { ListingRequest, RequestStatus } from '@/types';
import { formatDate, formatPrice, timeAgo } from '@/utils/format';

const STATUS: Record<RequestStatus, { labelKey: TranslationKey; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { labelKey: 'requests.pending', color: colors.goldDeep, bg: colors.goldSoft, icon: 'time-outline' },
  accepted: { labelKey: 'requests.accepted', color: colors.success, bg: colors.successSoft, icon: 'checkmark-circle-outline' },
  declined: { labelKey: 'requests.declined', color: colors.danger, bg: colors.dangerSoft, icon: 'close-circle-outline' },
};

/**
 * Buyers/renters: requests they sent.
 * Owners: requests they received, with Accept / Decline.
 */
export default function Requests() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, isOwner } = useAuth();
  const { t } = useI18n();
  const [opening, setOpening] = useState<string | null>(null);
  const [items, setItems] = useState<ListingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      setItems(isOwner ? await fetchReceivedRequests(session.user.id) : await fetchSentRequests(session.user.id));
    } finally {
      setLoading(false);
    }
  }, [isOwner, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const answer = async (r: ListingRequest, status: 'accepted' | 'declined') => {
    setBusy(r.id);
    try {
      await answerRequest(r.id, status);
      setItems((list) => list.map((x) => (x.id === r.id ? { ...x, status } : x)));
    } catch (e: any) {
      Alert.alert(t('requests.updateFailed'), e?.message ?? t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const callOwner = async (r: ListingRequest) => {
    const phone = await fetchOwnerPhone(r.id);
    if (phone) Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
    else Alert.alert(t('requests.noPhone'), t('requests.noPhoneText'));
  };

  const openChat = async (r: ListingRequest) => {
    setOpening(r.id);
    try {
      const id = await startConversationFromRequest(r.id);
      router.push({ pathname: '/messages/[id]', params: { id } });
    } catch (e: any) {
      Alert.alert(t('msg.title'), e?.message ?? t('common.error'));
    } finally {
      setOpening(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.brand} />}
      >
        <ScreenHeader back title={t(isOwner ? 'requests.ownerTitle' : 'requests.title')} subtitle={t(isOwner ? 'requests.ownerSub' : 'requests.sub')} />
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
          {loading ? (
            [0, 1, 2].map((i) => <Shimmer key={i} height={120} borderRadius={radius.lg} />)
          ) : items.length === 0 ? (
            <EmptyState
              kind="inbox"
              title={t(isOwner ? 'requests.emptyOwner' : 'requests.empty')}
              message={t(isOwner ? 'requests.emptyOwnerText' : 'requests.emptyText')}
              actionLabel={t(isOwner ? 'empty.post' : 'requests.start')}
              actionIcon={isOwner ? 'add' : 'compass'}
              onAction={() => router.navigate(isOwner ? '/post' : '/home')}
            />
          ) : (
            items.map((r, i) => {
              const s = STATUS[r.status];
              const cat = r.listing ? CATEGORIES[r.listing.category] : CATEGORIES.house;
              return (
                <Animated.View key={r.id} entering={FadeInDown.delay(i * 60).duration(400)} layout={LinearTransition} style={[styles.card, shadow.card]}>
                  <PressableScale scaleTo={0.99} onPress={() => r.listing && router.push({ pathname: '/listing/[id]', params: { id: r.listing.id } })} style={styles.top}>
                    <View style={[styles.thumb, { backgroundColor: cat.soft }]}>
                      {r.listing?.photos?.[0] ? (
                        <Image source={{ uri: r.listing.photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <Ionicons name={cat.icon} size={26} color={cat.color} />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong" color={colors.ink} numberOfLines={1}>
                        {r.listing?.title ?? t('requests.removed')}
                      </AppText>
                      {r.listing && (
                        <AppText variant="small" color={colors.textMuted}>
                          {formatPrice(r.listing.price, r.listing.currency, r.listing.price_period)}
                        </AppText>
                      )}
                      <AppText variant="small" color={colors.textFaint} style={{ fontSize: 12 }}>
                        {t(r.type === 'rent' ? 'requests.rent' : 'requests.buy')} · {timeAgo(r.created_at)}
                        {isOwner && r.customer?.full_name ? ` · ${t('requests.from', { name: r.customer.full_name })}` : ''}
                      </AppText>
                    </View>
                    <Badge label={t(s.labelKey)} icon={s.icon} color={s.color} background={s.bg} />
                  </PressableScale>

                  {r.type === 'rent' && r.start_date && (
                    <View style={styles.dates}>
                      <Ionicons name="calendar-outline" size={15} color={cat.color} />
                      <AppText variant="small" color={colors.text}>
                        {formatDate(new Date(r.start_date))} → {r.end_date ? formatDate(new Date(r.end_date)) : '—'}
                      </AppText>
                    </View>
                  )}
                  {!!r.message && (
                    <AppText variant="body" color={colors.text} style={styles.message}>
                      “{r.message}”
                    </AppText>
                  )}

                  {isOwner && r.status === 'pending' && (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Button title={t('requests.decline')} variant="outline" size="md" style={{ flex: 1 }} onPress={() => answer(r, 'declined')} disabled={busy === r.id} />
                      <Button title={t('requests.accept')} icon="checkmark" size="md" style={{ flex: 1 }} onPress={() => answer(r, 'accepted')} loading={busy === r.id} />
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button
                      title={t('requests.message')}
                      icon="chatbubble-ellipses"
                      variant="secondary"
                      size="md"
                      style={{ flex: 1 }}
                      loading={opening === r.id}
                      onPress={() => openChat(r)}
                    />
                    {isOwner && r.status === 'accepted' && r.contact_phone && (
                      <Button
                        title={t('requests.call')}
                        icon="call"
                        size="md"
                        style={{ flex: 1 }}
                        onPress={() => Linking.openURL(`tel:${r.contact_phone!.replace(/\s/g, '')}`)}
                      />
                    )}
                    {!isOwner && r.status === 'accepted' && <Button title={t('requests.call')} icon="call" size="md" style={{ flex: 1 }} onPress={() => callOwner(r)} />}
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 62, height: 62, borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  message: { fontStyle: 'italic' },
});
