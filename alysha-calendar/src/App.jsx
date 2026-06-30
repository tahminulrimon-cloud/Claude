import { useState, useEffect } from 'react';
import { initDB, getCountries, addCountry } from './services/db.js';
import { travelHistory } from './data/travelData.js';
import Dashboard from './components/Dashboard.jsx';
import CountryDetail from './components/CountryDetail.jsx';
import AlbumView from './components/AlbumView.jsx';
import './App.css';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [view, setView] = useState('dashboard');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    initDB().then(async () => {
      const existingCountries = await getCountries();
      if (existingCountries.length === 0) {
        for (const travel of travelHistory) {
          await addCountry(travel);
        }
        const newCountries = await getCountries();
        setCountries(newCountries);
      } else {
        setCountries(existingCountries);
      }
      setDbReady(true);
    });
  }, []);

  if (!dbReady) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '18px' }}>Loading...</div>;
  }

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

