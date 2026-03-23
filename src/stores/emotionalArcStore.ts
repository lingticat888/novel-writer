import { create } from 'zustand';
import type { EmotionalArc } from '@/models';
import { emotionalArcRepository, type CreateEmotionalArcDTO, type AddEmotionalPointDTO } from '@/services/emotionalArcRepository';

interface EmotionalArcState {
  arcs: EmotionalArc[];
  selectedArcId: string | null;
  isLoading: boolean;
  error: string | null;

  loadArcs: (novelId: string) => Promise<void>;
  createArc: (data: CreateEmotionalArcDTO) => Promise<EmotionalArc>;
  addPoint: (arcId: string, data: AddEmotionalPointDTO) => Promise<void>;
  updatePoint: (arcId: string, pointId: string, data: Partial<AddEmotionalPointDTO>) => Promise<void>;
  deletePoint: (arcId: string, pointId: string) => Promise<void>;
  deleteArc: (id: string) => Promise<void>;
  selectArc: (id: string | null) => void;
  clearError: () => void;
}

export const useEmotionalArcStore = create<EmotionalArcState>((set) => ({
  arcs: [],
  selectedArcId: null,
  isLoading: false,
  error: null,

  loadArcs: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const arcs = await emotionalArcRepository.findByNovelId(novelId);
      set({ arcs, isLoading: false });
    } catch (err) {
      set({ error: '加载情感弧度失败', isLoading: false });
    }
  },

  createArc: async (data: CreateEmotionalArcDTO) => {
    set({ error: null });
    try {
      const arc = await emotionalArcRepository.create(data);
      set((state) => ({
        arcs: [...state.arcs, arc],
        selectedArcId: arc.id,
      }));
      return arc;
    } catch (err) {
      set({ error: '创建情感弧度失败' });
      throw err;
    }
  },

  addPoint: async (arcId, data) => {
    set({ error: null });
    try {
      const updatedArc = await emotionalArcRepository.addPoint(arcId, data);
      set((state) => ({
        arcs: state.arcs.map((a) => (a.id === arcId ? updatedArc : a)),
      }));
    } catch (err) {
      set({ error: '添加情感点失败' });
    }
  },

  updatePoint: async (arcId, pointId, data) => {
    set({ error: null });
    try {
      const updatedArc = await emotionalArcRepository.updatePoint(arcId, pointId, data);
      set((state) => ({
        arcs: state.arcs.map((a) => (a.id === arcId ? updatedArc : a)),
      }));
    } catch (err) {
      set({ error: '更新情感点失败' });
    }
  },

  deletePoint: async (arcId, pointId) => {
    set({ error: null });
    try {
      const updatedArc = await emotionalArcRepository.deletePoint(arcId, pointId);
      set((state) => ({
        arcs: state.arcs.map((a) => (a.id === arcId ? updatedArc : a)),
      }));
    } catch (err) {
      set({ error: '删除情感点失败' });
    }
  },

  deleteArc: async (id) => {
    set({ error: null });
    try {
      await emotionalArcRepository.delete(id);
      set((state) => ({
        arcs: state.arcs.filter((a) => a.id !== id),
        selectedArcId: state.selectedArcId === id ? null : state.selectedArcId,
      }));
    } catch (err) {
      set({ error: '删除情感弧度失败' });
    }
  },

  selectArc: (id) => {
    set({ selectedArcId: id });
  },

  clearError: () => {
    set({ error: null });
  },
}));