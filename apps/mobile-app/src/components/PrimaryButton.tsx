import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap | React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; spinnerColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: '#e5a93c', // Rich sovereign imperial gold
            borderColor: 'transparent',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.20,
            shadowRadius: 3,
            elevation: 2,
          },
          text: {
            color: '#080d14',
            fontWeight: '800',
            letterSpacing: 0.8,
          },
          spinnerColor: '#080d14',
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1,
          },
          text: {
            color: '#e2e8f0',
            fontWeight: '700',
            letterSpacing: 0.5,
          },
          spinnerColor: '#e2e8f0',
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: COLORS.errorContainer,
            borderColor: COLORS.error,
            borderWidth: 1,
          },
          text: {
            color: COLORS.onError,
            fontWeight: '800',
            letterSpacing: 0.5,
          },
          spinnerColor: COLORS.onError,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'rgba(229, 169, 60, 0.4)',
            borderWidth: 1,
          },
          text: {
            color: '#e5a93c',
            fontWeight: '700',
            letterSpacing: 0.5,
          },
          spinnerColor: '#e5a93c',
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: {
            color: '#e5a93c',
            fontWeight: '700',
          },
          spinnerColor: '#e5a93c',
        };
      default:
        return {
          container: {
            backgroundColor: '#e5a93c',
            borderColor: 'transparent',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.20,
            shadowRadius: 3,
            elevation: 2,
          },
          text: {
            color: '#080d14',
            fontWeight: '800',
            letterSpacing: 0.8,
          },
          spinnerColor: '#080d14',
        };
    }
  };

  const getSizeStyles = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { height: 38, paddingHorizontal: 14, fontSize: 11 };
      case 'lg':
        return { height: 52, paddingHorizontal: 20, fontSize: 14 };
      case 'md':
      default:
        return { height: 46, paddingHorizontal: 16, fontSize: 13 };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return (
        <View style={styles.iconWrapper}>
          <MaterialIcons
            name={icon as any}
            size={size === 'sm' ? 16 : 18}
            color={(variantStyle.text.color as string) || '#080d14'}
          />
        </View>
      );
    }
    return <View style={styles.iconWrapper}>{icon as React.ReactNode}</View>;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        variantStyle.container,
        pressed && !disabled && !loading && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.spinnerColor} />
      ) : (
        <View style={styles.contentRow}>
          {renderIcon()}
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyle.fontSize },
              variantStyle.text,
              disabled && styles.disabledText,
              textStyle,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14, // Refined modern radius matching HIG and Android M3
    minHeight: 38,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  iconWrapper: {
    marginRight: 8,
  },
  text: {
    ...TYPOGRAPHY.labelCaps,
    textAlign: 'center',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
});

export default PrimaryButton;
