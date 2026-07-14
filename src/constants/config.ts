import Constants from 'expo-constants';
import { Platform } from 'react-native';

const MOCK_SERVER_PORT = 4000;

/**
 * Expo Go serves the JS bundle from the same LAN IP the dev machine is on.
 * Reusing that host means the mock server URL "just works" on a physical
 * phone over Wi-Fi without hand-editing an IP address per machine.
 */
function resolveHost(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return host;
  }
  if (Platform.OS === 'android') return '10.0.2.2'; // Android emulator loopback to host machine
  return 'localhost';
}

// Set at EAS build time (see eas.json's "env") to point a standalone build at a
// deployed backend instead of the dev machine's LAN IP, which only exists while
// `expo start` is running. Falls back to the dev-mode auto-detected host below.
const PRODUCTION_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const API_BASE_URL = PRODUCTION_API_BASE_URL || `http://${resolveHost()}:${MOCK_SERVER_PORT}`;
