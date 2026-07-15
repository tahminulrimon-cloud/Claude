import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db/init.js'
import countriesRouter from './routes/countries.js'
import albumsRouter from './routes/albums.js'
import photosRouter from './routes/photos.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

initDB()

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(join(__dirname, 'uploads')))
app.use('/api/countries', countriesRouter)
app.use('/api/albums', albumsRouter)
app.use('/api/photos', photosRouter)

app.listen(3001, () => console.log('✈  TravelVault API → http://localhost:3001'))
