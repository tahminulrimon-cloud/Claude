import { useState, useEffect, useCallback, useRef } from 'react';
import './SlideshowMode.css';

export default function SlideshowMode({ entries, onExit }) {
  const photos = entries.filter(e => e.photo);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const timerRef = useRef(null);

  const current = photos[index] || {};
  const next = photos[(index + 1) % photos.length] || {};

  const advance = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      setIndex(i => (i + 1) % photos.length);
      setFadingOut(false);
    }, 800);
  }, [photos.length]);

  useEffect(() => {
    if (paused || photos.length <= 1) return;
    timerRef.current = setInterval(advance, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, advance, photos.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onExit();
      if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); }
      if (e.key === 'ArrowRight') advance();
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, advance, photos.length]);

  if (photos.length === 0) return null;

  const progress = ((index + 1) / photos.length) * 100;

  return (
    <div className="slideshow-backdrop">
      {/* Blurred background layer */}
      <div
        className="slideshow-bg"
        style={{ backgroundImage: `url("${current.photo}")` }}
      />

      {/* Preload next image */}
      <img src={next.photo} alt="" className="slideshow-preload" />

      {/* Main photo */}
      <div className={`slideshow-photo-wrap ${fadingOut ? 'fading' : ''}`}>
        <img
          src={current.photo}
          alt={current.label}
          className="slideshow-photo"
        />
      </div>

      {/* Bottom info bar */}
      <div className="slideshow-info">
        <div className="slideshow-caption">
          <span className="slideshow-label">{current.label}</span>
          {current.date && <span className="slideshow-date">{current.date}</span>}
        </div>
        <div className="slideshow-counter">
          {index + 1} / {photos.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="slideshow-progress">
        <div
          className="slideshow-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="slideshow-controls">
        <button className="ss-btn" onClick={() => setIndex(i => (i - 1 + photos.length) % photos.length)} aria-label="Previous">
          ‹
        </button>
        <button className="ss-btn ss-play" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play' : 'Pause'}>
          {paused ? '▶' : '❚❚'}
        </button>
        <button className="ss-btn" onClick={advance} aria-label="Next">
          ›
        </button>
      </div>

      <button className="slideshow-close" onClick={onExit} aria-label="Exit slideshow">✕</button>
    </div>
  );
}
