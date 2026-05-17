import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineMenu, HiOutlineX, HiOutlineSun, HiOutlineMoon } from 'react-icons/hi';
import styled from 'styled-components';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { notifications } from '@/services/api';

const NavContainer = styled.nav`
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: ${({ theme }) => theme.colors.background};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  transition: all 0.3s ease;
`;

const NavInner = styled.div`
  max-width: 100%;
  padding: 0 2rem;
  display: flex;
  height: 4rem;
  align-items: center;
  justify-content: space-between;
`;

const NavBrand = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  color: ${({ theme }) => theme.colors.foreground};
  text-transform: uppercase;
`;

const DesktopLinks = styled.div`
  display: none;
  align-items: center;
  gap: 1.5rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const StyledLink = styled(Link)`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
  position: relative;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const ActionsContainer = styled.div`
  display: none;
  align-items: center;
  gap: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const IconButton = styled.button`
  padding: 0.5rem;
  color: ${({ theme }) => theme.colors.muted};
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const MobileMenuButton = styled(IconButton)`
  display: flex;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const PrimaryButton = styled(Link)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  transition: all 0.2s;

  &:hover {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const OutlineButton = styled(Link)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.background};
  }
`;

const MobileMenuContainer = styled(motion.div)`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const MobileLink = styled(Link)`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.secondary};
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  width: 200px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
`;

const DropdownItemLink = styled(Link)`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.foreground};
  font-weight: 600;
  font-size: 0.875rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const DropdownItemButton = styled.button`
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.875rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const AvatarContainer = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.border};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      notifications.getUnreadCount().then((res) => { if (res.data !== undefined) setUnreadCount(res.data); }).catch(() => { });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <NavContainer>
      <NavInner>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NavBrand to="/">Tradly</NavBrand>
        </div>

        <ActionsContainer>
          <DesktopLinks>
            <StyledLink to="/explore">Explore</StyledLink>
            {isAuthenticated && <StyledLink to="/create">Create Listing</StyledLink>}
          </DesktopLinks>

          <IconButton onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <HiOutlineMoon size={20} /> : <HiOutlineSun size={20} />}
          </IconButton>

          {isAuthenticated && (
            <IconButton onClick={() => navigate('/notifications')} aria-label="Notifications" style={{ position: 'relative' }}>
              <HiOutlineBell size={20} />
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: 'red', color: 'white',
                  fontSize: '10px', fontWeight: 'bold',
                  borderRadius: '50%', width: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </IconButton>
          )}

          {isAuthenticated ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontWeight: 600, color: 'inherit'
                }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'transparent', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AvatarContainer>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </AvatarContainer>
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <DropdownMenu
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <DropdownItemLink to={`/profile/${user?.username}`}>Profile</DropdownItemLink>
                    <DropdownItemLink to="/my-listings">My Listings</DropdownItemLink>
                    <DropdownItemLink to="/messages">Messages</DropdownItemLink>
                    {user?.role === 'ADMIN' && <DropdownItemLink to="/admin">Admin</DropdownItemLink>}
                    <DropdownItemButton onClick={handleLogout}>Logout</DropdownItemButton>
                  </DropdownMenu>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <OutlineButton to="/login">Login</OutlineButton>
              <PrimaryButton to="/register">Sign Up</PrimaryButton>
            </div>
          )}
        </ActionsContainer>

        <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
        </MobileMenuButton>
      </NavInner>

      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenuContainer
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <MobileLink to="/explore" onClick={() => setMobileMenuOpen(false)}>Explore</MobileLink>
            {isAuthenticated && <MobileLink to="/create" onClick={() => setMobileMenuOpen(false)}>Create Listing</MobileLink>}

            {isAuthenticated ? (
              <>
                <MobileLink to={`/profile/${user?.username}`} onClick={() => setMobileMenuOpen(false)}>Profile</MobileLink>
                <MobileLink to="/my-listings" onClick={() => setMobileMenuOpen(false)}>My Listings</MobileLink>
                <MobileLink to="/messages" onClick={() => setMobileMenuOpen(false)}>Messages</MobileLink>
                <MobileLink to="/notifications" onClick={() => setMobileMenuOpen(false)}>Notifications</MobileLink>
                {user?.role === 'ADMIN' && <MobileLink to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</MobileLink>}
                <button onClick={handleLogout} style={{
                  textAlign: 'left', padding: '0.5rem 0', background: 'transparent',
                  border: 'none', fontSize: '1.125rem', fontWeight: 600, color: 'var(--error)'
                }}>Logout</button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <OutlineButton to="/login" style={{ textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>Login</OutlineButton>
                <PrimaryButton to="/register" style={{ textAlign: 'center' }} onClick={() => setMobileMenuOpen(false)}>Sign Up</PrimaryButton>
              </div>
            )}
          </MobileMenuContainer>
        )}
      </AnimatePresence>
    </NavContainer>
  );
}
