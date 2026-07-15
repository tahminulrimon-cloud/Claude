import { Router } from 'express'
import { albums } from '../db/queries.js'

const router = Router()

router.get('/', (req, res) => {
  const { countryId } = req.query
  if (!countryId) return res.status(400).json({ error: 'countryId required' })
  res.json(albums.getByCountry(parseInt(countryId)))
})

router.post('/', (req, res) => {
  const { countryId, name, description } = req.body
  if (!countryId || !name) return res.status(400).json({ error: 'countryId and name required' })
  res.status(201).json(albums.create(parseInt(countryId), name, description))
})

router.delete('/:id', (req, res) => {
  albums.delete(parseInt(req.params.id))
  res.json({ success: true })
})

export default router
