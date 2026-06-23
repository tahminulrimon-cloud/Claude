import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM = `You write captions for a mother's photo album of her daughter Alysha (born 25 April 2022).
Write ONE short, warm, heartfelt caption — first person from the parent's loving perspective, or a tender third-person line.
12 words max. No quotation marks, no hashtags, no emoji. Sound natural and specific to what the photo shows, not generic.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Caption service is not configured.' });
  }

  const { photo, label, age, date, milestone, location } = req.body ?? {};
  if (!photo) return res.status(400).json({ error: 'A photo is required to generate a caption.' });

  const context = [
    label && `Title: ${label}`,
    age && `Age: ${age}`,
    date && `Date: ${date}`,
    milestone && `Milestone: ${milestone}`,
    location && `Location: ${location}`,
  ].filter(Boolean).join('\n');

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 120,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: photo } },
            {
              type: 'text',
              text: `Write a caption for this photo of Alysha.\n${context}`,
            },
          ],
        },
      ],
    });

    const caption = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join(' ')
      .trim()
      .replace(/^["']|["']$/g, '');

    if (!caption) return res.status(502).json({ error: 'Could not generate a caption. Please try again.' });

    return res.status(200).json({ caption });
  } catch (err) {
    const status = err?.status === 400 ? 400 : 502;
    return res.status(status).json({
      error: 'Could not generate a caption right now. Please try again.',
    });
  }
}
