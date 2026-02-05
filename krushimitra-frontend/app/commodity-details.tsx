import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  Platform,
  Animated,
  Image,
  Modal,
  FlatList,
  Dimensions,
  Alert,
  StatusBar,
  PanResponder
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera as ExpoCamera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

import { 
  MessageCircle, 
  Heart, 
  Share2, 
  Plus, 
  Camera, 
  Send,
  TrendingUp,
  Users,
  BookOpen,
  Wheat,
  Mic,
  Award,
  Trophy,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  Search,
  Volume2,
  Play,
  Pause,
  Bookmark,
  ThumbsUp,
  HelpCircle,
  Calendar,
  Target,
  Zap,
  Brain,
  Image as ImageIcon,
  Video,
  FileText,
  BarChart3,
  Timer,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  UserCheck,
  MessageSquare,
  Eye,
  Download,
  CameraIcon,
  VideoIcon,
  RotateCcw,
  Upload,
  X,
  Sparkles,
  Layers,
  Grid3X3,
  Scan,
  Focus,
  Flashlight,
  Settings,
  Tag,
  Type,
  Save,
  Share
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CommunityScreen({ navigation, route }: any) {
  // Safe navigation hooks with fallbacks
  const nav = useNavigation();
  const currentRoute = useRoute();
  
  // Ensure navigation and route are defined
  const safeNavigation = navigation || nav;
  const safeRoute = route || currentRoute;
  
  // Safe navigation function
  const safeGoBack = () => {
    try {
      if (safeNavigation?.goBack) {
        safeNavigation.goBack();
      } else {
        console.warn('Navigation not available');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Safe route params access with optional chaining
  const getRouteParams = () => {
    try {
      return safeRoute?.params || {};
    } catch (error) {
      console.error('Route params error:', error);
      return {};
    }
  };

  // State management
  const [activeTab, setActiveTab] = useState('feed');
  const [newPost, setNewPost] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecordingStopped, setIsRecordingStopped] = useState(false);
  const [durationTimer, setDurationTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showCropSolver, setShowCropSolver] = useState(false);
  const [userPoints, setUserPoints] = useState(1250);
  const [userBadges, setUserBadges] = useState(['Early Adopter', 'Helpful Farmer', 'Photo Expert']);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' or 'video'
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [cameraType, setCameraType] = useState('back' as any);
  const [flashMode, setFlashMode] = useState('off'); // 'off', 'on', 'auto'
  const [capturedMedia, setCapturedMedia] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mediaCaption, setMediaCaption] = useState('');
  const [mediaTags, setMediaTags] = useState<string[]>([]);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Language support
  
  // Community posts state
  const [communityPosts, setCommunityPosts] = useState([
    {
      id: 1,
      author: 'Ramesh Patil',
      location: 'Pune, Maharashtra',
      time: '2 hours ago',
      content: 'Great harvest this season! My tomato yield increased by 40% using the new fertilizer technique shared in this community. Thanks everyone! 🍅',
      likes: 24,
      comments: 8,
      shares: 3,
      image: null,
      category: 'Success Story',
      type: 'farmer',
      verified: true,
      trending: true
    },
    {
      id: 2,
      author: 'Dr. Priya Sharma',
      location: 'Agricultural Expert',
      time: '5 hours ago',
      content: 'Drip irrigation for cotton crops: Cost analysis shows 30% water savings and 25% yield increase. Initial setup cost ₹50,000/acre but ROI in 2 seasons.',
      likes: 45,
      comments: 23,
      shares: 12,
      image: null,
      category: 'Expert Advice',
      type: 'expert',
      verified: true,
      trending: false
    },
    {
      id: 3,
      author: 'AI Assistant',
      location: 'KrushiMitra AI',
      time: '1 hour ago',
      content: 'Weather Alert: Heavy rains expected in Maharashtra region. Recommended actions: 1) Cover crops with tarpaulins 2) Check drainage systems 3) Harvest ready crops early.',
      likes: 67,
      comments: 15,
      shares: 28,
      image: null,
      category: 'AI Alert',
      type: 'ai',
      verified: true,
      trending: true
    },
    {
      id: 4,
      author: 'Suresh Kumar',
      location: 'Solapur, Maharashtra',
      time: '3 hours ago',
      content: 'Found these spots on my wheat leaves. Can anyone help identify the disease?',
      likes: 12,
      comments: 8,
      shares: 2,
      image: 'https://example.com/wheat-disease.jpg',
      category: 'Crop Problem',
      type: 'farmer',
      verified: false,
      trending: false,
      needsHelp: true
    }
  ]);
  
  // Voice posting state
  const [isPostingVoice, setIsPostingVoice] = useState(false);
  const [userId] = useState('user_12345'); // Mock user ID - in real app, get from auth context
  
  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    Alert.alert(
      type === 'success' ? 'Success' : 'Error',
      message,
      [{ text: 'OK' }]
    );
  };

  // Cleanup function for voice recording states
  const cleanupVoiceStates = () => {
    setShowVoiceModal(false);
    setRecordedAudio(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setRecording(null);
    setIsPostingVoice(false);
    setIsRecordingStopped(false);
    if (durationTimer) {
      clearInterval(durationTimer);
      setDurationTimer(null);
    }
  };

  // Safe recording cleanup function
  const safeStopRecording = async (recordingInstance: Audio.Recording | null) => {
    if (!recordingInstance) {
      console.log('No recording instance to stop');
      return;
    }

    try {
      // Check if recording is still active (not already stopped/unloaded)
      if ((recordingInstance as any)._finalDurationMillis == null) {
        console.log('Stopping active recording');
        await recordingInstance.stopAndUnloadAsync();
        console.log('Recording stopped and unloaded successfully');
      } else {
        console.log('Recording already stopped/unloaded, skipping');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Don't throw error, just log it to prevent app crashes
    }
  };
  
  // Note: Backend Requirements for Voice Posts:
  // 1. Endpoint: POST /v1/community/posts
  // 2. Accept multipart/form-data with fields: userId, audioFile
  // 3. CORS enabled for your frontend domain
  // 4. Return JSON response with created post data
  
  // Development mode check
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

  // Global error handler for uncaught errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      if (isPostingVoice) {
        setIsPostingVoice(false);
        Alert.alert('Error', 'An unexpected error occurred while posting voice message. Please try again.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (isPostingVoice) {
        setIsPostingVoice(false);
        Alert.alert('Error', 'An unexpected error occurred while posting voice message. Please try again.');
      }
    };

    // Add error listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isPostingVoice]);
  
  // Camera permissions and refs
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<any>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Camera animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const hologramAnim = useRef(new Animated.Value(0)).current;
  const captureAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle route params safely with optional chaining
  useEffect(() => {
    try {
      const params = getRouteParams();
      if (params?.back) {
        // Handle back parameter if needed
        console.log('Back parameter received:', params.back);
      }
    } catch (error) {
      console.error('Error handling route params:', error);
    }
  }, [safeRoute]);

  // Request camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await ExpoCamera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === 'granted');
      
      // Note: Audio permissions are now requested when starting recording
      // to provide better user experience and context
    };

    requestPermissions();
  }, []);

  // Cleanup audio resources
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording && !isRecordingStopped) {
        // Clear duration timer
        if (durationTimer) {
          clearInterval(durationTimer);
        }
        // Use safe recording cleanup
        safeStopRecording(recording);
      }
    };
  }, [sound, recording, isRecordingStopped, durationTimer]);

  // Cleanup voice states on component unmount
  useEffect(() => {
    return () => {
      cleanupVoiceStates();
    };
  }, []);

  // Camera animations
  useEffect(() => {
    if (showCamera) {
      // Pulse animation for capture button
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Glow animation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // Particle animation
      const particleAnimation = Animated.loop(
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      // Hologram grid animation
      const hologramAnimation = Animated.loop(
        Animated.timing(hologramAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      glowAnimation.start();
      particleAnimation.start();
      hologramAnimation.start();

      return () => {
        pulseAnimation.stop();
        glowAnimation.stop();
        particleAnimation.stop();
        hologramAnimation.stop();
      };
    }
  }, [showCamera]);

  // Sample data for different sections

  const expertQA = [
    {
      id: 1,
      question: 'Best time to plant rice in Maharashtra?',
      expert: 'Dr. Rajesh Patil',
      answer: 'Plant rice between June 15-30 for optimal yield. Soil temperature should be 25-30°C.',
      likes: 34,
      aiSummary: 'Expert recommends mid-June planting with specific temperature requirements.'
    },
    {
      id: 2,
      question: 'How to control aphids organically?',
      expert: 'Dr. Meera Singh',
      answer: 'Use neem oil spray (2ml/liter) every 7 days. Introduce ladybugs as natural predators.',
      likes: 28,
      aiSummary: 'Organic control using neem oil and beneficial insects.'
    }
  ];

  const polls = [
    {
      id: 1,
      question: 'Which crop gives best profit this season?',
      options: ['Tomato', 'Cotton', 'Sugarcane', 'Wheat'],
      votes: [45, 32, 28, 15],
      totalVotes: 120,
      timeLeft: '2 days',
      aiSuggested: true
    },
    {
      id: 2,
      question: 'Most effective irrigation method?',
      options: ['Drip', 'Sprinkler', 'Flood', 'Manual'],
      votes: [67, 23, 18, 12],
      totalVotes: 120,
      timeLeft: '5 days',
      aiSuggested: false
    }
  ];

  const events = [
    {
      id: 1,
      title: 'Organic Farming Workshop',
      date: '2024-02-15',
      time: '10:00 AM',
      location: 'Pune Agricultural Center',
      attendees: 45,
      countdown: '3 days',
      type: 'workshop'
    },
    {
      id: 2,
      title: 'Seed Distribution Drive',
      date: '2024-02-20',
      time: '9:00 AM',
      location: 'Nashik District Office',
      attendees: 120,
      countdown: '8 days',
      type: 'distribution'
    }
  ];

  const aiTips = [
    {
      id: 1,
      title: 'Soil Testing Before Planting',
      content: 'Test soil pH and nutrients 2 weeks before planting. Optimal pH: 6.0-7.0 for most crops.',
      category: 'Soil Management',
      bookmarked: false,
      aiGenerated: true
    },
    {
      id: 2,
      title: 'Water Conservation Tips',
      content: 'Mulch around plants to retain moisture. Use drip irrigation for 40% water savings.',
      category: 'Water Management',
      bookmarked: true,
      aiGenerated: true
    }
  ];

  const leaderboard = [
    { rank: 1, name: 'Ramesh Patil', points: 2450, badge: 'Expert Farmer' },
    { rank: 2, name: 'Priya Sharma', points: 2100, badge: 'Helpful Expert' },
    { rank: 3, name: 'Suresh Kumar', points: 1850, badge: 'Active Member' },
    { rank: 4, name: 'Meera Singh', points: 1650, badge: 'Photo Expert' },
    { rank: 5, name: 'Rajesh Patil', points: 1500, badge: 'Early Adopter' }
  ];

  // Helper functions
  const handleLike = (postId: number) => {
    // Real-time like functionality
    console.log('Liked post:', postId);
  };

  const handleComment = (postId: number) => {
    // Open comment modal
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: number) => {
    // Share functionality
    console.log('Share post:', postId);
  };

  // Start recording function with proper permission handling
  const startRecording = async () => {
    try {
      console.log('Requesting microphone permission...');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission not granted');
        Alert.alert('Permission Required', 'Microphone permission is required to record voice messages. Please enable it in your device settings.');
        return;
      }
      
      console.log('Setting audio mode for recording...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      console.log('Creating recording instance...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      if (newRecording) {
        setRecording(newRecording);
        setIsRecording(true);
        setIsRecordingStopped(false);
        setRecordingDuration(0);
        
        // Start duration timer that updates every second using getStatusAsync
        const timer = setInterval(async () => {
          try {
            if (newRecording) {
              const status = await newRecording.getStatusAsync();
              if (status.isRecording && status.durationMillis) {
                const durationSeconds = Math.floor(status.durationMillis / 1000);
                setRecordingDuration(durationSeconds);
              }
            }
          } catch (error) {
            console.error('Error getting recording status:', error);
          }
        }, 1000);
        
        setDurationTimer(timer);
        
        console.log('Recording started successfully');
      } else {
        throw new Error('Failed to create recording instance');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      
      // Reset state on error
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      setIsRecordingStopped(false);
      if (durationTimer) {
        clearInterval(durationTimer);
        setDurationTimer(null);
      }
    }
  };

  // Stop recording function with proper cleanup
  const stopRecording = async () => {
    try {
      if (!recording || isRecordingStopped) {
        console.log('No active recording to stop');
        return;
      }

      console.log('Stopping recording...');
      
      // Clear duration timer
      if (durationTimer) {
        clearInterval(durationTimer);
        setDurationTimer(null);
      }
      
      // Use safe recording cleanup
      await safeStopRecording(recording);
      
      const uri = recording.getURI();
      
      if (uri) {
        setRecordedAudio(uri);
        console.log('Recording saved:', uri);
        
        // Automatically post the audio after stopping
        await postVoiceMessage();
      } else {
        throw new Error('No recording URI available');
      }
      
      setRecording(null);
      setIsRecording(false);
      setIsRecordingStopped(true);
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
      
      // Reset state on error
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      setIsRecordingStopped(false);
      if (durationTimer) {
        clearInterval(durationTimer);
        setDurationTimer(null);
      }
    }
  };

  const handleVoiceRecord = async () => {
    try {
      if (isRecording) {
        // Stop recording and post automatically
        await stopRecording();
      } else {
        // Start recording using the dedicated function
        await startRecording();
      }
    } catch (error) {
      console.error('Error with audio recording:', error);
      Alert.alert('Recording Error', `Failed to ${isRecording ? 'stop' : 'start'} recording. Please try again.`);
      
      // Reset state on error
      setIsRecording(false);
      setRecording(null);
      setRecordingDuration(0);
      setIsRecordingStopped(false);
      if (durationTimer) {
        clearInterval(durationTimer);
        setDurationTimer(null);
      }
    }
  };

  const handleCropAnalysis = () => {
    setShowCropSolver(true);
  };

  const playRecordedAudio = async () => {
    try {
      if (recordedAudio) {
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedAudio },
          { shouldPlay: true }
        );
        setSound(newSound);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Failed to play audio.');
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const postVoiceMessage = async () => {
    // Prevent multiple simultaneous calls
    if (isPostingVoice) {
      console.log('Voice post already in progress, ignoring duplicate call');
      return;
    }

    try {
      if (!recordedAudio) {
        Alert.alert('No Recording', 'Please record a voice message first.');
        return;
      }

      console.log('Posting voice message:', recordedAudio);
      
      // Set loading state
      setIsPostingVoice(true);
      
      try {
        // Create FormData with correct structure
        const formData = new FormData();
        formData.append('userId', userId);
        
        // Append audio file with correct format
        const audioFileObj = {
          uri: recordedAudio,
          name: 'voiceMessage.m4a',
          type: 'audio/m4a'
        };
        formData.append('audioFile', audioFileObj as any);
        
        console.log('Sending FormData:', {
          userId: userId,
          audioFile: audioFileObj
        });
        
        // Mock response for development
        const response = {
          success: true,
          message: 'Voice message posted successfully (mock response)',
          data: {
            id: Date.now(),
            userId,
            timestamp: new Date().toISOString()
          }
        };
        console.log('API Response:', response);
        
        // Validate response structure
        if (!response) {
          throw new Error('No response received from server');
        }
        
        // Create new post object for the feed
        const newPost = {
          id: response.data?.id || Date.now(), // Use API response ID or generate unique ID
          author: 'You', // Current user
          location: 'Your Location',
          time: 'Just now',
          content: 'Voice Message', // Placeholder text
          likes: 0,
          comments: 0,
          shares: 0,
          image: null,
          audioFile: recordedAudio, // Store audio file reference
          category: 'Voice Post',
          type: 'farmer',
          verified: false,
          trending: false,
          isVoicePost: true,
          duration: recordingDuration
        };
        
        // Add the new post to the beginning of the feed
        setCommunityPosts(prevPosts => [newPost, ...prevPosts]);
        
        // Clear all states immediately after successful post
        cleanupVoiceStates();
        
        // Show success toast
        const successMessage = response.success && response.message?.includes('mock') 
          ? 'Voice message posted successfully! (Development mode - using mock response)'
          : 'Your voice message has been posted to the community!';
        showToast(successMessage, 'success');
        
      } catch (apiError) {
        console.error('API Error:', apiError);
        throw apiError; // Re-throw to be caught by outer catch
      }
      
    } catch (error) {
      console.error('Error posting voice message:', error);
      setIsPostingVoice(false);
      
      // Extract error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Show error toast with retry option
      const errorTitle = isDevelopment ? 'Development Mode - Backend Not Available' : 'Upload Failed';
      const errorDescription = isDevelopment 
        ? `Backend server is not running. In development mode, this would normally show a mock response. Error: ${errorMessage}`
        : `Failed to post voice message: ${errorMessage}. Please check your internet connection and try again.`;
        
      Alert.alert(
        errorTitle, 
        errorDescription,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              // Keep the recording so user can try again
              console.log('User cancelled retry');
            }
          },
          {
            text: 'Retry',
            onPress: () => {
              // Retry the upload
              postVoiceMessage();
            }
          }
        ]
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecordingState = () => {
    setRecordedAudio(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setRecording(null);
    setIsRecordingStopped(false);
    if (durationTimer) {
      clearInterval(durationTimer);
      setDurationTimer(null);
    }
  };

  // Safe navigation helper functions
  const handleBackPress = () => {
    safeGoBack();
  };

  const handleNavigate = (screenName: string, params?: any) => {
    try {
      if (safeNavigation?.navigate) {
        safeNavigation.navigate(screenName, params);
      } else {
        console.warn('Navigation not available for:', screenName);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Camera helper functions
  const handleCameraCapture = async () => {
    if (!cameraRef.current) return;

    // Capture animation
    Animated.sequence([
      Animated.timing(captureAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(captureAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      const capturedMedia = {
        uri: photo.uri,
        type: 'photo',
        timestamp: new Date().toISOString(),
        width: photo.width,
        height: photo.height,
      };
      
      setCapturedMedia(capturedMedia);
      setShowPreview(true);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handleVideoRecord = async () => {
    if (!cameraRef.current) return;

    if (isRecordingVideo) {
      // Stop recording
      try {
        const video = await cameraRef.current.stopRecording();
        const capturedMedia = {
          uri: video.uri,
          type: 'video',
          timestamp: new Date().toISOString(),
        };
        
        setCapturedMedia(capturedMedia);
        setShowPreview(true);
        setShowCamera(false);
        setIsRecordingVideo(false);
      } catch (error) {
        console.error('Error stopping video:', error);
        Alert.alert('Error', 'Failed to stop video recording');
      }
    } else {
      // Start recording
      try {
        setIsRecordingVideo(true);
        await cameraRef.current.recordAsync({
          quality: '720p',
          maxDuration: 60, // 60 seconds max
        });
      } catch (error) {
        console.error('Error starting video:', error);
        Alert.alert('Error', 'Failed to start video recording');
        setIsRecordingVideo(false);
      }
    }
  };

  const handleCameraSwitch = () => {
    setCameraType(
      cameraType === 'back' ? 'front' : 'back'
    );
  };

  const handleFlashToggle = () => {
    const modes = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    setFlashMode(modes[(currentIndex + 1) % modes.length]);
  };

  const handleGalleryAccess = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const capturedMedia = {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'photo',
          timestamp: new Date().toISOString(),
          width: asset.width,
          height: asset.height,
        };
        
        setCapturedMedia(capturedMedia);
        setShowPreview(true);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Error accessing gallery:', error);
      Alert.alert('Error', 'Failed to access gallery');
    }
  };

  const handleAIAnalysis = () => {
    setShowAIAnalysis(true);
    // Simulate AI analysis
    const mockSuggestions = [
      { type: 'disease', confidence: 85, suggestion: 'Possible leaf spot disease detected' },
      { type: 'nutrient', confidence: 72, suggestion: 'Nitrogen deficiency may be present' },
      { type: 'pest', confidence: 68, suggestion: 'Check for aphid infestation' }
    ];
    setAiSuggestions(mockSuggestions);
  };

  const handleMediaPost = () => {
    // Simulate posting media
    console.log('Posting media:', { capturedMedia, mediaCaption, mediaTags });
    setShowPreview(false);
    setCapturedMedia(null);
    setMediaCaption('');
    setMediaTags([]);
    setShowAIAnalysis(false);
    setAiSuggestions([]);
  };

  // Language support
  const getText = (key: string): string => {
    const translations: { [key: string]: { [key: string]: string } } = {
      en: {
        camera: 'Camera',
        photo: 'Photo',
        video: 'Video',
        capture: 'Capture',
        record: 'Record',
        stop: 'Stop',
        switchCamera: 'Switch Camera',
        flash: 'Flash',
        gallery: 'Gallery',
        preview: 'Preview',
        caption: 'Add caption...',
        tags: 'Tags',
        aiAnalysis: 'AI Analysis',
        post: 'Post',
        cancel: 'Cancel',
        analyzing: 'Analyzing...',
        suggestions: 'AI Suggestions',
        disease: 'Disease Detection',
        nutrient: 'Nutrient Analysis',
        pest: 'Pest Detection',
        recording: 'Recording'
      },
      hi: {
        camera: 'कैमरा',
        photo: 'फोटो',
        video: 'वीडियो',
        capture: 'कैप्चर',
        record: 'रिकॉर्ड',
        stop: 'रोकें',
        switchCamera: 'कैमरा बदलें',
        flash: 'फ्लैश',
        gallery: 'गैलरी',
        preview: 'पूर्वावलोकन',
        caption: 'कैप्शन जोड़ें...',
        tags: 'टैग',
        aiAnalysis: 'AI विश्लेषण',
        post: 'पोस्ट',
        cancel: 'रद्द करें',
        analyzing: 'विश्लेषण...',
        suggestions: 'AI सुझाव',
        disease: 'रोग पहचान',
        nutrient: 'पोषक तत्व विश्लेषण',
        pest: 'कीट पहचान',
        recording: 'रिकॉर्डिंग'
      }
    };
    return translations[selectedLanguage]?.[key] || translations.en[key] || key;
  };

  const renderPost = (post: any) => (
    <Animated.View 
      key={post.id} 
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={post.type === 'ai' ? ['#E3F2FD', '#F8FAFC'] : ['#FFFFFF', '#F8FAFC']}
        style={styles.postCardGradient}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={[
              styles.avatar,
              post.type === 'expert' && styles.expertAvatar,
              post.type === 'ai' && styles.aiAvatar
            ]}>
              {post.type === 'ai' ? (
                <Brain size={18} color="#2196F3" />
              ) : (
                <Text style={styles.avatarText}>{post.author.charAt(0)}</Text>
              )}
            </View>
            <View style={styles.authorDetails}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{post.author}</Text>
                {post.verified && <CheckCircle size={14} color="#4CAF50" />}
                {post.trending && <TrendingUp size={14} color="#FF9800" />}
              </View>
              <Text style={styles.postLocation}>{post.location} • {post.time}</Text>
            </View>
          </View>
          <View style={[
            styles.categoryTag, 
            post.category === 'Success Story' && styles.successTag,
            post.category === 'Question' && styles.questionTag,
            post.category === 'Weather Alert' && styles.alertTag,
            post.category === 'Expert Advice' && styles.expertTag,
            post.category === 'AI Alert' && styles.aiTag,
            post.category === 'Crop Problem' && styles.problemTag
          ]}>
            <Text style={[styles.categoryText, 
              post.category === 'Success Story' && styles.successText,
              post.category === 'Question' && styles.questionTagText,
              post.category === 'Weather Alert' && styles.alertText,
              post.category === 'Expert Advice' && styles.expertText,
              post.category === 'AI Alert' && styles.aiText,
              post.category === 'Crop Problem' && styles.problemText
            ]}>{post.category}</Text>
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Post Image/Video */}
        {post.image && (
          <View style={styles.postMedia}>
            <Image source={{ uri: post.image }} style={styles.postImage} />
            {post.needsHelp && (
              <View style={styles.helpOverlay}>
                <TouchableOpacity style={styles.analyzeButton} onPress={handleCropAnalysis}>
                  <Eye size={16} color="#FFFFFF" />
                  <Text style={styles.analyzeText}>Analyze with AI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Voice Post Audio Player */}
        {post.isVoicePost && post.audioFile && (
          <View style={styles.voicePostContainer}>
            <View style={styles.voicePostHeader}>
              <Mic size={16} color="#4CAF50" />
              <Text style={styles.voicePostLabel}>Voice Message</Text>
              <Text style={styles.voicePostDuration}>{formatDuration(post.duration || 0)}</Text>
            </View>
            <View style={styles.voicePostControls}>
              <TouchableOpacity 
                style={styles.voicePlayButton} 
                onPress={() => {
                  // Play the voice message
                  if (post.audioFile) {
                    playRecordedAudio();
                  }
                }}
              >
                <Play size={20} color="#4CAF50" />
              </TouchableOpacity>
              <View style={styles.voiceProgressBar}>
                <View style={styles.voiceProgressFill} />
              </View>
            </View>
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
            <Heart size={20} color="#4CAF50" />
            <Text style={styles.actionText}>{post.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleComment(post.id)}>
            <MessageCircle size={20} color="#4CAF50" />
            <Text style={styles.actionText}>{post.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post.id)}>
            <Share2 size={20} color="#4CAF50" />
            <Text style={styles.actionText}>{post.shares}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Bookmark size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderExpertQA = (qa: any) => (
    <View key={qa.id} style={styles.qaCard}>
      <LinearGradient colors={['#F0F9FF', '#FFFFFF']} style={styles.qaGradient}>
        <View style={styles.qaHeader}>
          <View style={styles.expertBadge}>
            <UserCheck size={16} color="#2196F3" />
            <Text style={styles.expertBadgeText}>Expert Answer</Text>
          </View>
          <Text style={styles.expertName}>{qa.expert}</Text>
        </View>
        <Text style={styles.questionText}>{qa.question}</Text>
        <Text style={styles.answerText}>{qa.answer}</Text>
        <View style={styles.aiSummary}>
          <Brain size={14} color="#9CA3AF" />
          <Text style={styles.aiSummaryText}>{qa.aiSummary}</Text>
        </View>
        <View style={styles.qaActions}>
          <TouchableOpacity style={styles.qaActionButton}>
            <ThumbsUp size={16} color="#4CAF50" />
            <Text style={styles.qaActionText}>{qa.likes}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPoll = (poll: any) => (
    <View key={poll.id} style={styles.pollCard}>
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.pollGradient}>
        <View style={styles.pollHeader}>
          <Text style={styles.pollQuestion}>{poll.question}</Text>
          {poll.aiSuggested && (
            <View style={styles.aiSuggestedBadge}>
              <Brain size={12} color="#2196F3" />
              <Text style={styles.aiSuggestedText}>AI Suggested</Text>
            </View>
          )}
        </View>
        <View style={styles.pollOptions}>
          {poll.options.map((option: string, index: number) => {
            const percentage = (poll.votes[index] / poll.totalVotes) * 100;
            return (
              <TouchableOpacity key={index} style={styles.pollOption}>
                <View style={styles.pollOptionContent}>
                  <Text style={styles.pollOptionText}>{option}</Text>
                  <Text style={styles.pollVotes}>{poll.votes[index]} votes</Text>
                </View>
                <View style={styles.pollBar}>
                  <View style={[styles.pollBarFill, { width: `${percentage}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.pollFooter}>
          <Text style={styles.pollTotalVotes}>{poll.totalVotes} total votes</Text>
          <View style={styles.pollTimer}>
            <Clock size={14} color="#9CA3AF" />
            <Text style={styles.pollTimeLeft}>{poll.timeLeft} left</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEvent = (event: any) => (
    <View key={event.id} style={styles.eventCard}>
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.eventGradient}>
        <View style={styles.eventHeader}>
          <Calendar size={20} color="#4CAF50" />
          <Text style={styles.eventTitle}>{event.title}</Text>
        </View>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetail}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.eventDetailText}>{event.date} at {event.time}</Text>
          </View>
          <View style={styles.eventDetail}>
            <MapPin size={14} color="#6B7280" />
            <Text style={styles.eventDetailText}>{event.location}</Text>
          </View>
          <View style={styles.eventDetail}>
            <Users size={14} color="#6B7280" />
            <Text style={styles.eventDetailText}>{event.attendees} attending</Text>
          </View>
        </View>
        <View style={styles.eventCountdown}>
          <Timer size={16} color="#FF9800" />
          <Text style={styles.countdownText}>{event.countdown}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderAITip = (tip: any) => (
    <View key={tip.id} style={styles.tipCard}>
      <LinearGradient colors={['#FFF8E1', '#FFFFFF']} style={styles.tipGradient}>
        <View style={styles.tipHeader}>
          <Lightbulb size={20} color="#FF9800" />
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <TouchableOpacity style={styles.bookmarkButton}>
            <Bookmark size={16} color={tip.bookmarked ? "#FF9800" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.tipContent}>{tip.content}</Text>
        <View style={styles.tipFooter}>
          <Text style={styles.tipCategory}>{tip.category}</Text>
          {tip.aiGenerated && (
            <View style={styles.aiGeneratedBadge}>
              <Brain size={12} color="#2196F3" />
              <Text style={styles.aiGeneratedText}>AI Generated</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const renderLeaderboardItem = (item: any) => (
    <View key={item.rank} style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        {item.rank <= 3 ? (
          <Trophy size={20} color={item.rank === 1 ? "#FFD700" : item.rank === 2 ? "#C0C0C0" : "#CD7F32"} />
        ) : (
          <Text style={styles.rankNumber}>{item.rank}</Text>
        )}
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerBadge}>{item.badge}</Text>
      </View>
      <Text style={styles.playerPoints}>{item.points} pts</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9', '#E8F5E8']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.3 }}
      >
        {/* Header with Gamification */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <ChevronRight size={24} color="#4CAF50" style={styles.backIcon} />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Wheat size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Community</Text>
                <Text style={styles.headerSubtitle}>Share, Learn, Grow Together</Text>
              </View>
            </View>
            <View style={styles.headerStats}>
              <View style={styles.pointsContainer}>
                <Award size={16} color="#FF9800" />
                <Text style={styles.pointsText}>{userPoints}</Text>
              </View>
              <View style={styles.badgesContainer}>
                {userBadges.slice(0, 2).map((badge, index) => (
                  <View key={index} style={styles.badgeMini}>
                    <Star size={12} color="#FF9800" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'feed', label: 'Feed', icon: MessageSquare },
              { id: 'qa', label: 'Q&A', icon: HelpCircle },
              { id: 'polls', label: 'Polls', icon: BarChart3 },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'tips', label: 'AI Tips', icon: Lightbulb },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
              >
                <tab.icon size={16} color={activeTab === tab.id ? "#4CAF50" : "#9CA3AF"} />
                <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Create Post Section */}
          <TouchableOpacity 
            style={styles.createPostCard}
            onPress={() => setShowCreatePost(!showCreatePost)}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.createPostGradient}
            >
              <View style={styles.createPostHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>F</Text>
                </View>
                <Text style={styles.createPostText}>Share your farming experience...</Text>
              </View>
              <View style={styles.createPostActions}>
                <TouchableOpacity style={styles.createAction} onPress={() => setShowCamera(true)}>
                  <Camera size={20} color="#4CAF50" />
                  <Text style={styles.createActionText}>{getText('photo')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createAction} onPress={() => setShowVoiceModal(true)}>
                  <Mic size={20} color="#4CAF50" />
                  <Text style={styles.createActionText}>Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createAction} onPress={() => setShowPollModal(true)}>
                  <BarChart3 size={20} color="#4CAF50" />
                  <Text style={styles.createActionText}>Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createAction} onPress={handleCropAnalysis}>
                  <Eye size={20} color="#4CAF50" />
                  <Text style={styles.createActionText}>Crop Help</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Expandable Create Post Form */}
          {showCreatePost && (
            <View style={styles.createPostForm}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.createPostFormGradient}
              >
                <TextInput
                  style={styles.postInput}
                  placeholder="What's happening in your farm today?"
                  value={newPost}
                  onChangeText={setNewPost}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.postFormActions}>
                  <TouchableOpacity style={styles.attachButton}>
                    <Camera size={20} color="#4CAF50" />
                    <Text style={styles.attachText}>Add Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.postButton, newPost.length > 0 && styles.postButtonActive]}
                    disabled={newPost.length === 0}
                  >
                    <Send size={16} color={newPost.length > 0 ? "#FFFFFF" : "#9CA3AF"} />
                    <Text style={[styles.postButtonText, newPost.length > 0 && styles.postButtonTextActive]}>
                      Post
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Content based on active tab */}
          {activeTab === 'feed' && (
            <View style={styles.postsContainer}>
              <Text style={styles.postsTitle}>Community Feed</Text>
              {communityPosts.map(renderPost)}
            </View>
          )}

          {activeTab === 'qa' && (
            <View style={styles.qaContainer}>
              <Text style={styles.postsTitle}>Expert Q&A</Text>
              {expertQA.map(renderExpertQA)}
            </View>
          )}

          {activeTab === 'polls' && (
            <View style={styles.pollsContainer}>
              <Text style={styles.postsTitle}>Community Polls</Text>
              {polls.map(renderPoll)}
            </View>
          )}

          {activeTab === 'events' && (
            <View style={styles.eventsContainer}>
              <Text style={styles.postsTitle}>Upcoming Events</Text>
              {events.map(renderEvent)}
            </View>
          )}

          {activeTab === 'tips' && (
            <View style={styles.tipsContainer}>
              <Text style={styles.postsTitle}>AI Farming Tips</Text>
              {aiTips.map(renderAITip)}
            </View>
          )}

          {activeTab === 'leaderboard' && (
            <View style={styles.leaderboardContainer}>
              <Text style={styles.postsTitle}>Community Leaderboard</Text>
              {leaderboard.map(renderLeaderboardItem)}
            </View>
          )}
        </ScrollView>

        {/* Voice Recording Modal */}
        <Modal visible={showVoiceModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.voiceModal}>
              <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.voiceModalGradient}>
                <Text style={styles.voiceModalTitle}>Voice Post</Text>
                <View style={styles.voiceControls}>
                  <TouchableOpacity 
                    style={[styles.recordButton, isRecording && styles.recordingButton]}
                    onPress={handleVoiceRecord}
                  >
                    <Mic size={24} color={isRecording ? "#FFFFFF" : "#4CAF50"} />
                  </TouchableOpacity>
                  <Text style={styles.voiceStatus}>
                    {isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 
                     recordedAudio ? `Recording complete (${formatDuration(recordingDuration)})` : 'Tap to start recording'}
                  </Text>
                  
                  {/* Audio playback controls */}
                  {recordedAudio && !isRecording && (
                    <View style={styles.audioPlaybackControls}>
                      <TouchableOpacity style={styles.playButton} onPress={playRecordedAudio}>
                        <Play size={20} color="#4CAF50" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.stopButton} onPress={stopAudio}>
                        <Pause size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.recordAgainButton} 
                        onPress={() => {
                          resetRecordingState();
                        }}
                      >
                        <Mic size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.audioDuration}>
                        Duration: {formatDuration(recordingDuration)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.voiceActions}>
                  <TouchableOpacity style={styles.voiceCancel} onPress={async () => {
                    // Clean up recording if active
                    if (recording && !isRecordingStopped) {
                      // Clear duration timer
                      if (durationTimer) {
                        clearInterval(durationTimer);
                        setDurationTimer(null);
                      }
                      // Use safe recording cleanup
                      await safeStopRecording(recording);
                      setRecording(null);
                    }
                    
                    // Reset all states
                    setShowVoiceModal(false);
                    setRecordedAudio(null);
                    setRecordingDuration(0);
                    setIsRecording(false);
                    setIsRecordingStopped(false);
                  }}>
                    <Text style={styles.voiceCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.voiceSubmit, 
                      (!recordedAudio || isPostingVoice) && styles.voiceSubmitDisabled
                    ]}
                    onPress={async () => {
                      try {
                        console.log('Voice post button pressed');
                        await postVoiceMessage();
                      } catch (error) {
                        console.error('Uncaught error in voice post button:', error);
                        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                      }
                    }}
                    disabled={!recordedAudio || isPostingVoice}
                  >
                    <Text style={[
                      styles.voiceSubmitText, 
                      (!recordedAudio || isPostingVoice) && styles.voiceSubmitTextDisabled
                    ]}>
                      {isPostingVoice ? 'Posting...' : 'Post Voice'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* Crop Problem Solver Modal */}
        <Modal visible={showCropSolver} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.cropModal}>
              <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.cropModalGradient}>
                <Text style={styles.cropModalTitle}>Crop Problem Solver</Text>
                <Text style={styles.cropModalSubtitle}>Upload an image of your crop issue for AI analysis</Text>
                <TouchableOpacity style={styles.uploadButton}>
                  <ImageIcon size={24} color="#4CAF50" />
                  <Text style={styles.uploadText}>Upload Image</Text>
                </TouchableOpacity>
                <View style={styles.cropActions}>
                  <TouchableOpacity style={styles.cropCancel} onPress={() => setShowCropSolver(false)}>
                    <Text style={styles.cropCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cropAnalyze}>
                    <Brain size={16} color="#FFFFFF" />
                    <Text style={styles.cropAnalyzeText}>Analyze</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        {/* Futuristic Camera Modal */}
        <Modal visible={showCamera} transparent animationType="slide">
          <StatusBar hidden />
          <View style={styles.cameraModalOverlay}>
            <View style={styles.cameraContainer}>
              {/* Camera Preview Area */}
              <View style={styles.cameraPreview}>
                {/* Holographic Grid Overlay */}
                <Animated.View 
                  style={[
                    styles.hologramGrid,
                    {
                      opacity: hologramAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.7],
                      }),
                    }
                  ]}
                >
                  <Grid3X3 size={width} color="#00FFFF" />
                </Animated.View>

                {/* Particle Effects */}
                <Animated.View 
                  style={[
                    styles.particleContainer,
                    {
                      opacity: particleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.8],
                      }),
                    }
                  ]}
                >
                  {[...Array(20)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.particle,
                        {
                          left: Math.random() * width,
                          top: Math.random() * 400,
                          transform: [
                            {
                              translateX: particleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, Math.random() * 100 - 50],
                              }),
                            },
                            {
                              translateY: particleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, Math.random() * 100 - 50],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
                </Animated.View>

                {/* Real Camera View */}
                {hasCameraPermission === null ? (
                  <View style={styles.mockCameraView}>
                    <Text style={styles.cameraPlaceholder}>{getText('analyzing')}</Text>
                  </View>
                ) : hasCameraPermission === false ? (
                  <View style={styles.mockCameraView}>
                    <Text style={styles.cameraPlaceholder}>Camera permission denied</Text>
                  </View>
                ) : (
                  <View style={styles.realCameraView}>
                    <Text style={styles.cameraPlaceholder}>Camera View</Text>
                  </View>
                )}
              </View>

              {/* Camera Controls */}
              <View style={styles.cameraControls}>
                {/* Top Controls */}
                <View style={styles.cameraTopControls}>
                  <TouchableOpacity style={styles.cameraControlButton} onPress={() => setShowCamera(false)}>
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.cameraModeSelector}>
                    <TouchableOpacity 
                      style={[styles.modeButton, cameraMode === 'photo' && styles.activeModeButton]}
                      onPress={() => setCameraMode('photo')}
                    >
                      <CameraIcon size={20} color={cameraMode === 'photo' ? "#000000" : "#FFFFFF"} />
                      <Text style={[styles.modeText, cameraMode === 'photo' && styles.activeModeText]}>
                        {getText('photo')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modeButton, cameraMode === 'video' && styles.activeModeButton]}
                      onPress={() => setCameraMode('video')}
                    >
                      <VideoIcon size={20} color={cameraMode === 'video' ? "#000000" : "#FFFFFF"} />
                      <Text style={[styles.modeText, cameraMode === 'video' && styles.activeModeText]}>
                        {getText('video')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.cameraControlButton} onPress={handleFlashToggle}>
                    <Flashlight size={24} color={flashMode === 'off' ? "#FFFFFF" : "#FFFF00"} />
                  </TouchableOpacity>
                </View>

                {/* Side Controls */}
                <View style={styles.cameraSideControls}>
                  <TouchableOpacity style={styles.cameraControlButton} onPress={handleCameraSwitch}>
                    <RotateCcw size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.cameraControlButton} onPress={handleGalleryAccess}>
                    <Upload size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View style={styles.cameraBottomControls}>
                  {/* Capture Button */}
                  <Animated.View
                    style={[
                      styles.captureButtonContainer,
                      {
                        transform: [
                          { scale: pulseAnim },
                          { scale: captureAnim },
                        ],
                      },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.captureButtonGlow,
                        {
                          opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 1],
                          }),
                        },
                      ]}
                    />
                    <TouchableOpacity 
                      style={styles.captureButton}
                      onPress={cameraMode === 'photo' ? handleCameraCapture : handleVideoRecord}
                    >
                      {cameraMode === 'video' && isRecordingVideo ? (
                        <View style={styles.stopIcon} />
                      ) : (
                        <View style={styles.captureIcon} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Recording Indicator */}
                  {cameraMode === 'video' && isRecordingVideo && (
                    <Animated.View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>{getText('recording')}</Text>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Media Preview Modal */}
        <Modal visible={showPreview} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.previewModal}>
              <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.previewModalGradient}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>{getText('preview')}</Text>
                  <TouchableOpacity onPress={() => setShowPreview(false)}>
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.previewContent}>
                  {capturedMedia?.type === 'video' ? (
                    <View style={styles.previewVideoContainer}>
                      <Text style={styles.videoPlaceholder}>Video Preview</Text>
                      <Text style={styles.videoInfo}>{capturedMedia.uri}</Text>
                    </View>
                  ) : (
                    <Image source={{ uri: capturedMedia?.uri }} style={styles.previewImage} />
                  )}
                  
                  <View style={styles.previewControls}>
                    <TextInput
                      style={styles.captionInput}
                      placeholder={getText('caption')}
                      value={mediaCaption}
                      onChangeText={setMediaCaption}
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                    
                    <TouchableOpacity style={styles.aiAnalysisButton} onPress={handleAIAnalysis}>
                      <Brain size={20} color="#00FFFF" />
                      <Text style={styles.aiAnalysisText}>{getText('aiAnalysis')}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AI Suggestions Overlay */}
                  {showAIAnalysis && (
                    <Animated.View style={styles.aiSuggestionsOverlay}>
                      <LinearGradient colors={['rgba(0,255,255,0.1)', 'rgba(0,255,255,0.05)']} style={styles.aiSuggestionsGradient}>
                        <Text style={styles.aiSuggestionsTitle}>{getText('suggestions')}</Text>
                        {aiSuggestions.map((suggestion, index) => (
                          <View key={index} style={styles.suggestionItem}>
                            <View style={styles.suggestionHeader}>
                              <Text style={styles.suggestionType}>
                                {suggestion.type === 'disease' ? getText('disease') :
                                 suggestion.type === 'nutrient' ? getText('nutrient') :
                                 getText('pest')}
                              </Text>
                              <Text style={styles.suggestionConfidence}>{suggestion.confidence}%</Text>
                            </View>
                            <Text style={styles.suggestionText}>{suggestion.suggestion}</Text>
                          </View>
                        ))}
                      </LinearGradient>
                    </Animated.View>
                  )}
                </View>

                <View style={styles.previewActions}>
                  <TouchableOpacity style={styles.previewCancel} onPress={() => setShowPreview(false)}>
                    <Text style={styles.previewCancelText}>{getText('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.previewPost} onPress={handleMediaPost}>
                    <Share size={16} color="#FFFFFF" />
                    <Text style={styles.previewPostText}>{getText('post')}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </LinearGradient>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  createPostCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostGradient: {
    padding: 16,
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  createPostText: {
    flex: 1,
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  createAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createActionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  createPostForm: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  createPostFormGradient: {
    padding: 16,
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 12,
    minHeight: 80,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postFormActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  attachText: {
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  postButtonActive: {
    backgroundColor: '#4CAF50',
  },
  postButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postButtonTextActive: {
    color: '#FFFFFF',
  },
  postsContainer: {
    marginBottom: 20,
  },
  qaContainer: {
    marginBottom: 20,
  },
  pollsContainer: {
    marginBottom: 20,
  },
  eventsContainer: {
    marginBottom: 20,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  leaderboardContainer: {
    marginBottom: 20,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  postCardGradient: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  expertAvatar: {
    backgroundColor: '#E3F2FD',
  },
  aiAvatar: {
    backgroundColor: '#E3F2FD',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  authorDetails: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  successTag: {
    backgroundColor: '#DCFCE7',
  },
  questionTag: {
    backgroundColor: '#DBEAFE',
  },
  alertTag: {
    backgroundColor: '#FEF3C7',
  },
  expertTag: {
    backgroundColor: '#E3F2FD',
  },
  aiTag: {
    backgroundColor: '#E3F2FD',
  },
  problemTag: {
    backgroundColor: '#FEE2E2',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  successText: {
    color: '#4CAF50',
  },
  questionTagText: {
    color: '#3B82F6',
  },
  alertText: {
    color: '#F59E0B',
  },
  expertText: {
    color: '#2196F3',
  },
  aiText: {
    color: '#2196F3',
  },
  problemText: {
    color: '#EF4444',
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postMedia: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  helpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  analyzeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Q&A Styles
  qaCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  qaGradient: {
    padding: 16,
  },
  qaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expertBadgeText: {
    fontSize: 10,
    color: '#2196F3',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  expertName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  answerText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  aiSummaryText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  qaActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  qaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qaActionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Poll Styles
  pollCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pollGradient: {
    padding: 16,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pollQuestion: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  aiSuggestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  aiSuggestedText: {
    fontSize: 8,
    color: '#2196F3',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pollOptions: {
    marginBottom: 16,
  },
  pollOption: {
    marginBottom: 12,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pollOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pollVotes: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pollBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollTotalVotes: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  pollTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pollTimeLeft: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Event Styles
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  eventGradient: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  countdownText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // AI Tips Styles
  tipCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipGradient: {
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  bookmarkButton: {
    padding: 4,
  },
  tipContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  aiGeneratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  aiGeneratedText: {
    fontSize: 8,
    color: '#2196F3',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Leaderboard Styles
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  playerBadge: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  playerPoints: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModal: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  voiceModalGradient: {
    padding: 24,
  },
  voiceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  voiceControls: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  voiceStatus: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  voiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voiceCancel: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  voiceCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  voiceSubmit: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
  },
  voiceSubmitText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  voiceSubmitDisabled: {
    backgroundColor: '#9CA3AF',
  },
  voiceSubmitTextDisabled: {
    color: '#6B7280',
  },
  audioPlaybackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F8E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  stopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  audioDuration: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  recordAgainButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  cropModal: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cropModalGradient: {
    padding: 24,
  },
  cropModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cropModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9',
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cropActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cropCancel: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  cropCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cropAnalyze: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    gap: 6,
  },
  cropAnalyzeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Futuristic Camera Styles
  cameraModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPreview: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  hologramGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#00FFFF',
    borderRadius: 2,
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  mockCameraView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  realCameraView: {
    flex: 1,
  },
  cameraPlaceholder: {
    fontSize: 24,
    color: '#00FFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  cameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  cameraControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  cameraModeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeModeButton: {
    backgroundColor: '#00FFFF',
  },
  modeText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  activeModeText: {
    color: '#000000',
  },
  cameraSideControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
    gap: 20,
  },
  cameraBottomControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  captureIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00FFFF',
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#FF0000',
    borderRadius: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordingText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Preview Modal Styles
  previewModal: {
    width: width * 0.95,
    height: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewModalGradient: {
    flex: 1,
    padding: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  previewContent: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 20,
  },
  previewVideoContainer: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFFF',
    borderStyle: 'dashed',
  },
  videoPlaceholder: {
    fontSize: 18,
    color: '#00FFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  videoInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  previewControls: {
    marginBottom: 20,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  aiAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
    gap: 8,
  },
  aiAnalysisText: {
    fontSize: 16,
    color: '#00FFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  aiSuggestionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiSuggestionsGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  aiSuggestionsTitle: {
    fontSize: 20,
    color: '#00FFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  suggestionItem: {
    backgroundColor: 'rgba(0,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionType: {
    fontSize: 14,
    color: '#00FFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  suggestionConfidence: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  previewCancel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewCancelText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  previewPost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00FFFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  previewPostText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Voice Post Styles
  voicePostContainer: {
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voicePostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  voicePostLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  voicePostDuration: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  voicePostControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    
    overflow: 'hidden',
  },
  voiceProgressFill: {
    height: '100%',
    width: '0%', // This would be updated based on playback progress
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});