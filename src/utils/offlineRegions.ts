import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OfflineRegion } from '../types';

const KEY = 'tourx_offline_regions';

export async function getOfflineRegions(): Promise<OfflineRegion[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveOfflineRegions(regions: OfflineRegion[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(regions));
}
