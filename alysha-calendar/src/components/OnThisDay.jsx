import { useMemo, useState } from "react";
import "./OnThisDay.css";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseEntryDate(dateStr) {
  const parts = dateStr.split(" ");
  const day   = parseInt(parts[0], 10);
  const month = MONTH_NAMES.indexOf(parts[1]);
  const year  = parseInt(parts[2], 10);
  return { day, month, year };
}

export default function OnThisDay({ entries, onOpen }) {
  const [imgError, setImgError] = useState(false);

  const memory = useMemo(() => {
    const now   = new Date();
    const today = { day: now.getDate(), month: now.getMonth() };

    const matches = entries.filter(e => {
      const { day, month, year } = parseEntryDate(e.date);
      return day === today.day && month === today.month && year < now.getFullYear();
    });

    if (matches.length === 0) return null;
    // Pick deterministically by date so it doesn't re-roll on re-render
    return matches[now.getDate() % matches.length];
  }, [entries]);

  if (!memory) return null;

  const { year } = parseEntryDate(memory.date);
  const yearsAgo = new Date().getFullYear() - year;

  return (
    <div className="otd-banner" onClick={() => onOpen(memory)} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onOpen(memory)}>
      <div className="otd-left">
        <div className="otd-icon">🗓️</div>
        <div className="otd-text">
          <span className="otd-eyebrow">On This Day</span>
          <span className="otd-years">{yearsAgo} {yearsAgo === 1 ? "year" : "years"} ago</span>
          <span className="otd-label">{memory.label}</span>
          <span className="otd-caption">{memory.caption}</span>
        </div>
      </div>

      <div className="otd-photo-wrap">
        {memory.photo && !imgError ? (
          <img
            src={memory.photo}
            alt={memory.label}
            className="otd-photo"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="otd-photo-placeholder">📷</div>
        )}
        <div className="otd-photo-shine" />
      </div>

      <div className="otd-cta">View →</div>
    </div>
  );
}
