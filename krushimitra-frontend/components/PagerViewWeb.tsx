import React from 'react';
import { View, ViewProps } from 'react-native';

interface PagerViewProps extends ViewProps {
  initialPage?: number;
  onPageSelected?: (event: { nativeEvent: { position: number } }) => void;
  children?: React.ReactNode;
}

// Web-compatible PagerView component
export default function PagerView({ children, style, ...props }: PagerViewProps) {
  return (
    <View style={[{ flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
}