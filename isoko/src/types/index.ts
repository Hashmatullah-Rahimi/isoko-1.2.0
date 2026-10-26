/** Shared data types. These match the tables in supabase/schema.sql. */

/** customer = Buyer & Renter. Owners and brokers both post listings. */
export type UserRole = 'customer' | 'owner' | 'broker';

/** "house" and "car" are kept fully separate everywhere in the app. */
export type CategoryId = 'house' | 'car';

/** Each category has three sections: for sale, for rent, and accessories. */
export type SectionId = 'sale' | 'rent' | 'accessory';

export type ListingStatus = 'active' | 'sold' | 'rented' | 'hidden';

export type PricePeriod = 'total' | 'month' | 'week' | 'day';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  /** WhatsApp number (only ever loaded for your own profile). */
  whatsapp?: string | null;
  /** Does this owner allow buyers/renters to contact them on WhatsApp? */
  whatsapp_enabled?: boolean;
}

export interface HouseDetails {
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_m2?: number;
  furnished?: boolean;
  parking?: boolean;
}

export interface CarDetails {
  make?: string;
  model?: string;
  year?: number;
  mileage_km?: number;
  fuel?: string;
  transmission?: string;
  seats?: number;
}

export interface AccessoryDetails {
  accessory_type?: string;
  condition?: 'new' | 'used';
  brand?: string;
}

export type ListingDetails = HouseDetails & CarDetails & AccessoryDetails;

export interface Listing {
  id: string;
  owner_id: string;
  category: CategoryId;
  section: SectionId;
  title: string;
  description: string;
  price: number;
  currency: string;
  price_period: PricePeriod;
  location: string;
  details: ListingDetails;
  photos: string[];
  status: ListingStatus;
  created_at: string;
  /** Optional exact map pin, set with "Use my current location". */
  latitude?: number | null;
  longitude?: number | null;
  /** Optional Google Maps link pasted by the owner. */
  map_url?: string | null;
  /** Premium until this time (only the Isoko team can set it). */
  featured_until?: string | null;
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'whatsapp_enabled' | 'role'> | null;
}

export type PremiumPlan = 'week' | 'month';

export interface PremiumRequest {
  id: string;
  listing_id: string;
  owner_id: string;
  plan: PremiumPlan;
  status: 'pending' | 'active' | 'declined';
  created_at: string;
}

export type RequestType = 'buy' | 'rent';
export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface ListingRequest {
  id: string;
  listing_id: string;
  customer_id: string;
  owner_id: string;
  type: RequestType;
  message: string;
  start_date: string | null;
  end_date: string | null;
  status: RequestStatus;
  contact_phone: string | null;
  created_at: string;
  listing?: Pick<Listing, 'id' | 'title' | 'photos' | 'price' | 'currency' | 'price_period' | 'category' | 'section'> | null;
  customer?: Pick<Profile, 'id' | 'full_name'> | null;
}

export interface NewListingInput {
  category: CategoryId;
  section: SectionId;
  title: string;
  description: string;
  price: number;
  currency: string;
  price_period: PricePeriod;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  map_url?: string | null;
  details: ListingDetails;
  photoUris: string[];
}

/** A chat between one buyer/renter and the owner, about one listing. */
export interface Conversation {
  id: string;
  listing_id: string | null;
  customer_id: string;
  owner_id: string;
  listing_title: string;
  listing_photo: string | null;
  listing_category: CategoryId;
  last_message: string;
  last_sender_id: string | null;
  last_message_at: string;
  customer_last_read_at: string;
  owner_last_read_at: string;
  created_at: string;
  customer?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
  owner?: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'whatsapp_enabled'> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** Only on the phone, while a message is still being sent. */
  pending?: boolean;
}
