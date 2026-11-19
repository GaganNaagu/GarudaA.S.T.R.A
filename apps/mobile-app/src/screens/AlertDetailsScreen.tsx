import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { AlertItem } from '../utils/mockState';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SurfaceCard } from '../components/SurfaceCard';
import { PrimaryButton } from '../components/PrimaryButton';

interface AlertDetailsScreenProps {
  alert: AlertItem;
  onBack: () => void;
  onUpdateStatus: (alertId: string, status: AlertItem['status']) => void;
  currentOfficerId: string;
}

export const AlertDetailsScreen: React.FC<AlertDetailsScreenProps> = ({
  alert,
  onBack,
  onUpdateStatus,
  currentOfficerId,
}) => {
  const [currentStatus, setCurrentStatus] = useState<AlertItem['status']>(alert.status);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Determine assignment rules
  const assignments = alert.assignments || [];
  const isAssigned = assignments.length > 0;
  const isAssignedToMe = isAssigned && assignments.some((a) => a.officer?.badge_number === currentOfficerId);
  const isAssignedToOther = isAssigned && !isAssignedToMe;
  const otherOfficerAssignment = isAssignedToOther ? assignments[0] : null;

  const handleStatusChange = (status: AlertItem['status']) => {
    setCurrentStatus(status);
    onUpdateStatus(alert.id, status);
    setFeedbackMessage(`Status updated to ${status}. Transmitted to dispatch.`);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleOpenNavigation = () => {
    const lat = alert.latitude || 18.9431;
    const lng = alert.longitude || 72.8246;
    const label = encodeURIComponent(alert.lastSeenLocation || 'Sighting Location');
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
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>DOSSIER #{alert.fileNo}</Text>
        <View style={styles.threatBadge}>
          <Text style={styles.threatBadgeText}>{alert.threatLevel}</Text>
        </View>
      </View>

      {/* Inline Feedback Banner */}
      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <MaterialIcons name="check-circle" size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      {/* Main Forensic Evidence Section */}
      <SurfaceCard style={styles.evidenceCard}>
        <View style={styles.evidenceRow}>
          <View style={styles.imageBox}>
            <Image
              source={{ uri: alert.mugshotUrl || 'https://via.placeholder.com/150' }}
              style={styles.image}
            />
            {alert.confidence || alert.matchPercentage ? (
              <View style={styles.matchTag}>
                <Text style={styles.matchTagText}>
                  {alert.confidence || `${alert.matchPercentage}%`} MATCH
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metaCol}>
            <Text style={styles.personName}>{alert.title}</Text>
            <Text style={styles.personSubtitle}>{alert.subtitle}</Text>

            <View style={styles.metaRow}>
              <MaterialIcons name="place" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.metaLocation} numberOfLines={2}>
                {alert.lastSeenLocation}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <MaterialIcons name="schedule" size={14} color={COLORS.onSurfaceVariant} style={{ marginRight: 4 }} />
              <Text style={styles.metaTime}>Last seen {alert.lastSeenTime}</Text>
            </View>

            {/* Quick 1-tap Turn-by-Turn Navigation Intent */}
            <Pressable
              onPress={handleOpenNavigation}
              style={({ pressed }) => [
                styles.navIntentBtn,
                pressed && { opacity: 0.8 },
              ]}
              hitSlop={8}
            >
              <MaterialIcons name="navigation" size={14} color={COLORS.primary} style={{ marginRight: 5 }} />
              <Text style={styles.navIntentText}>Open Turn-by-Turn Navigation</Text>
            </Pressable>
          </View>
        </View>
      </SurfaceCard>

      {/* CCTV Camera Details */}
      {alert.telemetry && (
        <SurfaceCard style={styles.telemetryCard}>
          <Text style={styles.sectionTitle}>CCTV CAMERA DETAILS</Text>
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryKey}>ANGLE</Text>
              <Text style={styles.telemetryVal}>{alert.telemetry.azimuth}</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryKey}>ZOOM</Text>
              <Text style={styles.telemetryVal}>{alert.telemetry.zoom}</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryKey}>LENS</Text>
              <Text style={styles.telemetryVal}>{alert.telemetry.lens}</Text>
            </View>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryKey}>FEED QUALITY</Text>
              <Text style={styles.telemetryVal}>{alert.telemetry.signal}</Text>
            </View>
          </View>
        </SurfaceCard>
      )}

      {/* Assignment Status */}
      <SurfaceCard style={styles.assignmentCard}>
        <Text style={styles.sectionTitle}>PATROL UNIT ASSIGNMENT</Text>
        {isAssignedToOther ? (
          <View style={styles.lockedAssignment}>
            <MaterialIcons name="lock" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.lockedText}>
              Assigned to {otherOfficerAssignment?.officer?.user?.full_name || 'another patrol unit'}.
            </Text>
          </View>
        ) : alert.assignments && alert.assignments.length > 0 ? (
          <View style={styles.assignedRow}>
            <MaterialIcons name="local-police" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.assignedText}>
              {alert.assignments[0]?.officer?.user?.full_name || 'Active Patrol'} (Badge: {alert.assignments[0]?.officer?.badge_number || 'N/A'}) · [ {alert.assignments[0]?.status?.toUpperCase()} ]
            </Text>
          </View>
        ) : (
          <View style={styles.unassignedRow}>
            <MaterialIcons name="info-outline" size={18} color={COLORS.outline} style={{ marginRight: 8 }} />
            <Text style={styles.unassignedText}>Unassigned · Ready for field response.</Text>
          </View>
        )}
      </SurfaceCard>

      {/* Operational Field Action Grid */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>OPERATIONAL FIELD CONTROLS</Text>
        <View style={styles.actionGrid}>
          <PrimaryButton
            title="EN-ROUTE"
            onPress={() => handleStatusChange('EN-ROUTE')}
            variant={currentStatus === 'EN-ROUTE' ? 'primary' : 'secondary'}
            size="sm"
            icon="directions-car"
            style={styles.actionButton}
          />

          <PrimaryButton
            title="INVESTIGATING"
            onPress={() => handleStatusChange('INVESTIGATING')}
            variant={currentStatus === 'INVESTIGATING' ? 'primary' : 'secondary'}
            size="sm"
            icon="search"
            style={styles.actionButton}
          />

          <PrimaryButton
            title="LOCATED / FOUND"
            onPress={() => handleStatusChange('FOUND')}
            variant={currentStatus === 'FOUND' ? 'primary' : 'secondary'}
            size="sm"
            icon="check-circle"
            style={styles.actionButton}
          />

          <PrimaryButton
            title="FALSE ALARM"
            onPress={() => handleStatusChange('FALSE ALARM')}
            variant={currentStatus === 'FALSE ALARM' ? 'destructive' : 'secondary'}
            size="sm"
            icon="cancel"
            style={styles.actionButton}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.gutter,
    paddingBottom: 96,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 2,
  },
  headerTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  threatBadgeText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.error,
    fontWeight: '800',
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: ROUNDED.MD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: SPACING.md,
  },
  feedbackText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    fontSize: 12,
    flex: 1,
  },
  evidenceCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  evidenceRow: {
    flexDirection: 'row',
    gap: 14,
  },
  imageBox: {
    width: 100,
    height: 110,
    borderRadius: ROUNDED.MD,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  matchTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  matchTagText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  metaCol: {
    flex: 1,
    justifyContent: 'space-around',
  },
  personName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 16,
  },
  personSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontSize: 11,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  metaLocation: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontSize: 12,
    flex: 1,
  },
  metaTime: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  navIntentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: ROUNDED.SM,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    alignSelf: 'flex-start',
  },
  navIntentText: {
    ...TYPOGRAPHY.labelMedium,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  telemetryCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryKey: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  telemetryVal: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: 11,
  },
  assignmentCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  lockedAssignment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    flex: 1,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontSize: 12,
    flex: 1,
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unassignedText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
  },
  actionsSection: {
    marginTop: SPACING.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    width: '48%',
  },
});

export default AlertDetailsScreen;
