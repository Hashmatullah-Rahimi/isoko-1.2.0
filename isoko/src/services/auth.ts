import { assertBackend, supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  /** Owners: let buyers and renters contact them on WhatsApp. */
  whatsapp?: boolean;
}

export async function signUp({ fullName, email, phone, password, role, whatsapp = false }: SignUpInput) {
  assertBackend();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    // Saved on the account; the database trigger copies it into "profiles".
    options: { data: { full_name: fullName.trim(), phone: phone.trim(), role, whatsapp: whatsapp ? 'true' : 'false' } },
  });
  if (error) throw error;
  return data;
}

export async function logIn(email: string, password: string, expectedRole: UserRole) {
  assertBackend();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  const profile = await getProfile(data.user.id);
  if (profile && profile.role !== expectedRole) {
    await supabase.auth.signOut();
    // The log-in screen turns this into a translated message.
    throw new WrongRoleError(profile.role);
  }
  return { session: data.session, profile };
}

export class WrongRoleError extends Error {
  constructor(public actualRole: UserRole) {
    super('WRONG_ROLE');
  }
}

export async function logOut() {
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  assertBackend();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) throw error;
}

// Phone numbers are private in the database, so they are read separately.
const PROFILE_COLUMNS = 'id, full_name, role, avatar_url, created_at';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [{ data: phone }, { data: wa }] = await Promise.all([supabase.rpc('my_phone'), supabase.rpc('my_whatsapp')]);
  const waRow = Array.isArray(wa) ? wa[0] : wa;
  return {
    ...(data as Omit<Profile, 'phone'>),
    phone: (phone as string | null) ?? null,
    whatsapp: waRow?.whatsapp ?? null,
    whatsapp_enabled: !!waRow?.whatsapp_enabled,
  };
}

export async function updateProfile(
  userId: string,
  changes: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url' | 'whatsapp' | 'whatsapp_enabled'>>,
) {
  assertBackend();
  const { error } = await supabase.from('profiles').update(changes).eq('id', userId);
  if (error) throw error;
  return getProfile(userId);
}
