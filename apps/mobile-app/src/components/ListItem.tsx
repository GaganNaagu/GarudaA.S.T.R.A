import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  showDivider?: boolean;
  disabled?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  meta,
  leftAdornment,
  rightAdornment,
  showChevron = false,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
  showDivider = true,
  disabled = false,
}) => {
  const isPressable = typeof onPress === 'function' && !disabled;

  const content = (
    <View style={[styles.container, style]}>
      {leftAdornment && <View style={styles.leftWrapper}>{leftAdornment}</View>}

      <View style={styles.centerWrapper}>
        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightWrapper}>
        {meta && <Text style={styles.meta}>{meta}</Text>}
        {rightAdornment}
        {showChevron && (
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={COLORS.onSurfaceVariant}
            style={styles.chevron}
          />
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.wrapper, showDivider && styles.divider]}>
      {isPressable ? (
        <Pressable
          onPress={onPress}
          android_ripple={{ color: COLORS.surfaceHigh }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.pressable,
            pressed && styles.pressed,
          ]}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSubtle,
  },
  pressable: {
    minHeight: SPACING.touchTargetMin,
  },
  pressed: {
    backgroundColor: COLORS.surfaceHigh,
  },
  container: {
    minHeight: SPACING.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.containerPadding,
  },
  leftWrapper: {
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.bodyMd,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  rightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  meta: {
    ...TYPOGRAPHY.dataMonoSm,
    color: COLORS.textMuted,
    marginRight: SPACING.xs,
  },
  chevron: {
    opacity: 0.6,
  },
});

export default ListItem;
