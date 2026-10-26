import { PERIOD_KEY } from '@/constants/categories';
import { getLang, NUMBER_LOCALE, translate, TranslationKey } from '@/i18n';
import type { PricePeriod } from '@/types';

export function formatPrice(amount: number, currency: string, period: PricePeriod = 'total') {
  const locale = NUMBER_LOCALE[getLang()];
  let text: string;
  try {
    text = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    text = `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
  }
  return period === 'total' ? text : `${text} ${translate(PERIOD_KEY[period])}`;
}

export function formatNumber(n?: number) {
  if (n === undefined || n === null || Number.isNaN(n)) return '';
  try {
    return Math.round(n).toLocaleString(NUMBER_LOCALE[getLang()]);
  } catch {
    return String(Math.round(n));
  }
}

/** "3 days ago" / "il y a 3 jours" / "hashize iminsi 3" */
export function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const steps: [number, string][] = [
    [60 * 60 * 24 * 365, 'unit.year'],
    [60 * 60 * 24 * 30, 'unit.month'],
    [60 * 60 * 24 * 7, 'unit.week'],
    [60 * 60 * 24, 'unit.day'],
    [60 * 60, 'unit.hour'],
    [60, 'unit.minute'],
  ];
  for (const [size, unit] of steps) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return translate('time.ago', { n: value, unit: unitWord(unit, value) });
  }
  return translate('time.justNow');
}

/** The word for a unit, e.g. "days" / "jours" / "iminsi". */
export function unitWord(unit: string, n: number) {
  return translate(`${unit}_${n === 1 ? 'one' : 'other'}` as TranslationKey);
}

const parts = (key: TranslationKey) => translate(key).split(',');

/** "Mon 3 Nov 2026" in the current language. */
export function formatDate(d: Date, withYear = true) {
  const day = parts('date.weekdays')[d.getDay()];
  const month = parts('date.months')[d.getMonth()];
  return `${day} ${d.getDate()} ${month}${withYear ? ` ${d.getFullYear()}` : ''}`;
}

export function weekdayShort(d: Date) {
  return parts('date.weekdays')[d.getDay()];
}

export function monthShort(d: Date) {
  return parts('date.months')[d.getMonth()];
}

/** Time for chat bubbles and the inbox: "14:05", "Yesterday", "3 Nov". */
export function chatTime(iso: string, withClock = false) {
  const d = new Date(iso);
  const now = new Date();
  const clock = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return clock;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const label = d.toDateString() === yesterday.toDateString() ? translate('date.yesterday') : `${d.getDate()} ${monthShort(d)}`;
  return withClock ? `${label} ${clock}` : label;
}

/** Clock time for a chat bubble: "14:05". */
export function clockTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Heading above a group of chat messages: "Today", "Yesterday", "Mon 3 Nov". */
export function chatDay(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return translate('date.today');
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return translate('date.yesterday');
  return formatDate(d, d.getFullYear() !== now.getFullYear());
}

export function initials(name?: string | null) {
  if (!name) return 'I';
  const p = name.trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase() ?? '').join('') || 'I';
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return translate('greet.morning');
  if (h < 18) return translate('greet.afternoon');
  return translate('greet.evening');
}
