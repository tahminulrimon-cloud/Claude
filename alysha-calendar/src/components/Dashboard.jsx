import './Dashboard.css';

export default function Dashboard({ onCountryClick, countries = [] }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Travel Photo Gallery</h1>
        <p>{countries.length} countries visited</p>
      </div>

      <div className="map-placeholder">
        <p>📍 World Map (Coming Soon)</p>
      </div>

      <div className="countries-grid">
        {countries.map((country) => (
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
