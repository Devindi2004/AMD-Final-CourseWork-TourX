import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'tourx_access_token';

// expo-secure-store has no native Keychain/Keystore on web, so it throws if called
// there. AsyncStorage (backed by localStorage on web) is a fine substitute for a
// dev-mode mock-server token; native platforms keep the more secure SecureStore.
const isWeb = Platform.OS === 'web';

export async function saveToken(token: string) {
  if (isWeb) return AsyncStorage.setItem(TOKEN_KEY, token);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function readToken(): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  if (isWeb) return AsyncStorage.removeItem(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
