/**
 * Msg91 SMS OTP + WhatsApp delivery.
 * Real calls fire whenever MSG91_AUTH_KEY is set.
 * Without a key, delivery is logged only — the OTP is never returned to clients.
 */
const axios = require('axios');

const AUTH_KEY = () => process.env.MSG91_AUTH_KEY;
const configured = () => Boolean(AUTH_KEY());

const headers = () => ({
  authkey: AUTH_KEY(),
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

function tenDigit(mobile) {
  return String(mobile || '').replace(/\D/g, '').slice(-10);
}

async function sendSmsOtp({ mobile, otp, templateId }) {
  const phone = tenDigit(mobile);
  const res = await axios.post(
    'https://control.msg91.com/api/v5/otp',
    {
      template_id: templateId || process.env.MSG91_OTP_TEMPLATE_ID,
      mobile: `91${phone}`,
      otp: String(otp),
      otp_expiry: 5,
    },
    { headers: headers(), timeout: 12000 }
  );
  return res.data;
}

async function sendWhatsAppTemplate({ mobile, templateName, bodyValues = [] }) {
  const phone = tenDigit(mobile);
  if (!configured() || !process.env.MSG91_WHATSAPP_NUMBER) {
    console.log(`[msg91:stub] WhatsApp ${templateName || 'generic'} → ${phone}`, bodyValues);
    return { success: true, stub: true, provider: 'msg91-stub' };
  }

  try {
    const res = await axios.post(
      'https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/',
      {
        integrated_number: process.env.MSG91_WHATSAPP_NUMBER,
        content_type: 'template',
        payload: {
          to: `91${phone}`,
          type: 'template',
          template: {
            name: templateName || process.env.MSG91_WHATSAPP_TEMPLATE || 'general_alert',
            language: { code: 'en' },
            components: bodyValues.length
              ? [{ type: 'body', parameters: bodyValues.map((t) => ({ type: 'text', text: String(t) })) }]
              : [],
          },
        },
      },
      { headers: headers(), timeout: 12000 }
    );
    return { success: true, stub: false, data: res.data };
  } catch (err) {
    console.error('[msg91] WhatsApp failed:', err.response?.data || err.message);
    return { success: false, error: err.message, stub: false };
  }
}

/**
 * Deliver a 4-digit OTP over SMS (and WhatsApp when configured).
 * Never throws to the caller — auth still stores a hashed code locally.
 */
async function sendOTP({ mobile, otp, templateId }) {
  const phone = tenDigit(mobile);
  const { isOtpDevelopment } = require('../../utils/otpMode');
  if (isOtpDevelopment() || !configured()) {
    return { success: true, stub: true, provider: isOtpDevelopment() ? 'dev-otp' : 'msg91-stub', channels: ['stub'] };
  }

  const channels = [];
  try {
    await sendSmsOtp({ mobile: phone, otp, templateId });
    channels.push('sms');
  } catch (err) {
    console.error('[msg91] sendOTP SMS failed:', err.response?.data || err.message);
    return { success: false, stub: false, error: err.message, channels };
  }

  const waTemplate = process.env.MSG91_WHATSAPP_OTP_TEMPLATE || process.env.MSG91_WHATSAPP_TEMPLATE;
  if (process.env.MSG91_WHATSAPP_NUMBER && waTemplate) {
    const wa = await sendWhatsAppTemplate({
      mobile: phone,
      templateName: waTemplate,
      bodyValues: [otp],
    });
    if (wa.success && !wa.stub) channels.push('whatsapp');
  }

  return { success: true, stub: false, provider: 'msg91', channels };
}

async function notifyWhatsApp({ mobile, templateName, bodyValues = [] }) {
  return sendWhatsAppTemplate({ mobile, templateName, bodyValues });
}

module.exports = {
  sendOTP,
  sendWhatsAppTemplate,
  notifyWhatsApp,
  configured,
};
