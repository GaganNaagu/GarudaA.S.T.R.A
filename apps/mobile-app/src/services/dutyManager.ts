/**
 * Duty Manager — ON/OFF duty lifecycle controller for Garuda A.S.T.R.A
 *
 * Single entry point that App.tsx calls to control the entire
 * operational layer. Coordinates:
 *   - WebSocket connection (socketManager)
 *   - Foreground service (foregroundService)
 *   - Alert injection pipeline (alertService)
 *   - Immediate telemetry events
 *
 * This is the ONLY module App.tsx needs to import for service control.
 */

import * as SocketManager from './socketManager';
import * as ForegroundService from './foregroundService';
import * as SecureStore from 'expo-secure-store';
import { injectAlert, BackendAlertPayload } from '../utils/alertService';

// ---------- Types ----------

export interface DutyConfig {
  officerId: string;
  officerName: string;
  officerRank: string;
  wsUrl: string;
  telemetryIntervalMs?: number;  // Default: 15000
}

// ---------- Internal State ----------

let dutyActive = false;
let dutyEpoch = 0;
let currentConfig: DutyConfig | null = null;
let messageUnsubscribe: (() => void) | null = null;
let connectionUnsubscribe: (() => void) | null = null;
let disconnectTimer: any = null;
let periodicTelemetryTimer: any = null;

// ---------- Public API ----------

/**
 * Go ON DUTY.
 *
 * Sequence:
 * 1. Connect WebSocket to command center
 * 2. Wire up incoming alert injection
 * 3. Start foreground service (background loop + sticky notification)
 * 4. Send immediate DUTY_ON telemetry event
 *
 * Safe to call multiple times — no-ops if already on duty.
 */
export async function goOnDuty(config: DutyConfig): Promise<boolean> {
  // Cancel any scheduled disconnection from prior goOffDuty calls
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  if (dutyActive && SocketManager.isConnected()) {
    console.log('ℹ️ [DUTY] Already ON DUTY and connected.');
    return true;
  }

  const epoch = ++dutyEpoch;
  dutyActive = true;
  currentConfig = config;

  console.log(`
🟢 ============ GOING ON DUTY ============
🟢 OFFICER : ${config.officerName} (${config.officerId})
🟢 RANK    : ${config.officerRank}
🟢 WS URL  : ${config.wsUrl}
🟢 ========================================
`);

  // 1. Connect WebSocket
  const token = await SecureStore.getItemAsync('astra_token');
  if (epoch !== dutyEpoch) return false;
  let wsUrlWithToken = config.wsUrl;
  if (token) {
    if (wsUrlWithToken.includes('token=')) {
      wsUrlWithToken = wsUrlWithToken.replace(/token=[^&]+/, `token=${token}`);
    } else {
      wsUrlWithToken += (wsUrlWithToken.includes('?') ? '&' : '?') + `token=${token}`;
    }
  }
  SocketManager.connect(wsUrlWithToken);

  // 2. Wire up incoming alert messages from WebSocket → alertService
  if (messageUnsubscribe) {
    messageUnsubscribe();
    messageUnsubscribe = null;
  }
  if (connectionUnsubscribe) {
    connectionUnsubscribe();
    connectionUnsubscribe = null;
  }
  messageUnsubscribe = SocketManager.onMessage((data: any) => {
    // Handle alerts and dispatched assignments from backend
    const isStatusVerified = data.event === 'alert_status_updated' && (data.data?.status === 'Verified' || data.data?.status === 'Confirmed');
    if (data.event === 'possible_match_detected' || data.type === 'assignment' || isStatusVerified) {
      const isAssignment = data.type === 'assignment' || isStatusVerified;
      const alertData = (data.type === 'assignment') ? data : (data.data || data);
      
      const personName = alertData.missing_person?.full_name || alertData.person_name || alertData.full_name || (isAssignment ? 'CONFIRMED SIGHTING LEAD' : 'POSSIBLE MATCH DETECTED');
      const caseNumber = alertData.missing_person?.case_number || alertData.case_number || alertData.file_number || `#MP-${(alertData.alert_id || alertData.id || '').slice(-5) || '23854'}`;
      const rawPhoto = alertData.missing_person?.photo_path || alertData.image_path || alertData.detection_event?.image_path || '';

      let finalPhotoUrl = '';
      if (rawPhoto) {
        try {
          const wsUrlObj = new URL(config.wsUrl);
          let host = wsUrlObj.host;
          if (!host) {
            host = 'localhost:8000';
          }
          const httpProtocol = wsUrlObj.protocol === 'wss:' && !host.includes('localhost') ? 'https:' : 'http:';
          const baseUrl = `${httpProtocol}//${host}`;
          // Handle absolute server paths: extract from 'uploads/' onwards
          let photoPath = rawPhoto.replace(/\\/g, '/');
          const uploadsIdx = photoPath.indexOf('uploads/');
          if (uploadsIdx > -1) {
            photoPath = photoPath.substring(uploadsIdx);
          }
          photoPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
          finalPhotoUrl = `${baseUrl}${photoPath}`;
        } catch (e) {
          console.warn('Invalid wsUrl for parsing', config.wsUrl);
        }
      }
      console.log('🚨 WEBSOCKET PAYLOAD:', JSON.stringify(alertData, null, 2));
      console.log('🖼️ COMPUTED IMAGE URL:', finalPhotoUrl);

      const alertPayload: BackendAlertPayload = {
        id: alertData.alert_id || alertData.id || data.alert_id || String(Date.now()),
        title: personName,
        subtitle: isAssignment ? `Command Dispatched: ${personName}` : (alertData.message || 'Surveillance Lead Flagged'),
        description: alertData.message || `Match Confirmed by Central Dispatch`,
        threatLevel: isAssignment ? 'CRITICAL' : (alertData.severity || 'HIGH'),
        matchPercentage: alertData.confidence ? Math.round(alertData.confidence) : 99,
        fileNo: caseNumber,
        lastSeenLocation: alertData.location_name || alertData.location || (alertData.lat ? `Lat ${alertData.lat.toFixed(4)}, Lng ${alertData.lng.toFixed(4)}` : 'Majestic Central Terminal'),
        latitude: alertData.lat || alertData.detection_event?.camera_feed?.latitude || 18.9431,
        longitude: alertData.lng || alertData.detection_event?.camera_feed?.longitude || 72.8246,
        mugshotUrl: finalPhotoUrl,
        assignments: alertData.assignments || [],
      };
      injectAlert(alertPayload);
    }
  });

  // 3. Log connection state changes
  connectionUnsubscribe = SocketManager.onConnectionChange((connected) => {
    console.log(`🔌 [DUTY] WebSocket ${connected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}`);
  });

  // 4. Start foreground service
  const serviceStarted = await ForegroundService.startService({
    officerId: config.officerId,
    officerName: config.officerName,
    wsUrl: config.wsUrl,
    delayMs: config.telemetryIntervalMs || 15000,
  });
  if (epoch !== dutyEpoch) return false;

  if (!serviceStarted) {
    console.warn('⚠️ [DUTY] Native background action unavailable in Expo Go. Continuing in active foreground telemetry mode.');
    try {
      ForegroundService.sendImmediateTelemetry(
        'DUTY_ON',
        config.officerId,
        config.officerName,
        'ACTIVE DUTY'
      );
    } catch (e) { }
    return true;
  }

  // 5. Send immediate DUTY_ON telemetry after ensuring connection
  await SocketManager.waitForConnection(3000);
  if (epoch !== dutyEpoch) return false;
  ForegroundService.sendImmediateTelemetry(
    'DUTY_ON',
    config.officerId,
    config.officerName,
    'ACTIVE DUTY'
  );

  // 6. Guaranteed continuous periodic telemetry loop (active foreground & Expo Go resilient)
  if (periodicTelemetryTimer) {
    clearInterval(periodicTelemetryTimer);
    periodicTelemetryTimer = null;
  }
  const intervalMs = config.telemetryIntervalMs || 5000;
  periodicTelemetryTimer = setInterval(async () => {
    if (!dutyActive || !currentConfig) return;
    try {
      await ForegroundService.sendImmediateTelemetry(
        'PERIODIC',
        currentConfig.officerId,
        currentConfig.officerName,
        'ACTIVE DUTY'
      );
    } catch (err) {
      console.warn('⚠️ [DUTY] Periodic telemetry tick error:', err);
    }
  }, intervalMs);

  console.log('✅ [DUTY] Officer is now ON DUTY. All systems active.');
  return true;
}

