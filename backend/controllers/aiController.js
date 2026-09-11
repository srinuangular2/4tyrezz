const axios = require('axios');

const TONES = {
  professional: 'Professional, trustworthy marketplace copy. Calm, precise, and buyer-reassuring.',
  sales: 'High-impact sales copy. Energetic, benefit-led, urgency without fake scarcity.',
  technical: 'Detailed and technical. Specs, maintenance, and condition first. Still readable.',
  punchy: 'Short and punchy. Tight sentences, scannable bullets, no fluff.',
};

const LANGUAGES = {
  en: 'Write in clear Indian English suitable for a national used-car marketplace.',
  hinglish: 'Write in natural Hinglish (English mixed with everyday Hindi), still professional and easy to read. Do not overdo slang.',
};

const REFINES = {
  regenerate: 'Write a fresh version with a different headline and phrasing. Keep the same facts.',
  highlights: 'Keep the draft but add a highlights section covering single-owner / clean history only if those facts are present in the specs. Do not invent accident-free claims.',
  price: 'Keep the draft but add a short price-value paragraph using only the given price. Do not invent discounts or market comparisons.',
};

function n(v) {
  const x = Number(String(v || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(x) ? x : null;
}

function ownerPhrase(count) {
  const x = n(count);
  if (!x) return '';
  if (x === 1) return '1st owner';
  if (x === 2) return '2nd owner';
  if (x === 3) return '3rd owner';
  return `${x} owners`;
}

function inr(price) {
  const x = n(price);
  if (!x) return '';
  return `₹${x.toLocaleString('en-IN')}`;
}

function km(v) {
  const x = n(v);
  if (x == null) return '';
  return `${x.toLocaleString('en-IN')} km`;
}

function cleanCopy(text) {
  return String(text || '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function facts(body = {}) {
  const area = body.area || body.location?.area || '';
  const city = body.city || body.location?.city || body.location || '';
  const features = Array.isArray(body.keyFeatures)
    ? body.keyFeatures.filter(Boolean)
    : String(body.keyFeatures || '')
        .split(/[,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
  return {
    brand: body.brand || '',
    model: body.model || '',
    variant: body.variant || '',
    year: body.year || '',
    kmDriven: body.kmDriven || body.km || '',
    fuel: body.fuelType || body.fuel || '',
    transmission: body.transmission || '',
    price: body.price || '',
    color: body.color || '',
    ownerCount: body.ownerCount || body.ownership || '',
    condition: body.condition || '',
    area,
    city,
    keyFeatures: features,
    tone: TONES[body.tone] ? body.tone : 'professional',
    language: LANGUAGES[body.language] ? body.language : 'en',
    refine: REFINES[body.refine] ? body.refine : '',
    currentDescription: body.currentDescription || body.description || '',
  };
}

function buildPrompt(f) {
  const loc = [f.area, f.city].filter(Boolean).join(', ') || 'India';
  const featureLine = f.keyFeatures.length ? f.keyFeatures.join(', ') : 'Not specified — do not invent features';
  const refineBlock = f.refine
    ? `\nRefinement instruction: ${REFINES[f.refine]}\nExisting draft to refine:\n${f.currentDescription || '(none)'}\n`
    : '';

  return `Act as an expert automotive copywriter for a premium car marketplace 4TYREZZ.
Write a compelling, well-structured vehicle description for a listing with the following specs:
- Vehicle: ${f.year || '—'} ${f.brand || '—'} ${f.model || '—'} ${f.variant || ''}
- Mileage: ${km(f.kmDriven) || '—'} | Fuel: ${f.fuel || '—'} | Transmission: ${f.transmission || '—'}
- Owner: ${ownerPhrase(f.ownerCount) || '—'} | Color: ${f.color || '—'} | Price: ${inr(f.price) || '—'}
- Location: ${loc}
- Condition notes: ${f.condition || 'Not specified'}
- Key Features/Highlights: ${featureLine}
- Desired Tone: ${TONES[f.tone]}
- Language: ${LANGUAGES[f.language]}
${refineBlock}
Structure the output cleanly:
1. Catchy Headline
2. Key Highlights (Bullet points)
3. Detailed Vehicle Condition & Maintenance Summary
4. Call to Action encouraging test drive bookings.
Do not include markdown headers like # or ##, use clean paragraphs and standard emojis suitable for web listings.
Only use facts supplied above. If a field is missing, skip it — never invent service history, accidents, RTO, or discounts.`;
}

function fallbackCopy(f) {
  const title = [f.year, f.brand, f.model, f.variant].filter(Boolean).join(' ') || 'This car';
  const loc = [f.area, f.city].filter(Boolean).join(', ');
  const bullets = [
    km(f.kmDriven) && `• ${km(f.kmDriven)} driven`,
    f.fuel && `• ${f.fuel} ${f.transmission ? `· ${f.transmission}` : ''}`.trim(),
    ownerPhrase(f.ownerCount) && `• ${ownerPhrase(f.ownerCount)}`,
    f.color && `• ${f.color} exterior`,
    inr(f.price) && `• Listed at ${inr(f.price)}`,
    loc && `• Available in ${loc}`,
    ...f.keyFeatures.slice(0, 6).map((feat) => `• ${feat}`),
  ].filter(Boolean);

  const punchy = f.tone === 'punchy';
  const hinglish = f.language === 'hinglish';
  const headline = punchy
    ? `${title} — ready for a test drive.`
    : hinglish
      ? `${title} — clean listing, ready to book karo.`
      : `${title} — inspected listing on 4TYREZZ.`;

  const body = f.condition
    ? `Condition notes from the seller: ${f.condition}. Verify on inspection and test drive.`
    : 'Condition details will be confirmed during inspection and your test drive. Ask the dealer for service records before you book.';

  const cta = hinglish
    ? 'Book a test drive on 4TYREZZ today — dealership visit ya home test drive, aap choose karo.'
    : 'Book a test drive on 4TYREZZ — at the dealership or request a home test drive.';

  const priceLine =
    f.refine === 'price' && inr(f.price)
      ? `\n\nPriced at ${inr(f.price)}. Compare with similar ${f.brand || ''} ${f.model || ''} listings and decide after a drive.`
      : '';

  return cleanCopy(
    `${headline}\n\nKey highlights:\n${bullets.join('\n') || '• Specs as listed on this page'}\n\n${body}${priceLine}\n\n${cta}`
  );
}

async function fromOpenAi(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: 'system', content: 'You write high-converting used-car listing copy for 4TYREZZ. Never invent facts.' },
        { role: 'user', content: prompt },
      ],
    },
    {
      timeout: 25000,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    }
  );
  return data?.choices?.[0]?.message?.content || '';
}

async function fromGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const { data } = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 25000 }
  );
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || '';
}

exports.generateDescription = async (req, res) => {
  const f = facts(req.body);
  if (!f.brand && !f.model) {
    return res.status(400).json({ message: 'Brand and model are required to generate a description' });
  }

  const prompt = buildPrompt(f);
  let text = '';
  let provider = 'template';

  try {
    if (process.env.OPENAI_API_KEY) {
      text = await fromOpenAi(prompt);
      provider = 'openai';
    } else if (process.env.GEMINI_API_KEY) {
      text = await fromGemini(prompt);
      provider = 'gemini';
    }
  } catch (err) {
    console.error('[ai] provider failed, using spec template', err.response?.data || err.message);
  }

  if (!text) {
    text = fallbackCopy(f);
    provider = 'template';
  }

  res.json({
    data: { description: cleanCopy(text), provider, tone: f.tone, language: f.language },
  });
};
