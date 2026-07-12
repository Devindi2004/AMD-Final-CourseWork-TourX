import { Ionicons } from '@expo/vector-icons';
import { useRoute, type RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from '../../components/TextField';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import {
  useDeleteGalleryCommentMutation,
  useGetGalleryCommentsQuery,
  useLikeGalleryCommentMutation,
  usePostGalleryCommentMutation,
  useReportGalleryCommentMutation,
} from '../../services/galleryApi';
import { useAppSelector } from '../../store/hooks';
import type { GalleryComment } from '../../types';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function GalleryCommentsScreen() {
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'GalleryComments'>>();
  const user = useAppSelector((s) => s.auth.user);
  const { data: comments, isLoading } = useGetGalleryCommentsQuery(params.galleryId);
  const [postComment, { isLoading: posting }] = usePostGalleryCommentMutation();
  const [deleteComment] = useDeleteGalleryCommentMutation();
  const [likeComment] = useLikeGalleryCommentMutation();
  const [reportComment] = useReportGalleryCommentMutation();

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<GalleryComment | null>(null);

  const topLevel = (comments ?? []).filter((c) => !c.parentCommentId);
  const repliesFor = (id: string) => (comments ?? []).filter((c) => c.parentCommentId === id);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await postComment({ galleryId: params.galleryId, text: text.trim(), parentCommentId: replyTo?.id ?? null }).unwrap();
      setText('');
      setReplyTo(null);
    } catch (err: any) {
      Alert.alert('Could not post comment', err?.data?.message || 'Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(id) },
    ]);
  };

  const handleReport = (id: string) => {
    Alert.alert('Report comment?', 'This will flag the comment for admin review.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', onPress: () => reportComment(id) },
    ]);
  };

  const renderComment = (comment: GalleryComment, isReply = false) => {
    const mine = user?.id === comment.userId;
    const liked = user ? comment.likedBy.includes(user.id) : false;
    return (
      <View key={comment.id} style={[styles.commentRow, isReply && styles.replyRow]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{comment.userName[0]?.toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{comment.userName} <Text style={styles.time}>· {timeAgo(comment.createdAt)}</Text></Text>
          <Text style={styles.text}>{comment.text}</Text>
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionItem} onPress={() => likeComment(comment.id)}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? colors.secondary : colors.textMuted} />
              <Text style={styles.actionText}>{comment.likesCount || ''}</Text>
            </Pressable>
            {!isReply ? (
              <Pressable style={styles.actionItem} onPress={() => setReplyTo(comment)}>
                <Text style={styles.actionText}>Reply</Text>
              </Pressable>
            ) : null}
            {mine ? (
              <Pressable style={styles.actionItem} onPress={() => handleDelete(comment.id)}>
                <Text style={styles.actionText}>Delete</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.actionItem} onPress={() => handleReport(comment.id)}>
                <Text style={styles.actionText}>Report</Text>
              </Pressable>
            )}
          </View>
          {!isReply ? repliesFor(comment.id).map((r) => renderComment(r, true)) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {isLoading ? (
          <LoadingView label="Loading comments..." />
        ) : (
          <FlatList
            data={topLevel}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => renderComment(item)}
            ListEmptyComponent={<EmptyState title="No comments yet" subtitle="Be the first to say something!" />}
          />
        )}

        {replyTo ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>Replying to {replyTo.userName}</Text>
            <Pressable onPress={() => setReplyTo(null)}><Ionicons name="close" size={16} color={colors.textMuted} /></Pressable>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <TextField label="" value={text} onChangeText={setText} placeholder="Write a comment..." />
          </View>
          <Pressable style={styles.sendButton} onPress={handleSend} disabled={posting}>
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  commentRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  replyRow: { marginLeft: spacing.lg, marginTop: spacing.sm, marginBottom: 0 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  author: { ...typography.label, color: colors.text },
  time: { ...typography.caption, color: colors.textMuted, fontWeight: '400' },
  text: { ...typography.body, color: colors.text, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actionText: { ...typography.caption, color: colors.textMuted },
  replyBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: colors.surface,
  },
  replyBannerText: { ...typography.caption, color: colors.textMuted },
  inputRow: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
});
