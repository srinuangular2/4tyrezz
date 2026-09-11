import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipboardCheck, Gauge, IndianRupee, ScanSearch, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import useReferenceData from '../hooks/useReferenceData';
import {
  useVehicleBrands,
  useVehicleFuelTransmissions,
  useVehicleModels,
  useVehicleVariants,
} from '../hooks/useVehicleCatalog';
import { fetchVehicleDetailsByReg, formatPlateInput, normalizeReg } from '../lib/fetchVehicleDetailsByReg';
import {
  BRAND,
  Card,
  Field,
  GhostButton,
  PrimaryButton,
  Section,
  formatINR,
  inputClass,
} from '../components/PageShell';

const HOW = [
  { icon: ClipboardCheck, title: 'Tell us about the car', body: 'Pick brand, model, year and variant from our live catalogue — or enter the RC number.' },
  { icon: Gauge, title: 'Usage and owners', body: 'Kilometres, ownership and condition adjust the SmartPrice band instantly.' },
  { icon: ScanSearch, title: 'See the market range', body: 'Depreciation, mileage, demand and condition produce a fair resale window.' },
  { icon: IndianRupee, title: 'Get real dealer offers', body: 'Share your details and verified dealers in your city bid on the car.' },
];

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
}

function yearRange(from = 2012) {
  const now = new Date().getFullYear();
  const list = [];
  for (let y = now; y >= from; y -= 1) list.push(y);
  return list;
}

function matchFromList(list, value) {
  const target = String(value || '').trim().toLowerCase();
  if (!target || !list?.length) return value || '';
  return (
    list.find((n) => n.toLowerCase() === target) ||
    list.find((n) => target.includes(n.toLowerCase()) || n.toLowerCase().includes(target)) ||
    value
  );
}

function ensureOption(list, value) {
  const names = [...list];
  if (value && !names.includes(value)) names.unshift(value);
  return names;
}

