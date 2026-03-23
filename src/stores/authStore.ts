import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/models';
import { userRepository, type CreateUserDTO } from '@/services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: CreateUserDTO) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await userRepository.validatePassword(email, password);
          if (user) {
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ error: '邮箱或密码错误', isLoading: false });
          }
        } catch {
          set({ error: '登录失败', isLoading: false });
        }
      },

      register: async (data: CreateUserDTO) => {
        set({ isLoading: true, error: null });
        try {
          const user = await userRepository.create(data);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ error: error instanceof Error ? error.message : '注册失败', isLoading: false });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const { user } = get();
        if (user) {
          const freshUser = await userRepository.findById(user.id);
          if (freshUser) {
            set({ user: freshUser, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
