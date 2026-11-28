/**
 * Alert Service — Unified modular alert system for Garuda A.S.T.R.A
 *
 * Provides a single entry point for all incoming alerts, whether from:
 * - Backend WebSocket push (via socketManager → dutyManager)
 * - Local simulation / testing
 * - System-generated events
 *
 * All alerts follow the same AlertItem structure and are injected
 * uniformly into the app's state via registered callbacks.
 *
 * NOTE: WebSocket management has been moved to socketManager.ts.
 * This module only handles alert normalization, injection, and callbacks.
 */

import { Platform } from 'react-native';
import { AlertItem } from './mockState';

// ---------- Types ----------

/** Minimal payload the backend sends over WebSocket */
export interface BackendAlertPayload {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  severity?: string;
  threatLevel?: 'HIGH' | 'MODERATE' | 'LOW' | 'CRITICAL' | string;
  matchPercentage?: number;
  fileNo?: string;
  lastSeenLocation?: string;
  lastSeenTime?: string;
  mugshotUrl?: string;
  latitude?: number;
  longitude?: number;
  location?: { lat: number; lng: number };
  assignments?: Array<{
    status: string;
    officer?: {
      badge_number: string;
      user?: {
        full_name: string;
      };
    };
  }>;
  telemetry?: {
    azimuth: string;
    zoom: string;
    lens: string;
    signal: string;
  };
}

/** Callback types the App registers to handle incoming alerts */
export interface AlertServiceCallbacks {
  onNewAlert: (alert: AlertItem) => void;
  onTacticalPopup: (alert: AlertItem) => void;
}

// ---------- State ----------

let callbacks: AlertServiceCallbacks | null = null;
const pendingAlertsQueue: BackendAlertPayload[] = [];
const recentAlertIds = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60000;
const CRITICAL_CHANNEL_ID = 'critical-alerts';

const FALLBACK_LAT = 18.9431;
const FALLBACK_LON = 72.8246;

// ---------- Core: Normalize + Inject ----------

/**
 * Converts a backend payload (or partial data) into a full AlertItem.
 * Missing fields get sensible defaults so the UI never breaks.
 */
export function normalizeAlert(payload: BackendAlertPayload): AlertItem {
  return {
    id: payload.id || `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: payload.title,
    subtitle: payload.subtitle || 'Incoming Alert',
    threatLevel: (payload.threatLevel || (payload.severity as any) || 'HIGH') as AlertItem['threatLevel'],
    matchPercentage: payload.matchPercentage,
    fileNo: payload.fileNo || `#AUTO-${Date.now().toString().slice(-5)}`,
    lastSeenLocation: payload.lastSeenLocation || 'Location Pending',
    lastSeenTime: payload.lastSeenTime || 'Just Now',
    mugshotUrl: payload.mugshotUrl || '',
    latitude: payload.latitude || FALLBACK_LAT,
    longitude: payload.longitude || FALLBACK_LON,
    status: 'ALERT',
    assignments: payload.assignments,
    telemetry: payload.telemetry,
  };
}

// Safely load Notifications on-demand to prevent module evaluation crashes (e.g. ExpoApplication runtime not ready)
let Notifications: any = null;
let notificationsChecked = false;

function getNotificationModule() {
  if (!notificationsChecked) {
    notificationsChecked = true;
    try {
      Notifications = require('expo-notifications');
      if (Notifications?.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            // Foreground only: TacticalAlertPopup already plays the in-app chime,
            // so suppress the system notification sound/banner while in foreground.
            // When app is backgrounded, Android uses the 'critical-alerts' MAX channel directly.
            shouldShowBanner: false,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: true,
          }),
        });
      }
      if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
        Notifications.setNotificationChannelAsync(CRITICAL_CHANNEL_ID, {
          name: 'Critical Tactical Alerts',
          description: 'High-priority heads-up alerts for confirmed missing person sightings.',
          importance: Notifications.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#DC2626',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
          bypassDnd: true,
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        }).catch((err: any) => {
          console.warn('⚠️ [ALERT SERVICE] Failed to create critical-alerts channel:', err);
        });
      }
    } catch (err) {
      // In Expo Go or when native module is missing, gracefully disable push alerts
      Notifications = null;
    }
  }
  return Notifications;
}

