import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Alert, Clipboard, Animated, Easing, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Bot, User, Sparkles, Wheat, Mic, Image as ImageIcon, Share2, Upload } from 'lucide-react-native';
import { GiftedChat, IMessage, Bubble, InputToolbar, SendProps, BubbleProps } from 'react-native-gifted-chat';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { getServerConfig, serverManager } from '@/src/services/serverManager';


interface ChatMessage extends IMessage {
  language?: string;
  image?: string;
}

interface SessionSnapshot {
  userId: string | null;
  token: string | null;
  farmerId: string | null;
  preferredLanguage: string | null;
}

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

export default function AIChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      _id: 1,
      text: `Hello! I'm your KrushiMitra farming assistant. I can help you with crop care, weather updates, pest control, and farming advice in your preferred language.

नमस्ते! मैं आपका कृषि मित्र सहायक हूँ। मैं फसल देखभाल, मौसम अपडेट, कीट नियंत्रण और कृषि सलाह में आपकी मदद कर सकता हूँ।

നമസ്കാരം! ഞാൻ നിങ്ങളുടെ കൃഷി മിത്ര സഹായിയാണ്. വിള പരിചരണം, കാലാവസ്ഥ അപ്ഡേറ്റുകൾ, കീടനാശനിയന്ത്രണം, കാർഷിക ഉപദേശം എന്നിവയിൽ ഞാൻ നിങ്ങളെ സഹായിക്കാം.

नमस्कार! मी तुमचा कृषी मित्र सहाय्यक आहे. मी तुम्हाला पीक काळजी, हवामान अद्यतने, कीटक नियंत्रण आणि शेती सल्ला यांमध्ये मदत करू शकतो.`,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'KrushiAI',
        avatar: '🤖',
      },
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress] = useState(new Animated.Value(0));
  const [sessionInfo, setSessionInfo] = useState<SessionSnapshot>({
    userId: null,
    token: null,
    farmerId: null,
    preferredLanguage: null
  });
  const router = useRouter();
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const profileLanguageSynced = useRef(false);
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;

  // Initialize animations
  useEffect(() => {
    // Pulse animation for AI status
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation for action buttons
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Set up event listeners for expo-speech-recognition
  useSpeechRecognitionEvent('start', () => {
    if (Platform.OS !== 'web') {
      setIsRecording(true);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (Platform.OS !== 'web') {
      setIsRecording(false);
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (Platform.OS !== 'web' && event.results && event.results.length > 0) {
      handleSend([{
        _id: Math.round(Math.random() * 1000000),
        text: event.results[0].transcript,
        createdAt: new Date(),
        user: {
          _id: 1,
          name: 'Farmer',
          avatar: '👤',
        },
      }], true);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (Platform.OS !== 'web') {
      console.error('Speech recognition error:', event);
      setIsRecording(false);
      Alert.alert('Speech Recognition Error', 'There was an error with speech recognition. Please try again.');
    }
  });

  useEffect(() => {
    const hydrateSessionInfo = async () => {
      try {
        const [userJson, tokenValue] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('authToken')
        ]);

        const parsedUser = userJson ? JSON.parse(userJson) : null;
        const derivedId = normalizeUserId(parsedUser?.id) || normalizeUserId(parsedUser?._id) || normalizeUserId(parsedUser?.userId);
        const snapshot: SessionSnapshot = {
          userId: derivedId,
          token: tokenValue,
          farmerId: parsedUser?.phone || parsedUser?.profile?.phone || null,
          preferredLanguage: parsedUser?.preferredLanguage || parsedUser?.profile?.language || null
        };

        setSessionInfo(snapshot);
        if (snapshot.preferredLanguage && !profileLanguageSynced.current) {
          profileLanguageSynced.current = true;
          setSelectedLanguage(snapshot.preferredLanguage);
        }
      } catch (error) {
        console.warn('Failed to restore user session for AI chat:', error);
        setSessionInfo({ userId: null, token: null, farmerId: null, preferredLanguage: null });
      }
    };

    hydrateSessionInfo();
  }, []);

  // Load chat history from AsyncStorage
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('aiChatHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        setMessages(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async (newMessages: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem('aiChatHistory', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const fetchUserContextSnapshot = useCallback(async () => {
    if (!sessionInfo.userId) {
      return null;
    }
    try {
      await serverManager.initialize();
      const { backendUrl } = getServerConfig();
      const headers: Record<string, string> = {};
      if (sessionInfo.token) {
        headers.Authorization = `Bearer ${sessionInfo.token}`;
      }
      const response = await fetch(`${backendUrl}/user-context/${sessionInfo.userId}`, { headers });
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      return payload?.data || payload?.userContext || null;
    } catch (error) {
      console.warn('Failed to fetch user context snapshot:', error);
      return null;
    }
  }, [sessionInfo]);

  const pickImage = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required to upload images.');
      return;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setIsUploading(true);
      
      // Animate upload progress
      Animated.timing(uploadProgress, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      
      // Simulate upload delay
      setTimeout(() => {
        setIsUploading(false);
        uploadProgress.setValue(0);
        
        // Create image message
        const imageMessage: ChatMessage = {
          _id: Date.now(),
          text: 'Crop image uploaded for analysis',
          createdAt: new Date(),
          user: {
            _id: 1,
            name: 'Farmer',
            avatar: '👤',
          },
          image: selectedImage,
        };
        
        handleSend([imageMessage]);
      }, 2000);
    }
  };

  const handleSend = useCallback(async (newMessages: ChatMessage[], isVoiceInput = false) => {
    // Add user message
    setMessages(previousMessages => {
      const updatedMessages = GiftedChat.append(previousMessages, newMessages);
      saveChatHistory(updatedMessages);
      return updatedMessages;
    });

    // Get the last user message
    const userMessage = newMessages[0];
    
    try {
      // Get backend URL from server manager
      await serverManager.initialize();
      const { backendUrl } = getServerConfig();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (sessionInfo.token) {
        headers.Authorization = `Bearer ${sessionInfo.token}`;
      }

      const resolvedFarmerId = sessionInfo.farmerId || sessionInfo.userId || 'anonymous';
      const latestUserContext = await fetchUserContextSnapshot();
      const requestPayload: Record<string, any> = {
        userId: sessionInfo.userId,
        farmerId: resolvedFarmerId,
        query: userMessage.text,
        language: selectedLanguage,
        image: userMessage.image
      };
      if (latestUserContext) {
        requestPayload.context = { userContext: latestUserContext };
      }
      
      // Call backend API
      const response = await fetch(`${backendUrl}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const replyText = result?.data?.response || result?.data?.replyText || '';
      const detectedLanguage = result?.data?.language || selectedLanguage;
      const aiText = replyText.trim().length > 0
        ? replyText
        : `I'm still gathering more insights about "${userMessage.text}". Please try asking in another way.`;
      
      // Create AI response message
      const aiResponse: ChatMessage = {
        _id: Date.now(),
        text: aiText,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'KrushiAI',
          avatar: '🤖',
        },
        language: detectedLanguage,
      };

      setMessages(previousMessages => {
        const updatedMessages = GiftedChat.append(previousMessages, [aiResponse]);
        saveChatHistory(updatedMessages);
        
        // Speak the response
        speakResponse(aiResponse.text, detectedLanguage);
        
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error calling chat API:', error);
      
      // Fallback response in case of API error
      const fallbackResponse: ChatMessage = {
        _id: Date.now(),
        text: "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'KrushiAI',
          avatar: '🤖',
        },
        language: selectedLanguage,
      };

      setMessages(previousMessages => {
        const updatedMessages = GiftedChat.append(previousMessages, [fallbackResponse]);
        saveChatHistory(updatedMessages);
        
        // Speak the response
        speakResponse(fallbackResponse.text, selectedLanguage);
        
        return updatedMessages;
      });
    }
  }, [selectedLanguage, sessionInfo, fetchUserContextSnapshot]);

  const speakResponse = async (text: string, language: string) => {
    setIsSpeaking(true);
    
    try {
      // Get TTS URL from server manager
      await serverManager.initialize();
      const { ttsUrl: ttsBaseUrl } = getServerConfig();
      
      // ONLY use 11labs Niraj voice from backend - NO FALLBACKS
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      
      // Call backend TTS endpoint with ONLY Niraj Hindi voice
      const ttsUrl = `${ttsBaseUrl}?lang=hi&text=${encodeURIComponent(text)}`;
      console.log('AI Chat calling TTS endpoint:', ttsUrl);
      
      // Fetch audio with ngrok-skip-browser-warning header to bypass ngrok interstitial page
      const response = await fetch(ttsUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'KrushiMitra-App'
        }
      });
      
      if (!response.ok) {
        throw new Error(`TTS API returned ${response.status}: ${response.statusText}`);
      }
      
      // Convert response to blob, then to data URL for playback
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const audioUri = reader.result as string;
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        
        // Handle playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync();
            setIsSpeaking(false);
          }
          if ('error' in status && status.error) {
            console.error('Niraj voice audio playback error:', status.error);
            setIsSpeaking(false);
          }
        });
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('AI Chat Niraj voice TTS error details:', error);
      
      setIsSpeaking(false);
      
      // Provide helpful error message for connection issues
      if (error instanceof Error && (error.message.includes('Network request failed') || error.message.includes('Failed to load'))) {
        console.warn('AI Chat TTS Backend Connection Error: Make sure the backend server is running and accessible');
        Alert.alert('Connection Error', 'Unable to connect to the text-to-speech service. Please ensure the backend server is running and accessible.');
      } else {
        Alert.alert('Audio Error', 'There was an error playing the audio response. Please try again.');
      }
      
      // NO FALLBACK - Only Niraj voice allowed
    }
  };

  const startVoiceRecording = async () => {
    if (isRecording) {
      try {
        ExpoSpeechRecognitionModule.stop();
        setIsRecording(false);
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
      } catch (error) {
        console.error('Error stopping voice recording:', error);
      }
    } else {
      try {
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: false,
          maxAlternatives: 1,
          continuous: false,
          requiresOnDeviceRecognition: false,
        });
        setIsRecording(true);
        
        // Auto-stop recording after 10 seconds
        recordingTimeoutRef.current = setTimeout(() => {
          stopVoiceRecording();
        }, 10000) as unknown as NodeJS.Timeout;
      } catch (error) {
        console.error('Error starting voice recording:', error);
        Alert.alert('Speech Recognition Error', 'Microphone access is required for voice input. Please ensure you have given the necessary permissions.');
      }
    }
  };

  const stopVoiceRecording = async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping voice recording:', error);
    }
  };

  const shareMessage = async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied to clipboard', 'Message copied to clipboard. You can now paste it in WhatsApp or other apps.');
    } catch (error) {
      console.error('Error sharing message:', error);
      Alert.alert('Error', 'Failed to copy message to clipboard.');
    }
  };

  const renderBubble = (props: BubbleProps<ChatMessage>) => {
    return (
      <View>
        {props.currentMessage.image && (
          <View style={styles.imageContainer}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.imageBorder}
            >
              <View style={styles.imageView}>
                <Image 
                  source={{ uri: props.currentMessage.image }} 
                  style={styles.chatImage}
                  resizeMode="cover"
                />
              </View>
            </LinearGradient>
          </View>
        )}
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: '#FFFFFF',
              borderBottomLeftRadius: 0,
              ...props.currentMessage.image && { marginTop: 10 }
            },
            right: {
              backgroundColor: '#4CAF50',
              borderBottomRightRadius: 0,
            },
          }}
          textStyle={{
            left: {
              color: '#333333',
            },
            right: {
              color: '#FFFFFF',
            },
          }}
        />
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => shareMessage(props.currentMessage.text)}
        >
          <Share2 size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSend = (props: SendProps<ChatMessage>) => {
    if (!props.text || props.text.trim().length === 0) {
      return (
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {}}
          disabled={true}
        >
          <View style={[styles.sendIconContainer, styles.disabledSendIcon]}>
            <Send size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.sendButton}
        onPress={() => {
          if (props.text && props.onSend) {
            props.onSend({ text: props.text.trim() }, true);
          }
        }}
      >
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.sendIconContainer}
        >
          <Send size={20} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    );
  };

  const renderActions = () => {
    const float = floatAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5],
    });

    return (
      <View style={styles.actionButtonsContainer}>
        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.imageButton]}
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <Upload size={20} color="#4CAF50" />
            ) : (
              <ImageIcon size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.voiceButton, isRecording && styles.recordingButton]}
            onPress={startVoiceRecording}
          >
            <Mic size={20} color={isRecording ? '#FFFFFF' : '#4CAF50'} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9', '#E8F5E8']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#4CAF50" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Animated.View style={[styles.logoWrapper, { transform: [{ scale: pulseScale }] }]}>
                <Wheat size={20} color="#4CAF50" />
              </Animated.View>
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>AI Farming Assistant</Text>
                <Text style={styles.headerSubtitle}>Smart Agriculture Support</Text>
              </View>
            </View>
            
            <View style={styles.aiIndicator}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.aiIndicatorGradient}
              >
                <Animated.View style={[styles.aiDot, { transform: [{ scale: pulseScale }] }]} />
                <Text style={styles.aiStatus}>
                  {isSpeaking ? 'Speaking' : 'Online'}
                </Text>
                <Sparkles size={12} color="#FFFFFF" style={styles.sparkleIcon} />
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Chat */}
        <GiftedChat
          messages={messages}
          onSend={newMessages => handleSend(newMessages as ChatMessage[])}
          user={{
            _id: 1,
            name: 'Farmer',
            avatar: '👤',
          }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          renderActions={renderActions}
          placeholder="Ask about weather, crops, pests..."
          alwaysShowSend
          keyboardShouldPersistTaps="handled"
          renderAvatar={null}
        />
      </LinearGradient>
      
      {/* Upload progress indicator */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <LinearGradient
            colors={['rgba(76, 175, 80, 0.9)', 'rgba(46, 125, 50, 0.9)']}
            style={styles.uploadContainer}
          >
            <Upload size={32} color="#FFFFFF" />
            <Text style={styles.uploadText}>Analyzing crop image...</Text>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: uploadProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  titleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  aiIndicatorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  aiStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  sparkleIcon: {
    marginLeft: 4,
  },
  shareButton: {
    position: 'absolute',
    right: 10,
    bottom: -20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputToolbar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 10,
    borderRadius: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputPrimary: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendIcon: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 90,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageButton: {
    marginRight: 8,
  },
  voiceButton: {
    backgroundColor: '#E8F5E8',
  },
  recordingButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  imageContainer: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    width: 200,
    height: 150,
  },
  imageBorder: {
    padding: 3,
    borderRadius: 16,
  },
  imageView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
  },
  chatImage: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  uploadContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});