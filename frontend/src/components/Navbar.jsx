import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* Brand */}
      <NavLink to="/" className="navbar-brand" style={{ gap: 12 }}>
        <div className="brand-icon" style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 14l5-5 4 4 5-9" />
          </svg>
        </div>
        <div className="brand-name-container">
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}>
            Launch<span style={{ color: 'var(--accent-blue)' }}>Signal</span>
          </span>
          <span className="brand-subtitle" style={{
            fontSize: '0.52rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}>
            AI · IPO Performance Prediction
          </span>
        </div>
      </NavLink>

      {/* Nav Links */}
      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          id="nav-predictor"
        >
          🎯 Predictor
        </NavLink>
        <NavLink
          to="/market"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          id="nav-market"
        >
          📊 Market
          <span className="navbar-badge">Live</span>
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          id="nav-history"
        >
          🕒 History
        </NavLink>
      </div>
    </nav>
  );
}
