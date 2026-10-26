import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { LANGUAGES, useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** Bottom sheet to choose English, Français or Ikinyarwanda. */
export function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { lang, setLang, t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')} />
      </Animated.View>
      <View style={styles.holder} pointerEvents="box-none">
        <Animated.View entering={SlideInDown.springify().damping(20)} style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md }}>
            <View style={styles.globe}>
              <Ionicons name="globe-outline" size={20} color={colors.brand} />
            </View>
            <AppText variant="h2" color={colors.ink}>
              {t('lang.choose')}
            </AppText>
          </View>
          <View style={{ gap: 10 }}>
            {LANGUAGES.map((l) => {
              const active = l.id === lang;
              return (
                <PressableScale
                  key={l.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
                    setLang(l.id);
                    setTimeout(onClose, 180);
                  }}
                  style={[styles.row, active && styles.rowActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <AppText style={{ fontSize: 26, lineHeight: 32 }}>{l.flag}</AppText>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong" color={colors.ink}>
                      {l.native}
                    </AppText>
                    {l.native !== l.name && (
                      <AppText variant="small" color={colors.textMuted}>
                        {l.name}
                      </AppText>
                    )}
                  </View>
                  <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={active ? colors.brand : colors.textFaint} />
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Small "🌐 EN" pill that opens the language sheet. Used on dark screens. */
export function LanguagePill({ onPress }: { onPress: () => void }) {
  const { lang, t } = useI18n();
  return (
    <PressableScale onPress={onPress} style={styles.pill} accessibilityLabel={t('lang.title')}>
      <Ionicons name="globe-outline" size={16} color={colors.white} />
      <AppText variant="small" color={colors.white} style={{ letterSpacing: 0.5 }}>
        {lang.toUpperCase()}
      </AppText>
      <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  holder: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  globe: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  rowActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
});
