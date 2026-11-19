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
  } | null;
  onAcknowledge: () => void;
}

const { width } = Dimensions.get('window');

export const TacticalAlertPopup: React.FC<TacticalAlertPopupProps> = ({
  visible,
  alert,
  onAcknowledge,
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Pulse & Entrance Animation
  useEffect(() => {
    if (visible) {
      setImageError(false);
      setIsMuted(false);

      // Tactical double-pulse vibration
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 180, 80, 180]);
        } catch (e) {}
      }

      // Smooth pop-in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0.4,
              duration: 900,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      pulseAnim.setValue(0.4);
      scaleAnim.setValue(0.95);
    }
  }, [visible]);

  // Audio warning sound playback
  useEffect(() => {
    let activePlayer: any = null;

    if (visible && alert && !isMuted) {
      try {
        const p = createAudioPlayer(require('../../assets/audio/alert.mp3'));
        p.loop = true;
        p.volume = 0.85;
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

  const handleClose = () => {
    if (player) {
      try {
        player.pause();
        player.release();
        player.remove();
      } catch (e) {}
    }
    setPlayer(null);
    onAcknowledge();
  };

  if (!visible || !alert) return null;

  // Resolve target name cleanly
  const targetName =
    alert.subtitle && alert.subtitle.startsWith('Match for ')
      ? alert.subtitle.replace(/^Match for /i, '')
      : alert.title !== 'URGENT ASSIGNMENT' && alert.title !== 'POSSIBLE MATCH DETECTED'
      ? alert.title
      : alert.subtitle || 'Tactical Sighting';

  const classification =
    alert.title === targetName
      ? 'FACIAL RECOGNITION MATCH'
      : alert.title || 'URGENT ASSIGNMENT';

  const photoUri =
    !imageError && alert.mugshotUrl
      ? alert.mugshotUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetName)}&background=131210&color=D4AF37&size=256&bold=true`;

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
            styles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Top Alert Banner */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.alertIconPulse}>
                <MaterialIcons name="security" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>SIGHTING MATCH DETECTED</Text>
                <Text style={styles.headerSubtitle}>Live CCTV Surveillance Feed</Text>
              </View>
            </View>

            {/* Sound Mute Toggle */}
            <TouchableOpacity
              onPress={toggleMute}
              style={[styles.muteBtn, isMuted && styles.muteBtnActive]}
              hitSlop={8}
            >
              <MaterialIcons
                name={isMuted ? 'volume-off' : 'volume-up'}
                size={18}
                color={isMuted ? COLORS.outline : COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Main Card Content */}
          <View style={styles.content}>
            {/* Target Photo with Hairline Frame */}
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photoUri }}
                style={styles.mugshot}
                onError={() => setImageError(true)}
              />

              {/* Live Detection Tag */}
              <View style={styles.feedTag}>
                <View style={styles.liveDot} />
                <Text style={styles.feedTagText}>LIVE CAMERA FRAME</Text>
              </View>
            </View>

            {/* Target Information */}
            <View style={styles.metaContainer}>
              <View style={styles.titleSection}>
                <Text style={styles.targetName} numberOfLines={1}>
                  {targetName}
                </Text>
              </View>

              {/* Confidence & Threat Badges */}
              <View style={styles.badgeRow}>
                <View style={styles.confidenceBadge}>
                  <MaterialIcons name="verified" size={13} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.confidenceText}>
                    {alert.matchPercentage || 98}% MATCH
                  </Text>
                </View>
                <View style={styles.threatBadge}>
                  <View style={styles.threatDot} />
                  <Text style={styles.threatText}>{alert.threatLevel} PRIORITY</Text>
                </View>
              </View>

              {/* Location & Case Meta */}
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="place" size={16} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {alert.lastSeenLocation && alert.lastSeenLocation !== 'Location Pending'
                      ? alert.lastSeenLocation
                      : 'Sector Alpha - Central Terminal'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <MaterialIcons name="folder-shared" size={16} color={COLORS.onSurfaceVariant} style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.infoValueMono}>
                    Case Record {alert.fileNo || '#MP-23854'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Footer (Uber/Rapido Driver-style Ergonomics) */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <MaterialIcons name="gps-fixed" size={18} color={COLORS.onPrimary} style={{ marginRight: 8 }} />
              <Text style={styles.actionButtonText}>ACCEPT & DISPATCH UNIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleClose}
              hitSlop={8}
            >
              <Text style={styles.dismissButtonText}>Dismiss / Standby</Text>
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
    backgroundColor: 'rgba(10, 9, 8, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.gutter,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDED.LG,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.18)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  alertIconPulse: {
    width: 32,
    height: 32,
    borderRadius: ROUNDED.SM,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTitle: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
    marginTop: 1,
  },
  muteBtn: {
    width: 34,
    height: 34,
    borderRadius: ROUNDED.SM,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  muteBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    width: width * 0.44,
    height: width * 0.44,
    borderRadius: ROUNDED.MD,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: COLORS.surfaceHigh,
  },
  mugshot: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  feedTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 9, 8, 0.85)',
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: ROUNDED.FULL,
    backgroundColor: COLORS.primary,
  },
  feedTagText: {
    ...TYPOGRAPHY.labelCaps,
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaContainer: {
    width: '100%',
    gap: 12,
  },
  titleSection: {
    alignItems: 'center',
  },
  targetName: {
    ...TYPOGRAPHY.headlineMd,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.SM,
  },
  confidenceText: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 9,
  },
  threatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ROUNDED.SM,
  },
  threatDot: {
    width: 5,
    height: 5,
    borderRadius: ROUNDED.FULL,
    backgroundColor: COLORS.error,
    marginRight: 4,
  },
  threatText: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 9,
  },
  infoGrid: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: ROUNDED.MD,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
    fontWeight: '600',
    fontSize: 12,
    flex: 1,
  },
  infoValueMono: {
    fontFamily: 'monospace',
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 11,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: ROUNDED.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...TYPOGRAPHY.labelCaps,
    color: COLORS.onPrimary,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dismissButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
});
