import { useState, useEffect } from 'react';
import { initDB, getCountries, addCountry, getAlbumsByCountry, addAlbum, addPhoto } from './services/db.js';
import { travelHistory } from './data/travelData.js';
import { belgiumAlbums } from './data/belgiumSeed.js';
import Dashboard from './components/Dashboard.jsx';
import CountryDetail from './components/CountryDetail.jsx';
import AlbumView from './components/AlbumView.jsx';
import './App.css';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [countries, setCountries] = useState(
    travelHistory.map((t, i) => ({ id: `${i}`, ...t }))
  );
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await initDB();
        let allCountries = await getCountries();

        if (allCountries.length === 0) {
          for (const travel of travelHistory) {
            await addCountry(travel);
          }
          allCountries = await getCountries();
        }

        if (isMounted) setCountries(allCountries);

        const belgium = allCountries.find(c => c.name === 'Belgium');
        if (belgium) {
          const existingAlbums = await getAlbumsByCountry(belgium.id);
          if (existingAlbums.length === 0) {
            for (const albumDef of belgiumAlbums) {
              const albumId = await addAlbum({
                countryId: belgium.id,
                name: albumDef.name,
                description: albumDef.description,
                createdAt: new Date().toISOString(),
              });
              for (const photo of albumDef.photos) {
                await addPhoto({
                  albumId,
                  countryId: belgium.id,
                  image: photo.image,
                  caption: photo.caption,
                  uploadedAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('DB init error:', err);
        if (isMounted) setCountries(travelHistory.map((t, i) => ({ id: `${i}`, ...t })));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCountryClick = (country) => {
    setSelectedCountry(country);
    setView('country');
  };

  const handleAlbumClick = (country, album) => {
    setSelectedCountry(country);
    setSelectedAlbum(album);
    setView('album');
  };

  const handleBack = () => {
    if (view === 'album') {
      setView('country');
      setSelectedAlbum(null);
    } else if (view === 'country') {
      setView('dashboard');
      setSelectedCountry(null);
    }
  };

  return (
    <div className="app">
      {view === 'dashboard' && (
        <Dashboard onCountryClick={handleCountryClick} countries={countries} />
      )}
      {view === 'country' && selectedCountry && (
        <CountryDetail
          country={selectedCountry}
          onBack={handleBack}
          onAlbumClick={handleAlbumClick}
        />
      )}
      {view === 'album' && selectedCountry && selectedAlbum && (
        <AlbumView
          country={selectedCountry}
          album={selectedAlbum}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

