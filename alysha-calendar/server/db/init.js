import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '../../data')
const uploadsDir = join(__dirname, '../uploads')

mkdirSync(dataDir, { recursive: true })
mkdirSync(uploadsDir, { recursive: true })

export const db = new Database(join(dataDir, 'travel.db'))

const COUNTRIES = [
  { name: 'Thailand',       from_date: '08 Nov 2016', to_date: '12 Nov 2016', reason: 'Recreation', latitude: 15.87,  longitude: 100.99 },
  { name: 'France',         from_date: '22 Apr 2019', to_date: '24 Apr 2019', reason: 'Recreation', latitude: 46.56,  longitude: 2.21   },
  { name: 'Belgium',        from_date: '25 Apr 2019', to_date: '26 Apr 2019', reason: 'Recreation', latitude: 50.50,  longitude: 4.48   },
  { name: 'Netherlands',    from_date: '27 Apr 2019', to_date: '30 Apr 2019', reason: 'Recreation', latitude: 52.13,  longitude: 5.29   },
  { name: 'Germany',        from_date: '01 May 2019', to_date: '04 May 2019', reason: 'Recreation', latitude: 51.17,  longitude: 10.45  },
  { name: 'Switzerland',    from_date: '05 May 2019', to_date: '08 May 2019', reason: 'Recreation', latitude: 46.82,  longitude: 8.23   },
  { name: 'Czech Republic', from_date: '09 May 2019', to_date: '11 May 2019', reason: 'Recreation', latitude: 49.82,  longitude: 15.47  },
  { name: 'Austria',        from_date: '12 May 2019', to_date: '14 May 2019', reason: 'Recreation', latitude: 47.52,  longitude: 14.55  },
  { name: 'Greece',         from_date: '15 May 2019', to_date: '18 May 2019', reason: 'Recreation', latitude: 39.07,  longitude: 21.82  },
  { name: 'Italy',          from_date: '19 May 2019', to_date: '20 May 2019', reason: 'Recreation', latitude: 41.87,  longitude: 12.57  },
  { name: 'Morocco',        from_date: '25 Aug 2019', to_date: '26 Aug 2019', reason: 'Recreation', latitude: 31.79,  longitude: -4.01  },
  { name: 'Turkey',         from_date: '27 Aug 2019', to_date: '19 Sep 2019', reason: 'Recreation', latitude: 38.96,  longitude: 35.24  },
  { name: 'Singapore',      from_date: '21 Apr 2023', to_date: '28 Apr 2023', reason: 'Recreation', latitude: 1.35,   longitude: 103.82 },
  { name: 'United Kingdom', from_date: '26 Mar 2024', to_date: '01 Apr 2024', reason: 'Recreation', latitude: 55.38,  longitude: -3.44  },
  { name: 'Saudi Arabia',   from_date: '02 Apr 2024', to_date: '06 Apr 2024', reason: 'Umrah',      latitude: 23.89,  longitude: 45.08  },
]

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      from_date TEXT,
      to_date TEXT,
      reason TEXT,
      latitude REAL,
      longitude REAL
    );
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      caption TEXT DEFAULT '',
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const { c } = db.prepare('SELECT COUNT(*) as c FROM countries').get()
  if (c === 0) {
    const ins = db.prepare(
      'INSERT INTO countries (name,from_date,to_date,reason,latitude,longitude) VALUES (?,?,?,?,?,?)'
    )
    db.transaction(() => {
      for (const co of COUNTRIES) ins.run(co.name, co.from_date, co.to_date, co.reason, co.latitude, co.longitude)
    })()
    console.log('✓ Seeded 15 countries')
    seedBelgium()
  }
}

function seedBelgium() {
  const belgium = db.prepare("SELECT id FROM countries WHERE name='Belgium'").get()
  if (!belgium) return
  const albumId = db.prepare(
    'INSERT INTO albums (country_id,name,description) VALUES (?,?,?)'
  ).run(belgium.id, 'Brussels', 'Sightseeing and fun in Brussels').lastInsertRowid

  const belgiumPhotos = [
    { filename: 'belgium-mini-europe.jpeg',    caption: 'Mini-Europe, Brussels' },
    { filename: 'belgium-atomium.jpeg',         caption: 'Atomium, Brussels' },
    { filename: 'belgium-brussels-street.jpeg', caption: 'Streets of Brussels' },
    { filename: 'belgium-avengers-imax.jpeg',   caption: 'Avengers: Endgame IMAX premiere' },
    { filename: 'belgium-imax-cinema.jpeg',     caption: 'IMAX Cinema, Brussels' },
  ]
  const insPhoto = db.prepare(
    'INSERT INTO photos (album_id,country_id,filename,caption) VALUES (?,?,?,?)'
  )
  for (const p of belgiumPhotos) insPhoto.run(albumId, belgium.id, p.filename, p.caption)
  console.log('✓ Seeded Belgium Brussels album with 5 photos')
}
