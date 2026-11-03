import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, ChevronLeft, HandCoins, ShieldCheck, Timer } from 'lucide-react';
import api from '../../api/axios';
import { useAuthGuard } from '../AuthGuardModal';
import useReferenceData from '../../hooks/useReferenceData';
import { clearSellDraft, loadSellDraft, saveSellDraft, sellDraftReady } from '../../lib/listingDrafts';
import { Card, formatINR } from '../PageShell';
import { conditionScoreFromPills, filesFromPreviews, initialSellCarState, resumeSellStep, vehicleReady, conditionReady, conditionMessage, plateError, variantError } from './sellCarState';
import ResumeListingCard from './ResumeListingCard';
import { Stepper, useIsPhone } from './ui';

const STEP_META = [
  { label: 'Car', title: 'Which car are you selling?', hint: 'Enter the number on the number plate, or choose the brand yourself.' },
  { label: 'Details', title: 'Tell us about the car', hint: 'Kilometres, owners and city. Photos come after the price.' },
  { label: 'Price', title: 'Your price and a visit slot', hint: 'This range is a guide. Pick the price you want and when we should inspect the car.' },
  { label: 'Photos', title: 'Upload photos', hint: 'Add photos now, or skip and upload them later from My Vehicles.' },
  { label: 'Book', title: 'Confirm your mobile', hint: 'Check the car and the visit, then verify your number. The final offer comes after inspection.' },
];
import StepIdentify from './StepIdentify';
import StepCondition from './StepCondition';
import StepValuation from './StepValuation';
import StepAuth from './StepAuth';
import StepPhotos from './StepPhotos';

const WHY = [
  { icon: Timer, title: 'Inspected in days, not months', body: 'Your request is queued for verified dealers as soon as you book inspection.' },
  { icon: HandCoins, title: 'Estimate, then a real offer', body: 'The range you see first is indicative. The final offer comes after inspection.' },
  { icon: ShieldCheck, title: 'Paperwork handled', body: 'RC transfer, NOC and insurance transfer are managed by our team.' },
  { icon: BadgeCheck, title: 'Brand, mileage and condition', body: 'Valuation uses model, kilometres, brand index and the condition you report.' },
];

