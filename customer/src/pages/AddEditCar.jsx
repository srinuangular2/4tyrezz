import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';

const empty = {
  title: '', brand: '', model: '', variant: '', year: '', price: '',
  fuel: 'Petrol', transmission: 'Manual', bodyType: 'Hatchback',
  kmDriven: '', ownership: 1, color: '', city: '', description: '',
};
const FEATURE_OPTIONS = ['Power Steering', 'Power Windows', 'ABS', 'Airbags', 'Rear Camera', 'Touchscreen', 'Alloy Wheels', 'Sunroof'];

export default function AddEditCar() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { brands, cities, models } = useReferenceData();
  const [form, setForm] = useState(empty);
  const [features, setFeatures] = useState([]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const filteredModels = models.filter((m) => m.brand === form.brand || m.brand?._id === form.brand);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/cars/${id}`).then((r) => {
      const c = r.data;
      setForm({
        title: c.title, brand: c.brand?._id, model: c.model?._id, variant: c.variant, year: c.year,
        price: c.price, fuel: c.fuel, transmission: c.transmission, bodyType: c.bodyType,
        kmDriven: c.kmDriven, ownership: c.ownership, color: c.color, city: c.city?._id, description: c.description,
      });
      setFeatures(c.features || []);
      setExistingImages(c.images || []);
    });
  }, [id]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleFeature = (f) => setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v ?? ''));
    data.append('features', JSON.stringify(features));
    images.forEach((img) => data.append('images', img));

    try {
      if (isEdit) await api.put(`/cars/${id}`, data);
      else await api.post('/cars', data);
      navigate('/dashboard/my-cars');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-px py-10 max-w-2xl mx-auto">
      <h1 className="font-display font-black text-3xl">{isEdit ? 'Edit your listing' : 'List your car'}</h1>
      <p className="text-slate2 text-sm mt-1 mb-7">
        {isEdit ? 'Changes will be sent back for a quick re-approval.' : 'New listings are reviewed by our team before going live — usually within a few hours.'}
      </p>

      <form onSubmit={submit} className="space-y-6">
        <Fieldset title="Basic information">
          <Input label="Title" name="title" value={form.title} onChange={change} placeholder="e.g. 2019 Honda City VX" required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Brand" name="brand" value={form.brand} onChange={change} required>
              <option value="">Select brand</option>
              {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
            <Select label="Model" name="model" value={form.model} onChange={change} required>
              <option value="">Select model</option>
              {filteredModels.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Variant" name="variant" value={form.variant} onChange={change} placeholder="VXI, ZXI..." />
            <Input label="Year" name="year" type="number" value={form.year} onChange={change} required />
          </div>
        </Fieldset>

        <Fieldset title="Specifications">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Fuel type" name="fuel" value={form.fuel} onChange={change}>
              {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((f) => <option key={f}>{f}</option>)}
            </Select>
            <Select label="Transmission" name="transmission" value={form.transmission} onChange={change}>
              {['Manual', 'Automatic'].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Body type" name="bodyType" value={form.bodyType} onChange={change}>
              {['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Select label="Ownership" name="ownership" value={form.ownership} onChange={change}>
              {[1, 2, 3].map((o) => <option key={o} value={o}>{o === 1 ? '1st owner' : `${o}${o === 2 ? 'nd' : 'rd'} owner`}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="KM driven" name="kmDriven" type="number" value={form.kmDriven} onChange={change} required />
            <Input label="Color" name="color" value={form.color} onChange={change} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate2 mb-2 block">Features</label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map((f) => (
                <button type="button" key={f} onClick={() => toggleFeature(f)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${features.includes(f) ? 'bg-verify text-white border-verify' : 'border-slate-200 text-slate2'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </Fieldset>

        <Fieldset title="Pricing & location">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (₹)" name="price" type="number" value={form.price} onChange={change} required />
            <Select label="City" name="city" value={form.city} onChange={change} required>
              <option value="">Select city</option>
              {cities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </div>
        </Fieldset>

        <Fieldset title="Images & description">
          {existingImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {existingImages.map((img, i) => <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover" />)}
            </div>
          )}
          <input type="file" multiple accept="image/*" onChange={(e) => setImages([...e.target.files])} className="text-sm" />
          <textarea name="description" rows="4" value={form.description} onChange={change} placeholder="Describe your car's condition, history..." className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
        </Fieldset>

        <button disabled={saving} className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-3.5 rounded-lg">
          {saving ? 'Publishing…' : isEdit ? 'Save changes' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}

const Fieldset = ({ title, children }) => (
  <fieldset className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
    <legend className="text-xs font-bold uppercase tracking-wide text-slate2 px-1">{title}</legend>
    {children}
  </fieldset>
);
const Input = ({ label, ...props }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate2 mb-1 block">{label}</span>
    <input {...props} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
  </label>
);
const Select = ({ label, children, ...props }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate2 mb-1 block">{label}</span>
    <select {...props} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">{children}</select>
  </label>
);
