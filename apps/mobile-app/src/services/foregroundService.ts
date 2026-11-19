/**
 * Foreground Service — Persistent background loop for Garuda A.S.T.R.A
 *
 * Wraps react-native-background-actions to provide a persistent Android
 * foreground service. The loop runs every 15s.
 * 
 * CRITICAL FIX: Removed dynamic updates to ensure the notification remains 
 * strictly non-clearable and permanently sticky on Android 13+.
 */

import { NativeModules, Platform } from 'react-native';
import * as SocketManager from './socketManager';
import { getBestEffortPosition, startGpsTracking, stopGpsTracking } from './gpsService';
import { getBatteryInfo } from './batteryService';
import { ensureCriticalPermissions } from './permissionService';

// ---------- Types ----------

export interface ServiceConfig {
  officerId: string;
  officerName: string;
  wsUrl: string;
  delayMs?: number; 
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  os_version: string;
  model: string;
  brand: string;
  app_version: string;
  is_emulator: boolean;
}

export function getDeviceDetails(): DeviceInfo {
  const isIOS = Platform.OS === 'ios';
  let model = isIOS ? 'Apple iPhone' : 'Android Device';
  let brand = isIOS ? 'Apple' : 'Android';
  let isEmulator = false;

  if (Platform.OS === 'android') {
    const c = Platform.constants as any;
    model = c?.Model || c?.Brand || 'Android Device';
    brand = c?.Manufacturer || c?.Brand || 'Android';
    const lower = model.toLowerCase();
    if (lower.includes('sdk') || lower.includes('emulator') || lower.includes('gphone') || lower.includes('goldfish')) {
      isEmulator = true;
      model = `Android Emulator (${c?.Model || 'Virtual Device'})`;
    }
  } else if (Platform.OS === 'ios') {
    const c = Platform.constants as any;
    if (c?.interfaceIdiom === 'pad') {
      model = 'Apple iPad';
    } else {
      model = 'Apple iPhone';
    }
  }

  return {
    platform: Platform.OS as any,
    os_version: `${Platform.OS.toUpperCase()} ${Platform.Version}`,
    model,
    brand,
    app_version: '2.1.0-alpha',
    is_emulator: isEmulator,
  };
}

export interface TelemetryPayload {
  officer_id: string;
  officer_name: string;
  gps: { lat: number; lng: number } | null;
  battery: number;
  charging: boolean;
  status: string;
  socket_connected: boolean;
  timestamp: string;
  event_type: 'PERIODIC' | 'DUTY_ON' | 'DUTY_OFF' | 'LOGIN' | 'LOGOUT' | 'SOS';
  device_info?: DeviceInfo;
}

// ---------- Internal State ----------

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let activeRunId = 0;

const getBackgroundService = (): any => {
  try {
    if (!NativeModules || !NativeModules.RNBackgroundActions) {
      return null;
    }
    const mod = require('react-native-background-actions');
    return mod.default || mod;
  } catch (e) {
    return null;
  }
};

// ---------- Background Loop ----------

async function operationalLoop(taskDataArguments?: { delay: number; officerId: string; officerName: string; wsUrl: string }) {
  const delay = taskDataArguments?.delay || 15000;
  const officerId = taskDataArguments?.officerId || 'UNKNOWN';
  const officerName = taskDataArguments?.officerName || 'UNKNOWN';
  
  const myRunId = activeRunId;

  console.log(`🟢 [FOREGROUND SERVICE] Started for Officer: ${officerName} (Run ID: ${myRunId})`);

  // Rely purely on JS-controlled activeRunId for loop lifecycle.
  // Using BackgroundService.isRunning() here causes a native race condition
  // if start() and stop() are called rapidly.
  while (activeRunId === myRunId) {
    try {
      // 1. Ensure WebSocket is alive
      SocketManager.ensureConnected();

      // 2. Collect GPS with native exception catch
      let gpsData = null;
      try {
        const gps = await getBestEffortPosition();
        gpsData = { lat: gps.latitude, lng: gps.longitude, source: gps.source };
      } catch (gpsError) {
        console.error('[FOREGROUND SERVICE] GPS Acquisition Failed:', gpsError);
      }

      // 3. Collect battery with native exception catch
      let batteryData = { level: 0, charging: false };
      try {
        batteryData = await getBatteryInfo();
      } catch (batteryError) {
        console.error('[FOREGROUND SERVICE] Battery Read Failed:', batteryError);
      }

      // 4. Build telemetry payload
      const deviceInfo = getDeviceDetails();
      const telemetry: TelemetryPayload = {
        officer_id: officerId,
        officer_name: officerName,
        gps: gpsData ? { lat: gpsData.lat, lng: gpsData.lng } : null,
        battery: batteryData.level,
        charging: batteryData.charging,
        status: 'on_duty',
        socket_connected: SocketManager.isConnected(),
        timestamp: new Date().toISOString(),
        event_type: 'PERIODIC',
        device_info: deviceInfo,
      };

      // 5. Send telemetry via WebSocket
      SocketManager.send({
        type: 'telemetry',
        payload: {
          ...telemetry,
          lat: gpsData ? gpsData.lat : null,
          lng: gpsData ? gpsData.lng : null,
          device_info: deviceInfo,
        },
      });

      // 7. Tactical logs
      console.log(`📡 Telemetry streamed at ${new Date().toLocaleTimeString()} • GPS: ${gpsData ? 'OK' : 'FAIL'}`);
    } catch (err) {
      console.error('[FOREGROUND SERVICE] Unexpected loop error:', err);
    }

    if (activeRunId !== myRunId) break;
    await sleep(delay);
  }

  console.log(`🛑 [FOREGROUND SERVICE] Loop exited (Run ID: ${myRunId}).`);
}

