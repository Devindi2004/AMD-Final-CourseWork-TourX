import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import {
  useApproveGalleryUploadMutation,
  useGetGalleryAnalyticsQuery,
  useGetPendingGalleryUploadsQuery,
  useRejectGalleryUploadMutation,
} from '../../services/galleryApi';

export default function GalleryAdminScreen() {
  const { data: pending, isLoading: pendingLoading } = useGetPendingGalleryUploadsQuery();
  const { data: analytics, isLoading: analyticsLoading } = useGetGalleryAnalyticsQuery();
  const [approve] = useApproveGalleryUploadMutation();
  const [reject] = useRejectGalleryUploadMutation();

  return (
    <ScreenContainer>
      <Text style={styles.sectionTitle}>Gallery Analytics</Text>
      {analyticsLoading || !analytics ? (
        <LoadingView label="Loading analytics..." />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <StatTile label="Total Images" value={analytics.totalImages} />
            <StatTile label="Pending" value={analytics.pendingUploads} />
            <StatTile label="Total Views" value={analytics.totalViews} />
            <StatTile label="Total Likes" value={analytics.totalLikes} />
            <StatTile label="Downloads" value={analytics.totalDownloads} />
          </View>

          <Text style={styles.subTitle}>Top Categories</Text>
          <Card style={{ marginBottom: spacing.md }}>
            {analytics.topCategories.map((c) => (
              <BarRow key={c.name} label={c.name} value={c.count} max={analytics.topCategories[0]?.count || 1} />
            ))}
          </Card>

          <Text style={styles.subTitle}>Trending Destinations</Text>
          <Card style={{ marginBottom: spacing.md }}>
            {analytics.trendingDestinations.map((d) => (
              <BarRow key={d.id} label={d.title} value={d.views} max={analytics.trendingDestinations[0]?.views || 1} />
            ))}
          </Card>
        </>
      )}

      <Text style={styles.sectionTitle}>Pending Uploads ({pending?.length ?? 0})</Text>
      {pendingLoading ? (
        <LoadingView label="Loading pending uploads..." />
      ) : !pending || pending.length === 0 ? (
        <EmptyState title="Nothing pending" subtitle="All caught up — no uploads awaiting review." />
      ) : (
        pending.map((item) => (
          <Card key={item.id} style={styles.pendingCard}>
            <View style={styles.pendingRow}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>{item.title}</Text>
                <Text style={styles.pendingMeta}>{item.category} · {item.district}, {item.province}</Text>
                <Text style={styles.pendingMeta}>by {item.photographer || 'unknown'}</Text>
              </View>
            </View>
            <View style={styles.approveRow}>
              <Button label="Reject" variant="outline" onPress={() => reject(item.id)} style={{ flex: 1 }} />
              <Button label="Approve" onPress={() => approve(item.id)} style={{ flex: 1 }} />
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(4, Math.round((value / max) * 100));
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h2, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.md },
  subTitle: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statTile: {
    width: '31%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center',
  },
  statValue: { ...typography.h2, color: colors.primaryDark },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  barRow: { marginBottom: spacing.sm },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { ...typography.caption, color: colors.text, flexShrink: 1, marginRight: spacing.sm },
  barValue: { ...typography.caption, color: colors.textMuted },
  barTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  pendingCard: { marginBottom: spacing.sm },
  pendingRow: { flexDirection: 'row', gap: spacing.sm },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.border },
  pendingTitle: { ...typography.label, color: colors.text },
  pendingMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  approveRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
