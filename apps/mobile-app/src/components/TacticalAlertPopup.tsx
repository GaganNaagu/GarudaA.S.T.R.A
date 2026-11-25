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
  releaseTacticalAudio,
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
}

interface TacticalAlertPopupProps {
  visible: boolean;
  alerts?: TacticalAlertItem[];
  alert?: TacticalAlertItem | null;
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
  onAcknowledge,
  onAccept,
  onPass,
  onDismiss,
}) => {
  // Manage internal stacked queue of active alerts
  const [activeAlerts, setActiveAlerts] = useState<TacticalAlertItem[]>([]);
  const [isMuted, setIsMuted] = useState(isTacticalMuted());
  const [imageError, setImageError] = useState(false);

  // Sync incoming alerts prop to active queue
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setActiveAlerts(alerts);
    } else if (alert) {
      setActiveAlerts([alert]);
    } else {
      setActiveAlerts([]);
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

      // Tactical double-pulse vibration
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

  const currentAlert = activeAlerts[0] || null;

  // Pass current top card: smoothly slide card out, update stack counter, and present next card
  const handlePass = () => {
    if (!currentAlert) return;

    // Slide card off to the left
    Animated.timing(slideAnimX, {
      toValue: -width,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      const passedAlert = currentAlert;
      const nextStack = activeAlerts.slice(1);
      setActiveAlerts(nextStack);

      // Inform parent so it updates global state, preserving alert in Alerts feed
      if (onPass) {
        onPass(passedAlert, nextStack.length);
      }

      if (nextStack.length === 0) {
        stopTacticalChime();
        if (onDismiss) onDismiss();
      } else {
        // Bring in next card from right
        setImageError(false);
        slideAnimX.setValue(width * 0.4);
        Animated.spring(slideAnimX, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  // Accept current top card: triggers intercept and closes popup
  const handleAccept = () => {
    stopTacticalChime();
    if (onAccept && currentAlert) {
      onAccept(currentAlert);
    } else {
      onAcknowledge();
    }
  };

  if (!visible || !currentAlert) return null;

  // Target name extraction
  const targetName =
    currentAlert.subtitle && currentAlert.subtitle.startsWith('Match for ')
      ? currentAlert.subtitle.replace(/^Match for /i, '')
      : currentAlert.title !== 'URGENT ASSIGNMENT' && currentAlert.title !== 'POSSIBLE MATCH DETECTED'
      ? currentAlert.title
      : currentAlert.subtitle || 'Tactical Sighting';

  const photoUri =
    !imageError && currentAlert.mugshotUrl
      ? currentAlert.mugshotUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=131210&color=D4AF37&size=256&bold=true`;

  const matchScore = currentAlert.matchPercentage || 99;
  const stackCount = activeAlerts.length;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Layer 3: Deepest Stacked Card Layer (Visible when >= 3 alerts in stack) */}
        {stackCount >= 3 && (
          <View style={[styles.cardContainer, styles.stackLayer3]} />
        )}

        {/* Layer 2: Middle Stacked Card Layer (Visible when >= 2 alerts in stack) */}
        {stackCount >= 2 && (
          <View style={[styles.cardContainer, styles.stackLayer2]} />
        )}

        {/* Top Active Interactive Alert Card */}
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
          {/* Top Status & Audio Control Header (Stacked Counter + Gig Partner Style ON 🔊 Pill) */}
          <View style={styles.topBar}>
            <View style={styles.headerLeftContainer}>
              <View style={styles.leadCounterBadge}>
                <Animated.View
                  style={[
                    styles.pulsingDot,
                    { opacity: pulseAnim },
                  ]}
                />
                <Text style={styles.leadCounterText}>
                  {stackCount > 1 ? 'STACKED DISPATCH' : 'PRIORITY DISPATCH'}
                </Text>
              </View>

              {/* Stack Depth Counter Badge (e.g. 1 OF 3) */}
              {stackCount > 1 && (
                <View style={styles.stackCountPill}>
                  <MaterialIcons name="layers" size={13} color="#D4AF37" style={{ marginRight: 3 }} />
                  <Text style={styles.stackCountText}>{`1 OF ${stackCount}`}</Text>
                </View>
              )}
            </View>

            {/* Interactive Audio Toggle Pill (Reference Inspiration) */}
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.audioTogglePill, isMuted && styles.audioTogglePillMuted]}
              activeOpacity={0.7}
              hitSlop={10}
            >
              <MaterialIcons
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={16}
                color={isMuted ? COLORS.textMuted : '#ffffff'}
              />
              <Text style={[styles.audioToggleText, isMuted && styles.audioToggleTextMuted]}>
                {isMuted ? 'MUTED' : 'CHIME ON'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero Match & Urgency Section (High Visibility) */}
          <View style={styles.heroSection}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroMatchScore}>{matchScore}%</Text>
              <Text style={styles.heroMatchLabel}>MATCH CONFIDENCE</Text>
            </View>

            <View style={styles.heroRight}>
              <View style={styles.threatBadge}>
                <View style={styles.threatBeacon} />
                <Text style={styles.threatText}>{currentAlert.threatLevel} SIGHTING</Text>
              </View>
              <Text style={styles.caseBadgeText}>
                {currentAlert.fileNo || '#MP-2026-0891'}
              </Text>
            </View>
          </View>

          {/* Subject Preview Card with Crosshair Frame */}
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
              <View style={styles.detectedTimeBadge}>
                <MaterialIcons name="access-time" size={12} color={COLORS.primary} />
                <Text style={styles.detectedTimeText}>Detected Just Now · Central AI</Text>
              </View>
            </View>
          </View>

          {/* Vertical Delivery/Driver-Style Route Connector */}
          <View style={styles.routeContainer}>
            {/* Origin Node (Current Patrol Unit) */}
            <View style={styles.routeNodeRow}>
              <View style={styles.nodeIndicatorContainer}>
                <View style={styles.unitOriginDot} />
                <View style={styles.routeVerticalLine} />
              </View>
              <View style={styles.nodeTextContainer}>
                <View style={styles.nodeHeaderRow}>
                  <Text style={styles.nodeTitle}>Patrol Unit-042</Text>
                  <Text style={styles.distanceBadge}>0.4 km · ~2 min response</Text>
                </View>
                <Text style={styles.nodeSubtitle}>Current Active Sector Position</Text>
              </View>
            </View>

            {/* Destination Node (Sighting Location) */}
            <View style={styles.routeNodeRow}>
              <View style={styles.nodeIndicatorContainer}>
                <View style={styles.destinationMarker}>
                  <MaterialIcons name="place" size={14} color="#ef4444" />
                </View>
              </View>
              <View style={styles.nodeTextContainer}>
                <Text style={styles.destinationTitle} numberOfLines={2}>
                  {currentAlert.lastSeenLocation && currentAlert.lastSeenLocation !== 'Location Pending'
                    ? currentAlert.lastSeenLocation
                    : 'Majestic Central Terminal, Platform 2'}
                </Text>
                <Text style={styles.nodeSubtitle}>Verified CCTV Optical Intercept Zone</Text>
              </View>
            </View>
          </View>

          {/* Driver-Style Action Bar (Circle Pass + Wide Gold Accept) */}
          <View style={styles.actionRow}>
            {/* Pass Button */}
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handlePass}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <MaterialIcons name="close" size={20} color="#ef4444" />
              <Text style={styles.declineText}>Pass</Text>
            </TouchableOpacity>

            {/* Primary Accept & Intercept Button */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.85}
            >
              <MaterialIcons name="navigation" size={20} color="#0b0f17" style={{ marginRight: 8 }} />
              <Text style={styles.acceptButtonText}>ACCEPT & INTERCEPT</Text>
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
    backgroundColor: 'rgba(5, 7, 12, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: width - 32,
    maxWidth: 420,
    backgroundColor: '#0e121b',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#D4AF37',
    padding: 18,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 10,
  },
  // Physical Stack Layers Behind Top Card
  stackLayer2: {
    position: 'absolute',
    top: 'auto',
    bottom: 'auto',
    backgroundColor: '#0a0d14',
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderWidth: 1.5,
    transform: [{ translateY: 14 }, { scale: 0.94 }],
    opacity: 0.65,
    zIndex: 5,
  },
  stackLayer3: {
    position: 'absolute',
    top: 'auto',
    bottom: 'auto',
    backgroundColor: '#06080d',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    transform: [{ translateY: 26 }, { scale: 0.88 }],
    opacity: 0.35,
    zIndex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: ROUNDED.FULL,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  leadCounterText: {
    ...TYPOGRAPHY.labelCaps,
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stackCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: ROUNDED.FULL,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stackCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#D4AF37',
    fontFamily: 'monospace',
  },
  audioTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    borderRadius: ROUNDED.FULL,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  audioTogglePillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  audioToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  audioToggleTextMuted: {
    color: COLORS.onSurfaceVariant,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.07)',
    borderRadius: ROUNDED.LG,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
    marginBottom: 14,
  },
  heroLeft: {
    flex: 1,
  },
  heroMatchScore: {
    fontSize: 26,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  heroMatchLabel: {
    ...TYPOGRAPHY.labelCaps,
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  heroRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: ROUNDED.SM,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  threatBeacon: {
    width: 6,
    height: 6,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  threatText: {
    ...TYPOGRAPHY.labelCaps,
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 9.5,
  },
  caseBadgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  subjectCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  photoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#161b26',
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
  liveFrameTag: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveTagDot: {
    width: 4,
    height: 4,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
  },
  liveTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  subjectCategory: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginBottom: 6,
  },
  detectedTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detectedTimeText: {
    fontSize: 10.5,
    color: COLORS.primary,
    fontWeight: '600',
  },
  routeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  routeNodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeIndicatorContainer: {
    width: 22,
    alignItems: 'center',
    paddingTop: 3,
  },
  unitOriginDot: {
    width: 10,
    height: 10,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  routeVerticalLine: {
    width: 2,
    height: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 2,
  },
  destinationMarker: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTextContainer: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 6,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  distanceBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  destinationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 17,
  },
  nodeSubtitle: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  declineButton: {
    width: 80,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  declineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  acceptButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
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
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0b0f17',
    letterSpacing: 0.8,
  },
});
