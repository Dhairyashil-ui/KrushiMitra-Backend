import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export default function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  
  const handlePermissionDenied = () => {
    Alert.alert(
      'Location Permission Required',
      'We need your location to provide personalized weather and farming updates.',
      [
        { text: 'Skip', onPress: () => router.replace('/auth/login') },
        { text: 'Try Again', onPress: requestLocationPermission },
      ]
    );
  };

  const requestLocationPermission = async () => {
    setIsLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        handlePermissionDenied();
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      await AsyncStorage.setItem('userLocation', JSON.stringify(currentLocation));

      const [address] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address) {
        await AsyncStorage.setItem('userAddress', JSON.stringify(address));
      }

      router.replace('/auth/login');
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert(
        'Error',
        'Could not get your location. You can try again or skip this step.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const skipLocation = () => {
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>

        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.description}>
          Allow access to your location to receive local weather forecasts,
          nearby crop insights, and personalized farming advice.
        </Text>

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              ✅ Location detected: {location.coords.latitude.toFixed(2)}, {location.coords.longitude.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.enableButton, isLoading && styles.disabledButton]}
            onPress={requestLocationPermission}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.enableButtonText}>Enable Location</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={skipLocation}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  locationInfo: {
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginBottom: 24,
  },
  locationText: {
    color: '#22C55E',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
  },
  enableButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#A3A3A3',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