/**
 * Go OFF DUTY.
 *
 * Sequence:
 * 1. Send immediate DUTY_OFF telemetry event
 * 2. Stop foreground service (removes notification, stops loop)
 * 3. Disconnect WebSocket
 * 4. Clean up event handlers
 *
 * Safe to call multiple times — no-ops if already off duty.
 */
export async function goOffDuty(): Promise<void> {
  const epoch = ++dutyEpoch;
  dutyActive = false;

  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  if (periodicTelemetryTimer) {
    clearInterval(periodicTelemetryTimer);
    periodicTelemetryTimer = null;
  }

  if (!dutyActive && !ForegroundService.isServiceRunning() && !SocketManager.isConnected()) {
    return;
  }

  console.log('🔴 [DUTY] Going OFF DUTY...');

  // 1. Send immediate DUTY_OFF telemetry (before disconnecting)
  if (currentConfig) {
    try {
      ForegroundService.sendImmediateTelemetry(
        'DUTY_OFF',
        currentConfig.officerId,
        currentConfig.officerName,
        'OFF DUTY'
      );
    } catch (e) {
      // Ignore if offline
    }
  }

  // 2. Stop foreground service
  await ForegroundService.stopService();

  // Guard against race conditions: if goOnDuty was called while stopping, do not disconnect
  if (epoch !== dutyEpoch || dutyActive) {
    console.log('ℹ️ [DUTY] Aborting off-duty teardown: New duty cycle active.');
    return;
  }

  // 3. Disconnect WebSocket
  SocketManager.disconnect();

  // 4. Clean up event handlers
  if (messageUnsubscribe) {
    messageUnsubscribe();
    messageUnsubscribe = null;
  }
  if (connectionUnsubscribe) {
    connectionUnsubscribe();
    connectionUnsubscribe = null;
  }

  currentConfig = null;
  console.log('🛑 [DUTY] Officer is now OFF DUTY. All systems stopped.');
}

/**
 * Check if duty is currently active.
 */
export function isDutyActive(): boolean {
  return dutyActive;
}

/**
 * Check if the WebSocket is connected (for UI status indicators).
 */
export function isSocketConnected(): boolean {
  return SocketManager.isConnected();
}

/**
 * Send an immediate telemetry event (LOGIN, LOGOUT, SOS).
 */
export function sendEvent(
  eventType: 'LOGIN' | 'LOGOUT' | 'SOS',
  officerId: string,
  officerName: string,
  customStatus?: string
): void {
  ForegroundService.sendImmediateTelemetry(eventType, officerId, officerName, customStatus);
}
