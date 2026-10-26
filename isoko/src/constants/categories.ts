import { Ionicons } from '@expo/vector-icons';
import type { TranslationKey } from '@/i18n';
import { colors, gradients } from '@/theme';
import type { CategoryId, PricePeriod, SectionId } from '@/types';

type IconName = keyof typeof Ionicons.glyphMap;

export interface SectionInfo {
  id: SectionId;
  /** Full name, e.g. "Houses for sale" (text in src/i18n). */
  labelKey: TranslationKey;
  /** Short name, e.g. "Buy". */
  shortKey: TranslationKey;
  icon: IconName;
  /** Which price periods make sense for this section. */
  periods: PricePeriod[];
}

export interface CategoryInfo {
  id: CategoryId;
  labelKey: TranslationKey;
  pluralKey: TranslationKey;
  taglineKey: TranslationKey;
  icon: IconName;
  color: string;
  colorLight: string;
  soft: string;
  gradient: readonly [string, string];
  sections: SectionInfo[];
  /** Sub-types inside the Accessories section of this category. */
  accessoryTypes: { id: string; labelKey: TranslationKey; icon: IconName }[];
}

/**
 * Houses and Cars are two completely separate categories.
 * Each has its own Sale, Rent and Accessories sections.
 * To add an accessory type: add a line here AND its name in src/i18n/en.ts, fr.ts, rw.ts.
 */
export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  house: {
    id: 'house',
    labelKey: 'cat.house',
    pluralKey: 'cat.houses',
    taglineKey: 'cat.house.tagline',
    icon: 'home',
    color: colors.house,
    colorLight: colors.houseLight,
    soft: colors.houseSoft,
    gradient: gradients.house,
    sections: [
      { id: 'sale', labelKey: 'sec.house.sale', shortKey: 'sec.short.sale', icon: 'key', periods: ['total'] },
      { id: 'rent', labelKey: 'sec.house.rent', shortKey: 'sec.short.rent', icon: 'calendar', periods: ['month', 'week', 'day'] },
      { id: 'accessory', labelKey: 'sec.house.accessory', shortKey: 'sec.short.accessory', icon: 'bed', periods: ['total'] },
    ],
    accessoryTypes: [
      { id: 'furniture', labelKey: 'acc.furniture', icon: 'bed-outline' },
      { id: 'appliances', labelKey: 'acc.appliances', icon: 'tv-outline' },
      { id: 'kitchen', labelKey: 'acc.kitchen', icon: 'restaurant-outline' },
      { id: 'lighting', labelKey: 'acc.lighting', icon: 'bulb-outline' },
      { id: 'decor', labelKey: 'acc.decor', icon: 'color-palette-outline' },
      { id: 'garden', labelKey: 'acc.garden', icon: 'leaf-outline' },
      { id: 'security', labelKey: 'acc.security', icon: 'shield-checkmark-outline' },
      { id: 'other', labelKey: 'acc.other', icon: 'ellipsis-horizontal-circle-outline' },
    ],
  },
  car: {
    id: 'car',
    labelKey: 'cat.car',
    pluralKey: 'cat.cars',
    taglineKey: 'cat.car.tagline',
    icon: 'car-sport',
    color: colors.car,
    colorLight: colors.carLight,
    soft: colors.carSoft,
    gradient: gradients.car,
    sections: [
      { id: 'sale', labelKey: 'sec.car.sale', shortKey: 'sec.short.sale', icon: 'pricetag', periods: ['total'] },
      { id: 'rent', labelKey: 'sec.car.rent', shortKey: 'sec.short.rent', icon: 'calendar', periods: ['day', 'week', 'month'] },
      { id: 'accessory', labelKey: 'sec.car.accessory', shortKey: 'sec.short.accessory', icon: 'construct', periods: ['total'] },
    ],
    accessoryTypes: [
      { id: 'parts', labelKey: 'acc.parts', icon: 'cog-outline' },
      { id: 'tyres', labelKey: 'acc.tyres', icon: 'disc-outline' },
      { id: 'electronics', labelKey: 'acc.electronics', icon: 'hardware-chip-outline' },
      { id: 'interior', labelKey: 'acc.interior', icon: 'car-outline' },
      { id: 'exterior', labelKey: 'acc.exterior', icon: 'sparkles-outline' },
      { id: 'care', labelKey: 'acc.care', icon: 'water-outline' },
      { id: 'safety', labelKey: 'acc.safety', icon: 'medkit-outline' },
      { id: 'other', labelKey: 'acc.other', icon: 'ellipsis-horizontal-circle-outline' },
    ],
  },
};

export const CATEGORY_LIST = [CATEGORIES.house, CATEGORIES.car];

/** Saved in the database in English; shown translated (see "ptype.", "fuel.", "gear." in src/i18n). */
export const HOUSE_PROPERTY_TYPES = ['House', 'Apartment', 'Villa', 'Studio', 'Townhouse', 'Land'];
export const CAR_FUELS = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
export const CAR_TRANSMISSIONS = ['Automatic', 'Manual'];

export const PERIOD_KEY: Record<Exclude<PricePeriod, 'total'>, TranslationKey> = {
  month: 'period.month',
  week: 'period.week',
  day: 'period.day',
};

export const PERIOD_NAME_KEY: Record<PricePeriod, TranslationKey> = {
  total: 'periodName.total',
  month: 'periodName.month',
  week: 'periodName.week',
  day: 'periodName.day',
};

/** "For sale" / "For rent" / "Accessory" tag on cards. */
export const TAG_KEY: Record<SectionId, TranslationKey> = { sale: 'tag.sale', rent: 'tag.rent', accessory: 'tag.accessory' };

export function getSection(category: CategoryId, section: SectionId) {
  return CATEGORIES[category].sections.find((s) => s.id === section)!;
}

export function getAccessoryType(category: CategoryId, id?: string) {
  return CATEGORIES[category].accessoryTypes.find((t) => t.id === id);
}