/**
 * Universal alert injection point.
 * Call this from WebSocket handler, local simulation, or any source.
 * It normalizes the payload and triggers both the feed insert and the tactical popup.
 */
export function injectAlert(payload: BackendAlertPayload): AlertItem | null {
  if (!callbacks) {
    console.log('📦 [ALERT SERVICE] Callbacks not yet ready, queuing incoming alert:', payload.title);
    pendingAlertsQueue.push(payload);
    return null;
  }

  const alert = normalizeAlert(payload);

  // Deduplicate rapid duplicate WebSocket events (e.g. assignment + alert_status_updated) for the same alert ID
  const dedupeKey = String(alert.id);
  const now = Date.now();
  const lastSeen = recentAlertIds.get(dedupeKey);
  if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
    console.log(`🔁 [ALERT SERVICE] Duplicate alert suppressed (${dedupeKey})`);
    return null;
  }
  recentAlertIds.set(dedupeKey, now);
  if (recentAlertIds.size > 100) {
    for (const [k, ts] of recentAlertIds.entries()) {
      if (now - ts >= DEDUPE_WINDOW_MS) recentAlertIds.delete(k);
    }
  }

  // Inject into alert feed
  callbacks.onNewAlert(alert);

  // Trigger full-screen tactical popup + audio
  callbacks.onTacticalPopup(alert);

  // Send high-priority heads-up local push notification if native module is available
  try {
    const notif = getNotificationModule();
    if (notif?.scheduleNotificationAsync) {
      notif.scheduleNotificationAsync({
        identifier: dedupeKey,
        content: {
          title: `🚨 ${alert.threatLevel} THREAT DETECTED`,
          body: `Match for ${alert.title} at ${alert.lastSeenLocation}`,
          data: { alertId: alert.id },
          sound: 'default',
          priority: notif.AndroidNotificationPriority?.MAX ?? 'max',
          vibrate: [0, 300, 200, 300],
          color: '#DC2626',
          autoDismiss: false,
        },
        trigger: Platform.OS === 'android' ? { channelId: CRITICAL_CHANNEL_ID } : null,
      }).catch((err: any) => {
        console.warn('⚠️ [ALERT SERVICE] Failed to send push notification:', err);
      });
    }
  } catch (e) {
    // Non-critical in Expo Go
  }

  console.log(`
🚨 ============ INCOMING ALERT ============
🚨 ID              : ${alert.id}
🚨 TITLE           : ${alert.title}
🚨 THREAT LEVEL    : ${alert.threatLevel}
🚨 LOCATION        : ${alert.lastSeenLocation}
🚨 FILE NO         : ${alert.fileNo}
🚨 ==========================================
`);

  return alert;
}

// ---------- Callback Registration ----------

/**
 * Register the App's alert handlers. Must be called once at app startup.
 */
export function registerAlertCallbacks(cbs: AlertServiceCallbacks) {
  callbacks = cbs;
  // Pre-register the high-priority Android notification channel on startup
  getNotificationModule();
  console.log('✅ [ALERT SERVICE] Callbacks registered.');
  // Flush any queued alerts
  while (pendingAlertsQueue.length > 0) {
    const pending = pendingAlertsQueue.shift();
    if (pending) {
      injectAlert(pending);
    }
  }
}

/**
 * Unregister callbacks (e.g., on logout).
 */
export function unregisterAlertCallbacks() {
  callbacks = null;
}

// ---------- Simulation Helpers ----------

/**
 * Simulate an incoming backend alert after a delay.
 * Useful for demos and testing the full pipeline without a live backend.
 */
export function simulateIncomingAlert(payload: BackendAlertPayload, delayMs: number = 0): any {
  return setTimeout(() => {
    injectAlert(payload);
  }, delayMs);
}
