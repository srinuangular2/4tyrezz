import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2, Sparkles, Upload } from 'lucide-react';
import api from '../../api/axios';
import { formatINR } from '../PageShell';
import { PHOTO_SLOTS, fileToPreview } from './sellCarState';
import { StepHeading, sellChipIdle, sellFieldClass } from './ui';

const DOCUMENTS = [
  { key: 'rcCopy', label: 'RC copy' },
  { key: 'insurancePolicy', label: 'Insurance policy' },
  { key: 'serviceHistoryDoc', label: 'Service history log' },
];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'sales', label: 'High-impact' },
  { value: 'technical', label: 'Technical' },
  { value: 'punchy', label: 'Short' },
];

function ownerLabel(value) {
  const n = Number(value);
  if (n === 1) return '1st owner';
  if (n === 2) return '2nd owner';
  if (n === 3) return '3rd owner';
  if (n > 3) return '4th+ owner';
  return '';
}

function DescriptionField({ state, patch }) {
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  const generate = async (refine = '', quiet = false) => {
    if (!state.brand || !state.model) {
      if (!quiet) toast.error('Select brand and model first');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-description', {
        brand: state.brand,
        model: state.model,
        variant: state.variant,
        year: state.year,
        kmDriven: state.kmDriven,
        fuelType: state.fuel,
        transmission: state.transmission,
        price: state.expectedPrice,
        color: state.color,
        ownerCount: state.ownership,
        condition: [state.engineState, state.accidental === 'Yes' ? state.accidentDetails : '', state.serviceHistory].filter(Boolean).join(' · '),
        city: state.city,
        area: state.locationArea,
        keyFeatures: state.features || [],
        tone,
        language,
        refine,
        currentDescription: state.description || '',
      });
      const text = data?.data?.description || '';
      if (!text) throw new Error('Empty description');
      patch({ description: text });
    } catch (err) {
      if (!quiet) toast.error(err.response?.data?.message || 'Could not generate description');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (started.current || state.description) return;
    started.current = true;
    generate('', true);
    // Generate once when this step opens with an empty description.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
        >
          {TONES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        {[['en', 'English'], ['hinglish', 'Hinglish']].map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={loading}
            onClick={() => setLanguage(value)}
            className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wide ${
              language === value ? 'border-[#3083ff] bg-[#3083ff] text-white' : sellChipIdle
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={loading}
          onClick={() => generate('')}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#3083ff] px-4 py-2.5 text-xs font-black text-white hover:bg-[#1853ff] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating…' : 'Auto-generate description'}
        </button>
      </div>
      <textarea
        value={state.description || ''}
        onChange={(e) => patch({ description: e.target.value })}
        rows={6}
        disabled={loading}
        placeholder="Highlight service history, extras, or inspection notes — or generate with AI"
        className={sellFieldClass}
      />
    </section>
  );
}

export default function StepPhotos({ state, patch, onBack, onNext }) {
  const thumbs = (state.photoPreviews || []).map((item) => item.dataUrl).filter(Boolean);

  const onPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    e.target.value = '';
    if (!files.length) return;
    const previews = await Promise.all(files.map(fileToPreview));
    patch({
      photoFiles: [...(state.photoFiles || []), ...files].slice(0, 8),
      photoPreviews: [...(state.photoPreviews || []), ...previews].slice(0, 8),
      photosSkipped: false,
    });
  };

  const removePhoto = (index) => {
    patch({
      photoFiles: (state.photoFiles || []).filter((_, i) => i !== index),
      photoPreviews: (state.photoPreviews || []).filter((_, i) => i !== index),
    });
  };

  const assignSlot = async (key, file) => {
    if (!file) return;
    const preview = await fileToPreview(file);
    patch({
      photoSlots: { ...(state.photoSlots || {}), [key]: preview },
      slotFiles: { ...(state.slotFiles || {}), [key]: file },
      photosSkipped: false,
    });
  };

  const chips = [
    state.brand,
    state.year,
    state.model,
    state.variant,
    ownerLabel(state.ownership),
    state.kmDriven ? `${Number(state.kmDriven).toLocaleString('en-IN')} km` : '',
    state.expectedPrice ? formatINR(Number(state.expectedPrice)) : '',
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <StepHeading
        step={5}
        title="Upload photos"
        hint="Add the 360° views first. The inspection slot is booked after this."
        desktopTitle="Photos and description"
        desktopHint="Same photo slots as an admin listing, plus an auto-written description."
      />

      {chips.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chips.map((chip) => (
            <span key={chip} className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-600">
              {chip}
            </span>
          ))}
        </div>
      )}

      <section>
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">360° photo slots</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {PHOTO_SLOTS.map(({ key, label }) => {
            const preview = state.photoSlots?.[key]?.dataUrl;
            return (
              <label key={key} className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                {preview ? (
                  <>
                    <img src={preview} alt={label} className="absolute inset-0 h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const nextSlots = { ...(state.photoSlots || {}) };
                        const nextFiles = { ...(state.slotFiles || {}) };
                        delete nextSlots[key];
                        delete nextFiles[key];
                        patch({ photoSlots: nextSlots, slotFiles: nextFiles });
                      }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-[#3083ff]" />
                    <span className="mt-2 px-2 text-center text-xs font-bold text-slate-600">{label}</span>
                  </>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => assignSlot(key, e.target.files?.[0])} />
              </label>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#3083ff] px-4 py-2.5 text-[14px] font-semibold text-white">
            <ImagePlus className="h-4 w-4" />
            Extra photos
          </span>
          <span className="mt-3 text-center text-[12px] font-normal text-slate-500">JPG or PNG, up to 8 more angles</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={onPhotos} />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-slate-700 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">Video URL</span>
          <input
            value={state.videoUrl || ''}
            onChange={(e) => patch({ videoUrl: e.target.value })}
            placeholder="YouTube or MP4 link"
            className={`mt-1.5 ${sellFieldClass}`}
          />
        </label>
      </div>

      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((src, index) => (
            <div key={`${index}-${src.slice(-16)}`} className="relative">
              <img src={src} alt="" className="h-20 w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <section>
        <h3 className="mb-2 text-[14px] font-semibold text-slate-900 lg:text-[11px] lg:font-black lg:uppercase lg:tracking-wider lg:text-slate-500">Documents</h3>
        <p className="mb-2 text-[12px] font-normal text-slate-500">Private to 4tyrezz. These are not shown in the public gallery.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DOCUMENTS.map(({ key, label }) => (
            <label key={key} className="cursor-pointer rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
              <span className="block text-[13px] font-semibold text-slate-800">{label}</span>
              <span className="mt-1 block truncate text-[12px] font-normal text-slate-500">{state.docFiles?.[key]?.name || 'PDF or image'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  patch({ docFiles: { ...(state.docFiles || {}), [key]: file } });
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <DescriptionField state={state} patch={patch} />

      <div className="hidden gap-3 pt-2 lg:flex">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl bg-[#3083ff] py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#1853ff]"
        >
          Book inspection
        </button>
      </div>
    </div>
  );
}
