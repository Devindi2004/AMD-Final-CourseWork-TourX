import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = 'tourx_gallery_recent';
const MAX_RECENT = 20;

export interface RecentGalleryEntry {
  id: string;
  title: string;
  thumbnailUrl: string;
  viewedAt: string;
}

export async function getRecentGalleryItems(): Promise<RecentGalleryEntry[]> {
  const raw = await AsyncStorage.getItem(RECENT_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function recordGalleryView(entry: Omit<RecentGalleryEntry, 'viewedAt'>): Promise<void> {
  const existing = await getRecentGalleryItems();
  const withoutDupe = existing.filter((e) => e.id !== entry.id);
  const next = [{ ...entry, viewedAt: new Date().toISOString() }, ...withoutDupe].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
