import { useEffect, useState } from 'react';
import api from '../api/axios';

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function useVehicleBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/vehicles/brands');
        if (!cancelled) setBrands(unwrapList(data));
      } catch (e) {
        if (!cancelled) {
          setBrands([]);
          setError(e.response?.data?.message || 'Could not load brands');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { brands, loading, error };
}

export function useVehicleModels(brand) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!brand) {
      setModels([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/vehicles/models', { params: { brand } });
        if (!cancelled) setModels(unwrapList(data));
      } catch (e) {
        if (!cancelled) {
          setModels([]);
          setError(e.response?.data?.message || 'Could not load models');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand]);

  return { models, loading, error };
}

export function useVehicleFuelTransmissions(brand, model) {
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [years, setYears] = useState([]);
  const [bodyTypes, setBodyTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand || !model) {
      setFuelTypes([]);
      setTransmissions([]);
      setYears([]);
      setBodyTypes([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/vehicles/fuel-transmissions', { params: { brand, model } });
        if (cancelled) return;
        setFuelTypes(data.fuelTypes || []);
        setTransmissions(data.transmissions || []);
        setYears(data.years || []);
        setBodyTypes(data.bodyTypes || []);
      } catch {
        if (!cancelled) {
          setFuelTypes([]);
          setTransmissions([]);
          setYears([]);
          setBodyTypes([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand, model]);

  return { fuelTypes, transmissions, years, bodyTypes, loading };
}

export function useVehicleVariants({ brand, model, fuelType, transmission, search, year }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand || !model) {
      setVariants([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { brand, model };
        if (fuelType) params.fuelType = fuelType;
        if (transmission) params.transmission = transmission;
        if (search) params.search = search;
        if (year) params.year = year;
        const { data } = await api.get('/vehicles/variants', { params });
        if (!cancelled) setVariants(unwrapList(data));
      } catch {
        if (!cancelled) setVariants([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand, model, fuelType, transmission, search, year]);

  return { variants, loading };
}
