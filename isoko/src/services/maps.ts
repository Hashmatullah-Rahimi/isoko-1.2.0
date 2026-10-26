import * as Location from 'expo-location';
import { Linking } from 'react-native';
import type { Listing } from '@/types';

/**
 * Google Maps links. No API key is needed: the links open the Google Maps app
 * (or maps.google.com in the browser) at the right place.
 */

type Place = Pick<Listing, 'latitude' | 'longitude' | 'map_url' | 'location'>;

const GOOGLE_LINK = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

/** Is this text a Google Maps link? */
export function isGoogleMapsLink(text: string) {
  return GOOGLE_LINK.test(text.trim());
}

/** Reads "lat,lng" out of a long Google Maps link, if it has them (e.g. …/@-1.9441,30.0619,17z). */
export function coordsFromLink(link: string): { latitude: number; longitude: number } | null {
  const m = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? link.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (!m) return null;
  const latitude = Number(m[1]);
  const longitude = Number(m[2]);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export function hasMapPlace(p: Place) {
  return !!p.map_url || (p.latitude != null && p.longitude != null) || !!p.location?.trim();
}

/** Link that shows the place on Google Maps. Uses the exact pin if there is one. */
export function googleMapsUrl(p: Place) {
  if (p.map_url) return p.map_url;
  const query = p.latitude != null && p.longitude != null ? `${p.latitude},${p.longitude}` : p.location.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Link that opens Google Maps with directions to the place. */
export function directionsUrl(p: Place) {
  const destination = p.latitude != null && p.longitude != null ? `${p.latitude},${p.longitude}` : p.location.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function openUrl(url: string) {
  return Linking.openURL(url);
}

/**
 * The phone's current position, for owners standing at the house they are listing.
 * Returns null if the person says no to location access.
 */
export async function getCurrentPin(): Promise<{ latitude: number; longitude: number } | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  // 6 decimals ≈ 10 cm — more than enough, and keeps the link short.
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return { latitude: round(pos.coords.latitude), longitude: round(pos.coords.longitude) };
}
