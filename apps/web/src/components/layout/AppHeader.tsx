import { Link, NavLink } from 'react-router-dom';
import { navItems } from '../../config/navigation';
import './AppHeader.css';

export function AppHeader() {
  return (
    <header className="header">
      <div className="header-shell">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">BEME</span>
        </Link>
        <nav className="nav" aria-label="Daily entries">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
