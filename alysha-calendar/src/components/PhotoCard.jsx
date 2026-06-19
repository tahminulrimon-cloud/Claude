import { useState, useEffect, useRef } from "react";
import "./PhotoCard.css";

const CARD_GRADIENTS = [
  "linear-gradient(145deg, #fff0f4 0%, #ffdde8 100%)",
  "linear-gradient(145deg, #fff8ed 0%, #ffe9c0 100%)",
  "linear-gradient(145deg, #eefff5 0%, #ccf5e0 100%)",
  "linear-gradient(145deg, #eef3ff 0%, #d5e3ff 100%)",
  "linear-gradient(145deg, #f8eeff 0%, #e8d0ff 100%)",
  "linear-gradient(145deg, #fffbee 0%, #fff0b3 100%)",
  "linear-gradient(145deg, #edfbff 0%, #c8efff 100%)",
  "linear-gradient(145deg, #fff0eb 0%, #ffd5c4 100%)",
];

// Subtle alternating tilts for the polaroid cards
const TILTS = [-2.8, 1.6, -1.4, 2.4, -2.0, 1.2, -2.5, 1.8];

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

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const tilt     = TILTS[index % TILTS.length];
  const showPlaceholder = !entry.photo || imgError;

  return (
    <div
      ref={wrapperRef}
      className={`polaroid-wrapper ${revealed ? "revealed" : ""}`}
      style={{
        background: gradient,
        transitionDelay: `${(index % 4) * 0.09}s`,
      }}
    >
      <div
        className={`polaroid-card ${isActive ? "active" : ""}`}
        style={{ "--tilt": `${tilt}deg` }}
        onClick={() => onClick(entry)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick(entry)}
        aria-label={`${entry.label} — ${entry.caption}`}
      >
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
        </div>
      </div>
    </div>
  );
}
