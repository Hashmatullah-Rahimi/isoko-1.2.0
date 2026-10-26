import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/tabs';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { TranslationKey, useI18n } from '@/i18n';
import { colors, fonts, gradients, radius, shadow } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/** Icon and label for each tab. The file name in src/app/(tabs) is the key. */
const TAB_INFO: Record<string, { labelKey: TranslationKey; icon: IconName; iconActive: IconName; color?: string }> = {
  home: { labelKey: 'tab.home', icon: 'compass-outline', iconActive: 'compass' },
  houses: { labelKey: 'tab.houses', icon: 'home-outline', iconActive: 'home', color: colors.house },
  cars: { labelKey: 'tab.cars', icon: 'car-sport-outline', iconActive: 'car-sport', color: colors.car },
  saved: { labelKey: 'tab.saved', icon: 'heart-outline', iconActive: 'heart' },
  post: { labelKey: 'tab.post', icon: 'add', iconActive: 'add' },
  profile: { labelKey: 'tab.profile', icon: 'person-outline', iconActive: 'person' },
};

function TabItem({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const { t } = useI18n();
  const info = TAB_INFO[name] ?? TAB_INFO.home;
  const label = t(info.labelKey);
  const tint = info.color ?? colors.brand;
  const scale = useSharedValue(1);
  const lift = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    lift.set(withSpring(focused ? 1 : 0, { damping: 14, stiffness: 180 }));
    if (focused) scale.set(withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 6, stiffness: 220 })));
  }, [focused, lift, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { translateY: -2 * lift.value }] }));
  const pillStyle = useAnimatedStyle(() => ({ opacity: lift.value, transform: [{ scaleX: 0.6 + 0.4 * lift.value }] }));

  if (name === 'post') {
    return (
      <Pressable onPress={onPress} style={styles.item} accessibilityRole="button" accessibilityLabel={label}>
        <Animated.View style={[styles.postBtn, shadow.floating, iconStyle]}>
          <LinearGradient colors={gradients.gold} style={styles.postFill}>
            <Ionicons name="add" size={30} color={colors.brandNight} />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.item} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
      <Animated.View style={[styles.pill, { backgroundColor: `${tint}18` }, pillStyle]} />
      <Animated.View style={iconStyle}>
        <Ionicons name={focused ? info.iconActive : info.icon} size={23} color={focused ? tint : colors.textFaint} />
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.label, { color: focused ? tint : colors.textFaint, fontFamily: focused ? fonts.bold : fonts.medium }]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

/** Floating tab bar with a soft blur, sliding highlight and bouncing icons. */
export function AnimatedTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const routes = state.routes.filter((r) => {
    const options = descriptors[r.key]?.options as { hidden?: boolean; href?: null } | undefined;
    return !options?.hidden && options?.href !== null;
  });

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, shadow.floating]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: radius.xl }]} />
        )}
        {routes.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          return (
            <TabItem
              key={route.key}
              name={route.name}
              focused={focused}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    height: 70,
    borderRadius: radius.xl,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.72)' : colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(13,27,30,0.06)',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', gap: 3 },
  pill: { position: 'absolute', width: 56, height: 52, borderRadius: radius.lg },
  label: { fontSize: 11, maxWidth: '96%' },
  postBtn: { width: 54, height: 54, borderRadius: 27, marginTop: -26, overflow: 'hidden' },
  postFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

/** Space to leave at the bottom of scrolling screens so the floating bar never covers content. */
export const TAB_BAR_SPACE = 120;
