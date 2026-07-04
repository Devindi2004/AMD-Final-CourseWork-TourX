import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  token: string | null;
  user: User | null;
  bootstrapped: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsSet(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.token = null;
      state.user = null;
    },
    bootstrapFinished(state) {
      state.bootstrapped = true;
    },
  },
});

export const { credentialsSet, userUpdated, loggedOut, bootstrapFinished } = authSlice.actions;
export default authSlice.reducer;
