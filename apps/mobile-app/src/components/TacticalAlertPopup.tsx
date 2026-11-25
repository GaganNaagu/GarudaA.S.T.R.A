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
import { createAudioPlayer } from 'expo-audio';
import { COLORS, TYPOGRAPHY, ROUNDED, SPACING } from '../constants/theme';

interface TacticalAlertPopupProps {
  visible: boolean;
  alert: {
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
  } | null;
  onAcknowledge: () => void;
  onAccept?: (alert: any) => void;
  onDismiss?: () => void;
}

const { width } = Dimensions.get('window');

export const TacticalAlertPopup: React.FC<TacticalAlertPopupProps> = ({
  visible,
  alert,
  onAcknowledge,
  onAccept,
  onDismiss,
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Entrance & Continuous Pulse Animation
  useEffect(() => {
    if (visible) {
      setImageError(false);
      setIsMuted(false);

      // Tactical double-pulse vibration pattern
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 180, 80, 180]);
        } catch (e) {}
      }

      // Smooth slide up & fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
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
      slideAnim.setValue(60);
      opacityAnim.setValue(0);
      pulseAnim.setValue(0.4);
    }
  }, [visible]);

  // Audio warning sound playback
  useEffect(() => {
    let activePlayer: any = null;

    if (visible && alert && !isMuted) {
      try {
        const p = createAudioPlayer(require('../../assets/audio/alert.mp3'));
        p.loop = true;
        p.volume = 0.9;
        p.play();
        activePlayer = p;
        setPlayer(p);
      } catch (err) {
        console.warn('⚠️ [TACTICAL AUDIO] Notice: Audio device status:', err);
      }
    }

    return () => {
      if (activePlayer) {
        try {
          activePlayer.pause();
          activePlayer.release();
          activePlayer.remove();
        } catch (e) {}
      }
    };
  }, [visible, alert, isMuted]);

  const stopAudio = () => {
    if (player) {
      try {
        player.pause();
        player.release();
        player.remove();
      } catch (e) {}
      setPlayer(null);
    }
  };

  const toggleMute = () => {
    if (player) {
      try {
        if (!isMuted) {
          player.pause();
        } else {
          player.play();
        }
      } catch (e) {}
    }
    setIsMuted(!isMuted);
  };

  const handleAccept = () => {
    stopAudio();
    if (onAccept && alert) {
      onAccept(alert);
    } else {
      onAcknowledge();
    }
  };

  const handleDecline = () => {
    stopAudio();
    if (onDismiss) {
      onDismiss();
    } else {
      onAcknowledge();
    }
  };

  if (!visible || !alert) return null;

  // Target name extraction
  const targetName =
    alert.subtitle && alert.subtitle.startsWith('Match for ')
      ? alert.subtitle.replace(/^Match for /i, '')
      : alert.title !== 'URGENT ASSIGNMENT' && alert.title !== 'POSSIBLE MATCH DETECTED'
      ? alert.title
      : alert.subtitle || 'Tactical Sighting';

  const photoUri =
    !imageError && alert.mugshotUrl
      ? alert.mugshotUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=131210&color=D4AF37&size=256&bold=true`;

  const matchScore = alert.matchPercentage || 99;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Status & Audio Control Header (Gig Partner Style ON 🔊 Pill) */}
          <View style={styles.topBar}>
            <View style={styles.leadCounterBadge}>
              <Animated.View
                style={[
                  styles.pulsingDot,
                  { opacity: pulseAnim },
                ]}
              />
              <Text style={styles.leadCounterText}>PRIORITY DISPATCH</Text>
            </View>

            {/* Interactive Audio Toggle Pill (Reference 1 Inspiration) */}
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
                {isMuted ? 'MUTED' : 'SIREN ON'}
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
                <Text style={styles.threatText}>{alert.threatLevel} SIGHTING</Text>
              </View>
              <Text style={styles.caseBadgeText}>
                {alert.fileNo || '#MP-2026-0891'}
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

          {/* Vertical Delivery/Driver-Style Route Connector (References 1, 2, 3) */}
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
                  {alert.lastSeenLocation && alert.lastSeenLocation !== 'Location Pending'
                    ? alert.lastSeenLocation
                    : 'Majestic Central Terminal, Platform 2'}
                </Text>
                <Text style={styles.nodeSubtitle}>Verified CCTV Optical Intercept Zone</Text>
              </View>
            </View>
          </View>

          {/* Driver-Style Action Bar (References 1 & 3: Circle Decline + Big Gold Accept) */}
          <View style={styles.actionRow}>
            {/* Decline / Pass Button */}
            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDecline}
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
    backgroundColor: 'rgba(7, 10, 15, 0.92)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 20,
    padding: 18,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leadCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ROUNDED.FULL,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: ROUNDED.FULL,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  leadCounterText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  audioTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ROUNDED.FULL,
    gap: 5,
  },
  audioTogglePillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  audioToggleText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  audioToggleTextMuted: {
    color: COLORS.textMuted,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 14,
  },
  heroLeft: {
    flexDirection: 'column',
  },
  heroMatchScore: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  heroMatchLabel: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  heroRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: ROUNDED.SM,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  threatBeacon: {
    width: 6,
    height: 6,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  threatText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 10,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 0.6,
  },
  caseBadgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 10,
    marginBottom: 14,
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: ROUNDED.SM,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#1f2937',
  },
  mugshotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  crosshairH: {
    position: 'absolute',
    top: '50%',
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.6)',
  },
  crosshairV: {
    position: 'absolute',
    left: '50%',
    top: '20%',
    bottom: '20%',
    width: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.6)',
  },
  liveFrameTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(11, 15, 23, 0.85)',
    borderRadius: 2,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  liveTagDot: {
    width: 4,
    height: 4,
    borderRadius: ROUNDED.FULL,
    backgroundColor: '#ef4444',
  },
  liveTagText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  subjectDetails: {
    flex: 1,
    gap: 3,
  },
  subjectName: {
    ...TYPOGRAPHY.headlineMd,
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  subjectCategory: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  detectedTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detectedTimeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  routeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
