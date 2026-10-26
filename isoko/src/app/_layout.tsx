import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MessagesProvider } from '@/context/MessagesContext';
import { LanguageProvider } from '@/i18n';
import { colors } from '@/theme';

// Keep the native splash (logo on dark green) until fonts and language are ready.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

function RootNavigator() {
  const { session, isGuest, isOwner } = useAuth();
  const hasAccess = !!session || isGuest;

  // Everything is ready once this renders: hide the splash.
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
      {/* Animated intro, decides where to go next */}
      <Stack.Screen name="index" options={{ animation: 'fade' }} />

      {/* First screen: Buyer & Renter / Owner / Guest */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="welcome" options={{ animation: 'fade', contentStyle: { backgroundColor: colors.brandNight } }} />
      </Stack.Protected>

      {/* Sign up and log in are always reachable (guests can upgrade any time) */}
      <Stack.Screen name="auth/sign-up" options={{ contentStyle: { backgroundColor: colors.brandNight } }} />
      <Stack.Screen name="auth/log-in" options={{ contentStyle: { backgroundColor: colors.brandNight } }} />
      <Stack.Screen name="auth/forgot-password" options={{ presentation: 'modal' }} />

      {/* The app itself: open for members and guests */}
      <Stack.Protected guard={hasAccess}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="listing/[id]" />
        <Stack.Screen name="search" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="about" />
      </Stack.Protected>

      {/* Only with an account */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="messages/index" />
        <Stack.Screen name="messages/[id]" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="profile/edit" />
      </Stack.Protected>

      {/* Owner and broker tools */}
      <Stack.Protected guard={isOwner}>
        <Stack.Screen name="owner/listings" />
        <Stack.Screen name="premium" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <MessagesProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </MessagesProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
