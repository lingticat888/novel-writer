import { create } from 'zustand';
import type { CharacterInteraction, RelationshipType } from '@/models';
import { characterInteractionRepository, type CreateInteractionDTO, type AddInteractionEventDTO } from '@/services/characterInteractionRepository';

interface CharacterInteractionState {
  interactions: CharacterInteraction[];
  selectedInteractionId: string | null;
  isLoading: boolean;
  error: string | null;

  loadInteractions: (novelId: string) => Promise<void>;
  createInteraction: (data: CreateInteractionDTO) => Promise<CharacterInteraction>;
  updateRelationshipType: (id: string, relationshipType: RelationshipType) => Promise<void>;
  addEvent: (interactionId: string, data: AddInteractionEventDTO) => Promise<void>;
  deleteEvent: (interactionId: string, eventId: string) => Promise<void>;
  deleteInteraction: (id: string) => Promise<void>;
  selectInteraction: (id: string | null) => void;
  getInteraction: (characterAId: string, characterBId: string) => CharacterInteraction | undefined;
  clearError: () => void;
}

export const useCharacterInteractionStore = create<CharacterInteractionState>((set, get) => ({
  interactions: [],
  selectedInteractionId: null,
  isLoading: false,
  error: null,

  loadInteractions: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const interactions = await characterInteractionRepository.findByNovelId(novelId);
      set({ interactions, isLoading: false });
    } catch (err) {
      set({ error: '加载角色交互失败', isLoading: false });
    }
  },

  createInteraction: async (data: CreateInteractionDTO) => {
    set({ error: null });
    try {
      const existing = await characterInteractionRepository.findByCharacters(
        data.novelId,
        data.characterAId,
        data.characterBId
      );
      if (existing) {
        set({ error: '这两个角色之间已经存在交互关系' });
        return existing;
      }

      const interaction = await characterInteractionRepository.create(data);
      set((state) => ({
        interactions: [...state.interactions, interaction],
        selectedInteractionId: interaction.id,
      }));
      return interaction;
    } catch (err) {
      set({ error: '创建角色交互失败' });
      throw err;
    }
  },

  updateRelationshipType: async (id, relationshipType) => {
    set({ error: null });
    try {
      await characterInteractionRepository.updateRelationshipType(id, relationshipType);
      set((state) => ({
        interactions: state.interactions.map((i) =>
          i.id === id ? { ...i, relationshipType, updatedAt: new Date() } : i
        ),
      }));
    } catch (err) {
      set({ error: '更新关系类型失败' });
    }
  },

  addEvent: async (interactionId, data) => {
    set({ error: null });
    try {
      const updatedInteraction = await characterInteractionRepository.addEvent(interactionId, data);
      set((state) => ({
        interactions: state.interactions.map((i) =>
          i.id === interactionId ? updatedInteraction : i
        ),
      }));
    } catch (err) {
      set({ error: '添加交互事件失败' });
    }
  },

  deleteEvent: async (interactionId, eventId) => {
    set({ error: null });
    try {
      const updatedInteraction = await characterInteractionRepository.deleteEvent(interactionId, eventId);
      set((state) => ({
        interactions: state.interactions.map((i) =>
          i.id === interactionId ? updatedInteraction : i
        ),
      }));
    } catch (err) {
      set({ error: '删除交互事件失败' });
    }
  },

  deleteInteraction: async (id) => {
    set({ error: null });
    try {
      await characterInteractionRepository.delete(id);
      set((state) => ({
        interactions: state.interactions.filter((i) => i.id !== id),
        selectedInteractionId: state.selectedInteractionId === id ? null : state.selectedInteractionId,
      }));
    } catch (err) {
      set({ error: '删除角色交互失败' });
    }
  },

  selectInteraction: (id) => {
    set({ selectedInteractionId: id });
  },

  getInteraction: (characterAId, characterBId) => {
    return get().interactions.find(
      (i) =>
        (i.characterAId === characterAId && i.characterBId === characterBId) ||
        (i.characterAId === characterBId && i.characterBId === characterAId)
    );
  },

  clearError: () => {
    set({ error: null });
  },
}));