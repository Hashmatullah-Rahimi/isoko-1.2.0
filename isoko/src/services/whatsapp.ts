import { Alert, Linking } from 'react-native';
import { appConfig } from '@/config/app';
import { isBackendConfigured, supabase } from '@/lib/supabase';
import { translate } from '@/i18n';

/**
 * The owner's WhatsApp number for a listing.
 * The server only returns it to logged-in Buyer & Renter accounts,
 * and only if the owner switched WhatsApp on.
 */
export async function fetchOwnerWhatsApp(listingId: string): Promise<string | null> {
  if (!isBackendConfigured) return null;
  const { data, error } = await supabase.rpc('owner_whatsapp', { p_listing_id: listingId });
  if (error) return null;
  return (data as string | null) || null;
}

/** Turns "0788 123 456" or "+250 788 123 456" into "250788123456" (the format WhatsApp needs). */
export function toWhatsAppNumber(raw: string) {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1).replace(/\D/g, '');
  digits = digits.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return appConfig.defaultCountryCode + digits.slice(1);
  if (digits.length <= 9) return appConfig.defaultCountryCode + digits;
  return digits;
}

/** Opens WhatsApp with a chat to this number and a ready-made first message. */
export async function openWhatsApp(rawNumber: string, message: string) {
  const url = `https://wa.me/${toWhatsAppNumber(rawNumber)}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('WhatsApp', translate('wa.failed'));
  }
}
