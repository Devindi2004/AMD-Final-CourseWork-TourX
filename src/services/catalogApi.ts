import { apiSlice } from './apiSlice';
import type { Hotel, PointOfInterest, Restaurant, Review } from '../types';

export const catalogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHotels: builder.query<Hotel[], { city?: string; priceRange?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.city) params.set('city', filters.city);
        if (filters?.priceRange) params.set('priceRange', filters.priceRange);
        const qs = params.toString();
        return `/api/hotels${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [...result.map((h) => ({ type: 'Hotel' as const, id: h.id })), { type: 'Hotel', id: 'LIST' }]
          : [{ type: 'Hotel', id: 'LIST' }],
    }),
    getHotel: builder.query<Hotel, string>({
      query: (id) => `/api/hotels/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Hotel', id }],
    }),
    getRestaurants: builder.query<Restaurant[], { city?: string; priceRange?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.city) params.set('city', filters.city);
        if (filters?.priceRange) params.set('priceRange', filters.priceRange);
        const qs = params.toString();
        return `/api/restaurants${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'Restaurant' as const, id: r.id })),
              { type: 'Restaurant', id: 'LIST' },
            ]
          : [{ type: 'Restaurant', id: 'LIST' }],
    }),
    getRestaurant: builder.query<Restaurant, string>({
      query: (id) => `/api/restaurants/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Restaurant', id }],
    }),
    getPois: builder.query<PointOfInterest[], { city?: string; category?: string; q?: string } | void>(
      {
        query: (filters) => {
          const params = new URLSearchParams();
          if (filters?.city) params.set('city', filters.city);
          if (filters?.category) params.set('category', filters.category);
          if (filters?.q) params.set('q', filters.q);
          const qs = params.toString();
          return `/pois${qs ? `?${qs}` : ''}`;
        },
      }
    ),
    getPoiByCode: builder.query<PointOfInterest, string>({
      query: (code) => `/pois/code/${code}`,
    }),
    getReviews: builder.query<Review[], { targetType?: string; targetId?: string; userId?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.targetType) params.set('targetType', filters.targetType);
        if (filters?.targetId) params.set('targetId', filters.targetId);
        if (filters?.userId) params.set('userId', filters.userId);
        const qs = params.toString();
        return `/api/reviews${qs ? `?${qs}` : ''}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'Review' as const, id: r.id })),
              { type: 'Review', id: 'LIST' },
            ]
          : [{ type: 'Review', id: 'LIST' }],
    }),
    createReview: builder.mutation<Review, Partial<Review>>({
      query: (body) => ({ url: '/api/reviews', method: 'POST', body }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),
    deleteReview: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/api/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetHotelsQuery,
  useGetHotelQuery,
  useGetRestaurantsQuery,
  useGetRestaurantQuery,
  useGetPoisQuery,
  useGetPoiByCodeQuery,
  useLazyGetPoiByCodeQuery,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useDeleteReviewMutation,
} = catalogApi;
