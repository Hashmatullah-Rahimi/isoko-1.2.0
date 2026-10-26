# 5. Publishing to the App Store and Google Play

You don't need a Mac or Android Studio — Expo builds the apps in the cloud.

## One-time setup

1. **Expo account:** sign up at https://expo.dev.
2. **Log in from the terminal:**
   ```bash
   npx eas-cli@latest login
   ```
3. **Link the project:**
   ```bash
   npx eas-cli@latest init
   ```
   This creates your Expo project and saves its ID into `app.json` automatically.
4. **Turn on over-the-air updates:**
   ```bash
   npx eas-cli@latest update:configure
   ```
   This adds the update address to `app.json` automatically.
5. **Add your Supabase keys** to the Expo project (expo.dev → Project → Environment variables) — see the end of `03-BACKEND-SETUP.md`.
6. **Store accounts:**
   - Apple Developer Program — $99/year — https://developer.apple.com/programs
   - Google Play Console — $25 once — https://play.google.com/console
7. **Check the app ID.** `app.json` uses `com.isoko.app` for both stores. It must be unique and can't change after the first release — change it now if you prefer, e.g. `com.yourcompany.isoko`.

## Test build on your own phone

```bash
npm run build:preview
```
When it finishes you get a link/QR code to install Isoko on your phone (Android directly; iPhone needs your device registered — EAS guides you).

## Store build

```bash
npm run build:production
bash scripts/build-app.sh production submit   # build + send to the stores
```

## What the stores ask for

- App name: **Isoko**
- Short description: *Buy, rent and sell houses and cars — plus accessories.*
- Screenshots of: Welcome, Home, Houses, a Listing, Post a listing
- Privacy policy URL (required — you can host a simple page; the app collects name, email, phone and photos)
- Content rating questionnaire
- Category: **Lifestyle** or **Shopping**

## After launch

Use **[updates/README.md](../updates/README.md)** for every change you make.
