import type { Novel } from '@/models';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

export interface SyncConflict {
  localVersion: Novel;
  remoteVersion: Novel;
  conflictedAt: Date;
}

export interface SyncResult {
  success: boolean;
  updatedNovel: Novel | null;
  conflicts: SyncConflict[];
}

export interface SyncServiceConfig {
  apiBaseUrl: string;
  authToken?: string;
}

export class SyncService {
  private config: SyncServiceConfig | null = null;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  };

  configure(config: SyncServiceConfig): void {
    this.config = config;
  }

  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async checkConnection(): Promise<boolean> {
    if (!this.config?.apiBaseUrl) {
      return false;
    }
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async syncNovel(novel: Novel): Promise<SyncResult> {
    if (!this.config) {
      return {
        success: false,
        updatedNovel: null,
        conflicts: [],
      };
    }

    this.syncStatus = {
      ...this.syncStatus,
      isSyncing: true,
      error: null,
    };

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/novels/${novel.id}/sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          novel,
          lastSyncedAt: novel.lastSyncedAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      this.syncStatus = {
        isSyncing: false,
        lastSyncedAt: new Date(),
        error: null,
      };

      return {
        success: true,
        updatedNovel: result.novel || null,
        conflicts: result.conflicts || [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      this.syncStatus = {
        isSyncing: false,
        lastSyncedAt: this.syncStatus.lastSyncedAt,
        error: errorMessage,
      };

      return {
        success: false,
        updatedNovel: null,
        conflicts: [],
      };
    }
  }

  async fetchNovel(novelId: string): Promise<Novel | null> {
    if (!this.config) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/novels/${novelId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.novel;
    } catch {
      return null;
    }
  }

  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<Novel> {
    if (!this.config) {
      throw new Error('Sync service not configured');
    }

    const resolvedNovel = resolution === 'local' 
      ? conflict.localVersion 
      : resolution === 'remote' 
        ? conflict.remoteVersion 
        : this.mergeNovels(conflict.localVersion, conflict.remoteVersion);

    const response = await fetch(`${this.config.apiBaseUrl}/novels/${resolvedNovel.id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ novel: resolvedNovel }),
    });

    if (!response.ok) {
      throw new Error('Failed to resolve conflict');
    }

    return resolvedNovel;
  }

  private mergeNovels(local: Novel, remote: Novel): Novel {
    const localUpdated = new Date(local.updatedAt).getTime();
    const remoteUpdated = new Date(remote.updatedAt).getTime();

    if (localUpdated >= remoteUpdated) {
      return {
        ...local,
        lastSyncedAt: new Date(),
      };
    }

    return {
      ...remote,
      lastSyncedAt: new Date(),
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config?.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    return headers;
  }
}

export const syncService = new SyncService();
