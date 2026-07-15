import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api.js'
import './Lightbox.css'

export default function Lightbox({ photos, initialIndex, onClose, onDelete, onCaptionUpdate }) {
  const [index, setIndex] = useState(initialIndex)

  const prev = useCallback(() => setIndex(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setIndex(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')       onClose()
      else if (e.key === 'ArrowLeft')  prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleDelete = async (photoId) => {
    await onDelete(photoId)
    if (photos.length <= 1) { onClose(); return }
    setIndex(i => Math.min(i, photos.length - 2))
  }

  const photo = photos[index]
  if (!photo) return null

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} title="Close (Esc)">✕</button>

      {photos.length > 1 && (
        <>
          <button className="lb-nav lb-prev" onClick={e => { e.stopPropagation(); prev() }}>‹</button>
          <button className="lb-nav lb-next" onClick={e => { e.stopPropagation(); next() }}>›</button>
        </>
      )}

      <LightboxContent
        key={photo.id}
        photo={photo}
        index={index}
        total={photos.length}
        onDelete={() => handleDelete(photo.id)}
        onCaptionUpdate={(caption) => onCaptionUpdate(photo.id, caption)}
      />
    </div>
  )
}

function LightboxContent({ photo, index, total, onDelete, onCaptionUpdate }) {
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(photo.caption || '')
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleSaveCaption = async () => {
    setSaving(true)
    try {
      await onCaptionUpdate(captionDraft)
      setEditingCaption(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this photo?')) return
    await onDelete()
  }

  return (
    <div className="lb-content" onClick={e => e.stopPropagation()}>
      <div className="lb-img-wrap">
        {imgError
          ? <div className="lb-img-error">Image not found</div>
          : <img
              src={api.photoUrl(photo.filename)}
              alt={photo.caption || ''}
              className="lb-img"
              onError={() => setImgError(true)}
            />
        }
      </div>

      <div className="lb-footer">
        <div className="lb-counter">{index + 1} / {total}</div>

        {editingCaption ? (
          <div className="lb-caption-edit">
            <input
              className="lb-caption-input"
              value={captionDraft}
              onChange={e => setCaptionDraft(e.target.value)}
              placeholder="Add a caption…"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter')  handleSaveCaption()
                if (e.key === 'Escape') setEditingCaption(false)
              }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveCaption} disabled={saving}>
              {saving ? '…' : 'Save'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingCaption(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="lb-caption-view">
            {photo.caption
              ? <p className="lb-caption-text">{photo.caption}</p>
              : <p className="lb-caption-empty">No caption</p>
            }
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setCaptionDraft(photo.caption || ''); setEditingCaption(true) }}
            >
              Edit caption
            </button>
          </div>
        )}

        <button className="btn btn-danger btn-sm lb-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
