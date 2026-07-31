import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const requestOtp = createAsyncThunk('auth/requestOtp', async (mobile) => {
  const { data } = await api.post('/auth/otp/request', { mobile });
  return data;
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ mobile, otp }) => {
  const { data } = await api.post('/auth/otp/verify', { mobile, otp });
  return data;
});

export const dealerLogin = createAsyncThunk('auth/dealerLogin', async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const { data } = await api.get('/auth/me');
  return data;
});

const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser || null,
    token: localStorage.getItem('token') || null,
    status: 'idle',
    error: null,
    devOtp: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.fulfilled, (state, action) => { state.devOtp = action.payload.devOtp || null; })
      .addMatcher(
        (action) => [verifyOtp.fulfilled.type, dealerLogin.fulfilled.type].includes(action.type),
        (state, action) => {
          state.user = action.payload.user;
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        (state, action) => { state.error = action.error.message; }
      );
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
