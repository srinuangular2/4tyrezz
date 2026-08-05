import axios from 'axios';

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_CLOUD_API_TOKEN;
const WHATSAPP_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

/**
 * Sends a pre-approved template message via Meta WhatsApp Cloud API
 */
export const sendWhatsAppTemplate = async ({ to, templateName, components }) => {
  try {
    const formattedPhone = to.replace(/\D/g, ''); // Ensure digits only (e.g. 919160415851)

    const response = await axios.post(
      WHATSAPP_URL,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('WhatsApp Service Error:', error.response?.data || error.message);
    throw error;
  }
};