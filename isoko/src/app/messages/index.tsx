import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from '@/components/animated/Shimmer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EmptyState } from '@/components/listings/EmptyState';
import { ConversationRow } from '@/components/messages/ConversationRow';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { useI18n } from '@/i18n';
import { fetchConversations, subscribeToConversations } from '@/services/messages';
import { colors, radius, spacing } from '@/theme';
import type { Conversation } from '@/types';

/** Inbox: all chats between buyers/renters and owners. */
export default function MessagesInbox() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { session, isOwner } = useAuth();
  const { refreshUnread } = useMessages();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = session?.user.id ?? '';

  const load = useCallback(async () => {
    try {
      setItems(await fetchConversations());
    } catch {
      /* the list stays as it was */
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when you come back to this screen.
  useFocusEffect(
    useCallback(() => {
      load();
      refreshUnread();
    }, [load, refreshUnread]),
  );

  // New messages move their chat to the top, live.
  useEffect(() => subscribeToConversations(load), [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.sm, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginHorizontal: -spacing.lg }}>
            <ScreenHeader back title={t('msg.title')} subtitle={t('msg.sub')} />
          </View>
        }
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
        renderItem={({ item, index }) => (
          <ConversationRow c={item} userId={userId} index={index} onPress={() => router.push({ pathname: '/messages/[id]', params: { id: item.id } })} />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2, 3].map((i) => (
                <Shimmer key={i} height={84} borderRadius={radius.lg} />
              ))}
            </View>
          ) : (
            <EmptyState
              kind="inbox"
              title={t('msg.emptyTitle')}
              message={t(isOwner ? 'msg.emptyOwnerText' : 'msg.emptyText')}
              actionLabel={isOwner ? undefined : t('saved.explore')}
              actionIcon="home"
              onAction={() => router.navigate('/houses')}
            />
          )
        }
      />
    </View>
  );
}
