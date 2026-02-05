import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Modal, Animated, Alert, Platform, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import {
  Bot,
  Activity,
  Calendar,
  Bell,
  Camera,
  Cloud,
  Sparkles,
  MessageCircle,
  X,
  Menu,
  TrendingUp,
  Newspaper,
  IndianRupee,
  Users,
  MapPin,
  Thermometer,
  Mic,
  MicOff,
  Leaf,
  Pause,
  Play
} from 'lucide-react-native';
import { queryOllama, queryOllamaStream } from '@/src/utils/ollama';
import { queryLLMStream } from '@/src/services/llm';
import { saveAIInteraction } from '@/src/utils/api'; // Correct import path
import { voiceInputService, recordAndTranscribeVoice, testWhisperConnection } from '@/src/services/voiceInputService';
import { serverManager, getServerConfig } from '@/src/services/serverManager';
import NetInfo from '@react-native-community/netinfo';
import { realtimeUpdates } from '@/src/utils/realtimeUpdates';

const normalizeUserId = (value: any): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    if (typeof value.$oid === 'string') {
      return value.$oid;
    }
    if (typeof value.id === 'string') {
      return value.id;
    }
    if (typeof value.toHexString === 'function') {
      return value.toHexString();
    }
    if (typeof value.toString === 'function') {
      const candidate = value.toString();
      if (candidate && candidate !== '[object Object]') {
        return candidate;
      }
    }
  }
  return null;
};

