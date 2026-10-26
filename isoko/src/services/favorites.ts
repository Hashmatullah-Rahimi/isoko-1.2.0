import { assertBackend, isBackendConfigured, supabase } from '@/lib/supabase';
import type { Listing } from '@/types';

export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.listing_id as string);
}

export async function fetchFavorites(userId: string): Promise<Listing[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select('created_at, listing:listings(*, owner:profiles!listings_owner_id_fkey(id, full_name, avatar_url, whatsapp_enabled))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((r: any) => r.listing as Listing | null)
    .filter((l): l is Listing => !!l && l.status === 'active');
}

export async function addFavorite(userId: string, listingId: string) {
  assertBackend();
  const { error } = await supabase.from('favorites').upsert({ user_id: userId, listing_id: listingId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, listingId: string) {
  assertBackend();
  const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
  if (error) throw error;
}
