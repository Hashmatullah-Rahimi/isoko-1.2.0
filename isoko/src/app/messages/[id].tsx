import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingView } from '@/components/animated/FloatingView';
import { PressableScale } from '@/components/animated/PressableScale';
import { Shimmer } from '@/components/animated/Shimmer';
import { WHATSAPP_GREEN } from '@/components/listings/ContactOwnerCard';
import { EmptyState } from '@/components/listings/EmptyState';
import { Illustration } from '@/components/listings/Illustration';
import { ChatInput } from '@/components/messages/ChatInput';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { AppText, Avatar, Chip, IconButton } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { TranslationKey, useI18n } from '@/i18n';
import { fetchConversation, fetchMessages, markConversationRead, sendMessage, subscribeToMessages } from '@/services/messages';
import { fetchOwnerWhatsApp, openWhatsApp } from '@/services/whatsapp';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Conversation, Message } from '@/types';
import { chatDay } from '@/utils/format';

type Row = { kind: 'day'; id: string; label: string } | { kind: 'msg'; id: string; message: Message; joinedAbove: boolean; joinedBelow: boolean };

const QUICK: TranslationKey[] = ['msg.quick1', 'msg.quick2', 'msg.quick3'];
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

/** A "sending…" copy of a message, shown right away while it uploads. */
function pendingMessage(conversationId: string, senderId: string, body: string): Message {
  const now = new Date();
  return { id: `temp-${now.getTime()}`, conversation_id: conversationId, sender_id: senderId, body, created_at: now.toISOString(), pending: true };
}

