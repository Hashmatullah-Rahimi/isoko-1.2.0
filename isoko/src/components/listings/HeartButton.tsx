import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { useRequireAccount } from '@/hooks/useRequireAccount';
import { colors } from '@/theme';

/** Save / unsave a listing, with a little "pop" animation. */
export function HeartButton({ listingId, size = 38, light = true }: { listingId: string; size?: number; light?: boolean }) {
  const { favoriteIds, toggleFavorite, isOwner } = useAuth();
  const requireAccount = useRequireAccount();
  const saved = favoriteIds.has(listingId);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (isOwner) return null;

  const onPress = async () => {
    if (!requireAccount()) return;
    scale.set(withSequence(withTiming(0.7, { duration: 90 }), withSpring(1.25, { damping: 5 }), withSpring(1)));
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    try {
      await toggleFavorite(listingId);
    } catch {
      /* the heart goes back automatically */
    }
  };

  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={saved ? 'Remove from saved' : 'Save'}>
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: light ? 'rgba(255,255,255,0.92)' : colors.surfaceAlt },
          style,
        ]}
      >
        <Ionicons name={saved ? 'heart' : 'heart-outline'} size={size * 0.52} color={saved ? colors.danger : colors.ink} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
