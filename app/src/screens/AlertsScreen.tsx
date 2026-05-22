import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { AlertItem } from '../utils/mockState';
import ScanLine from '../components/ScanLine';
import PulseIndicator from '../components/PulseIndicator';
import TacticalCard from '../components/TacticalCard';

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
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="shield" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>PATROL UNIT-042</Text>
        </View>
        <View style={styles.headerRight}>
          <MaterialIcons name="signal-cellular-alt" size={20} color={COLORS.primary} style={{ marginRight: 4 }} />
          <PulseIndicator color={COLORS.primary} size={8} pulseSize={2.5} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live Status Bar */}
        <View style={styles.statusBar}>
          <View>
            <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
            <Text style={styles.statusValue}>ACTIVE SCANNING [24.4 FPS]</Text>
          </View>
          <View style={styles.geoLocContainer}>
            <Text style={styles.geoLabel}>GEO-LOC</Text>
            <Text style={styles.geoValue}>18.9231° N, 72.8246° E</Text>
          </View>
        </View>

        {/* Alerts Feed */}
        {alerts.map((alert) => {
          const isVikram = alert.id === 'vikram-singh';
          const isVehicle = alert.id === 'govt-vehicle';

          return (
            <TacticalCard
              key={alert.id}
              accentColor={
                alert.status === 'ALERT'
                  ? alert.threatLevel === 'HIGH'
                    ? COLORS.primary
                    : COLORS.secondary
                  : COLORS.outlineVariant
              }
              containerStyle={styles.cardContainer}
            >
              <View style={styles.cardPadding}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        {
                          color:
                            alert.status === 'ALERT'
                              ? alert.threatLevel === 'HIGH'
                                ? COLORS.primary
                                : COLORS.secondary
                              : COLORS.outline,
                        },
                      ]}
                    >
                      {alert.subtitle}
                      {alert.status !== 'ALERT' && ` (${alert.status})`}
                    </Text>
                    <Text style={styles.cardTitle}>{alert.title}</Text>
                  </View>

                  {alert.matchPercentage && (
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchText}>
                        {alert.matchPercentage}% MATCH
                      </Text>
                    </View>
                  )}
                </View>

                {/* Details Section */}
                {alert.mugshotUrl ? (
                  <View style={styles.gridRow}>
                    {/* Mugshot with Scanner */}
                    <View style={styles.mugshotWrapper}>
                      <Image source={{ uri: alert.mugshotUrl }} style={styles.mugshot} />
                      {alert.status === 'ALERT' && isVikram && (
                        <ScanLine color={COLORS.secondary} duration={2500} />
                      )}
                      <View style={styles.mugshotBadge}>
                        <MaterialIcons name="gps-fixed" size={10} color={COLORS.onSurface} style={{ marginRight: 4 }} />
                        <Text style={styles.mugshotBadgeText}>FACE ID VERIFIED</Text>
                      </View>
                    </View>

                    {/* Meta info */}
                    <View style={styles.infoCol}>
                      {isVehicle && alert.vehicleDetails && (
                        <>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>PLATE NUMBER</Text>
                            <View style={styles.plateBadge}>
                              <Text style={styles.plateText}>
                                {alert.vehicleDetails.plateNumber}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>MODEL</Text>
                            <Text style={styles.metaValue}>
                              {alert.vehicleDetails.model}
                            </Text>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>COLORS</Text>
                            <Text style={styles.metaValue}>
                              {alert.vehicleDetails.colors}
                            </Text>
                          </View>
                        </>
                      )}

                      {!isVehicle && (
                        <>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>LAST SEEN LOCATION</Text>
                            <Text style={styles.metaValue}>
                              <MaterialIcons name="place" size={14} color={COLORS.primary} /> {alert.lastSeenLocation}
                            </Text>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>THREAT LEVEL</Text>
                            <Text
                              style={[
                                styles.metaValue,
                                {
                                  color:
                                    alert.threatLevel === 'HIGH'
                                      ? COLORS.error
                                      : COLORS.onSurface,
                                },
                              ]}
                            >
                              <MaterialIcons
                                name="warning"
                                size={14}
                                color={alert.threatLevel === 'HIGH' ? COLORS.error : COLORS.onSurface}
                              /> {alert.threatLevel}
                            </Text>
                          </View>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>FILE NO.</Text>
                            <Text style={styles.metaValueMono}>{alert.fileNo}</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                ) : (
                  // Simple alert with no image Still (e.g. Signal Spike)
                  <View style={styles.simpleAlertRow}>
                    <View style={styles.simpleAlertIconBox}>
                      <MaterialIcons name="radio" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.simpleAlertText}>
                      <Text style={styles.metaLabel}>TELEMETRY SIGNAL</Text>
                      <Text style={styles.cardTitle}>Waterfront radio frequency anomaly</Text>
                    </View>
                  </View>
                )}

                {/* Bottom Status bar for vehicle if present */}
                {isVehicle && alert.vehicleDetails && (
                  <View style={styles.vehicleStatusBar}>
                    <Text style={styles.vehicleStatusBarText}>
                      <MaterialIcons name="directions-car" size={12} color={COLORS.onSurfaceVariant} /> SCO-V4
                    </Text>
                    <Text style={styles.vehicleStatusBarDivider}>•</Text>
                    <Text style={styles.vehicleStatusBarText}>WHITE/BLACK</Text>
                    <View style={styles.authBadge}>
                      <MaterialIcons name="check-circle" size={10} color={COLORS.secondary} style={{ marginRight: 4 }} />
                      <Text style={styles.authText}>AUTHENTICATED</Text>
                    </View>
                  </View>
                )}

                {/* Action buttons */}
                {isVikram && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => onRespondAlert(alert.id)}
                      style={[
                        styles.actionButton,
                        styles.actionButtonPrimary,
                        alert.status !== 'ALERT' && styles.actionButtonDisabled,
                      ]}
                      disabled={alert.status !== 'ALERT'}
                    >
                      <MaterialIcons
                        name="notifications-active"
                        size={16}
                        color={alert.status === 'ALERT' ? COLORS.onPrimary : COLORS.outline}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.actionButtonText, { color: alert.status === 'ALERT' ? COLORS.onPrimary : COLORS.outline }]}>
                        RESPOND NOW
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onSelectAlert(alert)}
                      style={[styles.actionButton, styles.actionButtonSecondary]}
                    >
                      <MaterialIcons name="info" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                        VERIFY DETAILS
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TacticalCard>
          );
        })}
      </ScrollView>

      {/* Floating SOS FAB */}
      <TouchableOpacity
        onPress={onSosTrigger}
        style={styles.sosFab}
        activeOpacity={0.8}
      >
        <PulseIndicator color={COLORS.error} size={56} pulseSize={1.6} duration={1500} />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: SPACING.touchTargetMin + 12,
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
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.headlineSmMobile,
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalIcon: {
    fontSize: 18,
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.gutter,
    paddingBottom: 120,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.DEFAULT,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: 16,
  },
  statusLabel: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.primary,
    opacity: 0.7,
  },
  statusValue: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.secondary,
    marginTop: 2,
  },
  geoLocContainer: {
    alignItems: 'flex-end',
  },
  geoLabel: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.onSurfaceVariant,
  },
  geoValue: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.onSurface,
    marginTop: 2,
  },
  cardContainer: {
    marginBottom: 16,
  },
  cardPadding: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.labelCaps,
  },
  cardTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onSurface,
    marginTop: 2,
  },
  matchBadge: {
    backgroundColor: 'rgba(246, 190, 57, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(246, 190, 57, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ROUNDED.sm,
  },
  matchText: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.primary,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mugshotWrapper: {
    position: 'relative',
    width: 120,
    height: 140,
    borderRadius: ROUNDED.DEFAULT,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceLow,
  },
  mugshot: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mugshotBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 19, 10, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: ROUNDED.sm,
  },
  mugshotBadgeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  mugshotBadgeText: {
    fontSize: 8,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    marginBottom: 8,
  },
  metaLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    lineHeight: 12,
  },
  metaValue: {
    ...TYPOGRAPHY.bodyLg,
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  metaValueMono: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.onSurface,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: ROUNDED.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primaryContainer,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.surfaceHigh,
    opacity: 0.5,
  },
  actionButtonSecondary: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 11,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  simpleAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  simpleAlertIconBox: {
    width: 40,
    height: 40,
    borderRadius: ROUNDED.DEFAULT,
    backgroundColor: 'rgba(79, 70, 52, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  simpleAlertIcon: {
    fontSize: 20,
  },
  simpleAlertText: {
    flex: 1,
  },
  plateBadge: {
    backgroundColor: COLORS.surfaceLow,
    borderColor: COLORS.outlineVariant,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  plateText: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.onSurface,
    fontSize: 11,
  },
  vehicleStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLow,
    padding: 10,
    borderRadius: ROUNDED.DEFAULT,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 52, 0.2)',
    marginTop: 12,
  },
  vehicleStatusBarText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
  },
  vehicleStatusBarDivider: {
    marginHorizontal: 8,
    color: COLORS.outlineVariant,
  },
  authBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  authText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  sosFab: {
    position: 'absolute',
    bottom: 88,
    right: SPACING.gutter,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.errorContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
  sosText: {
    position: 'absolute',
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.onErrorContainer,
    fontSize: 12,
    fontWeight: '800',
    zIndex: 10,
  },
});
export default AlertsScreen;
