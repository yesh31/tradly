import { create } from 'zustand';

interface UIState {
  isAIChatOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  theme: 'light' | 'dark';
  toggleAIChat: () => void;
  setAIChatOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAIChatOpen: false,
  isMobileMenuOpen: false,
  isSearchOpen: false,
  theme: 'dark',
  toggleAIChat: () => set((s) => ({ isAIChatOpen: !s.isAIChatOpen })),
  setAIChatOpen: (open) => set({ isAIChatOpen: open }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
