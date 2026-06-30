import { useState, useEffect } from 'react';
import { getAlbumsByCountry, addAlbum, getPhotosByAlbum } from '../services/db.js';
import './CountryDetail.css';

export default function CountryDetail({ country, onBack, onAlbumClick }) {
  const [albums, setAlbums] = useState([]);
  const [albumCovers, setAlbumCovers] = useState({});
  const [showNewAlbumForm, setShowNewAlbumForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  useEffect(() => {
    getAlbumsByCountry(country.id).then(async (loadedAlbums) => {
      setAlbums(loadedAlbums);
      const covers = {};
      for (const album of loadedAlbums) {
        const photos = await getPhotosByAlbum(album.id);
        if (photos.length > 0) covers[album.id] = photos[0].image;
      }
      setAlbumCovers(covers);
    });
  }, [country.id]);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    const albumId = await addAlbum({
      countryId: country.id,
      name: newAlbumName,
      description: newAlbumDescription,
      createdAt: new Date().toISOString(),
    });

    const newAlbum = {
      id: albumId,
      countryId: country.id,
      name: newAlbumName,
      description: newAlbumDescription,
      createdAt: new Date().toISOString(),
    };

    setAlbums([...albums, newAlbum]);
    setNewAlbumName('');
    setNewAlbumDescription('');
    setShowNewAlbumForm(false);
  };

  return (
    <div className="country-detail">
      <button className="back-btn" onClick={onBack}>← Back</button>

      <div className="country-header">
        <h1>{country.name}</h1>
        <p className="dates">{country.fromDate} to {country.toDate}</p>
        <p className="reason">Reason: {country.reason}</p>
      </div>

      <div className="albums-section">
        <div className="albums-header">
          <h2>Albums ({albums.length})</h2>
          <button
            className="new-album-btn"
            onClick={() => setShowNewAlbumForm(!showNewAlbumForm)}
          >
            + New Album
          </button>
        </div>

        {showNewAlbumForm && (
          <form className="new-album-form" onSubmit={handleCreateAlbum}>
            <input
              type="text"
              placeholder="Album name (e.g., 'Bangkok Street Food')"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newAlbumDescription}
              onChange={(e) => setNewAlbumDescription(e.target.value)}
            />
            <div className="form-buttons">
              <button type="submit">Create Album</button>
              <button
                type="button"
                onClick={() => {
                  setShowNewAlbumForm(false);
                  setNewAlbumName('');
                  setNewAlbumDescription('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="albums-grid">
          {albums.length === 0 ? (
            <p className="no-albums">No albums yet. Create one to start uploading photos!</p>
          ) : (
            albums.map((album) => (
              <div
                key={album.id}
                className="album-card"
                onClick={() => onAlbumClick(country, album)}
              >
                {albumCovers[album.id] ? (
                  <img
                    src={albumCovers[album.id]}
                    alt={album.name}
                    className="album-cover"
                  />
                ) : (
                  <div className="album-placeholder">📷</div>
                )}
                <div className="album-info">
                  <h3>{album.name}</h3>
                  {album.description && <p>{album.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
