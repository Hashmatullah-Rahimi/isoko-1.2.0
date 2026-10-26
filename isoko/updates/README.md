# How to update Isoko

This folder is your home base for every new version of the app.

```
updates/
├── README.md              ← this guide
├── CHANGELOG.md           ← short list of every version
└── release-notes/
    ├── TEMPLATE.md        ← copied automatically for each new version
    └── 1.0.0.md           ← notes for the first version
```

---

## There are two kinds of updates

| | **Quick update (over-the-air)** | **Store update (new build)** |
|---|---|---|
| What changes | Screens, text, colours, layout, animations, logic — anything in `src/` | New native library, new permission, new app icon/splash, new app name |
| How users get it | Automatically next time they open the app | They update from the App Store / Google Play |
| Review by Apple/Google | No | Yes (usually 1–2 days) |
| Command | `npm run update:production` | `npm run build:production` |

**Rule of thumb:** if you only edited files inside `src/`, a quick update is enough.
If you ran `npx expo install <something>` or changed `app.json` / icons, you need a store update.

---

## Step by step: a quick update

1. **Make your change.** For example, change a colour in `src/theme/colors.ts`, or a text in a screen in `src/app/`.
2. **Test it on your phone:**
   ```bash
   npm start
   ```
   Scan the QR code with the Expo Go app (Android) or the Camera app (iPhone).
3. **Write down what changed** at the top of `updates/CHANGELOG.md`, e.g.
   `- 1.0.0 quick update (2026-11-02): bigger prices on car cards`.
   **Do not change the version number** for a quick update — see the note below.
4. **Send it to testers first:**
   ```bash
   npm run update:preview
   ```
5. **When it looks good, send it to everyone:**
   ```bash
   npm run update:production
   ```
   Users get it the next time they open Isoko, or right away from **Profile → About Isoko & updates → Check for updates**.

> **Why not change the version?** `app.json` uses `"runtimeVersion": { "policy": "appVersion" }`.
> That means a quick update only reaches phones that have the *same version number* installed.
> If you raise the version, the update would only reach a new store build. So:
> **quick update = same version, store update = new version.**

---

## Step by step: a store update

1. Make your change and test it (`npm start`).
2. Raise the version: `node scripts/bump-version.js patch` for fixes, `minor` for new features, `major` for big changes.
3. Fill in `updates/release-notes/<new version>.md` (created for you) and the line in `CHANGELOG.md`.
4. Build both apps in the cloud:
   ```bash
   npm run build:production
   ```
5. Send them to the stores:
   ```bash
   bash scripts/build-app.sh production submit
   ```
   (or upload the files yourself in App Store Connect / Google Play Console).

The build number (iOS) and version code (Android) go up by themselves (`autoIncrement` in `eas.json`).

---

## Where to change common things

| I want to change… | Edit this file |
|---|---|
| Texts / translations | `src/i18n/en.ts`, `fr.ts`, `rw.ts` (see `docs/06-LANGUAGES.md`) |
| Colours | `src/theme/colors.ts` |
| Fonts / text sizes | `src/theme/typography.ts` |
| Spacing, corner roundness, shadows | `src/theme/spacing.ts` |
| Accessory types, house/car sections | `src/constants/categories.ts` |
| Currencies, max photos, support email | `src/config/app.ts` |
| The logo | `tools/generate-icons.js` (then run `npm run icons`) and `src/components/brand/Logo.tsx` |
| A screen | `src/app/…` (see `docs/02-PROJECT-STRUCTURE.md`) |
| Database tables / security | `supabase/` (see `docs/03-BACKEND-SETUP.md`) |

## If something goes wrong

- **A quick update broke something:** in the Expo dashboard (expo.dev → your project → Updates) you can roll back to the previous update, or fix the code and publish again.
- **Type errors when publishing:** the scripts run a check first and stop if there's a mistake. Read the file and line it shows.
