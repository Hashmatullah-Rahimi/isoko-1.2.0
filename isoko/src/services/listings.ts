import { appConfig } from '@/config/app';
import { assertBackend, isBackendConfigured, supabase } from '@/lib/supabase';
import type { CategoryId, Listing, ListingStatus, NewListingInput, SectionId } from '@/types';
import { deletePhotos, uploadPhotos } from './storage';

const SELECT = '*, owner:profiles!listings_owner_id_fkey(id, full_name, avatar_url, whatsapp_enabled, role)';

export type SortOrder = 'newest' | 'priceLow' | 'priceHigh';

export interface ListingFilter {
  category?: CategoryId;
  section?: SectionId;
  accessoryType?: string;
  search?: string;
  /** Price range. Only listings in this currency are matched when a price is set. */
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  /** Town or neighbourhood, e.g. "Kigali" or "Kimihurura". */
  location?: string;
  /** Houses: at least this many bedrooms / bathrooms. */
  minBedrooms?: number;
  minBathrooms?: number;
  furnished?: boolean;
  parking?: boolean;
  propertyType?: string;
  /** Cars: made in this year or newer, fuel and gearbox. */
  minYear?: number;
  fuel?: string;
  transmission?: string;
  sort?: SortOrder;
  limit?: number;
  offset?: number;
}

/** Is this listing Premium right now? */
export function isPremium(l: Pick<Listing, 'featured_until'>) {
  return !!l.featured_until && new Date(l.featured_until).getTime() > Date.now();
}

/** Premium listings first, keeping the order of everything else. */
function premiumFirst(list: Listing[]) {
  return [...list.filter(isPremium), ...list.filter((l) => !isPremium(l))];
}

const clean = (v: string) => v.trim().replace(/[%,()*]/g, ' ');

/** Active listings that buyers and renters can see. */
export async function fetchListings(filter: ListingFilter = {}): Promise<Listing[]> {
  if (!isBackendConfigured) return [];
  const limit = filter.limit ?? appConfig.pageSize;
  const offset = filter.offset ?? 0;

  const sort = filter.sort ?? 'newest';

  let query = supabase.from('listings').select(SELECT).eq('status', 'active');

  if (filter.category) query = query.eq('category', filter.category);
  if (filter.section) query = query.eq('section', filter.section);
  if (filter.accessoryType) query = query.eq('details->>accessory_type', filter.accessoryType);
  if (filter.search?.trim()) {
    const q = clean(filter.search);
    query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (filter.location?.trim()) query = query.ilike('location', `%${clean(filter.location)}%`);
  if (filter.minPrice !== undefined || filter.maxPrice !== undefined || sort !== 'newest') {
    if (filter.currency) query = query.eq('currency', filter.currency);
  }
  if (filter.minPrice !== undefined) query = query.gte('price', filter.minPrice);
  if (filter.maxPrice !== undefined) query = query.lte('price', filter.maxPrice);
  if (filter.minBedrooms) query = query.gte('bedrooms', filter.minBedrooms);
  if (filter.minBathrooms) query = query.gte('bathrooms', filter.minBathrooms);
  if (filter.furnished) query = query.eq('details->>furnished', 'true');
  if (filter.parking) query = query.eq('details->>parking', 'true');
  if (filter.propertyType) query = query.eq('details->>property_type', filter.propertyType);
  if (filter.minYear) query = query.gte('car_year', filter.minYear);
  if (filter.fuel) query = query.eq('details->>fuel', filter.fuel);
  if (filter.transmission) query = query.eq('details->>transmission', filter.transmission);

  query =
    sort === 'newest'
      ? query.order('created_at', { ascending: false })
      : query.order('price', { ascending: sort === 'priceLow' }).order('created_at', { ascending: false });

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  const list = (data ?? []) as Listing[];
  // With "Newest", Premium listings come first. A price order is kept exactly as asked.
  return sort === 'newest' ? premiumFirst(list) : list;
}

/** Premium listings for the "Premium" row on Home (newest Premium first). */
export async function fetchPremiumListings(limit = 10): Promise<Listing[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('listings')
    .select(SELECT)
    .eq('status', 'active')
    .gt('featured_until', new Date().toISOString())
    .order('featured_until', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Listing[];
}

export async function fetchListing(id: string): Promise<Listing | null> {
  if (!isBackendConfigured) return null;
  const { data, error } = await supabase.from('listings').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Listing | null;
}

/** Count of active listings per category + section, for the home screen. */
export async function fetchCounts(): Promise<Record<string, number>> {
  if (!isBackendConfigured) return {};
  const { data, error } = await supabase.from('listing_counts').select('*');
  if (error) return {};
  const out: Record<string, number> = {};
  for (const row of data ?? []) out[`${row.category}-${row.section}`] = row.total;
  return out;
}

export async function fetchMyListings(ownerId: string): Promise<Listing[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('listings')
    .select(SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Listing[];
}

/** Uploads the photos, then saves the listing. */
export async function createListing(ownerId: string, input: NewListingInput, onProgress?: (p: number) => void) {
  assertBackend();
  const photos = await uploadPhotos(ownerId, input.photoUris, (p) => onProgress?.(p * 0.9));
  const { photoUris: _ignored, ...rest } = input;
  const { data, error } = await supabase
    .from('listings')
    .insert({ ...rest, owner_id: ownerId, photos, status: 'active' })
    .select(SELECT)
    .single();
  if (error) {
    await deletePhotos(photos).catch(() => undefined);
    throw error;
  }
  onProgress?.(1);
  return data as Listing;
}

export async function setListingStatus(id: string, status: ListingStatus) {
  assertBackend();
  const { error } = await supabase.from('listings').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteListing(listing: Listing) {
  assertBackend();
  const { error } = await supabase.from('listings').delete().eq('id', listing.id);
  if (error) throw error;
  await deletePhotos(listing.photos).catch(() => undefined);
}
