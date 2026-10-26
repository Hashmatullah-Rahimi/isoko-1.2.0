import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText, Button, Input } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n';
import { sendRequest } from '@/services/requests';
import { colors, radius, spacing } from '@/theme';
import type { Listing } from '@/types';
import { formatDate, formatPrice, monthShort, unitWord, weekdayShort } from '@/utils/format';
import { Illustration } from './Illustration';

interface Props {
  listing: Listing;
  visible: boolean;
  onClose: () => void;
}

const DAY = 24 * 60 * 60 * 1000;
const toISO = (d: Date) => d.toISOString().slice(0, 10);

/** Bottom sheet where a buyer or renter sends a request to the owner. */
export function RequestSheet({ listing, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const { t } = useI18n();
  const cat = CATEGORIES[listing.category];
  const isRent = listing.section === 'rent';
  const unit = listing.price_period === 'month' ? 'month' : listing.price_period === 'week' ? 'week' : 'day';

  const [message, setMessage] = useState(
    t(isRent ? 'req.msgRent' : 'req.msgBuy', { title: listing.title }),
  );
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [startOffset, setStartOffset] = useState(1);
  const [duration, setDuration] = useState(1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The next 21 days, worked out once when the sheet opens.
  const [days] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 21 }, (_, i) => new Date(now + (i + 1) * DAY));
  });
  const start = days[startOffset - 1];
  const end = useMemo(() => {
    const d = new Date(start);
    if (unit === 'month') d.setMonth(d.getMonth() + duration);
    else d.setDate(d.getDate() + duration * (unit === 'week' ? 7 : 1));
    return d;
  }, [start, duration, unit]);

  const submit = async () => {
    if (!session) return;
    setSending(true);
    setError(null);
    try {
      await sendRequest({
        listing,
        customerId: session.user.id,
        type: isRent ? 'rent' : 'buy',
        message,
        phone,
        startDate: isRent ? toISO(start) : null,
        endDate: isRent ? toISO(end) : null,
      });
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? t('req.failed'));
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    setSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.holder} pointerEvents="box-none">
        <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          {sent ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: spacing.lg }}>
              <Animated.View entering={ZoomIn.springify().damping(10)}>
                <Illustration kind="success" size={140} />
              </Animated.View>
              <AppText variant="h2" color={colors.ink} align="center">
                {t('req.sentTitle')}
              </AppText>
              <AppText variant="body" color={colors.textMuted} align="center">
                {t('req.sentText')}
              </AppText>
              <Button title={t('common.done')} onPress={close} style={{ alignSelf: 'stretch', marginTop: 8 }} gradient={cat.gradient} />
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 2 }}>
                <AppText variant="h2" color={colors.ink}>
                  {t(isRent ? 'req.titleRent' : 'req.titleBuy')}
                </AppText>
                <AppText variant="body" color={colors.textMuted} numberOfLines={1}>
                  {listing.title} · {formatPrice(listing.price, listing.currency, listing.price_period)}
                </AppText>
              </View>

              {isRent && (
                <>
                  <AppText variant="caption" color={colors.textMuted}>
                    {t('req.start')}
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {days.map((d, i) => {
                      const active = i + 1 === startOffset;
                      return (
                        <PressableScale
                          key={d.toISOString()}
                          onPress={() => setStartOffset(i + 1)}
                          style={[styles.day, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                        >
                          <AppText variant="small" color={active ? colors.white : colors.textMuted} style={{ fontSize: 11 }}>
                            {weekdayShort(d)}
                          </AppText>
                          <AppText variant="h3" color={active ? colors.white : colors.ink}>
                            {d.getDate()}
                          </AppText>
                          <AppText variant="small" color={active ? colors.white : colors.textMuted} style={{ fontSize: 11 }}>
                            {monthShort(d)}
                          </AppText>
                        </PressableScale>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.stepper}>
                    <AppText variant="bodyStrong" color={colors.ink} style={{ flex: 1 }}>
                      {t('req.howLong')}
                    </AppText>
                    <Pressable style={styles.stepBtn} onPress={() => setDuration((d) => Math.max(1, d - 1))} hitSlop={6}>
                      <Ionicons name="remove" size={18} color={colors.ink} />
                    </Pressable>
                    <AppText variant="bodyStrong" color={colors.ink} style={{ minWidth: 84, textAlign: 'center' }}>
                      {t('req.duration', { n: duration, unit: unitWord(`unit.${unit}`, duration) })}
                    </AppText>
                    <Pressable style={styles.stepBtn} onPress={() => setDuration((d) => Math.min(60, d + 1))} hitSlop={6}>
                      <Ionicons name="add" size={18} color={colors.ink} />
                    </Pressable>
                  </View>
                  <AppText variant="small" color={colors.textMuted}>
                    {formatDate(start)} → {formatDate(end)}
                    {'\n'}
                    {t('req.total', { price: formatPrice(listing.price * duration, listing.currency) })}
                  </AppText>
                </>
              )}

              <Input label={t('req.message')} multiline value={message} onChangeText={setMessage} />
              <Input label={t('req.phone')} icon="call-outline" keyboardType="phone-pad" value={phone} onChangeText={setPhone} hint={t('req.phoneHint')} />
              {error && (
                <AppText variant="small" color={colors.danger}>
                  {error}
                </AppText>
              )}
              <Button
                title={t('req.send')}
                icon="paper-plane"
                onPress={submit}
                loading={sending}
                disabled={message.trim().length < 3 || phone.replace(/\D/g, '').length < 7}
                gradient={cat.gradient}
              />
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  holder: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  day: {
    width: 62,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, paddingLeft: 14 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
