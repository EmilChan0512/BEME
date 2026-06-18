import { NavLink } from 'react-router-dom';
import { navItems } from '../../config/navigation';
import './AppHeader.css';

export function AppHeader() {
  return (
    <header className="header">
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
    </header>
  );
}
