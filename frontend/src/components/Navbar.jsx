import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      {/* Brand */}
      <NavLink to="/" className="navbar-brand" style={{ gap: 12 }}>
        <div className="brand-icon" style={{ width: 38, height: 38, borderRadius: 11, fontSize: 20 }}>
          🚀
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}>
            Launch<span style={{ color: 'var(--accent-blue)' }}>Signal</span>
          </span>
          <span style={{
            fontSize: '0.58rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
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
