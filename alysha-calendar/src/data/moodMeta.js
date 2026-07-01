export const MOOD_META = {
  happy:    { emoji: "😊", label: "Happy"   },
  playful:  { emoji: "😄", label: "Playful" },
  curious:  { emoji: "🤔", label: "Curious" },
  sleepy:   { emoji: "😴", label: "Sleepy"  },
  peaceful: { emoji: "😌", label: "Peaceful"},
  crying:   { emoji: "😢", label: "Crying"  },
};

function cacheKey(id) { return `alysha-mood-${id}`; }

export function getCachedMood(id) {
  try { return localStorage.getItem(cacheKey(id)) || null; } catch { return null; }
}

export function setCachedMood(id, mood) {
  try { localStorage.setItem(cacheKey(id), mood); } catch { /* ignore */ }
}
