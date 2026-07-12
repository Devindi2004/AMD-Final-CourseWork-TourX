import { apiSlice } from './apiSlice';
import type {
  GalleryAnalytics,
  GalleryComment,
  GalleryInsights,
  GalleryItem,
  GalleryListFilters,
  GalleryListResponse,
  GalleryNearbyItem,
} from '../types';

function buildParams(filters?: GalleryListFilters) {
  const params = new URLSearchParams();
  if (!filters) return params;
  if (filters.category) params.set('category', filters.category);
  if (filters.district) params.set('district', filters.district);
  if (filters.province) params.set('province', filters.province);
  if (filters.q) params.set('q', filters.q);
  if (filters.tags) params.set('tags', filters.tags);
  if (filters.minRating) params.set('minRating', String(filters.minRating));
  if (filters.entryFee) params.set('entryFee', filters.entryFee);
  if (filters.familyFriendly !== undefined) params.set('familyFriendly', String(filters.familyFriendly));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params;
}

export const galleryApi = apiSlice.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (builder) => ({
    getGalleryList: builder.query<GalleryListResponse, GalleryListFilters | void>({
      query: (filters) => `/api/gallery?${buildParams(filters ?? undefined).toString()}`,
      providesTags: (result) =>
        result
          ? [...result.items.map((g) => ({ type: 'Gallery' as const, id: g.id })), { type: 'Gallery', id: 'LIST' }]
          : [{ type: 'Gallery', id: 'LIST' }],
    }),
    getTrendingGallery: builder.query<GalleryListResponse, void>({
      query: () => '/api/gallery/trending',
      providesTags: [{ type: 'Gallery', id: 'LIST' }],
    }),
    getGalleryItem: builder.query<GalleryItem, string>({
      query: (id) => `/api/gallery/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Gallery', id }],
    }),
    getNearbyGallery: builder.query<GalleryNearbyItem[], string>({
      query: (id) => `/api/gallery/${id}/nearby`,
    }),
    createGalleryItem: builder.mutation<GalleryItem, Partial<GalleryItem>>({
      query: (body) => ({ url: '/api/gallery', method: 'POST', body }),
      invalidatesTags: [{ type: 'Gallery', id: 'LIST' }],
    }),
    updateGalleryItem: builder.mutation<GalleryItem, { id: string; changes: Partial<GalleryItem> }>({
      query: ({ id, changes }) => ({ url: `/api/gallery/${id}`, method: 'PUT', body: changes }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Gallery', id }, { type: 'Gallery', id: 'LIST' }],
    }),
    deleteGalleryItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/gallery/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Gallery', id: 'LIST' }],
    }),
    toggleGalleryLike: builder.mutation<{ liked: boolean; likesCount: number }, string>({
      query: (id) => ({ url: `/api/gallery/${id}/like`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Gallery', id }],
    }),
    recordGalleryDownload: builder.mutation<{ downloads: number }, string>({
      query: (id) => ({ url: `/api/gallery/${id}/download`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Gallery', id }],
    }),
    generateAiDescription: builder.mutation<GalleryInsights, string>({
      query: (id) => ({ url: `/api/gallery/${id}/ai-description`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Gallery', id }],
    }),

    getGalleryComments: builder.query<GalleryComment[], string>({
      query: (galleryId) => `/api/gallery/${galleryId}/comments`,
      providesTags: (result) =>
        result
          ? [...result.map((c) => ({ type: 'GalleryComment' as const, id: c.id })), { type: 'GalleryComment', id: 'LIST' }]
          : [{ type: 'GalleryComment', id: 'LIST' }],
    }),
    postGalleryComment: builder.mutation<GalleryComment, { galleryId: string; text: string; parentCommentId?: string | null }>({
      query: ({ galleryId, ...body }) => ({ url: `/api/gallery/${galleryId}/comments`, method: 'POST', body }),
      invalidatesTags: [{ type: 'GalleryComment', id: 'LIST' }],
    }),
    deleteGalleryComment: builder.mutation<void, string>({
      query: (commentId) => ({ url: `/api/gallery/comments/${commentId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'GalleryComment', id: 'LIST' }],
    }),
    likeGalleryComment: builder.mutation<{ liked: boolean; likesCount: number }, string>({
      query: (commentId) => ({ url: `/api/gallery/comments/${commentId}/like`, method: 'POST' }),
      invalidatesTags: [{ type: 'GalleryComment', id: 'LIST' }],
    }),
    reportGalleryComment: builder.mutation<{ message: string }, string>({
      query: (commentId) => ({ url: `/api/gallery/comments/${commentId}/report`, method: 'POST' }),
      invalidatesTags: [{ type: 'GalleryComment', id: 'LIST' }],
    }),

    // ---- Admin moderation ----
    getPendingGalleryUploads: builder.query<GalleryItem[], void>({
      query: () => '/admin/gallery/pending',
      providesTags: [{ type: 'Gallery', id: 'PENDING' }],
    }),
    approveGalleryUpload: builder.mutation<GalleryItem, string>({
      query: (id) => ({ url: `/admin/gallery/${id}/approve`, method: 'POST' }),
      invalidatesTags: [{ type: 'Gallery', id: 'PENDING' }, { type: 'Gallery', id: 'LIST' }],
    }),
    rejectGalleryUpload: builder.mutation<GalleryItem, string>({
      query: (id) => ({ url: `/admin/gallery/${id}/reject`, method: 'POST' }),
      invalidatesTags: [{ type: 'Gallery', id: 'PENDING' }, { type: 'Gallery', id: 'LIST' }],
    }),
    getGalleryAnalytics: builder.query<GalleryAnalytics, void>({
      query: () => '/admin/gallery/analytics',
    }),
  }),
});

export const {
  useGetGalleryListQuery,
  useGetTrendingGalleryQuery,
  useGetGalleryItemQuery,
  useGetNearbyGalleryQuery,
  useCreateGalleryItemMutation,
  useUpdateGalleryItemMutation,
  useDeleteGalleryItemMutation,
  useToggleGalleryLikeMutation,
  useRecordGalleryDownloadMutation,
  useGenerateAiDescriptionMutation,
  useGetGalleryCommentsQuery,
  usePostGalleryCommentMutation,
  useDeleteGalleryCommentMutation,
  useLikeGalleryCommentMutation,
  useReportGalleryCommentMutation,
  useGetPendingGalleryUploadsQuery,
  useApproveGalleryUploadMutation,
  useRejectGalleryUploadMutation,
  useGetGalleryAnalyticsQuery,
} = galleryApi;
