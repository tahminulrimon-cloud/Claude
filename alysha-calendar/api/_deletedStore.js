// Shared helpers for the globally-deleted photo id list, stored as a small
// JSON blob in Vercel Blob storage (no SDK — plain REST calls).

const BLOB_API = 'https://blob.vercel-storage.com';
const PATHNAME = 'deleted-ids.json';

export async function readDeletedIds() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];
  try {
    const list = await fetch(`${BLOB_API}?prefix=${PATHNAME}&limit=1`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!list.ok) return [];
    const { blobs } = await list.json();
    if (!blobs?.length) return [];
    // Cache-bust: blob URLs are CDN-cached, which would resurrect photos
    // for a while after a delete.
    const dl = await fetch(`${blobs[0].url}?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${token}`, 'cache-control': 'no-cache' },
    });
    if (!dl.ok) return [];
    const ids = await dl.json();
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export async function writeDeletedIds(ids) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Blob storage is not configured');
  const res = await fetch(`${BLOB_API}/${PATHNAME}`, {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${token}`,
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-vercel-blob-access': 'private',
      'content-type': 'application/json',
    },
    body: JSON.stringify(ids),
  });
  if (!res.ok) throw new Error(`Blob write failed: ${res.status}`);
}
