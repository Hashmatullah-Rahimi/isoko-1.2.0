import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { PressableScale } from '@/components/animated/PressableScale';
import { useI18n } from '@/i18n';
import { colors, fonts, gradients, radius, shadow } from '@/theme';

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  bottomInset: number;
}

/** Message box at the bottom of a chat. The send button grows in when you type. */
export function ChatInput({ value, onChange, onSend, bottomInset }: Props) {
  const { t } = useI18n();
  const ready = value.trim().length > 0;

  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(ready ? 1 : 0.7, { damping: 14 }) }],
    opacity: withSpring(ready ? 1 : 0.45),
  }));

  return (
    <View style={[styles.bar, shadow.floating, { paddingBottom: Math.max(bottomInset, 10) }]}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={t('msg.ph')}
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={2000}
          style={styles.input}
          accessibilityLabel={t('msg.ph')}
        />
      </View>
      <Animated.View style={sendStyle}>
        <PressableScale onPress={onSend} disabled={!ready} scaleTo={0.88} style={styles.send} accessibilityLabel="Send">
          <LinearGradient colors={gradients.house} style={styles.sendFill}>
            <Ionicons name="send" size={19} color={colors.white} style={{ marginLeft: 3 }} />
          </LinearGradient>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  field: { flex: 1, minHeight: 46, maxHeight: 130, borderRadius: 23, backgroundColor: colors.surfaceAlt, paddingHorizontal: 16, justifyContent: 'center' },
  input: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingTop: 12, paddingBottom: 12 },
  send: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  sendFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
