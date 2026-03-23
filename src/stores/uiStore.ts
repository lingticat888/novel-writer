import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isCreateNovelModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  deleteTargetId: string | null;
  deleteTargetType: 'novel' | 'volume' | 'chapter' | null;

  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  
  openCreateNovelModal: () => void;
  closeCreateNovelModal: () => void;
  
  openDeleteConfirmModal: (id: string, type: 'novel' | 'volume' | 'chapter') => void;
  closeDeleteConfirmModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isCreateNovelModalOpen: false,
  isDeleteConfirmModalOpen: false,
  deleteTargetId: null,
  deleteTargetType: null,

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  openSidebar: () => {
    set({ isSidebarOpen: true });
  },

  closeSidebar: () => {
    set({ isSidebarOpen: false });
  },

  openCreateNovelModal: () => {
    set({ isCreateNovelModalOpen: true });
  },

  closeCreateNovelModal: () => {
    set({ isCreateNovelModalOpen: false });
  },

  openDeleteConfirmModal: (id: string, type: 'novel' | 'volume' | 'chapter') => {
    set({ 
      isDeleteConfirmModalOpen: true, 
      deleteTargetId: id, 
      deleteTargetType: type 
    });
  },

  closeDeleteConfirmModal: () => {
    set({ 
      isDeleteConfirmModalOpen: false, 
      deleteTargetId: null, 
      deleteTargetType: null 
    });
  },
}));