export default function SellCarFlow() {
  const { cities } = useReferenceData();
  const [state, setState] = useState(initialSellCarState);
  const [gate, setGate] = useState('check');
  const [draft, setDraft] = useState(null);
  const [valuating, setValuating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [guided, setGuided] = useState(false);
  const { requireAuth, isAuthed } = useAuthGuard();
  const phone = useIsPhone();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const handed = location.state?.fromValuation ? location.state.sell : location.state?.editRequest || null;
      const saved = handed && sellDraftReady(handed) ? handed : await loadSellDraft();
      if (cancelled) return;
      if ((location.state?.fromValuation || location.state?.editRequest) && sellDraftReady(saved)) {
        const previews = (saved.photoPreviews || []).filter((item) => item?.dataUrl);
        let photoFiles = [];
        try {
          photoFiles = filesFromPreviews(previews);
        } catch {
          photoFiles = [];
        }
        setState({
          ...initialSellCarState(),
          ...saved,
          photoPreviews: previews,
          photoFiles,
          done: false,
          step: Number(saved.step) || (location.state?.editRequest ? 2 : 4),
        });
        setGuided(true);
        setGate('form');
        return;
      }
      if (sellDraftReady(saved)) {
        setDraft(saved);
        setGate('resume');
      } else {
        setGate('form');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.state]);

  useEffect(() => {
    if (gate !== 'form') return;
    if (!state.brand && !state.done) return;
    if (!isAuthed) return;
    saveSellDraft(state);
  }, [state, gate, isAuthed]);

  useEffect(() => {
    if (!phone || !guided || gate !== 'form') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phone, guided, gate]);

  const patch = useCallback((partial) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const goValuation = async () => {
    setValuating(true);
    try {
      const { data } = await api.post('/valuations/estimate', {
        brand: state.brand,
        model: state.model,
        variant: state.variant,
        year: Number(state.year),
        kmDriven: Number(state.kmDriven),
        ownership: Number(state.ownership),
        fuel: state.fuel,
        transmission: state.transmission,
        bodyType: state.bodyType,
        city: state.city,
        expectedPrice: Number(state.expectedPrice) || undefined,
        conditionScore: conditionScoreFromPills(state.conditions),
      });
      setState((s) => ({
        ...s,
        valuation: data.data,
        step: 3,
        inspectionDate: s.inspectionDate || new Date().toISOString().slice(0, 10),
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Estimate unavailable — you can still submit for inspection');
      setState((s) => ({
        ...s,
        valuation: null,
        step: 3,
        inspectionDate: s.inspectionDate || new Date().toISOString().slice(0, 10),
      }));
    } finally {
      setValuating(false);
    }
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      const form = new FormData();
      const payload = {
        type: 'seller',
        intent: state.intent || 'sell',
        name: state.name,
        phone: state.phone,
        email: state.email || '',
        city: state.city,
        state: state.state || '',
        brand: state.brand,
        model: state.model,
        variant: state.variant,
        year: Number(state.year),
        kmDriven: Number(state.kmDriven),
        expectedPrice: Number(state.expectedPrice) || '',
        estimatePrice: state.valuation?.estimate || '',
        minPrice: state.valuation?.minPrice || '',
        maxPrice: state.valuation?.maxPrice || '',
        valuationId: state.valuation?.id || '',
        valuationSource: state.valuation?.source || '',
        valuationPending: state.valuation ? 'false' : 'true',
        registrationNumber: state.plate,
        rto: state.rto || '',
        fuel: state.fuel,
        transmission: state.transmission,
        bodyType: state.bodyType,
        color: state.color,
        ownership: Number(state.ownership),
        inspectionType: state.inspectionType,
        inspectionDate: state.inspectionDate,
        inspectionSlot: state.inspectionSlot,
        hubId: state.hubId || '',
        message: [
          'Sell',
          `${state.year} ${state.brand} ${state.model} ${state.variant}`.trim(),
          state.plate && `Reg ${state.plate}`,
          state.valuation
            ? `Estimate ${formatINR(state.valuation.minPrice)}–${formatINR(state.valuation.maxPrice)}`
            : 'Valuation pending',
          state.expectedPrice && `Expected ${formatINR(Number(state.expectedPrice))}`,
          `Inspection ${state.inspectionType} ${state.inspectionDate} ${state.inspectionSlot}`,
        ]
          .filter(Boolean)
          .join(' · '),
      };
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== '' && v != null) form.append(k, v);
      });
      (state.conditions || []).forEach((c) => form.append('conditions', c));
      let photos = state.photoFiles || [];
      if (!photos.length) {
        try {
          photos = filesFromPreviews((state.photoPreviews || []).filter((item) => item?.dataUrl));
        } catch {
          photos = [];
        }
      }
      photos.forEach((file) => form.append('photos', file));

      if (state.enquiryId && state.photoOnly) {
        if (!photos.length) {
          navigate('/profile/my-vehicles');
          return;
        }
        const photoForm = new FormData();
        photos.forEach((file) => photoForm.append('photos', file));
        await api.post(`/enquiries/seller/${state.enquiryId}/photos`, photoForm);
      } else if (state.enquiryId) {
        await api.patch(`/enquiries/seller/${state.enquiryId}`, payload);
        if (photos.length) {
          const photoForm = new FormData();
          photos.forEach((file) => photoForm.append('photos', file));
          await api.post(`/enquiries/seller/${state.enquiryId}/photos`, photoForm);
        }
      } else {
        await api.post('/enquiries/seller', form);
      }
      clearSellDraft();
      setGuided(false);
      toast.success('Your car is in My Vehicles. Add photos or edit details any time.');
      navigate('/profile/my-vehicles');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not book evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const resumeEditing = () => {
    const saved = draft || state;
    const previews = saved.photoPreviews || [];
    setState({
      ...initialSellCarState(),
      ...saved,
      photoPreviews: previews,
      photoFiles: filesFromPreviews(previews),
      done: false,
      step: resumeSellStep(saved),
    });
    setGate('form');
  };

  const startNewListing = () => {
    clearSellDraft();
    setDraft(null);
    setState(initialSellCarState());
    setGate('form');
  };

  if (gate === 'check') return null;

  if (gate === 'resume' && sellDraftReady(draft)) {
    return (
      <div className="space-y-4">
        {draft.done && (
          <div className="rounded-2xl border border-[#3083ff]/20 bg-[#f4f8ff] px-4 py-3">
            <p className="text-[14px] font-semibold text-slate-900">Inspection booked</p>
            <p className="mt-1 text-[13px] font-normal leading-snug text-slate-600">
              {draft.inspectionDate ? `${draft.inspectionDate}${draft.inspectionSlot ? ` · ${draft.inspectionSlot}` : ''}. ` : ''}
              Open Account → My Vehicles to edit details or upload photos.
            </p>
            <Link to="/profile/my-vehicles" className="mt-2 inline-flex text-[13px] font-semibold text-[#3083ff]">Open My Vehicles</Link>
          </div>
        )}
        <ResumeListingCard
          title={draft.done ? 'Request received' : 'Welcome back'}
          subtitle={draft.done ? 'Inspection booked' : 'Thanks for sharing the details'}
          year={draft.year}
          brand={draft.brand}
          model={draft.model}
          variant={draft.variant}
          kmDriven={draft.kmDriven}
          fuel={draft.fuel}
          city={draft.city}
          plate={draft.plate}
          onResume={resumeEditing}
          onNew={startNewListing}
        />
      </div>
    );
  }

  const manualOpen = state.step === 1 && (state.identifyMode === 'manual' || state.editManual);
  const meta = STEP_META[Math.max(0, state.step - 1)] || STEP_META[0];
  const advance = () => {
    if (state.step === 1) {
      if (!vehicleReady(state)) {
        toast.error('Select or look up your car first');
        return;
      }
      patch({ step: 2 });
      return;
    }
    if (state.step === 2) {
      const plateMsg = plateError(state.plate);
      const variantMsg = variantError(state.variant);
      if (plateMsg) return toast.error(plateMsg);
      if (variantMsg) return toast.error(variantMsg);
      if (!conditionReady(state)) {
        toast.error(conditionMessage(state));
        return;
      }
      requireAuth(goValuation);
      return;
    }
    if (state.step === 3) {
      if (!state.inspectionDate || !state.inspectionSlot) {
        toast.error('Pick a date and time slot');
        return;
      }
      if (!(Number(state.expectedPrice) > 0)) {
        toast.error('Enter your expected price');
        return;
      }
      patch({ step: 4 });
      return;
    }
    if (state.step === 4) {
      if (state.photoOnly && state.enquiryId) {
        requireAuth(confirm);
        return;
      }
      const hasPhotos = (state.photoFiles || []).length > 0 || (state.photoPreviews || []).length > 0;
      patch({ step: 5, photosSkipped: !hasPhotos });
      return;
    }
    requireAuth(confirm);
  };

  const stepNodes = (
    <>
      {state.step === 1 && (
        <StepIdentify
          state={state}
          setState={setState}
          patch={patch}
          guided={guided}
          onGuide={() => setGuided(true)}
          onNext={() => {
            setState((s) => {
              if (!vehicleReady(s)) {
                toast.error('Select or look up your car first');
                return s;
              }
              return { ...s, step: 2 };
            });
          }}
        />
      )}
      {state.step === 2 && (
        <StepCondition
          state={state}
          patch={patch}
          cities={cities}
          onBack={() => patch({ step: 1 })}
          onNext={() => requireAuth(goValuation)}
        />
      )}
      {state.step === 3 && (
        <StepValuation
          state={state}
          patch={patch}
          valuating={valuating}
          onBack={() => patch({ step: 2 })}
          onNext={() => {
            if (!state.inspectionDate || !state.inspectionSlot) {
              toast.error('Pick a date and time slot');
              return;
            }
            if (!(Number(state.expectedPrice) > 0)) {
              toast.error('Enter your expected price');
              return;
            }
            patch({ step: 4 });
          }}
        />
      )}
      {state.step === 4 && (
        <StepPhotos
          state={state}
          patch={patch}
          onSkip={() => {
            if (state.photoOnly && state.enquiryId) {
              navigate('/profile/my-vehicles');
              return;
            }
            patch({ step: 5, photosSkipped: true });
          }}
        />
      )}
      {state.step === 5 && (
        <StepAuth
          state={state}
          patch={patch}
          submitting={submitting}
          onBack={() => patch({ step: 4 })}
          onConfirm={() => requireAuth(confirm)}
        />
      )}
    </>
  );

  const nextLabel = state.step === 1
    ? 'Continue'
    : state.step === 2
      ? (valuating ? 'Estimating…' : 'See estimate')
      : state.step === 4
        ? ((state.photoFiles || []).length || (state.photoPreviews || []).length ? 'Continue' : 'Skip photos for now')
        : state.step === 5
          ? (submitting ? 'Booking…' : 'Book inspection')
          : 'Continue';

  if (phone && guided && typeof document !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 z-[70] flex flex-col bg-white">
        <div className="shrink-0 border-b border-slate-100 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (state.step > 1) patch({ step: state.step - 1 });
                else {
                  setGuided(false);
                  patch({ identifyMode: '', editManual: false });
                }
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-700"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#3083ff]">Step {state.step} of 5</p>
              <h3 className="truncate text-[16px] font-semibold text-slate-900">{meta.title}</h3>
            </div>
          </div>
          <p className="mt-2 text-[12px] font-normal leading-snug text-slate-500">{meta.hint}</p>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {STEP_META.map((item, index) => {
              const n = index + 1;
              const on = n === state.step;
              const done = n < state.step;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={!done}
                  onClick={() => patch({ step: n })}
                  className={`rounded-full px-1 py-1 text-[11px] font-semibold ${on ? 'bg-[#3083ff] text-white' : done ? 'bg-[#eaf2ff] text-[#1853ff]' : 'bg-slate-100 text-slate-400'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [&_.step-mobile-heading]:hidden">
          {state.fromValuation && (
            <div className="mb-3 rounded-2xl border border-[#3083ff]/20 bg-[#f4f8ff] px-3.5 py-3">
              <p className="text-[13px] font-medium text-slate-800">This car is from your valuation.</p>
              <p className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">Photos are next. You can skip them and add or edit the car later in My Vehicles.</p>
            </div>
          )}
          {(state.brand || state.valuation) && (
            <div className="mb-3 rounded-2xl border border-[#3083ff]/20 bg-[#f4f8ff] px-3.5 py-3">
              <p className="text-[11px] font-medium text-[#3083ff]">Your car</p>
              <p className="mt-0.5 text-[14px] font-medium text-slate-900">
                {[state.year, state.brand, state.model].filter(Boolean).join(' ')}
                {state.variant ? ` · ${state.variant}` : ''}
              </p>
              <p className="mt-0.5 text-[12px] font-normal text-slate-500">
                {[state.plate, state.city].filter(Boolean).join(' · ') || 'Add the remaining details'}
              </p>
              {state.valuation && (
                <p className="mt-1.5 text-[13px] font-semibold text-[#1853ff]">
                  Estimate {formatINR(state.valuation.minPrice)} – {formatINR(state.valuation.maxPrice)}
                </p>
              )}
            </div>
          )}
          {stepNodes}
        </div>
        {!manualOpen && (
          <div className="flex shrink-0 gap-2 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              disabled={
                (state.step === 2 && valuating) ||
                (state.step === 3 && (!state.inspectionDate || !state.inspectionSlot || !(Number(state.expectedPrice) > 0))) ||
                (state.step === 5 && submitting)
              }
              onClick={advance}
              className="h-11 w-full rounded-xl bg-[#3083ff] text-[14px] font-semibold text-white disabled:opacity-50"
            >
              {nextLabel}
            </button>
          </div>
        )}
      </div>,
      document.body
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-4 lg:gap-6 pb-2 lg:pb-0">
      <div className="min-w-0">
      {(state.brand || state.valuation) && (
        <div className="lg:hidden mb-3 rounded-2xl border border-[#3083ff]/20 bg-blue-50/60 px-3.5 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#3083ff]">Your car</p>
          <p className="text-[13px] font-black text-slate-900 mt-0.5">
            {[state.year, state.brand, state.model].filter(Boolean).join(' ')}
            {state.variant ? ` · ${state.variant}` : ''}
          </p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
            {[state.plate, state.city].filter(Boolean).join(' · ') || 'Add remaining details'}
          </p>
          {state.valuation && (
            <p className="text-[12px] font-black text-[#1853ff] mt-1.5">
              Estimate {formatINR(state.valuation.minPrice)} – {formatINR(state.valuation.maxPrice)}
            </p>
          )}
        </div>
      )}

      <Card className="p-4 sm:p-8 bg-white border border-slate-200 rounded-2xl lg:rounded-3xl overflow-x-clip" hover={false} beam={false}>
        <div className="lg:static sticky z-20 -mx-4 mb-2 border-b border-slate-100 bg-white/95 px-4 pb-3 pt-2 backdrop-blur lg:mx-0 lg:mb-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:backdrop-blur-none">
          <Stepper step={state.step} />
        </div>
        {state.fromValuation && (
          <div className="mb-4 hidden rounded-2xl border border-[#3083ff]/20 bg-[#f4f8ff] px-4 py-3 lg:block">
            <p className="text-sm font-black text-slate-900">This car is from your valuation.</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Photos are next. You can skip them and add or edit the car later in My Vehicles.</p>
          </div>
        )}
        {stepNodes}
      </Card>
      </div>

      <aside className="hidden lg:block space-y-4">
        {(state.brand || state.valuation) && (
          <Card className="p-5 bg-white border border-slate-200" hover={false}>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Your car</p>
            <p className="font-display font-black text-slate-900 mt-1">
              {[state.year, state.brand, state.model].filter(Boolean).join(' ') || 'Add details'}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Sell
              {state.plate ? ` · ${state.plate}` : ''}
              {state.city ? ` · ${state.city}` : ''}
            </p>
            {state.valuation && (
              <p className="text-sm font-black text-[#3083ff] mt-3">
                Estimate {formatINR(state.valuation.minPrice)} – {formatINR(state.valuation.maxPrice)}
              </p>
            )}
            {state.expectedPrice && (
              <p className="text-xs font-bold text-slate-500 mt-1">You expect {formatINR(Number(state.expectedPrice))}</p>
            )}
            {state.step > 1 && (
              <button
                type="button"
                onClick={() => patch({ step: 1 })}
                className="mt-4 text-xs font-black uppercase tracking-wider text-[#3083ff]"
              >
                Edit car details
              </button>
            )}
          </Card>
        )}
        {WHY.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-5 flex gap-4 bg-white border border-slate-200" hover={false}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">{title}</h3>
              <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{body}</p>
            </div>
          </Card>
        ))}
      </aside>

      {/* Mobile sticky CTA above BottomNav. Hidden while the brand sheet is open. */}
      {!(state.step === 1 && (state.identifyMode === 'manual' || state.editManual)) && (
      <div className="lg:hidden fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(15,23,42,0.08)] bottom-[calc(62px+env(safe-area-inset-bottom))]">
        <div className="flex gap-2 px-3 py-2.5">
          {state.step > 1 && (
            <button
              type="button"
              onClick={() => patch({ step: state.step - 1 })}
              className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[12px] font-black shrink-0"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={
              (state.step === 2 && valuating) ||
              (state.step === 3 && (!state.inspectionDate || !state.inspectionSlot || !(Number(state.expectedPrice) > 0))) ||
              (state.step === 5 && submitting)
            }
            onClick={advance}
            className="flex-1 h-11 rounded-xl bg-[#3083ff] text-white text-[14px] font-semibold disabled:opacity-50"
          >
            {nextLabel}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
