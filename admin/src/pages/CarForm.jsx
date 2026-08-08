import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

const empty = {
  title: '', brand: '', model: '', variant: '', year: '', price: '',
  fuel: 'Petrol', transmission: 'Manual', bodyType: 'Hatchback',
  kmDriven: '', ownership: 1, color: '', city: '', description: '', owner: '',
  insuranceType: '', seats: '', registrationYear: '', rto: '', engineDisplacement: '',
  
  goodBuyReason: '', marketPriceMin: '', marketPriceMax: '',
  accidental: 'No', odometerTampered: 'No', insuranceStatus: 'Valid',
  fitForYou: '', thingsToCheck: '',

  rcNumber: '', rcStatus: 'Active', registrationDate: '', rtoLocation: '',
  insuranceExpiryDate: '', insuranceCompany: '', puccValidUpto: '', fitnessValidUpto: '',
};

const FEATURE_OPTIONS = ['Power Steering', 'Power Windows', 'ABS', 'Airbags', 'Rear Camera', 'Touchscreen', 'Alloy Wheels', 'Sunroof'];

const STEPS = [
  { id: 1, title: 'Basic & Assignment' },
  { id: 2, title: 'Specs & Features' },
  { id: 3, title: 'Insights & RTO' },
  { id: 4, title: 'Media & Pricing' },
];

