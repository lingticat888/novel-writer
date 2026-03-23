import { create } from 'zustand';
import type { Novel, Volume, Chapter } from '@/models';
import { novelRepository, type CreateNovelDTO } from '@/services';

interface NovelState {
  novels: Novel[];
  currentNovel: Novel | null;
  currentVolume: Volume | null;
  currentChapter: Chapter | null;
  volumes: Volume[];
  isLoading: boolean;
  error: string | null;

  loadNovels: (userId: string) => Promise<void>;
  loadNovel: (novelId: string) => Promise<void>;
  createNovel: (data: CreateNovelDTO) => Promise<Novel>;
  deleteNovel: (novelId: string) => Promise<void>;
  updateNovel: (novelId: string, data: Partial<Pick<Novel, 'title' | 'description'>>) => Promise<void>;

  addVolume: (novelId: string, title: string) => Promise<Volume>;
  updateVolume: (volumeId: string, data: Partial<Pick<Volume, 'title' | 'order'>>) => Promise<void>;
  deleteVolume: (volumeId: string) => Promise<void>;
  selectVolume: (volume: Volume | null) => void;

  addChapter: (volumeId: string, title: string) => Promise<Chapter>;
  updateChapter: (chapterId: string, data: Partial<Pick<Chapter, 'title' | 'content' | 'order'>>) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  selectChapter: (chapter: Chapter | null) => void;

  clearError: () => void;
}

export const useNovelStore = create<NovelState>((set) => ({
  novels: [],
  currentNovel: null,
  currentVolume: null,
  currentChapter: null,
  volumes: [],
  isLoading: false,
  error: null,

  loadNovels: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const novels = await novelRepository.findByUserId(userId);
      set({ novels, isLoading: false });
    } catch (error) {
      set({ error: '加载作品列表失败', isLoading: false });
    }
  },

  loadNovel: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const novel = await novelRepository.getFullNovel(novelId);
      if (novel) {
        set({ 
          currentNovel: novel, 
          volumes: novel.volumes || [],
          isLoading: false 
        });
      } else {
        set({ error: '作品不存在', isLoading: false });
      }
    } catch (error) {
      set({ error: '加载作品失败', isLoading: false });
    }
  },

  createNovel: async (data: CreateNovelDTO) => {
    set({ isLoading: true, error: null });
    try {
      const novel = await novelRepository.create(data);
      set((state) => ({
        novels: [novel, ...state.novels],
        isLoading: false,
      }));
      return novel;
    } catch (error) {
      set({ error: '创建作品失败', isLoading: false });
      throw error;
    }
  },

  deleteNovel: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      await novelRepository.delete(novelId);
      set((state) => ({
        novels: state.novels.filter((n) => n.id !== novelId),
        currentNovel: state.currentNovel?.id === novelId ? null : state.currentNovel,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: '删除作品失败', isLoading: false });
    }
  },

  updateNovel: async (novelId: string, data: Partial<Pick<Novel, 'title' | 'description'>>) => {
    try {
      await novelRepository.update(novelId, data);
      set((state) => ({
        novels: state.novels.map((n) =>
          n.id === novelId ? { ...n, ...data, updatedAt: new Date() } : n
        ),
        currentNovel: state.currentNovel?.id === novelId
          ? { ...state.currentNovel, ...data, updatedAt: new Date() }
          : state.currentNovel,
      }));
    } catch (error) {
      set({ error: '更新作品失败' });
    }
  },

  addVolume: async (novelId: string, title: string) => {
    try {
      const volume = await novelRepository.addVolume(novelId, title);
      set((state) => ({
        volumes: [...state.volumes, volume],
      }));
      return volume;
    } catch (error) {
      set({ error: '添加卷失败' });
      throw error;
    }
  },

  updateVolume: async (volumeId: string, data: Partial<Pick<Volume, 'title' | 'order'>>) => {
    try {
      await novelRepository.updateVolume(volumeId, data);
      set((state) => ({
        volumes: state.volumes.map((v) =>
          v.id === volumeId ? { ...v, ...data, updatedAt: new Date() } : v
        ),
        currentVolume: state.currentVolume?.id === volumeId
          ? { ...state.currentVolume, ...data, updatedAt: new Date() }
          : state.currentVolume,
      }));
    } catch (error) {
      set({ error: '更新卷失败' });
    }
  },

  deleteVolume: async (volumeId: string) => {
    try {
      await novelRepository.deleteVolume(volumeId);
      set((state) => ({
        volumes: state.volumes.filter((v) => v.id !== volumeId),
        currentVolume: state.currentVolume?.id === volumeId ? null : state.currentVolume,
      }));
    } catch (error) {
      set({ error: '删除卷失败' });
    }
  },

  selectVolume: (volume: Volume | null) => {
    set({ currentVolume: volume });
  },

  addChapter: async (volumeId: string, title: string) => {
    try {
      const chapter = await novelRepository.addChapter(volumeId, title);
      set((state) => ({
        volumes: state.volumes.map((v) =>
          v.id === volumeId
            ? { ...v, chapters: [...(v.chapters || []), chapter] }
            : v
        ),
      }));
      return chapter;
    } catch (error) {
      set({ error: '添加章节失败' });
      throw error;
    }
  },

  updateChapter: async (chapterId: string, data: Partial<Pick<Chapter, 'title' | 'content' | 'order'>>) => {
    try {
      await novelRepository.updateChapter(chapterId, data);
      set((state) => {
        const updatedChapters = state.volumes.map((v) => ({
          ...v,
          chapters: v.chapters?.map((c) =>
            c.id === chapterId ? { ...c, ...data, updatedAt: new Date() } : c
          ),
        }));
        return {
          volumes: updatedChapters,
          currentChapter: state.currentChapter?.id === chapterId
            ? { ...state.currentChapter, ...data, updatedAt: new Date() }
            : state.currentChapter,
        };
      });
    } catch (error) {
      set({ error: '更新章节失败' });
    }
  },

  deleteChapter: async (chapterId: string) => {
    try {
      await novelRepository.deleteChapter(chapterId);
      set((state) => ({
        volumes: state.volumes.map((v) => ({
          ...v,
          chapters: v.chapters?.filter((c) => c.id !== chapterId),
        })),
        currentChapter: state.currentChapter?.id === chapterId ? null : state.currentChapter,
      }));
    } catch (error) {
      set({ error: '删除章节失败' });
    }
  },

  selectChapter: (chapter: Chapter | null) => {
    set({ currentChapter: chapter });
  },

  clearError: () => {
    set({ error: null });
  },
}));
