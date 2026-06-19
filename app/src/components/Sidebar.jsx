import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Home, Lightbulb, Mic2, List, Video, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

const Wrap = styled.nav`
  width: 12.5rem;
  min-height: 100dvh;
  background: ${({ theme }) => theme.bgCard};
  border-right: 1px solid ${({ theme }) => theme.border};
  position: fixed;
  top: 0;
  left: 0;
  display: none;
  flex-direction: column;
  padding: 1.75rem 0 1.25rem;
  z-index: 50;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const Brand = styled.div`
  padding: 0 1.25rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.accent};
`;

const NavItems = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 0.625rem;
  gap: 0.125rem;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5625rem 0.625rem;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  text-decoration: none;
  transition: color 0.15s, background 0.15s;

  svg { flex-shrink: 0; }

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.borderSubtle};
  }

  &.active {
    color: ${({ theme }) => theme.primary};
    background: ${({ theme }) => theme.primaryLight};
  }
`;

const Footer = styled.div`
  padding: 0.75rem 0.625rem 0;
  border-top: 1px solid ${({ theme }) => theme.border};
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const FooterBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5625rem 0.625rem;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-family: ${({ theme }) => theme.fontMono};
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.textMuted};
  transition: color 0.15s, background 0.15s;
  text-align: left;

  &:hover {
    color: ${({ theme }) => theme.text};
    background: ${({ theme }) => theme.borderSubtle};
  }
`;

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, exact: true },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/jokes', label: 'Jokes', icon: Mic2 },
  { to: '/sets', label: 'Sets', icon: List },
  { to: '/profile', label: 'Profile', icon: Video },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const { mode, toggle } = useTheme();

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <Wrap>
      <Brand><Logo size={28} />My Tight Five</Brand>

      <NavItems>
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavItem
            key={to}
            to={to}
            className={isActive(to, exact) ? 'active' : ''}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavItem>
        ))}
      </NavItems>

      <Footer>
        <FooterBtn onClick={toggle}>
          {mode === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          {mode === 'dark' ? 'Light' : 'Dark'}
        </FooterBtn>
        <FooterBtn onClick={logout}>
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </FooterBtn>
      </Footer>
    </Wrap>
  );
}
