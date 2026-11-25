import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, ROUNDED, SPACING } from '../constants/theme';
import {
  playTacticalChime,
  stopTacticalChime,
  setTacticalMuted,
  isTacticalMuted,
} from '../utils/tacticalAudio';

export interface TacticalAlertItem {
  id: string;
  title: string;
  subtitle: string;
  threatLevel: 'HIGH' | 'LOW' | 'MEDIUM' | 'MODERATE' | 'CRITICAL' | string;
  matchPercentage?: number;
  lastSeenLocation: string;
  mugshotUrl?: string;
  fileNo?: string;
  latitude?: number;
  longitude?: number;
  cameraName?: string;
  unitType?: 'foot' | 'vehicular' | string;
}

interface TacticalAlertPopupProps {
  visible: boolean;
  alerts?: TacticalAlertItem[];
  alert?: TacticalAlertItem | null;
  patrolMode?: 'foot' | 'vehicular' | string;
  onAcknowledge: () => void;
  onAccept?: (alert: TacticalAlertItem) => void;
  onPass?: (alert: TacticalAlertItem, remainingCount: number) => void;
  onDismiss?: () => void;
}

const { width } = Dimensions.get('window');

export const TacticalAlertPopup: React.FC<TacticalAlertPopupProps> = ({
  visible,
  alerts,
  alert,
  patrolMode = 'foot',
  onAcknowledge,
  onAccept,
  onPass,
  onDismiss,
}) => {
  // Stacked queue of active alerts
  const [activeAlerts, setActiveAlerts] = useState<TacticalAlertItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(isTacticalMuted());
  const [imageError, setImageError] = useState(false);

  // Sync incoming alerts prop to active queue
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setActiveAlerts(alerts);
      setSelectedIndex(0);
    } else if (alert) {
      setActiveAlerts([alert]);
      setSelectedIndex(0);
    } else {
      setActiveAlerts([]);
      setSelectedIndex(0);
    }
  }, [alerts, alert]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const slideAnimY = useRef(new Animated.Value(60)).current;
  const slideAnimX = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Pulse & Entrance Animation on visible
  useEffect(() => {
    if (visible && activeAlerts.length > 0) {
      setImageError(false);

      // Tactical double-pulse vibration pattern
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 180, 80, 180]);
        } catch (e) {}
      }

      // Start creative tactical sonar chime
      playTacticalChime();

      // Smooth slide up & fade in
      Animated.parallel([
        Animated.spring(slideAnimY, {
          toValue: 0,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.4,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      stopTacticalChime();
      slideAnimY.setValue(60);
      slideAnimX.setValue(0);
      opacityAnim.setValue(0);
      pulseAnim.setValue(0.4);
    }

    return () => {
      stopTacticalChime();
    };
  }, [visible, activeAlerts.length > 0]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setTacticalMuted(nextMuted);
  };

  const stackCount = activeAlerts.length;
  const currentAlert = activeAlerts[selectedIndex] || activeAlerts[0] || null;

  // Cycle through leads in stack without discarding
  const handleNextLead = () => {
    if (stackCount <= 1) return;
    setImageError(false);
    setSelectedIndex((prev) => (prev + 1) % stackCount);
  };

  const handlePrevLead = () => {
    if (stackCount <= 1) return;
    setImageError(false);
    setSelectedIndex((prev) => (prev - 1 + stackCount) % stackCount);
  };

  // Defer / Hold: Defer this alert so other units can respond, while moving to next in stack
  const handleDefer = () => {
    if (!currentAlert) return;

    // Slide card off smoothly
    Animated.timing(slideAnimX, {
      toValue: -width,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      const deferredAlert = currentAlert;
      const nextStack = activeAlerts.filter((_, idx) => idx !== selectedIndex);
      setActiveAlerts(nextStack);
      setSelectedIndex(0);

      if (onPass) {
        onPass(deferredAlert, nextStack.length);
      }

      if (nextStack.length === 0) {
        stopTacticalChime();
        if (onDismiss) onDismiss();
      } else {
        setImageError(false);
        slideAnimX.setValue(width * 0.3);
        Animated.spring(slideAnimX, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  // Commit & Intercept: Lock target coordinates and respond
  const handleAccept = () => {
    stopTacticalChime();
    if (onAccept && currentAlert) {
      onAccept(currentAlert);
    } else {
      onAcknowledge();
    }
  };

  if (!visible || !currentAlert) return null;

  // Extract Person Name
  const targetName =
    currentAlert.subtitle && currentAlert.subtitle.startsWith('Match for ')
      ? currentAlert.subtitle.replace(/^Match for /i, '')
      : currentAlert.title !== 'URGENT ASSIGNMENT' && currentAlert.title !== 'POSSIBLE MATCH DETECTED'
      ? currentAlert.title
      : currentAlert.subtitle || 'Suspect Sighting';

  const photoUri =
    !imageError && currentAlert.mugshotUrl
      ? currentAlert.mugshotUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=131210&color=D4AF37&size=256&bold=true`;

  const matchScore = currentAlert.matchPercentage || 94.2;
  const isFootPatrol = patrolMode === 'foot' || (currentAlert.unitType && currentAlert.unitType.toLowerCase().includes('foot'));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Layer 3: Physical Stack Layer (Visible when >= 3 alerts in stack) */}
        {stackCount >= 3 && (
          <View style={[styles.cardContainer, styles.stackLayer3]} />
        )}

        {/* Layer 2: Physical Stack Layer (Visible when >= 2 alerts in stack) */}
        {stackCount >= 2 && (
          <View style={[styles.cardContainer, styles.stackLayer2]} />
        )}

        {/* Top Active Interactive Tactical Alert Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateY: slideAnimY },
                { translateX: slideAnimX },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Operational Status Header (Tactical Directive + Deployment Mode + Audio Toggle) */}
          <View style={styles.topBar}>
            <View style={styles.headerLeftContainer}>
              <View style={styles.directiveBadge}>
                <Animated.View
                  style={[
                    styles.pulsingBeacon,
                    { opacity: pulseAnim },
                  ]}
                />
                <Text style={styles.directiveText}>SIGHTING DIRECTIVE</Text>
              </View>

              {/* Patrol Deployment Mode: Foot Patrol vs. Vehicular Squad */}
              <View style={styles.patrolModePill}>
                <MaterialIcons
                  name={isFootPatrol ? 'directions-walk' : 'local-police'}
                  size={12}
                  color="#10b981"
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.patrolModeText}>
                  {isFootPatrol ? 'FOOT PATROL' : 'VEHICULAR'}
                </Text>
              </View>
            </View>

            {/* Tactical Audio Toggle Pill */}
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.audioTogglePill, isMuted && styles.audioTogglePillMuted]}
              activeOpacity={0.7}
              hitSlop={10}
            >
              <MaterialIcons
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={15}
                color={isMuted ? COLORS.onSurfaceVariant : '#ffffff'}
              />
              <Text style={[styles.audioToggleText, isMuted && styles.audioToggleTextMuted]}>
                {isMuted ? 'MUTED' : 'CHIME ON'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sighting Stack Selector (When multiple directives arrive) */}
          {stackCount > 1 && (
            <View style={styles.stackNavigatorRow}>
              <View style={styles.stackIndicator}>
                <MaterialIcons name="layers" size={13} color="#D4AF37" style={{ marginRight: 4 }} />
                <Text style={styles.stackIndicatorText}>
                  {`LEAD ${selectedIndex + 1} OF ${stackCount} IN SECTOR`}
                </Text>
              </View>

              <View style={styles.stackNavButtons}>
                <TouchableOpacity
                  onPress={handlePrevLead}
                  style={styles.navArrowBtn}
                  hitSlop={8}
                >
                  <MaterialIcons name="chevron-left" size={18} color="#D4AF37" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextLead}
                  style={styles.navArrowBtn}
                  hitSlop={8}
                >
                  <MaterialIcons name="chevron-right" size={18} color="#D4AF37" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Biometric Verification Header (Calibrated Match Fidelity) */}
          <View style={styles.biometricSection}>
            <View style={styles.biometricLeft}>
              <View style={styles.biometricScoreRow}>
                <Text style={styles.biometricScore}>{matchScore}%</Text>
                <View style={styles.fidelityBadge}>
                  <Text style={styles.fidelityText}>NEURAL MATCH</Text>
                </View>
              </View>
              <Text style={styles.biometricLabel}>BIOMETRIC RECOGNITION FIDELITY</Text>
            </View>

            <View style={styles.biometricRight}>
              <View style={styles.threatBadge}>
                <View style={styles.threatBeacon} />
                <Text style={styles.threatText}>{currentAlert.threatLevel} SIGHTING</Text>
              </View>
              <Text style={styles.caseBadgeText}>
                {currentAlert.fileNo || '#MP-2026-0891'}
              </Text>
            </View>
          </View>

          {/* Suspect Identification & Optical Sensor Feed Card */}
          <View style={styles.subjectCard}>
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: photoUri }}
                style={styles.mugshotImage}
                onError={() => setImageError(true)}
              />
              {/* Tactical Crosshair overlay */}
              <View style={styles.crosshairH} />
              <View style={styles.crosshairV} />
              <View style={styles.reticleCornerTL} />
              <View style={styles.reticleCornerTR} />
              <View style={styles.reticleCornerBL} />
              <View style={styles.reticleCornerBR} />

              <View style={styles.liveFrameTag}>
                <View style={styles.liveTagDot} />
                <Text style={styles.liveTagText}>CCTV</Text>
              </View>
            </View>

            <View style={styles.subjectDetails}>
              <Text style={styles.subjectName} numberOfLines={1}>
                {targetName}
              </Text>
              <Text style={styles.subjectCategory} numberOfLines={1}>
                Missing Person Sighting Lead
              </Text>
              <View style={styles.sensorBadge}>
                <MaterialIcons name="videocam" size={12} color="#10b981" />
                <Text style={styles.sensorText} numberOfLines={1}>
                  {currentAlert.cameraName || 'CCTV Optical Sensor · Central Concourse'}
                </Text>
              </View>
              <Text style={styles.timestampText}>
                Detected Just Now · Verified by AI Core
              </Text>
            </View>
          </View>

          {/* Tactical Patrol Geolocation & Intercept Vector */}
          <View style={styles.vectorContainer}>
            {/* Unit Position Node */}
            <View style={styles.vectorNodeRow}>
              <View style={styles.nodeIndicatorCol}>
                <View style={styles.unitLocationDot} />
                <View style={styles.vectorDashedLine} />
              </View>
              <View style={styles.nodeDataCol}>
                <View style={styles.nodeHeaderRow}>
                  <Text style={styles.nodeTitle}>Patrol Unit-042</Text>
                  <Text style={styles.distanceBadge}>
                    {isFootPatrol ? '420m · ~3 min rapid foot intercept' : '420m · ~1 min vehicular arrival'}
                  </Text>
                </View>
                <Text style={styles.nodeDetail}>
                  Active Sector Vector · Bearing 042° NE
                </Text>
              </View>
            </View>

            {/* Target Sighting Node */}
            <View style={styles.vectorNodeRow}>
              <View style={styles.nodeIndicatorCol}>
                <View style={styles.targetLocationMarker}>
                  <MaterialIcons name="my-location" size={13} color="#ef4444" />
                </View>
              </View>
              <View style={styles.nodeDataCol}>
                <Text style={styles.targetLocationTitle} numberOfLines={2}>
                  {currentAlert.lastSeenLocation && currentAlert.lastSeenLocation !== 'Location Pending'
                    ? currentAlert.lastSeenLocation
                    : 'Majestic Central Terminal, Platform 2 Concourse'}
                </Text>
                <Text style={styles.nodeDetail}>
                  Optical Intercept Zone · Coordinates Transmitted
                </Text>
              </View>
            </View>
          </View>

          {/* Tactical Officer Operational Controls */}
          <View style={styles.actionRow}>
            {/* Defer Button: Leaves alert active for fleet, cycles to next */}
            <TouchableOpacity
              style={styles.deferButton}
              onPress={handleDefer}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <MaterialIcons name="pause-circle-outline" size={18} color="#94a3b8" />
              <View style={styles.buttonTextCol}>
                <Text style={styles.deferText}>DEFER</Text>
                <Text style={styles.deferSubtext}>Hold for Fleet</Text>
              </View>
            </TouchableOpacity>

            {/* Commit & Intercept Button: Assigns officer, opens tactical navigation */}
            <TouchableOpacity
              style={styles.commitButton}
              onPress={handleAccept}
              activeOpacity={0.85}
            >
              <MaterialIcons name="navigation" size={19} color="#0b0f17" style={{ marginRight: 6 }} />
              <View style={styles.buttonTextCol}>
                <Text style={styles.commitButtonText}>COMMIT & INTERCEPT</Text>
                <Text style={styles.commitButtonSubtext}>Set En-Route Status</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: width - 32,
    maxWidth: 420,
    backgroundColor: '#0c1018',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
    zIndex: 10,
  },
  // Physical Stack Layers Behind Top Card
  stackLayer2: {
    position: 'absolute',
    top: 'auto',
    bottom: 'auto',
    backgroundColor: '#080c14',
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderWidth: 1.5,
    transform: [{ translateY: 14 }, { scale: 0.94 }],
    opacity: 0.7,
    zIndex: 5,
  },
  stackLayer3: {
    position: 'absolute',
    top: 'auto',
    bottom: 'auto',
    backgroundColor: '#05080f',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    transform: [{ translateY: 26 }, { scale: 0.88 }],
    opacity: 0.4,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: ROUNDED.FULL,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pulsingBeacon: {
    width: 6,
    height: 6,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  directiveText: {
    ...TYPOGRAPHY.labelCaps,
    color: '#ef4444',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  patrolModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: ROUNDED.FULL,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  patrolModeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.4,
  },
  audioTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    borderRadius: ROUNDED.FULL,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  audioTogglePillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  audioToggleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  audioToggleTextMuted: {
    color: COLORS.onSurfaceVariant,
  },
  stackNavigatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderRadius: ROUNDED.MD,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  stackIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  stackNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navArrowBtn: {
    padding: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  biometricSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    borderRadius: ROUNDED.MD,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    marginBottom: 12,
  },
  biometricLeft: {
    flex: 1,
  },
  biometricScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  biometricScore: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  fidelityBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fidelityText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  biometricLabel: {
    ...TYPOGRAPHY.labelCaps,
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  biometricRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: ROUNDED.SM,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  threatBeacon: {
    width: 5,
    height: 5,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  threatText: {
    ...TYPOGRAPHY.labelCaps,
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 9,
  },
  caseBadgeText: {
    fontFamily: 'monospace',
    fontSize: 9.5,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  subjectCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  photoWrapper: {
    width: 66,
    height: 66,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#131822',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    position: 'relative',
  },
  mugshotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  crosshairH: {
    position: 'absolute',
    top: '50%',
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  crosshairV: {
    position: 'absolute',
    left: '50%',
    top: 4,
    bottom: 4,
    width: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.45)',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: '#10b981',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#10b981',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 6,
    height: 6,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: '#10b981',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 6,
    height: 6,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#10b981',
  },
  liveFrameTag: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  liveTagDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
  },
  liveTagText: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  subjectCategory: {
    fontSize: 10.5,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  sensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sensorText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 9.5,
    color: '#64748b',
    fontStyle: 'italic',
  },
  vectorContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  vectorNodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeIndicatorCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  unitLocationDot: {
    width: 8,
    height: 8,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  vectorDashedLine: {
    width: 1.5,
    height: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
    marginVertical: 2,
  },
  targetLocationMarker: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDataCol: {
    flex: 1,
    paddingLeft: 6,
    paddingBottom: 4,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  distanceBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  targetLocationTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 16,
  },
  nodeDetail: {
    fontSize: 9.5,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deferButton: {
    width: 100,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  buttonTextCol: {
    alignItems: 'flex-start',
  },
  deferText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#cbd5e1',
    letterSpacing: 0.5,
  },
  deferSubtext: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '600',
  },
  commitButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  commitButtonText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0b0f17',
    letterSpacing: 0.6,
  },
  commitButtonSubtext: {
    fontSize: 8,
    fontWeight: '700',
    color: '#3d2e05',
  },
});
