import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

function persistAuth(state, payload) {
  state.user = payload.user;
  state.token = payload.token;
  state.needsProfile = payload.needsProfile ?? false;
  localStorage.setItem('token', payload.token);
  localStorage.setItem('user', JSON.stringify(payload.user));
}

export const requestOtp = createAsyncThunk('auth/requestOtp', async (mobile, { rejectWithValue }) => {
  try {
    const mobileNumber = String(mobile || '').replace(/\D/g, '').slice(-10);
    const { data } = await api.post('/auth/otp/request', { mobile: mobileNumber, mobileNumber });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not send OTP');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ mobile, otp }, { rejectWithValue }) => {
  try {
    const mobileNumber = String(mobile || '').replace(/\D/g, '').slice(-10);
    const { data } = await api.post('/auth/otp/verify', { mobile: mobileNumber, mobileNumber, otp });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid OTP');
  }
});

export const completeProfile = createAsyncThunk('auth/completeProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/complete-profile', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not save profile');
  }
});

export const connectGoogle = createAsyncThunk('auth/connectGoogle', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google sign-in failed');
  }
});

export const skipProfile = createAsyncThunk('auth/skipProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/skip-profile');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not continue');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/users/me', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not update profile');
  }
});

export const dealerLogin = createAsyncThunk('auth/dealerLogin', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const customerLogin = dealerLogin;

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
    devMobile: null,
    otpMode: null,
    needsProfile: false,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.needsProfile = false;
      state.error = null;
      state.devOtp = null;
      state.devMobile = null;
      state.otpMode = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearAuthError(state) {
      state.error = null;
    },
    persistDealerSession(state, action) {
      persistAuth(state, { ...action.payload, needsProfile: false });
    },
    persistCustomerSession(state, action) {
      persistAuth(state, { ...action.payload, needsProfile: false });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.devOtp = action.payload.devOtp || null;
        state.devMobile = action.payload.mobile || null;
        state.otpMode = action.payload.otpMode || null;
        state.error = null;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        persistAuth(state, action.payload);
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        persistAuth(state, action.payload);
        state.error = null;
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(connectGoogle.fulfilled, (state, action) => {
        persistAuth(state, action.payload);
        state.error = null;
      })
      .addCase(connectGoogle.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(skipProfile.fulfilled, (state, action) => {
        persistAuth(state, action.payload);
        state.needsProfile = false;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(dealerLogin.fulfilled, (state, action) => {
        persistAuth(state, { ...action.payload, needsProfile: false });
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.needsProfile = action.payload.needsProfile || false;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      });
  },
});

export const { logout, clearAuthError, persistDealerSession, persistCustomerSession } = authSlice.actions;
export default authSlice.reducer;
