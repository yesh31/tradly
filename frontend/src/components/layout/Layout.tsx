import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import Navbar from './Navbar';
import Footer from './Footer';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const MainContent = styled.main`
  flex: 1;
`;

export default function Layout() {
  const location = useLocation();
  const showFooter = !location.pathname.startsWith('/messages');

  return (
    <AppContainer>
      <Navbar />
      <MainContent>
        <Outlet />
      </MainContent>
      {showFooter && <Footer />}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0px', // More brutalist/minimalist
            fontSize: '0.875rem',
            fontFamily: '"Space Grotesk", sans-serif',
          },
        }}
      />
    </AppContainer>
  );
}
