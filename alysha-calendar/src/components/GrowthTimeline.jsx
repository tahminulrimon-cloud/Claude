import "./GrowthTimeline.css";

export default function GrowthTimeline({ entries, activeId, onSelect }) {
  return (
    <div className="growth-timeline">
      <div className="timeline-track">
        {entries.map((entry, i) => {
          const pct = (i / (entries.length - 1)) * 100;
          const isActive = entry.id === activeId;
          return (
            <div
              key={entry.id}
              className={`timeline-dot ${isActive ? "active" : ""}`}
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
