import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageTransition from '@/components/PageTransition';
import { Animated, AnimatedView } from '@/components/AnimatedCompat';
import { replaceWithTransition } from '@/src/utils/navigation';
import { useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const params = useLocalSearchParams();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.3)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const textSlideAnimation = useRef(new Animated.Value(30)).current;
  const particlesAnimation = useRef(new Animated.Value(0)).current;
  const gradientAnimation = useRef(new Animated.Value(0)).current;
  const [transitioning, setTransitioning] = useState(false);

  // Particle positions
  const particlePositions = useRef([
    new Animated.ValueXY({ x: -20, y: -20 }),
    new Animated.ValueXY({ x: width + 20, y: height / 3 }),
    new Animated.ValueXY({ x: width / 2, y: -20 }),
    new Animated.ValueXY({ x: -20, y: height / 2 }),
    new Animated.ValueXY({ x: width + 20, y: height + 20 }),
  ]).current;

  useEffect(() => {
    // Start animations
    startAnimations();

    const timeout = setTimeout(() => {
      setTransitioning(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (transitioning) {
      const shouldAutoLogin = String(params?.autologin || '').toLowerCase() === 'true';
      replaceWithTransition(shouldAutoLogin ? '/(tabs)' : '/language-selection');
    }
  }, [transitioning, params]);

  const startAnimations = () => {
    // Main entrance animation sequence
    Animated.sequence([
      // Fade in
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up logo
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();

    // Text slide in
    Animated.timing(textSlideAnimation, {
      toValue: 0,
      duration: 1000,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Gentle pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.08,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gradient animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnimation, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnimation, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Particle animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(particlePositions[0], {
            toValue: { x: width / 3, y: height / 4 },
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[0], {
            toValue: { x: -20, y: -20 },
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[1], {
            toValue: { x: width * 0.7, y: height / 2 },
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[1], {
            toValue: { x: width + 20, y: height / 3 },
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[2], {
            toValue: { x: width / 2, y: height * 0.7 },
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[2], {
            toValue: { x: width / 2, y: -20 },
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[3], {
            toValue: { x: width / 4, y: height * 0.8 },
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[3], {
            toValue: { x: -20, y: height / 2 },
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[4], {
            toValue: { x: width * 0.8, y: height / 3 },
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[4], {
            toValue: { x: width + 20, y: height + 20 },
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  return (
    <PageTransition isActive={!transitioning} type="scale">
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#FFFFFF', '#F1F8E9', '#E8F5E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Animated Particles */}
        {particlePositions.map((position, index) => (
          <AnimatedView
            key={index}
            style={[
              styles.particle,
              {
                transform: position.getTranslateTransform(),
                opacity: fadeAnimation,
                backgroundColor: index % 2 === 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(46, 125, 50, 0.2)',
                width: 8 + index * 2,
                height: 8 + index * 2,
                borderRadius: 4 + index,
              }
            ]}
          />
        ))}

        {/* Main Content */}
        <AnimatedView style={[
          styles.logoContainer,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
          }
        ]}>
          {/* Main Logo Circle with Glow Effect */}
          <AnimatedView style={[
            styles.logoCircle,
            {
              transform: [{ scale: pulseAnimation }],
            }
          ]}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32', '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <View style={styles.logoWrapper}>
                <Image
                  source={require('./logoai.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>

            {/* Glow Effect */}
            <AnimatedView style={[
              styles.glowEffect,
              {
                transform: [{ scale: pulseAnimation }],
                opacity: pulseAnimation.interpolate({
                  inputRange: [1, 1.08],
                  outputRange: [0.3, 0.6]
                })
              }
            ]} />
          </AnimatedView>

          {/* App Title */}
          <AnimatedView style={[
            styles.titleContainer,
            {
              transform: [{ translateY: textSlideAnimation }],
              opacity: fadeAnimation,
            }
          ]}>
            <Text style={styles.appName}>KrushiMitra</Text>
            <Text style={styles.tagline}>स्मार्ट खेती समाधान</Text>
            <Text style={styles.subtitle}>कृत्रिम बुद्धिमत्ता तकनीक के साथ किसानों को सशक्त बनाना</Text>

            {/* Loading Indicator */}
            <View style={styles.loadingContainer}>
              <AnimatedView style={[
                styles.loadingBar,
                {
                  width: particlesAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} />
            </View>
          </AnimatedView>
        </AnimatedView>

        {/* Bottom Animated Text */}
        <AnimatedView style={[
          styles.bottomTextContainer,
          {
            opacity: fadeAnimation,
            transform: [{ translateY: textSlideAnimation }]
          }
        ]}>
          <Text style={styles.bottomText}>AI सिस्टम शुरू कर रहे हैं...</Text>
        </AnimatedView>
      </View>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    backgroundColor: '#4CAF50',
    opacity: 0.4,
    zIndex: -1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 52,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(46, 125, 50, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 20,
    color: '#4CAF50',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    marginBottom: 24,
    lineHeight: 24,
  },
  loadingContainer: {
    width: 200,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10,
  },
  loadingBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.5,
  },
});