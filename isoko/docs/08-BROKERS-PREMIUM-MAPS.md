# 8. Brokers, filters, Premium and Google Maps (version 1.2.0)

## Setup (once)
Run `supabase/update-1.2.0.sql` in Supabase → **SQL Editor** → New query → paste → **Run**.
Run it after `schema.sql`, `storage.sql` and `messages.sql`. It is safe to run more than once.

---

## Broker accounts
- The welcome screen now has four choices: **Buyer & Renter · Owner · Broker · Look around as guest** (the same for Log in).
- A broker can do everything an owner can: post listings, manage them, answer requests, chat, WhatsApp and Premium.
- On the listing page, a broker's name has a purple **Broker** tag so buyers know who they are talking to.
- Nobody can change their account type after sign-up (the database blocks it).

| File | What it does |
|---|---|
| `src/components/layout/RolePicker.tsx` | Buyer & Renter / Owner / Broker picker on sign-up and log-in |
| `src/app/welcome.tsx` | The four choices |
| `src/context/AuthContext.tsx` | `isOwner` is true for owners **and** brokers; `isBroker` only for brokers |

## Search filters
- Search screen → the **filter button** next to the search box. On Houses and Cars, the small filter button in the search bar opens it directly.
- Filters: sort, price (min/max + currency), location, and for houses bedrooms, bathrooms, property type, furnished, parking; for cars year, fuel, gearbox.
- A price filter only matches listings in the chosen currency (USD, EUR or RWF), so prices are compared fairly.
- The database keeps number copies of bedrooms, bathrooms and car year, so "3+ bedrooms" is fast and exact.

| File | What it does |
|---|---|
| `src/components/listings/FilterSheet.tsx` | The filter sheet |
| `src/app/search.tsx` | Search screen with the filter button |
| `src/services/listings.ts` | `fetchListings()` — all filters and sorting |

## Premium listings (advertising)
**What owners and brokers get**
- A place in the **Premium** row near the top of Home
- First place in Houses, Cars and Search (when sorted by Newest)
- A gold **Premium** badge and gold frame on the card

**How it works**
1. The owner or broker opens **Profile → Premium** (or the gold Premium button in My listings / on their listing), picks a listing and **1 week** or **1 month**, and taps **Request Premium**.
2. You (the Isoko team) see the request in Supabase → **Table Editor → premium_waiting** (or run `select * from premium_waiting;` in the SQL Editor). It shows the listing, owner and phone number.
3. Contact them and take the payment (for example Mobile Money).
4. Switch Premium on — SQL Editor:
   ```sql
   select public.activate_premium('<request_id from premium_waiting>');
   ```
   1 week = 7 days, 1 month = 30 days. If the listing is already Premium, the time is added on top.
5. Premium ends by itself when the time is over.

**Safety:** owners can never make their own listing Premium from the app — the database ignores any attempt, and only the team can run `activate_premium` (tested).

**Prices and contact:** `src/config/app.ts` → `premium` (currency, price per plan, and `teamWhatsApp` — your WhatsApp number; when filled in, a "Pay or ask on WhatsApp" button appears after a request).

**Payments — important before launch.** Apple and Google may require that paid promotion bought inside an app goes through their in-app purchase systems. Right now the app takes no payment: it only sends a request, and the team handles payment outside the app. Before launching Premium, check the current App Store and Google Play rules for your case (or ask me to add in-app purchases).

| File | What it does |
|---|---|
| `src/app/premium.tsx` | Premium screen (choose listing and plan) |
| `src/components/listings/PremiumBadge.tsx` | Gold badge |
| `src/services/premium.ts` | Send a Premium request |
| `src/app/(tabs)/home.tsx` | Premium row on Home |
| `supabase/update-1.2.0.sql` | `premium_requests` table, `activate_premium`, `premium_waiting` |

## Google Maps
- **When posting** (step 3): "I'm here — use my location" saves the exact spot (the phone asks for permission once). Or paste a link from Google Maps (Share → Copy link). Both are optional.
- **On each listing:** a map card with **Open map** (opens Google Maps at the place) and **Directions**.
- No Google API key or account is needed — these are normal Google Maps links.
- If a listing has no pin, Google Maps searches for its written location instead.

| File | What it does |
|---|---|
| `src/services/maps.ts` | Builds the Google Maps links, reads your location |
| `src/components/listings/MapCard.tsx` | Map card on the listing page |
| `src/app/(tabs)/post.tsx` | Pin / link fields in step 3 |
