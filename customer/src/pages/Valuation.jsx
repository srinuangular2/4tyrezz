import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuthGuard } from '../components/AuthGuardModal';
import FaqsSection from '../components/FaqsSection';
import ValuationBanner from '../components/valuation/ValuationBanner';
import WhyValuation from '../components/valuation/WhyValuation';
import PriceFactors from '../components/valuation/PriceFactors';
import useReferenceData from '../hooks/useReferenceData';
import {
  useVehicleBrands,
  useVehicleFuelTransmissions,
  useVehicleModels,
  useVehicleVariants,
  useVehicleYears,
} from '../hooks/useVehicleCatalog';
import { fetchVehicleDetailsByReg, formatPlateInput, normalizeReg } from '../lib/fetchVehicleDetailsByReg';
import {
  clearValuationDraft,
  loadValuationDraft,
  saveValuationDraft,
  valuationDraftReady,
} from '../lib/listingDrafts';
import ResumeListingCard from '../components/sell/ResumeListingCard';
import SearchableSelect from '../components/common/SearchableSelect';
import { isAutomatic, variantRowKey } from '../lib/vehicleVariant';
import {
  BRAND,
  Card,
  Field,
  PrimaryButton,
  Section,
  formatINR,
  inputClass,
} from '../components/PageShell';

const EMPTY_FORM = {
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
};

const VALUATION_FAQS = [
  {
    q: 'What is used car valuation on 4tyrezz?',
    a: 'It is a free SmartPrice estimate of what your car may fetch in the current market. It is a guide only. A final offer is confirmed after physical inspection.',
  },
  {
    q: 'How do I check my car’s worth?',
    a: 'Enter brand, model, year and variant, or type your RC number. Add kilometres, owners and condition, then tap Check value.',
  },
  {
    q: 'Do I need to register to see the estimate?',
    a: 'You need to be signed in so we can save the check and follow up if you want. There is no extra fee to run the calculator.',
  },
  {
    q: 'Is the valuation tool free?',
    a: 'Yes. Checking SmartPrice does not cost anything. Selling later is also without a listing fee. Payout is discussed only after inspection.',
  },
  {
    q: 'Is the estimated price the final selling price?',
    a: 'No. Online range is indicative. Condition, documents and kilometres are verified in person before 4tyrezz confirms an offer.',
  },
  {
    q: 'What decides my car’s value?',
    a: 'Year, brand demand, kilometres, number of owners, fuel, gearbox, city demand and the condition you report. Inspection can move the number up or down.',
  },
  {
    q: 'How often does the estimate update?',
    a: 'Each time you run Check value we recalculate from current catalogue and demand data. Run it again if kilometres or condition change.',
  },
  {
    q: 'I’m happy with the price — how do I sell next?',
    a: 'Go to Sell your car, share the same details, and book inspection. 4tyrezz handles the next step. You do not have to accept any offer.',
  },
  {
    q: 'How does valuation help if I am buying or selling?',
    a: 'Sellers see a realistic band before they commit. Buyers on 4tyrezz see listings priced against the same market logic after inspection.',
  },
  {
    q: 'Why check price on 4tyrezz?',
    a: 'The same team that inspects and lists cars runs SmartPrice. Your enquiry stays with 4tyrezz — we do not publish your phone for public callers.',
  },
];

