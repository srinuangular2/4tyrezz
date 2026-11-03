import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchVehicleDetailsByReg, formatPlateInput, normalizeReg } from '../../lib/fetchVehicleDetailsByReg';
import { applyLookup } from './sellCarState';
import BrandModelGrid from './BrandModelGrid';
import VerifiedDetailsCard from './VerifiedDetailsCard';
import { Skeleton } from '../PageShell';
import { StepHeading, useIsPhone } from './ui';

export default function StepIdentify({ state, setState, patch, onNext, onGuide }) {
  const phone = useIsPhone();
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
      setError(`Wait ${cooldown}s before checking again.`);
      return;
    }
    setError('');
    if (phone) onGuide?.();
    setState((s) => ({ ...s, lookupStatus: 'loading', verified: false }));
    try {
      const details = await fetchVehicleDetailsByReg(state.plate);
      setState((s) => applyLookup(s, details));
    } catch (e) {
      const secs = Number(e.response?.data?.retryAfter);
      if (e.response?.status === 429 && Number.isFinite(secs) && secs > 0) setCooldown(secs);
      setState((s) => ({ ...s, lookupStatus: 'error' }));
      setError(e.response?.data?.message || 'Could not fetch vehicle details');
      toast.error(e.response?.data?.message || 'Lookup failed — try manual search');
    }
  };

  const openManual = () => {
    if (phone) onGuide?.();
    patch({
      identifyMode: 'manual',
      editManual: true,
      manualPhase: state.model ? 'variant' : state.year ? 'model' : state.brand ? 'year' : 'brand',
    });
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <StepHeading
        step={1}
        title="Which car are you selling?"
        desktopTitle="Identify your car"
        hint="Enter the number on the number plate, or choose the brand yourself."
        desktopHint="Enter the RC number to get started. We fetch live RTO data — make, model, variant, year, fuel and office."
      />

      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:rounded-3xl sm:p-5 shadow-sm">
        <label className="text-[13px] font-semibold text-slate-700 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">Registration number</label>
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
            {state.lookupStatus === 'loading' ? 'Checking…' : cooldown > 0 ? `Wait ${cooldown}s` : (
              <>
                <span className="lg:hidden">Find my car</span>
                <span className="hidden lg:inline">Check value</span>
              </>
            )}
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
        onClick={openManual}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left lg:w-auto lg:border-0 lg:bg-transparent lg:p-0"
      >
        <span className="block text-[14px] font-semibold text-[#3083ff] lg:text-sm lg:font-extrabold lg:hover:underline">Choose brand, year and model</span>
        <span className="mt-0.5 block text-[12px] font-normal text-slate-500 lg:hidden">Use this if the RC number is not with you.</span>
      </button>

      {(state.identifyMode === 'manual' || state.editManual) && (
        <div className="lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:p-6">
          <BrandModelGrid
            mobileSheet
            state={state}
            patch={patch}
            onReady={onNext}
            onClose={() => patch({ identifyMode: '', editManual: false })}
          />
        </div>
      )}

    </div>
  );
}
