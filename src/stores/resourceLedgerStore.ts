import { create } from 'zustand';
import type { ResourceLedger } from '@/models';
import { resourceLedgerRepository, type CreateResourceLedgerDTO, type CreateTransactionDTO } from '@/services/resourceLedgerRepository';

interface ResourceLedgerState {
  resources: ResourceLedger[];
  isLoading: boolean;
  error: string | null;

  loadResources: (novelId: string) => Promise<void>;
  createResource: (data: CreateResourceLedgerDTO) => Promise<ResourceLedger>;
  addTransaction: (ledgerId: string, data: CreateTransactionDTO) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useResourceLedgerStore = create<ResourceLedgerState>((set) => ({
  resources: [],
  isLoading: false,
  error: null,

  loadResources: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const resources = await resourceLedgerRepository.findByNovelId(novelId);
      set({ resources, isLoading: false });
    } catch (err) {
      set({ error: '加载资源失败', isLoading: false });
    }
  },

  createResource: async (data: CreateResourceLedgerDTO) => {
    set({ error: null });
    try {
      const resource = await resourceLedgerRepository.create(data);
      set((state) => ({
        resources: [...state.resources, resource],
      }));
      return resource;
    } catch (err) {
      set({ error: '创建资源失败' });
      throw err;
    }
  },

  addTransaction: async (ledgerId: string, data: CreateTransactionDTO) => {
    set({ error: null });
    try {
      await resourceLedgerRepository.addTransaction(ledgerId, data);
      const resources = await resourceLedgerRepository.findByNovelId(data.chapterId ? 
        (await resourceLedgerRepository.findById(ledgerId))?.novelId || '' : '');
      set((state) => ({
        resources: state.resources.map((r) => {
          const updated = resources.find((u) => u.id === ledgerId);
          return updated || r;
        }),
      }));
    } catch (err) {
      set({ error: '添加交易记录失败' });
    }
  },

  deleteResource: async (id: string) => {
    set({ error: null });
    try {
      await resourceLedgerRepository.delete(id);
      set((state) => ({
        resources: state.resources.filter((r) => r.id !== id),
      }));
    } catch (err) {
      set({ error: '删除资源失败' });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
