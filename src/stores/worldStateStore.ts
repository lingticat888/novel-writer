import { create } from 'zustand';
import type { WorldState, WorldCategory } from '@/models';
import { worldStateRepository, type CreateWorldStateDTO } from '@/services/worldStateRepository';

interface WorldStateState {
  worldStates: WorldState[];
  selectedCategory: WorldCategory | 'all';
  isLoading: boolean;
  error: string | null;

  loadWorldStates: (novelId: string) => Promise<void>;
  createWorldState: (data: CreateWorldStateDTO) => Promise<WorldState>;
  updateWorldState: (id: string, data: Partial<WorldState>) => Promise<void>;
  deleteWorldState: (id: string) => Promise<void>;
  setSelectedCategory: (category: WorldCategory | 'all') => void;
  clearError: () => void;
}

export const useWorldStateStore = create<WorldStateState>((set) => ({
  worldStates: [],
  selectedCategory: 'all',
  isLoading: false,
  error: null,

  loadWorldStates: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const worldStates = await worldStateRepository.findByNovelId(novelId);
      set({ worldStates, isLoading: false });
    } catch (err) {
      set({ error: '加载世界状态失败', isLoading: false });
    }
  },

  createWorldState: async (data: CreateWorldStateDTO) => {
    set({ isLoading: true, error: null });
    try {
      const worldState = await worldStateRepository.create(data);
      set((state) => ({
        worldStates: [...state.worldStates, worldState],
        isLoading: false,
      }));
      return worldState;
    } catch (err) {
      set({ error: '创建世界状态失败', isLoading: false });
      throw err;
    }
  },

  updateWorldState: async (id: string, data: Partial<WorldState>) => {
    set({ error: null });
    try {
      await worldStateRepository.update(id, data);
      set((state) => ({
        worldStates: state.worldStates.map((ws) =>
          ws.id === id ? { ...ws, ...data, updatedAt: new Date() } : ws
        ),
      }));
    } catch (err) {
      set({ error: '更新世界状态失败' });
    }
  },

  deleteWorldState: async (id: string) => {
    set({ error: null });
    try {
      await worldStateRepository.delete(id);
      set((state) => ({
        worldStates: state.worldStates.filter((ws) => ws.id !== id),
      }));
    } catch (err) {
      set({ error: '删除世界状态失败' });
    }
  },

  setSelectedCategory: (category: WorldCategory | 'all') => {
    set({ selectedCategory: category });
  },

  clearError: () => {
    set({ error: null });
  },
}));
