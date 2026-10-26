import type { RealtimeChannel } from '@supabase/supabase-js';
import { assertBackend, isBackendConfigured, supabase } from '@/lib/supabase';
import type { Conversation, Message } from '@/types';

const CONVERSATION_SELECT =
  '*, customer:profiles!conversations_customer_id_fkey(id, full_name, avatar_url), owner:profiles!conversations_owner_id_fkey(id, full_name, avatar_url, whatsapp_enabled)';

/** Opens the chat about a listing (creates it the first time). Returns its id. */
export async function startConversation(listingId: string): Promise<string> {
  assertBackend();
  const { data, error } = await supabase.rpc('start_conversation', { p_listing_id: listingId });
  if (error) throw error;
  return data as string;
}

/** Opens the chat that belongs to a buy/rent request (for the buyer/renter or the owner). */
export async function startConversationFromRequest(requestId: string): Promise<string> {
  assertBackend();
  const { data, error } = await supabase.rpc('start_conversation_from_request', { p_request_id: requestId });
  if (error) throw error;
  return data as string;
}

/** All chats of the logged-in person, newest first. */
export async function fetchConversations(): Promise<Conversation[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase.from('conversations').select(CONVERSATION_SELECT).order('last_message_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function fetchConversation(id: string): Promise<Conversation | null> {
  if (!isBackendConfigured) return null;
  const { data, error } = await supabase.from('conversations').select(CONVERSATION_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Conversation | null;
}

/** The last messages of a chat, oldest first. */
export async function fetchMessages(conversationId: string, limit = 300): Promise<Message[]> {
  if (!isBackendConfigured) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message> {
  assertBackend();
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return data as Message;
}

export async function markConversationRead(conversationId: string) {
  if (!isBackendConfigured) return;
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
}

/** True when the other person wrote something you have not opened yet. */
export function isUnread(c: Conversation, userId: string) {
  if (!c.last_sender_id || c.last_sender_id === userId) return false;
  const myReadAt = c.customer_id === userId ? c.customer_last_read_at : c.owner_last_read_at;
  return new Date(c.last_message_at).getTime() > new Date(myReadAt).getTime();
}

let channelCount = 0;

/** Calls onMessage for every new message in this chat, live. Returns a function to stop. */
export function subscribeToMessages(conversationId: string, onMessage: (m: Message) => void) {
  if (!isBackendConfigured) return () => undefined;
  const channel: RealtimeChannel = supabase
    .channel(`messages-${conversationId}-${++channelCount}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onMessage(payload.new as Message),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Calls onChange whenever any of your chats changes (new message, read, new chat). */
export function subscribeToConversations(onChange: () => void) {
  if (!isBackendConfigured) return () => undefined;
  const channel: RealtimeChannel = supabase
    .channel(`conversations-${++channelCount}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
