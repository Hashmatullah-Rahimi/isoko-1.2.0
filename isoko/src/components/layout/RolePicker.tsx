import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/animated/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { TranslationKey, useI18n } from '@/i18n';
import { colors, radius } from '@/theme';
import type { UserRole } from '@/types';

export const ROLE_OPTIONS: { id: UserRole; labelKey: TranslationKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'customer', labelKey: 'role.customer', icon: 'key-outline' },
  { id: 'owner', labelKey: 'role.owner', icon: 'business-outline' },
  { id: 'broker', labelKey: 'role.broker', icon: 'briefcase-outline' },
];

/** Three cards to choose which type of account: Buyer & Renter, Owner or Broker. */
export function RolePicker({ value, onChange }: { value: UserRole; onChange: (r: UserRole) => void }) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {ROLE_OPTIONS.map((r) => {
        const active = r.id === value;
        return (
          <PressableScale
            key={r.id}
            onPress={() => onChange(r.id)}
            style={[styles.card, active && styles.active]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={r.icon} size={20} color={active ? colors.brand : colors.textMuted} />
            <AppText
              variant="bodyStrong"
              color={active ? colors.brand : colors.text}
              style={{ fontSize: 13, textAlign: 'center' }}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t(r.labelKey)}
            </AppText>
            {active && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={12} color={colors.white} />
              </View>
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 66,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  active: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  check: { position: 'absolute', top: -7, right: -7, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
