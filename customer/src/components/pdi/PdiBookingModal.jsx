import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const SLOTS = ['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00'];

const EMPTY = {
  pdiType: 'USED_CAR',
  address: '',
  city: '',
  pincode: '',
  scheduledDate: '',
  timeSlot: SLOTS[0],
  brand: '',
  model: '',
  vinOrReg: '',
};

export default function PdiBookingModal({ car, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ...EMPTY,
    pdiType: car ? 'USED_CAR' : 'NEW_CAR',
    brand: car?.brand?.name || '',
    model: car?.model?.name || '',
    vinOrReg: car?.rtoDetails?.rcNumber || '',
    city: car?.city?.name || car?.location?.city || '',
    carId: car?._id || '',
  });

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const next = () => {
    if (step === 2) {
      if (!form.address || !form.city || form.pincode.length !== 6 || !form.scheduledDate || !form.brand || !form.model || !form.vinOrReg) {
        toast.error('Add location, slot, and vehicle details');
        return;
      }
    }
    setStep((n) => Math.min(3, n + 1));
  };

  const confirm = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/pdi/bookings', form);
      await api.post(`/pdi/bookings/${data.data._id}/confirm`, {
        razorpay_order_id: data.payment?.orderId,
        razorpay_payment_id: data.payment?.stub ? `pay_stub_${Date.now()}` : undefined,
        razorpay_signature: 'stub',
      });
      toast.success('PDI booked');
      onClose();
      navigate('/profile/pdi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not book inspection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#3083ff]">Step {step} of 3</p>
          <button type="button" onClick={onClose} className="text-slate-400 font-black">✕</button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900">Where should we inspect?</h3>
            {[
              { id: 'NEW_CAR', title: 'New car · dealer yard', body: 'Inspection at the showroom before you take delivery.' },
              { id: 'USED_CAR', title: 'Used car · doorstep', body: 'Inspector visits the address you share.' },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => set('pdiType', option.id)}
                className={`w-full text-left rounded-2xl border p-4 ${form.pdiType === option.id ? 'border-[#3083ff] bg-blue-50' : 'border-slate-200'}`}
              >
                <p className="font-black text-slate-900 text-sm">{option.title}</p>
                <p className="text-xs text-slate-500 mt-1">{option.body}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900">Location and slot</h3>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
              <input className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Pincode" inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <input type="date" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" value={form.scheduledDate} onChange={(e) => set('scheduledDate', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((slot) => (
                <button key={slot} type="button" onClick={() => set('timeSlot', slot)} className={`rounded-xl border px-2 py-2 text-xs font-bold ${form.timeSlot === slot ? 'border-[#3083ff] bg-blue-50 text-[#1853ff]' : 'border-slate-200'}`}>
                  {slot}
                </button>
              ))}
            </div>
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="Model" value={form.model} onChange={(e) => set('model', e.target.value)} />
            <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm uppercase" placeholder="VIN or registration number" value={form.vinOrReg} onChange={(e) => set('vinOrReg', e.target.value.toUpperCase())} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900">Confirm booking</h3>
            <p className="text-sm text-slate-600">
              {form.pdiType === 'NEW_CAR' ? 'New car dealer-yard' : 'Used car doorstep'} inspection for {form.brand} {form.model}.
            </p>
            <p className="text-sm font-semibold text-slate-700">{form.address}, {form.city} {form.pincode}</p>
            <p className="text-sm text-slate-500">{form.scheduledDate} · {form.timeSlot}</p>
            <p className="text-2xl font-black text-slate-900">₹999</p>
            <p className="text-xs text-slate-500">Payment is confirmed with the booking. A health report is shared after the inspector finishes.</p>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          {step > 1 && (
            <button type="button" onClick={() => setStep((n) => n - 1)} className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-black uppercase">Back</button>
          )}
          {step < 3 ? (
            <button type="button" onClick={next} className="flex-1 rounded-xl bg-[#3083ff] text-white py-3 text-xs font-black uppercase">Continue</button>
          ) : (
            <button type="button" disabled={saving} onClick={confirm} className="flex-1 rounded-xl bg-[#3083ff] text-white py-3 text-xs font-black uppercase disabled:opacity-50">
              {saving ? 'Booking…' : 'Pay & confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
