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
            backgroundColor: COLORS.primary,
            borderColor: 'transparent',
          },
          text: {
            color: COLORS.onPrimary,
            fontWeight: '700',
          },
          spinnerColor: COLORS.onPrimary,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: COLORS.surfaceHigh,
            borderColor: COLORS.outlineVariant,
          },
          text: {
            color: COLORS.onSurface,
            fontWeight: '600',
          },
          spinnerColor: COLORS.onSurface,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: COLORS.errorContainer,
            borderColor: COLORS.error,
          },
          text: {
            color: COLORS.onError,
            fontWeight: '700',
          },
          spinnerColor: COLORS.onError,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: COLORS.outlineVariant,
          },
          text: {
            color: COLORS.onSurface,
            fontWeight: '600',
          },
          spinnerColor: COLORS.onSurface,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: {
            color: COLORS.primary,
            fontWeight: '600',
          },
          spinnerColor: COLORS.primary,
        };
      default:
        return {
          container: {
            backgroundColor: COLORS.primary,
            borderColor: 'transparent',
          },
          text: {
            color: COLORS.onPrimary,
            fontWeight: '700',
          },
          spinnerColor: COLORS.onPrimary,
        };
    }
  };

  const getSizeStyles = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { height: 36, paddingHorizontal: SPACING.md, fontSize: 12 };
      case 'lg':
        return { height: 50, paddingHorizontal: SPACING.lg, fontSize: 15 };
      case 'md':
      default:
        return { height: 44, paddingHorizontal: SPACING.md, fontSize: 13 };
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
            color={(variantStyle.text.color as string) || COLORS.onPrimary}
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
    borderRadius: ROUNDED.DEFAULT,
    borderWidth: 1,
    minHeight: 36,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    paddingHorizontal: 4,
  },
  iconWrapper: {
    marginRight: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.labelCaps,
    textAlign: 'center',
    letterSpacing: 0.5,
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
