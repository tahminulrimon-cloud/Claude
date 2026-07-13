import { useRef } from "react";
import "./PhotoStrip.css";

const STRIP_TILTS = [-2.5, 1.8, -1.6, 2.2, -2.0, 1.4, -1.9, 2.6];

export default function PhotoStrip({ entries, onOpenLightbox }) {
  const trackRef = useRef(null);

  if (!entries || entries.length === 0) return null;

  // Duplicate list for seamless loop
  const items = [...entries, ...entries];

  return (
    <div className="photo-strip-outer">
      <div className="photo-strip-track" ref={trackRef}>
        {items.map((entry, i) => {
          const tilt = STRIP_TILTS[i % STRIP_TILTS.length];
          const showImg = !!entry.photo;
          return (
            <button
              key={`${entry.id}-${i}`}
              className="strip-card"
              style={{ "--strip-tilt": `${tilt}deg` }}
              onClick={() => onOpenLightbox(entry)}
              aria-label={entry.label}
            >
              <div className="strip-photo-area">
                {showImg ? (
                  <img
                    src={entry.photo}
                    alt={entry.label}
                    className="strip-photo"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="strip-placeholder">📷</div>
                )}
              </div>
              <div className="strip-label">{entry.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
