import Dexie, { type Table } from 'dexie';
import type { User, Novel, Volume, Chapter, Character, WorldState, ResourceLedger, UnresolvedPlot, ChapterSummary } from '@/models';

export class NovelWriterDB extends Dexie {
  users!: Table<User, string>;
  novels!: Table<Novel, string>;
  volumes!: Table<Volume, string>;
  chapters!: Table<Chapter, string>;
  characters!: Table<Character, string>;
  worldStates!: Table<WorldState, string>;
  resourceLedgers!: Table<ResourceLedger, string>;
  unresolvedPlots!: Table<UnresolvedPlot, string>;
  chapterSummaries!: Table<ChapterSummary, string>;

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
      resourceTransactions: 'id, resourceId, chapterId',
    });
    this.version(4).stores({
      users: 'id, email',
      novels: 'id, userId, updatedAt',
      volumes: 'id, novelId, order',
      chapters: 'id, volumeId, order',
      characters: 'id, novelId',
      passwords: 'userId',
      worldStates: 'id, novelId, category',
      resourceLedgers: 'id, novelId',
      resourceTransactions: 'id, resourceId, chapterId',
      unresolvedPlots: 'id, novelId, status',
    });
    this.version(5).stores({
      users: 'id, email',
      novels: 'id, userId, updatedAt',
      volumes: 'id, novelId, order',
      chapters: 'id, volumeId, order',
      characters: 'id, novelId',
      passwords: 'userId',
      worldStates: 'id, novelId, category',
      resourceLedgers: 'id, novelId',
      resourceTransactions: 'id, resourceId, chapterId',
      unresolvedPlots: 'id, novelId, status',
      chapterSummaries: 'id, chapterId',
    });
  }
}

export const db = new NovelWriterDB();
