import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, GlobalStyle } from '@/styles/theme';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { connect as connectSocket, disconnect as disconnectSocket } from '@/services/socket';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminRoute from '@/components/layout/AdminRoute';
import AIChatWidget from '@/components/ai/AIChatWidget';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ExplorePage from '@/pages/ExplorePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CreateListingPage from '@/pages/CreateListingPage';
import EditListingPage from '@/pages/EditListingPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ConditionalAIChatWidget() {
  const location = useLocation();
  if (location.pathname !== '/') return null;
  return <AIChatWidget />;
}

function AppContent() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/create" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
          <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
          <Route path="/my-listings" element={<Navigate to="/profile?tab=listings" replace />} />
          <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/messages/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboardPage /></AdminRoute></ProtectedRoute>} />
        </Route>
      </Routes>
      <ConditionalAIChatWidget />
    </>
  );
}

function App() {
  const theme = useUIStore((s) => s.theme);
  const activeTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={activeTheme}>
      <GlobalStyle />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
