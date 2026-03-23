import { db } from './db';
import type { Character } from '@/models';
import { generateId } from '@/utils';

export interface CreateCharacterDTO {
  novelId: string;
  name: string;
  gender?: string;
  age?: string;
  appearance?: string;
  personality?: string;
  background?: string;
}

export class CharacterRepository {
  async findById(id: string): Promise<Character | undefined> {
    return db.characters.get(id);
  }

  async findByNovelId(novelId: string): Promise<Character[]> {
    return db.characters.where('novelId').equals(novelId).toArray();
  }

  async create(data: CreateCharacterDTO): Promise<Character> {
    const now = new Date();
    
    const character: Character = {
      id: generateId(),
      novelId: data.novelId,
      name: data.name,
      gender: data.gender,
      age: data.age,
      appearance: data.appearance,
      personality: data.personality,
      background: data.background,
      createdAt: now,
      updatedAt: now,
    };

    await db.characters.add(character);
    return character;
  }

  async update(id: string, data: Partial<Omit<Character, 'id' | 'novelId' | 'createdAt'>>): Promise<void> {
    await db.characters.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.characters.delete(id);
  }
}

export const characterRepository = new CharacterRepository();
