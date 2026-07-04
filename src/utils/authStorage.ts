import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'tourx_access_token';
const REFRESH_TOKEN_KEY = 'tourx_refresh_token';

// expo-secure-store has no native Keychain/Keystore on web, so it throws if called
// there. AsyncStorage (backed by localStorage on web) is a fine substitute for a
// dev-mode mock-server token; native platforms keep the more secure SecureStore.
const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string) {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}
async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}
async function removeItem(key: string) {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: StoredTokens) {
  await Promise.all([setItem(ACCESS_TOKEN_KEY, tokens.accessToken), setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)]);
}

export async function readTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_TOKEN_KEY), getItem(REFRESH_TOKEN_KEY)]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens() {
  await Promise.all([removeItem(ACCESS_TOKEN_KEY), removeItem(REFRESH_TOKEN_KEY)]);
}
