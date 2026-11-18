import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { OfficerProfile } from '../utils/mockState';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { SurfaceCard } from '../components/SurfaceCard';
import { ListItem } from '../components/ListItem';
import { PrimaryButton } from '../components/PrimaryButton';

interface ProfileScreenProps {
  officer: OfficerProfile;
  onLogout: () => void;
  onUpdateStatus: (status: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  officer,
  onLogout,
  onUpdateStatus,
}) => {
  const isOnDuty = officer.status === 'ACTIVE DUTY';

  const handleStatusToggle = () => {
    const nextStatus = isOnDuty ? 'STANDBY / STAND DOWN' : 'ACTIVE DUTY';
    onUpdateStatus(nextStatus);
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'DISENGAGE TERMINAL',
      'Are you sure you want to log out of the active tactical patrol terminal?',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'LOG OUT', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="security" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>OFFICER PROFILE</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{officer.unitId}</Text>
        </View>
      </View>

      {/* Identity Card */}
      <SurfaceCard style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View style={styles.portraitWrapper}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.portrait}
            />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnDuty ? COLORS.primary : COLORS.outline },
              ]}
            />
          </View>

          <View style={styles.identityDetails}>
            <Text style={styles.officerName}>{officer.name}</Text>
            <Text style={styles.officerRank}>{officer.rank}</Text>
            <Text style={styles.officerShift}>Shift: {officer.shift}</Text>
          </View>
        </View>
      </SurfaceCard>

      {/* Duty Status Switcher Card */}
      <SurfaceCard style={styles.dutyCard}>
        <View style={styles.dutyRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dutyLabel}>OPERATIONAL STATUS</Text>
            <Text
              style={[
                styles.dutyStatusText,
                { color: isOnDuty ? COLORS.primary : COLORS.onSurfaceVariant },
              ]}
            >
              {isOnDuty ? 'ACTIVE ON-DUTY' : 'STANDBY / OFF-DUTY'}
            </Text>
          </View>
          <PrimaryButton
            title={isOnDuty ? 'GO OFF-DUTY' : 'GO ON-DUTY'}
            onPress={handleStatusToggle}
            variant={isOnDuty ? 'secondary' : 'primary'}
            size="sm"
            icon={isOnDuty ? 'power-settings-new' : 'radio-button-checked'}
          />
        </View>
      </SurfaceCard>

      {/* Grouped Terminal Settings / Telemetry Items */}
      <Text style={styles.sectionHeader}>TERMINAL TELEMETRY</Text>
      <SurfaceCard style={styles.groupedList}>
        <ListItem
          title="Radio Channel"
          subtitle="Direct Municipal Command Link"
          meta={officer.radioChannel || 'TAC-CH-04'}
          leftAdornment={<MaterialIcons name="settings-remote" size={20} color={COLORS.primary} />}
          showDivider
        />
        <ListItem
          title="Assigned Sector"
          subtitle="Tactical Patrol Zone"
          meta={officer.assignedSector || 'Sector Alpha'}
          leftAdornment={<MaterialIcons name="map" size={20} color={COLORS.secondary} />}
          showDivider
        />
        <ListItem
          title="Telemetry Encryption"
          subtitle="Hardware Cryptographic Module"
          meta="AES-256-GCM"
          leftAdornment={<MaterialIcons name="vpn-key" size={20} color={COLORS.onSurfaceVariant} />}
          showDivider
        />
        <ListItem
          title="Server Connection"
          subtitle="WebSocket Dispatch Stream"
          meta="ONLINE"
          leftAdornment={<MaterialIcons name="sensors" size={20} color={COLORS.secondary} />}
          showDivider={false}
        />
      </SurfaceCard>

      {/* Logout Action */}
      <View style={styles.logoutWrapper}>
        <PrimaryButton
          title="LOGOUT & SECURE TERMINAL"
          onPress={handleConfirmLogout}
          variant="destructive"
          size="md"
          icon="logout"
          style={styles.logoutBtn}
        />
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.FULL,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainer,
  },
  badgeText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  identityCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  portraitWrapper: {
    position: 'relative',
  },
  portrait: {
    width: 64,
    height: 64,
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainer,
  },
  identityDetails: {
    flex: 1,
  },
  officerName: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  officerRank: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  officerShift: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
    marginTop: 2,
  },
  dutyCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dutyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dutyLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  dutyStatusText: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  groupedList: {
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  logoutWrapper: {
    marginTop: SPACING.sm,
  },
  logoutBtn: {
    width: '100%',
  },
});
