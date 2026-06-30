import './Hero.css'

export default function Hero({ countriesCount, photosCount, albumsCount }) {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-grid" />
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge badge-gold">My Travel Story</span>
        </div>

        <h1 className="hero-title">
          Every Journey,<br />
          <span className="hero-title-accent">Beautifully Captured</span>
        </h1>

        <p className="hero-desc">
          A personal vault of memories from across the globe — explore countries,
          dive into albums, and relive the moments that matter.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{countriesCount}</span>
            <span className="hero-stat-label">Countries</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">{albumsCount}</span>
            <span className="hero-stat-label">Albums</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-value">{photosCount}</span>
            <span className="hero-stat-label">Photos</span>
          </div>
        </div>
      </div>

      <div className="hero-scroll-hint">
        <span>Explore</span>
        <div className="hero-scroll-arrow" />
      </div>
    </section>
  )
}
