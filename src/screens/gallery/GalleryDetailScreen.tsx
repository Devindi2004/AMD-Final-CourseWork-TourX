import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SaveToggleButtons from '../../components/SaveToggleButtons';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import {
  useGenerateAiDescriptionMutation,
  useGetGalleryCommentsQuery,
  useGetGalleryItemQuery,
  useGetNearbyGalleryQuery,
  useToggleGalleryLikeMutation,
} from '../../services/galleryApi';
import { useAppSelector } from '../../store/hooks';
import type { GalleryInsights } from '../../types';
import { recordGalleryView } from '../../utils/galleryCache';

export default function GalleryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'GalleryDetail'>>();
  const user = useAppSelector((s) => s.auth.user);

  const { data: item, isLoading } = useGetGalleryItemQuery(params.galleryId);
  const { data: nearby } = useGetNearbyGalleryQuery(params.galleryId, { skip: !item });
  const { data: comments } = useGetGalleryCommentsQuery(params.galleryId);
  const [toggleLike] = useToggleGalleryLikeMutation();
  const [generateInsights, { isLoading: generatingInsights }] = useGenerateAiDescriptionMutation();
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    if (item) recordGalleryView({ id: item.id, title: item.title, thumbnailUrl: item.thumbnailUrl });
  }, [item]);

  if (isLoading || !item) return <LoadingView label="Loading photo..." />;

  const liked = user ? item.likedBy.includes(user.id) : false;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title} — ${item.district}, ${item.province}, Sri Lanka\n${item.displayUrl}`,
        url: item.displayUrl,
      });
    } catch {
      // user cancelled — nothing to do
    }
  };

  const handleGenerateInsights = async () => {
    setInsightsError(null);
    try {
      await generateInsights(item.id).unwrap();
    } catch (err: any) {
      setInsightsError(err?.data?.message || 'Could not generate AI insights right now.');
    }
  };

  return (
    <ScreenContainer padded={false}>
      <Pressable
        accessibilityLabel="View full screen"
        onPress={() => navigation.navigate('GalleryViewer', { galleryIds: [item.id], startIndex: 0 })}
      >
        <Image source={{ uri: item.displayUrl }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.expandHint}>
          <Ionicons name="expand" size={16} color={colors.textInverse} />
        </View>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.secondary} />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{item.district}, {item.province} · by {item.photographer || 'TourX community'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}><Ionicons name="eye-outline" size={14} color={colors.textMuted} /><Text style={styles.statText}>{item.views} views</Text></View>
          <View style={styles.statItem}><Ionicons name="heart-outline" size={14} color={colors.textMuted} /><Text style={styles.statText}>{item.likesCount} likes</Text></View>
          <View style={styles.statItem}><Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} /><Text style={styles.statText}>{comments?.length ?? 0} comments</Text></View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={[styles.likeButton, liked && styles.likeButtonActive]} onPress={() => toggleLike(item.id)}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.textInverse : colors.primary} />
            <Text style={[styles.likeButtonText, liked && styles.likeButtonTextActive]}>{liked ? 'Liked' : 'Like'}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Share" style={styles.iconButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityLabel="Open comments"
            style={styles.iconButton}
            onPress={() => navigation.navigate('GalleryComments', { galleryId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <SaveToggleButtons targetType="gallery" targetId={item.id} />

        <View style={styles.tagRow}>
          {item.tags.map((tag) => <Badge key={tag} label={`#${tag}`} tone="primary" />)}
          <Badge label={item.entryFee === 'free' ? 'Free Entry' : 'Paid Entry'} tone={item.entryFee === 'free' ? 'success' : 'neutral'} />
          {item.familyFriendly ? <Badge label="Family Friendly" tone="success" /> : null}
        </View>

        {item.description ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.description}>{item.description}</Text>
          </Card>
        ) : null}

        <Text style={styles.sectionTitle}>AI Destination Insights</Text>
        {item.aiDescription ? (
          <AiInsightsPanel insights={item.aiDescription} />
        ) : (
          <Card>
            <Text style={styles.description}>Get an AI-generated travel summary, history, best time to visit, budget estimate, and more for this destination.</Text>
            {insightsError ? <Text style={styles.errorText}>{insightsError}</Text> : null}
            <Button
              label="Generate AI Insights"
              onPress={handleGenerateInsights}
              loading={generatingInsights}
              variant="outline"
              icon={<Ionicons name="sparkles" size={16} color={colors.primary} />}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        {nearby && nearby.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Nearby Attractions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {nearby.map((n) => (
                <Pressable key={n.id} style={styles.nearbyCard} onPress={() => navigation.push('GalleryDetail', { galleryId: n.id })}>
                  <Image source={{ uri: n.thumbnailUrl }} style={styles.nearbyImage} />
                  <Text style={styles.nearbyTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.nearbyMeta}>{n.distanceKm} km · ~{n.estimatedMinutes} min</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function AiInsightsPanel({ insights }: { insights: GalleryInsights }) {
  return (
    <Card>
      <InsightBlock label="Overview" text={insights.travelSummary} />
      <InsightBlock label="History" text={insights.history} />
      <InsightBlock label="Best time to visit" text={insights.bestTimeToVisit} />
      <InsightBlock label="Weather" text={insights.weather} />
      <InsightList label="Things to do" items={insights.thingsToDo} />
      <InsightList label="Nearby attractions" items={insights.nearbyAttractions} />
      <InsightList label="Nearby hotels" items={insights.nearbyHotels} />
      <InsightList label="Nearby restaurants" items={insights.nearbyRestaurants} />
      <InsightList label="Travel tips" items={insights.travelTips} />
      <InsightBlock label="Estimated budget" text={insights.estimatedBudgetUsd} />
    </Card>
  );
}

function InsightBlock({ label, text }: { label: string; text: string }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.description}>{text}</Text>
    </View>
  );
}

function InsightList({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.insightLabel}>{label}</Text>
      {items.map((i, idx) => <Text key={idx} style={styles.description}>• {i}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  heroImage: { width: '100%', height: 280, backgroundColor: colors.border },
  expandHint: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    backgroundColor: colors.overlay, borderRadius: radius.pill, padding: spacing.sm,
  },
  content: { padding: spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { ...typography.h2, color: colors.text, flex: 1, marginRight: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.label, color: colors.text },
  meta: { ...typography.body, color: colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { ...typography.caption, color: colors.textMuted },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  likeButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingVertical: 11,
  },
  likeButtonActive: { backgroundColor: colors.primary },
  likeButtonText: { ...typography.label, color: colors.primary },
  likeButtonTextActive: { color: colors.textInverse },
  iconButton: {
    width: 44, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  description: { ...typography.body, color: colors.text, marginTop: 2 },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  insightLabel: { ...typography.label, color: colors.primaryDark, marginBottom: 2 },
  nearbyCard: { width: 140 },
  nearbyImage: { width: 140, height: 100, borderRadius: radius.sm, backgroundColor: colors.border },
  nearbyTitle: { ...typography.caption, color: colors.text, fontWeight: '700', marginTop: 4 },
  nearbyMeta: { ...typography.caption, color: colors.textMuted },
});
