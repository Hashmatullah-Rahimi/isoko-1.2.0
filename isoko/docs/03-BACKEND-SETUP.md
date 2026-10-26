# 3. Backend setup (Supabase)

Supabase stores the accounts, listings, photos, saved items and requests. The free plan is enough to start.

## Step 1 — Create the project
1. Go to https://supabase.com and sign in.
2. **New project** → name it `isoko`, choose a strong database password (save it somewhere safe), and pick the region closest to your users.
3. Wait about 2 minutes while it starts.

## Step 2 — Create the tables
1. In the left menu open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy everything, paste it, and press **Run**. You should see "Success".
3. New query again → paste everything from `supabase/storage.sql` → **Run**.
4. New query again → paste everything from `supabase/messages.sql` → **Run** (chat + WhatsApp).
5. New query again → paste everything from `supabase/update-1.2.0.sql` → **Run** (brokers, Premium, map pins, filters).

This creates:
- `profiles` — name, phone (private), account type (buyer & renter, owner or broker)
- `listings` — houses, cars and accessories, with photos
- `favorites` — saved listings
- `requests` — buy and rent requests
- `conversations` and `messages` — in-app chat (live)
- `premium_requests` — requests to make a listing Premium (see docs/08-BROKERS-PREMIUM-MAPS.md)
- the `listing-photos` storage bucket
- all security rules (only owners can post, only you can edit your things, phone numbers stay private until a request is accepted)

## Step 3 — Connect the app
1. In Supabase: **Project Settings → API** (or **Connect**).
2. Copy the **Project URL** and the **publishable key** (also called the *anon public* key). Never use the *secret / service_role* key in the app.
3. In the `isoko` folder, copy `.env.example` to `.env` and paste them:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
4. Restart: stop `npm start` (Ctrl + C) and run it again.

## Step 4 — Email confirmation (choose one)
**Authentication → Sign In / Providers → Email**:
- **"Confirm email" ON** (recommended for launch): people must click a link in their email before logging in. The app shows a "Check your email" screen.
- **OFF** (easier while testing): people are logged in right after signing up.

Optional: under **Authentication → Emails** you can change the email texts and add the Isoko logo.

## Step 5 — Try it
1. Open the app → **Create account → Owner** → sign up.
2. Tap the gold **+** → post a house with a photo.
3. Log out → **Create account → Buyer & Renter** → find the house → **Request to rent**.
4. On the same listing tap **Message** and send "Hello".
5. Log back in as the owner → the chat icon on Home shows a red **1** → open it and reply.
6. **Profile → Requests received** → **Accept**. As the buyer you can now tap **Call**.

## For the cloud builds
When you build with EAS, add the same two values as environment variables in your Expo project (expo.dev → Project → **Environment variables**, for the `preview` and `production` environments), so the installed apps can reach Supabase.
