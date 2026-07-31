import { useEffect, useState } from 'react';
import api from '../api/axios';

// Loads brands/models/cities once and caches in memory for the session —
// used by filters, the Add Car form, and the mega menu.
let cache = null;

export default function useReferenceData() {
  const [data, setData] = useState(cache || { brands: [], models: [], cities: [], loading: !cache });

  useEffect(() => {
    if (cache) return;
    (async () => {
      try {
        const [brands, models, cities] = await Promise.all([
          api.get('/brands').then((r) => r.data),
          api.get('/models').then((r) => r.data),
          api.get('/cities').then((r) => r.data),
        ]);
        cache = { brands, models, cities, loading: false };
      } catch {
        cache = { brands: [], models: [], cities: [], loading: false };
      }
      setData(cache);
    })();
  }, []);

  return data;
}
