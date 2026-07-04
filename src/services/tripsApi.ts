import { apiSlice } from './apiSlice';
import type { Trip } from '../types';

export const tripsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrips: builder.query<Trip[], string>({
      query: (userId) => `/api/trips?userId=${userId}`,
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: 'Trip' as const, id: t.id })), { type: 'Trip', id: 'LIST' }]
          : [{ type: 'Trip', id: 'LIST' }],
    }),
    getTrip: builder.query<Trip, string>({
      query: (id) => `/api/trips/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Trip', id }],
    }),
    createTrip: builder.mutation<Trip, Partial<Trip>>({
      query: (body) => ({ url: '/api/trips', method: 'POST', body }),
      invalidatesTags: [{ type: 'Trip', id: 'LIST' }],
    }),
    updateTrip: builder.mutation<Trip, { id: string; changes: Partial<Trip> }>({
      query: ({ id, changes }) => ({ url: `/api/trips/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Trip', id }, { type: 'Trip', id: 'LIST' }],
    }),
    deleteTrip: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/api/trips/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Trip', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTripsQuery,
  useGetTripQuery,
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,
} = tripsApi;
