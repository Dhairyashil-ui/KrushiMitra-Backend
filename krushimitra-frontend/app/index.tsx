import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PageTransition from '@/components/PageTransition';
import { replaceWithTransition } from '@/src/utils/navigation';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// API base URL - should match the one used in ai-chat.tsx
// API Configuration - LAN IP for mobile device connectivity
// For mobile devices, use your computer's LAN IP instead of localhost
// Unified backend base URL now points to port 3001.
// Prefer EXPO_PUBLIC_BACKEND_URL; fallback to localhost:3001.
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
console.log('Index API_BASE_URL configured as:', API_BASE_URL);

export default function IndexScreen() {
  const [isReady, setIsReady] = useState(false);
  const [nextRoute, setNextRoute] = useState('/splash');
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const [transitioning, setTransitioning] = useState(false);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Fade in animation for loading indicator
    Animated.timing(fadeAnimation, {
      toValue: 1,
      
      duration: 300,
      useNativeDriver: true,
    }).start();
    const determineRoute = async () => {
      try {
        const entries = await AsyncStorage.multiGet(['userData', 'authToken']);
        const hasUser = entries.find(([key]) => key === 'userData')?.[1];
        const hasToken = entries.find(([key]) => key === 'authToken')?.[1];
        const target = hasUser && hasToken ? '/splash?autologin=true' : '/splash';
        setNextRoute(target);
      } catch (error) {
        console.warn('Failed to determine initial route, defaulting to onboarding flow:', error);
        setNextRoute('/splash');
      } finally {
        setIsReady(true);
      }
    };

    determineRoute();
  }, []);

  useEffect(() => {
    // On first mount, try to fetch and play Hindi TTS once
    const playWelcome = async () => {
      if (hasPlayedRef.current) return;
      try {
        hasPlayedRef.current = true;
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
        // Use 11labs TTS from backend (only Niraj Hindi voice)
        const ttsUrl = `${API_BASE_URL}/tts?lang=hi&text=${encodeURIComponent('')}`;
        
        // Fetch audio with ngrok-skip-browser-warning header to bypass ngrok interstitial page
        const response = await fetch(ttsUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'KrushiMitra-App'
          }
        });
        
        if (response.ok) {
          // Convert response to blob, then to data URL for playback
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const audioUri = reader.result as string;
            const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
            // Optionally unload after playback finishes
            sound.setOnPlaybackStatusUpdate((status) => {
              if ('didJustFinish' in status && status.didJustFinish) {
                sound.unloadAsync();
              }
            });
          };
          
          reader.readAsDataURL(blob);
        }
      } catch (e) {
        // Ignore failures to avoid blocking navigation
      }
    };
    playWelcome();
  }, []);

  useEffect(() => {
    if (isReady) {
      // Trigger transition before navigation
      setTransitioning(true);
    }
  }, [isReady]);

  useEffect(() => {
    if (transitioning) {
      replaceWithTransition(nextRoute);
    }
  }, [transitioning, nextRoute]);

  // Show loading indicator while waiting
  return (
    <PageTransition isActive={!transitioning} type="fade">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ opacity: fadeAnimation }}>
          <ActivityIndicator size="large" />
        </Animated.View>
      </View>
    </PageTransition>
  );
}