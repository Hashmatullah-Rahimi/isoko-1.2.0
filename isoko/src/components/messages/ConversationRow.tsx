import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText, Avatar } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { useI18n } from '@/i18n';
import { isUnread } from '@/services/messages';
import { colors, fonts, radius, shadow } from '@/theme';
import type { Conversation } from '@/types';
import { chatTime } from '@/utils/format';

/** One chat in the inbox: listing photo, the other person, last message, time and unread dot. */
export function ConversationRow({ c, userId, index, onPress }: { c: Conversation; userId: string; index: number; onPress: () => void }) {
  const { t } = useI18n();
  const iAmOwner = c.owner_id === userId;
  const other = iAmOwner ? c.customer : c.owner;
  const unread = isUnread(c, userId);
  const cat = CATEGORIES[c.listing_category] ?? CATEGORIES.house;
  const preview = c.last_message
    ? c.last_sender_id === userId
      ? t('msg.you', { text: c.last_message })
      : c.last_message
    : t('msg.startTitle', { name: other?.full_name?.split(' ')[0] || t('msg.someone') });

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 50).duration(380)} layout={LinearTransition.springify().damping(18)}>
      <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.row, shadow.soft, unread && styles.unreadRow]}>
        <View>
          <View style={styles.thumb}>
            {c.listing_photo ? (
              <Image source={{ uri: c.listing_photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : (
              <LinearGradient colors={cat.gradient} style={[StyleSheet.absoluteFill, styles.center]}>
                <Ionicons name={cat.icon} size={24} color="rgba(255,255,255,0.9)" />
              </LinearGradient>
            )}
          </View>
          <View style={styles.avatar}>
            <Avatar name={other?.full_name} uri={other?.avatar_url} size={26} />
          </View>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.topLine}>
            <AppText variant="bodyStrong" color={colors.ink} numberOfLines={1} style={{ flex: 1 }}>
              {other?.full_name || t('msg.someone')}
            </AppText>
            <AppText variant="small" color={unread ? colors.brand : colors.textFaint} style={{ fontSize: 12, fontFamily: unread ? fonts.bold : fonts.medium }}>
              {chatTime(c.last_message_at)}
            </AppText>
          </View>
          <View style={styles.titleLine}>
            <Ionicons name={cat.icon} size={12} color={cat.color} />
            <AppText variant="small" color={cat.color} numberOfLines={1} style={{ flex: 1, fontSize: 12 }}>
              {c.listing_title || t('msg.removed')}
            </AppText>
          </View>
          <View style={styles.topLine}>
            <AppText
              variant="small"
              color={unread ? colors.ink : colors.textMuted}
              numberOfLines={1}
              style={{ flex: 1, fontFamily: unread ? fonts.semibold : fonts.regular }}
            >
              {preview}
            </AppText>
            {unread && <View style={styles.dot} />}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surface },
  unreadRow: { backgroundColor: '#FBFEFD', borderWidth: 1.5, borderColor: colors.brandSoft },
  thumb: { width: 60, height: 60, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  center: { alignItems: 'center', justifyContent: 'center' },
  avatar: { position: 'absolute', right: -6, bottom: -6, borderRadius: 16, borderWidth: 2, borderColor: colors.surface },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
});
