import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const adminLogin = createAsyncThunk('auth/adminLogin', async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.user.role !== 'admin') throw new Error('This login is for admins only.');
  return data;
});

const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('adminUser')); } catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: storedUser || null, token: localStorage.getItem('adminToken') || null, error: null },
  reducers: {
    logout(state) {
      state.user = null; state.token = null;
      localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.user = action.payload.user; state.token = action.payload.token; state.error = null;
        localStorage.setItem('adminToken', action.payload.token);
        localStorage.setItem('adminUser', JSON.stringify(action.payload.user));
      })
      .addCase(adminLogin.rejected, (state, action) => { state.error = action.error.message; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