/** One chat between a buyer/renter and an owner, with live new messages. */
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { session } = useAuth();
  const { refreshUnread } = useMessages();
  const userId = session?.user.id ?? '';

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  // Messages that were already there when the chat opened don't animate in.
  const [firstIds, setFirstIds] = useState<Set<string>>(new Set());

  const markRead = useCallback(() => {
    markConversationRead(id).then(refreshUnread);
  }, [id, refreshUnread]);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchConversation(id), fetchMessages(id)])
      .then(([c, m]) => {
        if (!alive) return;
        setFirstIds(new Set(m.map((x) => x.id)));
        setConversation(c);
        setMessages(m);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    markRead();

    // New messages arrive instantly.
    const stop = subscribeToMessages(id, (m) => {
      setMessages((list) => {
        if (list.some((x) => x.id === m.id)) return list;
        // Replace my own "sending…" copy if this is it.
        const pendingIndex = list.findIndex((x) => x.pending && x.sender_id === m.sender_id && x.body === m.body);
        if (pendingIndex >= 0) {
          const copy = [...list];
          copy[pendingIndex] = m;
          return copy;
        }
        return [...list, m];
      });
      if (m.sender_id !== userId) markRead();
    });
    return () => {
      alive = false;
      stop();
    };
  }, [id, userId, markRead]);

  const iAmOwner = conversation?.owner_id === userId;
  const other = iAmOwner ? conversation?.customer : conversation?.owner;
  const otherName = other?.full_name || t('msg.someone');
  const otherFirst = otherName.split(' ')[0];
  const cat = CATEGORIES[conversation?.listing_category ?? 'house'] ?? CATEGORIES.house;
  const canWhatsApp = !iAmOwner && !!conversation?.owner?.whatsapp_enabled && !!conversation?.listing_id;

  // Newest first (the list is upside down so it starts at the bottom), with day headings.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    messages.forEach((m, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];
      if (!prev || !sameDay(prev.created_at, m.created_at)) out.push({ kind: 'day', id: `day-${m.id}`, label: chatDay(m.created_at) });
      out.push({
        kind: 'msg',
        id: m.id,
        message: m,
        joinedAbove: !!prev && prev.sender_id === m.sender_id && sameDay(prev.created_at, m.created_at),
        joinedBelow: !!next && next.sender_id === m.sender_id && sameDay(next.created_at, m.created_at),
      });
    });
    return out.reverse();
    // chatDay depends on the language, so t is a dependency too.
  }, [messages, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (body = text) => {
    const clean = body.trim();
    if (!clean || !userId) return;
    const temp = pendingMessage(id, userId, clean);
    setMessages((list) => [...list, temp]);
    setText('');
    try {
      const saved = await sendMessage(id, userId, clean);
      setMessages((list) => {
        if (list.some((x) => x.id === saved.id)) return list.filter((x) => x.id !== temp.id);
        return list.map((x) => (x.id === temp.id ? saved : x));
      });
    } catch {
      setMessages((list) => list.filter((x) => x.id !== temp.id));
      setText(clean);
      Alert.alert(t('msg.title'), t('msg.sendFailed'));
    }
  };

  const whatsApp = async () => {
    if (!conversation?.listing_id) return;
    setWaLoading(true);
    try {
      const number = await fetchOwnerWhatsApp(conversation.listing_id);
      if (number) await openWhatsApp(number, t('wa.hello', { name: otherFirst, title: conversation.listing_title }));
      else Alert.alert('WhatsApp', t('wa.failed'));
    } finally {
      setWaLoading(false);
    }
  };

  if (!loading && !conversation) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <EmptyState kind="inbox" title={t('msg.emptyTitle')} message={t('common.error')} actionLabel={t('common.goBack')} onAction={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Header: who you're talking to, and about which listing */}
      <Animated.View entering={FadeIn.duration(300)} style={[styles.header, shadow.soft, { paddingTop: insets.top + 6 }]}>
        <IconButton icon="chevron-back" elevated={false} background={colors.surfaceAlt} onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))} accessibilityLabel={t('common.back')} />
        {loading ? (
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer width="50%" height={14} />
            <Shimmer width="70%" height={12} />
          </View>
        ) : (
          <PressableScale
            scaleTo={0.98}
            style={styles.headerInfo}
            onPress={() => conversation?.listing_id && router.push({ pathname: '/listing/[id]', params: { id: conversation.listing_id } })}
          >
            <Avatar name={other?.full_name} uri={other?.avatar_url} size={40} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" color={colors.ink} numberOfLines={1}>
                {otherName}
              </AppText>
              <AppText variant="small" color={colors.textMuted} numberOfLines={1} style={{ fontSize: 12 }}>
                {t(iAmOwner ? 'msg.customer' : 'msg.owner')}
              </AppText>
            </View>
          </PressableScale>
        )}
        {canWhatsApp && (
          <PressableScale onPress={whatsApp} disabled={waLoading} scaleTo={0.9} style={styles.waBtn} accessibilityLabel="WhatsApp">
            <LinearGradient colors={WHATSAPP_GREEN} style={styles.waFill}>
              <Ionicons name="logo-whatsapp" size={22} color={colors.white} />
            </LinearGradient>
          </PressableScale>
        )}
      </Animated.View>

      {/* Listing this chat is about */}
      {conversation && (
        <Animated.View entering={FadeInDown.delay(120).duration(350)}>
          <PressableScale
            scaleTo={0.99}
            onPress={() => conversation.listing_id && router.push({ pathname: '/listing/[id]', params: { id: conversation.listing_id } })}
            style={styles.listing}
          >
            <View style={styles.listingThumb}>
              {conversation.listing_photo ? (
                <Image source={{ uri: conversation.listing_photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <LinearGradient colors={cat.gradient} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name={cat.icon} size={18} color={colors.white} />
                </LinearGradient>
              )}
            </View>
            <AppText variant="small" color={colors.ink} numberOfLines={1} style={{ flex: 1 }}>
              {conversation.listing_title || t('msg.removed')}
            </AppText>
            {conversation.listing_id && <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />}
          </PressableScale>
        </Animated.View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {loading ? (
          <View style={{ flex: 1, padding: spacing.lg, gap: 12, justifyContent: 'flex-end' }}>
            <Shimmer width="60%" height={44} borderRadius={radius.lg} />
            <Shimmer width="45%" height={44} borderRadius={radius.lg} style={{ alignSelf: 'flex-end' }} />
            <Shimmer width="55%" height={44} borderRadius={radius.lg} />
          </View>
        ) : messages.length === 0 ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md }} keyboardShouldPersistTaps="handled">
            <Animated.View entering={ZoomIn.springify().damping(12)} style={{ alignItems: 'center' }}>
              <FloatingView>
                <Illustration kind="inbox" size={130} />
              </FloatingView>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', gap: 6 }}>
              <AppText variant="h3" color={colors.ink} align="center">
                {t('msg.startTitle', { name: otherFirst })}
              </AppText>
              <AppText variant="small" color={colors.textMuted} align="center" style={{ maxWidth: 300 }}>
                {t('msg.startText')}
              </AppText>
            </Animated.View>
            {!iAmOwner && (
              <Animated.View entering={FadeInDown.delay(280)} style={styles.quick}>
                {QUICK.map((k) => (
                  <Chip key={k} label={t(k)} icon="chatbubble-outline" color={cat.color} onPress={() => send(t(k))} />
                ))}
              </Animated.View>
            )}
          </ScrollView>
        ) : (
          <FlatList
            inverted
            data={rows}
            keyExtractor={(r) => r.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.md }}
            renderItem={({ item }) =>
              item.kind === 'day' ? (
                <View style={styles.day}>
                  <AppText variant="small" color={colors.textMuted} style={{ fontSize: 11 }}>
                    {item.label}
                  </AppText>
                </View>
              ) : (
                <MessageBubble
                  message={item.message}
                  mine={item.message.sender_id === userId}
                  joinedAbove={item.joinedAbove}
                  joinedBelow={item.joinedBelow}
                  animate={!firstIds.has(item.message.id)}
                />
              )
            }
          />
        )}
        <ChatInput value={text} onChange={setText} onSend={() => send()} bottomInset={insets.bottom} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    zIndex: 2,
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  waBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  waFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: 8,
    paddingRight: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  listingThumb: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden' },
  day: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, marginVertical: 10 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
});
