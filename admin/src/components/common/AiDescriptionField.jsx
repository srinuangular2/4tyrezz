import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import api from '../../api/axios';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'sales', label: 'High-Impact Sales' },
  { value: 'technical', label: 'Detailed & Technical' },
  { value: 'punchy', label: 'Short & Punchy' },
];

const selectCls =
  'bg-white/80 dark:bg-slate-950/60 border border-white/30 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none';

function typewrite(text, onTick) {
  let i = 0;
  const step = Math.max(3, Math.ceil(String(text).length / 90));
  return new Promise((resolve) => {
    const id = setInterval(() => {
      i = Math.min(text.length, i + step);
      onTick(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        resolve();
      }
    }, 18);
  });
}

export default function AiDescriptionField({ form, features = [], value, onChange }) {
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(Boolean(value));
  const runId = useRef(0);

  useEffect(() => () => { runId.current += 1; }, []);

  const payload = (refine = '') => ({
    brand: form.brand,
    model: form.model,
    variant: form.variant,
    year: form.year,
    kmDriven: form.kmDriven,
    fuelType: form.fuel,
    transmission: form.transmission,
    price: form.price,
    color: form.color,
    ownerCount: form.ownership,
    condition: [form.engineState, form.accidental === 'No' ? '' : `Accidental: ${form.accidental}`, form.serviceHistory]
      .filter(Boolean)
      .join(' · '),
    location: form.formattedAddress || form.city,
    area: form.locationArea,
    city: form.locationCity || form.city,
    keyFeatures: features,
    tone,
    language,
    refine,
    currentDescription: value,
  });

  const generate = async (refine = '') => {
    if (!form.brand || !form.model) {
      toast.error('Select brand and model first');
      return;
    }
    const id = ++runId.current;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/generate-description', payload(refine));
      const text = data?.data?.description || '';
      if (!text) throw new Error('Empty description');
      if (id !== runId.current) return;
      await typewrite(text, (chunk) => {
        if (id === runId.current) onChange(chunk);
      });
      setReady(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate description');
    } finally {
      if (id === runId.current) setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Listing notes</span>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-700/80 shadow-[0_8px_24px_rgba(15,23,42,0.08)] rounded-2xl p-3 flex flex-wrap items-center gap-2">
        <select className={selectCls} value={tone} onChange={(e) => setTone(e.target.value)} disabled={loading}>
          {TONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex rounded-xl overflow-hidden border border-white/30 dark:border-slate-700/80">
          {[
            ['en', 'English'],
            ['hinglish', 'Hinglish'],
          ].map(([v, label]) => (
            <button
              key={v}
              type="button"
              disabled={loading}
              onClick={() => setLanguage(v)}
              className={`px-3 py-2 text-[11px] font-black uppercase tracking-wide ${
                language === v ? 'bg-blue-600 text-white' : 'bg-white/50 dark:bg-slate-950/40 text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => generate('')}
          className="ml-auto inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-[0_0_22px_rgba(59,130,246,0.35)] ring-1 ring-blue-300/40 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating…' : 'Auto-Generate Description'}
        </button>
      </div>

      {loading && (
        <div className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 rounded-full px-3 py-1 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          AI is crafting vehicle description...
        </div>
      )}

      <textarea
        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-sm font-medium outline-none text-slate-900 dark:text-slate-100 min-h-[160px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Highlight service history, extras, or inspection notes — or generate with AI"
        disabled={loading}
      />

      {ready && !loading && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => generate('regenerate')} className="text-[12px] font-extrabold px-3.5 py-2 rounded-full bg-slate-100 text-slate-800 border border-slate-300 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-500">
            🔄 Regenerate
          </button>
          <button type="button" onClick={() => generate('highlights')} className="text-[12px] font-extrabold px-3.5 py-2 rounded-full bg-slate-100 text-slate-800 border border-slate-300 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-500">
            ➕ Add Highlights (Single Owner, Clean History)
          </button>
          <button type="button" onClick={() => generate('price')} className="text-[12px] font-extrabold px-3.5 py-2 rounded-full bg-slate-100 text-slate-800 border border-slate-300 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 dark:bg-slate-800 dark:text-white dark:border-slate-500">
            🏷️ Highlight Price Value
          </button>
        </div>
      )}
    </div>
  );
}
