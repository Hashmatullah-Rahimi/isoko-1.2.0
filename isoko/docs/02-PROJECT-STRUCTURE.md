# 2. Project structure

Every part has its own folder and its own file — nothing is mixed into one big document.

```
isoko/
├── app.json                 App name, icons, splash, permissions, version
├── eas.json                 Cloud build + update settings
├── package.json             Libraries and handy commands
├── .env.example             Template for your Supabase keys (copy to .env)
│
├── assets/
│   ├── brand/               Logo (SVG + 1024px PNG)
│   └── images/              App icon, Android icon layers, splash, favicon
│
├── docs/                    These guides
├── updates/                 ★ Everything for releasing new versions
├── scripts/                 Update, build and version scripts
├── supabase/                Database tables, security rules, photo storage
├── tools/                   Icon generator
│
└── src/
    ├── app/                 ★ SCREENS — every file here is one screen
    │   ├── _layout.tsx          App frame: fonts, login state, which screens are allowed
    │   ├── index.tsx            Animated logo intro
    │   ├── welcome.tsx          Buyer & Renter / Owner / Broker / Guest  (+ Log in switch)
    │   ├── auth/
    │   │   ├── sign-up.tsx      Create account
    │   │   ├── log-in.tsx       Log in
    │   │   └── forgot-password.tsx
    │   ├── (tabs)/              Bottom tab bar screens
    │   │   ├── _layout.tsx      Which tabs each person sees
    │   │   ├── home.tsx         Home
    │   │   ├── houses.tsx       Houses: Buy · Rent · Accessories
    │   │   ├── cars.tsx         Cars:   Buy · Rent · Accessories
    │   │   ├── post.tsx         Owners: post a new listing (4 steps)
    │   │   ├── saved.tsx        Buyers/renters: saved listings
    │   │   └── profile.tsx      Profile & menu
    │   ├── listing/[id].tsx     One listing (photos, details, request button)
    │   ├── search.tsx           Search with filters (price, location, bedrooms, bathrooms…)
    │   ├── premium.tsx          Owners/brokers ask for Premium (advertising)
    │   ├── requests.tsx         Sent requests (buyers) / received requests (owners)
    │   ├── owner/listings.tsx   Owners manage their listings
    │   ├── profile/edit.tsx     Edit name and phone
    │   ├── messages/
    │   │   ├── index.tsx        Inbox (all chats)
    │   │   └── [id].tsx         One chat
    │   ├── about.tsx            Version + "Check for updates"
    │   └── +not-found.tsx
    │
    ├── components/          Reusable building blocks
    │   ├── ui/                  Buttons, inputs, chips, switch, avatar, badge, text
    │   ├── animated/            Press-to-shrink, floating, shimmer loaders
    │   ├── brand/               Logo (with drawing animation), wordmark, background glows
    │   ├── layout/              Animated tab bar, screen header, login layout, role picker
    │   ├── listings/            Listing card, category screen, photo carousel,
    │   │                        request sheet, contact-owner card, empty states, illustrations,
    │   │                        filter sheet, map card, Premium badge
    │   └── messages/            Chat row, chat bubble, message box
    │
    ├── i18n/                ★ ALL TEXTS: en.ts (English), fr.ts (Français), rw.ts (Ikinyarwanda)
    ├── theme/               ★ Colours, fonts, spacing, shadows
    ├── constants/           Categories, sections and accessory types
    ├── config/              App settings (currencies, max photos, support email)
    ├── context/             Who is logged in (buyer, owner or guest) + saved items
    ├── hooks/               "Please create an account" prompt for guests
    ├── services/            Talking to the server: login, listings, photos, favourites, requests,
    │                        messages, WhatsApp, Google Maps, Premium
    ├── lib/                 Supabase connection
    ├── types/               Shapes of the data (Listing, Profile, Request…)
    └── utils/               Price and date formatting
```

## Common changes

| To change… | Open… |
|---|---|
| Any text, in any language | `src/i18n/en.ts`, `fr.ts`, `rw.ts` |
| A colour everywhere | `src/theme/colors.ts` |
| The layout of the welcome screen | `src/app/welcome.tsx` |
| Accessory types (e.g. add "Solar panels" to houses) | `src/constants/categories.ts` → `accessoryTypes`, plus its name in `src/i18n/*.ts` |
| Allowed currencies | `src/config/app.ts` → `currencies` |
| What a listing card shows | `src/components/listings/ListingCard.tsx` and `specs.ts` |
| The tab bar | `src/components/layout/AnimatedTabBar.tsx` |
| Which tabs owners vs. buyers see | `src/app/(tabs)/_layout.tsx` |
| Premium prices / team WhatsApp | `src/config/app.ts` → `premium` |
| Search filters | `src/components/listings/FilterSheet.tsx` |

## How the account types work

| | Guest | Buyer & Renter | Owner | Broker |
|---|---|---|---|---|
| Browse, search and filter | ✅ | ✅ | ✅ | ✅ |
| Save favourites | asks to sign up | ✅ | — | — |
| Send buy / rent requests | asks to sign up | ✅ | — | — |
| Chat in the app | asks to sign up | ✅ | ✅ | ✅ |
| WhatsApp the owner/broker | asks to sign up | ✅ | — | — |
| Post listings with photos and map pin | — | — | ✅ | ✅ |
| Accept / decline requests | — | — | ✅ | ✅ |
| Ask for Premium | — | — | ✅ | ✅ |

These rules are also enforced by the database itself (`supabase/schema.sql`), so they can't be bypassed.
