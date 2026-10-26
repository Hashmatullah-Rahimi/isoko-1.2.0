import { assertBackend, isBackendConfigured, supabase } from '@/lib/supabase';
import type { Listing, ListingRequest, RequestStatus, RequestType } from '@/types';

const SELECT =
  '*, listing:listings(id, title, photos, price, currency, price_period, category, section), customer:profiles!requests_customer_id_fkey(id, full_name)';

export interface NewRequestInput {
  listing: Listing;
  customerId: string;
  type: RequestType;
  message: string;
  phone: string;
  startDate?: string | null;
  endDate?: string | null;
}

/** A buyer or renter asks the owner to buy / rent. */
export async function sendRequest(input: NewRequestInput) {
  assertBackend();
  const { error } = await supabase.from('requests').insert({
    listing_id: input.listing.id,
    owner_id: input.listing.owner_id,
    customer_id: input.customerId,
    type: input.type,
    message: input.message.trim(),
    contact_phone: input.phone.trim() || null,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
  });
  if (error) throw error;
}

/** Requests the logged-in buyer/renter has sent. */
export async function fetchSentRequests(customerId: string): Promise<ListingRequest[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('requests')
    .select(SELECT)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ListingRequest[];
}

/** Requests an owner has received. */
export async function fetchReceivedRequests(ownerId: string): Promise<ListingRequest[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('requests')
    .select(SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ListingRequest[];
}

export async function answerRequest(id: string, status: Exclude<RequestStatus, 'pending'>) {
  assertBackend();
  const { error } = await supabase.from('requests').update({ status }).eq('id', id);
  if (error) throw error;
}

/** Owner's phone number, visible to the customer only after the owner accepts. */
export async function fetchOwnerPhone(requestId: string): Promise<string | null> {
  if (!isBackendConfigured) return null;
  const { data, error } = await supabase.rpc('owner_phone_for_request', { request_id: requestId });
  if (error) return null;
  return (data as string | null) ?? null;
}
