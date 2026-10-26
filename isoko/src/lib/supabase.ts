import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * Connection to the Isoko backend (Supabase).
 * The two values come from the ".env" file (see .env.example and docs/03-BACKEND-SETUP.md).
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/** False until you add your Supabase keys. The app still opens and can be browsed as a guest. */
export const isBackendConfigured = url.startsWith('https://') && !url.includes('YOUR-PROJECT') && key.length > 20;

export const supabase = createClient(
  isBackendConfigured ? url : 'https://placeholder.supabase.co',
  isBackendConfigured ? key : 'placeholder-key-not-configured',
  {
    auth: {
      storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : (AsyncStorage as any),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Keep the login fresh only while the app is open on screen.
if (Platform.OS !== 'web' && isBackendConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export class BackendNotConfiguredError extends Error {
  constructor() {
    super('The Isoko server is not connected yet. Add your Supabase keys to the .env file (see docs/03-BACKEND-SETUP.md).');
  }
}

export function assertBackend() {
  if (!isBackendConfigured) throw new BackendNotConfiguredError();
}
