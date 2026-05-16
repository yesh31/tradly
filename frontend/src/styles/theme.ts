import { createGlobalStyle, type DefaultTheme } from 'styled-components';

export const lightTheme: DefaultTheme = {
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#000000',
    primaryHover: '#333333',
    secondary: '#f3f4f6',
    border: '#e5e7eb',
    muted: '#6b7280',
    error: '#ef4444',
    success: '#10b981',
  },
  fonts: {
    main: '"Space Grotesk", sans-serif',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export const darkTheme: DefaultTheme = {
  colors: {
    background: '#0a0a0a',
    foreground: '#ffffff',
    primary: '#ffffff',
    primaryHover: '#cccccc',
    secondary: '#1a1a1a',
    border: '#333333',
    muted: '#a3a3a3',
    error: '#f87171',
    success: '#34d399',
  },
  fonts: {
    main: '"Space Grotesk", sans-serif',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.foreground};
    font-family: ${({ theme }) => theme.fonts.main};
    transition: background-color 0.3s ease, color 0.3s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;
