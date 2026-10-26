import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { useMessages } from '@/context/MessagesContext';
import { useI18n } from '@/i18n';
import { colors, shadow } from '@/theme';

/** Chat bubble button with a red badge that bounces when new messages arrive. */
export function MessagesButton({ size = 48 }: { size?: number }) {
  const router = useRouter();
  const { unreadCount } = useMessages();
  const { t } = useI18n();
  const wiggle = useSharedValue(0);

  useEffect(() => {
    if (unreadCount > 0) {
      wiggle.set(
        withSequence(
          withTiming(-12, { duration: 80 }),
          withTiming(12, { duration: 80 }),
          withTiming(-8, { duration: 80 }),
          withSpring(0, { damping: 6 }),
        ),
      );
    }
  }, [unreadCount, wiggle]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wiggle.value}deg` }] }));

  return (
    <PressableScale
      onPress={() => router.push('/messages')}
      scaleTo={0.9}
      accessibilityLabel={unreadCount > 0 ? `${t('msg.title')} (${unreadCount})` : t('msg.title')}
      style={[styles.btn, shadow.soft, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Animated.View style={iconStyle}>
        <Ionicons name="chatbubbles-outline" size={size * 0.46} color={colors.ink} />
      </Animated.View>
      {unreadCount > 0 && (
        <Animated.View key={unreadCount} entering={ZoomIn.springify().damping(10)} style={styles.badge}>
          <AppText variant="small" color={colors.white} style={{ fontSize: 11, lineHeight: 14 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </AppText>
        </Animated.View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
