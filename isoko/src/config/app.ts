/**
 * General app settings. Safe to edit.
 */
export const appConfig = {
  name: 'Isoko',
  // The tagline and all other texts are in src/i18n (en.ts, fr.ts, rw.ts).

  /** Currencies an owner can choose when posting. The first one is the default. */
  currencies: ['USD', 'EUR', 'RWF'],

  /** Max number of photos per listing. */
  maxPhotos: 10,

  /** Photo quality when uploading (0 to 1). Lower = smaller files, faster uploads. */
  photoQuality: 0.8,

  /** Name of the storage bucket for listing photos (see supabase/storage.sql). */
  photoBucket: 'listing-photos',

  /** How many listings to load per page. */
  pageSize: 20,

  supportEmail: 'support@isoko.app',

  /**
   * Country code added to local phone numbers (like 0788 123 456) for WhatsApp links.
   * 250 = Rwanda. Change it if most of your users are in another country.
   */
  defaultCountryCode: '250',

  /**
   * PREMIUM listings (shown first, with a gold badge, in the "Premium" row on Home).
   * Change the prices here. The team turns Premium on after payment —
   * see docs/08-BROKERS-PREMIUM-MAPS.md.
   */
  premium: {
    currency: 'RWF',
    plans: {
      week: { days: 7, price: 5000 },
      month: { days: 30, price: 15000 },
    },
    /** WhatsApp number of the Isoko team, for owners who want to pay or ask about Premium. Leave '' to hide the button. */
    teamWhatsApp: '',
  },
};
