import { Platform } from 'react-native';

let activePlayer: any = null;
let isMutedState = false;
let isAudioModeConfigured = false;

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
 * Play the tactical alert chime.
 * Uses tactical_ping.wav (creative sonar advisory chime rather than an abrasive siren).
 */
export async function playTacticalChime(): Promise<void> {
  if (isMutedState) return;

  await ensureAudioMode();

  try {
    const { createAudioPlayer } = require('expo-audio');
    if (!createAudioPlayer) return;

    if (!activePlayer) {
      // Use clean synthesized tactical sonar radar ping
      activePlayer = createAudioPlayer(require('../../assets/audio/tactical_ping.wav'));
      activePlayer.loop = true;
      activePlayer.volume = 0.95;
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
      activePlayer = createAudioPlayer(require('../../assets/audio/tactical_ping.wav'));
      activePlayer.loop = true;
      activePlayer.volume = 0.95;
      activePlayer.play();
    }
  } catch (err) {
    console.warn('⚠️ [TACTICAL AUDIO] Notice: Audio device status:', err);
  }
}

/**
 * Stop/pause tactical audio playback cleanly
 */
export function stopTacticalChime(): void {
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
    stopTacticalChime();
  } else {
    playTacticalChime();
  }
  return isMutedState;
}

export function isTacticalMuted(): boolean {
  return isMutedState;
}
