import { NativeModules, Platform } from 'react-native';

/**
 * Universal backend URL resolver for Garuda A.S.T.R.A:
 * 1. Production Mode: When hosted on a remote server/cloud (HTTPS/WSS or external domain),
 *    connects directly over public internet.
 * 2. Android Emulator: Automatically resolves to '10.0.2.2' (or 'localhost' via adb reverse).
 * 3. Physical Devices (iPhone / Android on Wi-Fi): Resolves the host machine's LAN IP via
 *    Expo's hostUri, linkingUri, or fallback LAN IP.
 */
export function getResolvedBackendUrls() {
  const rawEnvApi = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const rawEnvWs = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/connect';

  // 1. Production / Hosted Server Check
  const isHostedProd =
    rawEnvApi.startsWith('https://') ||
    rawEnvWs.startsWith('wss://') ||
    (!rawEnvApi.includes('localhost') &&
      !rawEnvApi.includes('127.0.0.1') &&
      !rawEnvApi.includes('10.0.2.2') &&
      !rawEnvApi.includes('192.168.'));

  if (isHostedProd) {
    let wsUrl = rawEnvWs;
    if (!wsUrl.includes('token=')) {
      wsUrl += (wsUrl.includes('?') ? '&' : '?') + 'token=astra-tactical-auth-token';
    }
    return {
      host: 'production',
      apiUrl: rawEnvApi,
      wsUrl,
    };
  }

  // 2. Localhost / Local Wi-Fi Auto-Resolution
  let host = 'localhost';

  // Check if running on Android Emulator
  const isAndroid = Platform.OS === 'android';
  const c = Platform.constants as any;
  const isAndroidEmulator =
    isAndroid &&
    (c?.Model?.toLowerCase().includes('sdk') ||
      c?.Model?.toLowerCase().includes('emulator') ||
      c?.Model?.toLowerCase().includes('gphone') ||
      c?.Fingerprint?.includes('generic') ||
      c?.Brand?.toLowerCase().includes('google'));

  if (isAndroidEmulator) {
    // 10.0.2.2 always routes to the host machine's 127.0.0.1/0.0.0.0 on Android Emulator
    // without depending on `adb reverse tcp:8000 tcp:8000`
    host = '10.0.2.2';
  } else {
    // Inspect expo-constants for the development machine LAN IP
    let Constants: any = null;
    try {
      Constants = require('expo-constants').default || require('expo-constants');
    } catch (e) {}

    let discoveredHost: string | null = null;

    if (Constants?.expoConfig?.hostUri) {
      discoveredHost = Constants.expoConfig.hostUri.split(':')[0];
    } else if (Constants?.manifest2?.extra?.expoGo?.debuggerHost) {
      discoveredHost = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
    } else if (Constants?.manifest?.debuggerHost) {
      discoveredHost = Constants.manifest.debuggerHost.split(':')[0];
    } else if (Constants?.linkingUri) {
      const match = Constants.linkingUri.match(/:\/\/([^:/]+)/);
      if (match && match[1]) discoveredHost = match[1];
    } else if (NativeModules?.SourceCode?.scriptURL) {
      discoveredHost = NativeModules.SourceCode.scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
    }

    if (discoveredHost && discoveredHost !== 'localhost' && discoveredHost !== '127.0.0.1') {
      host = discoveredHost;
    } else {
      // Physical iOS or Android fallback to workstation LAN IP
      host = process.env.EXPO_PUBLIC_BACKEND_HOST || '192.168.0.5';
    }
  }

  const apiUrl = rawEnvApi.replace('localhost', host).replace('127.0.0.1', host);
  let wsUrl = rawEnvWs.replace('localhost', host).replace('127.0.0.1', host);
  if (!wsUrl.includes('token=')) {
    wsUrl += (wsUrl.includes('?') ? '&' : '?') + 'token=astra-tactical-auth-token';
  }

  return { host, apiUrl, wsUrl };
}
