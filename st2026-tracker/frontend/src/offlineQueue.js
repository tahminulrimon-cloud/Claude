const STORAGE_KEY = 'st2026-pending-writes'

// Pending writes are keyed by item id, so multiple offline toggles of the
// same item coalesce into a single patch instead of piling up.
export function getPending() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

function savePending(pending) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
}

export function queueWrite(id, patch) {
  const pending = getPending()
  pending[id] = { ...pending[id], ...patch }
  savePending(pending)
}

export function clearWrite(id) {
  const pending = getPending()
  delete pending[id]
  savePending(pending)
}

export function pendingCount() {
  return Object.keys(getPending()).length
}

// Replays queued writes through updateFn(id, patch). Entries that fail again
// (still offline, or backend unreachable) stay queued for the next attempt.
export async function flushPending(updateFn) {
  const pending = getPending()
  for (const [id, patch] of Object.entries(pending)) {
    try {
      await updateFn(id, patch)
      clearWrite(id)
    } catch {
      // leave it queued, try again on the next flush
    }
  }
  return pendingCount()
}
