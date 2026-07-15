import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../services/api.js'
import Lightbox from './Lightbox.jsx'
import './AlbumPage.css'

export default function AlbumPage({ country, album, onBack }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const data = await api.getPhotos(album.id)
      setPhotos(data)
    } finally {
      setLoading(false)
    }
  }, [album.id])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const handleFiles = async (files) => {
    const valid = [...files].filter(f => f.type.startsWith('image/'))
    if (!valid.length) return

    setUploading(true)
    setUploadProgress(0)

    const fd = new FormData()
    valid.forEach(f => fd.append('photos', f))
    fd.append('albumId', album.id)
    fd.append('countryId', country.id)

    try {
      await api.uploadPhotos(fd)
      await fetchPhotos()
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDeletePhoto = async (photoId) => {
    await api.deletePhoto(photoId)
    const next = photos.filter(p => p.id !== photoId)
    setPhotos(next)
    if (lightboxIndex !== null) {
      if (lightboxIndex >= next.length) {
        setLightboxIndex(next.length > 0 ? next.length - 1 : null)
      }
    }
  }

  const handleCaptionUpdate = async (photoId, caption) => {
    await api.updatePhoto(photoId, { caption })
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p))
  }

  return (
    <div className="album-page">
      {/* Header */}
      <div className="ap-header">
        <div className="ap-header-bg" />
        <div className="ap-header-content">
          <button className="btn btn-ghost btn-sm ap-back" onClick={onBack}>
            ← {country.name}
          </button>
          <div className="ap-hero">
            <div className="ap-hero-text">
              <h1 className="ap-title">{album.name}</h1>
              {album.description && <p className="ap-desc">{album.description}</p>}
              <div className="ap-meta">
                <span className="badge badge-teal">{country.name}</span>
                <span className="badge badge-gold">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <button
              className="btn btn-primary ap-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : '+ Add Photos'}
            </button>
          </div>
        </div>
      </div>

      {/* Upload zone + grid */}
      <div className="ap-body">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragOver ? 'drop-zone-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="drop-icon">📁</span>
          <p className="drop-text">Drop photos here or <span className="drop-link">browse files</span></p>
          <p className="drop-sub">JPG, PNG, WEBP — up to 30 MB each</p>
        </div>

        {uploading && (
          <div className="upload-bar-wrap">
            <div className="upload-bar">
              <div className="upload-bar-fill" style={{ width: `${uploadProgress || 60}%` }} />
            </div>
            <p className="upload-bar-label">Uploading photos…</p>
          </div>
        )}

        {/* Photo grid */}
        {loading ? (
          <div className="ap-loading"><div className="spinner" /></div>
        ) : photos.length === 0 ? (
          <div className="ap-empty">
            <span className="ap-empty-icon">📷</span>
            <p>No photos yet</p>
          </div>
        ) : (
          <div className="photo-masonry">
            {photos.map((photo, i) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDeletePhoto}
          onCaptionUpdate={handleCaptionUpdate}
        />
      )}
    </div>
  )
}

function PhotoTile({ photo, onClick }) {
  return (
    <div className="photo-tile" onClick={onClick}>
      <img
        src={api.photoUrl(photo.filename)}
        alt={photo.caption || ''}
        loading="lazy"
      />
      <div className="photo-tile-overlay">
        {photo.caption && <p className="photo-tile-caption">{photo.caption}</p>}
      </div>
    </div>
  )
}
