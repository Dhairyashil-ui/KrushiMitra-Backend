import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import '../i18n'; // Initialize i18n
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n.js';
import { LanguageProvider } from '@/src/context/LanguageContext';

export default function RootLayout() {
  const isReady = useFrameworkReady();

  // Show loading screen while framework is initializing
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" />
          <Stack.Screen name="intro1" />
          <Stack.Screen name="intro2" />
          <Stack.Screen name="intro3" />
          <Stack.Screen name="language" />
          <Stack.Screen name="language-selection" />
          <Stack.Screen name="location" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/otp" />
          <Stack.Screen name="ai-chat" />
          <Stack.Screen name="crop-disease" />
          <Stack.Screen name="activity-tracking" />
          <Stack.Screen name="test-ai-storage" />
          <Stack.Screen name="scheme" />
          <Stack.Screen name="mandi-prices" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </LanguageProvider>
    </I18nextProvider>
  );
}