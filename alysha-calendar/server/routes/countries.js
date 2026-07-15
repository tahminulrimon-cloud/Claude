import { Router } from 'express'
import { countries } from '../db/queries.js'

const router = Router()

router.get('/', (req, res) => res.json(countries.getAll()))

router.get('/:id', (req, res) => {
  const c = countries.getById(parseInt(req.params.id))
  if (!c) return res.status(404).json({ error: 'Not found' })
  res.json(c)
})

export default router