export default function Valuation() {
  const { cities } = useReferenceData();
  const { brands, loading: loadingBrands } = useVehicleBrands();
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: '',
    variant: '',
    kmDriven: 45000,
    ownership: 1,
    fuel: '',
    transmission: '',
    bodyType: '',
    conditionScore: 7,
    city: '',
    plate: '',
  });
  const [variantQ, setVariantQ] = useState('');
  const [result, setResult] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [contact, setContact] = useState({ name: '', phone: '', city: '' });
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const { requireAuth, isAuthed } = useAuthGuard();

  const { models, loading: loadingModels } = useVehicleModels(form.brand);
  const { years: catalogYears, loading: loadingMeta } = useVehicleFuelTransmissions(form.brand, form.model);
  const { variants, loading: loadingVariants } = useVehicleVariants({
    brand: form.brand,
    model: form.model,
    year: form.year,
  });

  const brandNames = useMemo(() => (brands || []).map(nameOf).filter(Boolean), [brands]);
  const modelNames = useMemo(() => (models || []).map(nameOf).filter(Boolean), [models]);
  const yearOptions = useMemo(() => {
    const fallback = yearRange(2012);
    if (!catalogYears?.length) return fallback;
    return [...new Set([...catalogYears.map(Number), ...fallback])].sort((a, b) => b - a);
  }, [catalogYears]);
  const variantList = useMemo(() => {
    const q = variantQ.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) => String(v.variant || v.name || '').toLowerCase().includes(q));
  }, [variants, variantQ]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setC = (k, v) => setContact((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isAuthed) return undefined;
    let cancelled = false;
    api
      .get('/valuations/mine')
      .then((r) => {
        if (!cancelled) setHistory(r.data.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  useEffect(() => {
    if (!form.brand || !brandNames.length) return;
    if (brandNames.includes(form.brand)) return;
    const matched = matchFromList(brandNames, form.brand);
    if (matched && brandNames.includes(matched)) set('brand', matched);
  }, [brandNames, form.brand]);

  useEffect(() => {
    if (!form.model || !modelNames.length) return;
    if (modelNames.includes(form.model)) return;
    const matched = matchFromList(modelNames, form.model);
    if (matched && modelNames.includes(matched)) set('model', matched);
  }, [modelNames, form.model]);

  const pickBrand = (brand) => {
    setForm((f) => ({
      ...f,
      brand,
      model: '',
      year: '',
      variant: '',
      fuel: '',
      transmission: '',
      bodyType: '',
    }));
    setVariantQ('');
    setResult(null);
  };

  const pickModel = (model) => {
    setForm((f) => ({ ...f, model, year: '', variant: '', fuel: '', transmission: '', bodyType: '' }));
    setVariantQ('');
    setResult(null);
  };

  const pickYear = (year) => {
    setForm((f) => ({ ...f, year, variant: '', fuel: '', transmission: '', bodyType: '' }));
    setResult(null);
  };

  const pickVariant = (v) => {
    const label = v.variant || v.name || '';
    setForm((f) => ({
      ...f,
      variant: label,
      fuel: v.fuelType || f.fuel,
      transmission: v.transmission || f.transmission,
      bodyType: v.bodyType || f.bodyType,
    }));
  };

  const mergeLookup = (current, details) => {
    const brand = matchFromList(brandNames, details.brand);
    return {
      ...current,
      brand,
      model: details.model || current.model,
      year: details.year || current.year,
      variant: details.variant || current.variant,
      fuel: details.fuel || details.fuelType || current.fuel,
      transmission: details.transmission || current.transmission,
      bodyType: details.bodyType || current.bodyType,
      city: details.city || current.city,
      ownership: Number(details.ownership || details.ownerCount || current.ownership) || 1,
    };
  };

  const calculate = async (payload) => {
    if (!payload.brand || !payload.model) {
      toast.error('Select brand and model, or enter a registration number');
      return;
    }
    if (!payload.year) {
      toast.error('Select registration year');
      return;
    }
    setEstimating(true);
    try {
      const { data } = await api.post('/valuation/calculate', {
        brand: payload.brand,
        model: payload.model,
        variant: payload.variant,
        year: Number(payload.year),
        registrationYear: Number(payload.year),
        kmDriven: Number(payload.kmDriven),
        kilometersDriven: Number(payload.kmDriven),
        ownership: Number(payload.ownership),
        numberOfOwners: Number(payload.ownership),
        conditionScore: Number(payload.conditionScore),
        fuel: payload.fuel,
        transmission: payload.transmission,
        bodyType: payload.bodyType,
        city: payload.city,
      });
      setResult({
        ...(data.data || {}),
        valuation: data.valuation,
      });
      document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not calculate a valuation');
    } finally {
      setEstimating(false);
    }
  };

  const lookupAndFill = async () => {
    const reg = normalizeReg(form.plate);
    if (reg.length < 8) {
      toast.error('Enter a full registration number, e.g. TS 09 AB 1234');
      return null;
    }
    setLookingUp(true);
    try {
      const details = await fetchVehicleDetailsByReg(form.plate);
      const next = mergeLookup(form, details);
      setForm(next);
      toast.success('RC details filled');
      return next;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not look up this registration');
      return null;
    } finally {
      setLookingUp(false);
    }
  };

  const checkValue = () => {
    requireAuth(async () => {
      const reg = normalizeReg(form.plate);
      let payload = form;
      if (reg.length >= 8) {
        const filled = await lookupAndFill();
        if (filled) payload = filled;
        else if (!form.brand || !form.model) return;
      }
      await calculate(payload);
    });
  };

  const requestOffers = () => {
    if (!contact.name || !contact.phone) {
      toast.error('Name and phone are required');
      return;
    }
    requireAuth(async () => {
      setSubmitting(true);
      try {
        await api.post('/enquiries', {
          type: 'seller',
          ...contact,
          brand: form.brand,
          model: form.model,
          year: Number(form.year),
          kmDriven: Number(form.kmDriven),
          expectedPrice: result?.estimate || result?.valuation?.fairMarketValue,
          message: `Valuation ${formatINR(result?.valuation?.fairMarketValue || result?.estimate)} (${formatINR(result?.valuation?.estimatedMinPrice || result?.minPrice)}–${formatINR(result?.valuation?.estimatedMaxPrice || result?.maxPrice)}). Requesting dealer offers.`,
        });
        toast.success('Request sent. Verified dealers will contact you shortly.');
        setContact({ name: '', phone: '', city: '' });
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not submit request');
      } finally {
        setSubmitting(false);
      }
    });
  };

  const valuation = result?.valuation;
  const minP = valuation?.estimatedMinPrice || result?.minPrice;
  const maxP = valuation?.estimatedMaxPrice || result?.maxPrice;
  const fair = valuation?.fairMarketValue || result?.estimate;
  const brandOptions = ensureOption(brandNames, form.brand);
  const modelOptions = ensureOption(modelNames, form.model);

  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-[#EAF2FF]">
        <div className="container-px mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-2 gap-10 items-start">
          <div className="pt-4">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">
              <Sparkles className="w-3.5 h-3.5" /> 4TYREZZ SmartPrice
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3 leading-tight">
              Used car <span className="text-[#3083ff]">valuation</span>
            </h1>
            <p className="text-sm sm:text-base font-medium text-slate-500 mt-4 max-w-lg leading-relaxed">
              Instant resale range from our live Indian catalogue — depreciation, kilometres, owners and demand scored the same way our listing desk prices cars.
            </p>
            <ul className="mt-8 space-y-2 text-sm font-bold text-slate-700">
              <li>Live brand, model and variant lists from the database</li>
              <li>Optional RC lookup to auto-fill make, model and year</li>
              <li>100% free · No sign-up · Instant estimate</li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/sell">
                <GhostButton>List your car for free</GhostButton>
              </Link>
            </div>
          </div>

          <Card className="p-6 sm:p-7 shadow-xl shadow-blue-500/5">
            <h2 className="font-display font-black text-xl text-slate-900">Used car price calculator</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 mb-5">Get your estimate</p>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Brand">
                <select
                  className={inputClass}
                  value={form.brand}
                  disabled={loadingBrands}
                  onChange={(e) => pickBrand(e.target.value)}
                >
                  <option value="">{loadingBrands ? 'Loading brands…' : 'Select brand'}</option>
                  {brandOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Model">
                <select
                  className={inputClass}
                  value={form.model}
                  disabled={!form.brand || loadingModels}
                  onChange={(e) => pickModel(e.target.value)}
                >
                  <option value="">
                    {!form.brand ? 'Select brand first' : loadingModels ? 'Loading models…' : 'Select model'}
                  </option>
                  {modelOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Registration year">
                <select
                  className={inputClass}
                  value={form.year}
                  disabled={!form.model || loadingMeta}
                  onChange={(e) => pickYear(e.target.value)}
                >
                  <option value="">{!form.model ? 'Select model first' : 'Select year'}</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Variant">
                <select
                  className={inputClass}
                  value={form.variant}
                  disabled={!form.year || loadingVariants}
                  onChange={(e) => {
                    const v = variants.find((x) => (x.variant || x.name) === e.target.value);
                    if (v) pickVariant(v);
                    else set('variant', e.target.value);
                  }}
                >
                  <option value="">
                    {!form.year ? 'Select year first' : loadingVariants ? 'Loading variants…' : 'Select variant'}
                  </option>
                  {form.variant && !variantList.some((v) => (v.variant || v.name) === form.variant) && (
                    <option value={form.variant}>{form.variant}</option>
                  )}
                  {variantList.map((v) => {
                    const label = v.variant || v.name;
                    return (
                      <option key={v._id || label} value={label}>
                        {label}
                        {v.fuelType ? ` · ${v.fuelType}` : ''}
                        {v.transmission ? ` ${v.transmission}` : ''}
                      </option>
                    );
                  })}
                </select>
                {form.model && (
                  <input
                    className={`${inputClass} mt-2 py-2 text-xs`}
                    placeholder="Search variant, e.g. AX7 L Turbo"
                    value={variantQ}
                    onChange={(e) => setVariantQ(e.target.value)}
                  />
                )}
              </Field>
              <Field label="City">
                <select className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)}>
                  <option value="">City or pincode</option>
                  {(cities || []).map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ownership">
                <select className={inputClass} value={form.ownership} onChange={(e) => set('ownership', Number(e.target.value))}>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? '1st owner' : n === 2 ? '2nd owner' : n === 3 ? '3rd owner' : '4th+ owner'}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kilometres">
                <div className="relative">
                  <input
                    className={`${inputClass} pr-12`}
                    type="number"
                    min={0}
                    max={400000}
                    step={500}
                    value={form.kmDriven}
                    onChange={(e) => set('kmDriven', Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">km</span>
                </div>
              </Field>
              <Field label={`Condition ${form.conditionScore}/10`}>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={form.conditionScore}
                  onChange={(e) => set('conditionScore', Number(e.target.value))}
                  className="w-full accent-[#3083ff] cursor-pointer mt-3"
                />
              </Field>
            </div>

            {(form.fuel || form.transmission || form.bodyType) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.fuel && <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{form.fuel}</span>}
                {form.transmission && <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{form.transmission}</span>}
                {form.bodyType && <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{form.bodyType}</span>}
              </div>
            )}

            <div className="relative my-5 text-center">
              <span className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
              <span className="relative bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">or</span>
            </div>

            <Field label="Enter your car registration">
              <input
                className={inputClass}
                value={form.plate}
                onChange={(e) => set('plate', formatPlateInput(e.target.value))}
                placeholder="Enter Your Car No. (TS 09 AB 1234)"
              />
            </Field>

            <PrimaryButton className="w-full mt-5" disabled={estimating || lookingUp} onClick={checkValue}>
              {lookingUp ? 'Looking up RC…' : estimating ? 'Calculating…' : 'Check value'}
            </PrimaryButton>
            <p className="text-center text-[11px] font-semibold text-emerald-600 mt-3">100% free · No sign-up · Instant estimate</p>
          </Card>
        </div>
      </section>

      <div id="result" className="scroll-mt-24">
        {result && (
          <Section eyebrow="SmartPrice" title="Your used car valuation">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <Card className="p-6">
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-600">Indicative estimate — not a purchase offer</p>
                <p className="font-black text-slate-900 text-4xl tracking-tight mt-1">{formatINR(fair)}</p>
                <p className="text-sm font-extrabold mt-2" style={{ color: BRAND }}>
                  Market range {formatINR(minP)} – {formatINR(maxP)}
                </p>
                {valuation?.demandScore && (
                  <p className="mt-3 text-xs font-extrabold text-slate-600">
                    Demand: <span className="text-[#3083ff]">{valuation.demandScore}</span>
                    {valuation.depreciationApplied ? ` · Age depreciation ${valuation.depreciationApplied}` : ''}
                  </p>
                )}
                <div className="mt-5 h-2.5 rounded-full bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-y-0 left-[12%] right-[12%] rounded-full" style={{ backgroundColor: BRAND }} />
                </div>
                {valuation?.priceFactors && (
                  <div className="mt-5 grid sm:grid-cols-2 gap-2">
                    {Object.entries(valuation.priceFactors).map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">
                        <span className="uppercase tracking-wider text-slate-400">{k.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="block text-slate-900 mt-0.5">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] font-semibold text-slate-500 mt-4 leading-relaxed">
                  {result.disclaimer || 'This is an estimated market value only. It is not a final purchase offer. Price is confirmed after inspection.'}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Want real offers on this car?</p>
                <div className="mt-4 space-y-3">
                  <input className={inputClass} placeholder="Your name" value={contact.name} onChange={(e) => setC('name', e.target.value)} />
                  <input className={inputClass} placeholder="Mobile number" value={contact.phone} onChange={(e) => setC('phone', e.target.value)} />
                  <select className={inputClass} value={contact.city} onChange={(e) => setC('city', e.target.value)}>
                    <option value="">Select city</option>
                    {(cities || []).map((c) => (
                      <option key={c._id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <PrimaryButton className="w-full" disabled={submitting} onClick={requestOffers}>
                    {submitting ? 'Sending…' : 'Get dealer offers'}
                  </PrimaryButton>
                </div>
              </Card>
            </div>
          </Section>
        )}
      </div>

      <Section eyebrow="How it works" title="Four steps to a fair price" bg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW.map(({ icon: Icon, title, body }, i) => (
            <Card key={title} className="p-5 relative">
              <span className="absolute top-5 right-5 font-black text-3xl text-slate-100">0{i + 1}</span>
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
              </div>
              <h3 className="font-black text-slate-900 text-sm mt-4">{title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">{body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {history.length > 0 && (
        <Section eyebrow="Your account" title="Previous valuations">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {history.slice(0, 6).map((h) => (
              <Card key={h._id} className="p-5">
                <p className="font-black text-slate-900 text-sm">
                  {h.brand} {h.model} {h.year ? `· ${h.year}` : ''}
                </p>
                <p className="font-black text-slate-900 text-2xl mt-2">{formatINR(h.estimate)}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {formatINR(h.minPrice)} – {formatINR(h.maxPrice)}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
