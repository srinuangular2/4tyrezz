import { ImagePlus } from 'lucide-react';
import { formatINR } from '../PageShell';
import { fileToPreview } from './sellCarState';
import { StepHeading } from './ui';

const TIPS = [
  'Upload a clear front view of the car',
  'Add a few angles: side, rear and inside',
  'Use daylight and keep the full car in frame',
  'Avoid another car in the background',
];

function ownerLabel(value) {
  const n = Number(value);
  if (n === 1) return '1st owner';
  if (n === 2) return '2nd owner';
  if (n === 3) return '3rd owner';
  if (n > 3) return '4th+ owner';
  return '';
}

export default function StepPhotos({ state, patch, onBack, onNext }) {
  const thumbs = (state.photoPreviews || []).map((item) => item.dataUrl).filter(Boolean);

  const onPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    e.target.value = '';
    if (!files.length) return;
    const previews = await Promise.all(files.map(fileToPreview));
    const mergedFiles = [...(state.photoFiles || []), ...files].slice(0, 8);
    const mergedPreviews = [...(state.photoPreviews || []), ...previews].slice(0, 8);
    patch({ photoFiles: mergedFiles, photoPreviews: mergedPreviews, photosSkipped: false });
  };

  const removePhoto = (index) => {
    patch({
      photoFiles: (state.photoFiles || []).filter((_, i) => i !== index),
      photoPreviews: (state.photoPreviews || []).filter((_, i) => i !== index),
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
        step={4}
        title="Upload photos"
        hint="Add a few photos of the car, then continue to confirm the inspection."
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

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#3083ff] px-4 py-2.5 text-[14px] font-semibold text-white">
            <ImagePlus className="h-4 w-4" />
            Add photos
          </span>
          <span className="mt-3 text-center text-[12px] font-normal text-slate-500">JPG or PNG, up to 8 photos</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={onPhotos} />
        </label>
        <div className="rounded-2xl bg-[#eef6ff] px-4 py-4">
          <p className="text-[13px] font-semibold text-[#1853ff]">Tips for photos</p>
          <ul className="mt-2 space-y-1.5">
            {TIPS.map((tip) => (
              <li key={tip} className="text-[12px] font-normal leading-snug text-slate-600">✓ {tip}</li>
            ))}
          </ul>
        </div>
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

      <div className="hidden gap-3 pt-2 lg:flex">
        <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-slate-200 bg-white py-3.5 text-xs font-black uppercase tracking-wider text-slate-700">
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl bg-[#3083ff] py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#1853ff]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
