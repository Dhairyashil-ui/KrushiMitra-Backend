import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  
  Alert,
  Image,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  MapPin,
  Camera,
  Upload,
  Leaf,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  TreePine,
  Sprout,
  Wheat
} from 'lucide-react-native';

export default function CarboSafeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedPractice, setSelectedPractice] = useState<string>('');
  const [showEstimate, setShowEstimate] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<number>(0);

  const practices = [
    { id: 'tree-planting', name: 'Tree Planting', icon: TreePine, description: 'Plant trees for carbon sequestration' },
    { id: 'agroforestry', name: 'Agroforestry', icon: Sprout, description: 'Integrate trees with crops' },
    { id: 'organic-farming', name: 'Organic Farming', icon: Wheat, description: 'Chemical-free sustainable farming' }
  ];

  const transactions = [
    { id: 1, practice: 'Mangrove Planting', status: 'Pending Verification', amount: '₹500', icon: Clock },
    { id: 2, practice: 'Cover Crops', status: 'Approved', amount: '₹700', icon: CheckCircle },
    { id: 3, practice: 'Tree Planting', status: 'Approved', amount: '₹1,200', icon: CheckCircle },
    { id: 4, practice: 'Organic Composting', status: 'Pending Verification', amount: '₹300', icon: Clock }
  ];

  const handlePracticeSelect = (practiceId: string) => {
    setSelectedPractice(practiceId);
  };

  const handlePhotoUpload = () => {
    setUploadedPhotos(prev => Math.min(prev + 1, 3));
    Alert.alert('Photo Uploaded', 'Photo uploaded successfully (demo only)');
  };

  const handleEstimateCredits = () => {
    if (!selectedPractice) {
      Alert.alert('Select Practice', 'Please select a practice first');
      return;
    }
    
    setShowEstimate(true);
    Alert.alert(
      'Carbon Credits Estimated!', 
      'Estimated Credits: 3.2 tCO₂e\nPotential Earnings: ₹1,200/year\n\nThis is a demo estimate.'
    );
  };

  const handleWithdraw = () => {
    Alert.alert('Withdrawal Request', 'Withdrawal request submitted (demo only)');
  };

  const getRandomEstimate = () => {
    const credits = (Math.random() * 5 + 1).toFixed(1);
    const earnings = Math.floor(Math.random() * 2000 + 500);
    return { credits, earnings };
  };

  const estimate = getRandomEstimate();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🌱 {t('carboSafe.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('carboSafe.earnCredits')}</Text>
          </View>
        </View>

        {/* Intro Section */}
        <View style={styles.introSection}>
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
            style={styles.introCard}
          >
            <View style={styles.introContent}>
              <Leaf size={32} color="#22C55E" />
              <Text style={styles.introTitle}>Earn While You Farm Sustainably</Text>
              <Text style={styles.introText}>
                Kerala farmers can earn extra income by adopting eco-friendly practices like tree planting, 
                mangrove restoration, or organic farming. Upload your farm details to estimate your potential carbon credits.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Step-by-Step Guide */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          {/* Step 1: Select Practice */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Select Practice</Text>
            </View>
            <View style={styles.practicesGrid}>
              {practices.map((practice) => (
                <TouchableOpacity
                  key={practice.id}
                  style={[
                    styles.practiceCard,
                    selectedPractice === practice.id && styles.practiceCardSelected
                  ]}
                  onPress={() => handlePracticeSelect(practice.id)}
                >
                  <practice.icon 
                    size={24} 
                    color={selectedPractice === practice.id ? '#FFFFFF' : '#22C55E'} 
                  />
                  <Text style={[
                    styles.practiceName,
                    selectedPractice === practice.id && styles.practiceNameSelected
                  ]}>
                    {practice.name}
                  </Text>
                  <Text style={[
                    styles.practiceDescription,
                    selectedPractice === practice.id && styles.practiceDescriptionSelected
                  ]}>
                    {practice.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 2: Mark Field */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Mark Your Field</Text>
            </View>
            <View style={styles.mapContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/300x200/22C55E/FFFFFF?text=Field+Map' }}
                style={styles.mapPlaceholder}
              />
              <View style={styles.mapOverlay}>
                <MapPin size={24} color="#FFFFFF" />
                <Text style={styles.mapText}>Tap to mark your field location</Text>
              </View>
            </View>
          </View>

          {/* Step 3: Upload Photos */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Upload Photos</Text>
            </View>
            <View style={styles.uploadSection}>
              <TouchableOpacity style={styles.uploadButton} onPress={handlePhotoUpload}>
                <Camera size={24} color="#22C55E" />
                <Text style={styles.uploadText}>Upload Farm Photos</Text>
                <Text style={styles.uploadSubtext}>2-3 photos recommended</Text>
              </TouchableOpacity>
              {uploadedPhotos > 0 && (
                <View style={styles.uploadStatus}>
                  <CheckCircle size={16} color="#22C55E" />
                  <Text style={styles.uploadStatusText}>
                    {uploadedPhotos} photo{uploadedPhotos > 1 ? 's' : ''} uploaded
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Step 4: Estimate Credits */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>Estimate Credits</Text>
            </View>
            <TouchableOpacity style={styles.estimateButton} onPress={handleEstimateCredits}>
              <LinearGradient
                colors={['#22C55E', '#16A34A', '#15803D']}
                style={styles.estimateButtonGradient}
              >
                <TrendingUp size={20} color="#FFFFFF" />
                <Text style={styles.estimateButtonText}>Estimate Credits</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carbon Credit Estimation Results */}
        {showEstimate && (
          <View style={styles.estimateSection}>
            <Text style={styles.sectionTitle}>Your Carbon Credit Estimate</Text>
            <LinearGradient
              colors={['#F0FDF4', '#DCFCE7']}
              style={styles.estimateCard}
            >
              <View style={styles.estimateContent}>
                <Leaf size={40} color="#22C55E" />
                <Text style={styles.estimateTitle}>Estimated Credits</Text>
                <Text style={styles.estimateCredits}>{estimate.credits} tCO₂e</Text>
                <Text style={styles.estimateEarnings}>Potential Earnings: ₹{estimate.earnings}/year</Text>
                <Text style={styles.estimateNote}>
                  *This is a demo estimate. Real verification required for actual credits.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    <transaction.icon size={20} color="#22C55E" />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionPractice}>{transaction.practice}</Text>
                    <Text style={styles.transactionStatus}>{transaction.status}</Text>
                  </View>
                </View>
                <Text style={styles.transactionAmount}>{transaction.amount}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              style={styles.withdrawButtonGradient}
            >
              <DollarSign size={20} color="#FFFFFF" />
              <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Text style={styles.demoNoticeText}>
            This is a demo. In production, CarboSafe will verify practices via satellite and aggregate credits for sale.
          </Text>
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 10,
  },
  backButton: {
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
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  introSection: {
    marginBottom: 24,
  },
  introCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  introContent: {
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  stepsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingLeft: 4,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  practicesGrid: {
    gap: 12,
  },
  practiceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  practiceCardSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#16A34A',
  },
  practiceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  practiceNameSelected: {
    color: '#FFFFFF',
  },
  practiceDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  practiceDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  mapContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  uploadSection: {
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    width: '100%',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
    marginTop: 8,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  uploadStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadStatusText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '500',
  },
  estimateButton: {
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  estimateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  estimateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  estimateSection: {
    marginBottom: 24,
  },
  estimateCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  estimateContent: {
    alignItems: 'center',
  },
  estimateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  estimateCredits: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 8,
  },
  estimateEarnings: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  estimateNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionsList: {
    gap: 12,
    marginBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionPractice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  withdrawButton: {
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  demoNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  demoNoticeText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
