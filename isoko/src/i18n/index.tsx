import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en, { TranslationKey } from './en';
import fr from './fr';
import rw from './rw';

/**
 * Isoko languages.
 * The texts live in en.ts (English), fr.ts (French) and rw.ts (Kinyarwanda).
 * To add a language: copy fr.ts, translate it, and add it to LANGUAGES and DICTIONARIES below.
 */
export type Lang = 'en' | 'fr' | 'rw';
export type { TranslationKey };

export const LANGUAGES: { id: Lang; name: string; native: string; flag: string }[] = [
  { id: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { id: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda', flag: '🇷🇼' },
];

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, fr, rw };

/** Locale used for numbers and prices. */
export const NUMBER_LOCALE: Record<Lang, string> = { en: 'en-US', fr: 'fr-FR', rw: 'en-US' };

const STORAGE_KEY = 'isoko.lang';

// The current language, also readable outside React (e.g. in formatting helpers).
let current: Lang = 'en';
export const getLang = () => current;

type Vars = Record<string, string | number>;

/** Translate a key into the current language, filling in {words}. */
export function translate(key: TranslationKey, vars?: Vars): string {
  const text = DICTIONARIES[current][key] ?? en[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : `{${name}}`));
}

/** Translate with a number: picks "_one" or "_other" (e.g. 1 photo / 3 photos). */
export function translateCount(base: string, n: number, vars?: Vars): string {
  const key = `${base}_${n === 1 ? 'one' : 'other'}` as TranslationKey;
  return translate(key, { n, ...vars });
}

/** Guess the phone's language the first time the app opens. */
function deviceLanguage(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith('fr')) return 'fr';
    if (locale.startsWith('rw')) return 'rw';
  } catch {
    /* fall back to English */
  }
  return 'en';
}

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translate;
  tn: typeof translateCount;
}

const I18nContext = createContext<I18nState | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => (saved === 'en' || saved === 'fr' || saved === 'rw' ? saved : deviceLanguage()))
      .catch(() => deviceLanguage())
      .then((l) => {
        current = l;
        setLangState(l);
      });
  }, []);

  const setLang = useCallback((l: Lang) => {
    current = l;
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => undefined);
  }, []);

  const value = useMemo<I18nState | null>(() => {
    if (!lang) return null;
    // New function identities on language change make every screen re-render with the new texts.
    const t: typeof translate = (key, vars) => translate(key, vars);
    const tn: typeof translateCount = (base, n, vars) => translateCount(base, n, vars);
    return { lang, setLang, t, tn };
  }, [lang, setLang]);

  // Wait (a few milliseconds) for the saved language so texts never flash in the wrong language.
  if (!value) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Use inside any screen: const { t } = useI18n(); then t('home.title') */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>');
  return ctx;
}
