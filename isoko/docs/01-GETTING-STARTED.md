# 1. Getting started

## What you need

1. **A computer** (Windows, Mac or Linux).
2. **Node.js 20 or newer** — download the "LTS" version from https://nodejs.org.
3. **A code editor** — Visual Studio Code is free: https://code.visualstudio.com.
4. **Your phone** with the **Expo Go** app (App Store / Google Play).
5. Free accounts (needed later):
   - **Supabase** (database, logins, photos) — https://supabase.com
   - **Expo** (building and updating the app) — https://expo.dev
   - **GitHub** (to keep your code safe) — https://github.com

## Run the app

Open a terminal in the `isoko` folder and run:

```bash
npm install
npm start
```

A QR code appears.
- **iPhone:** open the Camera app and point it at the QR code.
- **Android:** open Expo Go and tap "Scan QR code".

Your phone and computer must be on the same Wi-Fi. If it doesn't connect, run `npm start -- --tunnel`.

## Connect the backend

Right now you can browse as a guest. To sign up, log in and post listings, follow **[03-BACKEND-SETUP.md](03-BACKEND-SETUP.md)** (about 10 minutes), then restart with `npm start`.

## Useful commands

| Command | What it does |
|---|---|
| `npm start` | Start the app for testing on your phone |
| `npm run typecheck` | Check the code for mistakes |
| `npm run icons` | Rebuild app icons after changing the logo |
| `npm run update:preview` | Send a quick update to testers |
| `npm run update:production` | Send a quick update to everyone |
| `npm run build:preview` | Build an installable test app |
| `npm run build:production` | Build the store versions |

## Saving your work with GitHub

```bash
git init
git add .
git commit -m "Isoko 1.0.0"
```
Then create an empty repository on github.com and follow the "push an existing repository" steps it shows. The `.env` file is never uploaded (it's in `.gitignore`).
