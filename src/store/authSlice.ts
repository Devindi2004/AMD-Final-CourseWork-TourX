import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  bootstrapped: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionSet(state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
    },
    tokensLoaded(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    tokensRefreshed(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
    },
    bootstrapFinished(state) {
      state.bootstrapped = true;
    },
  },
});

export const { sessionSet, tokensLoaded, tokensRefreshed, userUpdated, loggedOut, bootstrapFinished } =
  authSlice.actions;
export default authSlice.reducer;
