import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

function persistAuth(state, payload) {
  state.user = payload.user;
  state.token = payload.token;
  localStorage.setItem('dealerToken', payload.token);
  localStorage.setItem('dealerUser', JSON.stringify(payload.user));
}

export const dealerLogin = createAsyncThunk('auth/dealerLogin', async ({ dealerCode, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { dealerCode, password });
    if (data.user?.role !== 'dealer') {
      return rejectWithValue('This portal is for dealers only.');
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    if (data.user?.role !== 'dealer') {
      return rejectWithValue('This portal is for dealers only.');
    }
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load account');
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

const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('dealerUser')); } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser || null,
    token: localStorage.getItem('dealerToken') || null,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('dealerToken');
      localStorage.removeItem('dealerUser');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(dealerLogin.fulfilled, (state, action) => {
        persistAuth(state, action.payload);
        state.error = null;
      })
      .addCase(dealerLogin.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        if (action.payload?.user) {
          state.user = action.payload.user;
          localStorage.setItem('dealerUser', JSON.stringify(action.payload.user));
        }
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('dealerToken');
        localStorage.removeItem('dealerUser');
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('dealerUser', JSON.stringify(action.payload.user));
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
