import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, HandCoins, ShieldCheck, Timer } from 'lucide-react';
import api from '../../api/axios';
import { useAuthGuard } from '../AuthGuardModal';
import useReferenceData from '../../hooks/useReferenceData';
import { clearSellDraft, loadSellDraft, saveSellDraft, sellDraftReady } from '../../lib/listingDrafts';
import { Card, formatINR } from '../PageShell';
import { conditionScoreFromPills, filesFromPreviews, initialSellCarState, resumeSellStep, vehicleReady, conditionReady, plateError, variantError } from './sellCarState';
import ResumeListingCard from './ResumeListingCard';
import { Stepper } from './ui';
import StepIdentify from './StepIdentify';
import StepCondition from './StepCondition';
import StepValuation from './StepValuation';
import StepAuth from './StepAuth';

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
  const { requireAuth, isAuthed } = useAuthGuard();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadSellDraft();
      if (cancelled) return;
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
  }, []);

  useEffect(() => {
    if (gate !== 'form') return;
    if (!state.brand && !state.done) return;
    if (!isAuthed) return;
    saveSellDraft(state);
  }, [state, gate, isAuthed]);

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
      const photos = (state.photoFiles || []).length
        ? state.photoFiles
        : filesFromPreviews(state.photoPreviews);
      photos.forEach((file) => form.append('photos', file));

      await api.post('/enquiries/seller', form);
      const next = { ...state, done: true };
      saveSellDraft(next, { immediate: true });
      setDraft(next);
      setGate('resume');
      patch({ done: true });
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
          <p className="text-sm font-semibold text-slate-500">
            Request received
            {draft.inspectionDate ? ` · ${draft.inspectionDate}` : ''}
            {draft.inspectionSlot ? ` ${draft.inspectionSlot}` : ''}. You can edit the car and resubmit, or start a new listing.
          </p>
        )}
        <ResumeListingCard
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

  return (
    <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-4 lg:gap-6 pb-24 lg:pb-0">
      <div className="min-w-0">
      {/* Mobile summary of selected car — mirrors valuation focus */}
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
        <div className="lg:static sticky top-14 z-20 -mx-4 px-4 pt-2 pb-3 mb-2 bg-white/95 backdrop-blur border-b border-slate-100 lg:border-0 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 lg:mb-0 lg:bg-transparent lg:backdrop-blur-none">
          <Stepper step={state.step} />
        </div>

        {state.step === 1 && (
          <StepIdentify
            state={state}
            setState={setState}
            patch={patch}
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
          <StepAuth
            state={state}
            patch={patch}
            submitting={submitting}
            onBack={() => patch({ step: 3 })}
            onConfirm={() => requireAuth(confirm)}
          />
        )}
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

      {/* Mobile sticky CTA above BottomNav */}
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
              (state.step === 4 && submitting)
            }
            onClick={() => {
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
                  toast.error('Add city, photos and a valid RC number and variant');
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
              requireAuth(confirm);
            }}
            className="flex-1 h-11 rounded-xl bg-[#3083ff] text-white text-[13px] font-black disabled:opacity-50"
          >
            {state.step === 1 && 'Continue'}
            {state.step === 2 && (valuating ? 'Estimating…' : 'Get valuation')}
            {state.step === 3 && 'Continue'}
            {state.step === 4 && (submitting ? 'Booking…' : 'Confirm evaluation')}
          </button>
        </div>
      </div>
    </div>
  );
}
