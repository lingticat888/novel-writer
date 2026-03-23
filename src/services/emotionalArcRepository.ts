import { db } from './db';
import type { EmotionalArc, EmotionalPoint, EmotionalType } from '@/models';
import { generateId } from '@/utils';

export interface CreateEmotionalArcDTO {
  novelId: string;
  targetType: 'novel' | 'character';
  targetId?: string;
}

export interface AddEmotionalPointDTO {
  chapterId: string;
  emotion: EmotionalType;
  intensity: number;
  note: string;
}

export class EmotionalArcRepository {
  async findById(id: string): Promise<EmotionalArc | undefined> {
    return db.emotionalArcs.get(id);
  }

  async findByNovelId(novelId: string): Promise<EmotionalArc[]> {
    return db.emotionalArcs.where('novelId').equals(novelId).toArray();
  }

  async findByTarget(novelId: string, targetType: 'novel' | 'character', targetId?: string): Promise<EmotionalArc | undefined> {
    const arcs = await db.emotionalArcs
      .where('novelId')
      .equals(novelId)
      .filter((arc) => arc.targetType === targetType && arc.targetId === targetId)
      .first();
    return arcs;
  }

  async create(data: CreateEmotionalArcDTO): Promise<EmotionalArc> {
    const now = new Date();
    
    const arc: EmotionalArc = {
      id: generateId(),
      novelId: data.novelId,
      targetType: data.targetType,
      targetId: data.targetId,
      points: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.emotionalArcs.add(arc);
    return arc;
  }

  async addPoint(arcId: string, data: AddEmotionalPointDTO): Promise<EmotionalArc> {
    const arc = await this.findById(arcId);
    if (!arc) throw new Error('EmotionalArc not found');

    const point: EmotionalPoint = {
      id: generateId(),
      arcId,
      chapterId: data.chapterId,
      emotion: data.emotion,
      intensity: data.intensity,
      note: data.note,
      createdAt: new Date(),
    };

    const updatedArc: EmotionalArc = {
      ...arc,
      points: [...arc.points, point],
      updatedAt: new Date(),
    };

    await db.emotionalArcs.put(updatedArc);
    return updatedArc;
  }

  async updatePoint(arcId: string, pointId: string, data: Partial<AddEmotionalPointDTO>): Promise<EmotionalArc> {
    const arc = await this.findById(arcId);
    if (!arc) throw new Error('EmotionalArc not found');

    const updatedPoints = arc.points.map((p) =>
      p.id === pointId ? { ...p, ...data } : p
    );

    const updatedArc: EmotionalArc = {
      ...arc,
      points: updatedPoints,
      updatedAt: new Date(),
    };

    await db.emotionalArcs.put(updatedArc);
    return updatedArc;
  }

  async deletePoint(arcId: string, pointId: string): Promise<EmotionalArc> {
    const arc = await this.findById(arcId);
    if (!arc) throw new Error('EmotionalArc not found');

    const updatedArc: EmotionalArc = {
      ...arc,
      points: arc.points.filter((p) => p.id !== pointId),
      updatedAt: new Date(),
    };

    await db.emotionalArcs.put(updatedArc);
    return updatedArc;
  }

  async delete(id: string): Promise<void> {
    await db.emotionalArcs.delete(id);
  }

  async deleteByNovelId(novelId: string): Promise<void> {
    await db.emotionalArcs.where('novelId').equals(novelId).delete();
  }
}

export const emotionalArcRepository = new EmotionalArcRepository();