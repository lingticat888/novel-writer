import { db } from './db';
import type { WorldState, WorldCategory, StatusChange } from '@/models';
import { generateId } from '@/utils';

export interface CreateWorldStateDTO {
  novelId: string;
  category: WorldCategory;
  name: string;
  description: string;
  attributes?: Record<string, string>;
}

export class WorldStateRepository {
  async findById(id: string): Promise<WorldState | undefined> {
    return db.worldStates.get(id);
  }

  async findByNovelId(novelId: string): Promise<WorldState[]> {
    return db.worldStates.where('novelId').equals(novelId).toArray();
  }

  async findByCategory(novelId: string, category: WorldCategory): Promise<WorldState[]> {
    return db.worldStates
      .where('novelId')
      .equals(novelId)
      .filter((ws) => ws.category === category)
      .toArray();
  }

  async create(data: CreateWorldStateDTO): Promise<WorldState> {
    const now = new Date();
    
    const worldState: WorldState = {
      id: generateId(),
      novelId: data.novelId,
      category: data.category,
      name: data.name,
      description: data.description,
      attributes: data.attributes || {},
      relatedCharacters: [],
      relatedChapters: [],
      statusHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.worldStates.add(worldState);
    return worldState;
  }

  async update(
    id: string, 
    data: Partial<Pick<WorldState, 'name' | 'description' | 'attributes' | 'relatedCharacters' | 'relatedChapters'>> & { newStatus?: string; statusNote?: string }
  ): Promise<void> {
    const worldState = await this.findById(id);
    if (!worldState) return;

    let statusHistory = worldState.statusHistory;
    
    if (data.newStatus) {
      statusHistory = [
        ...statusHistory,
        {
          changedAt: new Date(),
          oldStatus: worldState.category,
          newStatus: data.newStatus,
          note: data.statusNote || '',
        } as StatusChange,
      ];
    }

    await db.worldStates.update(id, {
      name: data.name,
      description: data.description,
      attributes: data.attributes,
      relatedCharacters: data.relatedCharacters,
      relatedChapters: data.relatedChapters,
      statusHistory,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.worldStates.delete(id);
  }
}

export const worldStateRepository = new WorldStateRepository();
