import { useState, useEffect, useCallback } from 'react';
import LightboxModal from './LightboxModal';
import './AlbumView.css';

export default function AlbumView({ photos, title, onClose }) {
  const [activePhoto, setActivePhoto] = useState(null);

  const activeIndex = activePhoto ? photos.findIndex(p => p.id === activePhoto.id) : -1;

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActivePhoto(photos[activeIndex - 1]);
  }, [activeIndex, photos]);

  const goNext = useCallback(() => {
    if (activeIndex < photos.length - 1) setActivePhoto(photos[activeIndex + 1]);
  }, [activeIndex, photos]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (activePhoto) setActivePhoto(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePhoto, onClose]);

  const toLightboxEntry = (p) => ({
    id: p.id,
    photo: p.photo,
    label: p.label,
    caption: '',
    milestone: '',
    date: '',
    age: '',
  });

  return (
    <div className="album-view-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="album-view-panel">
        <div className="album-view-header">
          <div className="album-view-title-block">
            <span className="album-view-flag">🇸🇬</span>
            <h2 className="album-view-title">{title}</h2>
            <span className="album-view-count">{photos.length} photos</span>
          </div>
          <button className="album-view-close" onClick={onClose} aria-label="Close album">×</button>
        </div>

        <div className="album-view-grid">
          {photos.map((photo) => (
            <button
              key={photo.id}
              className="album-thumb"
              onClick={() => setActivePhoto(photo)}
              aria-label={photo.label}
            >
              <img
                src={photo.photo}
                alt={photo.label}
                className="album-thumb-img"
                loading="lazy"
              />
              <div className="album-thumb-label">{photo.label}</div>
            </button>
          ))}
        </div>
      </div>

      {activePhoto && (
        <LightboxModal
          entry={toLightboxEntry(activePhoto)}
          onClose={() => setActivePhoto(null)}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex < photos.length - 1}
        />
      )}
    </div>
  );
}
