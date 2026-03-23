import { create } from 'zustand';
import type { SidequestProgress, QuestStatus } from '@/models';
import { sidequestRepository, type CreateSidequestDTO, type UpdateProgressDTO } from '@/services/sidequestRepository';

interface SidequestState {
  sidequests: SidequestProgress[];
  filterStatus: QuestStatus | 'all';
  isLoading: boolean;
  error: string | null;

  loadSidequests: (novelId: string) => Promise<void>;
  createSidequest: (data: CreateSidequestDTO) => Promise<SidequestProgress>;
  updateSidequest: (id: string, data: Partial<Pick<SidequestProgress, 'title' | 'description' | 'relatedChapterIds' | 'relatedPlotIds'>>) => Promise<void>;
  updateProgress: (id: string, data: UpdateProgressDTO) => Promise<void>;
  updateStatus: (id: string, status: QuestStatus) => Promise<void>;
  deleteSidequest: (id: string) => Promise<void>;
  setFilterStatus: (status: QuestStatus | 'all') => void;
  clearError: () => void;
}

export const useSidequestStore = create<SidequestState>((set) => ({
  sidequests: [],
  filterStatus: 'all',
  isLoading: false,
  error: null,

  loadSidequests: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const sidequests = await sidequestRepository.findByNovelId(novelId);
      set({ sidequests, isLoading: false });
    } catch (err) {
      set({ error: '加载支线失败', isLoading: false });
    }
  },

  createSidequest: async (data: CreateSidequestDTO) => {
    set({ error: null });
    try {
      const sidequest = await sidequestRepository.create(data);
      set((state) => ({
        sidequests: [...state.sidequests, sidequest],
      }));
      return sidequest;
    } catch (err) {
      set({ error: '创建支线失败' });
      throw err;
    }
  },

  updateSidequest: async (id, data) => {
    set({ error: null });
    try {
      await sidequestRepository.update(id, data);
      set((state) => ({
        sidequests: state.sidequests.map((s) =>
          s.id === id ? { ...s, ...data, updatedAt: new Date() } : s
        ),
      }));
    } catch (err) {
      set({ error: '更新支线失败' });
    }
  },

  updateProgress: async (id, data) => {
    set({ error: null });
    try {
      const oldSidequest = await sidequestRepository.findById(id);
      if (!oldSidequest) throw new Error('Sidequest not found');

      await sidequestRepository.updateProgress(id, data);
      
      const newStatus: QuestStatus = data.progress >= 100 ? 'completed' : 'in_progress';
      const progressChange = {
        changedAt: new Date(),
        oldProgress: oldSidequest.progress,
        newProgress: data.progress,
        note: data.note,
      };

      set((state) => ({
        sidequests: state.sidequests.map((s) =>
          s.id === id
            ? { ...s, progress: data.progress, status: newStatus, progressHistory: [...s.progressHistory, progressChange], updatedAt: new Date() }
            : s
        ),
      }));
    } catch (err) {
      set({ error: '更新进度失败' });
    }
  },

  updateStatus: async (id, status) => {
    set({ error: null });
    try {
      await sidequestRepository.updateStatus(id, status);
      set((state) => ({
        sidequests: state.sidequests.map((s) =>
          s.id === id ? { ...s, status, updatedAt: new Date() } : s
        ),
      }));
    } catch (err) {
      set({ error: '更新状态失败' });
    }
  },

  deleteSidequest: async (id) => {
    set({ error: null });
    try {
      await sidequestRepository.delete(id);
      set((state) => ({
        sidequests: state.sidequests.filter((s) => s.id !== id),
      }));
    } catch (err) {
      set({ error: '删除支线失败' });
    }
  },

  setFilterStatus: (status) => {
    set({ filterStatus: status });
  },

  clearError: () => {
    set({ error: null });
  },
}));