import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchVehicleDetailsByReg, formatPlateInput, normalizeReg } from '../../lib/fetchVehicleDetailsByReg';
import { applyLookup } from './sellCarState';
import BrandModelGrid from './BrandModelGrid';
import VerifiedDetailsCard from './VerifiedDetailsCard';
import { Skeleton } from '../PageShell';

export default function StepIdentify({ state, setState, patch, onNext }) {
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const lookup = async () => {
    const reg = normalizeReg(state.plate);
    if (reg.length < 8) {
      setError('Enter a full registration number, e.g. TS 09 AB 1234');
      return;
    }
    if (cooldown > 0) {
      setError(`Wait ${cooldown}s — RapidAPI blocked extra requests.`);
      return;
    }
    setError('');
    setState((s) => ({ ...s, lookupStatus: 'loading', verified: false }));
    try {
      const details = await fetchVehicleDetailsByReg(state.plate);
      setState((s) => applyLookup(s, details));
    } catch (e) {
      const secs = Number(e.response?.data?.retryAfter || 60);
      if (e.response?.status === 429) setCooldown(secs);
      setState((s) => ({ ...s, lookupStatus: 'error' }));
      setError(e.response?.data?.message || 'Could not fetch vehicle details');
      toast.error(e.response?.data?.message || 'Lookup failed — try manual search');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#3083ff]">Step 1</p>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 mt-1">Identify your car</h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Choose Sell or Exchange, then enter the RC number. We fetch live RTO data — make, model, variant, year, fuel and office.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'sell', label: 'Sell' },
          { id: 'exchange', label: 'Exchange' },
          { id: 'both', label: 'Both' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => patch({ intent: opt.id })}
            className={`rounded-2xl border px-3 py-3 text-xs font-black uppercase tracking-wider transition ${
              state.intent === opt.id
                ? 'bg-[#3083ff] text-white border-[#3083ff] shadow-lg shadow-blue-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:border-[#3083ff]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm">
        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Registration number</label>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <input
            value={state.plate}
            onChange={(e) => patch({ plate: formatPlateInput(e.target.value), verified: false })}
            onKeyDown={(e) => e.key === 'Enter' && lookup()}
            placeholder="TS 09 AB 1234"
            autoCapitalize="characters"
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg font-black tracking-[0.18em] uppercase text-slate-900 placeholder:text-slate-400 placeholder:font-medium placeholder:tracking-normal outline-none focus:border-[#3083ff] focus:ring-2 focus:ring-[#3083ff]/20 shadow-sm"
          />
          <button
            type="button"
            onClick={lookup}
            disabled={state.lookupStatus === 'loading' || cooldown > 0}
            className="sm:w-44 bg-[#3083ff] hover:bg-[#1853ff] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl px-5 py-4"
          >
            {state.lookupStatus === 'loading' ? 'Checking…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Check value'}
          </button>
        </div>
        {error && <p className="text-sm font-semibold text-rose-600 mt-2">{error}</p>}
        <p className="text-[11px] font-medium text-slate-400 mt-2">
          Use the exact number on the plate (no extra spaces needed). If RTO has no record, search manually by brand.
        </p>
      </div>

      {state.lookupStatus === 'loading' && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      )}

      {state.verified && !state.editManual && (
        <VerifiedDetailsCard
          state={state}
          onEdit={() => patch({ editManual: true, identifyMode: 'manual', manualPhase: 'brand' })}
          onContinue={onNext}
        />
      )}

      <button
        type="button"
        onClick={() => patch({ identifyMode: 'manual', editManual: true, manualPhase: state.brand ? 'model' : 'brand' })}
        className="text-sm font-extrabold text-[#3083ff] hover:underline"
      >
        Or search manually by brand
      </button>

      {(state.identifyMode === 'manual' || state.editManual) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
          <BrandModelGrid
            state={state}
            patch={patch}
            onReady={onNext}
          />
        </div>
      )}
    </div>
  );
}
