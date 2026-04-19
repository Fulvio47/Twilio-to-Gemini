function xmlEscape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildTwiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(message)}</Message></Response>`;
}

function trimForSms(text, max = 480) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + '…';
}

async function askGemini(userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const systemPrompt =
    process.env.SYSTEM_PROMPT ||
    'You are a concise SMS assistant. Keep replies under 480 characters unless the user asks for more.';

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim() || 'Sorry, I could not generate a reply.';

  return trimForSms(text);
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const form = await request.formData();
      const incomingBody = String(form.get('Body') || '').trim();
      const from = String(form.get('From') || '').trim();

      if (!incomingBody) {
        return new Response(buildTwiml('I received an empty message.'), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        });
      }

      const prompt = `Sender: ${from || 'unknown'}\nMessage: ${incomingBody}`;
      const reply = await askGemini(prompt);

      return new Response(buildTwiml(reply), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    } catch (error) {
      const fallback = 'Sorry, something went wrong. Please try again.';
      return new Response(buildTwiml(fallback), {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
          'X-Error-Message': String(error?.message || 'unknown error'),
        },
      });
    }
  },
};
