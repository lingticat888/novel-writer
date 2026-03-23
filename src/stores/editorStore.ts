import { create } from 'zustand';

interface EditorState {
  content: string;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;

  setContent: (content: string) => void;
  setSaving: (isSaving: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  markClean: () => void;
  markDirty: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  isSaving: false,
  lastSavedAt: null,
  isDirty: false,

  setContent: (content: string) => {
    set({ content, isDirty: true });
  },

  setSaving: (isSaving: boolean) => {
    set({ isSaving });
  },

  setLastSavedAt: (date: Date) => {
    set({ lastSavedAt: date, isDirty: false });
  },

  markClean: () => {
    set({ isDirty: false });
  },

  markDirty: () => {
    set({ isDirty: true });
  },
}));
