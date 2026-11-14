import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, IndianRupee } from 'lucide-react';
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
import { cityFromPlate, matchCityName, sellStateFromValuation } from '../components/sell/sellCarState';
import { saveSellDraft } from '../lib/listingDrafts';
import { useIsPhone } from '../components/sell/ui';
import { formatWhen } from './profile/hubUtils';
import {
  BRAND,
  Card,
  Field,
  PrimaryButton,
  Section,
  formatINR,
  inputClass,
} from '../components/PageShell';

const VAL_STEPS = [
  { label: 'Car', title: 'Which car is it?', hint: 'Pick the brand, year and model, or enter the registration number.' },
  { label: 'Details', title: 'A few details', hint: 'Kilometres, owners and city make the range more accurate.' },
  { label: 'Price', title: 'Your market price', hint: 'This is a guide. The final offer comes after inspection.' },
];

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
  const [mobileStep, setMobileStep] = useState(1);
  const [guided, setGuided] = useState(false);
  const phone = useIsPhone();
  const navigate = useNavigate();
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
    if (!phone || !guided) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phone, guided]);

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

  useEffect(() => {
    if (form.city || !form.plate) return;
    const name = matchCityName(cityFromPlate(form.plate), cities);
    if (name) set('city', name);
  }, [cities, form.city, form.plate]);

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
      city: details.city || matchCityName(cityFromPlate(current.plate), cities) || current.city,
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
      setHistory((rows) => [
        {
          _id: data.data?.id || `local-${Date.now()}`,
          brand: payload.brand,
          model: payload.model,
          year: Number(payload.year),
          variant: payload.variant,
          kmDriven: payload.kmDriven,
          ownership: payload.ownership,
          fuel: payload.fuel,
          transmission: payload.transmission,
          city: payload.city,
          estimate: data.data?.estimate || data.valuation?.fairMarketValue,
          minPrice: data.data?.minPrice || data.valuation?.estimatedMinPrice,
          maxPrice: data.data?.maxPrice || data.valuation?.estimatedMaxPrice,
        },
        ...rows.filter((row) => String(row._id) !== String(data.data?.id)),
      ]);
      setMobileStep(3);
      if (window.matchMedia('(min-width: 1024px)').matches) {
        document.getElementById('valuation-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
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
    setGuided(true);
    setMobileStep(saved.result ? 3 : saved.form?.brand ? 2 : 1);
  };

  const startNewValuation = () => {
    clearValuationDraft();
    setDraft(null);
    setForm(EMPTY_FORM);
    setResult(null);
    setContact({ name: '', phone: '', city: '' });
    setMobileStep(1);
    setGuided(false);
    setGate('form');
  };

  const openSheet = (step = 1) => {
    setMobileStep(step);
    setGuided(true);
  };

  const startFromPlate = () => {
    const reg = normalizeReg(form.plate);
    if (reg.length < 8) {
      toast.error('Enter a full registration number, e.g. TS 09 AB 1234');
      return;
    }
    setGuided(true);
    requireAuth(async () => {
      const filled = await lookupAndFill();
      if (filled?.brand && filled?.model && filled?.year) setMobileStep(2);
      else setMobileStep(1);
    });
  };

  const startInspection = async (nextForm, nextResult) => {
    const sell = sellStateFromValuation(nextForm, nextResult);
    await saveSellDraft(sell, { immediate: true });
    navigate('/sell', { state: { fromValuation: true, sell } });
  };

  const continueToSell = async () => {
    if (form.brand && form.model && result) {
      await startInspection(form, result);
      return;
    }
    const usable = history.filter((row) => row.brand && row.model && row.estimate);
    if (usable.length === 1) {
      await bookFromHistory(usable[0]);
      return;
    }
    if (usable.length > 1) {
      toast('Pick a saved price, then tap Book inspection on that car.');
      document.getElementById('saved-prices')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    toast.error('Check a car’s price first. The range has to be on screen before inspection can be booked.');
    document.getElementById('valuation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const bookFromHistory = async (row) => {
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
    const nextResult = {
      estimate: row.estimate,
      minPrice: row.minPrice,
      maxPrice: row.maxPrice,
      valuation: {
        fairMarketValue: row.estimate,
        estimatedMinPrice: row.minPrice,
        estimatedMaxPrice: row.maxPrice,
      },
    };
    if (!next.brand || !next.model || !nextResult.estimate) {
      toast.error('This saved price is missing car details.');
      return;
    }
    setForm(next);
    setResult(nextResult);
    await startInspection(next, nextResult);
  };

  const goMobileNext = () => {
    if (mobileStep === 1) {
      const reg = normalizeReg(form.plate);
      if (form.brand && form.model && form.year) {
        setMobileStep(2);
        return;
      }
      if (reg.length >= 8) {
        requireAuth(async () => {
          const filled = await lookupAndFill();
          if (filled?.brand && filled?.model && filled?.year) setMobileStep(2);
          else toast.error('We could not match this plate. Pick the brand, year and model.');
        });
        return;
      }
      toast.error('Enter the registration number, or pick brand, year and model');
      return;
    }
    if (mobileStep === 2) checkValue();
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
    setGuided(true);
    setMobileStep(3);
    saveValuationDraft({ form: next, result: null });
  };

  const valuation = result?.valuation;
  const minP = valuation?.estimatedMinPrice || result?.minPrice;
  const maxP = valuation?.estimatedMaxPrice || result?.maxPrice;
  const fair = valuation?.fairMarketValue || result?.estimate;
  const brandOptions = ensureOption(brandNames, form.brand);
  const modelOptions = ensureOption(modelNames, form.model);

  return (
    <div className="bg-slate-50 overflow-x-clip pb-24 lg:pb-0">
      <ValuationBanner />

      <Section eyebrow="SmartPrice" title="Used car price calculator" className="!py-4 lg:!py-12" headerClassName="hidden lg:flex">
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
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 lg:gap-6 items-start">
          <Card id="valuation-form" className={`rounded-2xl p-4 sm:p-7 lg:rounded-3xl ${phone ? 'bg-gradient-to-br from-white via-sky-50 to-blue-100 shadow-[0_16px_40px_rgba(48,131,255,0.16)] ring-1 ring-[#3083ff]/20' : ''}`} highlighted>
            {phone && !guided && (
              <div className="space-y-4">
                <p className="text-[12px] font-medium text-[#3083ff]">Check your car’s price</p>
                <h2 className="text-[18px] font-semibold text-slate-900">Which car is it?</h2>
                <p className="text-[13px] font-normal leading-snug text-slate-500">Enter the number on the plate, or choose the brand yourself.</p>
                <label className="block">
                  <span className="text-[13px] font-medium text-slate-700">Registration number</span>
                  <input
                    className={`${inputClass} mt-1.5 h-12 text-base`}
                    value={form.plate}
                    onChange={(e) => set('plate', formatPlateInput(e.target.value))}
                    placeholder="TS 09 AB 1234"
                    autoCapitalize="characters"
                  />
                </label>
                <button type="button" onClick={startFromPlate} disabled={lookingUp} className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white disabled:opacity-50">
                  {lookingUp ? 'Looking up…' : 'Find my car'}
                </button>
                <button type="button" onClick={() => openSheet(1)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left">
                  <span className="block text-[14px] font-semibold text-[#3083ff]">Choose brand, year and model</span>
                  <span className="mt-0.5 block text-[12px] font-normal text-slate-500">Use this if the RC number is not with you.</span>
                </button>
              </div>
            )}
            <div className="mb-4 hidden items-start justify-between gap-3 lg:mb-5 lg:flex">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-black text-slate-900">Used car price calculator</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">Get your estimate in under a minute</p>
              </div>
              {form.brand && (
                <button
                  type="button"
                  onClick={startNewValuation}
                  className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#3083ff]"
                >
                  New car
                </button>
              )}
            </div>

            {(!(phone && !guided)) && (
            <ValuationSheet
              open={phone && guided}
              step={mobileStep}
              busy={estimating || lookingUp}
              nextLabel={mobileStep === 1 ? 'Continue' : (lookingUp ? 'Looking up RC…' : estimating ? 'Calculating…' : 'See my price')}
              onBack={() => {
                if (mobileStep > 1) setMobileStep((n) => n - 1);
                else setGuided(false);
              }}
              onJump={(n) => setMobileStep(n)}
              onNext={goMobileNext}
              onSell={continueToSell}
              carLine={[form.year, form.brand, form.model].filter(Boolean).join(' ')}
              carMeta={[form.variant, form.plate, form.city].filter(Boolean).join(' · ')}
            >
            {mobileStep === 3 && phone && (
              <div>
                {result ? (
                  <div className="rounded-2xl bg-[#1853ff] px-4 py-4 text-white">
                    <p className="text-[12px] font-medium text-white/80">Fair market price</p>
                    <p className="mt-1 text-[26px] font-semibold leading-tight">{formatINR(fair)}</p>
                    <p className="mt-1 text-[13px] font-normal text-white/90">Range {formatINR(minP)} – {formatINR(maxP)}</p>
                  </div>
                ) : (
                  <p className="text-[13px] font-normal text-slate-500">Tap See my price to calculate the range.</p>
                )}
                <p className="mt-3 text-[12px] font-normal leading-snug text-slate-500">
                  {result?.disclaimer || 'This is an estimated market value only. It is not a final purchase offer.'}
                </p>
                <p className="mt-3 text-[13px] font-normal leading-snug text-slate-600">
                  This price stays on this page under Saved prices. Next you add photos, then book the visit. The car stays in Account → My Vehicles, where you can edit details or upload photos later.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGuided(false);
                    window.setTimeout(() => document.getElementById('saved-prices')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                  }}
                  className="mt-2 block w-full text-center text-[13px] font-semibold text-[#3083ff]"
                >
                  See saved prices
                </button>
                <button type="button" onClick={() => setMobileStep(1)} className="mt-1 w-full py-2 text-center text-[13px] font-medium text-slate-500">
                  Check another car
                </button>
              </div>
            )}

            <div className={`${phone && guided && mobileStep === 3 ? 'hidden' : 'grid'} grid-cols-1 sm:grid-cols-2 gap-3`}>
              <div className={phone && guided && mobileStep !== 1 ? 'hidden' : 'contents'}>
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
              </div>
              <div className={phone && guided && mobileStep !== 2 ? 'hidden' : 'contents'}>
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
            </div>

            <div className={`relative my-5 text-center ${phone && guided && mobileStep !== 1 ? 'hidden' : ''}`}>
              <span className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
              <span className="relative bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">or</span>
            </div>

            <div className={phone && guided && mobileStep !== 1 ? 'hidden' : ''}>
            <Field label="Enter your car registration">
              <input
                className={inputClass}
                value={form.plate}
                onChange={(e) => set('plate', formatPlateInput(e.target.value))}
                placeholder="Enter Your Car No. (TS 09 AB 1234)"
              />
            </Field>
            </div>
            </ValuationSheet>
            )}

            <PrimaryButton className="w-full mt-5 hidden lg:inline-flex" disabled={estimating || lookingUp} onClick={checkValue}>
              {lookingUp ? 'Looking up RC…' : estimating ? 'Calculating…' : 'Check value'}
            </PrimaryButton>
            <p className="hidden lg:block text-center text-[11px] font-semibold text-emerald-600 mt-3">100% free · Instant estimate</p>
          </Card>
            <div className="hidden lg:block lg:sticky lg:top-24 space-y-5">
              {result ? (
                <div id="valuation-result" className="space-y-5">
                  <Card className="p-6 rounded-3xl" highlighted>
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
                      <div className="mt-5 grid grid-cols-2 gap-2">
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
                  <Card className="p-6" highlighted>
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
                      <button type="button" onClick={continueToSell} className="block w-full text-center text-xs font-black uppercase tracking-wider text-[#3083ff] pt-1">
                        Book inspection for this car
                      </button>
                    </div>
                  </Card>
                </div>
              ) : (
                <>
                  <Card className="p-6 space-y-3" highlighted>
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">How to use</p>
                    <h3 className="font-black text-slate-900 text-base">Check price in under a minute</h3>
                    <ul className="space-y-2.5 text-sm font-medium text-slate-600">
                      <li>1. Pick brand, year, model and variant</li>
                      <li>2. Add kilometres, owners and city</li>
                      <li>3. Or type your RC number instead</li>
                      <li>4. Tap Check value for a SmartPrice range</li>
                    </ul>
                  </Card>
                  <Card className="p-6 space-y-3" hover={false}>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">What you get</p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      An indicative market range — not a final offer. 4tyrezz confirms the real price after inspection if you choose to sell.
                    </p>
                    <button type="button" onClick={continueToSell} className="inline-flex font-black text-sm text-[#3083ff] pt-1">
                      Book inspection for this car →
                    </button>
                  </Card>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Section>

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
            <p className="text-sm font-medium text-slate-500 mt-1">Next, add photos. The car then stays in My Vehicles, where you can edit anything that is still missing.</p>
          </div>
          <PrimaryButton onClick={continueToSell}>Book inspection</PrimaryButton>
        </div>
      </Section>

      {history.length > 0 && (
        <Section id="saved-prices" eyebrow="On this page" title="Saved prices">
          <div className="lg:hidden">
            <p className="text-[12px] font-normal leading-snug text-slate-500">
              A price check stays here. It is not a booking. Open it to see the range, or book the inspection when you are ready.
            </p>
            <div className="mt-3 space-y-2.5">
              {history.slice(0, 6).map((h) => {
                const facts = [
                  h.variant,
                  h.kmDriven ? `${Number(h.kmDriven).toLocaleString('en-IN')} km` : '',
                  h.fuel,
                  h.city,
                ].filter(Boolean);
                return (
                  <article key={h._id} className="rounded-2xl bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-[#1853ff]">
                        <IndianRupee className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-slate-900">
                          {[h.year, h.brand, h.model].filter(Boolean).join(' ')}
                        </p>
                        {facts.length > 0 && (
                          <p className="mt-0.5 truncate text-[12px] font-normal text-slate-500">{facts.join(' · ')}</p>
                        )}
                        {h.createdAt && (
                          <p className="mt-0.5 text-[11px] font-normal text-slate-400">{formatWhen(h.createdAt, true)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl bg-[#f4f8ff] px-3 py-2.5">
                      <p className="text-[11px] font-medium text-[#3083ff]">Fair price</p>
                      <p className="text-[18px] font-semibold leading-tight text-slate-900">{formatINR(h.estimate)}</p>
                      <p className="mt-0.5 text-[12px] font-normal text-slate-500">
                        Range {formatINR(h.minPrice)} – {formatINR(h.maxPrice)}
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => editHistory(h)}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-800"
                      >
                        See price
                      </button>
                      <button
                        type="button"
                        onClick={() => bookFromHistory(h)}
                        className="h-10 rounded-xl bg-[#3083ff] text-[12px] font-semibold text-white"
                      >
                        Book inspection
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="hidden lg:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      <Section className="hidden bg-gradient-to-b from-blue-50/70 lg:block">
        <FaqsSection
          faqs={VALUATION_FAQS}
          subtitle="Everything you need to know about checking your car’s price on 4tyrezz."
          layout="stack"
        />
      </Section>
    </div>
  );
}

function ValuationSheet({ open, step, busy, nextLabel, onBack, onJump, onNext, onSell, carLine, carMeta, children }) {
  if (!open || typeof document === 'undefined') return children;
  const meta = VAL_STEPS[step - 1] || VAL_STEPS[0];
  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[#3083ff]">Step {step} of 3</p>
            <h3 className="truncate text-[16px] font-semibold text-slate-900">{meta.title}</h3>
          </div>
        </div>
        <p className="mt-2 text-[12px] font-normal leading-snug text-slate-500">{meta.hint}</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {VAL_STEPS.map((item, index) => {
            const n = index + 1;
            const on = n === step;
            const done = n < step;
            return (
              <button
                key={item.label}
                type="button"
                disabled={!done}
                onClick={() => onJump(n)}
                className={`rounded-full px-1 py-1 text-[11px] font-semibold ${on ? 'bg-[#3083ff] text-white' : done ? 'bg-[#eaf2ff] text-[#1853ff]' : 'bg-slate-100 text-slate-400'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [&_.block>span:first-child]:normal-case [&_.block>span:first-child]:text-[13px] [&_.block>span:first-child]:font-medium [&_.block>span:first-child]:tracking-normal [&_.block>span:first-child]:text-slate-700 [&_input]:font-medium">
        {step > 1 && carLine && (
          <div className="mb-3 rounded-2xl border border-[#3083ff]/20 bg-[#f4f8ff] px-3.5 py-3">
            <p className="text-[11px] font-medium text-[#3083ff]">Your car</p>
            <p className="mt-0.5 text-[14px] font-medium text-slate-900">{carLine}</p>
            {carMeta && <p className="mt-0.5 text-[12px] font-normal text-slate-500">{carMeta}</p>}
          </div>
        )}
        {children}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {step < 3 ? (
          <button
            type="button"
            disabled={busy}
            onClick={onNext}
            className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white disabled:opacity-50"
          >
            {nextLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSell}
            className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white"
          >
            Book inspection
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
