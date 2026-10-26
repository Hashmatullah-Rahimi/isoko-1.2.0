/**
 * Isoko colour palette.
 * Change a colour here and it changes everywhere in the app.
 *
 * Houses use the emerald brand colour, Cars use royal blue,
 * and gold is the accent that ties both together.
 */
export const colors = {
  // Brand
  brand: '#0B6E5C',
  brandLight: '#14A386',
  brandDeep: '#07423C',
  brandNight: '#062F2B',
  brandSoft: '#E3F4EF',

  // Accent
  gold: '#F4B740',
  goldDeep: '#D9922A',
  goldSoft: '#FFF4DC',

  // Category colours
  house: '#0B6E5C',
  houseLight: '#14A386',
  houseSoft: '#E3F4EF',
  car: '#2848D6',
  carLight: '#4D6BF2',
  carSoft: '#E8EDFF',

  // Broker accounts
  broker: '#5B3CC4',
  brokerSoft: '#EEE8FF',

  // Text
  ink: '#0D1B1E',
  text: '#22312F',
  textMuted: '#667573',
  textFaint: '#9AA6A4',
  white: '#FFFFFF',

  // Surfaces
  background: '#F5F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1EE',
  border: '#E3E8E5',
  overlay: 'rgba(6, 47, 43, 0.55)',

  // Feedback
  success: '#18A058',
  successSoft: '#E4F6EC',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  warning: '#E8A317',
} as const;

export const gradients = {
  brand: ['#14A386', '#0B6E5C', '#07423C'] as const,
  night: ['#0B5A4D', '#062F2B', '#041F1C'] as const,
  house: ['#14A386', '#0B6E5C'] as const,
  car: ['#4D6BF2', '#2848D6'] as const,
  gold: ['#FFD27A', '#F2A93B'] as const,
  broker: ['#8E6CF0', '#5B3CC4'] as const,
  photoFade: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)'] as const,
};

export type ColorName = keyof typeof colors;
