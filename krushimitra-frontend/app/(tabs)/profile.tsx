import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, TextInput, Modal, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Bell, 
  LogOut, 
  
  ChevronRight, 
  Award, 
  BarChart3, 
  Settings, 
  Shield, 
  HelpCircle,
  Edit3,
  Smartphone,
  Mountain,
  Layers,
  Wheat,
  Sparkles
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: '',
    landSize: '',
    soilType: '',
    location: ''
  });
  const [rawUserRecord, setRawUserRecord] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const entries = await AsyncStorage.multiGet(['userData', 'selectedLanguage', 'userAddress']);
      const storedUser = entries.find(([key]) => key === 'userData')?.[1];
      const storedLanguage = entries.find(([key]) => key === 'selectedLanguage')?.[1];
      const storedAddress = entries.find(([key]) => key === 'userAddress')?.[1];

      let parsedUser: any = null;
      if (storedUser) {
        parsedUser = JSON.parse(storedUser);
        setRawUserRecord(parsedUser);
        const derivedProfile = {
          name: parsedUser?.profile?.name || parsedUser?.name || '',
          phone: parsedUser?.profile?.phone || parsedUser?.phone || '',
          email: parsedUser?.email || '',
          landSize: parsedUser?.profile?.landSize || '',
          soilType: parsedUser?.profile?.soilType || '',
          location: parsedUser?.profile?.location || parsedUser?.profile?.address || ''
        };
        setUserData(prev => ({
          ...prev,
          ...derivedProfile
        }));
      }

      if (storedAddress) {
        setUserData(prev => ({ ...prev, location: storedAddress }));
      }

      const languageNames: Record<string, string> = {
        'hi': 'Hindi',
        'en': 'English',
        'bn': 'Bengali',
        'ta': 'Tamil',
        'te': 'Telugu',
        'ml': 'Malayalam',
        'kn': 'Kannada',
        'gu': 'Gujarati',
        'mr': 'Marathi',
        'pa': 'Punjabi',
      };
      const langCode = storedLanguage || parsedUser?.preferredLanguage || parsedUser?.profile?.language;
      if (langCode) {
        setSelectedLanguage(languageNames[langCode] || 'Hindi');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData', 'userAddress']);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLogout = () => {
    const confirmationMessage = 'Are you sure you want to logout?';

    if (Platform.OS === 'web') {
      const shouldLogout = typeof window !== 'undefined' && window.confirm(confirmationMessage);
      if (shouldLogout) {
        void performLogout();
      }
      return;
    }

    Alert.alert(
      t('profile.logout'),
      confirmationMessage,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: () => {
            void performLogout();
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditData({
      name: userData.name,
      phone: userData.phone,
      landSize: userData.landSize,
      soilType: userData.soilType,
      location: userData.location
    });
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    try {
      const updatedData = {
        name: editData.name?.trim() || '',
        phone: editData.phone?.trim() || '',
        landSize: editData.landSize?.trim() || '',
        soilType: editData.soilType?.trim() || '',
        location: editData.location?.trim() || ''
      };
      setUserData(updatedData);

      const nextRawRecord = {
        ...(rawUserRecord || {}),
        name: updatedData.name || rawUserRecord?.name || '',
        phone: updatedData.phone || rawUserRecord?.phone || '',
        profile: {
          ...(rawUserRecord?.profile || {}),
          name: updatedData.name,
          phone: updatedData.phone,
          landSize: updatedData.landSize,
          soilType: updatedData.soilType,
          location: updatedData.location
        }
      };
      setRawUserRecord(nextRawRecord);

      await AsyncStorage.setItem('userData', JSON.stringify(nextRawRecord));
      if (updatedData.location) {
        await AsyncStorage.setItem('userAddress', updatedData.location);
      }
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const menuItems = [
    {
      id: 'language',
      title: t('profile.language'),
      subtitle: selectedLanguage,
      icon: Globe,
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      onPress: () => router.push('/language'),
    },
    {
      id: 'notifications',
      title: t('profile.notifications'),
      subtitle: 'Manage alerts and reminders',
      icon: Bell,
      color: '#FF9800',
      bgColor: '#FFF3E0',
      onPress: () => {},
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Data protection settings',
      icon: Shield,
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      onPress: () => {},
    },
    {
      id: 'general',
      title: t('profile.settings'),
      subtitle: 'App preferences',
      icon: Settings,
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
        >
          {/* Agriculture branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoContainer}>
              <Wheat size={24} color="#FFFFFF" />
              <Sparkles size={16} color="#FF9800" style={styles.sparkleIcon} />
            </View>
            <Text style={styles.appName}>KrushiAI Profile</Text>
          </View>
          
          <View style={styles.profileSection}>
            <View style={styles.profilePicture}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.profileGradient}
              >
                <User size={32} color="#4CAF50" />
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{userData?.name || 'Farmer'}</Text>
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>Verified Farmer</Text>
            </View>
            
            {/* Farming Information */}
            <View style={styles.farmingInfo}>
              <View style={styles.farmingInfoRow}>
                <View style={styles.infoItem}>
                  <Smartphone size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>+91 {userData?.phone || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Mountain size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.infoLabel}>Land Size</Text>
                  <Text style={styles.infoValue}>{userData?.landSize || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.farmingInfoRow}>
                <View style={styles.infoItem}>
                  <Layers size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.infoLabel}>Soil Type</Text>
                  <Text style={styles.infoValue}>{userData?.soilType || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MapPin size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{userData?.location || 'N/A'}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Edit3 size={16} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Account Overview</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValueText}>{userData?.name || 'Add your name'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValueText}>{userData?.email || 'Add your email'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValueText}>{userData?.phone || 'Add your phone number'}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={[styles.infoValueText, styles.infoValueMultiline]} numberOfLines={2}>
                {userData?.location || 'Allow location access to save your farm address'}
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.statGradient}
            >
              <BarChart3 size={24} color="#FFFFFF" />
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.statGradient}
            >
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}></Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              style={styles.statGradient}
            >
              <User size={24} color="#FFFFFF" />
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>AI Queries</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Enhanced Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: item.bgColor }]}>
                    <IconComponent size={20} color={item.color} />
                  </View>
                  <View style={styles.menuItemText}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Enhanced Support Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Support & Help</Text>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#FFF3E0' }]}>
                <Phone size={20} color="#FF9800" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Kisan Call Center</Text>
                <Text style={styles.menuItemSubtitle}>1800-180-1551 (24/7 Support)</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#D1D5DB" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: '#E8F5E8' }]}>
                <HelpCircle size={20} color="#4CAF50" />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>Help & FAQ</Text>
                <Text style={styles.menuItemSubtitle}>Get answers to common questions</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Enhanced Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={styles.logoutGradient}
            >
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>KrushiAI v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Smart India Hackathon</Text>
        </View>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F1F8E9']}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Wheat size={20} color="#4CAF50" />
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowEditModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.name}
                    onChangeText={(text) => setEditData({...editData, name: text})}
                    placeholder="Enter your full name"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.phone}
                    onChangeText={(text) => setEditData({...editData, phone: text})}
                    placeholder="Enter phone number"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Land Size</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.landSize}
                    onChangeText={(text) => setEditData({...editData, landSize: text})}
                    placeholder="e.g., 5.2 acres"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Soil Type</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.soilType}
                    onChangeText={(text) => setEditData({...editData, soilType: text})}
                    placeholder="e.g., Black Cotton Soil"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editData.location}
                    onChangeText={(text) => setEditData({...editData, location: text})}
                    placeholder="City, State"
                  />
                </View>
              </ScrollView>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelButton} 
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalSaveButton} onPress={saveProfile}>
                  <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.modalSaveGradient}
                  >
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  brandingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  logoContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  profileSection: {
    alignItems: 'center',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profileGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCD34D',
  },
  userDetails: {
    alignItems: 'center',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoValueText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  infoValueMultiline: {
    lineHeight: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  copyrightText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Enhanced Farming Info Styles
  farmingInfo: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  farmingInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalFields: {
    maxHeight: 300,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});