import { create } from 'zustand';
import type { UnresolvedPlot, PlotStatus } from '@/models';
import { unresolvedPlotRepository, type CreatePlotDTO } from '@/services/unresolvedPlotRepository';

interface PlotState {
  plots: UnresolvedPlot[];
  filterStatus: PlotStatus | 'all';
  isLoading: boolean;
  error: string | null;

  loadPlots: (novelId: string) => Promise<void>;
  createPlot: (data: CreatePlotDTO) => Promise<UnresolvedPlot>;
  updatePlot: (id: string, data: { content?: string; buriedChapterId?: string }) => Promise<void>;
  resolvePlot: (id: string, chapterId: string, description: string) => Promise<void>;
  invalidatePlot: (id: string) => Promise<void>;
  deletePlot: (id: string) => Promise<void>;
  setFilterStatus: (status: PlotStatus | 'all') => void;
  clearError: () => void;
}

export const usePlotStore = create<PlotState>((set) => ({
  plots: [],
  filterStatus: 'all',
  isLoading: false,
  error: null,

  loadPlots: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const plots = await unresolvedPlotRepository.findByNovelId(novelId);
      set({ plots, isLoading: false });
    } catch (err) {
      set({ error: '加载伏笔失败', isLoading: false });
    }
  },

  createPlot: async (data: CreatePlotDTO) => {
    set({ error: null });
    try {
      const plot = await unresolvedPlotRepository.create(data);
      set((state) => ({
        plots: [...state.plots, plot],
      }));
      return plot;
    } catch (err) {
      set({ error: '创建伏笔失败' });
      throw err;
    }
  },

  updatePlot: async (id: string, data: { content?: string; buriedChapterId?: string }) => {
    set({ error: null });
    try {
      await unresolvedPlotRepository.update(id, data);
      set((state) => ({
        plots: state.plots.map((p) =>
          p.id === id
            ? { ...p, ...data, updatedAt: new Date() }
            : p
        ),
      }));
    } catch (err) {
      set({ error: '更新伏笔失败' });
    }
  },

  resolvePlot: async (id: string, chapterId: string, description: string) => {
    set({ error: null });
    try {
      await unresolvedPlotRepository.resolve(id, chapterId, description);
      set((state) => ({
        plots: state.plots.map((p) =>
          p.id === id
            ? { ...p, status: 'resolved' as PlotStatus, actualResolveChapterId: chapterId, resolveDescription: description, updatedAt: new Date() }
            : p
        ),
      }));
    } catch (err) {
      set({ error: '标记伏笔回收失败' });
    }
  },

  invalidatePlot: async (id: string) => {
    set({ error: null });
    try {
      await unresolvedPlotRepository.invalidate(id);
      set((state) => ({
        plots: state.plots.map((p) =>
          p.id === id
            ? { ...p, status: 'invalidated' as PlotStatus, updatedAt: new Date() }
            : p
        ),
      }));
    } catch (err) {
      set({ error: '标记伏笔失效失败' });
    }
  },

  deletePlot: async (id: string) => {
    set({ error: null });
    try {
      await unresolvedPlotRepository.delete(id);
      set((state) => ({
        plots: state.plots.filter((p) => p.id !== id),
      }));
    } catch (err) {
      set({ error: '删除伏笔失败' });
    }
  },

  setFilterStatus: (status: PlotStatus | 'all') => {
    set({ filterStatus: status });
  },

  clearError: () => {
    set({ error: null });
  },
}));
