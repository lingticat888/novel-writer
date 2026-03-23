import { db } from './db';
import type { CharacterInteraction, InteractionEvent, RelationshipType } from '@/models';
import { generateId } from '@/utils';

export interface CreateInteractionDTO {
  novelId: string;
  characterAId: string;
  characterBId: string;
  relationshipType: RelationshipType;
}

export interface AddInteractionEventDTO {
  eventType: string;
  chapterId: string;
  description: string;
}

export class CharacterInteractionRepository {
  async findById(id: string): Promise<CharacterInteraction | undefined> {
    return db.characterInteractions.get(id);
  }

  async findByNovelId(novelId: string): Promise<CharacterInteraction[]> {
    return db.characterInteractions.where('novelId').equals(novelId).toArray();
  }

  async findByCharacters(novelId: string, characterAId: string, characterBId: string): Promise<CharacterInteraction | undefined> {
    const interactions = await db.characterInteractions.where('novelId').equals(novelId).toArray();
    return interactions.find(
      (i) =>
        (i.characterAId === characterAId && i.characterBId === characterBId) ||
        (i.characterAId === characterBId && i.characterBId === characterAId)
    );
  }

  async findByCharacter(novelId: string, characterId: string): Promise<CharacterInteraction[]> {
    const interactions = await db.characterInteractions.where('novelId').equals(novelId).toArray();
    return interactions.filter(
      (i) => i.characterAId === characterId || i.characterBId === characterId
    );
  }

  async create(data: CreateInteractionDTO): Promise<CharacterInteraction> {
    const now = new Date();
    
    const interaction: CharacterInteraction = {
      id: generateId(),
      novelId: data.novelId,
      characterAId: data.characterAId,
      characterBId: data.characterBId,
      relationshipType: data.relationshipType,
      events: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.characterInteractions.add(interaction);
    return interaction;
  }

  async updateRelationshipType(id: string, relationshipType: RelationshipType): Promise<void> {
    await db.characterInteractions.update(id, {
      relationshipType,
      updatedAt: new Date(),
    });
  }

  async addEvent(interactionId: string, data: AddInteractionEventDTO): Promise<CharacterInteraction> {
    const interaction = await this.findById(interactionId);
    if (!interaction) throw new Error('Interaction not found');

    const event: InteractionEvent = {
      id: generateId(),
      interactionId,
      eventType: data.eventType,
      chapterId: data.chapterId,
      description: data.description,
      createdAt: new Date(),
    };

    const updatedInteraction: CharacterInteraction = {
      ...interaction,
      events: [...interaction.events, event],
      updatedAt: new Date(),
    };

    await db.characterInteractions.put(updatedInteraction);
    return updatedInteraction;
  }

  async deleteEvent(interactionId: string, eventId: string): Promise<CharacterInteraction> {
    const interaction = await this.findById(interactionId);
    if (!interaction) throw new Error('Interaction not found');

    const updatedInteraction: CharacterInteraction = {
      ...interaction,
      events: interaction.events.filter((e) => e.id !== eventId),
      updatedAt: new Date(),
    };

    await db.characterInteractions.put(updatedInteraction);
    return updatedInteraction;
  }

  async delete(id: string): Promise<void> {
    await db.characterInteractions.delete(id);
  }

  async deleteByNovelId(novelId: string): Promise<void> {
    await db.characterInteractions.where('novelId').equals(novelId).delete();
  }
}

export const characterInteractionRepository = new CharacterInteractionRepository();