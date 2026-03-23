import Dexie, { type Table } from 'dexie';
import type { User, Novel, Volume, Chapter, Character } from '@/models';

export class NovelWriterDB extends Dexie {
  users!: Table<User, string>;
  novels!: Table<Novel, string>;
  volumes!: Table<Volume, string>;
  chapters!: Table<Chapter, string>;
  characters!: Table<Character, string>;

  constructor() {
    super('NovelWriterDB');
    this.version(1).stores({
      users: 'id, email',
      novels: 'id, userId, updatedAt',
      volumes: 'id, novelId, order',
      chapters: 'id, volumeId, order',
      characters: 'id, novelId',
    });
  }
}

export const db = new NovelWriterDB();
