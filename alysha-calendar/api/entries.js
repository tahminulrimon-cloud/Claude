import { timelineEntries } from '../src/data/timelineData.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const entries = timelineEntries.map((e, i) => ({
    id: String(e.id),
    label: e.label,
    age: e.age,
    date: e.date,
    photo: e.photo,
    caption: e.caption,
    milestone: e.milestone,
    age_in_days: e.ageInDays,
    rotation: e.rotation ?? 0,
    date_unknown: e.dateUnknown ?? false,
    sort_order: i,
    featured: 0,
    created_at: '2022-04-25T00:00:00.000Z',
    updated_at: '2022-04-25T00:00:00.000Z',
  }));

  res.status(200).json({ entries });
}
