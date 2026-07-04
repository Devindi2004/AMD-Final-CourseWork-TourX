import { apiSlice } from './apiSlice';
import type { AppNotification, EmergencyContact, Expense, TravelJournalEntry } from '../types';

export const personalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Expenses ----
    getExpenses: builder.query<Expense[], { tripId?: string; userId?: string }>({
      query: ({ tripId, userId }) => {
        const params = new URLSearchParams();
        if (tripId) params.set('tripId', tripId);
        if (userId) params.set('userId', userId);
        return `/api/expenses?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'Expense' as const, id: e.id })),
              { type: 'Expense', id: 'LIST' },
            ]
          : [{ type: 'Expense', id: 'LIST' }],
    }),
    createExpense: builder.mutation<Expense, Partial<Expense>>({
      query: (body) => ({ url: '/api/expenses', method: 'POST', body }),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    updateExpense: builder.mutation<Expense, { id: string; changes: Partial<Expense> }>({
      query: ({ id, changes }) => ({ url: `/api/expenses/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    deleteExpense: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/api/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Expense', id: 'LIST' }],
    }),

    // ---- Travel journal ----
    getJournalEntries: builder.query<TravelJournalEntry[], { tripId?: string; userId?: string }>({
      query: ({ tripId, userId }) => {
        const params = new URLSearchParams();
        if (tripId) params.set('tripId', tripId);
        if (userId) params.set('userId', userId);
        return `/api/travelJournals?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((j) => ({ type: 'Journal' as const, id: j.id })),
              { type: 'Journal', id: 'LIST' },
            ]
          : [{ type: 'Journal', id: 'LIST' }],
    }),
    createJournalEntry: builder.mutation<TravelJournalEntry, Partial<TravelJournalEntry>>({
      query: (body) => ({ url: '/api/travelJournals', method: 'POST', body }),
      invalidatesTags: [{ type: 'Journal', id: 'LIST' }],
    }),
    deleteJournalEntry: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/api/travelJournals/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Journal', id: 'LIST' }],
    }),

    // ---- Emergency contacts ----
    getEmergencyContacts: builder.query<EmergencyContact[], string>({
      query: (userId) => `/api/emergencyContacts?userId=${userId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Contact' as const, id: c.id })),
              { type: 'Contact', id: 'LIST' },
            ]
          : [{ type: 'Contact', id: 'LIST' }],
    }),
    createEmergencyContact: builder.mutation<EmergencyContact, Partial<EmergencyContact>>({
      query: (body) => ({ url: '/api/emergencyContacts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),
    updateEmergencyContact: builder.mutation<
      EmergencyContact,
      { id: string; changes: Partial<EmergencyContact> }
    >({
      query: ({ id, changes }) => ({
        url: `/api/emergencyContacts/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),
    deleteEmergencyContact: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/api/emergencyContacts/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    // ---- Notifications ----
    getNotifications: builder.query<AppNotification[], string>({
      query: (userId) => `/api/notifications?userId=${userId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: 'Notification' as const, id: n.id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),
    markNotificationRead: builder.mutation<AppNotification, string>({
      query: (id) => ({ url: `/api/notifications/${id}`, method: 'PATCH', body: { isRead: true } }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
    createNotification: builder.mutation<AppNotification, Partial<AppNotification>>({
      query: (body) => ({ url: '/api/notifications', method: 'POST', body }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetJournalEntriesQuery,
  useCreateJournalEntryMutation,
  useDeleteJournalEntryMutation,
  useGetEmergencyContactsQuery,
  useCreateEmergencyContactMutation,
  useUpdateEmergencyContactMutation,
  useDeleteEmergencyContactMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useCreateNotificationMutation,
} = personalApi;
