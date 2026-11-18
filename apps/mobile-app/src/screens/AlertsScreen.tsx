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
import { SurfaceCard } from '../components/SurfaceCard';
import { PrimaryButton } from '../components/PrimaryButton';
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

  const renderAlertItem = ({ item: alert }: { item: AlertItem }) => {
    const isUrgent = alert.status === 'ALERT';
    const hasImage = !!alert.mugshotUrl;

    return (
      <SurfaceCard style={styles.alertCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardSubtitle}>
              {alert.subtitle}
              {alert.status !== 'ALERT' ? ` · ${alert.status}` : ''}
            </Text>
            <Text style={styles.cardTitle}>{alert.title}</Text>
          </View>

          {alert.matchPercentage != null && alert.matchPercentage > 0 ? (
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>{alert.matchPercentage}% MATCH</Text>
            </View>
          ) : null}
        </View>

        {/* Forensic Visual + Details */}
        <View style={styles.cardBody}>
          <View style={styles.imageWrapper}>
            {hasImage ? (
              <Image source={{ uri: alert.mugshotUrl }} style={styles.mugshot} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={36} color={COLORS.outline} />
              </View>
            )}
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedText}>FACE ID</Text>
            </View>
          </View>

          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>LOCATION</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {alert.lastSeenLocation}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>THREAT LEVEL</Text>
              <View style={styles.threatRow}>
                <View
                  style={[
                    styles.threatDot,
                    {
                      backgroundColor:
                        alert.threatLevel === 'HIGH' || alert.threatLevel === 'CRITICAL'
                          ? COLORS.error
                          : COLORS.primary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.threatText,
                    {
                      color:
                        alert.threatLevel === 'HIGH' || alert.threatLevel === 'CRITICAL'
                          ? COLORS.error
                          : COLORS.primary,
                    },
                  ]}
                >
                  {alert.threatLevel}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>FILE NUMBER</Text>
              <Text style={styles.fileNo}>{alert.fileNo}</Text>
            </View>
          </View>
        </View>

        {/* Assigned Officer Strip */}
        {alert.assignments && alert.assignments.length > 0 ? (
          <View style={styles.assignmentStrip}>
            <MaterialIcons name="local-police" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.assignmentText} numberOfLines={1}>
              {alert.assignments[0]?.officer?.user?.full_name || 'Assigned Officer'} · {alert.assignments[0]?.status?.toUpperCase() || 'DISPATCHED'}
            </Text>
          </View>
        ) : null}

        {/* Card Actions */}
        <View style={styles.actionRow}>
          <PrimaryButton
            title="RESPOND"
            onPress={() => onRespondAlert(alert.id)}
            disabled={!isUrgent}
            variant="primary"
            size="sm"
            icon="notifications-active"
            style={styles.actionBtn}
          />
          <PrimaryButton
            title="DETAILS"
            onPress={() => onSelectAlert(alert)}
            variant="secondary"
            size="sm"
            icon="visibility"
            style={styles.actionBtn}
          />
        </View>
      </SurfaceCard>
    );
  };

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="shield" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>PATROL UNIT-042</Text>
        </View>
        <View style={styles.telemetryTag}>
          <View style={styles.onlineDot} />
          <Text style={styles.telemetryText}>LINK NOMINAL</Text>
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `alert-${index}`}
        renderItem={renderAlertItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.statusBar}>
            <View style={styles.statusCol}>
              <Text style={styles.statusLabel}>SURVEILLANCE BEACON</Text>
              <Text style={styles.statusVal}>ACTIVE TELEMETRY</Text>
            </View>
            <View style={styles.statusColRight}>
              <Text style={styles.statusLabel}>GEO COORDINATES</Text>
              <Text style={styles.statusVal}>{geoLoc}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="security" size={48} color={COLORS.outline} style={{ marginBottom: 12 }} />
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
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 },
        ]}
        hitSlop={8}
      >
        <MaterialIcons name="warning" size={20} color="#FFFFFF" />
        <Text style={styles.sosText}>SOS</Text>
      </Pressable>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    height: SPACING.touchTargetMin + 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.gutter,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineSmMobile,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  telemetryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ROUNDED.FULL,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginRight: 6,
  },
  telemetryText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.secondary,
    fontFamily: 'monospace',
  },
  listContent: {
    padding: SPACING.gutter,
    paddingBottom: 96,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.MD,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SPACING.md,
  },
  statusCol: {
    flex: 1,
  },
  statusColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  statusVal: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontWeight: '600',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  alertCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 10,
    color: COLORS.primary,
    marginBottom: 2,
  },
  cardTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  matchBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
  },
  matchText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  imageWrapper: {
    width: 88,
    height: 88,
    borderRadius: ROUNDED.MD,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    position: 'relative',
  },
  mugshot: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  verifiedText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.secondary,
    fontFamily: 'monospace',
  },
  metaCol: {
    flex: 1,
    justifyContent: 'space-around',
  },
  metaRow: {
    marginVertical: 1,
  },
  metaLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
  },
  metaValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontWeight: '500',
    fontSize: 12,
  },
  threatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  threatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  threatText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  fileNo: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  assignmentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.SM,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  assignmentText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  actionBtn: {
    flex: 1,
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sosText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 1,
  },
});
