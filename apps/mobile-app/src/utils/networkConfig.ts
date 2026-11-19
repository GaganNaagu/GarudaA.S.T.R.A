import { NativeModules, Platform } from 'react-native';

/**
 * Dynamically resolves the active backend host based on the Metro bundler connection.
 * On physical devices (e.g. iPhone on Wi-Fi running Expo Go), this automatically replaces
 * 'localhost' with the development workstation's LAN IP address.
 */
export function getResolvedBackendUrls() {
  let host = 'localhost';

  try {
    // 1. Explicit override from build-time environment variable
    if (process.env.EXPO_PUBLIC_BACKEND_HOST) {
      host = process.env.EXPO_PUBLIC_BACKEND_HOST;
    } else {
      // 2. Safe inspection of expo-constants
      let Constants: any = null;
      try {
        Constants = require('expo-constants').default || require('expo-constants');
      } catch (e) {
        // Safe fallback if expo-constants is unavailable
      }

      // Dynamic hostUri provided by @expo/cli (e.g. "192.168.0.5:8081")
      if (Constants?.expoConfig?.hostUri) {
        const parsed = Constants.expoConfig.hostUri.split(':')[0];
        if (parsed && parsed !== 'localhost' && parsed !== '127.0.0.1') {
          host = parsed;
        }
      }
      // Modern Expo Go manifest2
      else if (Constants?.manifest2?.extra?.expoGo?.debuggerHost) {
        const parsed = Constants.manifest2.extra.expoGo.debuggerHost.split(':')[0];
        if (parsed && parsed !== 'localhost' && parsed !== '127.0.0.1') {
          host = parsed;
        }
      }
      // Classic Expo manifest
      else if (Constants?.manifest?.debuggerHost) {
        const parsed = Constants.manifest.debuggerHost.split(':')[0];
        if (parsed && parsed !== 'localhost' && parsed !== '127.0.0.1') {
          host = parsed;
        }
      }
      // Expo deep-link URI (e.g. "exp://192.168.0.5:8081")
      else if (Constants?.linkingUri) {
        const match = Constants.linkingUri.match(/:\/\/([^:/]+)/);
        if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
          host = match[1];
        }
      }
      // 3. Fallback to NativeModules SourceCode scriptURL
      else if (NativeModules?.SourceCode?.scriptURL) {
        const scriptURL = NativeModules.SourceCode.scriptURL;
        const parsedHost = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
        if (parsedHost && parsedHost !== 'localhost' && parsedHost !== '127.0.0.1') {
          host = parsedHost;
        }
      }
    }
  } catch (e) {
    // Fallback gracefully
  }

  // 4. Physical device fallback: On physical iOS devices (e.g. iPhone running Expo Go),
  // 'localhost' refers to the iPhone itself where no FastAPI backend is listening.
  // When running on iOS and host is unresolved, fallback to the local LAN development IP.
  if ((host === 'localhost' || host === '127.0.0.1') && Platform.OS === 'ios') {
    host = '192.168.0.5';
  }

  const rawEnvApi = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const rawEnvWs = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/connect?token=astra-tactical-auth-token';

  const apiUrl = (rawEnvApi.includes('dpdns.org') || !rawEnvApi)
    ? `http://${host}:8000/api/v1`
    : rawEnvApi.replace('localhost', host).replace('127.0.0.1', host);

  let wsUrl = rawEnvWs.replace('localhost', host).replace('127.0.0.1', host);
  if (!wsUrl.includes('token=')) {
    wsUrl += (wsUrl.includes('?') ? '&' : '?') + 'token=astra-tactical-auth-token';
  }

  return { host, apiUrl, wsUrl };
}
