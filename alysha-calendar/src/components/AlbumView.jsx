import { useState, useEffect } from 'react';
import { getPhotosByAlbum, addPhoto, deletePhoto } from '../services/db.js';
import './AlbumView.css';

export default function AlbumView({ country, album, onBack }) {
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  useEffect(() => {
    getPhotosByAlbum(album.id).then(setPhotos);
  }, [album.id]);

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    for (let file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoData = {
          albumId: album.id,
          countryId: country.id,
          image: event.target.result,
          caption: '',
          uploadedAt: new Date().toISOString(),
        };

        const photoId = await addPhoto(photoData);
        const newPhoto = { id: photoId, ...photoData };
        setPhotos([...photos, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    await deletePhoto(photoId);
    setPhotos(photos.filter(p => p.id !== photoId));
    setSelectedPhotoIndex(null);
  };

  const handleUpdateCaption = async (photoId, newCaption) => {
    const updatedPhotos = photos.map(p =>
      p.id === photoId ? { ...p, caption: newCaption } : p
    );
    setPhotos(updatedPhotos);
  };

  const currentPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <div className="album-view">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="album-header">
        <h1>{album.name}</h1>
        {album.description && <p className="description">{album.description}</p>}
        <p className="location">{country.name} • {country.fromDate}</p>
      </div>

      <div className="upload-section">
        <label htmlFor="photo-upload" className="upload-label">
          + Upload Photos
        </label>
        <input
          id="photo-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
      </div>

      {selectedPhotoIndex !== null && currentPhoto ? (
        <div className="lightbox-overlay" onClick={() => setSelectedPhotoIndex(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setSelectedPhotoIndex(null)}
            >
              ✕
            </button>

            <div className="lightbox-image-container">
              <img src={currentPhoto.image} alt="Full view" className="lightbox-image" />
            </div>

            <div className="lightbox-info">
              <div className="caption-section">
                <input
                  type="text"
                  value={currentPhoto.caption}
                  onChange={(e) => handleUpdateCaption(currentPhoto.id, e.target.value)}
                  placeholder="Add caption..."
                  className="caption-input"
                />
              </div>

              <div className="lightbox-controls">
                <button
                  className="prev-btn"
                  onClick={() => setSelectedPhotoIndex(
                    selectedPhotoIndex === 0 ? photos.length - 1 : selectedPhotoIndex - 1
                  )}
                >
                  ← Previous
                </button>

                <span className="photo-counter">
                  {selectedPhotoIndex + 1} / {photos.length}
                </span>

                <button
                  className="next-btn"
                  onClick={() => setSelectedPhotoIndex(
                    selectedPhotoIndex === photos.length - 1 ? 0 : selectedPhotoIndex + 1
                  )}
                >
                  Next →
                </button>
              </div>

              <button
                className="delete-btn"
                onClick={() => handleDeletePhoto(currentPhoto.id)}
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="photos-grid">
        {photos.length === 0 ? (
          <p className="no-photos">No photos yet. Upload some to get started!</p>
        ) : (
          photos.map((photo, index) => (
            <div
              key={photo.id}
              className="photo-thumbnail"
              onClick={() => setSelectedPhotoIndex(index)}
            >
              <img src={photo.image} alt={photo.caption || 'Photo'} />
              {photo.caption && <p className="thumbnail-caption">{photo.caption}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
