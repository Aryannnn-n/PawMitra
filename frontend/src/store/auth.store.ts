import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/index.js';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuth: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuth: false,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuth: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuth: false });
      },
    }),
    {
      name: 'pawmitra-auth', // persisted to localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuth: state.isAuth,
      }),
    },
  ),
);
