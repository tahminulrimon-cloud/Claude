import './Navbar.css'

export default function Navbar({ breadcrumbs = [], onLogoClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-logo" onClick={onLogoClick}>
          <span className="logo-icon">✈</span>
          <span className="logo-text">Travel<span className="logo-accent">Vault</span></span>
        </button>

        {breadcrumbs.length > 0 && (
          <div className="breadcrumbs">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="breadcrumb-item">
                {i > 0 && <span className="breadcrumb-sep">/</span>}
                {crumb.onClick
                  ? <button className="breadcrumb-link" onClick={crumb.onClick}>{crumb.label}</button>
                  : <span className="breadcrumb-current">{crumb.label}</span>
                }
              </span>
            ))}
          </div>
        )}

        <div className="navbar-right">
          <span className="navbar-tagline">Your world in photos</span>
        </div>
      </div>
    </nav>
  )
}
