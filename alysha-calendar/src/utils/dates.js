// Display helpers for entry dates.
// Timeline dates are estimated from camera-roll position, so entries carry
// date_approx: true. Approximate dates render at month precision with a "≈"
// marker instead of a fabricated exact day.

export function displayDate(entry) {
  if (!entry?.date || entry.date_unknown) return "";
  if (!entry.date_approx) return entry.date;
  const parts = entry.date.split(" ");
  // "30 April 2022" → "≈ April 2022"; anything else gets the marker only
  return parts.length === 3 ? `≈ ${parts[1]} ${parts[2]}` : `≈ ${entry.date}`;
}

export function displayAge(entry) {
  if (!entry?.age) return "";
  return entry.date_approx ? `≈ ${entry.age}` : entry.age;
}
