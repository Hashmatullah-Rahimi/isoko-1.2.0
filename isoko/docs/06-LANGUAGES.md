# 6. Languages (English, Français, Ikinyarwanda)

Every text in the app lives in three files — one per language:

```
src/i18n/
├── en.ts       English  (the main file: every text has a "key" here)
├── fr.ts       Français
├── rw.ts       Ikinyarwanda
└── index.tsx   The language system (you rarely need to touch this)
```

## How people choose a language
- The first time Isoko opens, it uses the phone's language (French phone → French, Kinyarwanda phone → Kinyarwanda, anything else → English).
- They can change it any time:
  - the **🌐 EN / FR / RW** button on the welcome, sign-up and log-in screens
  - **Profile → Language**
- The choice is saved on the phone.

## Change a text
1. Open `src/i18n/en.ts` and find the text, e.g. `'home.newHouses': 'New houses',`
2. Change it in **all three** files (same key in `fr.ts` and `rw.ts`).
3. Keep words in curly brackets exactly as they are — `{name}`, `{n}`, `{price}` are filled in by the app.

## Add a new text (when you build something new)
1. Add a line to `en.ts`, e.g. `'home.welcomeBack': 'Welcome back',`
2. Run `npm run typecheck`. It will show an error in `fr.ts` and `rw.ts` until you add the same key there too — so a language can never be forgotten.
3. In the screen: `const { t } = useI18n();` then `{t('home.welcomeBack')}`

## Add a fourth language (e.g. Swahili)
1. Copy `fr.ts` to `sw.ts` and translate every line.
2. In `src/i18n/index.tsx`: add `'sw'` to `Lang`, add `{ id: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇹🇿' }` to `LANGUAGES`, and `sw` to `DICTIONARIES` and `NUMBER_LOCALE`.

## Things that stay the same in every language
- Listing titles and descriptions — owners write them in their own words.
- Values saved in the database (e.g. fuel "Petrol") are stored in English and **shown** translated, so filters keep working whatever language someone uses.

> **Before launch:** ask a native Kinyarwanda speaker to read `rw.ts` once and fix anything that sounds unnatural. It's one file.
