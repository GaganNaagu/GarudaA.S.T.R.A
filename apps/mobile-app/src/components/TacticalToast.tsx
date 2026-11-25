import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, ROUNDED } from '../constants/theme';

export interface TacticalToastProps {
  message: string | null;
  type?: 'success' | 'warning' | 'info' | 'error';
  topOffset?: number;
  duration?: number;
  onDismiss?: () => void;
}

export const TacticalToast: React.FC<TacticalToastProps> = ({
  message,
  type = 'success',
  topOffset = 56,
  duration = 3200,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // Slide down and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        // Slide up and fade out
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -20,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onDismiss) onDismiss();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-30);
      opacity.setValue(0);
    }
  }, [message]);

  if (!message) return null;

  const getTheme = () => {
    switch (type) {
      case 'warning':
        return {
          border: 'rgba(245, 158, 11, 0.45)',
          glow: '#f59e0b',
          icon: 'warning' as const,
          iconColor: '#f59e0b',
        };
      case 'error':
        return {
          border: 'rgba(239, 68, 68, 0.45)',
          glow: '#ef4444',
          icon: 'error' as const,
          iconColor: '#ef4444',
        };
      case 'info':
        return {
          border: 'rgba(59, 130, 246, 0.45)',
          glow: '#3b82f6',
          icon: 'info' as const,
          iconColor: '#3b82f6',
        };
      case 'success':
      default:
        return {
          border: 'rgba(16, 185, 129, 0.45)',
          glow: '#10b981',
          icon: 'check-circle' as const,
          iconColor: '#10b981',
        };
    }
  };

  const theme = getTheme();

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlayContainer,
        { top: topOffset },
      ]}
    >
      <Animated.View
        style={[
          styles.toastCard,
          {
            borderColor: theme.border,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={[styles.glowBar, { backgroundColor: theme.glow }]} />
        <MaterialIcons
          name={theme.icon}
          size={18}
          color={theme.iconColor}
          style={styles.icon}
        />
        <Text style={styles.messageText} numberOfLines={2}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101520',
    borderWidth: 1.5,
    borderRadius: ROUNDED.MD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  glowBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
  },
  icon: {
    marginLeft: 4,
    marginRight: 10,
  },
  messageText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 12.5,
    lineHeight: 17,
    flex: 1,
  },
});
