import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getCountries } from '../services/db.js';
import './Dashboard.css';

const COUNTRY_COORDINATES = {
  Thailand: [15.87, 100.99],
  France: [46.56, 2.21],
  Belgium: [50.50, 4.48],
  Netherlands: [52.13, 5.29],
  Germany: [51.17, 10.45],
  Switzerland: [46.82, 8.23],
  'Czech Republic': [49.82, 15.47],
  Austria: [47.52, 14.55],
  Greece: [39.07, 21.82],
  Italy: [41.87, 12.57],
  Morocco: [31.79, -4.01],
  Turkey: [38.96, 35.24],
  Singapore: [1.35, 103.82],
  'United Kingdom': [55.38, -3.44],
  'Saudi Arabia': [23.89, 45.08],
};

export default function Dashboard({ onCountryClick, countries = [] }) {
  const [countryData, setCountryData] = useState([]);

  useEffect(() => {
    if (countries.length === 0) {
      getCountries().then(setCountryData);
    } else {
      setCountryData(countries);
    }
  }, [countries]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Travel Photo Gallery</h1>
        <p>{countryData.length} countries visited</p>
      </div>

      <div className="map-container">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {countryData.map((country) => {
            const coords = COUNTRY_COORDINATES[country.name];
            return coords ? (
              <CircleMarker
                key={country.id}
                center={coords}
                radius={10}
                fillColor="#ff7f0e"
                color="#ff7f0e"
                weight={2}
                opacity={1}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => onCountryClick(country),
                }}
              >
                <Popup>
                  <div>
                    <strong>{country.name}</strong>
                    <p>{country.fromDate} to {country.toDate}</p>
                    <p>{country.reason}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ) : null;
          })}
        </MapContainer>
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
