import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AppText } from '@/components/ui';
import { colors, gradients, radius } from '@/theme';
import type { Message } from '@/types';
import { clockTime } from '@/utils/format';

interface Props {
  message: Message;
  mine: boolean;
  /** The message above is from the same person (smaller gap). */
  joinedAbove: boolean;
  /** The message below is from the same person (no bubble tail). */
  joinedBelow: boolean;
  /** Only animate messages that arrive while the chat is open. */
  animate: boolean;
}

/** One chat bubble: green on the right for you, white on the left for them. */
export function MessageBubble({ message, mine, joinedAbove, joinedBelow, animate }: Props) {
  const time = (
    <View style={[styles.meta, mine && { justifyContent: 'flex-end' }]}>
      <AppText variant="small" color={mine ? 'rgba(255,255,255,0.75)' : colors.textFaint} style={{ fontSize: 10 }}>
        {clockTime(message.created_at)}
      </AppText>
      {mine && <Ionicons name={message.pending ? 'time-outline' : 'checkmark-done'} size={13} color="rgba(255,255,255,0.85)" />}
    </View>
  );

  const content = (
    <>
      <AppText variant="body" color={mine ? colors.white : colors.ink} selectable>
        {message.body}
      </AppText>
      {time}
    </>
  );

  return (
    <Animated.View
      entering={animate ? FadeInUp.springify().damping(16).stiffness(180) : undefined}
      style={[styles.wrap, mine ? styles.right : styles.left, { marginTop: joinedAbove ? 3 : 10 }]}
    >
      {mine ? (
        <LinearGradient
          colors={gradients.house}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.mine, joinedBelow && { borderBottomRightRadius: radius.lg }, message.pending && { opacity: 0.75 }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.theirs, joinedBelow && { borderBottomLeftRadius: radius.lg }]}>{content}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { maxWidth: '82%' },
  right: { alignSelf: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 6, borderRadius: radius.lg, gap: 2 },
  mine: { borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
