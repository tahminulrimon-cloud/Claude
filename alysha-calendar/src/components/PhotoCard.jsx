import { useState, useEffect, useRef, useCallback } from "react";
import "./PhotoCard.css";

const SEASON_GRADIENTS = {
  spring: [
    "linear-gradient(145deg, #fff0f4 0%, #ffdde8 100%)",
    "linear-gradient(145deg, #fff4f7 0%, #ffe5ef 100%)",
  ],
  summer: [
    "linear-gradient(145deg, #eefff5 0%, #c8f5e0 100%)",
    "linear-gradient(145deg, #f2fff7 0%, #d5f5e8 100%)",
  ],
  autumn: [
    "linear-gradient(145deg, #fff8ed 0%, #ffe9c0 100%)",
    "linear-gradient(145deg, #fffbf2 0%, #ffecd0 100%)",
  ],
  winter: [
    "linear-gradient(145deg, #eef3ff 0%, #d5e3ff 100%)",
    "linear-gradient(145deg, #f2f5ff 0%, #dde8ff 100%)",
  ],
};

const TILTS = [-2.8, 1.6, -1.4, 2.4, -2.0, 1.2, -2.5, 1.8];

function getSeason(days) {
  if (days <= 90)   return "spring";
  if (days <= 365)  return "summer";
  if (days <= 1095) return "autumn";
  return "winter";
}

export default function PhotoCard({ entry, index, isActive, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [revealed, setRevealed]  = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRevealed(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top)  / rect.height;
    card.style.setProperty('--rx', `${(relY - 0.5) * -18}deg`);
    card.style.setProperty('--ry', `${(relX - 0.5) *  18}deg`);
    card.style.setProperty('--mx', `${relX * 100}%`);
    card.style.setProperty('--my', `${relY * 100}%`);
  }, []);

  const handleMouseLeave = useCallback((e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }, []);

  const season   = getSeason(entry.age_in_days ?? 0);
  const gradient = SEASON_GRADIENTS[season][index % 2];
  const tilt     = TILTS[index % TILTS.length];
  const showPlaceholder = !entry.photo || imgError;

  return (
    <div
      ref={wrapperRef}
      className={`polaroid-wrapper ${revealed ? "revealed" : ""}`}
      data-season={season}
      style={{
        background: gradient,
        transitionDelay: `${(index % 4) * 0.09}s`,
      }}
    >
      <div
        className={`polaroid-card ${isActive ? "active" : ""}`}
        style={{ "--tilt": `${tilt}deg` }}
        onClick={() => onClick(entry)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick(entry)}
        aria-label={`${entry.label} — ${entry.caption}`}
      >
        <div className="card-shine" />

        {/* Photo area */}
        <div className="polaroid-photo-area">
          <div className="age-watermark">{entry.age}</div>

          {showPlaceholder ? (
            <div className="photo-placeholder">📷</div>
          ) : (
            <img
              src={entry.photo}
              alt={entry.label}
              className="card-photo"
              style={entry.rotation ? { transform: `rotate(${entry.rotation}deg)` } : undefined}
              onError={() => setImgError(true)}
            />
          )}

          <div className="photo-overlay">
            <span className="overlay-milestone">{entry.milestone}</span>
          </div>
        </div>

        {/* Polaroid bottom strip */}
        <div className="polaroid-strip">
          <h3 className="polaroid-label">{entry.label}</h3>
          <p className="polaroid-caption">{entry.caption}</p>
          <div className="polaroid-date">{entry.date}</div>
          {entry.location && (
            <div className="polaroid-location">
              <span className="location-pin">📍</span>
              <span className="location-text">{entry.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
