import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { Logo } from '@/components/brand/Logo';
import { TAB_BAR_SPACE } from '@/components/layout/AnimatedTabBar';
import { LanguageSheet } from '@/components/layout/LanguageSheet';
import { AppText, Avatar, Badge, Button } from '@/components/ui';
import { appConfig } from '@/config/app';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { LANGUAGES, useI18n } from '@/i18n';
import { colors, gradients, radius, shadow, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface RowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  tint?: string;
  iconColor?: string;
  index?: number;
  /** Small text on the right, e.g. the current language. */
  value?: string;
  /** Red number bubble, e.g. unread messages. */
  badge?: number;
}

function Row({ icon, label, onPress, color = colors.ink, tint = colors.brandSoft, iconColor = colors.brand, index = 0, value, badge }: RowProps) {
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).duration(400)}>
      <PressableScale onPress={onPress} scaleTo={0.98} style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={19} color={iconColor} />
        </View>
        <AppText variant="bodyStrong" color={color} style={{ flex: 1 }}>
          {label}
        </AppText>
        {!!badge && (
          <View style={styles.badge}>
            <AppText variant="small" color={colors.white} style={{ fontSize: 11, lineHeight: 14 }}>
              {badge > 9 ? '9+' : badge}
            </AppText>
          </View>
        )}
        {value && (
          <AppText variant="small" color={colors.textMuted}>
            {value}
          </AppText>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      </PressableScale>
    </Animated.View>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, profile, isOwner, isBroker, isGuest, signOut, leaveGuest } = useAuth();
  const { unreadCount } = useMessages();
  const { t, lang } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const language = LANGUAGES.find((l) => l.id === lang);

  const confirmSignOut = () =>
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}>
        {/* Header card */}
        <LinearGradient colors={gradients.night} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: 10 }}>
            {session ? (
              <View style={styles.avatarRing}>
                <Avatar name={profile?.full_name} uri={profile?.avatar_url} size={86} />
              </View>
            ) : (
              <Logo size={86} />
            )}
            <AppText variant="h2" color={colors.white}>
              {session ? profile?.full_name || t('profile.member') : t('profile.guest')}
            </AppText>
            {session ? (
              <Badge
                label={t(isBroker ? 'profile.brokerBadge' : isOwner ? 'profile.ownerBadge' : 'role.customer')}
                icon={isBroker ? 'briefcase' : isOwner ? 'business' : 'key'}
                color={colors.brandNight}
                background={colors.gold}
              />
            ) : (
              <AppText variant="small" color="rgba(255,255,255,0.7)">
                {t('profile.guestSub')}
              </AppText>
            )}
          </Animated.View>
        </LinearGradient>

        <View style={{ padding: spacing.lg, gap: spacing.md, marginTop: -spacing.xl }}>
          {isGuest && (
            <Animated.View entering={FadeInDown.delay(120)} style={[styles.card, shadow.card, { padding: spacing.lg, gap: spacing.sm }]}>
              <AppText variant="h3" color={colors.ink}>
                {t('profile.join')}
              </AppText>
              <AppText variant="body" color={colors.textMuted}>
                {t('profile.joinText')}
              </AppText>
              <Button title={t('welcome.createAccount')} icon="person-add" onPress={() => router.push({ pathname: '/auth/sign-up', params: { role: 'customer' } })} />
              <Button
                title={t('profile.backStart')}
                variant="ghost"
                size="md"
                onPress={async () => {
                  await leaveGuest();
                  router.replace('/welcome');
                }}
              />
            </Animated.View>
          )}

          {session && (
            <View style={[styles.card, shadow.card]}>
              <Row
                index={0}
                icon="chatbubbles-outline"
                label={t('profile.messages')}
                badge={unreadCount}
                onPress={() => router.push('/messages')}
                tint="#E3F8EA"
                iconColor="#1DA851"
              />
              {isOwner ? (
                <>
                  <Row index={1} icon="add-circle-outline" label={t('profile.post')} onPress={() => router.navigate('/post')} />
                  <Row index={2} icon="albums-outline" label={t('profile.myListings')} onPress={() => router.push('/owner/listings')} />
                  <Row index={3} icon="mail-unread-outline" label={t('profile.received')} onPress={() => router.push('/requests')} tint={colors.goldSoft} iconColor={colors.goldDeep} />
                  <Row index={3} icon="diamond-outline" label={t('premium.title')} onPress={() => router.push('/premium')} tint={colors.goldSoft} iconColor={colors.goldDeep} />
                </>
              ) : (
                <>
                  <Row index={1} icon="paper-plane-outline" label={t('profile.myRequests')} onPress={() => router.push('/requests')} tint={colors.goldSoft} iconColor={colors.goldDeep} />
                  <Row index={2} icon="heart-outline" label={t('profile.saved')} onPress={() => router.navigate('/saved')} tint={colors.dangerSoft} iconColor={colors.danger} />
                </>
              )}
              <Row index={4} icon="person-circle-outline" label={t('profile.edit')} onPress={() => router.push('/profile/edit')} tint={colors.carSoft} iconColor={colors.car} />
            </View>
          )}

          <View style={[styles.card, shadow.card]}>
            <Row
              index={5}
              icon="globe-outline"
              label={t('profile.language')}
              value={language ? `${language.flag}  ${language.native}` : undefined}
              onPress={() => setLangOpen(true)}
              tint={colors.carSoft}
              iconColor={colors.car}
            />
            <Row index={6} icon="help-buoy-outline" label={t('profile.help')} onPress={() => Linking.openURL(`mailto:${appConfig.supportEmail}`)} />
            <Row index={7} icon="information-circle-outline" label={t('profile.about')} onPress={() => router.push('/about')} />
            {session && (
              <Row index={8} icon="log-out-outline" label={t('profile.logout')} color={colors.danger} tint={colors.dangerSoft} iconColor={colors.danger} onPress={confirmSignOut} />
            )}
          </View>
        </View>
      </ScrollView>
      <LanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.xxl + spacing.lg, alignItems: 'center', borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  avatarRing: { padding: 4, borderRadius: 50, borderWidth: 2, borderColor: colors.gold },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
});
