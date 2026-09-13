import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { inputCls } from '../components/admin/ui';

export default function ContentCMS() {
  const [tab, setTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [form, setForm] = useState({});

  const load = async () => {
    const [f, t] = await Promise.all([api.get('/content/faqs'), api.get('/content/testimonials')]);
    setFaqs(f.data.data || []);
    setTestimonials(t.data.data || []);
  };

  useEffect(() => {
    load().catch(() => toast.error('Failed to load content'));
  }, []);

  const saveFaq = async () => {
    await api.post('/content/faqs', form);
    toast.success('FAQ saved');
    setForm({});
    load();
  };

  const saveTestimonial = async () => {
    await api.post('/content/testimonials', form);
    toast.success('Testimonial saved');
    setForm({});
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Content CMS</h1>
      <div className="flex gap-2">
        {['faqs', 'testimonials'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setForm({});
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'faqs' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <input
              className={inputCls}
              placeholder="Question"
              value={form.question || ''}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
            <textarea
              className={inputCls}
              placeholder="Answer"
              rows={4}
              value={form.answer || ''}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
            <button type="button" onClick={saveFaq} className="bg-[#3083ff] text-white px-4 py-2 rounded-lg font-semibold">
              Save FAQ
            </button>
          </div>
          <ul className="space-y-2">
            {faqs.map((f) => (
              <li key={f._id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-sm">
                <p className="font-bold">{f.question}</p>
                <p className="text-slate-600 mt-1">{f.answer}</p>
                <button
                  type="button"
                  className="text-red-600 text-xs font-bold mt-2"
                  onClick={async () => {
                    await api.delete(`/content/faqs/${f._id}`);
                    load();
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'testimonials' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <input
              className={inputCls}
              placeholder="Name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className={inputCls}
              placeholder="Role"
              value={form.role || ''}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <textarea
              className={inputCls}
              placeholder="Text"
              rows={4}
              value={form.text || ''}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
            />
            <button
              type="button"
              onClick={saveTestimonial}
              className="bg-[#3083ff] text-white px-4 py-2 rounded-lg font-semibold"
            >
              Save testimonial
            </button>
          </div>
          <ul className="space-y-2">
            {testimonials.map((t) => (
              <li key={t._id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 text-sm">
                <p className="font-bold">
                  {t.name} · {t.role}
                </p>
                <p className="text-slate-600 mt-1">{t.text}</p>
                <button
                  type="button"
                  className="text-red-600 text-xs font-bold mt-2"
                  onClick={async () => {
                    await api.delete(`/content/testimonials/${t._id}`);
                    load();
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
