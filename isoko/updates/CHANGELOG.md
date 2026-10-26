# Isoko changelog

Every version of the app, newest first.

<!-- NEW ENTRIES GO BELOW THIS LINE -->

## 1.2.0 — 2026-10-22
- Broker accounts: a fourth choice on the welcome screen (Buyer & Renter · Owner · Broker · Guest). Brokers post and manage listings for their clients, like owners, and show a "Broker" tag on their listings.
- Search filters: sort (newest, lowest or highest price), price range with currency, location, bedrooms, bathrooms, property type, furnished, parking; for cars: year, fuel and gearbox. The filter button also opens from Houses and Cars.
- Premium listings: owners and brokers ask for Premium (1 week or 1 month). Premium listings appear in a "Premium" row near the top of Home, come first in lists, and have a gold badge and frame. The Isoko team switches Premium on after payment.
- Google Maps: owners can pin their exact location or paste a Google Maps link when posting. Each listing shows a map card with "Open map" and "Directions".
- New database file: supabase/update-1.2.0.sql. New library: expo-location (needs a store build).

## 1.1.0 — 2026-10-19
- Three languages: English, Français and Ikinyarwanda. Pick one from the globe button on the welcome and log-in screens, or Profile → Language. The app remembers it.
- Messages: buyers and renters can chat with owners inside the app, live. Inbox under the chat icon on Home and Profile → Messages, with a red badge for unread chats.
- WhatsApp: owners can let buyers and renters contact them on WhatsApp (switch on sign-up and in Edit profile). A green WhatsApp button appears on their listings and in the chat.
- "Message" button on every buy/rent request, for both sides.
- New database file: supabase/messages.sql.

## 1.0.0 — 2026-10-19
- First version of Isoko for iPhone and Android.
- Welcome screen with three choices: Buyer & Renter, Owner, or look around as a guest (same choices for log in).
- Separate Houses and Cars sections, each with Buy, Rent and Accessories.
- Owners post listings with photos in four steps; buyers and renters send requests.
- Saved listings, search, requests inbox, profile, update checker.
- Animated intro, tab bar, cards, empty states and screen transitions.
