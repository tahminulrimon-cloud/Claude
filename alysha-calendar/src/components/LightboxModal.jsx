import { useEffect, useState } from "react";
import { generateCaption } from "../services/api";
import MoodBadge from "./MoodBadge";
import "./LightboxModal.css";

export default function LightboxModal({ entry, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [imgError, setImgError] = useState(false);
  const [caption, setCaption] = useState(entry?.caption ?? "");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);

  const handleGenerate = async () => {
    if (!entry?.photo || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const next = await generateCaption(entry);
      if (next) setCaption(next);
    } catch (err) {
      setAiError(
        err?.response?.data?.error ?? "Could not generate a caption. Please try again."
      );
    } finally {
      setAiBusy(false);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const entryId = entry?.id;
  useEffect(() => {
    Promise.resolve().then(() => {
      setImgError(false);
      setCaption(entry?.caption ?? "");
      setAiError(null);
      setAiBusy(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  if (!entry) return null;

  return (
    <div
      className="lightbox-backdrop"
      style={entry.photo && !imgError ? { '--photo': `url("${entry.photo}")` } : {}}
      onClick={onClose}
    >
      <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="lightbox-body">
          {/* ── Large photo column ── */}
          <div className="lightbox-photo-area" data-age={entry.age}>
            {entry.photo && !imgError ? (
              <img
                src={entry.photo}
                alt={entry.label}
                className="lightbox-photo"
                style={entry.rotation ? { transform: `rotate(${entry.rotation}deg)` } : undefined}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="lightbox-placeholder">
                <span>📷</span>
                <p>Photo coming soon</p>
              </div>
            )}
          </div>

          {/* ── Info + nav column ── */}
          <div className="lightbox-side">
            <div className="lightbox-info">
              <div className="lightbox-age-row">
                <div className="lightbox-age-badge">{entry.age}</div>
                {entry.photo && !imgError && (
                  <MoodBadge entry={entry} size="md" />
                )}
              </div>
              <h2 className="lightbox-label">{entry.label}</h2>
              <p className={`lightbox-caption${aiBusy ? " ai-loading" : ""}`}>
                {caption || <span className="caption-empty">No caption yet…</span>}
              </p>
              <div className="lightbox-ai-row">
                <button
                  className="ai-caption-btn"
                  onClick={handleGenerate}
                  disabled={aiBusy || !entry.photo || imgError}
                  title={
                    entry.photo
                      ? "Generate a caption with Claude vision"
                      : "A photo is needed to generate a caption"
                  }
                >
                  {aiBusy ? (
                    <><span className="ai-spinner" /> Writing…</>
                  ) : caption ? (
                    <>✨ Regenerate caption</>
                  ) : (
                    <>✨ Generate caption</>
                  )}
                </button>
                {aiError && <span className="ai-caption-error">{aiError}</span>}
              </div>
              <div className="lightbox-milestone">
                <span className="milestone-icon">⭐</span>
                <span>{entry.milestone}</span>
              </div>
              {!entry.date_unknown && <div className="lightbox-date">{entry.date}</div>}
              {entry.location && (
                <div className="lightbox-location">
                  <span className="location-pin">📍</span>
                  <span>{entry.location}</span>
                </div>
              )}
            </div>

            <div className="lightbox-nav">
              <button className="nav-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous">← Prev</button>
              <button className="nav-btn" onClick={onNext} disabled={!hasNext} aria-label="Next">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
