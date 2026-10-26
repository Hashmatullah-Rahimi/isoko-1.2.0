import { assertBackend, isBackendConfigured, supabase } from '@/lib/supabase';
import type { PremiumPlan, PremiumRequest } from '@/types';

/**
 * Premium = a listing shown first and in the "Premium" row on Home.
 * The owner (or broker) asks for it here; the Isoko team turns it on after payment
 * (see docs/08-BROKERS-PREMIUM-MAPS.md). Nobody can switch it on from the app.
 */
export async function requestPremium(ownerId: string, listingId: string, plan: PremiumPlan) {
  assertBackend();
  const { data, error } = await supabase
    .from('premium_requests')
    .insert({ owner_id: ownerId, listing_id: listingId, plan })
    .select('*')
    .single();
  if (error) {
    // Only one waiting request per listing.
    if (error.code === '23505') throw new Error('ALREADY_PENDING');
    throw error;
  }
  return data as PremiumRequest;
}

export async function fetchMyPremiumRequests(ownerId: string): Promise<PremiumRequest[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('premium_requests')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as PremiumRequest[];
}