// ---------- Public API ----------

export async function startService(config: ServiceConfig): Promise<boolean> {
  const permissionsOk = await ensureCriticalPermissions();
  if (!permissionsOk) {
    console.warn('⚠️ [FOREGROUND SERVICE] Permissions missing.');
    return false;
  }

  const delayMs = config.delayMs || 5000;
  activeRunId++; // Invalidate any previous zombie loops

  // The static configuration applied here locks the notification layout natively
  const options = {
    taskName: 'GarudaASTRADutyService',
    taskTitle: 'GARUDA A.S.T.R.A: Active Duty',
    taskDesc: 'Secure tracking & encryption link active.',
    taskIcon: {
      name: 'ic_launcher_foreground',
      type: 'mipmap',
    },
    color: '#F6BE39',
    parameters: {
      delay: delayMs,
      officerId: config.officerId,
      officerName: config.officerName,
      wsUrl: config.wsUrl,
    },
    foregroundServiceType: ['location'] as ('location')[],
    
    // ADDITIONAL NATIVE FORCE OVERRIDES
    linkingURI: 'garudaastra://', // Pressing the locked panel safely launches the thread context
  };

  try {
    activeRunId++; // Fresh run ID to cleanly take over previous or stopped loops
    await startGpsTracking();
    const bgService = getBackgroundService();
    if (bgService) {
      await bgService.start(operationalLoop, options);
      console.log('✅ [FOREGROUND SERVICE] Started successfully with native background action.');
    } else {
      console.log('ℹ️ [FOREGROUND SERVICE] Running in active JS operational loop (Expo Go mode).');
      operationalLoop({
        delay: delayMs,
        officerId: config.officerId,
        officerName: config.officerName,
        wsUrl: config.wsUrl,
      });
    }
    return true;
  } catch (error) {
    console.error('❌ [FOREGROUND SERVICE] Failed to start:', error);
    return false;
  }
}

export async function stopService(): Promise<void> {
  activeRunId++; // Immediately terminate the JS loop
  try {
    stopGpsTracking();
    const bgService = getBackgroundService();
    if (bgService) {
      await bgService.stop();
      console.log('🛑 [FOREGROUND SERVICE] Stopped natively.');
    } else {
      console.log('🛑 [FOREGROUND SERVICE] Stopped JS operational loop.');
    }
  } catch (error) {
    console.error('❌ [FOREGROUND SERVICE] Failed to stop:', error);
  }
}

export function isServiceRunning(): boolean {
  const bgService = getBackgroundService();
  if (bgService) {
    try {
      return bgService.isRunning();
    } catch {
      return activeRunId > 0;
    }
  }
  return activeRunId > 0;
}

export async function sendImmediateTelemetry(
  eventType: TelemetryPayload['event_type'],
  officerId: string,
  officerName: string,
  customStatus?: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  
  let gpsData = null;
  let batteryLevel = 0;
  let batteryCharging = false;

  try {
    // We race the GPS and Battery fetches against a 500ms timeout so immediate telemetry
    // is truly "immediate" on the dashboard. The background loop will update accurate GPS later.
    const fetchData = async () => {
      const gps = await getBestEffortPosition();
      const battery = await getBatteryInfo();
      return { gps, battery };
    };

    const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 500));
    const result = await Promise.race([fetchData(), timeoutPromise]);

    if (result) {
      gpsData = { lat: result.gps.latitude, lng: result.gps.longitude };
      batteryLevel = result.battery.level;
      batteryCharging = result.battery.charging;
    }
  } catch {
    // Fail silently
  }

    const deviceInfo = getDeviceDetails();
    SocketManager.send({
      type: 'telemetry',
      payload: {
        officer_id: officerId,
        officer_name: officerName,
        gps: gpsData,
        lat: gpsData ? gpsData.lat : null,
        lng: gpsData ? gpsData.lng : null,
        battery: batteryLevel,
        charging: batteryCharging,
        status: customStatus || 'on_duty',
        event_type: eventType,
        timestamp,
        socket_connected: SocketManager.isConnected(),
        device_info: deviceInfo,
      },
    });
}
