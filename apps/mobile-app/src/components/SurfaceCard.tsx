import React from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { COLORS, SPACING, ROUNDED } from '../constants/theme';

export interface SurfaceCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accentColor?: string;
  accentPosition?: 'left' | 'top' | 'none';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export const SurfaceCard: React.FC<SurfaceCardProps> = ({
  children,
  onPress,
  accentColor,
  accentPosition = 'none',
  style,
  contentStyle,
  elevated = false,
}) => {
  const isInteractive = typeof onPress === 'function';

  const accentStyles: ViewStyle = {};
  if (accentColor && accentPosition === 'left') {
    accentStyles.borderLeftWidth = 3;
    accentStyles.borderLeftColor = accentColor;
  } else if (accentColor && accentPosition === 'top') {
    accentStyles.borderTopWidth = 3;
    accentStyles.borderTopColor = accentColor;
  }

  const containerStyles = [
    styles.card,
    elevated ? styles.elevated : styles.standard,
    accentStyles,
    style,
  ];

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyles,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.innerContent, contentStyle]}>{children}</View>
      </Pressable>
    );
  }

  return (
    <View style={containerStyles}>
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: ROUNDED.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  standard: {
    backgroundColor: COLORS.surface,
  },
  elevated: {
    backgroundColor: COLORS.surfaceHigh,
    borderColor: COLORS.borderStrong,
  },
  innerContent: {
    padding: SPACING.containerPadding,
  },
  pressed: {
    backgroundColor: COLORS.surfaceHigh,
    opacity: 0.92,
  },
});

export default SurfaceCard;
