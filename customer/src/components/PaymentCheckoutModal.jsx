import { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Loader2, QrCode, ShieldCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { formatPrice } from '../utils/format';

const MODES = [
  { id: 'upi', label: 'UPI / QR', hint: 'GPay, PhonePe, Paytm', icon: QrCode },
  { id: 'card', label: 'Card / Bank', hint: 'Cards and netbanking', icon: CreditCard },
  { id: 'bank', label: 'NEFT / RTGS', hint: 'Direct transfer', icon: Building2 },
];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay failed to load'));
    document.body.appendChild(script);
  });
}

function digits(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 9);
}

function presetsFor(price) {
  if (!price) return [5000, 10000, 25000, 50000];
  const rows = [
    ['Token', Math.min(5000, price)],
    ['10%', Math.max(1, Math.round(price * 0.1))],
    ['25%', Math.max(1, Math.round(price * 0.25))],
    ['Half', Math.max(1, Math.round(price * 0.5))],
    ['Full', price],
  ];
  const seen = new Set();
  return rows.filter(([, amount]) => {
    if (seen.has(amount)) return false;
    seen.add(amount);
    return true;
  });
}

export default function PaymentCheckoutModal({ vehicle, user, onClose, onPaid }) {
  const price = Math.max(0, Math.round(Number(vehicle?.price) || 0));
  const maxAmount = price || 20000000;
  const presets = useMemo(() => presetsFor(price), [price]);
  const [amountText, setAmountText] = useState(String(presets[0]?.[1] || 5000));
  const [mode, setMode] = useState('upi');
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState(null);

  const amount = Math.round(Number(digits(amountText)) || 0);
  const balance = price > 0 ? Math.max(0, price - amount) : 0;
  const purpose = price > 0 && amount >= price ? 'full' : amount <= 10000 ? 'token' : 'partial';

  useEffect(() => {
    let live = true;
    api.get('/payments/checkout-config', { params: { vehicleId: vehicle?.id } })
      .then((res) => { if (live) setConfig(res.data); })
      .catch(() => { if (live) setConfig({ accounts: [], upiVpa: '' }); });
    return () => { live = false; };
  }, [vehicle?.id]);

  useEffect(() => {
    if (!config?.upiVpa || amount < 1) return undefined;
    const timer = setTimeout(() => {
      api.get('/payments/checkout-config', { params: { vehicleId: vehicle?.id, amount } })
        .then((res) => {
          setConfig((prev) => ({ ...(prev || {}), qrDataUrl: res.data.qrDataUrl, upiLink: res.data.upiLink }));
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [amount, config?.upiVpa, vehicle?.id]);

  const appLink = (name) => {
    if (!config?.upiVpa || amount < 1) return '';
    const params = new URLSearchParams({
      pa: config.upiVpa,
      pn: '4TYREZZ',
      am: String(amount),
      cu: 'INR',
      tn: vehicle?.title || '4TYREZZ',
    });
    const query = params.toString();
    if (name === 'Google Pay') return `tez://upi/pay?${query}`;
    if (name === 'PhonePe') return `phonepe://pay?${query}`;
    if (name === 'Paytm') return `paytmmp://pay?${query}`;
    return `upi://pay?${query}`;
  };

  const setAmount = (next) => {
    const clamped = Math.min(maxAmount, Math.max(0, Math.round(Number(next) || 0)));
    setAmountText(String(clamped || ''));
  };

  const openGateway = async (method) => {
    if (amount < 1) return toast.error('Enter the amount you want to pay');
    if (amount > maxAmount) return toast.error('Amount is above the vehicle price');
    setBusy(true);
    try {
      const { data } = await api.post('/payments/create-order', {
        amount,
        vehicleId: vehicle?.id,
        purpose,
        method: method === 'card' ? 'card' : 'upi',
        notes: `${purpose} payment for ${vehicle?.title || 'vehicle'}`,
      });
      const payment = data.payment;
      if (payment.stub || !payment.keyId || String(payment.keyId).includes('stub')) {
        await api.post('/payments/verify-signature', { orderId: payment.orderId });
        toast.success('Payment recorded');
        onPaid?.(payment);
        onClose();
        return;
      }
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        name: '4TYREZZ',
        description: vehicle?.title || 'Vehicle payment',
        order_id: payment.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.mobile || '',
        },
        config: {
          display: {
            blocks: method === 'upi'
              ? { upi: { name: 'UPI', instruments: [{ method: 'upi' }] } }
              : {
                card: { name: 'Cards', instruments: [{ method: 'card' }] },
                netbanking: { name: 'Netbanking', instruments: [{ method: 'netbanking' }] },
              },
            sequence: method === 'upi' ? ['block.upi'] : ['block.card', 'block.netbanking'],
            preferences: { show_default_blocks: false },
          },
        },
        theme: { color: '#1853ff' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify-signature', response);
            toast.success('Payment successful');
            onPaid?.(payment);
            onClose();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment could not be verified');
          }
        },
      });
      checkout.on('payment.failed', () => toast.error('Payment was not completed'));
      checkout.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not start payment');
    } finally {
      setBusy(false);
    }
  };

  const submitTransfer = async () => {
    if (amount < 1) return toast.error('Enter the amount you want to pay');
    if (!config?.accounts?.length) return toast.error('Bank account details are not available yet');
    if (!receipt) return toast.error('Attach the transfer receipt');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('amount', String(amount));
      if (vehicle?.id) body.append('vehicleId', vehicle.id);
      if (reference) body.append('reference', reference);
      if (receipt) body.append('receipt', receipt);
      await api.post('/payments/bank-transfer', body);
      toast.success('Transfer submitted. 4tyrezz will confirm the credit.');
      onPaid?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit the transfer');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#041533]/55 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/50 bg-white/80 shadow-[0_24px_80px_rgba(4,21,51,0.28)] backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/75 backdrop-blur-xl px-5 pt-4 pb-3 border-b border-white/60">
          <div className="sm:hidden mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-brand">4TYREZZ CHECKOUT</p>
              <h2 className="text-lg font-semibold text-ink">Pay for this vehicle</h2>
              <p className="text-sm font-normal text-slate-500">{vehicle?.title}</p>
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-slate-500" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/70 p-3 text-center">
            <div>
              <p className="text-[11px] text-slate-500">Vehicle</p>
              <p className="text-sm font-semibold text-ink">{price ? formatPrice(price) : 'Custom'}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Paying now</p>
              <p className="text-sm font-semibold text-brand-dark">{amount ? formatPrice(amount) : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Balance</p>
              <p className="text-sm font-semibold text-ink">{price ? formatPrice(balance) : '—'}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500" htmlFor="pay-amount">Amount</label>
            <div className="mt-1 flex items-center rounded-2xl border border-white/70 bg-white/80 px-3">
              <span className="text-lg font-semibold text-slate-400">₹</span>
              <input
                id="pay-amount"
                inputMode="numeric"
                value={amount ? Number(amount).toLocaleString('en-IN') : ''}
                onChange={(event) => setAmount(digits(event.target.value))}
                className="w-full bg-transparent px-2 py-3 text-xl font-semibold text-ink outline-none"
              />
            </div>
            <input
              type="range"
              min={price ? Math.min(1000, price) : 1000}
              max={maxAmount}
              step={price > 500000 ? 5000 : 1000}
              value={Math.min(maxAmount, Math.max(price ? Math.min(1000, price) : 1000, amount || 0))}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-3 w-full accent-[#1853ff]"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setAmount(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${amount === value ? 'bg-[#1853ff] text-white' : 'bg-white/80 text-slate-600'}`}
                >
                  {label} · {formatPrice(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MODES.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`rounded-2xl border px-2 py-3 text-left ${active ? 'border-[#1853ff] bg-[#1853ff] text-white' : 'border-white/70 bg-white/70 text-ink'}`}
                >
                  <Icon size={16} />
                  <p className="mt-2 text-xs font-semibold leading-4">{item.label}</p>
                  <p className={`mt-0.5 text-[10px] ${active ? 'text-white/80' : 'text-slate-500'}`}>{item.hint}</p>
                </button>
              );
            })}
          </div>

          {mode === 'upi' && (
            <div className="rounded-2xl bg-white/75 p-4">
              {config?.qrDataUrl ? (
                <img src={config.qrDataUrl} alt="UPI QR code" className="mx-auto h-40 w-40 rounded-xl bg-white" />
              ) : (
                <div className="mx-auto grid h-40 w-40 place-items-center rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  UPI QR opens inside Razorpay checkout
                </div>
              )}
              {config?.upiVpa && <p className="mt-2 text-center text-xs text-slate-500">{config.upiVpa}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {['Google Pay', 'PhonePe', 'Paytm'].map((name) => (
                  appLink(name) ? (
                    <a key={name} href={appLink(name)} className="rounded-xl bg-slate-50 py-2 text-center text-[11px] font-semibold text-ink">
                      {name}
                    </a>
                  ) : (
                    <button key={name} type="button" onClick={() => openGateway('upi')} className="rounded-xl bg-slate-50 py-2 text-center text-[11px] font-semibold text-ink">
                      {name}
                    </button>
                  )
                ))}
              </div>
              <button type="button" disabled={busy} onClick={() => openGateway('upi')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy && <Loader2 size={16} className="animate-spin" />}
                Pay {amount ? formatPrice(amount) : ''} with UPI
              </button>
            </div>
          )}

          {mode === 'card' && (
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="text-sm text-slate-600">Cards, netbanking and wallets open in Razorpay’s secure checkout. 4tyrezz never stores the card number.</p>
              <button type="button" disabled={busy} onClick={() => openGateway('card')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy && <Loader2 size={16} className="animate-spin" />}
                Continue to Razorpay
              </button>
            </div>
          )}

          {mode === 'bank' && (
            <div className="space-y-3 rounded-2xl bg-white/75 p-4">
              {config?.accounts?.length ? config.accounts.map((account) => (
                <div key={account.accountNumber} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-ink">{account.accountName}</p>
                  <p className="text-slate-500">{account.bankName} · {account.accountType}</p>
                  <button type="button" onClick={() => copy(account.accountNumber)} className="mt-2 block text-left font-semibold text-ink">
                    A/c {account.accountNumber}
                  </button>
                  <button type="button" onClick={() => copy(account.ifsc)} className="text-slate-600">IFSC {account.ifsc}</button>
                  {account.branch && <p className="text-xs text-slate-500">{account.branch}</p>}
                </div>
              )) : (
                <p className="text-sm text-slate-600">Verified company account details are shared by 4tyrezz before a high-value transfer. Call +91 79939 80559 to collect them.</p>
              )}
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value.slice(0, 40))}
                placeholder="UTR / reference number"
                className="w-full rounded-xl border border-white/70 bg-white px-3 py-2.5 text-sm outline-none"
              />
              <label className="block rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
                {receipt ? receipt.name : 'Attach payment receipt (JPG, PNG or PDF)'}
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] || null)} />
              </label>
              <button type="button" disabled={busy} onClick={submitTransfer} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy && <Loader2 size={16} className="animate-spin" />}
                Submit transfer receipt
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl bg-[#EAF2FF] px-3 py-2 text-xs text-slate-600">
            <ShieldCheck size={16} className="shrink-0 text-[#1853ff]" />
            Secured by Razorpay. Signature-checked before a payment is marked successful.
          </div>
        </div>
      </div>
    </div>
  );
}
