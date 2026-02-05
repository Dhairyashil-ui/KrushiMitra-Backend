import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Animated, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: string; // Add image property
}

const demoResponses: Record<string, string> = {
  'what should i do today': '🌧️ Rain expected tomorrow, avoid spraying pesticides. Today is good for checking irrigation systems and preparing for the rain.',
  'weather': '🌤️ Today: Partly cloudy, 28°C. Tomorrow: Rain expected with 15mm precipitation. Wind speed: 12 km/h from southwest.',
  'pest control': '🐛 For effective pest control: 1) Inspect crops early morning, 2) Use neem oil spray for organic treatment, 3) Avoid chemical spraying before rain.',
  'fertilizer': '🌱 For current season: Apply NPK 19:19:19 @ 200kg/ha. Add organic compost for better soil health. Best time: Early morning or evening.',
  'crop disease': '🔍 Upload an image of affected plant for accurate diagnosis. Common signs: yellowing leaves, spots, wilting. Early detection is key for treatment.',
  'irrigation': '💧 Check soil moisture at 6-inch depth. Water deeply but less frequently. Drip irrigation saves 30-50% water compared to flood irrigation.',
};

export default function AIChatScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('aiChat.welcomeMessage'),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [glowAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Start glow animation for AI indicator
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();
    return () => glowLoop.stop();
  }, []);

  const pickImage = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(t('aiChat.permissionRequired'), t('aiChat.cameraPermissionMessage'));
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      console.log('Image picker result:', result);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        console.log('Selected image URI:', selectedImage);
        
        setIsUploading(true);
        
        // Create image message
        const imageMessage: Message = {
          id: Date.now().toString(),
          text: t('aiChat.imageUploadedForAnalysis'),
          isUser: true,
          timestamp: new Date(),
          image: selectedImage,
        };
        
        setMessages(prev => [...prev, imageMessage]);
        setIsUploading(false);
        
        // Simulate AI response
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: t('aiChat.imageAnalysisResponse'),
            isUser: false,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessage]);
        }, 2000);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('aiChat.errorTitle'), t('aiChat.imagePickerError'));
      setIsUploading(false);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Find appropriate response
    const query = inputText.toLowerCase();
    let response = t('aiChat.defaultResponse');

    for (const [key, value] of Object.entries(demoResponses)) {
      if (query.includes(key)) {
        response = value;
        break;
      }
    }

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 2000);

    setInputText('');
  };

  const renderMessage = (message: Message) => {
    console.log('Rendering message:', message);
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}>
        <View style={styles.messageHeader}>
          <LinearGradient
            colors={message.isUser 
              ? ['#3B82F6', '#2563EB'] 
              : ['#22C55E', '#16A34A']
            }
            style={styles.messageIcon}
          >
            {message.isUser ? (
              <User size={16} color="#FFFFFF" />
            ) : (
              <Bot size={16} color="#FFFFFF" />
            )}
          </LinearGradient>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        {message.image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: message.image }} 
              style={styles.chatImage}
              resizeMode="cover"
              onError={(error) => console.log('Image load error:', error)}
            />
          </View>
        )}
        
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {message.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.headerIcon}
            >
              <Bot size={24} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>KrushiAi</Text>
              <Text style={styles.headerSubtitle}>Neural Farming Assistant</Text>
            </View>
          </View>
          
          <Animated.View style={[
            styles.aiIndicator,
            {
              shadowOpacity: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              shadowRadius: glowAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 12],
              }),
            }
          ]}>
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.aiIndicatorGradient}
            >
              <Animated.View style={[
                styles.aiDot,
                {
                  opacity: glowAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }
              ]} />
              <Text style={styles.aiStatus}>Online</Text>
              <Sparkles size={12} color="#FFFFFF" style={styles.sparkleIcon} />
            </LinearGradient>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map(renderMessage)}
        {isTyping && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={styles.messageHeader}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.typingIcon}
              >
                <Bot size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.messageTime}>typing...</Text>
            </View>
            <View style={styles.typingIndicator}>
              <Animated.View style={[styles.typingDot, styles.dot1]} />
              <Animated.View style={[styles.typingDot, styles.dot2]} />
              <Animated.View style={[styles.typingDot, styles.dot3]} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <LinearGradient
          colors={['#F8FAFC', '#FFFFFF']}
          style={styles.inputGradient}
        >
          <TouchableOpacity 
            style={[styles.imageButton, isUploading && styles.disabledButton]} 
            onPress={pickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              // Show loading indicator while uploading
              <View style={styles.loadingIndicator}>
                <View style={styles.loadingDot} />
                <View style={[styles.loadingDot, { opacity: 0.7 }]} />
                <View style={[styles.loadingDot, { opacity: 0.4 }]} />
              </View>
            ) : (
              <ImageIcon size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Ask about weather, crops, pests..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={200}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.disabledSendButton]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? ['#3B82F6', '#2563EB'] : ['#D1D5DB', '#9CA3AF']}
              style={styles.sendButtonGradient}
            >
              <Send size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>{t('aiChat.quickSuggestions.title') || 'Quick Questions:'}</Text>
        <View style={styles.suggestionsRow}>
          <TouchableOpacity
            style={styles.suggestionChip}
            onPress={() => setInputText(t('aiChat.quickSuggestions.whatToDo'))}
          >
            <Text style={styles.suggestionText}>{t('aiChat.quickSuggestions.todaysTasks') || 'Today\'s Tasks'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestionChip}
            onPress={() => setInputText(t('aiChat.quickSuggestions.weatherForecast'))}
          >
            <Text style={styles.suggestionText}>{t('common.weather') || 'Weather'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.suggestionChip}
            onPress={() => setInputText(t('aiChat.quickSuggestions.pestControlTips'))}
          >
            <Text style={styles.suggestionText}>{t('aiChat.suggestions.pestControl') || 'Pest Control'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  aiIndicatorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  aiStatus: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sparkleIcon: {
    marginLeft: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageText: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    lineHeight: 20,
    fontSize: 14,
  },
  userMessageText: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
  },
  aiMessageText: {
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginHorizontal: 2,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    color: '#1F2937',
    marginRight: 12,
  },
  sendButton: {
    borderRadius: 20,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Typing indicator styles
  typingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: '85%',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  // Image styles
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#F8FAFC',
  },
  chatImage: {
    width: 200,
    height: 150,
  },
});
