import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { AlertItem } from '../utils/mockState';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { getBestEffortPosition } from '../services/gpsService';

interface AlertsScreenProps {
  alerts: AlertItem[];
  onSelectAlert: (alert: AlertItem) => void;
  onRespondAlert: (alertId: string) => void;
  onSosTrigger: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  onSelectAlert,
  onRespondAlert,
  onSosTrigger,
}) => {
  const [geoLoc, setGeoLoc] = useState<string>('12.3007° N, 76.5986° E');

  useEffect(() => {
    let isMounted = true;
    const updateLoc = async () => {
      try {
        const pos = await getBestEffortPosition();
        if (isMounted) {
          const latDirection = pos.latitude >= 0 ? 'N' : 'S';
          const lonDirection = pos.longitude >= 0 ? 'E' : 'W';
          setGeoLoc(
            `${Math.abs(pos.latitude).toFixed(4)}° ${latDirection}, ${Math.abs(pos.longitude).toFixed(4)}° ${lonDirection}`
          );
        }
      } catch {
        // Silently handle
      }
    };

    updateLoc();
    const interval = setInterval(updateLoc, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const criticalCount = alerts.filter(
    (a) => a.threatLevel === 'HIGH' || a.threatLevel === 'CRITICAL'
  ).length;

  const renderAlertItem = ({ item: alert }: { item: AlertItem }) => {
    const isCritical = alert.threatLevel === 'HIGH' || alert.threatLevel === 'CRITICAL';
    const hasImage = !!alert.mugshotUrl;
    const targetName =
      alert.subtitle && alert.subtitle.startsWith('Match for ')
        ? alert.subtitle.replace(/^Match for /i, '')
        : alert.title;

    return (
      <Pressable
        onPress={() => onSelectAlert(alert)}
        style={({ pressed }) => [
          styles.rowItem,
          pressed && styles.rowItemPressed,
        ]}
      >
        {/* Left: Tactical Mugshot / Avatar with Status Dot */}
        <View style={styles.thumbnailContainer}>
          {hasImage ? (
            <Image source={{ uri: alert.mugshotUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {targetName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statusBeacon,
              { backgroundColor: isCritical ? COLORS.error : COLORS.primary },
            ]}
          />
        </View>

        {/* Center: Intelligence Metadata */}
        <View style={styles.metaCol}>
          <View style={styles.nameRow}>
            <Text style={styles.targetName} numberOfLines={1}>
              {targetName}
            </Text>
            {alert.matchPercentage != null && alert.matchPercentage > 0 ? (
              <View style={styles.matchChip}>
                <Text style={styles.matchChipText}>
                  {alert.matchPercentage}% MATCH
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="place" size={13} color={COLORS.onSurfaceVariant} style={{ marginRight: 3 }} />
            <Text style={styles.locationText} numberOfLines={1}>
              {alert.lastSeenLocation}
            </Text>
          </View>

          <View style={styles.tagRow}>
            <Text style={styles.fileNoText}>{alert.fileNo || '#MP-23854'}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text
              style={[
                styles.threatLabel,
                { color: isCritical ? COLORS.error : COLORS.primary },
              ]}
            >
              {alert.threatLevel} PRIORITY
            </Text>
            {alert.status && alert.status !== 'ALERT' && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.statusLabel}>{alert.status}</Text>
              </>
            )}
          </View>
        </View>

        {/* Right: Quick Action / Chevron */}
        <View style={styles.actionCol}>
          {alert.status === 'ALERT' ? (
            <Pressable
              onPress={() => onRespondAlert(alert.id)}
              style={({ pressed }) => [
                styles.dispatchBtn,
                pressed && { opacity: 0.75 },
              ]}
              hitSlop={8}
            >
              <Text style={styles.dispatchBtnText}>DISPATCH</Text>
            </Pressable>
          ) : (
            <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper>
      {/* Top Header: Precision Defense Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.unitBadge}>
            <MaterialIcons name="shield" size={16} color={COLORS.primary} />
            <Text style={styles.unitTitle}>UNIT-042</Text>
          </View>
          <Text style={styles.dutySubtitle}>ACTIVE PATROL</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.telemetryTag}>
            <View style={styles.onlineDot} />
            <Text style={styles.telemetryText}>LINK NOMINAL</Text>
          </View>
        </View>
      </View>

      {/* Mission Status Metric Strip */}
      <View style={styles.metricStrip}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ACTIVE SIGHTINGS</Text>
          <Text style={styles.metricValue}>{alerts.length}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>HIGH PRIORITY</Text>
          <Text style={[styles.metricValue, { color: COLORS.error }]}>
            {criticalCount}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={[styles.metricItem, { flex: 1.4 }]}>
          <Text style={styles.metricLabel}>GPS BEACON</Text>
          <Text style={styles.metricValueMono}>{geoLoc}</Text>
        </View>
      </View>

      {/* Inset Grouped Sighting List */}
      <FlatList
        data={alerts}
        keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `alert-${index}`}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="security" size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Sector Clear</Text>
            <Text style={styles.emptySubtitle}>No high-priority sightings currently flagged in your sector.</Text>
          </View>
        }
      />

      {/* Floating Tactical SOS FAB */}
      <Pressable
        onPress={onSosTrigger}
        style={({ pressed }) => [
          styles.sosFab,
          pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
        ]}
        hitSlop={8}
      >
        <MaterialIcons name="warning" size={18} color="#FFFFFF" />
        <Text style={styles.sosText}>SOS</Text>
      </Pressable>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ROUNDED.SM,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },
  unitTitle: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.onSurface,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  dutySubtitle: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  telemetryText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.success,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  metricLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 13,
  },
  metricValueMono: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.gutter,
    paddingBottom: 96,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowItemPressed: {
    backgroundColor: COLORS.surfaceVariant,
  },
  rowSeparator: {
    height: 8,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: ROUNDED.SM,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: ROUNDED.SM,
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.titleMedium,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusBeacon: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  metaCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  targetName: {
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.onSurface,
    fontSize: 15,
  },
  matchChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ROUNDED.SM,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  matchChipText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fileNoText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    fontFamily: 'monospace',
    color: COLORS.textMuted,
  },
  dotSeparator: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  threatLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    fontWeight: '700',
  },
  statusLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
  },
  actionCol: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ROUNDED.SM,
  },
  dispatchBtnText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    fontWeight: '900',
    color: '#0B0D13',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  sosFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  sosText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
});
