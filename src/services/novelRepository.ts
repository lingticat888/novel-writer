import { db } from './db';
import type { Novel, Volume, Chapter } from '@/models';
import { generateId } from '@/utils';

export interface CreateNovelDTO {
  userId: string;
  title: string;
  description?: string;
}

export class NovelRepository {
  async findById(id: string): Promise<Novel | undefined> {
    return db.novels.get(id);
  }

  async findByUserId(userId: string): Promise<Novel[]> {
    return db.novels
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('updatedAt');
  }

  async create(data: CreateNovelDTO): Promise<Novel> {
    const now = new Date();
    
    const novel: Novel = {
      id: generateId(),
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      volumes: [],
      characters: [],
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: null,
    };

    await db.novels.add(novel);
    return novel;
  }

  async update(id: string, data: Partial<Pick<Novel, 'title' | 'description'>>): Promise<void> {
    await db.novels.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.novels, db.volumes, db.chapters, db.characters], async () => {
      const novel = await db.novels.get(id);
      if (novel) {
        const volumeIds = await db.volumes.where('novelId').equals(id).toArray();
        for (const volume of volumeIds) {
          await db.chapters.where('volumeId').equals(volume.id).delete();
        }
        await db.volumes.where('novelId').equals(id).delete();
        await db.characters.where('novelId').equals(id).delete();
      }
      await db.novels.delete(id);
    });
  }

  async addVolume(novelId: string, title: string): Promise<Volume> {
    const volumes = await db.volumes.where('novelId').equals(novelId).toArray();
    const now = new Date();
    
    const volume: Volume = {
      id: generateId(),
      novelId,
      title,
      order: volumes.length,
      chapters: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.volumes.add(volume);
    await db.novels.update(novelId, { updatedAt: now });
    return volume;
  }

  async updateVolume(volumeId: string, data: Partial<Pick<Volume, 'title' | 'order'>>): Promise<void> {
    await db.volumes.update(volumeId, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async deleteVolume(volumeId: string): Promise<void> {
    await db.transaction('rw', [db.volumes, db.chapters, db.novels], async () => {
      const volume = await db.volumes.get(volumeId);
      if (volume) {
        await db.chapters.where('volumeId').equals(volumeId).delete();
        await db.volumes.delete(volumeId);
        await db.novels.update(volume.novelId, { updatedAt: new Date() });
      }
    });
  }

  async getVolumesByNovelId(novelId: string): Promise<Volume[]> {
    return db.volumes.where('novelId').equals(novelId).sortBy('order');
  }

  async addChapter(volumeId: string, title: string): Promise<Chapter> {
    const chapters = await db.chapters.where('volumeId').equals(volumeId).toArray();
    const volume = await db.volumes.get(volumeId);
    const now = new Date();
    
    const chapter: Chapter = {
      id: generateId(),
      volumeId,
      title,
      content: '',
      order: chapters.length,
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.chapters.add(chapter);
    if (volume) {
      await db.novels.update(volume.novelId, { updatedAt: now });
    }
    return chapter;
  }

  async updateChapter(chapterId: string, data: Partial<Pick<Chapter, 'title' | 'content' | 'order'>>): Promise<void> {
    const chapter = await db.chapters.get(chapterId);
    if (!chapter) return;

    let wordCount = chapter.wordCount;
    if (data.content !== undefined && data.content !== chapter.content) {
      wordCount = this.countWords(data.content);
    }

    await db.chapters.update(chapterId, {
      ...data,
      wordCount,
      updatedAt: new Date(),
    });

    const volume = await db.volumes.get(chapter.volumeId);
    if (volume) {
      await db.novels.update(volume.novelId, { updatedAt: new Date() });
    }
  }

  async deleteChapter(chapterId: string): Promise<void> {
    const chapter = await db.chapters.get(chapterId);
    if (!chapter) return;

    await db.transaction('rw', [db.chapters, db.volumes, db.novels], async () => {
      const volume = await db.volumes.get(chapter.volumeId);
      await db.chapters.delete(chapterId);
      if (volume) {
        await db.novels.update(volume.novelId, { updatedAt: new Date() });
      }
    });
  }

  async getChapterById(chapterId: string): Promise<Chapter | undefined> {
    return db.chapters.get(chapterId);
  }

  async getChaptersByVolumeId(volumeId: string): Promise<Chapter[]> {
    return db.chapters.where('volumeId').equals(volumeId).sortBy('order');
  }

  async getFullNovel(novelId: string): Promise<Novel | undefined> {
    const novel = await db.novels.get(novelId);
    if (!novel) return undefined;

    const volumes = await this.getVolumesByNovelId(novelId);
    for (const volume of volumes) {
      volume.chapters = await this.getChaptersByVolumeId(volume.id);
    }
    novel.volumes = volumes;

    return novel;
  }

  private countWords(text: string): number {
    const cleaned = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return 0;
    const chineseChars = cleaned.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = cleaned.match(/[a-zA-Z]+/g) || [];
    return chineseChars.length + englishWords.length;
  }
}

export const novelRepository = new NovelRepository();
