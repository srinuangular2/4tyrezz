import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => {
  const { data } = await api.get('/cars/wishlist/mine');
  return data;
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (carId) => {
  await api.post(`/cars/${carId}/wishlist`);
  return carId;
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { ids: [], items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
        state.ids = action.payload.map((c) => c._id);
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        const id = action.payload;
        state.ids = state.ids.includes(id) ? state.ids.filter((x) => x !== id) : [...state.ids, id];
      });
  },
});

export default wishlistSlice.reducer;
