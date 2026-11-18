import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING } from '../constants/theme';

export interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  withKeyboardAvoid?: boolean;
  topInset?: boolean;
  bottomInset?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  withKeyboardAvoid = true,
  topInset = true,
  bottomInset = true,
}) => {
  const insets = useSafeAreaInsets();

  const containerPadding: ViewStyle = {
    paddingTop: topInset ? insets.top : 0,
    paddingBottom: bottomInset ? insets.bottom : 0,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.container, containerPadding, style]}>
      <StatusBar style="light" />
      {withKeyboardAvoid ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.groupSpacing,
  },
});

export default ScreenWrapper;
