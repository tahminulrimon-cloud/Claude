import { useState, useEffect, useCallback } from 'react'
import { api } from './services/api.js'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import WorldMap from './components/WorldMap.jsx'
import CountryGrid from './components/CountryGrid.jsx'
import CountryPage from './components/CountryPage.jsx'
import AlbumPage from './components/AlbumPage.jsx'
import './App.css'

export default function App() {
  const [view, setView] = useState('home')
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    api.getCountries()
      .then(data => { setCountries(data); setError(null); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [tick])

  const refresh = useCallback(() => setTick(t => t + 1), [])

  const goHome = useCallback(() => {
    setView('home')
    setSelectedCountry(null)
    setSelectedAlbum(null)
    refresh()
  }, [refresh])

  const goToCountry = useCallback((country) => {
    setSelectedCountry(country)
    setSelectedAlbum(null)
    setView('country')
  }, [])

  const goToAlbum = useCallback((album) => {
    setSelectedAlbum(album)
    setView('album')
  }, [])

  const backToCountry = useCallback(() => {
    setSelectedAlbum(null)
    setView('country')
  }, [])

  if (loading) return (
    <div className="app-loading">
      <div className="spinner" />
      <p>Loading TravelVault...</p>
    </div>
  )

  if (error) return (
    <div className="app-error">
      <h2>Could not connect</h2>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={refresh}>Retry</button>
    </div>
  )

  const breadcrumbs =
    view === 'country' ? [{ label: 'Home', onClick: goHome }, { label: selectedCountry?.name }] :
    view === 'album'   ? [{ label: 'Home', onClick: goHome }, { label: selectedCountry?.name, onClick: () => setView('country') }, { label: selectedAlbum?.name }] :
    []

  const totalPhotos = countries.reduce((s, c) => s + (c.photo_count || 0), 0)
  const totalAlbums = countries.reduce((s, c) => s + (c.album_count || 0), 0)

  return (
    <div className="app">
      <Navbar breadcrumbs={breadcrumbs} onLogoClick={goHome} />

      {view === 'home' && (
        <>
          <Hero countriesCount={countries.length} photosCount={totalPhotos} albumsCount={totalAlbums} />
          <WorldMap countries={countries} onCountryClick={goToCountry} />
          <CountryGrid countries={countries} onCountryClick={goToCountry} />
        </>
      )}

      {view === 'country' && selectedCountry && (
        <CountryPage
          country={selectedCountry}
          onBack={goHome}
          onAlbumClick={goToAlbum}
          onRefresh={refresh}
        />
      )}

      {view === 'album' && selectedCountry && selectedAlbum && (
        <AlbumPage
          country={selectedCountry}
          album={selectedAlbum}
          onBack={backToCountry}
        />
      )}
    </div>
  )
}
