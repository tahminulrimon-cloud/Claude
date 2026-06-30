import { useState, useEffect } from 'react';
import { getCountries } from '../services/db.js';
import './Dashboard.css';

export default function Dashboard({ onCountryClick, countries = [] }) {
  const [countryData, setCountryData] = useState([]);

  useEffect(() => {
    if (countries.length > 0) {
      setCountryData(countries);
    } else {
      getCountries().then(setCountryData);
    }
  }, [countries]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Travel Photo Gallery</h1>
        <p>{countryData.length} countries visited</p>
      </div>

      <div className="map-placeholder">
        <p>📍 World Map (Coming Soon)</p>
      </div>

      <div className="countries-grid">
        {countryData.map((country) => (
          <div
            key={country.id}
            className="country-card"
            onClick={() => onCountryClick(country)}
          >
            <div className="country-card-content">
              <h3>{country.name}</h3>
              <p className="dates">{country.fromDate} → {country.toDate}</p>
              <p className="reason">{country.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
