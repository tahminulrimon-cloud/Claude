import { Router } from 'express'
import multer from 'multer'
import { extname, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { unlink } from 'fs/promises'
import { photos } from '../db/queries.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const uploadsDir = join(__dirname, '../uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`),
})

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Images only')),
})

const router = Router()

router.get('/', (req, res) => {
  const { albumId } = req.query
  if (!albumId) return res.status(400).json({ error: 'albumId required' })
  res.json(photos.getByAlbum(parseInt(albumId)))
})

router.post('/', upload.array('photos', 50), (req, res) => {
  const { albumId, countryId } = req.body
  if (!albumId || !countryId || !req.files?.length)
    return res.status(400).json({ error: 'albumId, countryId, and photos required' })
  const created = req.files.map(f =>
    photos.create(parseInt(albumId), parseInt(countryId), f.filename, '')
  )
  res.status(201).json(created)
})

router.patch('/:id', (req, res) => {
  const photo = photos.updateCaption(parseInt(req.params.id), req.body.caption ?? '')
  res.json(photo)
})

router.delete('/:id', async (req, res) => {
  const photo = photos.delete(parseInt(req.params.id))
  if (photo?.filename && !photo.filename.startsWith('belgium-')) {
    try { await unlink(join(uploadsDir, photo.filename)) } catch { /* already gone */ }
  }
  res.json({ success: true })
})

export default router
