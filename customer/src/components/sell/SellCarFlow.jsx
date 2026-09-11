import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, Check, HandCoins, ShieldCheck, Timer } from 'lucide-react';
import api from '../../api/axios';
import { useAuthGuard } from '../AuthGuardModal';
import useReferenceData from '../../hooks/useReferenceData';
import { Card, formatINR } from '../PageShell';
import { conditionScoreFromPills, initialSellCarState, vehicleReady } from './sellCarState';
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
  const [valuating, setValuating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { requireAuth } = useAuthGuard();

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
          `${state.intent === 'exchange' ? 'Exchange' : state.intent === 'both' ? 'Sell/Exchange' : 'Sell'}`,
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
      (state.photoFiles || []).forEach((file) => form.append('photos', file));

      await api.post('/enquiries/seller', form);
      patch({ done: true });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not book evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (state.done) {
    return (
      <Card className="p-8 text-center bg-white border border-slate-200" hover={false}>
        <div className="w-14 h-14 rounded-2xl bg-[#3083ff] flex items-center justify-center mx-auto">
          <Check className="w-7 h-7 text-white" strokeWidth={3} />
        </div>
        <h3 className="font-display font-black text-2xl text-slate-900 mt-5">Request received</h3>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          {state.inspectionDate} · {state.inspectionSlot}. A 4TYREZZ executive will call +91 {state.phone} to confirm
          inspection. The figure you saw is an estimate only — any purchase or exchange offer comes after inspection.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            to="/cars"
            className="bg-[#3083ff] text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl"
          >
            Browse cars
          </Link>
          <button
            type="button"
            onClick={() => setState(initialSellCarState())}
            className="border border-slate-200 bg-white text-slate-800 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl"
          >
            Value another car
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6">
      <Card className="p-5 sm:p-8 bg-white border border-slate-200" hover={false} beam={false}>
        <Stepper step={state.step} />

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

      <aside className="space-y-4">
        {(state.brand || state.valuation) && (
          <Card className="p-5 bg-white border border-slate-200" hover={false}>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Your car</p>
            <p className="font-display font-black text-slate-900 mt-1">
              {[state.year, state.brand, state.model].filter(Boolean).join(' ') || 'Add details'}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              {state.intent === 'exchange' ? 'Exchange' : state.intent === 'both' ? 'Sell & exchange' : 'Sell'}
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
    </div>
  );
}
