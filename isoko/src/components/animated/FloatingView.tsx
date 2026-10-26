import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far it floats up and down. */
  distance?: number;
  duration?: number;
  delay?: number;
  rotate?: number;
}

/** Slowly floats its content up and down forever. Used for illustrations. */
export function FloatingView({ children, style, distance = 8, duration = 2600, delay = 0, rotate = 0 }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    ));
  }, [delay, duration, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: -distance * t.value }, { rotate: `${rotate * (t.value - 0.5)}deg` }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
