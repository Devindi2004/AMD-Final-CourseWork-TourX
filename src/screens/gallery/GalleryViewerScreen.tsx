import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetGalleryItemQuery, useRecordGalleryDownloadMutation, useToggleGalleryLikeMutation } from '../../services/galleryApi';
import { useAppSelector } from '../../store/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ViewerPage({ galleryId }: { galleryId: string }) {
  const user = useAppSelector((s) => s.auth.user);
  const { data: item, isLoading } = useGetGalleryItemQuery(galleryId);
  const [toggleLike] = useToggleGalleryLikeMutation();
  const [recordDownload] = useRecordGalleryDownloadMutation();
  const [downloading, setDownloading] = useState(false);
  const lastTapRef = useRef(0);
  const scrollRef = useRef<any>(null);

  if (isLoading || !item) {
    return (
      <View style={[styles.page, styles.center]}>
        <ActivityIndicator color={colors.textInverse} size="large" />
      </View>
    );
  }

  const liked = user ? item.likedBy.includes(user.id) : false;

  const handleDoubleTapZoom = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      try {
        scrollRef.current?.scrollResponderZoomTo?.({ x: 0, y: 0, width: SCREEN_WIDTH / 2, height: SCREEN_HEIGHT / 2, animated: true });
      } catch {
        // best-effort only — pinch-zoom remains the reliable path
      }
    }
    lastTapRef.current = now;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const file = await File.downloadFileAsync(item.displayUrl, Paths.cache);
      await recordDownload(item.id);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      }
    } catch {
      // network/user-cancel — nothing to surface
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    Share.share({ message: `${item.title} — ${item.district}, ${item.province}, Sri Lanka\n${item.displayUrl}`, url: item.displayUrl });
  };

  return (
    <View style={styles.page}>
      <ScrollViewZoom ref={scrollRef} onPress={handleDoubleTapZoom}>
        <Image source={{ uri: item.displayUrl }} style={styles.image} resizeMode="contain" />
      </ScrollViewZoom>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton} onPress={() => toggleLike(item.id)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? colors.secondary : colors.textInverse} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleDownload} disabled={downloading}>
            {downloading ? <ActivityIndicator color={colors.textInverse} size="small" /> : <Ionicons name="download-outline" size={22} color={colors.textInverse} />}
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={22} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const ScrollViewZoom = React.forwardRef<any, { children: React.ReactNode; onPress: () => void }>(
  function ScrollViewZoom({ children, onPress }, ref) {
    return (
      <ScrollView
        ref={ref}
        style={styles.zoomScroll}
        contentContainerStyle={styles.zoomContent}
        maximumZoomScale={3}
        minimumZoomScale={1}
        centerContent
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={onPress}>{children}</Pressable>
      </ScrollView>
    );
  }
);

export default function GalleryViewerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'GalleryViewer'>>();
  const [index, setIndex] = useState(params.startIndex);

  return (
    <View style={styles.root}>
      <FlatList
        data={params.galleryIds}
        keyExtractor={(id) => id}
        horizontal
        pagingEnabled
        initialScrollIndex={params.startIndex}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
        renderItem={({ item }) => <ViewerPage galleryId={item} />}
      />

      <SafeAreaView style={styles.topBar} edges={['top']}>
        <Pressable accessibilityLabel="Close viewer" style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.textInverse} />
        </Pressable>
        {params.galleryIds.length > 1 ? (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{index + 1} / {params.galleryIds.length}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  page: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  zoomScroll: { flex: 1 },
  zoomContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8 },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  closeButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  counter: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  counterText: { ...typography.label, color: colors.textInverse },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.md, paddingBottom: spacing.lg, paddingTop: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomTitle: { ...typography.h3, color: colors.textInverse, marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.lg },
  actionButton: { alignItems: 'center', justifyContent: 'center' },
});
