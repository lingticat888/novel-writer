import { db } from './db';
import type { ResourceLedger, ResourceTransaction } from '@/models';
import { generateId } from '@/utils';

export interface CreateResourceLedgerDTO {
  novelId: string;
  resourceType: string;
}

export interface CreateTransactionDTO {
  resourceId: string;
  amount: number;
  sourceType: 'character' | 'location' | 'event' | 'other';
  sourceId: string;
  targetType: 'character' | 'location' | 'event' | 'other';
  targetId: string;
  chapterId: string;
  note: string;
}

export class ResourceLedgerRepository {
  async findById(id: string): Promise<ResourceLedger | undefined> {
    return db.resourceLedgers.get(id);
  }

  async findByNovelId(novelId: string): Promise<ResourceLedger[]> {
    return db.resourceLedgers.where('novelId').equals(novelId).toArray();
  }

  async findByType(novelId: string, resourceType: string): Promise<ResourceLedger | undefined> {
    return db.resourceLedgers
      .where('novelId')
      .equals(novelId)
      .filter((r) => r.resourceType === resourceType)
      .first();
  }

  async create(data: CreateResourceLedgerDTO): Promise<ResourceLedger> {
    const now = new Date();
    
    const ledger: ResourceLedger = {
      id: generateId(),
      novelId: data.novelId,
      resourceType: data.resourceType,
      totalInflow: 0,
      totalOutflow: 0,
      currentBalance: 0,
      transactions: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.resourceLedgers.add(ledger);
    return ledger;
  }

  async addTransaction(ledgerId: string, data: CreateTransactionDTO): Promise<ResourceTransaction> {
    const ledger = await this.findById(ledgerId);
    if (!ledger) throw new Error('Resource ledger not found');

    const transaction: ResourceTransaction = {
      id: generateId(),
      resourceId: ledgerId,
      amount: data.amount,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      targetType: data.targetType,
      targetId: data.targetId,
      chapterId: data.chapterId,
      note: data.note,
      transactionAt: new Date(),
      createdAt: new Date(),
    };

    const isInflow = data.amount > 0;
    const updateData = {
      transactions: [...ledger.transactions, transaction],
      totalInflow: ledger.totalInflow + (isInflow ? data.amount : 0),
      totalOutflow: ledger.totalOutflow + (isInflow ? 0 : Math.abs(data.amount)),
      currentBalance: ledger.currentBalance + data.amount,
      updatedAt: new Date(),
    };

    await db.resourceLedgers.update(ledgerId, updateData);
    return transaction;
  }

  async delete(id: string): Promise<void> {
    await db.resourceLedgers.delete(id);
  }
}

db.version(3).stores({
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

export const resourceLedgerRepository = new ResourceLedgerRepository();
