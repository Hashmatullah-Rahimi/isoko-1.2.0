import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isBackendConfigured, supabase } from '@/lib/supabase';
import { getProfile, logOut } from '@/services/auth';
import { addFavorite, fetchFavoriteIds, removeFavorite } from '@/services/favorites';
import type { Profile, UserRole } from '@/types';

const GUEST_KEY = 'isoko.guest';

interface AuthState {
  /** True while the app is checking if someone is logged in. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  isGuest: boolean;
  role: UserRole | 'guest' | null;
  /** True for Owner AND Broker accounts — both post and manage listings. */
  isOwner: boolean;
  isBroker: boolean;
  isCustomer: boolean;
  favoriteIds: Set<string>;
  continueAsGuest: () => Promise<void>;
  leaveGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const loadUserData = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setFavoriteIds(new Set());
      return;
    }
    try {
      const p = await getProfile(s.user.id);
      setProfile(p);
      if (p?.role === 'customer') setFavoriteIds(new Set(await fetchFavoriteIds(s.user.id)));
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const guest = (await AsyncStorage.getItem(GUEST_KEY)) === '1';
      if (!isBackendConfigured) {
        if (mounted) {
          setIsGuest(guest);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setIsGuest(!data.session && guest);
      await loadUserData(data.session);
      if (mounted) setLoading(false);
    })();

    if (!isBackendConfigured) return () => { mounted = false; };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        setIsGuest(false);
        AsyncStorage.removeItem(GUEST_KEY);
      }
      // Run outside the auth callback to avoid blocking Supabase.
      setTimeout(() => loadUserData(s), 0);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, '1');
    setIsGuest(true);
  }, []);

  const leaveGuest = useCallback(async () => {
    await AsyncStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
  }, []);

  const signOut = useCallback(async () => {
    await logOut();
    await AsyncStorage.removeItem(GUEST_KEY);
    setSession(null);
    setProfile(null);
    setIsGuest(false);
    setFavoriteIds(new Set());
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadUserData(session);
  }, [loadUserData, session]);

  /** Returns the new saved state. Throws if the user must log in first. */
  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!session || profile?.role !== 'customer') throw new Error('LOGIN_REQUIRED');
      const saved = favoriteIds.has(listingId);
      const next = new Set(favoriteIds);
      if (saved) next.delete(listingId);
      else next.add(listingId);
      setFavoriteIds(next); // update instantly, then sync
      try {
        if (saved) await removeFavorite(session.user.id, listingId);
        else await addFavorite(session.user.id, listingId);
      } catch (e) {
        setFavoriteIds(favoriteIds);
        throw e;
      }
      return !saved;
    },
    [favoriteIds, profile?.role, session],
  );

  const value = useMemo<AuthState>(() => {
    const role: AuthState['role'] = profile?.role ?? (session ? null : isGuest ? 'guest' : null);
    return {
      loading,
      session,
      profile,
      isGuest: !session && isGuest,
      role,
      isOwner: profile?.role === 'owner' || profile?.role === 'broker',
      isBroker: profile?.role === 'broker',
      isCustomer: profile?.role === 'customer',
      favoriteIds,
      continueAsGuest,
      leaveGuest,
      signOut,
      refreshProfile,
      toggleFavorite,
    };
  }, [loading, session, profile, isGuest, favoriteIds, continueAsGuest, leaveGuest, signOut, refreshProfile, toggleFavorite]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
