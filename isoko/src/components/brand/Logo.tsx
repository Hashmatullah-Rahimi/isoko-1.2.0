import React, { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ROOF = 'M268 486 L512 290 L756 486';
const ROOF_LENGTH = 630;
const ROAD = 'M476 580 Q476 560 496 560 L528 560 Q548 560 548 580 L616 770 Q624 798 596 798 L428 798 Q400 798 408 770 Z';

interface Props {
  size?: number;
  /** Plays the drawing animation when it appears. */
  animated?: boolean;
  /** "tile" = rounded green square (app icon). "symbol" = only the white/gold symbol. */
  variant?: 'tile' | 'symbol';
  delay?: number;
}

/**
 * The Isoko logo: a roof (houses) above a road (cars).
 * Together they make the letter "i" — the gold window is the dot.
 */
export function Logo({ size = 96, animated = false, variant = 'tile', delay = 0 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}${uid}`;
  const draw = useSharedValue(animated ? 0 : 1);
  const dot = useSharedValue(animated ? 0 : 1);
  const road = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    draw.set(withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })));
    road.set(withDelay(delay + 450, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })));
    dot.set(withDelay(delay + 800, withSpring(1, { damping: 9, stiffness: 160 })));
  }, [animated, delay, dot, draw, road]);

  const roofProps = useAnimatedProps(() => ({ strokeDashoffset: ROOF_LENGTH * (1 - draw.value) }));
  const dotProps = useAnimatedProps(() => ({ r: 54 * dot.value }));
  const roadProps = useAnimatedProps(() => ({ opacity: road.value }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        <Defs>
          <LinearGradient id={id('bg')} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#14A386" />
            <Stop offset="0.55" stopColor="#0B6E5C" />
            <Stop offset="1" stopColor="#07423C" />
          </LinearGradient>
          <RadialGradient id={id('glow')} cx="0.28" cy="0.18" r="0.75">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD27A" />
            <Stop offset="1" stopColor="#F2A93B" />
          </LinearGradient>
          <LinearGradient id={id('road')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#E4F5F0" />
          </LinearGradient>
        </Defs>
        {variant === 'tile' && (
          <>
            <Rect width="1024" height="1024" rx="232" fill={`url(#${id('bg')})`} />
            <Rect width="1024" height="1024" rx="232" fill={`url(#${id('glow')})`} />
          </>
        )}
        <AnimatedPath
          d={ROOF}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={72}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[ROOF_LENGTH, ROOF_LENGTH]}
          animatedProps={roofProps}
        />
        <AnimatedCircle cx={512} cy={468} fill={`url(#${id('gold')})`} animatedProps={dotProps} />
        <AnimatedPath d={ROAD} fill={`url(#${id('road')})`} animatedProps={roadProps} />
        <Rect x={504} y={616} width={16} height={46} rx={8} fill="#0B6E5C" opacity={0.9} />
        <Rect x={501} y={694} width={22} height={62} rx={11} fill="#0B6E5C" opacity={0.9} />
      </Svg>
    </View>
  );
}
