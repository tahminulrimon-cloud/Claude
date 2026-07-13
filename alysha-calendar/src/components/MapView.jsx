import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import LightboxModal from './LightboxModal';
import { SINGAPORE_PLACES, SINGAPORE_CENTER } from '../data/singaporePlaces';
import './MapView.css';

export default function MapView({ photos, title, onClose }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const [activePlace, setActivePlace] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const noLeaflet = typeof window !== 'undefined' && !window.L;

  // Group photos by landmark label
  const byPlace = useMemo(() => {
    const map = {};
    for (const p of photos) {
      if (!SINGAPORE_PLACES[p.label]) continue;
      (map[p.label] ??= []).push(p);
    }
    return map;
  }, [photos]);

  const placePhotos = useMemo(
    () => (activePlace ? (byPlace[activePlace] || []) : []),
    [activePlace, byPlace]
  );

  const activeIndex = activePhoto
    ? placePhotos.findIndex(p => p.id === activePhoto.id)
    : -1;

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActivePhoto(placePhotos[activeIndex - 1]);
  }, [activeIndex, placePhotos]);

  const goNext = useCallback(() => {
    if (activeIndex >= 0 && activeIndex < placePhotos.length - 1)
      setActivePhoto(placePhotos[activeIndex + 1]);
  }, [activeIndex, placePhotos]);

  // Initialise Leaflet map
  useEffect(() => {
    const L = window.L;
    if (!L) return;
    if (mapRef.current || !mapElRef.current) return;

    const map = L.map(mapElRef.current, {
      center: [SINGAPORE_CENTER.lat, SINGAPORE_CENTER.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const markers = [];
    Object.entries(byPlace).forEach(([label, list]) => {
      const { lat, lng } = SINGAPORE_PLACES[label];
      const icon = L.divIcon({
        className: 'map-pin-wrap',
        html: `<div class="map-pin"><span class="map-pin-count">${list.length}</span></div>
               <div class="map-pin-label">${label}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on('click', () => setActivePlace(label));
      markers.push(marker);
    });

    if (markers.length) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.18));
    }

    // Map needs a size recalculation after the overlay animates in
    setTimeout(() => map.invalidateSize(), 200);

    return () => { map.remove(); mapRef.current = null; };
  }, [byPlace]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (activePhoto) setActivePhoto(null);
        else if (activePlace) setActivePlace(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePhoto, activePlace, onClose]);

  const toLightboxEntry = (p) => ({
    id: p.id, photo: p.photo, label: p.label,
    caption: '', milestone: p.label, date: '', age: '',
  });

  return (
    <div className="mapview-backdrop">
      <div className="mapview-header">
        <div className="mapview-title-block">
          <span className="mapview-flag">🗺️</span>
          <h2 className="mapview-title">{title}</h2>
          <span className="mapview-count">{Object.keys(byPlace).length} places</span>
        </div>
        <button className="mapview-close" onClick={onClose} aria-label="Close map">×</button>
      </div>

      {noLeaflet ? (
        <div className="mapview-fallback">
          <p>Map couldn’t load. Please check your connection and try again.</p>
        </div>
      ) : (
        <div className="mapview-map" ref={mapElRef} />
      )}

      {/* Landmark photo panel */}
      {activePlace && (
        <div className="map-place-panel">
          <div className="map-place-header">
            <div>
              <h3 className="map-place-name">{activePlace}</h3>
              <span className="map-place-count">{placePhotos.length} photos</span>
            </div>
            <button className="map-place-close" onClick={() => setActivePlace(null)} aria-label="Close">×</button>
          </div>
          <div className="map-place-grid">
            {placePhotos.map((p) => (
              <button
                key={p.id}
                className="map-place-thumb"
                onClick={() => setActivePhoto(p)}
                aria-label={p.label}
              >
                <img src={p.photo} alt={p.label} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {activePhoto && (
        <LightboxModal
          entry={toLightboxEntry(activePhoto)}
          onClose={() => setActivePhoto(null)}
          onPrev={goPrev}
          onNext={goNext}
          hasPrev={activeIndex > 0}
          hasNext={activeIndex >= 0 && activeIndex < placePhotos.length - 1}
        />
      )}
    </div>
  );
}
