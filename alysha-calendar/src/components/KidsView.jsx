import { useState, useEffect, useRef, useCallback } from "react";
import "./KidsView.css";

const EMOJIS = ["🌸", "⭐", "💕", "🌈", "✨", "🦋", "💫", "🎀", "🌟", "💖", "🌺", "🎠"];

function Particle({ emoji, style }) {
  return <div className="kids-particle" style={style}>{emoji}</div>;
}

export default function KidsView({ entries, onExit }) {
  const [idx, setIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [imgError, setImgError] = useState(false);
  const touchStartX = useRef(null);
  const timerRef = useRef(null);

  const total = entries.length;
  const entry = entries[idx] ?? null;

  const goNext = useCallback(() => {
    setIdx(i => (i + 1) % total);
    setImgError(false);
  }, [total]);

  const goPrev = useCallback(() => {
    setIdx(i => (i - 1 + total) % total);
    setImgError(false);
  }, [total]);

  useEffect(() => {
    if (!autoPlay) { clearTimeout(timerRef.current); return; }
    timerRef.current = setTimeout(goNext, 3000);
    return () => clearTimeout(timerRef.current);
  }, [idx, autoPlay, goNext]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onExit]);

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  }

  const particles = EMOJIS.map((emoji, i) => ({
    emoji,
    style: {
      left: `${(i / EMOJIS.length) * 95 + 2}%`,
      animationDelay: `${(i * 0.38).toFixed(2)}s`,
      fontSize: `${22 + (i % 3) * 8}px`,
    },
  }));

  if (!entry) return null;

  const ageLabel = entry.age || "";

  return (
    <div
      className="kids-overlay"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Floating particles */}
      {particles.map((p, i) => <Particle key={i} emoji={p.emoji} style={p.style} />)}

      {/* Exit button */}
      <button className="kids-exit-btn" onClick={onExit} aria-label="Exit Alysha's View">
        ✕ Mummy's View
      </button>

      {/* Big name */}
      <div className="kids-name-block">
        <h1 className="kids-name">Alysha! 🌸</h1>
        {ageLabel && <div className="kids-age-badge">{ageLabel}</div>}
      </div>

      {/* Photo */}
      <div className="kids-photo-wrap" key={idx}>
        {entry.photo && !imgError ? (
          <img
            className="kids-photo"
            src={entry.photo}
            alt={entry.label}
            style={entry.rotation ? { transform: `rotate(${entry.rotation}deg)` } : undefined}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="kids-photo-placeholder">🌸</div>
        )}
        <div className="kids-photo-label">{entry.label}</div>
      </div>

      {/* Nav */}
      <div className="kids-nav">
        <button className="kids-nav-btn" onClick={goPrev} aria-label="Previous">◀</button>

        <div className="kids-counter-block">
          <div className="kids-counter">{idx + 1} ✨ of {total}</div>
          <button
            className={`kids-autoplay-btn ${autoPlay ? "on" : "off"}`}
            onClick={() => setAutoPlay(a => !a)}
          >
            {autoPlay ? "⏸ Pause" : "▶ Play"}
          </button>
        </div>

        <button className="kids-nav-btn" onClick={goNext} aria-label="Next">▶</button>
      </div>
    </div>
  );
}