// Add a simple rate limiting mechanism
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [userData, setUserData] = useState<any>(null);
  const [weather, setWeather] = useState('🌤️ Partly cloudy, 28°C');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weeklyForecast, setWeeklyForecast] = useState<any[]>([]);
  const [reminder, setReminder] = useState('🌧️ Rain expected tomorrow, avoid spraying pesticides');
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string>('Getting location...');
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
  const [aiAdvisory, setAiAdvisory] = useState<string>('Loading farming advisory...');
  const [isLoadingAdvisory, setIsLoadingAdvisory] = useState<boolean>(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [glowAnimation] = useState(new Animated.Value(0));
  const [rotateAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [orbitalAnimation] = useState(new Animated.Value(0));
  const [weatherAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: string, parts: string }[]>([]);
  const [audioLevel] = useState(new Animated.Value(1)); // For audio visualization
  const [lastRequestTimes, setLastRequestTimes] = useState<number[]>([]); // For rate limiting
  const [rateLimitStatus, setRateLimitStatus] = useState({
    remainingRequests: MAX_REQUESTS_PER_WINDOW,
    resetTime: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [whisperReady, setWhisperReady] = useState(false);
  const [voiceInputMode, setVoiceInputMode] = useState<'browser' | 'whisper'>('whisper');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  let debounceTimeout: any; // Change from NodeJS.Timeout | undefined to any

  const displayName = useMemo(() => {
    const nameCandidates = [
      userData?.name,
      userData?.profile?.name,
      (userData?.email && userData.email.split('@')[0]) || null
    ];

    const picked = nameCandidates.find(value => typeof value === 'string' && value.trim().length > 0);
    if (!picked) {
      return t('greetings.farmer');
    }

    return picked
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [userData, t]);

  const router = useRouter();
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const errorRestartTimeoutRef = useRef<number | null>(null);
  const networkDebounceTimer = useRef<any>(null);
  const lastNetworkState = useRef<string | null>(null);
  const stableConnectionTimer = useRef<any>(null);
  const isNetworkStable = useRef<boolean>(false);
  const offlineStart = useRef<number | null>(null);
  const modalWelcomeTtsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSpeakingRef = useRef(isSpeaking);
  const isProcessingRef = useRef(isProcessing);
  const latestLocationRef = useRef<any>(null);
  const latestWeatherRef = useRef<any>(null);

  // Judge Demo: Triple Tap Tracking
  const tapTimestamps = useRef<number[]>([]);

  const buildProfilePayload = useCallback(() => {
    if (!userData) {
      return null;
    }
    const fallbackName = userData?.email ? userData.email.split('@')[0] : 'KrushiMitra Farmer';
    return {
      name: userData?.name || userData?.profile?.name || fallbackName,
      email: userData?.email || null,
      phone: userData?.phone || userData?.profile?.phone || null,
      language: userData?.preferredLanguage || userData?.profile?.language || null
    };
  }, [userData]);

  const syncUserContextHome = useCallback(
    async ({ location, weather }: { location?: any; weather?: any } = {}) => {
      if (!sessionUserId) {
        return;
      }

      const profile = buildProfilePayload();
      const payload: Record<string, any> = {
        userId: sessionUserId,
        ...(profile ? { profile } : {})
      };
      if (location) {
        payload.location = location;
      }
      if (weather) {
        payload.weather = weather;
      }

      if (!payload.location && !payload.weather && !payload.profile) {
        return;
      }

      try {
        await serverManager.initialize();
        const { backendUrl } = getServerConfig();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
        }

        const response = await fetch(`${backendUrl}/user-context/home`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const message = await response.text();
          console.warn('UserContext sync failed', response.status, message);
        }
      } catch (error) {
        console.warn('UserContext sync error', error);
      }
    },
    [sessionUserId, sessionToken, buildProfilePayload]
  );

  const fetchUserContextSnapshot = useCallback(async () => {
    if (!sessionUserId) {
      return null;
    }
    try {
      await serverManager.initialize();
      const { backendUrl } = getServerConfig();
      const headers: Record<string, string> = {};
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }
      const response = await fetch(`${backendUrl}/user-context/${sessionUserId}`, { headers });
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data || payload?.userContext || null;
    } catch (error) {
      console.warn('Failed to fetch user context snapshot:', error);
      return null;
    }
  }, [sessionUserId, sessionToken]);

  // Network change listener - debounced with 5s delay & offline tracking
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // Normalize unstable network states (React Native Web fix)
      let networkType = state.type;
      if (networkType === 'other' || networkType === 'unknown') {
        networkType = 'wifi' as any; // Treat as wifi without triggering reconnection
      }

      const currentState = `${networkType}:${state.isConnected}`;
      // Minimal log only on actual change
      if (currentState !== lastNetworkState.current) {
        console.log('🌐 Net state ->', currentState);
      }

      // Ignore if state hasn't actually changed
      if (currentState === lastNetworkState.current) {
        return;
      }

      // Clear previous debounce timer
      if (networkDebounceTimer.current) {
        clearTimeout(networkDebounceTimer.current);
      }

      // Reset network stability flag
      isNetworkStable.current = false;
      if (stableConnectionTimer.current) {
        clearTimeout(stableConnectionTimer.current);
      }

      // Track offline start
      if (state.isConnected === false && offlineStart.current === null) {
        offlineStart.current = Date.now();
        realtimeUpdates.setNetworkFlapping(true);
      }
      if (state.isConnected === true) {
        // Determine offline duration
        const wasOfflineFor = offlineStart.current ? Date.now() - offlineStart.current : 0;
        offlineStart.current = null;
        realtimeUpdates.setNetworkFlapping(false);
        // If offline > 10s allow forced refresh later
      }

      // Debounce network changes - only fire after 5 seconds of stability
      networkDebounceTimer.current = setTimeout(() => {
        lastNetworkState.current = currentState;

        // Only refresh if we're actually connected
        if (state.isConnected === true) {
          // Decide if we need refresh: only if previously offline >10s
          const shouldForceRefresh = offlineStart.current === null && !serverManager.getBackendEndpoint();
          serverManager.refresh(shouldForceRefresh, shouldForceRefresh ? 'offline-recovery' : 'stabilized');

          // Mark network as stable after 2 seconds
          stableConnectionTimer.current = setTimeout(() => {
            isNetworkStable.current = true;
            console.log('✅ Network connection stable');
            // Trigger realtime reconnect if needed
            if (!realtimeUpdates.getConnectionStatus()) {
              realtimeUpdates.reconnect();
            }
          }, 2000);
        }
      }, 5000);
    });

    return () => {
      unsubscribe();
      if (networkDebounceTimer.current) {
        clearTimeout(networkDebounceTimer.current);
      }
      if (stableConnectionTimer.current) {
        clearTimeout(stableConnectionTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Initialize server manager on mount
  useEffect(() => {
    serverManager.initialize().then(() => {
      const config = serverManager.getConfig();
      console.log('📡 Server configuration:', config);
    }).catch(error => {
      console.error('Failed to initialize servers:', error);
    });
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      return;
    }
    syncUserContextHome({
      location: latestLocationRef.current || undefined,
      weather: latestWeatherRef.current || undefined
    });
  }, [sessionUserId, syncUserContextHome]);

  // No Gemini initialization needed when using hybrid cloud/local LLM

  // Initialize speech recognition
  useEffect(() => {
    // Check if platform supports speech recognition (Web Speech API)
    const isWeb = Platform.OS === 'web';

    if (isWeb) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        console.log('✅ Initializing Web Speech Recognition...');
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        // Attach ALL event handlers HERE - this ensures they work on mobile browsers too

        recognition.onresult = (event: any) => {
          console.log('🎤 onresult triggered:', {
            resultsLength: event.results?.length,
            isFinal: event.results?.[0]?.isFinal,
            transcript: event.results?.[0]?.[0]?.transcript,
            confidence: event.results?.[0]?.[0]?.confidence
          });

          // SEQUENTIAL VOICE PROCESSING: Only accept input when completely ready
          // STOP listening immediately when system is busy to prevent audio capture
          if (isSpeaking || isProcessing) {
            console.log('Voice input ignored - system busy (speaking or processing complete response cycle)');
            stopListening(); // Ensure recognition is stopped
            return;
          }

          debounceTimeout = setTimeout(() => {
            const alt = event.results[0][0];
            const transcript = alt?.transcript ?? '';
            const confidence = typeof alt?.confidence === 'number' ? alt.confidence : undefined;

            console.log('🔍 Processing result:', { transcript, confidence, isFinal: event.results[0].isFinal });

            // ONLY process final results with good recognition
            if (event.results[0].isFinal) {
              setIsListening(false);

              // Enhanced speech recognition validation
              if (isValidSpeechInput(transcript, confidence)) {
                console.log('✅ Valid speech recognized:', { transcript, confidence });
                handleVoiceInput(transcript, confidence);
              } else {
                console.log('❌ Invalid speech ignored:', { transcript, confidence });
                // Auto-restart listening for next valid input
                setTimeout(() => {
                  if (!isSpeaking && !isProcessing) {
                    startListening();
                  }
                }, 1000);
              }
            } else {
              console.log('⏳ Interim result (not final), waiting...');
            }
          }, 500);
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', {
            error: event.error,
            message: event.message,
            timestamp: new Date().toISOString()
          });
          setIsListening(false);

          // Attempt a gentle auto-retry on transient errors ONLY when system is not busy
          if (event?.error === 'network' || event?.error === 'no-speech' || event?.error === 'audio-capture') {
            console.log('⚠️ Transient error, will retry in 1.5s');
            if (errorRestartTimeoutRef.current) {
              clearTimeout(errorRestartTimeoutRef.current);
            }
            errorRestartTimeoutRef.current = setTimeout(() => {
              if (Platform.OS === 'web' && !isSpeaking && !isProcessing) {
                console.log('🔄 Auto-retrying after transient error...');
                startListening();
              }
            }, 1500) as unknown as number;
          } else {
            console.error('🚫 Non-transient error, showing alert');
            Alert.alert('Speech Recognition Error', `Error: ${event.error}. Please try again.`);
          }
        };

        recognition.onend = () => {
          console.log('🛑 Recognition ended');
          setIsListening(false);
        };

        recognition.onstart = () => {
          console.log('🎧 Recognition started - listening for speech...');
          setIsListening(true);
        };

        recognition.onaudiostart = () => {
          console.log('🔊 Audio capture started - microphone is active');
        };

        recognition.onaudioend = () => {
          console.log('🔇 Audio capture ended');
        };

        recognition.onsoundstart = () => {
          console.log('📢 Sound detected by microphone');
        };

        recognition.onsoundend = () => {
          console.log('🔕 Sound stopped');
        };

        recognition.onspeechstart = () => {
          console.log('🗣️ Speech detected!');
        };

        recognition.onspeechend = () => {
          console.log('🤐 Speech ended');
        };

        // NOW assign to ref after all handlers are attached
        recognitionRef.current = recognition;
        console.log('✅ Speech recognition initialized with all event handlers');
      } else {
        console.warn('❌ Speech recognition not supported in this browser');
      }
    } else {
      console.warn('Speech recognition only available on web platform');
    }

    // Load user data and weather
    loadUserData();
    loadWeather();

    // Test Whisper STT connection
    testWhisperConnection().then(ready => {
      setWhisperReady(ready);
      if (ready) {
        console.log('✅ Whisper STT ready - voice input will use Whisper');
        setVoiceInputMode('whisper');
      } else {
        console.log('⚠️ Whisper STT not available - falling back to browser STT');
        setVoiceInputMode('browser');
      }
    }).catch(error => {
      console.error('❌ Whisper connection test failed:', error);
      setVoiceInputMode('browser');
    });

    // Enhanced futuristic animations
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
        }),
      ])
    );

    const orbitalLoop = Animated.loop(
      Animated.timing(orbitalAnimation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );

    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Weather card animation
    const weatherLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(weatherAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(weatherAnimation, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();
    orbitalLoop.start();
    scaleLoop.start();
    weatherLoop.start();
    pulseLoop.start();

    // Start listening when component mounts
    // Commented out to prevent automatic voice assistant activation
    // setTimeout(() => {
    //   if (Platform.OS === 'web') {
    //     startListening();
    //   }
    // }, 3000);

    return () => {
      glowLoop.stop();
      orbitalLoop.stop();
      scaleLoop.stop();
      weatherLoop.stop();
      pulseLoop.stop();

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (errorRestartTimeoutRef.current) {
        clearTimeout(errorRestartTimeoutRef.current);
        errorRestartTimeoutRef.current = null;
      }

      // Clean up speaking animation
      stopSpeakingAnimation();

      // Clean up speaking animation resources
      if ((audioLevel as any)._speakingAnimation) {
        (audioLevel as any)._speakingAnimation.stop();
      }

      if (modalWelcomeTtsTimer.current) {
        clearTimeout(modalWelcomeTtsTimer.current);
        modalWelcomeTtsTimer.current = null;
      }
    };
  }, []);

  // Reload weather when location changes
  useEffect(() => {
    if (userLocation) {
      loadWeather();
    }
  }, [userLocation]);

  const loadUserData = async () => {
    try {
      const [data, tokenValue] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('authToken')
      ]);

      if (data) {
        const parsed = JSON.parse(data);
        setUserData(parsed);
        const derivedId = normalizeUserId(parsed?.id) || normalizeUserId(parsed?._id) || normalizeUserId(parsed?.userId);
        setSessionUserId(derivedId);
      } else {
        setSessionUserId(null);
      }

      setSessionToken(tokenValue);

      // Check and request location permission
      await checkAndRequestLocation();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkAndRequestLocation = async () => {
    try {
      // Always ask for fresh location - no caching
      setUserAddress('Requesting location permission...');

      // Request permission - this will trigger browser's native permission dialog
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ Location permission granted');
        await getCurrentLocation();
      } else {
        console.log('❌ Location permission denied:', status);
        setHasLocationPermission(false);
        setUserAddress('Location permission denied - Please enable in browser settings');

        // Show alert for user guidance
        Alert.alert(
          'Location Required',
          'Please allow location access in your browser to get accurate weather and farming advice for your area. Click the location icon in the address bar.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setHasLocationPermission(false);
      setUserAddress('Location permission error');

      Alert.alert(
        'Location Error',
        'Unable to request location permission. Please check your browser settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const getCurrentLocation = async () => {
    try {
      setUserAddress('Getting precise location...');

      // Get current position with highest accuracy for home-level precision
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest // Changed from Balanced to Highest for better precision
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      console.log(`📍 GPS Location: ${lat}, ${lon} (±${accuracy}m)`);

      setUserLocation({ lat, lon });
      setHasLocationPermission(true);

      // Save location
      await AsyncStorage.setItem('userLocation', JSON.stringify({ lat, lon }));

      // Get address using Google Geocoding API
      await getAddressFromCoordinates(lat, lon, accuracy);

    } catch (error) {
      console.error('Error getting current location:', error);
      setUserAddress('Unable to get location');
      setHasLocationPermission(false);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lon: number, accuracy?: number) => {
    try {
      const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

      if (!googleApiKey) {
        console.warn('Google API key not configured');
        setUserAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        return;
      }

      // Use Google Geocoding API for accurate address with result_type for better precision
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&result_type=street_address|premise|subpremise&key=${googleApiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        // Try to get the most specific result first (premise/street_address)
        let result = data.results[0];

        // If first result doesn't have enough detail, try next results
        for (const res of data.results) {
          if (res.types.includes('street_address') || res.types.includes('premise')) {
            result = res;
            break;
          }
        }

        // Extract very detailed address components
        let streetNumber = ''; // House/Building number
        let route = ''; // Street/Road name
        let premise = ''; // Building/House name
        let subpremise = ''; // Flat/Unit number
        let neighborhood = ''; // Neighborhood
        let sublocality1 = ''; // Primary sublocality
        let sublocality2 = ''; // Secondary sublocality
        let locality = ''; // City/Town
        let taluka = ''; // Taluka (administrative_area_level_3)
        let district = ''; // District (administrative_area_level_2)
        let state = ''; // State
        let postalCode = '';

        for (const component of result.address_components) {
          const types = component.types;

          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('premise')) {
            premise = component.long_name;
          }
          if (types.includes('subpremise')) {
            subpremise = component.long_name;
          }
          if (types.includes('neighborhood')) {
            neighborhood = component.long_name;
          }
          if (types.includes('sublocality_level_1')) {
            sublocality1 = component.long_name;
          }
          if (types.includes('sublocality_level_2')) {
            sublocality2 = component.long_name;
          }
          if (types.includes('sublocality') && !sublocality1) {
            sublocality1 = component.long_name;
          }
          if (types.includes('locality')) {
            locality = component.long_name;
          }
          if (types.includes('administrative_area_level_3')) {
            taluka = component.long_name;
          }
          if (types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        }

        // Build short, concise address (3-4 components only)
        let formattedAddress = '';

        // Priority 1: Building/House name or street number + route
        if (premise) {
          formattedAddress = premise;
        } else if (streetNumber && route) {
          formattedAddress = `${streetNumber} ${route}`;
        } else if (route) {
          formattedAddress = route;
        }

        // Priority 2: Add primary area (sublocality)
        if (sublocality1) {
          formattedAddress += (formattedAddress ? ', ' : '') + sublocality1;
        } else if (neighborhood) {
          formattedAddress += (formattedAddress ? ', ' : '') + neighborhood;
        }

        // Priority 3: Add city
        if (locality && locality !== sublocality1) {
          formattedAddress += (formattedAddress ? ', ' : '') + locality;
        }

        // Priority 4: Add postal code
        if (postalCode) {
          formattedAddress += ' - ' + postalCode;
        }

        // Fallback to Google's formatted address if nothing found
        if (!formattedAddress && result.formatted_address) {
          formattedAddress = result.formatted_address;
        }

        setUserAddress(formattedAddress || 'Location found');
        await AsyncStorage.setItem('userAddress', formattedAddress);

        console.log('📍 Detailed address retrieved:', formattedAddress);

        try {
          const cachedUser = await AsyncStorage.getItem('userData');
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            const nextProfile = {
              ...(parsedUser.profile || {}),
              location: formattedAddress,
              address: formattedAddress
            };
            const updatedUser = { ...parsedUser, profile: nextProfile };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
            setUserData(updatedUser);
          }
        } catch (syncError) {
          console.warn('Failed to sync address with stored profile', syncError);
        }

        const locationPayload = {
          address: formattedAddress,
          latitude: lat,
          longitude: lon,
          precision: accuracy || null,
          raw: {
            placeId: result.place_id,
            types: result.types,
            source: 'google-geocode'
          }
        };

        latestLocationRef.current = locationPayload;
        await syncUserContextHome({ location: locationPayload });

      } else {
        console.warn('Geocoding API error:', data.status);
        const fallbackAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setUserAddress(fallbackAddress);
        const locationPayload = {
          address: fallbackAddress,
          latitude: lat,
          longitude: lon,
          precision: accuracy || null,
          raw: { source: 'geocode-error', status: data.status }
        };
        latestLocationRef.current = locationPayload;
        await syncUserContextHome({ location: locationPayload });
      }
    } catch (error) {
      console.error('Error getting address:', error);
      const fallbackAddress = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      setUserAddress(fallbackAddress);
      const locationPayload = {
        address: fallbackAddress,
        latitude: lat,
        longitude: lon,
        precision: accuracy || null,
        raw: { source: 'geocode-exception', message: (error as Error)?.message }
      };
      latestLocationRef.current = locationPayload;
      await syncUserContextHome({ location: locationPayload });
    }
  };


  const loadWeather = async () => {
    try {
      // Use real GPS location if available, otherwise fallback to Pune
      let lat = 18.5919;
      let lon = 73.7389;

      if (userLocation) {
        lat = userLocation.lat;
        lon = userLocation.lon;
      } else {
        // Try to get from AsyncStorage
        const storedLocation = await AsyncStorage.getItem('userLocation');
        if (storedLocation) {
          const loc = JSON.parse(storedLocation);
          lat = loc.lat;
          lon = loc.lon;
        }
      }

      // Use serverManager to get backend URL (works on both desktop and mobile)
      await serverManager.initialize();
      const backendUrl = serverManager.getBackendEndpoint() || 'http://localhost:3001';

      const weatherUrl = `${backendUrl}/weather?lat=${lat}&lon=${lon}`;
      console.log('Fetching weather from:', weatherUrl);

      const response = await fetch(weatherUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'KrushiMitra-App'
        }
      });

      if (!response.ok) {
        throw new Error(`Weather API request failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const { temperature, condition, forecast } = result.data;
        setWeather(`${getWeatherIcon(condition)} ${condition}, ${temperature}°C`);
        // Store full weather data in state for UI display
        setWeatherData(result.data);

        const weatherPayload = {
          temperature: result.data.temperature ?? null,
          humidity: result.data.humidity ?? null,
          condition: result.data.condition || null,
          windSpeed: result.data.windSpeed ?? null,
          precipitationProbability: result.data.precipitationProbability ?? null,
          source: 'home-screen'
        };
        latestWeatherRef.current = weatherPayload;
        await syncUserContextHome({ weather: weatherPayload });

        // Store 7-day forecast
        if (forecast && forecast.length > 0) {
          setWeeklyForecast(forecast);
        }

        // Generate AI farming advisory based on weather data
        await generateFarmingAdvisory(result.data, userAddress);
      } else {
        throw new Error('Invalid weather data');
      }
    } catch (error) {
      console.error('Error loading weather:', error);
      setWeather('Weather unavailable right now');
      setWeatherData(null);
    }
  };

  const generateFarmingAdvisory = async (weatherData: any, location: string) => {
    if (isLoadingAdvisory) return;

    try {
      setIsLoadingAdvisory(true);

      // Create a concise prompt for the LLM without truncating the response
      const prompt = `Weather: ${weatherData.temperature}°C, ${weatherData.humidity}% humidity, ${weatherData.precipitationProbability}% rain, ${weatherData.windSpeed}km/h wind, ${weatherData.condition}. Location: ${location}

    Give one short farming advisory (1-2 sentences) that is specific and actionable.`;

      // Try to use LLM (Ollama or cloud LLM)
      let advisory = '';

      try {
        // Try local Ollama first (non-streaming for simplicity)
        const response = await queryOllama(prompt);
        advisory = response.trim();
      } catch (ollamaError) {
        console.log('Ollama not available, trying cloud LLM...');

        // Fallback to cloud LLM (streaming)
        try {
          let streamedResponse = '';
          for await (const chunk of queryLLMStream(prompt)) {
            streamedResponse += chunk;
          }
          advisory = streamedResponse.trim();
        } catch (cloudError) {
          console.log('Cloud LLM not available, using basic advisory');
          // Use the basic advisory from the backend as fallback
          advisory = weatherData.advisory || 'Check weather conditions before planning fieldwork.';
        }
      }

      setAiAdvisory(advisory || weatherData.advisory || 'Plan your farming activities based on current weather.');

    } catch (error) {
      console.error('Error generating farming advisory:', error);
      // Fallback to backend advisory
      setAiAdvisory(weatherData.advisory || 'Favorable conditions for farming activities. Plan your fieldwork accordingly.');
    } finally {
      setIsLoadingAdvisory(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const iconMap: { [key: string]: string } = {
      'Clear': '☀️',
      'Cloudy': '☁️',
      'Mostly Clear': '🌤️',
      'Partly Cloudy': '⛅',
      'Mostly Cloudy': '☁️',
      'Fog': '🌫️',
      'Light Fog': '🌫️',
      'Rain': '🌧️',
      'Light Rain': '🌦️',
      'Heavy Rain': '⛈️',
      'Drizzle': '🌦️',
      'Snow': '🌨️',
      'Thunderstorm': '⛈️',
      'Wind': '🌪️',
      'Strong Wind': '🌪️'
    };
    return iconMap[condition] || '🌤️';
  };

  const navigateToAIChat = () => {
    setShowAIModal(true);
  };

  const hideAIModal = () => {
    if (modalWelcomeTtsTimer.current) {
      clearTimeout(modalWelcomeTtsTimer.current);
      modalWelcomeTtsTimer.current = null;
    }
    setShowAIModal(false);
  };

  const startAIConversation = () => {
    hideAIModal();
    router.push('/ai-chat');
  };

  const navigateToActivityTracking = () => {
    router.push('/activity-tracking');
  };

  const navigateToSchemes = () => {
    router.push('/scheme');
  };

  const navigateToMandiPrices = () => {
    router.push('/mandi-prices');
  };

  const navigateToCropDisease = () => {
    router.push('/crop-disease');
  };

  const navigateToNews = () => {
    router.push('/farming-news');
  };

  const navigateToCarboSafe = () => {
    router.push('/carbosafe');
  };

  const openDrawerMenu = () => {
    // Open drawer menu
    console.log('Open Drawer Menu');
  };

  const openNotifications = () => {
    // Open notifications
    console.log('Open Notifications');
  };

  // Ensure microphone permission is granted before speech recognition
  const ensureMicPermission = async (): Promise<boolean> => {
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Microphone permission granted');
      return true;
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      return false;
    }
  };

  const startListening = () => {
    // Check which voice input mode to use
    if (voiceInputMode === 'whisper' && whisperReady) {
      startWhisperListening();
      return;
    }

    // Fallback to browser speech recognition
    startBrowserListening();
  };

  const startWhisperListening = async () => {
    if (isSpeaking || isProcessing) {
      console.warn('Voice capture disabled - system busy (complete response cycle in progress)');
      return;
    }

    try {
      setIsListening(true);
      console.log('🎤 Starting Whisper voice input...');

      // Record and transcribe using Whisper STT
      const result = await recordAndTranscribeVoice({
        language: 'hi', // Hindi language
        duration: 5, // 5 seconds recording
      });

      setIsListening(false);

      if (result.success && result.transcription) {
        const transcript = result.transcription.trim();
        console.log('✅ Whisper transcription:', transcript);

        // Validate and process the transcription
        if (isValidSpeechInput(transcript, result.confidence)) {
          handleVoiceInput(transcript, result.confidence);
        } else {
          console.log('Invalid Whisper transcription ignored:', transcript);
          // Auto-restart for next input
          setTimeout(() => {
            if (!isSpeaking && !isProcessing) {
              startListening();
            }
          }, 1000);
        }
      } else {
        console.error('❌ Whisper transcription failed:', result.error);
        // Auto-restart for next input
        setTimeout(() => {
          if (!isSpeaking && !isProcessing) {
            startListening();
          }
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Whisper voice input error:', error);
      setIsListening(false);
      Alert.alert('Voice Input Error', 'Could not process voice input. Please try again.');
    }
  };

  const startBrowserListening = async () => {
    console.log('🎤 startBrowserListening called:', {
      hasRecognitionRef: !!recognitionRef.current,
      isSpeaking,
      isProcessing,
      platform: Platform.OS
    });

    // Ensure speech recognition is completely stopped before starting new session
    if (recognitionRef.current?.abort) {
      recognitionRef.current.abort();
    }

    if (isSpeaking || isProcessing) {
      console.warn('Voice capture disabled - system busy (complete response cycle in progress)');
      return;
    }

    // Check for Web Speech API support (works on mobile browsers too!)
    const hasWebSpeech = typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

    if (!hasWebSpeech) {
      console.warn('Web Speech API not available in this browser');
      Alert.alert(
        'Feature Not Available',
        'Voice recognition requires a browser with Web Speech API support. Try Chrome, Edge, or Safari on your device.'
      );
      return;
    }

    if (!recognitionRef.current) {
      console.error('❌ Recognition not initialized');
      Alert.alert('Error', 'Voice recognition not ready. Please refresh the page.');
      return;
    }

    // Explicitly request microphone permission first
    const hasPermission = await ensureMicPermission();
    if (!hasPermission) {
      console.error('❌ Microphone permission blocked');
      Alert.alert(
        'Microphone Access Needed',
        'Please allow microphone access to use voice features. Check your browser settings.'
      );
      return;
    }

    try {
      console.log('▶️ Starting speech recognition...');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      Alert.alert(
        'Error',
        'Could not start voice recognition. Please try again.'
      );
    }
  };

  // Enhanced speech recognition validation - only pass valid speech to LLM
  // SEQUENTIAL PROCESSING FLOW:
  // 1. Voice Input → Validation → LLM Processing (isProcessing=true)
  // 2. LLM Response → TTS Playback (isSpeaking=true, isProcessing=true) 
  // 3. TTS Complete → Reset flags → Auto-restart listening
  // NO voice input accepted during steps 1-3
  const isValidSpeechInput = (text: string, confidence?: number): boolean => {
    if (!text || !text.trim()) {
      console.log('Empty speech input');
      return false;
    }

    // Remove punctuation and normalize
    const normalized = text.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    // Length validation
    if (normalized.length < 2) {
      console.log('Speech too short:', normalized);
      return false;
    }

    // Pattern validation
    const repeatedChar = /(..)\1{2,}/.test(normalized); // e.g., "aaaa", "haha"
    const vowelsOnly = /^[aeiou\s]+$/i.test(normalized); // likely hums
    const noAlpha = !/[a-zA-Z]/.test(normalized); // no actual words

    if (repeatedChar || vowelsOnly || noAlpha) {
      console.log('Invalid speech pattern:', { normalized, repeatedChar, vowelsOnly, noAlpha });
      return false;
    }

    // Confidence validation (if provided)
    if (typeof confidence === 'number' && confidence > 0 && confidence < 0.5) {
      console.log('Low confidence speech:', { text: normalized, confidence });
      return false;
    }

    // Common noise words/sounds to ignore
    const noisePatterns = [
      /^(uh|um|ah|hmm|er|eh)$/i,
      /^(la|na|da|ba|wa)$/i,
      /^[aeiou]{1,3}$/i
    ];

    for (const pattern of noisePatterns) {
      if (pattern.test(normalized)) {
        console.log('Noise pattern detected:', normalized);
        return false;
      }
    }

    console.log('Valid speech input validated:', { text: normalized, confidence });
    return true;
  };

  const stopListening = () => {
    if (Platform.OS === 'web' && recognitionRef.current) {
      // Use abort for immediate stop, fallback to stop
      if (recognitionRef.current.abort) {
        recognitionRef.current.abort();
      } else {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    }
  };

  const speakWelcomeMessage = useCallback(async () => {
    // Check if we have user data and weather data
    if (!userData || !weatherData) {
      return;
    }

    try {
      setHasSpokenWelcome(true);

      // Extract user name
      const userName = userData?.name || userData?.profile?.name || 'किसान भाई';

      // Extract city name from address
      let cityName = 'आपके क्षेत्र';
      if (userAddress && userAddress !== 'Getting location...' && userAddress !== 'Location permission denied' && userAddress !== 'Requesting location permission...') {
        // Try to extract city from address (usually second part after comma)
        const parts = userAddress.split(',');
        if (parts.length >= 2) {
          cityName = parts[1].trim();
        } else if (parts.length === 1) {
          cityName = parts[0].trim();
        }
      }

      // Extract temperature
      const temperature = weatherData?.temperature || '28';

      // Build personalized welcome message
      const welcomeMessage = `नमस्कार ${userName}, कैसे हो? KrushiMitra में आपका हार्दिक स्वागत है। आपके शहर ${cityName} में इस वक़्त तापमान ${temperature}°C है। चलिए, आज का दिन बेहतर बनाते हैं!`;

      console.log('🎙️ Speaking welcome message:', welcomeMessage);

      // Speak the welcome message (without auto-restart listening)
      await speakResponse(welcomeMessage, false);

    } catch (error) {
      console.error('Error speaking welcome message:', error);
    }
  }, [userData, weatherData, userAddress]);

  // Speak welcome message when both user data and weather are loaded
  // Disabled auto-play due to browser autoplay policy - browsers block audio without user interaction
  // The welcome message will only play when user clicks the AI orb or interacts with the page
  /*
  useEffect(() => {
    if (userData && weatherData && userAddress && !hasSpokenWelcome) {
      // Wait for all initial processing to complete before speaking welcome
      // This ensures farming advisory and other operations are done first
      const timer = setTimeout(() => {
        // Double-check nothing is speaking/processing before welcome
        if (!isSpeaking && !isProcessing && !hasSpokenWelcome) {
          speakWelcomeMessage();
        }
      }, 4000); // 4 second delay to let other operations complete
      
      return () => clearTimeout(timer);
    }
  }, [userData, weatherData, userAddress, hasSpokenWelcome, isSpeaking, isProcessing, speakWelcomeMessage]);
  */

  const preloadTtsAudio = useCallback(async (text: string) => {
    // Preload audio buffer immediately so playback can start without UI delay
    await serverManager.initialize();
    const ttsBaseUrl = serverManager.getTTSEndpoint();

    if (!ttsBaseUrl) {
      throw new Error('TTS service not available');
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });

    const ttsUrl = `${ttsBaseUrl}?lang=hi&text=${encodeURIComponent(text)}`;
    console.log('Preloading TTS audio:', ttsUrl);

    const response = await fetch(ttsUrl, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'KrushiMitra-App'
      }
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();

    const audioUri = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: false });
    await sound.setPositionAsync(0);
    return sound;
  }, []);

  const speakResponse = async (text: string, autoStartListening: boolean = false) => {
    // SEQUENTIAL PROCESSING: Ensure we are not listening while speaking
    stopListening();
    setIsSpeaking(true);
    setIsProcessing(true); // Block new inputs during TTS

    let sound: Audio.Sound | null = null;

    try {
      // Preload the audio buffer as soon as text is available
      sound = await preloadTtsAudio(text);

      if (!sound) {
        throw new Error('Failed to prepare TTS audio');
      }

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          sound?.unloadAsync();
          stopSpeakingAnimation();
          setIsSpeaking(false);
          setIsProcessing(false); // Release processing lock after TTS completion

          console.log('TTS completed - ready for next voice input');

          if (autoStartListening) {
            setTimeout(() => {
              if (!isSpeaking && !isProcessing) {
                console.log('Auto-starting listening after TTS completion');
                startListening();
              }
            }, 1000);
          }
        }
        if ('error' in status && status.error) {
          console.error('TTS audio playback error:', status.error);
          stopSpeakingAnimation();
          setIsSpeaking(false);
          setIsProcessing(false); // Release processing lock on error

          if (autoStartListening) {
            setTimeout(() => {
              if (!isSpeaking && !isProcessing) {
                startListening();
              }
            }, 1000);
          }
        }
      });

      // Kick off orb animation only once audio buffer is ready, then play immediately
      startSpeakingAnimation();
      await sound.playAsync();
    } catch (error) {
      console.error('TTS error:', error instanceof Error ? error.message : String(error));

      stopSpeakingAnimation();
      setIsSpeaking(false);
      setIsProcessing(false);

      if (sound) {
        sound.unloadAsync();
      }

      if (autoStartListening) {
        setTimeout(() => {
          if (!isSpeaking && !isProcessing) {
            startListening();
          }
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (!showAIModal) {
      if (modalWelcomeTtsTimer.current) {
        clearTimeout(modalWelcomeTtsTimer.current);
        modalWelcomeTtsTimer.current = null;
      }
      return;
    }

    if (modalWelcomeTtsTimer.current) {
      clearTimeout(modalWelcomeTtsTimer.current);
    }

    modalWelcomeTtsTimer.current = setTimeout(() => {
      modalWelcomeTtsTimer.current = null;
      const welcomeMessage = 'नमस्ते! KrushiAI सहायक अब सक्रिय है। आप मौसम, मंडी भाव, फसल और कीट से जुड़े सवाल पूछ सकते हैं।';
      if (!isSpeakingRef.current && !isProcessingRef.current) {
        speakResponse(welcomeMessage, false);
      }
    }, 120); // align with modal pop animation

    return () => {
      if (modalWelcomeTtsTimer.current) {
        clearTimeout(modalWelcomeTtsTimer.current);
        modalWelcomeTtsTimer.current = null;
      }
    };
  }, [showAIModal]);


  const handleVoiceInput = async (text: string, confidence?: number) => {
    // SEQUENTIAL PROCESSING: Block concurrent voice inputs during entire response cycle
    if (isSpeaking) {
      console.log('Currently speaking via TTS, ignoring voice input');
      return;
    }

    if (isProcessing) {
      console.log('Currently processing previous request, ignoring voice input');
      return;
    }

    // Additional validation for recognized speech - only pass valid speech to LLM
    if (!isValidSpeechInput(text, confidence)) {
      console.log('Invalid speech input, ignoring and restarting listening');
      // Restart listening for next valid input
      setTimeout(() => {
        if (!isSpeaking && !isProcessing) {
          startListening();
        }
      }, 1000);
      return;
    }

    console.log('Processing valid voice input:', { text, confidence });

    // SEQUENTIAL: Block ALL new voice inputs until complete response cycle finishes
    setIsProcessing(true);
    stopListening(); // Ensure speech recognition is stopped during processing

    try {
      // Add user message to conversation history
      const updatedHistory = [...conversationHistory, { role: "user", parts: text }];
      setConversationHistory(updatedHistory);

      // Rate limiting check
      const now = Date.now();
      const recentRequests = lastRequestTimes.filter((time: number) => now - time < RATE_LIMIT_WINDOW);
      const remainingRequests = MAX_REQUESTS_PER_WINDOW - recentRequests.length;
      const resetTime = now + RATE_LIMIT_WINDOW;

      // Update rate limit status
      setRateLimitStatus({
        remainingRequests,
        resetTime
      });

      if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        console.warn('Rate limit exceeded: Too many requests in a short time');
        const timeUntilReset = formatTimeUntilReset(rateLimitStatus.resetTime);
        const rateLimitMessage = `आपने एक मिनट में ${MAX_REQUESTS_PER_WINDOW} अनुरोधों की सीमा पार कर ली है। कृपया ${timeUntilReset} प्रतीक्षा करें और फिर कोशिश करें।`;
        // SEQUENTIAL: Speak rate limit message with Niraj voice and auto-restart listening
        // Note: isProcessing will be released when TTS completes
        speakResponse(rateLimitMessage, true);
        setConversationHistory([...updatedHistory, { role: "model", parts: rateLimitMessage }]);
        return;
      }

      // Update request times
      setLastRequestTimes([...recentRequests, now]);

      // Update rate limit status after adding the new request
      setRateLimitStatus({
        remainingRequests: remainingRequests - 1,
        resetTime
      });

      // Process general queries with LLM - keep isProcessing true throughout
      console.log('Querying LLM for response, blocking all new voice inputs...');

      // Generate response using hybrid cloud/local LLM with automatic failover
      try {
        let finalResponse = '';

        // Fetch user context to provide to LLM
        let userContextForLLM = null;
        try {
          const contextSnapshot = await fetchUserContextSnapshot();
          if (contextSnapshot) {
            // Format context in the same structure as backend
            userContextForLLM = {
              query: text,
              user_data: {
                user_name: contextSnapshot.userData?.name || 'Unknown',
                user_email: contextSnapshot.userData?.email || 'Not provided',
                user_phone: contextSnapshot.userData?.phone || 'Not provided',
                user_language: contextSnapshot.userData?.language || language,
                user_location: contextSnapshot.userData?.location ? {
                  address: contextSnapshot.userData.location.address,
                  latitude: contextSnapshot.userData.location.latitude,
                  longitude: contextSnapshot.userData.location.longitude
                } : null,
                user_weather: contextSnapshot.userData?.weather ? {
                  temperature: contextSnapshot.userData.weather.temperature,
                  humidity: contextSnapshot.userData.weather.humidity,
                  condition: contextSnapshot.userData.weather.condition
                } : null
              },
              last_5_conversations: (contextSnapshot.query || []).map(conv => ({
                role: conv.role,
                message: conv.message
              }))
            };
            console.log('📋 User context loaded for AI Orb:', {
              hasUserData: !!userContextForLLM.user_data,
              conversationCount: userContextForLLM.last_5_conversations.length
            });
          }
        } catch (contextError) {
          console.warn('Could not fetch user context for AI Orb:', contextError);
        }

        // SEQUENTIAL PROCESSING: Get complete response first, then speak with Niraj voice
        // queryLLMStream automatically chooses cloud or local based on availability
        // Pass user context to LLM
        for await (const chunk of queryLLMStream(text, undefined, userContextForLLM)) {
          finalResponse += chunk;
        }

        console.log('LLM response received, now speaking with Niraj Hindi voice only');

        // SEQUENTIAL: Speak complete response with Niraj voice and auto-restart listening
        // Note: isProcessing remains true until TTS completes
        speakResponse(finalResponse.trim(), true);

        // Add AI response to conversation history
        setConversationHistory([...updatedHistory, { role: "model", parts: finalResponse }]);

        // Save interaction to MongoDB
        try {
          const llmMode = process.env.EXPO_PUBLIC_LLM_MODE || 'hybrid';
          const interactionSaved = await saveAIInteraction({
            userId: userData?.id || 'anonymous',  // Use userId from Google auth
            farmerId: userData?.phone || userData?.id || 'anonymous',  // Keep for backward compatibility
            query: text,
            response: finalResponse,
            context: { provider: llmMode, model: 'llama3', streamed: true }
          });
          if (interactionSaved) {
            console.log('AI interaction saved successfully to MongoDB');
          } else {
            console.warn('Failed to save AI interaction to MongoDB');
          }
        } catch (error) {
          console.error('Error saving interaction to MongoDB:', error);
        }
      } catch (apiError: any) {
        console.error('Error calling LLM:', apiError);
        const errorMessage = 'एआई सेवा से अभी जुड़ाव नहीं हो पा रहा। कृपया बाद में पुनः प्रयास करें।';
        // SEQUENTIAL: Speak error with Niraj voice and auto-restart listening
        // Note: isProcessing will be released when TTS completes
        speakResponse(errorMessage, true);
        setConversationHistory([...updatedHistory, { role: 'model', parts: errorMessage }]);
        // Save error interaction
        try {
          const llmMode = process.env.EXPO_PUBLIC_LLM_MODE || 'hybrid';
          await saveAIInteraction({
            userId: userData?.id || 'anonymous',
            farmerId: userData?.phone || userData?.id || 'anonymous',
            query: text,
            response: 'API Error: LLM unreachable',
            context: { error: apiError?.message || 'Unknown error', provider: llmMode }
          });
        } catch (e) {
          console.error('Error saving interaction error to MongoDB:', e);
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      const errorMessage = "खेद है, आपके अनुरोध को संसाधित करने में त्रुटि हुई। कृपया पुनः प्रयास करें।";
      // SEQUENTIAL: Speak error with Niraj voice and auto-restart listening
      speakResponse(errorMessage, true);
    }
  };

  const startSpeakingAnimation = () => {
    // Create a more dynamic speaking animation
    const speakingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(audioLevel, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(audioLevel, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(audioLevel, {
          toValue: 1.2,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(audioLevel, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    );

    speakingAnimation.start();

    // Store reference to stop later
    (audioLevel as any)._speakingAnimation = speakingAnimation;
  };

  const stopSpeakingAnimation = () => {
    // Stop the speaking animation
    if ((audioLevel as any)._speakingAnimation) {
      (audioLevel as any)._speakingAnimation.stop();
    }

    // Reset to normal scale with a smooth transition
    Animated.timing(audioLevel, {
      toValue: 1,
      duration: 500, // Slower reset for smoother transition
      useNativeDriver: true,
    }).start();
  };

  const startAudioVisualization = () => {
    if (!audioContextRef.current || !analyserRef.current) return;

    const updateAudioLevel = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;

      // Normalize to 0-1 range (0-255 is the Uint8Array range)
      const normalizedLevel = 1 + (average / 255) * 0.5; // Scale to 1.0 - 1.5 range

      // Update the animated value
      Animated.timing(audioLevel, {
        toValue: normalizedLevel,
        duration: 50, // Smooth transitions
        useNativeDriver: true,
      }).start();

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset to normal scale
    Animated.timing(audioLevel, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleVoiceAssistant = () => {
    // Check if browser supports Web Speech API (works on mobile browsers too!)
    const hasWebSpeech = typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

    console.log('🎤 Voice toggle clicked:', {
      platform: Platform.OS,
      hasWindow: typeof window !== 'undefined',
      hasWebkitSpeechRecognition: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window,
      hasSpeechRecognition: typeof window !== 'undefined' && 'SpeechRecognition' in window,
      hasWebSpeech,
      recognitionRefExists: !!recognitionRef.current
    });

    if (!hasWebSpeech) {
      Alert.alert(
        'Voice Feature',
        'Voice chat requires a browser with Web Speech API support. Try Chrome, Edge, or Safari. You can still use the text chat feature!',
        [
          { text: 'OK' },
          { text: 'Open Chat', onPress: () => router.push('/ai-chat') }
        ]
      );
      return;
    }

    // Check if recognition was initialized in useEffect
    if (!recognitionRef.current) {
      console.error('❌ Recognition not initialized - this should not happen!');
      Alert.alert('Error', 'Voice recognition not ready. Please refresh the page.');
      return;
    }

    // Speak welcome message on first interaction (browser autoplay policy requirement)
    if (!hasSpokenWelcome && userData && weatherData && !isSpeaking && !isProcessing) {
      speakWelcomeMessage();
      return; // Don't start listening yet, let welcome finish first
    }

    if (isPaused) {
      setIsPaused(false);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePause = () => {
    if (isListening) {
      stopListening();
    }
    if (isSpeaking) {
      // NO device TTS cleanup - user explicitly requested ONLY Niraj Hindi voice
      setIsSpeaking(false);
    }
    setIsPaused(true);
  };

  const formatTimeUntilReset = (resetTime: number): string => {
    const now = Date.now();
    const timeLeft = Math.max(0, resetTime - now);
    const seconds = Math.ceil(timeLeft / 1000);

    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };



  /* ==========================================================================
     JUDGE DEMO: TRIPLE TAP HANDLER
     ========================================================================== */

  const triggerJudgeDemo = async () => {
    try {
      console.log('🔮 JUDGE DEMO: Triggering Orb Call...');
      Alert.alert('🔮 Demo Triggered', 'Calling your phone with Mandi prices...');

      // Get current user info
      const farmerId = userData?.phone || sessionUserId || 'demo-farmer';
      const phoneNumber = userData?.phone || userData?.profile?.phone || '919876543210'; // Fallback if no phone

      if (!phoneNumber) {
        Alert.alert('Error', 'No phone number found in profile to call.');
        return;
      }

      await serverManager.initialize();
      const { backendUrl } = getServerConfig();

      const response = await fetch(`${backendUrl}/demo/orb-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          phoneNumber
        })
      });

      const result = await response.json();
      console.log('🔮 Demo Result:', result);

    } catch (error) {
      console.error('🔮 Demo Error:', error);
      Alert.alert('Demo Error', 'Failed to trigger call.');
    }
  };

  const handleOrbPress = () => {
    const now = Date.now();
    // Filter taps older than 2 seconds
    const recentTaps = tapTimestamps.current.filter(t => now - t < 2000);
    tapTimestamps.current = [...recentTaps, now];

    console.log(`Tap detected. Count: ${tapTimestamps.current.length}`);

    if (tapTimestamps.current.length >= 3) {
      console.log("🔮 TRIPLE TAP! Resetting and Triggering Demo.");
      tapTimestamps.current = []; // Reset
      triggerJudgeDemo();
    }

    // Always toggle standard assistant behavior (or you could condition it)
    toggleVoiceAssistant();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top Navigation Header */}
        <View style={styles.topNavigation}>
          <TouchableOpacity style={styles.navButton} onPress={openDrawerMenu}>
            <Menu size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.appTitle} numberOfLines={1}>{t('homeScreen.appTitle')}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.headerLocationText} numberOfLines={1} ellipsizeMode="tail">
                {t('homeScreen.location')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.navButton} onPress={openNotifications}>
            <View style={styles.notificationContainer}>
              <Bell size={24} color="#1F2937" />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{t('homeScreen.notifications')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {t(new Date().getHours() < 12 ? 'greetings.goodMorning' : new Date().getHours() < 17 ? 'greetings.goodAfternoon' : 'greetings.goodEvening')}
          </Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>

        {/* AI Assistant - Futuristic Centered Circle */}
        <View style={styles.centeredCircleContainer}>
          {/* Outer Orbital Ring */}
          <Animated.View style={[
            styles.outerOrbitalRing,
            {
              transform: [{
                rotate: orbitalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}>
            <View style={styles.orbitalDot1} />
            <View style={styles.orbitalDot2} />
            <View style={styles.orbitalDot3} />
          </Animated.View>

          {/* Main Circle with Enhanced Effects */}
          <TouchableOpacity
            onPress={handleOrbPress}
            activeOpacity={0.7}
            style={styles.circleTouchContainer}
          >
            <Animated.View style={[
              styles.perfectMainCircle,
              {
                shadowOpacity: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
                shadowRadius: glowAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 40],
                }),
                transform: [
                  {
                    scale: audioLevel
                  }
                ]
              }
            ]}>
              {/* Holographic Gradient */}
              <LinearGradient
                colors={[
                  'rgba(59, 130, 246, 0.9)',
                  'rgba(139, 92, 246, 0.8)',
                  'rgba(16, 185, 129, 0.7)',
                  'rgba(236, 72, 153, 0.6)',
                  'rgba(59, 130, 246, 0.9)'
                ]}
                style={styles.holographicLayer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Inner Glass Effect */}
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 255, 0.2)',
                    'rgba(255, 255, 255, 0.05)',
                    'rgba(255, 255, 255, 0.1)'
                  ]}
                  style={styles.glassLayer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.circleContentMain}>
                    {/* AI Bot with Glow */}
                    <Animated.View style={[
                      styles.botContainer,
                      {
                        opacity: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      }
                    ]}>
                      <Bot size={90} color="#FFFFFF" />
                    </Animated.View>

                    {/* Futuristic Text */}
                    <Animated.Text style={[
                      styles.futuristicTitle,
                      {
                        opacity: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        })
                      }
                    ]}>KrushiAi</Animated.Text>

                    <Animated.Text style={[
                      styles.futuristicSubtitle,
                      {
                        opacity: glowAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        })
                      }
                    ]}>
                      {isPaused ? "Paused" : isListening ? t('aiAssistant.listening') : isSpeaking ? t('aiAssistant.speaking') : t('aiAssistant.neuralInterface')}
                    </Animated.Text>

                    {/* Voice Input Mode Indicator */}
                    <View style={styles.voiceInputModeContainer}>
                      <View style={[
                        styles.voiceInputModeIndicator,
                        { backgroundColor: whisperReady ? '#4CAF50' : '#FF9800' }
                      ]}>
                        <Text style={styles.voiceInputModeText}>
                          {whisperReady ? 'Whisper STT' : 'Browser STT'}
                        </Text>
                      </View>
                    </View>

                    {/* Mic Icon for Voice Control */}
                    <View style={styles.micIconContainer}>
                      {isPaused ? (
                        <Play size={24} color="#FFFFFF" />
                      ) : isListening ? (
                        <MicOff size={24} color="#FFFFFF" />
                      ) : (
                        <Mic size={24} color="#FFFFFF" />
                      )}
                    </View>

                    {/* Data Streams */}
                    <View style={styles.dataStreams}>
                      <Animated.View style={[
                        styles.dataLine,
                        {
                          opacity: glowAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.8],
                          })
                        }
                      ]} />
                      <Animated.View style={[
                        styles.dataLine,
                        styles.dataLine2,
                        {
                          opacity: glowAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 0.6],
                          })
                        }
                      ]} />
                    </View>
                  </View>
                </LinearGradient>
              </LinearGradient>

              {/* Multiple Pulse Rings */}
              <Animated.View style={[
                styles.pulseRingMain,
                {
                  opacity: glowAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.8],
                  }),
                  transform: [{
                    scale: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.15],
                    })
                  }]
                }
              ]} />

              <Animated.View style={[
                styles.pulseRingSecondary,
                {
                  opacity: glowAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.5],
                  }),
                  transform: [{
                    scale: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1.1, 1.3],
                    })
                  }]
                }
              ]} />
            </Animated.View>
          </TouchableOpacity>

          {/* Energy Particles */}
          <Animated.View style={[
            styles.energyParticle1,
            {
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              transform: [{
                rotate: orbitalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-360deg'],
                })
              }]
            }
          ]} />

          <Animated.View style={[
            styles.energyParticle2,
            {
              opacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [{
                rotate: orbitalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['180deg', '540deg'],
                })
              }]
            }
          ]} />
        </View>

        {/* Pause Control Button */}
        {!isPaused && (isListening || isSpeaking) && (
          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePause}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.pauseButtonGradient}
            >
              <Pause size={16} color="#4CAF50" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Professional Light-Themed Weather Forecast */}
        <View style={styles.weatherForecastContainer}>
          {/* Current Weather Card */}
          <Animated.View
            style={[
              styles.currentWeatherCard,
              {
                transform: [{
                  scale: weatherAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.008]
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FDF9', '#F0FDF4']}
              style={styles.weatherCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.currentWeatherHeader}>
                <View style={styles.locationContainer}>
                  <View style={styles.locationIconWrapper}>
                    <MapPin size={16} color="#4CAF50" />
                  </View>
                  <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                    {userAddress}
                  </Text>
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.updateTime}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={styles.liveIndicatorWeather}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
              </View>

              <View style={styles.currentWeatherMain}>
                <View style={styles.tempSection}>
                  <Animated.Text
                    style={[
                      styles.currentTemp,
                      {
                        transform: [{
                          scale: pulseAnimation.interpolate({
                            inputRange: [1, 1.1],
                            outputRange: [1, 1.03]
                          })
                        }]
                      }
                    ]}
                  >
                    {weatherData ? `${weatherData.temperature}°C` : 'Loading...'}
                  </Animated.Text>
                  <View style={styles.weatherIconWrapper}>
                    <Animated.View
                      style={[{
                        transform: [{
                          translateY: weatherAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -4]
                          })
                        }]
                      }]}
                    >
                      <View style={styles.iconBackground}>
                        <Cloud size={52} color="#4CAF50" />
                      </View>
                    </Animated.View>
                    <Text style={styles.weatherCondition}>
                      {weatherData?.condition || 'Cloudy'}
                    </Text>
                    <Text style={styles.feelsLike}>
                      {weatherData ? `Feels like ${weatherData.temperature}°C` : 'Loading...'}
                    </Text>
                  </View>
                </View>

                <View style={styles.miniStatsContainer}>
                  <View style={styles.miniStatsGrid}>
                    <View style={styles.miniStat}>
                      <View style={[styles.statIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                        <Cloud size={16} color="#4CAF50" />
                      </View>
                      <Text style={styles.miniStatValue}>
                        {weatherData ? `${weatherData.precipitationProbability}%` : '--'}
                      </Text>
                      <Text style={styles.miniStatLabel}>Rain</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <View style={[styles.statIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                        <Thermometer size={16} color="#4CAF50" />
                      </View>
                      <Text style={styles.miniStatValue}>
                        {weatherData ? `${weatherData.humidity}%` : '--'}
                      </Text>
                      <Text style={styles.miniStatLabel}>Humidity</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <View style={[styles.statIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                        <Activity size={16} color="#4CAF50" />
                      </View>
                      <Text style={styles.miniStatValue}>
                        {weatherData ? `${weatherData.windSpeed} km/h` : '-- km/h'}
                      </Text>
                      <Text style={styles.miniStatLabel}>Wind</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Farming Advisory Section */}
              <View style={styles.advisorySection}>
                <View style={styles.advisoryIconWrapper}>
                  <Sparkles size={20} color="#4CAF50" />
                </View>
                <View style={styles.advisoryTextContainer}>
                  <Text style={styles.advisoryTitle}>AI Farming Advisory</Text>
                  <Text style={styles.advisoryText}>
                    {isLoadingAdvisory ? 'Generating personalized advice...' : aiAdvisory}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Weekly Forecast */}
          <Animated.View
            style={[
              styles.weeklyForecastCard,
              {
                opacity: weatherAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                })
              }
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FDF9']}
              style={styles.forecastCardGradient}
            >
              <View style={styles.forecastHeader}>
                <Text style={styles.forecastTitle}>{t('weather.weekTitle')}</Text>
                <View style={[styles.forecastBadge, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Text style={[styles.forecastBadgeText, { color: '#4CAF50' }]}>WEEK</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.forecastGrid}
              >
                {Array.from({ length: 7 }).map((_, index) => {
                  // Get forecast data for this day or use fallback
                  const day = weeklyForecast[index] || {
                    date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
                    temperatureMax: 28,
                    temperatureMin: 18,
                    weatherCode: 1101,
                    precipitationProbability: 20
                  };

                  const date = new Date(day.date);
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayName = index === 0 ? 'Today' : dayNames[date.getDay()];

                  // Map weather code to icon
                  const getIconFromCode = (code: number) => {
                    if (code === 1000 || code === 1100) return '☀️';
                    if (code === 1101) return '⛅';
                    if (code === 1001 || code === 1102) return '☁️';
                    if (code === 4000 || code === 4200) return '🌦️';
                    if (code === 4001 || code === 4201) return '🌧️';
                    if (code === 8000) return '⛈️';
                    if (code >= 5000 && code <= 5101) return '🌨️';
                    return '🌤️';
                  };

                  return (
                    <View
                      key={index}
                      style={[
                        styles.dailyForecastCard,
                        index === 0 && styles.todayCard,
                        index === 0 && { borderColor: '#4CAF50' }
                      ]}
                    >
                      <Text style={[
                        styles.dayName,
                        index === 0 && styles.todayText,
                        index === 0 && { color: '#4CAF50' }
                      ]}>
                        {dayName}
                      </Text>
                      <View style={styles.dayIconContainer}>
                        <View style={[
                          styles.dayIconWrapper,
                          index === 0 && styles.todayIconWrapper,
                          index === 0 && { backgroundColor: 'rgba(76, 175, 80, 0.2)' }
                        ]}>
                          <Text style={{ fontSize: 20 }}>{getIconFromCode(day.weatherCode)}</Text>
                        </View>
                      </View>
                      <View style={styles.dayTemps}>
                        <Text style={[
                          styles.highTemp,
                          index === 0 && styles.todayTemp,
                          index === 0 && { color: '#4CAF50' }
                        ]}>
                          {day.temperatureMax}°
                        </Text>
                        <Text style={styles.lowTemp}>{day.temperatureMin}°</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* AI Assistant Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAIModal}
          onRequestClose={hideAIModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Bot size={24} color="#4CAF50" />
                  <Text style={styles.modalTitle}>KrushiAI Assistant</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={hideAIModal}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.modalSparkleContainer}>
                  <Sparkles size={16} color="rgba(255, 255, 255, 0.6)" style={styles.modalSparkle1} />
                  <Sparkles size={12} color="rgba(255, 255, 255, 0.4)" style={styles.modalSparkle2} />
                  <Sparkles size={14} color="rgba(255, 255, 255, 0.5)" style={styles.modalSparkle3} />
                </View>

                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>KrushiAI</Text>
                  <Text style={styles.modalSubtitle}>Your Personal Farming Assistant</Text>
                </View>
                <Animated.View style={[
                  styles.glowingAIContainer,
                  {
                    shadowOpacity: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                    shadowRadius: glowAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 25],
                    }),
                  }
                ]}>
                  <View style={styles.perfectCircle}>
                    <LinearGradient
                      colors={['#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8']}
                      style={styles.circleGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Bot size={90} color="#FFFFFF" />
                    </LinearGradient>
                  </View>
                </Animated.View>

                <Text style={styles.modalTitle}>AI Assistant Ready</Text>
                <Text style={styles.modalSubtitle}>
                  Your intelligent farming companion is now activated!
                  Ask me about weather, crops, pests, and get instant help.
                </Text>

                <View style={styles.modalFeatures}>
                  <View style={styles.featureItem}>
                    <Cloud size={16} color="rgba(255, 255, 255, 0.8)" />
                    <Text style={styles.featureText}>Weather Updates</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Activity size={16} color="rgba(255, 255, 255, 0.8)" />
                    <Text style={styles.featureText}>Crop Monitoring</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Bell size={16} color="rgba(255, 255, 255, 0.8)" />
                    <Text style={styles.featureText}>Smart Alerts</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.startChatButton} onPress={startAIConversation}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.startChatGradient}
                  >
                    <MessageCircle size={20} color="#22C55E" />
                    <Text style={styles.startChatText}>Start Chatting</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Service Sections - Rectangular Cards */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>{t('home.agriculturalServices')}</Text>

          {/* Row 1: Crop Disease Detection & Farmer Activity */}
          <View style={styles.serviceRow}>
            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardLarge]} onPress={navigateToCropDisease}>
              <LinearGradient
                colors={['#FEF2F2', '#FEE2E2', '#FECACA']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Camera size={24} color="#EF4444" />
                  </View>
                  <Animated.View style={[{ transform: [{ scale: pulseAnimation }] }]}>
                    <View style={styles.activeIndicator} />
                  </Animated.View>
                </View>
                <Text style={styles.serviceTitle}>{t('service.cropDisease.title')}</Text>
                <Text style={styles.serviceDescription}>{t('service.cropDisease.desc')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardLarge]} onPress={navigateToActivityTracking}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Activity size={24} color="#22C55E" />
                  </View>
                </View>
                <Text style={styles.serviceTitle}>{t('service.activity.title')}</Text>
                <Text style={styles.serviceDescription}>{t('service.activity.desc')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Row 2: Government Schemes & Mandi Prices */}
          <View style={styles.serviceRow}>
            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardLarge]} onPress={navigateToSchemes}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Calendar size={24} color="#3B82F6" />
                  </View>
                </View>
                <Text style={styles.serviceTitle}>{t('service.schemes.title')}</Text>
                <Text style={styles.serviceDescription}>{t('service.schemes.desc')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardLarge]} onPress={navigateToMandiPrices}>
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7', '#FDE68A']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <IndianRupee size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.liveIndicator}>
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.serviceTitle}>{t('service.mandi.title')}</Text>
                <Text style={styles.serviceDescription}>{t('service.mandi.desc')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Row 3: News & CarboSafe */}
          <View style={styles.serviceRow}>
            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardLarge]} onPress={navigateToNews}>
              <LinearGradient
                colors={['#F3E8FF', '#E9D5FF', '#DDD6FE']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Newspaper size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.newsIndicator}>
                    <Text style={styles.newsText}>TODAY</Text>
                  </View>
                </View>
                <Text style={styles.serviceTitle}>{t('service.news.title')}</Text>
                <Text style={styles.serviceDescription}>{t('service.news.desc')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.serviceCard, styles.serviceCardLarge]} onPress={navigateToCarboSafe}>
              <LinearGradient
                colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Leaf size={24} color="#22C55E" />
                  </View>
                  <View style={styles.carbonIndicator}>
                    <Text style={styles.carbonText}>EARN</Text>
                  </View>
                </View>
                <Text style={styles.serviceTitle}>{t('service.carbosafe.title')}</Text>
                <Text style={styles.serviceDescription}>{t('service.carbosafe.desc')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Top Navigation Styles
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    maxWidth: '60%',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  headerLocationText: {
    fontSize: 12,
    color: '#6B7280',
    flexShrink: 1,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Greeting Section
  greetingSection: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  header: {
    paddingVertical: 20,
    paddingBottom: 10,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weatherCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 0,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  // Enhanced Weather Card Styles
  weatherCardContainer: {
    marginBottom: 20,
  },
  weatherGlassOverlay: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 4,
    backdropFilter: 'blur(10px)',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherLocation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  weatherTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  weatherMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  weatherIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    overflow: 'hidden',
  },
  weatherIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  weatherMainTemp: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  weatherFeelsLike: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  weatherDetailsGrid: {
    gap: 8,
  },
  weatherDetailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    minWidth: 60,
    backdropFilter: 'blur(5px)',
  },
  weatherDetailIcon: {
    marginBottom: 4,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  weatherDetailLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  weatherAdviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 4,
  },
  weatherAdviceIcon: {
    marginRight: 8,
  },
  weatherAdviceText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  weatherFloatingParticle1: {
    position: 'absolute',
    top: 15,
    right: 25,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  weatherFloatingParticle2: {
    position: 'absolute',
    top: 35,
    right: 45,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  weatherFloatingParticle3: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(135, 206, 235, 0.9)',
    shadowColor: '#87CEEB',
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  weatherFloatingParticle4: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  weatherWave1: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  weatherWave2: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherInfo: {
    marginLeft: 15,
  },
  weatherMain: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  weatherDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  weatherRight: {
    alignItems: 'flex-end',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  weatherDetailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  weatherAdvice: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  weatherParticle1: {
    position: 'absolute',
    top: 10,
    right: 20,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  weatherParticle2: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  weatherText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  aiSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aiBackground: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  aiGradientBackground: {
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 30,
  },
  sparkle2: {
    position: 'absolute',
    top: 40,
    left: 40,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 30,
    right: 50,
  },
  aiButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  aiButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  aiSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  reminderCard: {
    backgroundColor: '#FEF3C7',
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  reminderText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  // Service Sections Styles
  servicesContainer: {
    marginBottom: 30,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  serviceCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceCardLarge: {
    minHeight: 120,
  },
  serviceGradient: {
    padding: 16,
    borderRadius: 16,
    height: '100%',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  liveIndicator: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newsIndicator: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newsText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  carbonIndicator: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  carbonText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingLeft: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: '31%',
    alignItems: 'center',
    minHeight: 140,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '90%',
    maxWidth: 380,
    minHeight: 450,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
    // Perfect centering
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    alignItems: 'center',
    width: '100%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  modalSparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSparkle1: {
    position: 'absolute',
    top: 25,
    right: 35,
  },
  modalSparkle2: {
    position: 'absolute',
    top: 50,
    left: 45,
  },
  modalSparkle3: {
    position: 'absolute',
    bottom: 40,
    right: 55,
  },
  glowingAIContainer: {
    marginBottom: 25,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    elevation: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfectCircle: {
    width: 150,
    height: 150,
    borderRadius: 75, // Perfect circle: 50% of width/height
    overflow: 'hidden',
    shadowColor: '#0369A1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    // Floating effect
    transform: [{ translateY: -2 }],
  },
  circleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(3, 105, 161, 0.3)',
    backgroundColor: 'transparent',
  },
  glowingAI: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  modalFeatures: {
    width: '100%',
    marginBottom: 25,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  startChatButton: {
    width: '100%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startChatGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 20,
    gap: 10,
  },
  startChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  // Centered Circle Styles
  centeredCircleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  perfectMainCircle: {
    width: 150,
    height: 150,
    borderRadius: 75, // Perfect circle: 50% of width/height
    overflow: 'hidden',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    // Floating effect
    transform: [{ translateY: -4 }],
  },
  circleGradientMain: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleContentMain: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  circleTouchContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginTop: 8,
    textAlign: 'center',
  },
  circleSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    textAlign: 'center',
  },
  pulseRingMain: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(30, 64, 175, 0.3)',
    backgroundColor: 'transparent',
  },
  // Futuristic Enhancement Styles
  outerOrbitalRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalDot1: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#60A5FA',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  orbitalDot2: {
    position: 'absolute',
    bottom: -4,
    right: '50%',
    marginRight: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A78BFA',
    shadowColor: '#A78BFA',
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  orbitalDot3: {
    position: 'absolute',
    right: -4,
    top: '50%',
    marginTop: -4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowOpacity: 0.7,
    shadowRadius: 3,
  },
  holographicLayer: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glassLayer: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  botContainer: {
    marginBottom: 8,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  futuristicTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(59, 130, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  futuristicSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dataStreams: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataLine: {
    position: 'absolute',
    width: 80,
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.6)',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  dataLine2: {
    marginTop: 4,
    width: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.6)',
    shadowColor: '#8B5CF6',
  },
  pulseRingSecondary: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    backgroundColor: 'transparent',
  },
  energyParticle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
    shadowColor: '#60A5FA',
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  energyParticle2: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#EC4899',
    shadowColor: '#EC4899',
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  // Professional Light Weather Forecast Styles
  weatherForecastContainer: {
    marginBottom: 24,
    gap: 20,
  },
  currentWeatherCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  weatherCardGradient: {
    padding: 16,
    borderRadius: 20,
  },
  currentWeatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    maxWidth: '70%',
  },
  locationIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flexShrink: 1,
    numberOfLines: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  updateTime: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  liveIndicatorWeather: {
    backgroundColor: '#FFB200',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentWeatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
  },
  tempSection: {
    flex: 1,
  },
  currentTemp: {
    fontSize: 48,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
    letterSpacing: -2,
  },
  weatherIconWrapper: {
    alignItems: 'flex-start',
    gap: 8,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCondition: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  feelsLike: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  miniStatsContainer: {
    flex: 1,
    paddingLeft: 0,
    minWidth: '100%',
  },
  miniStatsGrid: {
    gap: 12,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 178, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 178, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
    flex: 1,
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
  },
  weeklyForecastCard: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  forecastCardGradient: {
    padding: 16,
    borderRadius: 20,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  forecastBadge: {
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  forecastBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFB200',
  },
  forecastGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  dailyForecastCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 178, 0, 0.1)',
  },
  todayCard: {
    backgroundColor: 'rgba(255, 178, 0, 0.1)',
    borderColor: '#FFB200',
    borderWidth: 1.5,
  },
  dayName: {
    fontSize: 11,
    color: '#777',
    fontWeight: '600',
    marginBottom: 8,
  },
  todayText: {
    color: '#FFB200',
    fontWeight: '700',
  },
  dayIconContainer: {
    marginBottom: 10,
  },
  dayIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(119, 119, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayIconWrapper: {
    backgroundColor: 'rgba(255, 178, 0, 0.2)',
  },
  dayTemps: {
    alignItems: 'center',
    gap: 4,
  },
  highTemp: {
    fontSize: 16,
    color: '#333',
    fontWeight: '700',
  },
  todayTemp: {
    color: '#FFB200',
  },
  lowTemp: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
  },
  // Weather Advisory Section
  advisorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  advisoryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  advisoryTextContainer: {
    flex: 1,
  },
  advisoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  advisoryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // Voice Assistant Styles
  micIconContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Pause Button Styles
  pauseButton: {
    position: 'absolute',
    top: '50%',
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pauseButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  // Voice Input Mode Indicator Styles
  voiceInputModeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  voiceInputModeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceInputModeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

