import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer' | 'billing';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId: string;
  permissions: string[];
  avatarUrl?: string;
  isSuperAdmin?: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  _hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      setAuth: (token: string, user: User) => {
        localStorage.setItem('access_token', token);
        set({ accessToken: token, user });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        localStorage.setItem('access_token', token);
        set({ accessToken: token });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ accessToken: null, user: null });
      },

      isAuthenticated: () => {
        return !!get().accessToken && !!get().user;
      },
    }),
    {
      name: 'devlock-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
