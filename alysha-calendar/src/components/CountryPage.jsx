import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import './CountryPage.css'

const FLAG = {
  'Thailand':       '🇹🇭', 'France':      '🇫🇷', 'Belgium':       '🇧🇪',
  'Netherlands':    '🇳🇱', 'Germany':     '🇩🇪', 'Switzerland':   '🇨🇭',
  'Czech Republic': '🇨🇿', 'Austria':     '🇦🇹', 'Greece':        '🇬🇷',
  'Italy':          '🇮🇹', 'Morocco':     '🇲🇦', 'Turkey':        '🇹🇷',
  'Singapore':      '🇸🇬', 'United Kingdom': '🇬🇧', 'Saudi Arabia': '🇸🇦',
}

export default function CountryPage({ country, onBack, onAlbumClick, onRefresh }) {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchAlbums = async () => {
    try {
      const data = await api.getAlbums(country.id)
      setAlbums(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlbums() }, [country.id])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formName.trim()) return
    setCreating(true)
    try {
      await api.createAlbum({ countryId: country.id, name: formName.trim(), description: formDesc.trim() })
      setFormName('')
      setFormDesc('')
      setShowForm(false)
      await fetchAlbums()
      onRefresh?.()
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAlbum = async (album) => {
    if (!confirm(`Delete album "${album.name}" and all its photos?`)) return
    await api.deleteAlbum(album.id)
    await fetchAlbums()
    onRefresh?.()
  }

  const flag = FLAG[country.name] || '🌍'
  const nights = country.from_date && country.to_date
    ? Math.max(0, Math.round((new Date(country.to_date) - new Date(country.from_date)) / 86400000))
    : null

  return (
    <div className="country-page">
      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-bg" />
        <div className="cp-header-content">
          <button className="btn btn-ghost btn-sm cp-back" onClick={onBack}>
            ← Back
          </button>

          <div className="cp-hero">
            <span className="cp-flag">{flag}</span>
            <div>
              <div className="cp-badges">
                <span className="badge badge-gold">{country.reason || 'Recreation'}</span>
                {nights !== null && <span className="badge badge-teal">{nights} night{nights !== 1 ? 's' : ''}</span>}
              </div>
              <h1 className="cp-title">{country.name}</h1>
              <p className="cp-dates">{country.from_date} – {country.to_date}</p>
            </div>
          </div>

          <div className="cp-stats">
            <div className="cp-stat">
              <span className="cp-stat-val">{albums.length}</span>
              <span className="cp-stat-label">Albums</span>
            </div>
            <div className="cp-stat">
              <span className="cp-stat-val">{albums.reduce((s, a) => s + (a.photo_count || 0), 0)}</span>
              <span className="cp-stat-label">Photos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Albums Section */}
      <div className="cp-body">
        <div className="cp-albums-header">
          <div>
            <h2 className="section-title">Albums</h2>
            <p className="section-sub">Organised collections from {country.name}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ Cancel' : '+ New Album'}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form className="album-form" onSubmit={handleCreate}>
            <div className="album-form-row">
              <input
                className="album-form-input"
                type="text"
                placeholder="Album name (e.g. Istanbul)"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                autoFocus
                required
              />
              <input
                className="album-form-input"
                type="text"
                placeholder="Description (optional)"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Albums grid */}
        {loading ? (
          <div className="cp-loading"><div className="spinner" /></div>
        ) : albums.length === 0 ? (
          <div className="cp-empty">
            <span className="cp-empty-icon">{flag}</span>
            <p>No albums yet</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create first album</button>
          </div>
        ) : (
          <div className="albums-grid">
            {albums.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => onAlbumClick(album)}
                onDelete={() => handleDeleteAlbum(album)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AlbumCard({ album, onClick, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div className="album-card" onClick={onClick}>
      <div className="album-card-thumb">
        {album.cover_photo
          ? <img src={`/uploads/${album.cover_photo}`} alt={album.name} loading="lazy" />
          : <div className="album-card-placeholder">
              <span className="album-placeholder-icon">🗂️</span>
            </div>
        }
        <div className="album-card-overlay" />
        <div className="album-card-count">
          <span>📷 {album.photo_count || 0}</span>
        </div>
      </div>

      <div className="album-card-body">
        <h3 className="album-card-name">{album.name}</h3>
        {album.description && <p className="album-card-desc">{album.description}</p>}
        <p className="album-card-date">{album.created_at ? album.created_at.slice(0,10) : ''}</p>
      </div>

      <button className="album-card-delete" onClick={handleDelete} title="Delete album">✕</button>
    </div>
  )
}
