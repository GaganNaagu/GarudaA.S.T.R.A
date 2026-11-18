import { NativeModules } from 'react-native';

/**
 * Dynamically resolves the active backend host based on the Metro bundler connection.
 * On physical devices (e.g. iPhone on Wi-Fi), this automatically replaces 'localhost'
 * with the development workstation's LAN IP address.
 */
export function getResolvedBackendUrls() {
  let host = 'localhost';

  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const parsedHost = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
      if (parsedHost && parsedHost !== 'localhost' && parsedHost !== '127.0.0.1') {
        host = parsedHost;
      }
    }
  } catch (e) {
    // Fallback gracefully to localhost
  }

  const rawEnvApi = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const rawEnvWs = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/connect';

  const apiUrl = (rawEnvApi.includes('dpdns.org') || !rawEnvApi)
    ? `http://${host}:8000/api/v1`
    : rawEnvApi.replace('localhost', host).replace('127.0.0.1', host);

  const wsUrl = rawEnvWs.replace('localhost', host).replace('127.0.0.1', host);

  return { host, apiUrl, wsUrl };
}
