import "./GrowthTimeline.css";

const SEASON_MARKS = [
  { icon: "🌸", label: "Newborn",  startDay: 0    },
  { icon: "☀️", label: "Baby",     startDay: 91   },
  { icon: "🍂", label: "Toddler",  startDay: 366  },
  { icon: "✨", label: "Big Girl", startDay: 1096 },
];

function getSeason(days) {
  if (days <= 90)   return "spring";
  if (days <= 365)  return "summer";
  if (days <= 1095) return "autumn";
  return "winter";
}

export default function GrowthTimeline({ entries, activeId, onSelect }) {
  const n = entries.length - 1;

  const seasonMarks = SEASON_MARKS.map(m => {
    const idx = entries.findIndex(e => (e.age_in_days ?? 0) >= m.startDay);
    if (idx < 0) return null;
    return { ...m, pct: (idx / n) * 100 };
  }).filter(Boolean);

  return (
    <div className="growth-timeline">
      <div className="timeline-track">
        {seasonMarks.map(m => (
          <div key={m.label} className="season-mark" style={{ left: `${m.pct}%` }}>
            <span className="season-mark-icon">{m.icon}</span>
            <span className="season-mark-label">{m.label}</span>
          </div>
        ))}

        {entries.map((entry, i) => {
          const pct      = (i / n) * 100;
          const isActive = entry.id === activeId;
          const season   = getSeason(entry.age_in_days ?? 0);
          return (
            <div
              key={entry.id}
              className={`timeline-dot ${isActive ? "active" : ""}`}
              data-season={season}
              style={{ left: `${pct}%` }}
              onClick={() => onSelect(entry)}
              title={entry.label}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(entry)}
              aria-label={entry.label}
            >
              <div className="dot-inner" />
              <div className="dot-label">{entry.label}</div>
            </div>
          );
        })}
        <div className="timeline-line" />
      </div>
    </div>
  );
}
