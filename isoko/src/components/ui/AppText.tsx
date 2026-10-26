import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, typography, TypographyVariant } from '@/theme';

interface Props extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

/** All text in Isoko goes through this, so fonts stay consistent. */
export function AppText({ variant = 'body', color = colors.text, align, style, ...rest }: Props) {
  return <Text {...rest} style={[typography[variant], { color, textAlign: align }, style]} />;
}
