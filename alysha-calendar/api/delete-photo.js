import { readDeletedIds, writeDeletedIds } from './_deletedStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ADMIN_DELETE_KEY || !process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Delete service is not configured.' });
  }

  const { id, key } = req.body ?? {};
  if (!id) return res.status(400).json({ error: 'A photo id is required.' });
  if (key !== process.env.ADMIN_DELETE_KEY) {
    return res.status(401).json({ error: 'Wrong admin key.' });
  }

  try {
    const ids = await readDeletedIds();
    if (!ids.includes(String(id))) {
      ids.push(String(id));
      await writeDeletedIds(ids);
    }
    return res.status(200).json({ ok: true, deleted: ids.length });
  } catch {
    return res.status(502).json({ error: 'Could not save the removal. Please try again.' });
  }
}
