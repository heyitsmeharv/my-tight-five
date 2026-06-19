import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Home, Lightbulb, Mic2, List, Video } from 'lucide-react';

const Nav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3.25rem;
  background: ${({ theme }) => theme.bgCard};
  border-top: 1px solid ${({ theme }) => theme.border};
  display: flex;
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom);

  @media (min-width: 768px) {
    display: none;
  }
`;

const NavItem = styled(NavLink)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1875rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  transition: color 0.15s;
  position: relative;

  &.active {
    color: ${({ theme }) => theme.primary};

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 2px;
      background: ${({ theme }) => theme.primary};
      border-radius: 0 0 2px 2px;
    }
  }
`;

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/jokes', label: 'Jokes', icon: Mic2 },
  { to: '/sets', label: 'Sets', icon: List },
  { to: '/profile', label: 'Profile', icon: Video },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <Nav>
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
        <NavItem
          key={to}
          to={to}
          className={isActive(to, exact) ? 'active' : ''}
        >
          <Icon size={20} strokeWidth={1.75} />
          {label}
        </NavItem>
      ))}
    </Nav>
  );
}
