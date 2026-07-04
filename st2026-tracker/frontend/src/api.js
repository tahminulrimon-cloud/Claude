const API_BASE = '/api'

export async function fetchTimeline() {
  const res = await fetch(`${API_BASE}/timeline`)
  if (!res.ok) throw new Error('Failed to load timeline')
  return res.json()
}

export async function updateItem(id, patch) {
  const res = await fetch(`${API_BASE}/timeline/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update item')
  return res.json()
}
