# 7. Messages and WhatsApp

## Setup (once)
Run `supabase/messages.sql` in Supabase → **SQL Editor** → New query → paste → **Run** (after `schema.sql` and `storage.sql`).
That's all — live updates are switched on by the same file.

## In-app messages
- **One chat per buyer/renter per listing.** Opening "Message" again on the same listing reopens the same chat.
- **Where to start a chat**
  - Listing page → "Contact the owner" → **Message** (buyers & renters)
  - My requests / Requests received → **Message** on any request (both sides — this is how an owner writes to someone first)
- **Where to read chats:** the chat icon at the top of Home (red badge = unread), or Profile → Messages.
- **Live:** new messages appear instantly (Supabase Realtime). The inbox reorders itself and the badge updates.
- **Privacy:** only the two people in a chat can read it. Nobody can send a message pretending to be someone else, and nobody can read other people's chats (tested).
- Chats keep the listing's title and photo, so they still make sense after a listing is sold or deleted.

| File | What it does |
|---|---|
| `src/app/messages/index.tsx` | Inbox |
| `src/app/messages/[id].tsx` | One chat |
| `src/components/messages/` | Chat row, bubble, message box |
| `src/services/messages.ts` | Load/send messages, live updates |
| `src/context/MessagesContext.tsx` | Unread badge |
| `supabase/messages.sql` | Tables and security rules |

## WhatsApp
- **Owners choose.** On sign-up there is a switch "Buyers and renters can contact me on WhatsApp" (on by default). They can change it, and their WhatsApp number, in **Profile → Edit profile**.
- **Who sees the number:** only logged-in Buyer & Renter accounts, and only when they tap the WhatsApp button. Guests are asked to create an account first. The number is never sent with the listing itself.
- **Where:** green **WhatsApp** button on the listing page and in the chat header. It opens WhatsApp with a ready message: *"Hello Jean, I saw your listing "…" on Isoko. Is it still available?"* (in the user's language).
- **Phone numbers:** a local number like `0788 123 456` is turned into `+250 788 123 456` automatically. If most users are in another country, change `defaultCountryCode` in `src/config/app.ts`.
