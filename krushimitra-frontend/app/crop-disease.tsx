import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
  Alert,
  Image,
  Dimensions,
  Easing,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Upload,
  Camera,
  Leaf,
  Eye,
  Sun,
  Focus,
  AlertCircle,
  CheckCircle,
  Zap,
  Shield,
  Activity,
  Sparkles,
  Save,
  Share2,
  Scan,
  Bug
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// API Response Interfaces
interface PlantIdentification {
  success: boolean;
  plant_scientific: string;
  plant_common: string;
  confidence: number;
  source: string;
}

interface DiseaseDetection {
  success: boolean;
  disease: string;
  confidence: number;
  details: string;
  severity?: string;
  advice?: string;
}

interface AISolution {
  treatment: string;
  prevention: string[];
  tips: string[];
}

interface AnalysisResult {
  success: boolean;
  plant_identification: PlantIdentification;
  disease_detection: DiseaseDetection;
  ai_solution?: AISolution;
  message?: string;
  crop?: string;
}

export default function CropDiseaseDetectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // Animation refs
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const uploadImageToBackend = async (uri: string) => {
    try {
      setIsScanning(true);
      setAnalysisResult(null);

      const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      const formData = new FormData();
      // @ts-ignore - ReactNative FormData expects 'uri', 'name', 'type'
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
      formData.append('organ', 'leaf'); // Default to leaf as requested

      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Analysis Result:", data);

      if (data.success) {
        setAnalysisResult(data);
      } else {
        Alert.alert('Analysis Failed', data.message || 'Could not analyze image.');
        setAnalysisResult(null); // Clear result on failure
      }

    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Failed to connect to the server.');
    } finally {
      setIsScanning(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera access is needed.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Gallery access is needed.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        uploadImageToBackend(uri);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50'; // High - Green
    if (score >= 0.5) return '#F59E0B'; // Medium - Orange
    return '#EF4444'; // Low - Red
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9', '#E8F5E8']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#4CAF50" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Crop Doctor</Text>
            <Text style={styles.headerSubtitle}>AI Disease Detection</Text>
          </View>
          <View style={styles.aiBadge}>
            <Sparkles size={16} color="#FFD700" />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Main Card */}
          <Animated.View style={[styles.mainCard, { opacity: fadeAnimation, transform: [{ scale: scaleAnimation }] }]}>
            <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.mainCardGradient}>

              {/* Image Preview Area */}
              <View style={styles.illustrationContainer}>
                {selectedImage ? (
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                    {isScanning && (
                      <View style={styles.scanningOverlay}>
                        <ActivityIndicator size="large" color="#4CAF50" />
                        <Text style={styles.scanningText}>Analyzing Crop...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Animated.View style={[styles.placeholderContainer, { transform: [{ scale: pulseAnimation }] }]}>
                    <Scan size={60} color="#4CAF50" />
                    <Text style={styles.placeholderText}>Upload specific crop leaf/fruit</Text>
                  </Animated.View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.galleryButton]}
                  onPress={() => pickImage(false)}
                  disabled={isScanning}
                >
                  <Upload size={24} color="#FFF" />
                  <Text style={styles.actionButtonText}>Upload Image</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cameraButton]}
                  onPress={() => pickImage(true)}
                  disabled={isScanning}
                >
                  <Camera size={24} color="#4CAF50" />
                  <Text style={styles.cameraButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>

            </LinearGradient>
          </Animated.View>

          {/* Results Section */}
          {analysisResult && (
            <Animated.View style={[styles.resultsContainer, { opacity: fadeAnimation }]}>

              {/* Crop Information */}
              {analysisResult.crop && (
                <View style={styles.resultCard}>
                  <View style={styles.sectionHeader}>
                    <Leaf size={20} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Crop Information</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>Detected Crop:</Text>
                    <Text style={styles.value}>{analysisResult.crop}</Text>
                  </View>
                </View>
              )}

              {/* Plant Identification Result */}
              <View style={styles.resultCard}>
                <View style={styles.sectionHeader}>
                  <Leaf size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Plant Identification</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.label}>Common Name:</Text>
                  <Text style={styles.value}>{analysisResult.plant_identification.plant_common}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.label}>Scientific:</Text>
                  <Text style={[styles.value, styles.italic]}>{analysisResult.plant_identification.plant_scientific}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.label}>Confidence:</Text>
                  <Text style={[styles.value, { color: getConfidenceColor(analysisResult.plant_identification.confidence) }]}>
                    {(analysisResult.plant_identification.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.sourceTag}>
                  <Text style={styles.sourceText}>Source: {analysisResult.plant_identification.source}</Text>
                </View>
              </View>

              {/* Disease Analysis Result */}
              <View style={styles.resultCard}>
                <View style={styles.sectionHeader}>
                  <Bug size={20} color={analysisResult.disease_detection.disease === 'Healthy' ? '#4CAF50' : '#EF4444'} />
                  <Text style={styles.sectionTitle}>Disease Analysis</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.label}>Status:</Text>
                  <Text style={[
                    styles.value,
                    {
                      color: analysisResult.disease_detection.disease === 'Healthy' ? '#4CAF50' : '#EF4444',
                      fontWeight: 'bold'
                    }
                  ]}>
                    {analysisResult.disease_detection.disease}
                  </Text>
                </View>
                
                {analysisResult.disease_detection.severity && (
                  <View style={styles.resultRow}>
                    <Text style={styles.label}>Severity:</Text>
                    <Text style={[styles.value, 
                      analysisResult.disease_detection.severity === 'High' ? { color: '#EF4444' } :
                      analysisResult.disease_detection.severity === 'Medium' ? { color: '#F59E0B' } :
                      { color: '#4CAF50' }
                    ]}>
                      {analysisResult.disease_detection.severity}
                    </Text>
                  </View>
                )}
                
                <View style={styles.resultRow}>
                  <Text style={styles.label}>Confidence:</Text>
                  <Text style={[styles.value, { color: getConfidenceColor(analysisResult.disease_detection.confidence) }]}>
                    {(analysisResult.disease_detection.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
                
                {analysisResult.disease_detection.details && (
                  <Text style={styles.detailsText}>{analysisResult.disease_detection.details}</Text>
                )}
              </View>

              {/* Treatment / Recommendations */}
              {analysisResult.disease_detection.disease !== 'Healthy' && (
                <View style={styles.resultCard}>
                  <View style={styles.sectionHeader}>
                    <Shield size={20} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Recommendations</Text>
                  </View>
                  
                  {/* Display AI advice if available */}
                  {analysisResult.disease_detection.advice ? (
                    <Text style={styles.recommendationText}>
                      {analysisResult.disease_detection.advice}
                    </Text>
                  ) : analysisResult.ai_solution ? (
                    <>
                      <Text style={styles.recommendationText}>
                        {analysisResult.ai_solution.treatment}
                      </Text>
                      {analysisResult.ai_solution.prevention && analysisResult.ai_solution.prevention.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={[styles.label, { marginBottom: 4 }]}>Prevention:</Text>
                          {analysisResult.ai_solution.prevention.map((tip, i) => (
                            <Text key={i} style={styles.detailsText}>• {tip}</Text>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={styles.recommendationText}>
                      Consult local agri-expert for specific advice.
                    </Text>
                  )}
                </View>
              )}

            </Animated.View>
          )}

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
  },
  aiBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  aiBadgeText: {
    marginLeft: 5,
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mainCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  mainCardGradient: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  illustrationContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F1F8E9',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#66BB6A',
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  galleryButton: {
    backgroundColor: '#2E7D32',
  },
  cameraButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cameraButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  sourceTag: {
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 5,
  },
  sourceText: {
    fontSize: 12,
    color: '#2E7D32',
  },
  detailsText: {
    marginTop: 5,
    color: '#4B5563',
    lineHeight: 20,
  },
  recommendationText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 22,
  }
});