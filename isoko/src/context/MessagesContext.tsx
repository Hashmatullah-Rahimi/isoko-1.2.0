import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { fetchConversations, isUnread, subscribeToConversations } from '@/services/messages';
import { useAuth } from './AuthContext';

interface MessagesState {
  /** Number of chats with a message you have not read yet. */
  unreadCount: number;
  refreshUnread: () => Promise<void>;
}

const MessagesContext = createContext<MessagesState>({ unreadCount: 0, refreshUnread: async () => undefined });

/** Keeps the red unread badge up to date, live. */
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const list = await fetchConversations();
      setUnreadCount(list.filter((c) => isUnread(c, userId)).length);
    } catch {
      /* keep the last known number */
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const first = setTimeout(refreshUnread, 0);
    const stop = subscribeToConversations(refreshUnread);
    const appState = AppState.addEventListener('change', (s) => s === 'active' && refreshUnread());
    return () => {
      clearTimeout(first);
      stop();
      appState.remove();
    };
  }, [userId, refreshUnread]);

  const value = useMemo(() => ({ unreadCount: userId ? unreadCount : 0, refreshUnread }), [unreadCount, refreshUnread, userId]);
  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export const useMessages = () => useContext(MessagesContext);
