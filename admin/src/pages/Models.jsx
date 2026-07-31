import { useEffect, useState } from 'react';
import api from '../api/axios';
import ReferenceCrud from '../components/ReferenceCrud';

export default function Models() {
  const [brands, setBrands] = useState([]);
  useEffect(() => { api.get('/brands').then((r) => setBrands(r.data)).catch(() => setBrands([])); }, []);

  if (!brands.length) return <p className="text-slate2 text-sm">Loading brands…</p>;

  return (
    <ReferenceCrud
      title="Models"
      endpoint="models"
      fields={[
        { name: 'name', placeholder: 'Model name (e.g. Swift)', required: true },
        { name: 'brand', type: 'select', required: true, placeholder: 'Select brand', options: brands.map((b) => ({ value: b._id, label: b.name })) },
      ]}
    />
  );
}