function nameOf(item) {
  return typeof item === 'string' ? item : item?.name || '';
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
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [contact, setContact] = useState({ name: '', phone: '', city: '' });
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [gate, setGate] = useState('check');
  const [draft, setDraft] = useState(null);
  const { requireAuth, isAuthed } = useAuthGuard();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadValuationDraft();
      if (cancelled) return;
      if (valuationDraftReady(saved)) {
        setDraft(saved);
        setGate('resume');
      } else {
        setGate('form');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gate !== 'form') return;
    if (!form.brand) return;
    if (!isAuthed) return;
    saveValuationDraft({ form, result, contact });
  }, [form, result, contact, gate, isAuthed]);

  const { models, loading: loadingModels } = useVehicleModels(form.brand, form.year);
  const { years: catalogYears, loading: loadingYears } = useVehicleYears(form.brand);
  const { fuelTypes } = useVehicleFuelTransmissions(form.brand, form.model, form.year);
  const { variants, loading: loadingVariants } = useVehicleVariants({
    brand: form.brand,
    model: form.model,
    year: form.year,
    fuelType: form.fuel,
  });

  const brandNames = useMemo(() => (brands || []).map(nameOf).filter(Boolean), [brands]);
  const modelNames = useMemo(() => (models || []).map(nameOf).filter(Boolean), [models]);
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const fromCatalog = (catalogYears || []).map(Number).filter((y) => y >= 1980 && y <= now);
    return ensureOption(fromCatalog, form.year ? Number(form.year) : '').filter(Boolean);
  }, [catalogYears, form.year]);
  const variantOptions = useMemo(() => {
    const list = (variants || []).map((v) => {
      const label = v.variant || v.name || '';
      return {
        value: variantRowKey(v),
        label,
        badge: isAutomatic(v.transmission) ? 'Automatic' : '',
      };
    });
    if (form.variant) {
      const current = variantRowKey({ variant: form.variant, fuelType: form.fuel, transmission: form.transmission });
      if (!list.some((o) => o.value === current)) {
        list.unshift({
          value: current,
          label: form.variant,
          badge: isAutomatic(form.transmission) ? 'Automatic' : '',
        });
      }
    }
    return list;
  }, [variants, form.variant, form.fuel, form.transmission]);
  const selectedVariantValue = variantRowKey({
    variant: form.variant,
    fuelType: form.fuel,
    transmission: form.transmission,
  });

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

  useEffect(() => {
    if (!fuelTypes.length) return;
    if (form.fuel && fuelTypes.includes(form.fuel)) return;
    set('fuel', fuelTypes[0]);
  }, [fuelTypes, form.fuel]);

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
    setResult(null);
  };

  const pickModel = (model) => {
    setForm((f) => ({ ...f, model, variant: '', fuel: '', transmission: '', bodyType: '' }));
    setResult(null);
  };

  const pickYear = (year) => {
    setForm((f) => ({ ...f, year, model: '', variant: '', fuel: '', transmission: '', bodyType: '' }));
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
        toast.success('Request sent. The 4tyrezz team will contact you shortly.');
        saveValuationDraft({ form, result, contact, submitted: true }, { immediate: true });
        setContact({ name: '', phone: '', city: '' });
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not submit request');
      } finally {
        setSubmitting(false);
      }
    });
  };

  const resumeEditing = (saved = draft) => {
    if (!saved?.form) {
      setGate('form');
      return;
    }
    setForm({ ...EMPTY_FORM, ...saved.form });
    setResult(saved.result || null);
    setContact(saved.contact || { name: '', phone: '', city: '' });
    setGate('form');
  };

  const startNewValuation = () => {
    clearValuationDraft();
    setDraft(null);
    setForm(EMPTY_FORM);
    setResult(null);
    setContact({ name: '', phone: '', city: '' });
    setGate('form');
  };

  const editHistory = (row) => {
    const next = {
      ...EMPTY_FORM,
      brand: row.brand || '',
      model: row.model || '',
      year: row.year || '',
      variant: row.variant || '',
      kmDriven: row.kmDriven || 45000,
      ownership: row.ownership || 1,
      fuel: row.fuel || '',
      transmission: row.transmission || '',
      city: row.city || '',
    };
    setForm(next);
    setResult({
      estimate: row.estimate,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      valuation: {
        fairMarketValue: row.estimate,
        estimatedMinPrice: row.minPrice,
        estimatedMaxPrice: row.maxPrice,
      },
    });
    setGate('form');
    saveValuationDraft({ form: next, result: null });
  };

  const valuation = result?.valuation;
  const minP = valuation?.estimatedMinPrice || result?.minPrice;
  const maxP = valuation?.estimatedMaxPrice || result?.maxPrice;
  const fair = valuation?.fairMarketValue || result?.estimate;
  const brandOptions = ensureOption(brandNames, form.brand);
  const modelOptions = ensureOption(modelNames, form.model);

  return (
    <div className="bg-slate-50">
      <ValuationBanner />

      <Section eyebrow="SmartPrice" title="Used car price calculator">
        {gate === 'resume' && valuationDraftReady(draft) ? (
          <ResumeListingCard
            subtitle="Thanks for sharing the details"
            year={draft.form.year}
            brand={draft.form.brand}
            model={draft.form.model}
            variant={draft.form.variant}
            kmDriven={draft.form.kmDriven}
            fuel={draft.form.fuel}
            city={draft.form.city}
            plate={draft.form.plate}
            resumeLabel="Resume editing"
            newLabel="Start a new valuation"
            onResume={() => resumeEditing(draft)}
            onNew={startNewValuation}
          />
        ) : gate === 'form' ? (
          <Card id="valuation-form" className="p-6 sm:p-7 shadow-xl shadow-blue-500/5 max-w-3xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-black text-xl text-slate-900">Used car price calculator</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">Get your estimate</p>
              </div>
              {form.brand && (
                <button
                  type="button"
                  onClick={startNewValuation}
                  className="text-[11px] font-black uppercase tracking-wider text-[#3083ff] shrink-0"
                >
                  New car
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Brand">
                <SearchableSelect
                  value={form.brand}
                  disabled={loadingBrands}
                  placeholder={loadingBrands ? 'Loading brands…' : 'Select brand'}
                  searchPlaceholder="Search brand"
                  options={brandOptions.map((name) => ({ value: name, label: name }))}
                  onChange={pickBrand}
                />
              </Field>
              <Field label="Registration year">
                <SearchableSelect
                  value={form.year}
                  disabled={!form.brand || loadingYears}
                  placeholder={!form.brand ? 'Select brand first' : loadingYears ? 'Loading years…' : 'Select year'}
                  searchPlaceholder="Search year"
                  options={yearOptions.map((y) => ({ value: y, label: String(y) }))}
                  onChange={pickYear}
                />
              </Field>
              <Field label="Model">
                <SearchableSelect
                  value={form.model}
                  disabled={!form.year || loadingModels}
                  placeholder={!form.year ? 'Select year first' : loadingModels ? 'Loading models…' : 'Select model'}
                  searchPlaceholder="Search model"
                  options={modelOptions.map((name) => ({ value: name, label: name }))}
                  onChange={pickModel}
                />
              </Field>
              <Field label="Variant">
                {fuelTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {fuelTypes.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setForm((cur) => ({ ...cur, fuel: f, variant: '', transmission: '' }))}
                        className={`rounded-full border px-4 py-1.5 text-xs font-extrabold ${
                          form.fuel === f ? 'bg-[#3083ff] text-white border-[#3083ff]' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
                <SearchableSelect
                  value={form.variant ? selectedVariantValue : ''}
                  disabled={!form.model || loadingVariants}
                  placeholder={!form.model ? 'Select model first' : loadingVariants ? 'Loading variants…' : 'Select variant'}
                  searchPlaceholder="Search variant"
                  options={variantOptions}
                  onChange={(value) => {
                    const v = variants.find((x) => variantRowKey(x) === value);
                    if (v) pickVariant(v);
                    else set('variant', value);
                  }}
                />
              </Field>
              <Field label="City">
                <SearchableSelect
                  value={form.city}
                  placeholder="City or pincode"
                  searchPlaceholder="Search city"
                  options={(cities || []).map((c) => ({ value: c.name, label: c.name }))}
                  onChange={(value) => set('city', value)}
                />
              </Field>
              <Field label="Ownership">
                <SearchableSelect
                  value={form.ownership}
                  searchPlaceholder="Search ownership"
                  options={[
                    { value: 1, label: '1st owner' },
                    { value: 2, label: '2nd owner' },
                    { value: 3, label: '3rd owner' },
                    { value: 4, label: '4th+ owner' },
                  ]}
                  onChange={(value) => set('ownership', Number(value))}
                />
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
            <p className="text-center text-[11px] font-semibold text-emerald-600 mt-3">100% free · Instant estimate</p>
          </Card>
        ) : null}
      </Section>

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
                <button
                  type="button"
                  onClick={() => document.querySelector('#valuation-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-5 text-xs font-black uppercase tracking-wider text-[#3083ff]"
                >
                  Edit car details
                </button>
              </Card>
              <Card className="p-6">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Want real offers on this car?</p>
                <div className="mt-4 space-y-3">
                  <input className={inputClass} placeholder="Your name" value={contact.name} onChange={(e) => setC('name', e.target.value)} />
                  <input className={inputClass} placeholder="Mobile number" value={contact.phone} onChange={(e) => setC('phone', e.target.value)} />
                  <SearchableSelect
                    value={contact.city}
                    placeholder="Select city"
                    searchPlaceholder="Search city"
                    options={(cities || []).map((c) => ({ value: c.name, label: c.name }))}
                    onChange={(value) => setC('city', value)}
                  />
                  <PrimaryButton className="w-full" disabled={submitting} onClick={requestOffers}>
                    {submitting ? 'Sending…' : 'Request a 4tyrezz follow-up'}
                  </PrimaryButton>
                  <Link to="/sell" className="block text-center text-xs font-black uppercase tracking-wider text-[#3083ff] pt-1">
                    Or sell this car
                  </Link>
                </div>
              </Card>
            </div>
          </Section>
        )}
      </div>

      <Section bg>
        <WhyValuation />
      </Section>

      <Section>
        <PriceFactors />
      </Section>

      <Section className="bg-gradient-to-b from-blue-50/70">
        <div className="rounded-3xl border border-[#3083ff]/20 bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#3083ff]">Next step</p>
            <h3 className="font-display text-2xl font-black text-slate-900 mt-1">Happy with the range?</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Book inspection on Sell your car. 4tyrezz confirms the offer in person.</p>
          </div>
          <Link to="/sell">
            <PrimaryButton>Sell this car</PrimaryButton>
          </Link>
        </div>
      </Section>

      <Section className="bg-gradient-to-b from-blue-50/70">
        <FaqsSection
          faqs={VALUATION_FAQS}
          subtitle="Everything you need to know about checking your car’s price on 4tyrezz."
          layout="stack"
        />
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
                <button
                  type="button"
                  onClick={() => editHistory(h)}
                  className="mt-3 text-[11px] font-black uppercase tracking-wider text-[#3083ff]"
                >
                  Edit car
                </button>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
