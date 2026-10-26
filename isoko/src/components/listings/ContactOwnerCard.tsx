import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText, Avatar, Button } from '@/components/ui';
import { useRequireAccount } from '@/hooks/useRequireAccount';
import { useI18n } from '@/i18n';
import { startConversation } from '@/services/messages';
import { fetchOwnerWhatsApp, openWhatsApp } from '@/services/whatsapp';
import { colors, radius, shadow } from '@/theme';
import type { Listing } from '@/types';
import { timeAgo } from '@/utils/format';

export const WHATSAPP_GREEN = ['#2FE077', '#1DA851'] as const;

/**
 * "Listed by" card with two ways to reach the owner:
 * an in-app Message, and WhatsApp (only if the owner allows it).
 */
export function ContactOwnerCard({ listing, isMine, delay = 340 }: { listing: Listing; isMine: boolean; delay?: number }) {
  const router = useRouter();
  const { t } = useI18n();
  const requireAccount = useRequireAccount();
  const [opening, setOpening] = useState<'chat' | 'wa' | null>(null);
  const ownerName = listing.owner?.full_name || t('detail.owner');
  const firstName = ownerName.split(' ')[0];
  const canWhatsApp = !!listing.owner?.whatsapp_enabled;

  const openChat = async () => {
    if (!requireAccount()) return;
    setOpening('chat');
    try {
      const id = await startConversation(listing.id);
      router.push({ pathname: '/messages/[id]', params: { id } });
    } catch (e: any) {
      Alert.alert(t('msg.title'), e?.message ?? t('common.error'));
    } finally {
      setOpening(null);
    }
  };

  const openWa = async () => {
    if (!requireAccount()) return;
    setOpening('wa');
    try {
      const number = await fetchOwnerWhatsApp(listing.id);
      if (!number) {
        Alert.alert('WhatsApp', t('wa.failed'));
        return;
      }
      await openWhatsApp(number, t('wa.hello', { name: firstName, title: listing.title }));
    } finally {
      setOpening(null);
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(450)} style={[styles.card, shadow.soft]}>
      <View style={styles.row}>
        <Avatar name={listing.owner?.full_name} uri={listing.owner?.avatar_url} size={50} />
        <View style={{ flex: 1 }}>
          <AppText variant="small" color={colors.textMuted}>
            {t('detail.listedBy')}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <AppText variant="bodyStrong" color={colors.ink}>
              {ownerName}
            </AppText>
            {listing.owner?.role === 'broker' && (
              <View style={styles.brokerTag}>
                <Ionicons name="briefcase" size={11} color={colors.broker} />
                <AppText variant="small" color={colors.broker} style={{ fontSize: 11 }}>
                  {t('role.broker')}
                </AppText>
              </View>
            )}
          </View>
        </View>
        <AppText variant="small" color={colors.textFaint}>
          {timeAgo(listing.created_at)}
        </AppText>
      </View>

      {!isMine && (
        <>
          <View style={styles.divider} />
          <View style={{ gap: 4 }}>
            <AppText variant="title" color={colors.ink}>
              {t('contact.title')}
            </AppText>
            <AppText variant="small" color={colors.textMuted}>
              {t('contact.text')}
            </AppText>
          </View>
          <View style={styles.buttons}>
            <Button
              title={t('contact.message')}
              icon="chatbubble-ellipses"
              size="md"
              variant="secondary"
              style={{ flex: 1 }}
              loading={opening === 'chat'}
              onPress={openChat}
            />
            {canWhatsApp && (
              <Button
                title={t('contact.whatsapp')}
                icon="logo-whatsapp"
                size="md"
                gradient={WHATSAPP_GREEN}
                style={{ flex: 1 }}
                loading={opening === 'wa'}
                onPress={openWa}
              />
            )}
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  brokerTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 11, backgroundColor: colors.brokerSoft },
  card: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  buttons: { flexDirection: 'row', gap: 10 },
});
