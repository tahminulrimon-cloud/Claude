import { db } from './init.js'

export const countries = {
  getAll: () => db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM albums a WHERE a.country_id = c.id) as album_count,
      (SELECT COUNT(*) FROM photos p WHERE p.country_id = c.id) as photo_count,
      (SELECT p.filename FROM photos p JOIN albums a ON p.album_id = a.id
       WHERE a.country_id = c.id ORDER BY p.uploaded_at ASC LIMIT 1) as cover_photo
    FROM countries c ORDER BY c.id
  `).all(),

  getById: (id) => db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM albums a WHERE a.country_id = c.id) as album_count,
      (SELECT COUNT(*) FROM photos p WHERE p.country_id = c.id) as photo_count
    FROM countries c WHERE c.id = ?
  `).get(id),
}

export const albums = {
  getByCountry: (countryId) => db.prepare(`
    SELECT a.*,
      (SELECT COUNT(*) FROM photos p WHERE p.album_id = a.id) as photo_count,
      (SELECT filename FROM photos p WHERE p.album_id = a.id ORDER BY p.uploaded_at ASC LIMIT 1) as cover_photo
    FROM albums a WHERE a.country_id = ? ORDER BY a.created_at DESC
  `).all(countryId),

  getById: (id) => db.prepare('SELECT * FROM albums WHERE id = ?').get(id),

  create: (countryId, name, description) => {
    const r = db.prepare(
      'INSERT INTO albums (country_id,name,description) VALUES (?,?,?)'
    ).run(countryId, name, description || '')
    return db.prepare('SELECT * FROM albums WHERE id = ?').get(r.lastInsertRowid)
  },

  delete: (id) => db.prepare('DELETE FROM albums WHERE id = ?').run(id),
}

export const photos = {
  getByAlbum: (albumId) =>
    db.prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY uploaded_at ASC').all(albumId),

  create: (albumId, countryId, filename, caption) => {
    const r = db.prepare(
      'INSERT INTO photos (album_id,country_id,filename,caption) VALUES (?,?,?,?)'
    ).run(albumId, countryId, filename, caption || '')
    return db.prepare('SELECT * FROM photos WHERE id = ?').get(r.lastInsertRowid)
  },

  updateCaption: (id, caption) => {
    db.prepare('UPDATE photos SET caption = ? WHERE id = ?').run(caption, id)
    return db.prepare('SELECT * FROM photos WHERE id = ?').get(id)
  },

  delete: (id) => {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id)
    db.prepare('DELETE FROM photos WHERE id = ?').run(id)
    return photo
  },
}
