import { useEffect, useState } from "react";
import "./LightboxModal.css";

export default function LightboxModal({ entry, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [entry, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!entry) return null;

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="lightbox-photo-area">
          {entry.photo && !imgError ? (
            <img
              src={entry.photo}
              alt={entry.label}
              className="lightbox-photo"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="lightbox-placeholder">
              <span>📷</span>
              <p>Photo coming soon</p>
            </div>
          )}
        </div>

        <div className="lightbox-info">
          <div className="lightbox-age-badge">{entry.age}</div>
          <h2 className="lightbox-label">{entry.label}</h2>
          <p className="lightbox-caption">{entry.caption}</p>
          <div className="lightbox-milestone">
            <span className="milestone-icon">⭐</span>
            <span>{entry.milestone}</span>
          </div>
          <div className="lightbox-date">{entry.date}</div>
        </div>

        <div className="lightbox-nav">
          <button
            className="nav-btn"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous"
          >
            ← Prev
          </button>
          <button
            className="nav-btn"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
