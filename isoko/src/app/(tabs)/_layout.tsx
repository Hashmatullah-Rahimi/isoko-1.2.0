import { Tabs } from 'expo-router';
import React from 'react';
import { AnimatedTabBar } from '@/components/layout/AnimatedTabBar';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

/**
 * Bottom tabs.
 * Owners see:              Home · Houses · [ + Post ] · Cars · Profile
 * Buyers/Renters & guests: Home · Houses · Cars · Saved · Profile
 */
export default function TabsLayout() {
  const { isOwner } = useAuth();

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="houses" options={{ title: 'Houses' }} />
      <Tabs.Screen name="post" options={{ title: 'Post', href: isOwner ? undefined : null }} />
      <Tabs.Screen name="cars" options={{ title: 'Cars' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', href: isOwner ? null : undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
