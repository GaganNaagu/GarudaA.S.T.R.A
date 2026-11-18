import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop Tap to Dismiss */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
        />

        {/* Sheet Container */}
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              <View style={styles.headerTextCol}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closePressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <MaterialIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
              </Pressable>
            </View>
          )}

          {/* Content */}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: ROUNDED.xl,
    borderTopRightRadius: ROUNDED.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: ROUNDED.full,
    backgroundColor: COLORS.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTextCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    fontSize: 17,
    lineHeight: 22,
    color: COLORS.onSurface,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: ROUNDED.full,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
  },
});

export default BottomSheet;
