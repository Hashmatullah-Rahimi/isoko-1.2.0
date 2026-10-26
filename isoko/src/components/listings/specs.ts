import { Ionicons } from '@expo/vector-icons';
import { getAccessoryType } from '@/constants/categories';
import { translate, TranslationKey } from '@/i18n';
import type { Listing } from '@/types';
import { formatNumber } from '@/utils/format';

export interface Spec {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

/** Shows a stored English value (e.g. "Petrol") in the current language. */
const tr = (prefix: string, value: string) => {
  const text = translate(`${prefix}.${value}` as TranslationKey);
  return text === `${prefix}.${value}` ? value : text;
};

/** The small facts shown on a card (beds, year, mileage, etc.), in the current language. */
export function getSpecs(listing: Listing, full = false): Spec[] {
  const d = listing.details ?? {};
  const out: Spec[] = [];

  if (listing.section === 'accessory') {
    const type = getAccessoryType(listing.category, d.accessory_type);
    if (type) out.push({ icon: type.icon, label: translate(type.labelKey) });
    if (d.condition) out.push({ icon: 'sparkles-outline', label: translate(d.condition === 'new' ? 'spec.new' : 'spec.used') });
    if (d.brand) out.push({ icon: 'ribbon-outline', label: d.brand });
    return out;
  }

  if (listing.category === 'house') {
    if (full && d.property_type) out.push({ icon: 'business-outline', label: tr('ptype', d.property_type) });
    if (d.bedrooms !== undefined) out.push({ icon: 'bed-outline', label: translate('spec.bed', { n: d.bedrooms }) });
    if (d.bathrooms !== undefined) out.push({ icon: 'water-outline', label: translate('spec.bath', { n: d.bathrooms }) });
    if (d.area_m2) out.push({ icon: 'resize-outline', label: `${formatNumber(d.area_m2)} m²` });
    if (full && d.furnished) out.push({ icon: 'cube-outline', label: translate('spec.furnished') });
    if (full && d.parking) out.push({ icon: 'car-outline', label: translate('spec.parking') });
    return out;
  }

  if (d.year) out.push({ icon: 'calendar-outline', label: String(d.year) });
  if (d.mileage_km !== undefined) out.push({ icon: 'speedometer-outline', label: `${formatNumber(d.mileage_km)} km` });
  if (d.transmission) out.push({ icon: 'git-branch-outline', label: tr('gear', d.transmission) });
  if (full && d.fuel) out.push({ icon: 'flash-outline', label: tr('fuel', d.fuel) });
  if (full && d.seats) out.push({ icon: 'people-outline', label: translate('spec.seats', { n: d.seats }) });
  return out;
}

export { tr as translateStored };
