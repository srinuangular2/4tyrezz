import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useReferenceData from '../hooks/useReferenceData';

const empty = {
  title: '', brand: '', model: '', variant: '', year: '', price: '',
  fuel: 'Petrol', transmission: 'Manual', bodyType: 'Hatchback',
  kmDriven: '', ownership: 1, color: '', city: '', description: '',
  insuranceType: '', seats: '', registrationYear: '', rto: '', engineDisplacement: '',
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
    api.get(`/cars/${id}`)
      .then((r) => {
        const c = r.data;
        setForm({
          title: c.title || '', brand: c.brand?._id || c.brand || '', model: c.model?._id || c.model || '',
          variant: c.variant || '', year: c.year || '', price: c.price || '', fuel: c.fuel || 'Petrol',
          transmission: c.transmission || 'Manual', bodyType: c.bodyType || 'Hatchback',
          kmDriven: c.kmDriven || '', ownership: c.ownership || 1, color: c.color || '',
          city: c.city?._id || c.city || '', description: c.description || '',
          insuranceType: c.insuranceType || '', seats: c.seats || '', registrationYear: c.registrationYear || '',
          rto: c.rto || '', engineDisplacement: c.engineDisplacement || '',
        });
        setFeatures(c.features || []);
        setExistingImages(c.images || []);
      })
      .catch((err) => {
        console.error('Failed to load car details:', err);
        toast.error('Failed to load car details');
      });
  }, [id, isEdit]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleFeature = (f) => setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  // Image Management Handlers
  const removeExistingImage = (indexToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success('Image removed from list', { duration: 2000 });
  };

  const removeNewImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setImages((prev) => [...prev, ...selectedFiles]);
    e.target.value = '';
  };

  // Description Generator
  const generateDescription = () => {
    const brandObj = brands.find((b) => b._id === form.brand);
    const modelObj = models.find((m) => m._id === form.model);
    const cityObj = cities.find((c) => c._id === form.city);

    const brandName = brandObj ? brandObj.name : '';
    const modelName = modelObj ? modelObj.name : '';
    const cityName = cityObj ? cityObj.name : '';

    const ownershipStr = form.ownership == 1 ? '1st owner' : `${form.ownership}${form.ownership == 2 ? 'nd' : 'rd'} owner`;
    const formattedPrice = form.price ? `₹${Number(form.price).toLocaleString('en-IN')}` : '';

    let gen = `Well-maintained ${form.year || ''} ${brandName} ${modelName} ${form.variant || ''}`.trim();
    gen += ` located in ${cityName || 'city'}.\n\n`;
    gen += `• Key Specs: ${form.kmDriven ? `${form.kmDriven} KM driven` : ''}, ${form.fuel} fuel type, ${form.transmission} transmission, ${ownershipStr}.\n`;
    if (form.color) gen += `• Color: ${form.color}\n`;
    if (formattedPrice) gen += `• Price: ${formattedPrice}\n`;
    if (features.length > 0) gen += `• Top Features: ${features.join(', ')}\n`;
    gen += `\nVehicle is in excellent mechanical and aesthetic condition. Contact us today for a test drive!`;

    setForm((prev) => ({ ...prev, description: gen }));
    toast.success('Description generated!');
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const brandObj = brands.find((b) => b._id === form.brand);
    const carName = form.title || (brandObj ? `${brandObj.name} car` : 'Car');

    const loadingToast = toast.loading(
      isEdit ? `Updating ${carName} details...` : `Creating ${carName} listing...`
    );

    const data = new FormData();
    // Skip empty strings (not just null/undefined) — Mongoose throws a
    // CastError trying to coerce '' into a Number field like `seats`,
    // `registrationYear`, or `engineDisplacement` when left blank.
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) data.append(k, v); });
    data.append('features', JSON.stringify(features));
    data.append('existingImages', JSON.stringify(existingImages));

    images.forEach((img) => data.append('images', img));

    try {
      if (isEdit) {
        await api.put(`/cars/${id}`, data);
      } else {
        await api.post('/cars', data);
      }

      // 1. Dismiss the loading toast first
      toast.dismiss(loadingToast);

      // 2. Trigger a fresh success toast
      toast.success(
        isEdit ? `${carName} updated successfully!` : `${carName} listed successfully!`
      );

      // 3. Navigate back
      navigate('/dashboard/my-cars');
    } catch (err) {
      console.error('Failed to save listing:', err);
      toast.error(err.response?.data?.message || 'Failed to save listing details', { id: loadingToast });
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

        <Fieldset title="Overview details (optional)">
          <p className="text-xs text-slate2 -mt-1">Shown on the car detail page's Overview tab — leave blank if unknown.</p>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Insurance" name="insuranceType" value={form.insuranceType} onChange={change}>
              <option value="">Not specified</option>
              <option>Comprehensive</option><option>Third Party</option><option>Expired</option><option>None</option>
            </Select>
            <Input label="Seats" name="seats" type="number" value={form.seats} onChange={change} placeholder="5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Registration year" name="registrationYear" type="number" value={form.registrationYear} onChange={change} placeholder="e.g. 2020" />
            <Input label="RTO" name="rto" value={form.rto} onChange={change} placeholder="e.g. Hyderabad" />
          </div>
          <Input label="Engine displacement (cc)" name="engineDisplacement" type="number" value={form.engineDisplacement} onChange={change} placeholder="1197" />
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
            <div>
              <span className="text-xs font-semibold text-slate2 mb-1 block">Existing Images</span>
              <div className="flex gap-3 flex-wrap mb-3">
                {existingImages.map((img, i) => (
                  <div key={i} className="relative group w-20 h-20">
                    <img src={img} className="w-20 h-20 rounded-lg object-cover border border-slate-200" alt={`Car ${i}`} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate2 mb-1 block">New Images to Upload</span>
              <div className="flex gap-3 flex-wrap mb-3">
                {images.map((imgFile, i) => (
                  <div key={i} className="relative group w-20 h-20">
                    <img src={URL.createObjectURL(imgFile)} className="w-20 h-20 rounded-lg object-cover border border-slate-200" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="text-sm" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate2">Description</label>
              <button
                type="button"
                onClick={generateDescription}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200"
              >
                ✨ Generate Description
              </button>
            </div>
            <textarea
              name="description"
              rows="4"
              value={form.description}
              onChange={change}
              placeholder="Describe your car's condition, history or click Generate Description..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
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
