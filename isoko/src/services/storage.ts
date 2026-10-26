import { appConfig } from '@/config/app';
import { assertBackend, supabase } from '@/lib/supabase';

/**
 * Uploads one photo from the phone to the "listing-photos" bucket
 * and returns its public web address.
 */
export async function uploadPhoto(ownerId: string, uri: string): Promise<string> {
  assertBackend();
  const response = await fetch(uri);
  const body = await response.arrayBuffer();
  const ext = (uri.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg';
  const contentType = safeExt === 'jpg' ? 'image/jpeg' : `image/${safeExt}`;
  const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage.from(appConfig.photoBucket).upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error) throw error;

  return supabase.storage.from(appConfig.photoBucket).getPublicUrl(path).data.publicUrl;
}

/** Uploads several photos one after another and reports progress (0 to 1). */
export async function uploadPhotos(ownerId: string, uris: string[], onProgress?: (p: number) => void) {
  const urls: string[] = [];
  for (let i = 0; i < uris.length; i++) {
    urls.push(await uploadPhoto(ownerId, uris[i]));
    onProgress?.((i + 1) / uris.length);
  }
  return urls;
}

/** Deletes photos from storage when a listing is removed. */
export async function deletePhotos(publicUrls: string[]) {
  const marker = `/object/public/${appConfig.photoBucket}/`;
  const paths = publicUrls.map((u) => u.split(marker)[1]).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(appConfig.photoBucket).remove(paths);
}
