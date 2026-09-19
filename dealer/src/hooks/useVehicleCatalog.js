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

export function useVehicleYears(brand) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand) {
      setYears([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/vehicles/years', { params: { brand } });
        if (!cancelled) setYears(unwrapList(data));
      } catch {
        if (!cancelled) setYears([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand]);

  return { years, loading };
}

export function useVehicleModels(brand, year) {
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
        const params = { brand };
        if (year) params.year = year;
        const { data } = await api.get('/vehicles/models', { params });
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
  }, [brand, year]);

  return { models, loading, error };
}

export function useVehicleFuelTransmissions(brand, model, year) {
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
        const params = { brand, model };
        if (year) params.year = year;
        const { data } = await api.get('/vehicles/fuel-transmissions', { params });
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
  }, [brand, model, year]);

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

export function useVehicleColors(brand, model) {
  const [exterior, setExterior] = useState([]);
  const [interior, setInterior] = useState([]);
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = {};
        if (brand) params.brand = brand;
        if (model) params.model = model;
        const { data } = await api.get('/vehicles/colors', { params });
        if (cancelled) return;
        setExterior(data.exterior || []);
        setInterior(data.interior || []);
        setMatched(Boolean(data.matched));
      } catch {
        if (!cancelled) {
          setExterior([]);
          setInterior([]);
          setMatched(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [brand, model]);

  return { exterior, interior, matched, loading };
}
