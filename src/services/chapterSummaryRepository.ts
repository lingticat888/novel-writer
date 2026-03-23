import { db } from './db';
import type { ChapterSummary, EmotionalType } from '@/models';
import { generateId } from '@/utils';

export interface CreateChapterSummaryDTO {
  chapterId: string;
  coreEvents: string;
  appearingCharacters: string[];
  plotFlags: string[];
  emotionalTone: EmotionalType;
  customNotes: string;
}

export class ChapterSummaryRepository {
  async findById(id: string): Promise<ChapterSummary | undefined> {
    return db.chapterSummaries.get(id);
  }

  async findByChapterId(chapterId: string): Promise<ChapterSummary | undefined> {
    return db.chapterSummaries.where('chapterId').equals(chapterId).first();
  }

  async findByNovelId(novelId: string): Promise<ChapterSummary[]> {
    const chapters = await db.chapters.where('volumeId').anyOf(
      await this.getVolumeIdsByNovelId(novelId)
    ).toArray();
    
    const chapterIds = chapters.map(c => c.id);
    return db.chapterSummaries.where('chapterId').anyOf(chapterIds).toArray();
  }

  private async getVolumeIdsByNovelId(novelId: string): Promise<string[]> {
    const novels = await db.novels.get(novelId);
    if (!novels?.volumes) return [];
    return novels.volumes.map(v => v.id);
  }

  async create(data: CreateChapterSummaryDTO): Promise<ChapterSummary> {
    const now = new Date();
    
    const summary: ChapterSummary = {
      id: generateId(),
      chapterId: data.chapterId,
      coreEvents: data.coreEvents,
      appearingCharacters: data.appearingCharacters,
      plotFlags: data.plotFlags,
      emotionalTone: data.emotionalTone,
      customNotes: data.customNotes,
      createdAt: now,
      updatedAt: now,
    };

    await db.chapterSummaries.add(summary);
    return summary;
  }

  async update(
    id: string,
    data: Partial<CreateChapterSummaryDTO>
  ): Promise<void> {
    await db.chapterSummaries.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async upsert(chapterId: string, data: CreateChapterSummaryDTO): Promise<ChapterSummary> {
    const existing = await this.findByChapterId(chapterId);
    if (existing) {
      await this.update(existing.id, data);
      return { ...existing, ...data, updatedAt: new Date() };
    }
    return this.create(data);
  }

  async delete(id: string): Promise<void> {
    await db.chapterSummaries.delete(id);
  }

  async deleteByChapterId(chapterId: string): Promise<void> {
    const summary = await this.findByChapterId(chapterId);
    if (summary) {
      await db.chapterSummaries.delete(summary.id);
    }
  }
}

export const chapterSummaryRepository = new ChapterSummaryRepository();