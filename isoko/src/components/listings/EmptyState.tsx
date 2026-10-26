import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { FloatingView } from '@/components/animated/FloatingView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/theme';
import { Illustration, IllustrationKind } from './Illustration';

interface Props {
  kind: IllustrationKind;
  title: string;
  message: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  gradient?: readonly [string, string];
  compact?: boolean;
}

/** Friendly animated message shown when a list is still empty. */
export function EmptyState({ kind, title, message, actionLabel, actionIcon, onAction, gradient, compact }: Props) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: compact ? 16 : 36, paddingHorizontal: 28, gap: 10 }}>
      <Animated.View entering={FadeIn.duration(500)}>
        <FloatingView distance={10} duration={2400}>
          <Illustration kind={kind} size={compact ? 130 : 180} />
        </FloatingView>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(150).duration(450)} style={{ alignItems: 'center', gap: 6 }}>
        <AppText variant="h3" color={colors.ink} align="center">
          {title}
        </AppText>
        <AppText variant="body" color={colors.textMuted} align="center">
          {message}
        </AppText>
      </Animated.View>
      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.delay(280).duration(450)} style={{ marginTop: 8 }}>
          <Button title={actionLabel} icon={actionIcon} onPress={onAction} size="md" gradient={gradient} />
        </Animated.View>
      )}
    </View>
  );
}
