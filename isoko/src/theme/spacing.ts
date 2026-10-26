import { Platform, ViewStyle } from 'react-native';

/** Spacing scale (in points). Use these instead of random numbers. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

/** Soft shadows that look the same on iPhone and Android. */
export const shadow = {
  soft: Platform.select<ViewStyle>({
    ios: { shadowColor: '#0D1B1E', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    default: { elevation: 2 },
  }),
  card: Platform.select<ViewStyle>({
    ios: { shadowColor: '#0D1B1E', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
    default: { elevation: 5 },
  }),
  floating: Platform.select<ViewStyle>({
    ios: { shadowColor: '#062F2B', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
    default: { elevation: 12 },
  }),
};
