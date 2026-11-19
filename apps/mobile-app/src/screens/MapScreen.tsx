import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  ViewStyle,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { AlertItem } from '../utils/mockState';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SurfaceCard } from '../components/SurfaceCard';

interface MapScreenProps {
  alerts: AlertItem[];
}

export const MapScreen: React.FC<MapScreenProps> = ({ alerts }) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string>(alerts[0]?.id || '');

  const activeAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];

  const handleOpenNavigation = () => {
    if (!activeAlert) return;
    const lat = activeAlert.latitude || 18.9431;
    const lng = activeAlert.longitude || 72.8246;
    const label = encodeURIComponent(activeAlert.lastSeenLocation || 'Sighting Location');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://maps.google.com/?q=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    });
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="map" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>PATROL SECTOR MAP</Text>
        </View>
        <View style={styles.gpsTag}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>GPS ACTIVE</Text>
        </View>
      </View>

      {/* Sector Map Visualizer Grid */}
      <View style={styles.radarContainer}>
        {/* Concentric Sector Rings */}
        <View style={[styles.radarRing, { width: 90, height: 90, borderRadius: 45 }]} />
        <View style={[styles.radarRing, { width: 180, height: 180, borderRadius: 90 }]} />
        <View style={[styles.radarRing, { width: 270, height: 270, borderRadius: 135 }]} />

        {/* Axis dividers */}
        <View style={styles.crosshairH} />
        <View style={styles.crosshairV} />

        {/* Center Patrol Unit Pin */}
        <View style={styles.unitBeacon}>
          <View style={styles.unitCenterDot} />
          <Text style={styles.unitLabel}>PATROL 042</Text>
        </View>

        {/* Dynamic Sighting Pins */}
        {alerts.slice(0, 4).map((alert, index) => {
          const isSelected = alert.id === selectedAlertId;
          const positions: ViewStyle[] = [
            { top: '22%', left: '30%' },
            { top: '35%', right: '22%' },
            { bottom: '26%', left: '24%' },
            { bottom: '20%', right: '32%' },
          ];
          const pos = positions[index % positions.length];

          return (
            <Pressable
              key={alert.id ? `${alert.id}-pin-${index}` : `pin-${index}`}
              style={[styles.targetPin, pos]}
              onPress={() => setSelectedAlertId(alert.id)}
              hitSlop={12}
            >
              <View
                style={[
                  styles.targetDot,
                  {
                    backgroundColor:
                      alert.threatLevel === 'HIGH' || alert.threatLevel === 'CRITICAL'
                        ? COLORS.error
                        : COLORS.primary,
                  },
                  isSelected && styles.targetDotSelected,
                ]}
              />
              <Text
                style={[
                  styles.targetPinLabel,
                  isSelected && { color: COLORS.primary, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {alert.title.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Sighting Detail Card */}
      {activeAlert && (
        <SurfaceCard style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailSubtitle}>SELECTED SIGHTING LEAD</Text>
              <Text style={styles.detailTitle}>{activeAlert.title}</Text>
            </View>
            <View style={styles.matchBadge}>
              <Text style={styles.matchText}>
                {activeAlert.matchPercentage ? `${activeAlert.matchPercentage}% MATCH` : activeAlert.threatLevel}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="place" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.detailLocation}>{activeAlert.lastSeenLocation}</Text>
          </View>

          <View style={styles.detailMetaGrid}>
            <View style={styles.metaBox}>
              <Text style={styles.metaBoxLabel}>GPS COORDINATES</Text>
              <Text style={styles.metaBoxVal}>
                {activeAlert.latitude.toFixed(4)}, {activeAlert.longitude.toFixed(4)}
              </Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaBoxLabel}>CASE FILE</Text>
              <Text style={styles.metaBoxVal}>{activeAlert.fileNo}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaBoxLabel}>TIME DETECTED</Text>
              <Text style={styles.metaBoxVal}>{activeAlert.lastSeenTime}</Text>
            </View>
          </View>

          {/* 1-Tap Navigation Intent */}
          <Pressable
            onPress={handleOpenNavigation}
            style={({ pressed }) => [
              styles.navButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <MaterialIcons name="navigation" size={16} color={COLORS.onPrimary} style={{ marginRight: 6 }} />
            <Text style={styles.navButtonText}>NAVIGATE TO LOCATION</Text>
          </Pressable>
        </SurfaceCard>
      )}

      {/* Target Quick Switcher Strip */}
      <Text style={styles.sectionHeader}>NEARBY SIGHTING LEADS ({alerts.length})</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, flexGrow: 0, marginBottom: 8 }}
        contentContainerStyle={styles.targetsScroll}
      >
        {alerts.map((alert, index) => {
          const isSelected = alert.id === selectedAlertId;
          return (
            <Pressable
              key={alert.id ? `${alert.id}-pill-${index}` : `pill-${index}`}
              onPress={() => setSelectedAlertId(alert.id)}
              style={[
                styles.targetPill,
                isSelected && styles.targetPillSelected,
              ]}
            >
              <View
                style={[
                  styles.pillDot,
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
                  styles.pillText,
                  isSelected && styles.pillTextSelected,
                ]}
              >
                {alert.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.gutter,
    paddingBottom: SPACING.md,
  },
  header: {
    height: SPACING.touchTargetMin + 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
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
  gpsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  gpsText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.success,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  radarContainer: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDED.LG,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  radarRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  crosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  crosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  unitBeacon: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  unitCenterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  unitLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.secondary,
    fontFamily: 'monospace',
    marginTop: 3,
    fontWeight: '700',
  },
  targetPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  targetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  targetDotSelected: {
    transform: [{ scale: 1.4 }],
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  targetPinLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  detailCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailSubtitle: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.primary,
    marginBottom: 2,
  },
  detailTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  matchText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLocation: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '500',
  },
  detailMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.MD,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  metaBox: {
    flex: 1,
    alignItems: 'center',
  },
  metaBoxLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  metaBoxVal: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDED.MD,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navButtonText: {
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  targetsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    height: 40,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 36,
  },
  targetPillSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pillText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  pillTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
