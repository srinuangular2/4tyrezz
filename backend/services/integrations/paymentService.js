/**
 * Razorpay payment integration with safe stubs when keys are missing.
 */
const crypto = require('crypto');

const configured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

function stubOrder({ amount, currency = 'INR', receipt }) {
  const id = `order_stub_${Date.now()}`;
  return {
    id,
    entity: 'order',
    amount: Math.round(amount * 100),
    amount_paid: 0,
    amount_due: Math.round(amount * 100),
    currency,
    receipt: receipt || id,
    status: 'created',
    stub: true,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_stub',
  };
}

async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  if (!configured()) {
    console.log('[razorpay:stub] createOrder', { amount, currency, receipt });
    return stubOrder({ amount, currency, receipt });
  }

  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt,
      notes,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order failed: ${text}`);
  }
  const data = await res.json();
  return { ...data, stub: false, keyId: process.env.RAZORPAY_KEY_ID };
}

function verifyWebhookSignature(rawBody, signature) {
  if (!configured()) {
    return { valid: true, stub: true };
  }
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
    .update(rawBody)
    .digest('hex');
  return { valid: expected === signature, stub: false };
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!configured()) {
    return { valid: true, stub: true };
  }
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  return { valid: expected === signature, stub: false };
}

async function createRefund({ paymentId, amount }) {
  if (!configured()) {
    console.log('[razorpay:stub] refund', { paymentId, amount });
    return { id: `rfnd_stub_${Date.now()}`, status: 'processed', stub: true };
  }
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(amount != null ? { amount: Math.round(amount * 100) } : {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return { ...(await res.json()), stub: false };
}

module.exports = {
  configured,
  createOrder,
  verifyWebhookSignature,
  verifyPaymentSignature,
  createRefund,
};
