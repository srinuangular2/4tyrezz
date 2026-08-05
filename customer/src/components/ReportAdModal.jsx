import { useState } from 'react';
import api from '../api/axios';

const REASONS = ['Incorrect price', 'Car already sold', 'Suspicious seller', 'Duplicate listing', 'Wrong details', 'Other'];

export default function ReportAdModal({ carId, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reports', { carId, reason, message });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit report — please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <>
            <h3 className="font-display font-semibold text-xl">Thanks for the report</h3>
            <p className="text-sm text-slate2 mt-2">Our team will review this listing.</p>
            <button onClick={onClose} className="w-full bg-ink text-white font-semibold py-2.5 rounded-lg mt-4">Close</button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h3 className="font-display font-semibold text-xl mb-1">Report this ad</h3>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm">
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="3" placeholder="Anything else we should know? (optional)" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button className="w-full bg-ember hover:bg-ember-dark text-white font-semibold py-2.5 rounded-lg">Submit report</button>
          </form>
        )}
      </div>
    </div>
  );
}
