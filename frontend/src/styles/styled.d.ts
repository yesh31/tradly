import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      foreground: string;
      primary: string;
      primaryHover: string;
      secondary: string;
      border: string;
      muted: string;
      error: string;
      success: string;
    };
    fonts: {
      main: string;
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  }
}
