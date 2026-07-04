import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { API_BASE_URL } from '../constants/config';
import type { RootState } from '../store/store';
import { loggedOut, tokensRefreshed } from '../store/authSlice';
import { clearTokens, saveTokens } from '../utils/authStorage';
import type { AuthSession, MessageResponse, RegisterResponse, Role, UploadSignature, User } from '../types';

// Only one in-flight refresh at a time: if several requests 401 simultaneously
// (e.g. a screen firing multiple queries after a long background pause), they all
// wait on this lock instead of each independently spending the one-time-use
// refresh token — see https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#automatic-re-authorization
const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  await mutex.waitForUnlock();
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args.url;
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/google'].some((p) =>
      url.includes(p)
    );

    if (!isAuthEndpoint) {
      if (!mutex.isLocked()) {
        const release = await mutex.acquire();
        try {
          const refreshToken = (api.getState() as RootState).auth.refreshToken;
          if (refreshToken) {
            const refreshResult = await rawBaseQuery(
              { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
              api,
              extraOptions
            );
            if (refreshResult.data) {
              const session = refreshResult.data as { accessToken: string; refreshToken: string };
              api.dispatch(tokensRefreshed(session));
              await saveTokens(session);
              result = await rawBaseQuery(args, api, extraOptions);
            } else {
              api.dispatch(loggedOut());
              await clearTokens();
            }
          } else {
            api.dispatch(loggedOut());
          }
        } finally {
          release();
        }
      } else {
        await mutex.waitForUnlock();
        result = await rawBaseQuery(args, api, extraOptions);
      }
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Trip',
    'Hotel',
    'Restaurant',
    'Review',
    'Expense',
    'Journal',
    'Contact',
    'Notification',
    'SavedItem',
    'Booking',
  ],
  endpoints: (builder) => ({
    register: builder.mutation<
      RegisterResponse,
      { name: string; email: string; password: string; role: Role; homeCountry?: string }
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyEmail: builder.mutation<AuthSession, { email: string; code: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),
    resendVerification: builder.mutation<MessageResponse, { email: string }>({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
    }),
    login: builder.mutation<AuthSession, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    googleLogin: builder.mutation<AuthSession, { idToken: string }>({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation<MessageResponse, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation<MessageResponse, { email: string; code: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    logout: builder.mutation<MessageResponse, { refreshToken: string }>({
      query: (body) => ({ url: '/auth/logout', method: 'POST', body }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateMe: builder.mutation<User, Partial<User>>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    adminListUsers: builder.query<User[], void>({
      query: () => '/admin/users',
      providesTags: (result) =>
        result
          ? [...result.map((u) => ({ type: 'User' as const, id: u.id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }],
    }),
    adminChangeUserRole: builder.mutation<User, { id: string; role: Role }>({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: 'PATCH', body: { role } }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    getUploadSignature: builder.mutation<UploadSignature, void>({
      query: () => ({ url: '/uploads/signature', method: 'POST' }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useAdminListUsersQuery,
  useAdminChangeUserRoleMutation,
  useGetUploadSignatureMutation,
} = apiSlice;
