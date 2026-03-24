import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isCreateNovelModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  isExportModalOpen: boolean;
  isWorldStatePanelOpen: boolean;
  deleteTargetId: string | null;
  deleteTargetType: 'novel' | 'volume' | 'chapter' | null;

  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  
  openCreateNovelModal: () => void;
  closeCreateNovelModal: () => void;
  
  openDeleteConfirmModal: (id: string, type: 'novel' | 'volume' | 'chapter') => void;
  closeDeleteConfirmModal: () => void;

  openExportModal: () => void;
  closeExportModal: () => void;

  openWorldStatePanel: () => void;
  closeWorldStatePanel: () => void;

  isResourceLedgerPanelOpen: boolean;
  openResourceLedgerPanel: () => void;
  closeResourceLedgerPanel: () => void;

  isPlotTrackerPanelOpen: boolean;
  plotPanelInitialContent: string;
  openPlotTrackerPanel: (initialContent?: string) => void;
  closePlotTrackerPanel: () => void;

  isChapterSummaryPanelOpen: boolean;
  openChapterSummaryPanel: () => void;
  closeChapterSummaryPanel: () => void;

  isSidequestProgressPanelOpen: boolean;
  openSidequestProgressPanel: () => void;
  closeSidequestProgressPanel: () => void;

  isEmotionalArcChartPanelOpen: boolean;
  openEmotionalArcChartPanel: () => void;
  closeEmotionalArcChartPanel: () => void;

  isCharacterInteractionMatrixPanelOpen: boolean;
  openCharacterInteractionMatrixPanel: () => void;
  closeCharacterInteractionMatrixPanel: () => void;

  isCharacterPanelOpen: boolean;
  openCharacterPanel: () => void;
  closeCharacterPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isCreateNovelModalOpen: false,
  isDeleteConfirmModalOpen: false,
  isExportModalOpen: false,
  isWorldStatePanelOpen: false,
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

  openExportModal: () => {
    set({ isExportModalOpen: true });
  },

  closeExportModal: () => {
    set({ isExportModalOpen: false });
  },

  openWorldStatePanel: () => {
    set({ isWorldStatePanelOpen: true });
  },

  closeWorldStatePanel: () => {
    set({ isWorldStatePanelOpen: false });
  },

  isResourceLedgerPanelOpen: false,

  openResourceLedgerPanel: () => {
    set({ isResourceLedgerPanelOpen: true });
  },

  closeResourceLedgerPanel: () => {
    set({ isResourceLedgerPanelOpen: false });
  },

  isPlotTrackerPanelOpen: false,
  plotPanelInitialContent: '',

  openPlotTrackerPanel: (initialContent?: string) => {
    set({ isPlotTrackerPanelOpen: true, plotPanelInitialContent: initialContent || '' });
  },

  closePlotTrackerPanel: () => {
    set({ isPlotTrackerPanelOpen: false, plotPanelInitialContent: '' });
  },

  isChapterSummaryPanelOpen: false,

  openChapterSummaryPanel: () => {
    set({ isChapterSummaryPanelOpen: true });
  },

  closeChapterSummaryPanel: () => {
    set({ isChapterSummaryPanelOpen: false });
  },

  isSidequestProgressPanelOpen: false,

  openSidequestProgressPanel: () => {
    set({ isSidequestProgressPanelOpen: true });
  },

  closeSidequestProgressPanel: () => {
    set({ isSidequestProgressPanelOpen: false });
  },

  isEmotionalArcChartPanelOpen: false,

  openEmotionalArcChartPanel: () => {
    set({ isEmotionalArcChartPanelOpen: true });
  },

  closeEmotionalArcChartPanel: () => {
    set({ isEmotionalArcChartPanelOpen: false });
  },

  isCharacterInteractionMatrixPanelOpen: false,

  openCharacterInteractionMatrixPanel: () => {
    set({ isCharacterInteractionMatrixPanelOpen: true });
  },

  closeCharacterInteractionMatrixPanel: () => {
    set({ isCharacterInteractionMatrixPanelOpen: false });
  },

  isCharacterPanelOpen: false,

  openCharacterPanel: () => {
    set({ isCharacterPanelOpen: true });
  },

  closeCharacterPanel: () => {
    set({ isCharacterPanelOpen: false });
  },
}));
