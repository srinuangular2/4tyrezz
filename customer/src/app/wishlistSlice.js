import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => {
  const { data } = await api.get('/cars/wishlist/mine');
  const list = Array.isArray(data) ? data : data?.data || [];
  return list.filter(Boolean);
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (carId) => {
  await api.post('/user/wishlist/toggle', { carId });
  return carId;
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { ids: [], items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.ids = action.payload.map((c) => c._id);
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const id = action.payload;
        const wasSaved = state.ids.includes(id);
        state.ids = wasSaved ? state.ids.filter((x) => x !== id) : [...state.ids, id];
        // Keep `items` in sync too, so the dedicated Wishlist page updates
        // instantly on remove without needing a re-fetch.
        if (wasSaved) state.items = state.items.filter((c) => c._id !== id);
      });
  },
});

export default wishlistSlice.reducer;
