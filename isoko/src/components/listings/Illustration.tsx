import React, { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export type IllustrationKind = 'house' | 'car' | 'house-accessory' | 'car-accessory' | 'saved' | 'inbox' | 'search' | 'success';

/**
 * Simple, friendly drawings used when a list has nothing in it yet,
 * so no screen in Isoko ever looks blank.
 */
export function Illustration({ kind, size = 180 }: { kind: IllustrationKind; size?: number }) {
  const isCar = kind === 'car' || kind === 'car-accessory';
  const main = isCar ? '#2848D6' : '#0B6E5C';
  const light = isCar ? '#E8EDFF' : '#E3F4EF';
  const mid = isCar ? '#4D6BF2' : '#14A386';
  // Unique ids so several drawings on one screen never share colours.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ill = `ill${uid}`;
  const gold = `gold${uid}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id={ill} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mid} />
          <Stop offset="1" stopColor={main} />
        </LinearGradient>
        <LinearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD27A" />
          <Stop offset="1" stopColor="#F2A93B" />
        </LinearGradient>
      </Defs>
      <Circle cx={100} cy={100} r={86} fill={light} />
      <Ellipse cx={100} cy={160} rx={60} ry={8} fill={main} opacity={0.1} />

      {kind === 'house' && (
        <>
          <Path d="M52 98 L100 58 L148 98 L148 152 L52 152 Z" fill="#fff" />
          <Path d="M42 102 L100 52 L158 102" stroke={`url(#${ill})`} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Rect x={88} y={116} width={24} height={36} rx={4} fill={`url(#${ill})`} />
          <Rect x={62} y={110} width={18} height={16} rx={3} fill={light} />
          <Rect x={120} y={110} width={18} height={16} rx={3} fill={light} />
          <Circle cx={100} cy={92} r={8} fill={`url(#${gold})`} />
        </>
      )}

      {kind === 'car' && (
        <>
          <Path d="M40 130 Q40 112 56 110 L70 88 Q74 82 82 82 L122 82 Q130 82 134 88 L148 110 Q162 112 162 130 L162 140 Q162 146 156 146 L46 146 Q40 146 40 140 Z" fill={`url(#${ill})`} />
          <Path d="M76 108 L84 92 L100 92 L100 108 Z M106 108 L106 92 L120 92 L130 108 Z" fill="#fff" opacity={0.9} />
          <Circle cx={70} cy={146} r={14} fill="#1B2430" />
          <Circle cx={70} cy={146} r={6} fill="#fff" />
          <Circle cx={134} cy={146} r={14} fill="#1B2430" />
          <Circle cx={134} cy={146} r={6} fill="#fff" />
          <Rect x={148} y={118} width={10} height={6} rx={3} fill={`url(#${gold})`} />
        </>
      )}

      {kind === 'house-accessory' && (
        <>
          <Rect x={50} y={104} width={100} height={30} rx={10} fill={`url(#${ill})`} />
          <Rect x={58} y={84} width={84} height={28} rx={10} fill={mid} />
          <Rect x={56} y={134} width={8} height={18} rx={3} fill={main} />
          <Rect x={136} y={134} width={8} height={18} rx={3} fill={main} />
          <Path d="M130 42 L150 42 L144 62 L136 62 Z" fill={`url(#${gold})`} />
          <Rect x={139} y={62} width={2} height={22} fill="#C9D4D1" />
        </>
      )}

      {kind === 'car-accessory' && (
        <>
          <Circle cx={100} cy={104} r={46} fill="#1B2430" />
          <Circle cx={100} cy={104} r={28} fill={`url(#${ill})`} />
          <Circle cx={100} cy={104} r={8} fill={`url(#${gold})`} />
          {[0, 72, 144, 216, 288].map((a) => (
            <Rect key={a} x={98} y={78} width={4} height={18} rx={2} fill="#fff" opacity={0.85} transform={`rotate(${a} 100 104)`} />
          ))}
        </>
      )}

      {kind === 'saved' && (
        <Path
          d="M100 150 C60 122 46 104 46 84 C46 68 58 56 74 56 C86 56 95 63 100 72 C105 63 114 56 126 56 C142 56 154 68 154 84 C154 104 140 122 100 150 Z"
          fill={`url(#${ill})`}
        />
      )}

      {kind === 'inbox' && (
        <>
          <Rect x={46} y={66} width={108} height={78} rx={12} fill="#fff" />
          <Path d="M46 78 L100 114 L154 78" stroke={`url(#${ill})`} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={150} cy={66} r={14} fill={`url(#${gold})`} />
        </>
      )}

      {kind === 'search' && (
        <>
          <Circle cx={92} cy={92} r={36} fill="#fff" stroke={`url(#${ill})`} strokeWidth={10} />
          <Rect x={118} y={118} width={14} height={40} rx={7} fill={`url(#${ill})`} transform="rotate(-45 125 138)" />
          <Circle cx={80} cy={80} r={8} fill={`url(#${gold})`} />
        </>
      )}

      {kind === 'success' && (
        <>
          <Circle cx={100} cy={100} r={52} fill={`url(#${ill})`} />
          <Path d="M76 102 L94 120 L126 86" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}
