import { useState } from "react";
import "./PhotoCard.css";

const PLACEHOLDER_COLORS = [
  "#f8c8d4", "#fce4b3", "#c8e6c9", "#b3d9f5",
  "#e1c8f5", "#f5c8c8", "#c8f5e1", "#f5e6c8",
  "#c8d9f5", "#f5c8e6", "#d9f5c8", "#c8f5f5",
];

export default function PhotoCard({ entry, index, isActive, onClick }) {
  const [imgError, setImgError] = useState(false);
  const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];

  const showPlaceholder = !entry.photo || imgError;

  return (
    <div
      className={`photo-card ${isActive ? "active" : ""}`}
      onClick={() => onClick(entry)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(entry)}
      aria-label={`${entry.label} — ${entry.caption}`}
    >
      <div className="card-number">{String(index + 1).padStart(2, "0")}</div>

      <div className="card-photo-wrapper">
        {showPlaceholder ? (
          <div className="photo-placeholder" style={{ background: color }}>
            <span className="placeholder-icon">📷</span>
            <span className="placeholder-text">Add photo</span>
          </div>
        ) : (
          <img
            src={entry.photo}
            alt={entry.label}
            className="card-photo"
            onError={() => setImgError(true)}
          />
        )}
        <div className="card-overlay">
          <span className="overlay-milestone">{entry.milestone}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="card-age-badge">{entry.age}</div>
        <h3 className="card-label">{entry.label}</h3>
        <p className="card-caption">{entry.caption}</p>
        <div className="card-date">{entry.date}</div>
      </div>
    </div>
  );
}
