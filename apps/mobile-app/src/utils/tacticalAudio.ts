import { Platform } from 'react-native';

let activePlayer: any = null;
let isMutedState = false;
let isAudioModeConfigured = false;
let lastPlayTimestamp = 0;
let alertRingtoneInterval: any = null;

/**
 * Configure audio subsystem for high-priority tactical playback
 */
async function ensureAudioMode() {
  if (isAudioModeConfigured) return;
  try {
    const { setAudioModeAsync } = require('expo-audio');
    if (setAudioModeAsync) {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
      });
      isAudioModeConfigured = true;
    }
  } catch (err) {
    // Non-fatal fallback for restricted runtimes
  }
}

/**
 * Play a single clean, pleasant tactical advisory chime.
 * Non-looping, comfortable volume, and single execution to prevent overlapping sound clutter.
 */
export async function playTacticalChime(force = false): Promise<void> {
  if (isMutedState) return;

  const now = Date.now();
  // Prevent rapid duplicate sound triggers (cooldown of 1200ms)
  if (!force && now - lastPlayTimestamp < 1200) {
    return;
  }
  lastPlayTimestamp = now;

  await ensureAudioMode();

  try {
    const { createAudioPlayer } = require('expo-audio');
    if (!createAudioPlayer) return;

    if (!activePlayer) {
      // Official mobile tactical sighting alert sound from sfx/Mobile Alert.wav
      activePlayer = createAudioPlayer(require('../../assets/audio/mobile_alert.wav'));
      activePlayer.loop = false;
      activePlayer.volume = 0.75;
    }

    try {
      if (activePlayer.seekTo) {
        await activePlayer.seekTo(0);
      }
      activePlayer.play();
    } catch (playErr) {
      // If player was in an invalid state, recreate cleanly
      try {
        if (activePlayer.release) activePlayer.release();
        if (activePlayer.remove) activePlayer.remove();
      } catch (e) {}
      activePlayer = createAudioPlayer(require('../../assets/audio/mobile_alert.wav'));
      activePlayer.loop = false;
      activePlayer.volume = 0.75;
      activePlayer.play();
    }
  } catch (err) {
    console.warn('⚠️ [TACTICAL AUDIO] Notice: Audio device status:', err);
  }
}

/**
 * Start playing the single clean chime periodically (every 3.5 seconds)
 * until the officer accepts or dismisses the alert.
 */
export function startTacticalAlertRingtone(): void {
  if (isMutedState) return;

  stopTacticalAlertRingtone();

  // Play single chime immediately
  playTacticalChime(true);

  // Repeat the single chime every 3.5 seconds until acknowledged/dismissed
  alertRingtoneInterval = setInterval(() => {
    if (isMutedState) {
      stopTacticalAlertRingtone();
      return;
    }
    playTacticalChime(true);
  }, 3500);
}

/**
 * Stop the periodic alert chime immediately upon user interaction
 */
export function stopTacticalAlertRingtone(): void {
  if (alertRingtoneInterval) {
    clearInterval(alertRingtoneInterval);
    alertRingtoneInterval = null;
  }
  stopTacticalChime();
}

/**
 * Stop/pause tactical audio playback cleanly
 */
export function stopTacticalChime(): void {
  if (alertRingtoneInterval) {
    clearInterval(alertRingtoneInterval);
    alertRingtoneInterval = null;
  }
  if (activePlayer) {
    try {
      activePlayer.pause();
    } catch (e) {}
  }
}

/**
 * Release audio player resources when component unmounts
 */
export function releaseTacticalAudio(): void {
  if (activePlayer) {
    try {
      activePlayer.pause();
      if (activePlayer.release) activePlayer.release();
      if (activePlayer.remove) activePlayer.remove();
    } catch (e) {}
    activePlayer = null;
  }
}

/**
 * Toggle or set mute state
 */
export function setTacticalMuted(muted: boolean): boolean {
  isMutedState = muted;
  if (muted) {
    stopTacticalAlertRingtone();
  } else {
    playTacticalChime(true);
  }
  return isMutedState;
}

export function isTacticalMuted(): boolean {
  return isMutedState;
}
