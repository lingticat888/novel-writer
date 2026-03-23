import Dexie, { type Table } from 'dexie';
import type { User, Novel, Volume, Chapter, Character, WorldState, ResourceLedger } from '@/models';

export class NovelWriterDB extends Dexie {
  users!: Table<User, string>;
  novels!: Table<Novel, string>;
  volumes!: Table<Volume, string>;
  chapters!: Table<Chapter, string>;
  characters!: Table<Character, string>;
  worldStates!: Table<WorldState, string>;
  resourceLedgers!: Table<ResourceLedger, string>;

  constructor() {
    super('NovelWriterDB');
    this.version(1).stores({
      users: 'id, email',
      novels: 'id, userId, updatedAt',
      volumes: 'id, novelId, order',
      chapters: 'id, volumeId, order',
      characters: 'id, novelId',
    });
    this.version(2).stores({
      users: 'id, email',
      novels: 'id, userId, updatedAt',
      volumes: 'id, novelId, order',
      chapters: 'id, volumeId, order',
      characters: 'id, novelId',
      passwords: 'userId',
      worldStates: 'id, novelId, category',
    });
    this.version(3).stores({
      users: 'id, email',
      novels: 'id, userId, updatedAt',
      volumes: 'id, novelId, order',
      chapters: 'id, volumeId, order',
      characters: 'id, novelId',
      passwords: 'userId',
      worldStates: 'id, novelId, category',
      resourceLedgers: 'id, novelId',
    });
  }
}

export const db = new NovelWriterDB();
