import { db } from './db';
import type { UnresolvedPlot, PlotStatus } from '@/models';
import { generateId } from '@/utils';

export interface CreatePlotDTO {
  novelId: string;
  content: string;
  buriedChapterId: string;
  expectedResolveChapterId?: string;
  relatedCharacterIds?: string[];
}

export class UnresolvedPlotRepository {
  async findById(id: string): Promise<UnresolvedPlot | undefined> {
    return db.unresolvedPlots.get(id);
  }

  async findByNovelId(novelId: string): Promise<UnresolvedPlot[]> {
    return db.unresolvedPlots.where('novelId').equals(novelId).toArray();
  }

  async findByStatus(novelId: string, status: PlotStatus): Promise<UnresolvedPlot[]> {
    return db.unresolvedPlots
      .where('novelId')
      .equals(novelId)
      .filter((p) => p.status === status)
      .toArray();
  }

  async create(data: CreatePlotDTO): Promise<UnresolvedPlot> {
    const now = new Date();
    
    const plot: UnresolvedPlot = {
      id: generateId(),
      novelId: data.novelId,
      content: data.content,
      buriedChapterId: data.buriedChapterId,
      expectedResolveChapterId: data.expectedResolveChapterId,
      actualResolveChapterId: undefined,
      status: 'buried',
      relatedCharacterIds: data.relatedCharacterIds || [],
      resolveDescription: undefined,
      createdAt: now,
      updatedAt: now,
    };

    await db.unresolvedPlots.add(plot);
    return plot;
  }

  async update(
    id: string, 
    data: Partial<Pick<UnresolvedPlot, 'content' | 'buriedChapterId' | 'status' | 'expectedResolveChapterId' | 'actualResolveChapterId' | 'resolveDescription' | 'relatedCharacterIds'>>
  ): Promise<void> {
    await db.unresolvedPlots.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  }

  async resolve(
    id: string,
    resolveChapterId: string,
    description: string
  ): Promise<void> {
    await db.unresolvedPlots.update(id, {
      status: 'resolved',
      actualResolveChapterId: resolveChapterId,
      resolveDescription: description,
      updatedAt: new Date(),
    });
  }

  async invalidate(id: string): Promise<void> {
    await db.unresolvedPlots.update(id, {
      status: 'invalidated',
      updatedAt: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.unresolvedPlots.delete(id);
  }
}

db.version(4).stores({
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

export const unresolvedPlotRepository = new UnresolvedPlotRepository();
