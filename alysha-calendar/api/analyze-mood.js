import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MOODS = ['happy', 'playful', 'curious', 'sleepy', 'peaceful', 'crying'];

const SYSTEM = `You analyze photos of a baby/toddler named Alysha and identify her dominant emotional state.
Reply with ONLY one word from this exact list: happy, playful, curious, sleepy, peaceful, crying.
- happy: smiling, laughing, bright eyes
- playful: active, animated, engaging with something
- curious: wide eyes, looking at something intently, exploring
- sleepy: eyes closed or droopy, resting, calm
- peaceful: calm, content, relaxed but awake
- crying: tears, distressed expression, upset
If Alysha is not clearly visible or the mood is ambiguous, pick the closest match.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Mood analysis service is not configured.' });
  }

  const { photo } = req.body ?? {};
  if (!photo) return res.status(400).json({ error: 'A photo URL is required.' });

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 10,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: photo } },
            { type: 'text', text: "What is Alysha's mood in this photo?" },
          ],
        },
      ],
    });

    const raw = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, '');

    const mood = MOODS.find((m) => raw.includes(m)) ?? 'happy';
    return res.status(200).json({ mood });
  } catch {
    return res.status(502).json({ error: 'Could not analyze mood right now.' });
  }
}
