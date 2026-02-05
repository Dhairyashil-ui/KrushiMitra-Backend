import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';

interface PageTransitionProps {
  children: React.ReactNode;
  isActive?: boolean;
  onAnimationComplete?: () => void;
  type?: 'fade' | 'slide' | 'scale' | 'slideFromRight';
}

const PageTransition = ({
  children,
  isActive = true,
  onAnimationComplete,
  type = 'fade'
}: PageTransitionProps) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.95)).current;
  const slideAnimation = useRef(new Animated.Value(100)).current;
  const slideFromRightAnimation = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (isActive) {
      let animation;

      switch (type) {
        case 'slide':
          animation = Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnimation, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            })
          ]);
          break;

        case 'slideFromRight':
          animation = Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(slideFromRightAnimation, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            })
          ]);
          break;

        case 'scale':
          animation = Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnimation, {
              toValue: 1,
              speed: 10,
              useNativeDriver: true,
            })
          ]);
          break;

        case 'fade':
        default:
          animation = Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          });
      }

      animation.start(() => {
        if (onAnimationComplete) onAnimationComplete();
      });
    } else {
      // Exit animations
      let animation;

      switch (type) {
        case 'slide':
          animation = Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnimation, {
              toValue: 100,
              duration: 200,
              useNativeDriver: true,
            })
          ]);
          break;

        case 'slideFromRight':
          animation = Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(slideFromRightAnimation, {
              toValue: 100,
              duration: 200,
              useNativeDriver: true,
            })
          ]);
          break;

        case 'scale':
          animation = Animated.parallel([
            Animated.timing(fadeAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnimation, {
              toValue: 0.95,
              duration: 200,
              useNativeDriver: true,
            })
          ]);
          break;

        case 'fade':
        default:
          animation = Animated.timing(fadeAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          });
      }

      animation.start();
    }
  }, [isActive, type]);

  const getTransformStyle = () => {
    switch (type) {
      case 'slide':
        return { transform: [{ translateY: slideAnimation }] };
      case 'slideFromRight':
        return { transform: [{ translateX: slideFromRightAnimation }] };
      case 'scale':
        return { transform: [{ scale: scaleAnimation }] };
      default:
        return {};
    }
  };

  return React.createElement(
    Animated.View,
    {
      style: [
        styles.container,
        {
          opacity: fadeAnimation,
        },
        getTransformStyle()
      ]
    },
    children
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageTransition;