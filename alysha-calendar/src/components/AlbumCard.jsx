import "./AlbumCard.css";

export default function AlbumCard({ name, location, photoCount, coverPhoto, onClick }) {
  const hasPhoto = Boolean(coverPhoto);

  return (
    <div className={`album-card${hasPhoto ? " album-card--photo" : ""}`} onClick={onClick}>
      {hasPhoto ? (
        <img className="album-card__cover" src={coverPhoto} alt={name} />
      ) : (
        <div className="album-card__gradient">
          <span className="album-card__emoji album-card__emoji--tl">🌆</span>
          <span className="album-card__emoji album-card__emoji--tr">🦁</span>
          <span className="album-card__emoji album-card__emoji--bl">✈️</span>
          <span className="album-card__emoji album-card__emoji--br">🌊</span>
        </div>
      )}

      <div className="album-card__label">
        <p className="album-card__name">{name}</p>
        <p className="album-card__location">📍 {location} 🇸🇬</p>
        <p className="album-card__count">
          {photoCount === 0 ? "0 photos · Coming soon" : `${photoCount} photos`}
        </p>
      </div>
    </div>
  );
}
