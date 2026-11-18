import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from '../constants/theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PrimaryButton } from '../components/PrimaryButton';
import { SurfaceCard } from '../components/SurfaceCard';

interface DutyToggleScreenProps {
  officerName: string;
  onAcknowledge: (status: string) => void;
}

export const DutyToggleScreen: React.FC<DutyToggleScreenProps> = ({ officerName, onAcknowledge }) => {
  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <MaterialIcons name="security" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>DUTY CHECK</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.portraitWrapper}>
          <View style={styles.portraitBorder}>
            <Image source={require('../../assets/icon.png')} style={styles.portrait} />
          </View>
          <Text style={styles.portraitTitle}>Welcome, {officerName}</Text>
          <Text style={styles.portraitSubtitle}>
            Select your operational field status to activate live GPS beaconing and dispatch alerts.
          </Text>
        </View>

        <SurfaceCard style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>Active Patrol Duty</Text>
                <Text style={styles.statusDesc}>
                  Live telemetry streamed to Central Dispatch. Receive instant geolocation sighting alerts.
                </Text>
              </View>
            </View>

            <PrimaryButton
              title="GO ON ACTIVE DUTY"
              onPress={() => onAcknowledge('ACTIVE DUTY')}
              variant="primary"
              size="lg"
              icon="radio-button-checked"
              style={styles.btnPrimary}
            />
          </View>
        </SurfaceCard>

        <PrimaryButton
          title="PROCEED OFF-DUTY (STANDBY)"
          onPress={() => onAcknowledge('STANDBY / STAND DOWN')}
          variant="secondary"
          size="md"
          icon="power-settings-new"
          style={styles.btnSecondary}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    height: SPACING.touchTargetMin + 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.gutter,
    paddingVertical: SPACING.xxl,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  portraitWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  portraitBorder: {
    width: 72,
    height: 72,
    borderRadius: ROUNDED.LG,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  portrait: {
    width: 52,
    height: 52,
    borderRadius: ROUNDED.MD,
  },
  portraitTitle: {
    ...TYPOGRAPHY.headlineSmMobile,
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 4,
  },
  portraitSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    marginBottom: SPACING.lg,
  },
  cardContent: {
    padding: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  statusTitle: {
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurface,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusDesc: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  btnPrimary: {
    width: '100%',
  },
  btnSecondary: {
    width: '100%',
  },
});
