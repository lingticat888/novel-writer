import { create } from 'zustand';
import type { ChapterSummary } from '@/models';
import { chapterSummaryRepository, type CreateChapterSummaryDTO } from '@/services/chapterSummaryRepository';

interface ChapterSummaryState {
  summaries: Map<string, ChapterSummary>;
  isLoading: boolean;
  error: string | null;

  loadSummariesByNovelId: (novelId: string) => Promise<void>;
  loadSummaryByChapterId: (chapterId: string) => Promise<ChapterSummary | undefined>;
  saveSummary: (chapterId: string, data: CreateChapterSummaryDTO) => Promise<ChapterSummary>;
  deleteSummary: (chapterId: string) => Promise<void>;
  clearError: () => void;
}

export const useChapterSummaryStore = create<ChapterSummaryState>((set) => ({
  summaries: new Map(),
  isLoading: false,
  error: null,

  loadSummariesByNovelId: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const summaries = await chapterSummaryRepository.findByNovelId(novelId);
      const summariesMap = new Map(summaries.map(s => [s.chapterId, s]));
      set({ summaries: summariesMap, isLoading: false });
    } catch (err) {
      set({ error: '加载章节摘要失败', isLoading: false });
    }
  },

  loadSummaryByChapterId: async (chapterId: string) => {
    set({ error: null });
    try {
      const summary = await chapterSummaryRepository.findByChapterId(chapterId);
      if (summary) {
        set(state => {
          const newMap = new Map(state.summaries);
          newMap.set(chapterId, summary);
          return { summaries: newMap };
        });
      }
      return summary;
    } catch (err) {
      set({ error: '加载章节摘要失败' });
      return undefined;
    }
  },

  saveSummary: async (chapterId: string, data: CreateChapterSummaryDTO) => {
    set({ error: null });
    try {
      const summary = await chapterSummaryRepository.upsert(chapterId, data);
      set(state => {
        const newMap = new Map(state.summaries);
        newMap.set(chapterId, summary);
        return { summaries: newMap };
      });
      return summary;
    } catch (err) {
      set({ error: '保存章节摘要失败' });
      throw err;
    }
  },

  deleteSummary: async (chapterId: string) => {
    set({ error: null });
    try {
      await chapterSummaryRepository.deleteByChapterId(chapterId);
      set(state => {
        const newMap = new Map(state.summaries);
        newMap.delete(chapterId);
        return { summaries: newMap };
      });
    } catch (err) {
      set({ error: '删除章节摘要失败' });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));