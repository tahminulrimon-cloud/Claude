import './CountryGrid.css'

const FLAG = {
  'Thailand':       '🇹🇭', 'France':      '🇫🇷', 'Belgium':       '🇧🇪',
  'Netherlands':    '🇳🇱', 'Germany':     '🇩🇪', 'Switzerland':   '🇨🇭',
  'Czech Republic': '🇨🇿', 'Austria':     '🇦🇹', 'Greece':        '🇬🇷',
  'Italy':          '🇮🇹', 'Morocco':     '🇲🇦', 'Turkey':        '🇹🇷',
  'Singapore':      '🇸🇬', 'United Kingdom': '🇬🇧', 'Saudi Arabia': '🇸🇦',
}

export default function CountryGrid({ countries, onCountryClick }) {
  return (
    <section className="country-grid-section">
      <div className="country-grid-header">
        <h2 className="section-title">Destinations</h2>
        <p className="section-sub">{countries.length} countries explored</p>
      </div>

      <div className="country-grid">
        {countries.map(country => (
          <CountryCard key={country.id} country={country} onClick={onCountryClick} />
        ))}
      </div>
    </section>
  )
}

function CountryCard({ country, onClick }) {
  const flag = FLAG[country.name] || '🌍'
  const hasCover = !!country.cover_photo
  const hasPhotos = (country.photo_count || 0) > 0

  return (
    <button className="country-card" onClick={() => onClick(country)}>
      <div className="country-card-thumb">
        {hasCover
          ? <img src={`/uploads/${country.cover_photo}`} alt={country.name} loading="lazy" />
          : <div className="country-card-placeholder">
              <span className="placeholder-flag">{flag}</span>
            </div>
        }
        <div className="country-card-overlay" />
        {hasPhotos && (
          <div className="country-card-photo-count">
            <span>📷</span>
            <span>{country.photo_count}</span>
          </div>
        )}
      </div>

      <div className="country-card-body">
        <div className="country-card-top">
          <span className="country-flag">{flag}</span>
          <span className={`badge ${hasPhotos ? 'badge-gold' : 'badge-teal'}`}>
            {hasPhotos ? `${country.album_count} album${country.album_count !== 1 ? 's' : ''}` : 'No albums yet'}
          </span>
        </div>
        <h3 className="country-card-name">{country.name}</h3>
        <p className="country-card-dates">{country.from_date} – {country.to_date || '...'}</p>
        {country.reason && country.reason !== 'Recreation' && (
          <p className="country-card-reason">{country.reason}</p>
        )}
      </div>

      <div className="country-card-arrow">→</div>
    </button>
  )
}
