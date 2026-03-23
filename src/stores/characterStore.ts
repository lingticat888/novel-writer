import { create } from 'zustand';
import type { Character } from '@/models';
import { characterRepository, type CreateCharacterDTO } from '@/services/characterRepository';

interface CharacterState {
  characters: Character[];
  selectedCharacterId: string | null;
  isLoading: boolean;
  error: string | null;

  loadCharacters: (novelId: string) => Promise<void>;
  createCharacter: (data: CreateCharacterDTO) => Promise<Character>;
  updateCharacter: (id: string, data: Partial<Omit<Character, 'id' | 'novelId' | 'createdAt'>>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  selectCharacter: (id: string | null) => void;
  clearError: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  characters: [],
  selectedCharacterId: null,
  isLoading: false,
  error: null,

  loadCharacters: async (novelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const characters = await characterRepository.findByNovelId(novelId);
      set({ characters, isLoading: false });
    } catch (err) {
      set({ error: '加载角色列表失败', isLoading: false });
    }
  },

  createCharacter: async (data: CreateCharacterDTO) => {
    set({ error: null });
    try {
      const character = await characterRepository.create(data);
      set((state) => ({
        characters: [...state.characters, character],
      }));
      return character;
    } catch (err) {
      set({ error: '创建角色失败' });
      throw err;
    }
  },

  updateCharacter: async (id, data) => {
    set({ error: null });
    try {
      await characterRepository.update(id, data);
      set((state) => ({
        characters: state.characters.map((c) =>
          c.id === id ? { ...c, ...data, updatedAt: new Date() } : c
        ),
      }));
    } catch (err) {
      set({ error: '更新角色失败' });
    }
  },

  deleteCharacter: async (id) => {
    set({ error: null });
    try {
      await characterRepository.delete(id);
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId,
      }));
    } catch (err) {
      set({ error: '删除角色失败' });
    }
  },

  selectCharacter: (id) => {
    set({ selectedCharacterId: id });
  },

  clearError: () => {
    set({ error: null });
  },
}));