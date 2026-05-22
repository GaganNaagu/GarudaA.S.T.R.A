import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { AlertItem } from '../utils/mockState';
import PulseIndicator from '../components/PulseIndicator';
import TacticalCard from '../components/TacticalCard';

interface LogsScreenProps {
  alerts: AlertItem[];
  onUpdateAlertStatus: (alertId: string, status: AlertItem['status']) => void;
}

export const LogsScreen: React.FC<LogsScreenProps> = ({
  alerts,
  onUpdateAlertStatus,
}) => {
  // Find our primary dynamic alert (Vikram Singh #GA-23854)
  const activeAlert = alerts.find((a) => a.id === 'vikram-singh') || alerts[0];
  const activeStatus = activeAlert ? activeAlert.status : 'ALERT';

  // Handler for footer action triggers
  const handleFooterAction = (action: 'EN_ROUTE' | 'ON_SCENE' | 'COPY_THAT') => {
    if (!activeAlert) return;

    let targetStatus: AlertItem['status'] = 'ALERT';
    let message = '';
    let title = '';

    switch (action) {
      case 'EN_ROUTE':
        targetStatus = 'INVESTIGATING';
        title = 'EN ROUTE BEARING LOGGED';
        message = 'Patrol Unit-042 status updated to EN ROUTE.\nGPS telemetry locked to Sector 4 (Marine Drive). Backup notified.';
        break;
      case 'ON_SCENE':
        targetStatus = 'LOCATED';
        title = 'ON SCENE ARRIVAL RECORDED';
        message = 'Patrol Unit-042 status updated to ON SCENE.\nCCTV facial recognition feeds synchronized. Initiating suspect scan.';
        break;
      case 'COPY_THAT':
        targetStatus = 'COMPLETED';
        title = 'SECURE COMMAND TRANSMITTED';
        message = 'Patrol Unit-042 status updated to COMPLETED.\nThreat at Sector 4 checkpoint fully resolved and secured. Log archived.';
        break;
    }

    onUpdateAlertStatus(activeAlert.id, targetStatus);

    Alert.alert(
      title,
      message,
      [{ text: 'RECEIVING L-BAND DATALINK', style: 'default' }],
      { cancelable: true }
    );
  };

  // Helper to render dynamic status information for the top log card
  const getDynamicLogContent = () => {
    switch (activeStatus) {
      case 'ALERT':
        return {
          badgeText: 'PENDING',
          badgeColor: COLORS.primary,
          badgeBg: 'rgba(246, 190, 57, 0.12)',
          icon: 'hourglass-empty' as const,
          description: 'Status: PENDING. Potential weapon detected at Sector 4 checkpoint. Patrol Unit dispatch required.',
        };
      case 'INVESTIGATING':
        return {
          badgeText: 'EN ROUTE',
          badgeColor: COLORS.primary,
          badgeBg: 'rgba(246, 190, 57, 0.12)',
          icon: 'directions-run' as const,
          description: 'Status: EN ROUTE. Dispatch confirmed. Patrol Unit-042 is en route to Sector 4 checkpoint.',
        };
      case 'LOCATED':
        return {
          badgeText: 'ON SCENE',
          badgeColor: COLORS.primary,
          badgeBg: 'rgba(246, 190, 57, 0.12)',
          icon: 'location-searching' as const,
          description: 'Status: ON SCENE. Patrol Unit-042 arrived at Sector 4. Subject located and under active observation.',
        };
      case 'COMPLETED':
        return {
          badgeText: 'SECURED',
          badgeColor: COLORS.secondary,
          badgeBg: 'rgba(76, 215, 246, 0.12)',
          icon: 'verified' as const,
          description: 'Status: SECURED. Potential weapon detected at Sector 4 checkpoint. Suspect detained and area cleared.',
        };
      case 'FALSE ALERT':
        return {
          badgeText: 'DISMISSED',
          badgeColor: COLORS.outline,
          badgeBg: 'rgba(155, 143, 122, 0.12)',
          icon: 'cancel' as const,
          description: 'Status: DISMISSED. Threat analyzed. Misidentification at Sector 4 checkpoint. Code Green.',
        };
      default:
        return {
          badgeText: 'PENDING',
          badgeColor: COLORS.primary,
          badgeBg: 'rgba(246, 190, 57, 0.12)',
          icon: 'hourglass-empty' as const,
          description: 'Status: PENDING. Potential weapon detected at Sector 4 checkpoint. Patrol Unit dispatch required.',
        };
    }
  };

  const dynamicLog = getDynamicLogContent();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="security" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>PATROL UNIT-042</Text>
        </View>
        <View style={styles.headerRight}>
          <MaterialIcons name="signal-cellular-alt" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
          <PulseIndicator color={COLORS.primary} size={8} pulseSize={2.5} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Emergency & Sector Headers */}
        <View style={styles.headersRow}>
          <View style={[styles.headerCard, styles.emergencyCard]}>
            <Text style={styles.headerCardLabelError}>EMERGENCY</Text>
            <View style={styles.headerCardBody}>
              <MaterialIcons name="emergency" size={18} color={COLORS.error} style={styles.pulseIcon} />
              <Text style={styles.headerCardValueMonoError}>PRIORITY-ALPHA</Text>
            </View>
          </View>

          <View style={[styles.headerCard, styles.sectorCard]}>
            <Text style={styles.headerCardLabelSecondary}>SECTOR 1</Text>
            <View style={styles.headerCardBody}>
              <MaterialIcons name="location-on" size={18} color={COLORS.secondary} />
              <Text style={styles.headerCardValueMono}>MUMBAI_CENTRAL</Text>
            </View>
          </View>
        </View>

        {/* Response History Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RESPONSE HISTORY</Text>
          <Text style={styles.sectionMeta}>LOGS UPDATED</Text>
        </View>

        {/* Dynamic Log 1 (Reactive to Alert #GA-23854) */}
        <View style={styles.logCardContainer}>
          <TacticalCard
            accentColor={dynamicLog.badgeColor}
            style={styles.cardPadding}
          >
            <View style={styles.logCardHeader}>
              <View style={styles.logUnitInfo}>
                <View style={[styles.iconBox, { backgroundColor: `${dynamicLog.badgeColor}1A` }]}>
                  <MaterialIcons name="assignment-turned-in" size={16} color={dynamicLog.badgeColor} />
                </View>
                <View>
                  <Text style={[styles.logTitle, { color: dynamicLog.badgeColor }]}>
                    UNIT-042 | Alert #GA-23854
                  </Text>
                  <Text style={styles.logTime}>RESPONDED AT 14:23:15 UTC</Text>
                </View>
              </View>

              <View style={[styles.badgeContainer, { backgroundColor: dynamicLog.badgeBg }]}>
                <MaterialIcons name={dynamicLog.icon} size={12} color={dynamicLog.badgeColor} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: dynamicLog.badgeColor }]}>
                  {dynamicLog.badgeText}
                </Text>
              </View>
            </View>

            <View style={[styles.bodyBorder, { borderColor: `${dynamicLog.badgeColor}4D` }]}>
              <Text style={styles.bodyText}>
                {dynamicLog.description}
              </Text>
            </View>
          </TacticalCard>
        </View>

        {/* Log Card 2 (Static Unit-075 | Alert #MH-11202) */}
        <View style={styles.logCardContainer}>
          <TacticalCard
            accentColor={COLORS.secondary}
            style={styles.cardPadding}
          >
            <View style={styles.logCardHeader}>
              <View style={styles.logUnitInfo}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 215, 246, 0.1)' }]}>
                  <MaterialIcons name="local-police" size={16} color={COLORS.secondary} />
                </View>
                <View>
                  <Text style={[styles.logTitle, { color: COLORS.secondary }]}>
                    UNIT-075 | Alert #MH-11202
                  </Text>
                  <Text style={styles.logTime}>RESPONDED AT 14:10:42 UTC</Text>
                </View>
              </View>

              <View style={[styles.badgeContainer, { backgroundColor: 'rgba(246, 190, 57, 0.12)' }]}>
                <MaterialIcons name="location-searching" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: COLORS.primary }]}>ON SCENE</Text>
              </View>
            </View>

            <View style={styles.bodyBorderSecondary}>
              <Text style={styles.bodyText}>
                Status: <Text style={{ color: COLORS.secondary }}>ON SCENE</Text>. Responding to reports of unauthorized firearm brandishing near Marine Drive.
              </Text>
            </View>
          </TacticalCard>
        </View>

        {/* Log Card 3 (Static Unit-042 | Alert #CC-09432) */}
        <View style={[styles.logCardContainer, { opacity: 0.8 }]}>
          <TacticalCard
            accentColor={COLORS.outline}
            style={styles.cardPadding}
          >
            <View style={styles.logCardHeader}>
              <View style={styles.logUnitInfo}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(155, 143, 122, 0.1)' }]}>
                  <MaterialIcons name="history" size={16} color={COLORS.outline} />
                </View>
                <View>
                  <Text style={[styles.logTitle, { color: COLORS.onSurfaceVariant }]}>
                    UNIT-042 | Alert #CC-09432
                  </Text>
                  <Text style={styles.logTime}>RESPONDED AT 13:45:02 UTC</Text>
                </View>
              </View>

              <View style={[styles.badgeContainer, { backgroundColor: 'rgba(155, 143, 122, 0.12)' }]}>
                <MaterialIcons name="check-circle" size={12} color={COLORS.outline} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: COLORS.outline }]}>RECOVERED</Text>
              </View>
            </View>

            <View style={styles.bodyBorderMuted}>
              <Text style={[styles.bodyText, { fontStyle: 'italic', color: COLORS.onSurfaceVariant }]}>
                Status: <Text style={{ color: COLORS.onSurface }}>RECOVERED</Text>. Missing person (Case #884) located at Dharavi transit camp and reunited with family.
              </Text>
            </View>
          </TacticalCard>
        </View>

        {/* Situational Context (Bento Style) */}
        <View style={styles.bentoRow}>
          <View style={styles.bentoItem}>
            <MaterialIcons name="wifi-tethering" size={24} color={COLORS.primary} style={{ marginBottom: 6 }} />
            <Text style={styles.bentoLabel}>UAV FEED</Text>
            <Text style={styles.bentoValueMonoPrimary}>ACTIVE</Text>
          </View>

          <View style={styles.bentoItem}>
            <MaterialIcons name="battery-charging-full" size={24} color={COLORS.secondary} style={{ marginBottom: 6 }} />
            <Text style={styles.bentoLabel}>EXO-SUIT</Text>
            <Text style={styles.bentoValueMonoSecondary}>84%</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actionable Footer (Floating Above BottomNav) */}
      <View style={styles.floatingFooter}>
        <TouchableOpacity
          onPress={() => handleFooterAction('EN_ROUTE')}
          style={[styles.footerButton, styles.footerBtnHighest, activeStatus === 'INVESTIGATING' && styles.footerBtnActive]}
          activeOpacity={0.8}
        >
          <MaterialIcons name="directions-run" size={16} color={activeStatus === 'INVESTIGATING' ? COLORS.primary : COLORS.onSurface} style={{ marginRight: 4 }} />
          <Text style={[styles.footerBtnText, activeStatus === 'INVESTIGATING' && { color: COLORS.primary }]}>EN ROUTE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleFooterAction('ON_SCENE')}
          style={[styles.footerButton, styles.footerBtnPrimary, activeStatus === 'LOCATED' && styles.footerBtnPrimaryActive]}
          activeOpacity={0.8}
        >
          <MaterialIcons name="location-searching" size={16} color={activeStatus === 'LOCATED' ? COLORS.onPrimary : COLORS.onPrimary} style={{ marginRight: 4 }} />
          <Text style={styles.footerBtnTextPrimary}>ON SCENE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleFooterAction('COPY_THAT')}
          style={[styles.footerButton, styles.footerBtnHighest, activeStatus === 'COMPLETED' && styles.footerBtnActive]}
          activeOpacity={0.8}
        >
          <MaterialIcons name="check-circle" size={16} color={activeStatus === 'COMPLETED' ? COLORS.secondary : COLORS.onSurface} style={{ marginRight: 4 }} />
          <Text style={[styles.footerBtnText, activeStatus === 'COMPLETED' && { color: COLORS.secondary }]}>COPY THAT</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    ...TYPOGRAPHY.headlineSmMobile,
    color: COLORS.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.gutter,
    paddingBottom: 150, // Space for floating footer action bar
  },
  headersRow: {
    flexDirection: 'row',
    gap: SPACING.stackGap,
    marginBottom: 16,
  },
  headerCard: {
    flex: 1,
    borderRadius: ROUNDED.DEFAULT,
    padding: 12,
    borderLeftWidth: 4,
  },
  emergencyCard: {
    backgroundColor: 'rgba(147, 0, 10, 0.15)',
    borderLeftColor: COLORS.error,
  },
  sectorCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderLeftColor: COLORS.secondary,
    borderColor: COLORS.outlineVariant,
    borderWidth: 1,
  },
  headerCardLabelError: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.error,
    fontSize: 10,
  },
  headerCardLabelSecondary: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.secondary,
    fontSize: 10,
  },
  headerCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  headerCardValueMonoError: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.onErrorContainer,
    fontSize: 12,
    fontWeight: '700',
  },
  headerCardValueMono: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.onSurface,
    fontSize: 12,
    fontWeight: '700',
  },
  pulseIcon: {
    // Note: React Native does not support css keyframe animation easily without Animated wrapper.
    // However, the red glow matches nicely.
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.outline,
  },
  sectionMeta: {
    ...TYPOGRAPHY.dataMono,
    fontSize: 10,
    color: COLORS.primary,
  },
  logCardContainer: {
    marginBottom: 12,
  },
  cardPadding: {
    padding: 14,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logUnitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logTitle: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 11,
    fontWeight: '700',
  },
  logTime: {
    ...TYPOGRAPHY.dataMono,
    fontSize: 9,
    color: COLORS.outline,
    marginTop: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.full,
  },
  badgeText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    fontWeight: '700',
  },
  bodyBorder: {
    borderLeftWidth: 1,
    paddingLeft: 12,
    marginTop: 2,
  },
  bodyBorderSecondary: {
    borderLeftWidth: 1,
    borderColor: 'rgba(76, 215, 246, 0.3)',
    paddingLeft: 12,
    marginTop: 2,
  },
  bodyBorderMuted: {
    borderLeftWidth: 1,
    borderColor: 'rgba(155, 143, 122, 0.3)',
    paddingLeft: 12,
    marginTop: 2,
  },
  bodyText: {
    ...TYPOGRAPHY.bodyMd,
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 20,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: SPACING.stackGap,
    marginTop: 8,
  },
  bentoItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderColor: COLORS.outlineVariant,
    borderWidth: 1,
    borderRadius: ROUNDED.DEFAULT,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.outline,
    marginTop: 2,
  },
  bentoValueMonoPrimary: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
  bentoValueMonoSecondary: {
    ...TYPOGRAPHY.dataMono,
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.gutter,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 70, 52, 0.15)',
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnHighest: {
    backgroundColor: COLORS.surfaceHighest,
    borderColor: COLORS.outlineVariant,
    borderWidth: 1,
  },
  footerBtnActive: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  footerBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  footerBtnPrimaryActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  footerBtnText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 11,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  footerBtnTextPrimary: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 11,
    color: COLORS.onPrimary,
    fontWeight: '700',
  },
});

export default LogsScreen;
