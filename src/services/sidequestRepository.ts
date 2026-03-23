import { db } from './db';
import type { SidequestProgress, QuestStatus } from '@/models';
import { generateId } from '@/utils';

export interface CreateSidequestDTO {
  novelId: string;
  title: string;
  description: string;
  relatedChapterIds?: string[];
  relatedPlotIds?: string[];
}

export interface UpdateProgressDTO {
  progress: number;
  note: string;
}

export class SidequestRepository {
  async findById(id: string): Promise<SidequestProgress | undefined> {
    return db.sidequests.get(id);
  }

  async findByNovelId(novelId: string): Promise<SidequestProgress[]> {
    return db.sidequests.where('novelId').equals(novelId).toArray();
  }

  async findByStatus(novelId: string, status: QuestStatus): Promise<SidequestProgress[]> {
    return db.sidequests
      .where('novelId')
      .equals(novelId)
      .filter((q) => q.status === status)
      .toArray();
  }

  async create(data: CreateSidequestDTO): Promise<SidequestProgress> {
    const now = new Date();
    
    const sidequest: SidequestProgress = {
      id: generateId(),
      novelId: data.novelId,
      title: data.title,
      description: data.description,
      progress: 0,
      status: 'in_progress',
      relatedChapterIds: data.relatedChapterIds || [],
      relatedPlotIds: data.relatedPlotIds || [],
      progressHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.sidequests.add(sidequest);
    return sidequest;
  }

  async update(
    id: string,
    data: Partial<Pick<SidequestProgress, 'title' | 'description' | 'relatedChapterIds' | 'relatedPlotIds'>>
  ): Promise<void> {
    await db.sidequests.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async updateProgress(id: string, data: UpdateProgressDTO): Promise<void> {
    const sidequest = await this.findById(id);
    if (!sidequest) throw new Error('Sidequest not found');

    const progressChange = {
      changedAt: new Date(),
      oldProgress: sidequest.progress,
      newProgress: data.progress,
      note: data.note,
    };

    let status: QuestStatus = sidequest.status;
    if (data.progress >= 100) {
      status = 'completed';
    }

    await db.sidequests.update(id, {
      progress: data.progress,
      status,
      progressHistory: [...sidequest.progressHistory, progressChange],
      updatedAt: new Date(),
    });
  }

  async updateStatus(id: string, status: QuestStatus): Promise<void> {
    await db.sidequests.update(id, {
      status,
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.sidequests.delete(id);
  }
}

export const sidequestRepository = new SidequestRepository();