export default function CarForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [cities, setCities] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [form, setForm] = useState(empty);
  const [features, setFeatures] = useState([]);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/brands').then((r) => setBrands(r.data));
    api.get('/models').then((r) => setModels(r.data));
    api.get('/cities').then((r) => setCities(r.data));
    Promise.all([
      api.get('/admin/users', { params: { role: 'dealer', limit: 100 } }),
      api.get('/admin/users', { params: { role: 'customer', limit: 100 } }),
    ]).then(([d, c]) => setDealers([...d.data.users, ...c.data.users]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/cars/${id}`).then((r) => {
      const c = r.data;
      const qi = c.quickInsights || {};
      const cond = qi.condition || {};
      const rto = c.rtoDetails || {};

      setForm({
        title: c.title || '', brand: c.brand?._id || c.brand || '', model: c.model?._id || c.model || '', variant: c.variant || '', year: c.year || '',
        price: c.price || '', fuel: c.fuel || 'Petrol', transmission: c.transmission || 'Manual', bodyType: c.bodyType || 'Hatchback',
        kmDriven: c.kmDriven || '', ownership: c.ownership || 1, color: c.color || '', city: c.city?._id || c.city || '',
        description: c.description || '', owner: c.owner?._id || '',
        insuranceType: c.insuranceType || '', seats: c.seats || '', registrationYear: c.registrationYear || '',
        rto: c.rto || '', engineDisplacement: c.engineDisplacement || '',
        
        goodBuyReason: qi.goodBuyReason || '',
        marketPriceMin: qi.marketPriceMin || '',
        marketPriceMax: qi.marketPriceMax || '',
        accidental: cond.accidental || 'No',
        odometerTampered: cond.odometerTampered || 'No',
        insuranceStatus: cond.insuranceStatus || 'Valid',
        fitForYou: qi.fitForYou || '',
        thingsToCheck: Array.isArray(qi.thingsToCheck) ? qi.thingsToCheck.join(', ') : '',

        rcNumber: rto.rcNumber || '',
        rcStatus: rto.rcStatus || 'Active',
        registrationDate: rto.registrationDate || '',
        rtoLocation: rto.rtoLocation || '',
        insuranceExpiryDate: rto.insuranceExpiryDate || '',
        insuranceCompany: rto.insuranceCompany || '',
        puccValidUpto: rto.puccValidUpto || '',
        fitnessValidUpto: rto.fitnessValidUpto || '',
      });
      setFeatures(c.features || []);
      setExistingImages(c.images || []);
    }).catch(() => {
      toast.error('Failed to load car details');
    });
  }, [id]);

  const filteredModels = models.filter((m) => (m.brand?._id || m.brand) === form.brand);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setFieldValue = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const toggleFeature = (f) => setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
    toast.success('Removed image');
  };

  const removeNewImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setImages((prev) => [...prev, ...selected]);
    e.target.value = '';
  };

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
    toast.success('Generated professional description');
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!form.title || !form.brand || !form.model || !form.year) {
        toast.error('Please complete Title, Brand, Model, and Year fields.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!form.kmDriven) {
        toast.error('Please specify KM Driven.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.price || !form.city) {
      toast.error('Price and City are required to publish listing.');
      setCurrentStep(4);
      return;
    }

    setSaving(true);
    const brandObj = brands.find((b) => b._id === (form.brand?._id || form.brand));
    const carName = form.title || (brandObj ? `${brandObj.name} car` : 'Car');
    const loadingToast = toast.loading(isEdit ? `Updating ${carName}...` : `Creating ${carName}...`);

    const data = new FormData();

    const quickInsightsObj = {
      goodBuyReason: form.goodBuyReason,
      marketPriceMin: form.marketPriceMin ? Number(form.marketPriceMin) : null,
      marketPriceMax: form.marketPriceMax ? Number(form.marketPriceMax) : null,
      condition: {
        accidental: form.accidental,
        odometerTampered: form.odometerTampered,
        insuranceStatus: form.insuranceStatus,
      },
      fitForYou: form.fitForYou,
      thingsToCheck: form.thingsToCheck ? form.thingsToCheck.split(',').map((item) => item.trim()) : [],
    };

    const rtoDetailsObj = {
      rcNumber: form.rcNumber,
      rcStatus: form.rcStatus,
      registrationDate: form.registrationDate,
      rtoLocation: form.rtoLocation,
      insuranceExpiryDate: form.insuranceExpiryDate,
      insuranceCompany: form.insuranceCompany,
      engineCapacityCC: form.engineDisplacement ? Number(form.engineDisplacement) : null,
      puccValidUpto: form.puccValidUpto,
      fitnessValidUpto: form.fitnessValidUpto,
    };

    const handledKeys = [
      'goodBuyReason', 'marketPriceMin', 'marketPriceMax', 'accidental',
      'odometerTampered', 'insuranceStatus', 'fitForYou', 'thingsToCheck',
      'rcNumber', 'rcStatus', 'registrationDate', 'rtoLocation',
      'insuranceExpiryDate', 'insuranceCompany', 'puccValidUpto', 'fitnessValidUpto'
    ];

    Object.keys(form).forEach((key) => {
      if (handledKeys.includes(key)) return;
      const val = form[key];
      if (val !== '' && val !== null && val !== undefined) {
        const valueToSend = typeof val === 'object' && val !== null ? (val._id || '') : val;
        data.append(key, valueToSend);
      }
    });

    data.append('quickInsights', JSON.stringify(quickInsightsObj));
    data.append('rtoDetails', JSON.stringify(rtoDetailsObj));
    data.append('features', JSON.stringify(features || []));
    data.append('existingImages', JSON.stringify(existingImages || []));

    images.forEach((img) => data.append('images', img));

    try {
      if (isEdit) {
        await api.put(`/cars/${id}`, data);
        toast.success(`${carName} updated successfully!`, { id: loadingToast });
      } else {
        await api.post('/cars', data);
        toast.success(`${carName} created successfully!`, { id: loadingToast });
      }
      navigate('/cars');
    } catch (err) {
      console.error('Failed to save car:', err);
      toast.error(err.response?.data?.message || 'Failed to save car details', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-28 pt-4 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{isEdit ? 'Edit Vehicle Listing' : 'Add New Vehicle'}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          {isEdit ? 'Modify vehicle specifications, pricing, and media status.' : 'List a new car directly into the platform inventory queue.'}
        </p>
      </div>

      {/* Stepper Steps */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 mb-8 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isCompleted && setCurrentStep(step.id)}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-red-50 text-red-700 font-semibold border border-red-200 shadow-xs'
                    : isCompleted
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? '✓' : `0${step.id}`}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Step 0{step.id}</p>
                  <p className="text-xs font-bold truncate">{step.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-8">
        {/* STEP 1: Basic & Assignment */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <FormCard title="Listing Assignment" description="Specify the owner account associated with this vehicle inventory listing.">
              <ComboboxSelect
                label="Owner Account (Dealer or Customer)"
                value={form.owner}
                options={[
                  { label: 'Unassigned (Defaults to active admin account)', value: '' },
                  ...dealers.map((u) => ({
                    label: `${u.dealershipName || u.name || u.email || u.mobile} [${u.role.toUpperCase()}]`,
                    value: u._id,
                  })),
                ]}
                onChange={(val) => setFieldValue('owner', val)}
                placeholder="Search or choose owner account..."
              />
            </FormCard>

            <FormCard title="Basic Vehicle Information" description="Enter fundamental details about the vehicle model and variant.">
              <CustomInput label="Listing Title" name="title" value={form.title} onChange={change} placeholder="e.g. 2019 Honda City VX i-VTEC" required />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComboboxSelect
                  label="Make / Brand"
                  value={form.brand}
                  options={brands.map((b) => ({ label: b.name, value: b._id }))}
                  onChange={(val) => {
                    setFieldValue('brand', val);
                    setFieldValue('model', '');
                  }}
                  placeholder="Select or type Brand..."
                  required
                />

                <ComboboxSelect
                  label="Model"
                  value={form.model}
                  options={filteredModels.map((m) => ({ label: m.name, value: m._id }))}
                  onChange={(val) => setFieldValue('model', val)}
                  placeholder={form.brand ? 'Select or type Model...' : 'Select Brand First'}
                  disabled={!form.brand}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomInput label="Variant Trim" name="variant" value={form.variant} onChange={change} placeholder="e.g. VXI, ZXI Plus, Asta" />
                <CustomInput label="Manufacturing Year" name="year" type="number" value={form.year} onChange={change} placeholder="e.g. 2019" required />
              </div>
            </FormCard>
          </div>
        )}

        {/* STEP 2: Specs & Features */}
        {currentStep === 2 && (
          <FormCard title="Technical Specifications & Features" description="Define operational parameters, fuel metrics, and key cabin features.">
            <SegmentedPills
              label="Fuel Type"
              options={['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']}
              selected={form.fuel}
              onChange={(val) => setFieldValue('fuel', val)}
            />

            <SegmentedPills
              label="Transmission"
              options={['Manual', 'Automatic']}
              selected={form.transmission}
              onChange={(val) => setFieldValue('transmission', val)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComboboxSelect
                label="Body Type"
                value={form.bodyType}
                options={['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Convertible'].map((t) => ({ label: t, value: t }))}
                onChange={(val) => setFieldValue('bodyType', val)}
              />

              <SegmentedPills
                label="Ownership Record"
                options={[
                  { label: '1st Owner', value: 1 },
                  { label: '2nd Owner', value: 2 },
                  { label: '3rd Owner', value: 3 },
                  { label: '4th+ Owner', value: 4 },
                ]}
                selected={form.ownership}
                onChange={(val) => setFieldValue('ownership', val)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomInput label="Kilometers Driven (KM)" name="kmDriven" type="number" value={form.kmDriven} onChange={change} placeholder="e.g. 45000" required />
              <CustomInput label="Exterior Color" name="color" value={form.color} onChange={change} placeholder="e.g. Pearl White" />
            </div>

            <div className="pt-2">
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2.5 block">
    Key Vehicle Features
  </label>
  <div className="flex flex-wrap gap-2">
    {FEATURE_OPTIONS.map((f) => {
      const isSelected = features.includes(f);
      return (
        <button
          type="button"
          key={f}
          onClick={() => toggleFeature(f)}
          className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
            isSelected
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className={`text-xs font-bold ${isSelected ? 'text-white-400' : 'text-slate-400'}`}>
            {isSelected ? '✓' : '+'}
          </span>
          {f}
        </button>
      );
    })}
  </div>
</div>
          </FormCard>
        )}

        {/* STEP 3: Insights & RTO */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <FormCard title="RTO & Registration Details" description="Verification parameters retrieved or matched against government RTO records.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomInput label="RC Number (Masked)" name="rcNumber" value={form.rcNumber} onChange={change} placeholder="e.g. KA01MG****" />
                <ComboboxSelect
                  label="RC Registration Status"
                  value={form.rcStatus}
                  options={['Active', 'NOC ISSUED', 'Suspended'].map((s) => ({ label: s, value: s }))}
                  onChange={(val) => setFieldValue('rcStatus', val)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomInput label="Registration Date" name="registrationDate" value={form.registrationDate} onChange={change} placeholder="e.g. 14-Mar-2019" />
                <CustomInput label="Registering Authority (RTO)" name="rtoLocation" value={form.rtoLocation} onChange={change} placeholder="e.g. BENGALURU CENTRAL RTO" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ComboboxSelect
                  label="Insurance Type"
                  value={form.insuranceType}
                  options={[
                    { label: 'Not Specified', value: '' },
                    { label: 'Comprehensive', value: 'Comprehensive' },
                    { label: 'Third Party', value: 'Third Party' },
                    { label: 'Expired', value: 'Expired' },
                  ]}
                  onChange={(val) => setFieldValue('insuranceType', val)}
                />
                <CustomInput label="Fitness Valid Upto" name="fitnessValidUpto" value={form.fitnessValidUpto} onChange={change} placeholder="e.g. 13-Mar-2034" />
                <CustomInput label="PUCC Valid Upto" name="puccValidUpto" value={form.puccValidUpto} onChange={change} placeholder="e.g. 10-Nov-2025" />
              </div>
            </FormCard>

            <FormCard title="CarDekho AI Quick Insights" description="Provide data-backed highlights to assist buyers during evaluation.">
              <CustomInput label="Why This Is a Good Buy" name="goodBuyReason" value={form.goodBuyReason} onChange={change} placeholder="e.g. Priced right within market range for a single-owner car." />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomInput label="Market Estimated Min Price (₹)" name="marketPriceMin" type="number" value={form.marketPriceMin} onChange={change} placeholder="210000" />
                <CustomInput label="Market Estimated Max Price (₹)" name="marketPriceMax" type="number" value={form.marketPriceMax} onChange={change} placeholder="260000" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SegmentedPills label="Accidental History" options={['No', 'Yes']} selected={form.accidental} onChange={(val) => setFieldValue('accidental', val)} />
                <SegmentedPills label="Odometer Tampered" options={['No', 'Yes']} selected={form.odometerTampered} onChange={(val) => setFieldValue('odometerTampered', val)} />
                <SegmentedPills label="Insurance Status" options={['Valid', 'Expired']} selected={form.insuranceStatus} onChange={(val) => setFieldValue('insuranceStatus', val)} />
              </div>

              <CustomInput label="Fit For You Note" name="fitForYou" value={form.fitForYou} onChange={change} placeholder="e.g. Great low-maintenance city car for daily commute." />
              <CustomInput label="Things to Check (Comma Separated)" name="thingsToCheck" value={form.thingsToCheck} onChange={change} placeholder="e.g. Tyre wear, Battery age, Brake pad status" />
            </FormCard>
          </div>
        )}

        {/* STEP 4: Media & Pricing */}
        {currentStep === 4 && (
          <div className="space-y-8">
            <FormCard title="Pricing & Location" description="Set selling price and target geographical availability.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomInput label="Asking Price (₹)" name="price" type="number" value={form.price} onChange={change} placeholder="e.g. 450000" required />
                <ComboboxSelect
                  label="Target City"
                  value={form.city}
                  options={cities.map((c) => ({ label: c.name, value: c._id }))}
                  onChange={(val) => setFieldValue('city', val)}
                  placeholder="Select or type Target City..."
                  required
                />
              </div>
            </FormCard>

            <FormCard title="Media Gallery & Description" description="Upload photo gallery and generate formatted descriptive overview.">
              {existingImages.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Retained Photos ({existingImages.length})</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50 shadow-2xs">
                        <img src={img} className="w-full h-full object-cover" alt={`Car ${i}`} />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">New Uploads ({images.length})</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-4">
                    {images.map((imgFile, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50 shadow-2xs">
                        <img src={URL.createObjectURL(imgFile)} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-red-700 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 hover:border-red-400 rounded-2xl p-8 text-center hover:bg-red-50/20 transition cursor-pointer relative group bg-slate-50/40">
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="w-12 h-12 bg-white group-hover:bg-red-100 group-hover:text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500 font-bold text-xl border border-slate-200 shadow-2xs transition">
                  +
                </div>
                <p className="text-sm font-bold text-slate-800">Click or drag images to upload</p>
                <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP up to 10MB per file</p>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Detailed Description</label>
                  <button
                    type="button"
                    onClick={generateDescription}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl transition border border-indigo-200/70"
                  >
                    ✨ Auto-Generate
                  </button>
                </div>
                <textarea
                  name="description"
                  rows="5"
                  value={form.description}
                  onChange={change}
                  placeholder="Provide comprehensive vehicle details or click Auto-Generate..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </FormCard>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-4 px-6 z-30 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                currentStep === 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              ← Back
            </button>

            <div className="text-xs font-medium text-slate-400 hidden sm:block">
              Step <span className="text-slate-900 font-bold">{currentStep}</span> of 4
            </div>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-7 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50"
              >
                {saving ? 'Saving Details...' : isEdit ? 'Save Changes' : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// Spaced Form Card Container
const FormCard = ({ title, description, children }) => (
  <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
    <div className="border-b border-slate-100 pb-4">
      <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{title}</h2>
      {description && <p className="text-xs text-slate-500 mt-1 font-medium">{description}</p>}
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

// High-Contrast Input Field
const CustomInput = ({ label, required, ...props }) => (
  <div className="block">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition placeholder:text-slate-400 placeholder:font-normal"
    />
  </div>
);

// Single Combobox Field (Direct Typing Filters Dropdown Menu)
const ComboboxSelect = ({ label, value, options = [], onChange, placeholder, disabled = false, required = false }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
    } else {
      setQuery('');
    }
  }, [value, options]);

  const filtered = query.trim() === '' || (selectedOption && query === selectedOption.label)
    ? options
    : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        if (selectedOption) {
          setQuery(selectedOption.label);
        } else {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  return (
    <div className="block relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={query}
          placeholder={placeholder || 'Select or type...'}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 pr-10 outline-none transition ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : open
              ? 'border-red-500 ring-2 ring-red-500/20 bg-white'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/70 focus:bg-white'
          } placeholder:text-slate-400 placeholder:font-normal`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && setOpen(!open)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600"
        >
          ▼
        </button>
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl py-2 max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">No matches found</div>
          ) : (
            filtered.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setQuery(opt.label);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition ${
                    isSelected ? 'bg-red-50 text-red-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <span className="text-red-600">✓</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};


// Redesigned Modern Segmented Selector
const SegmentedPills = ({ label, options = [], selected, onChange }) => (
  <div>
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block font-sans">
      {label}
    </label>
    <div className="inline-flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-inner">
      {options.map((opt) => {
        const value = typeof opt === 'object' ? opt.value : opt;
        const displayLabel = typeof opt === 'object' ? opt.label : opt;
        const isSelected = String(selected) === String(value);

        return (
          <button
            type="button"
            key={value}
            onClick={() => onChange(value)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150 ease-in-out ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  </div>
);