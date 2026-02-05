import React from 'react';
import { Animated } from 'react-native';

// Wrapper components to fix React 19 type compatibility with Animated components
// These use React.createElement to bypass JSX type checking issues

interface AnimatedViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
}

export const AnimatedView = ({ style, children, ...props }: AnimatedViewProps) => {
    return React.createElement(Animated.View, { style, ...props }, children);
};

export const AnimatedText = ({ style, children, ...props }: any) => {
    return React.createElement(Animated.Text, { style, ...props }, children);
};

export const AnimatedImage = ({ style, source, ...props }: any) => {
    return React.createElement(Animated.Image, { style, source, ...props });
};

export const AnimatedScrollView = ({ style, children, ...props }: any) => {
    return React.createElement(Animated.ScrollView, { style, ...props }, children);
};

// Re-export Animated for other uses
export { Animated };
