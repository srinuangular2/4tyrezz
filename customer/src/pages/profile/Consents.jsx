import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { ProfileCard } from './ProfileLayout';
import { DataCard } from './hubUtils';

const ITEMS = [
  { key: 'whatsappUpdates', emoji: '💬', title: 'WhatsApp updates', body: 'Booking, valuation and listing alerts on WhatsApp.' },
  { key: 'marketingSms', emoji: '📱', title: 'Marketing SMS', body: 'Offers, price drops and campaign messages.' },
  { key: 'wishlistPriceDrop', emoji: '💸', title: 'Wishlist price-drop alerts', body: 'Notify me when a shortlisted car price falls.' },
  { key: 'wishlistAvailability', emoji: '🔔', title: 'Wishlist availability alerts', body: 'Notify me when a shortlisted car is sold, reserved or unpublished.' },
  { key: 'dataSharing', emoji: '🔒', title: 'Data privacy / partner sharing', body: 'Allow verified finance and insurance partners to contact you for quotes you requested.' },
];

export default function Consents() {
  const [consents, setConsents] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/user/consents')
      .then((r) => setConsents(r.data.data))
      .catch(() => setConsents({ whatsappUpdates: false, marketingSms: false, dataSharing: false, wishlistPriceDrop: true, wishlistAvailability: true }));
  }, []);

  const toggle = async (key) => {
    const next = { ...consents, [key]: !consents[key] };
    setConsents(next);
    setSaving(true);
    try {
      const { data } = await api.put('/user/consents', next);
      setConsents(data.data);
      toast.success('Preference saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileCard eyebrow="Privacy" title="Manage consents">
      {!consents && <p className="text-sm font-semibold text-slate-500">Loading preferences…</p>}
      {consents && (
        <>
        <div className="space-y-3 lg:hidden">
          {ITEMS.map((item, index) => (
            <label key={item.key} className="block cursor-pointer">
              <DataCard index={index} emoji={item.emoji} title={item.title} detail={item.body}>
                <span className="inline-flex items-center gap-2 text-[12px] font-black text-slate-700">
                  <input
                    type="checkbox"
                    disabled={saving}
                    checked={Boolean(consents[item.key])}
                    onChange={() => toggle(item.key)}
                    className="w-4 h-4 accent-[#3083ff]"
                  />
                  {consents[item.key] ? 'On' : 'Off'}
                </span>
              </DataCard>
            </label>
          ))}
        </div>
        <div className="hidden lg:block space-y-3">
          {ITEMS.map((item) => (
            <label key={item.key} className="flex items-start justify-between gap-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/20 dark:border-slate-800/80 px-4 py-4 cursor-pointer">
              <div>
                <p className="font-black text-slate-900 text-sm">{item.title}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">{item.body}</p>
              </div>
              <input
                type="checkbox"
                disabled={saving}
                checked={Boolean(consents[item.key])}
                onChange={() => toggle(item.key)}
                className="mt-1 w-4 h-4 accent-[#3083ff]"
              />
            </label>
          ))}
        </div>
        </>
      )}
    </ProfileCard>
  );
}
