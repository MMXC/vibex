import {
  PrototypeSnapshot,
  PrototypeSnapshotCreate,
} from '../types/prototype/ui-schema';
import { SuccessResponse } from '../types/common';
import { httpClient } from '../client';
import { retry } from '../retry';
import { cache, getCacheKey } from '../cache';
import { unwrapField } from '../unwrappers';

// ==================== 接口定义 ====================

export interface PrototypeApi {
  getPrototypeSnapshots(projectId: string): Promise<PrototypeSnapshot[]>;
  getPrototypeSnapshot(snapshotId: string): Promise<PrototypeSnapshot>;
  createPrototypeSnapshot(
    snapshot: PrototypeSnapshotCreate
  ): Promise<PrototypeSnapshot>;
  updatePrototypeSnapshot(
    snapshotId: string,
    data: Partial<PrototypeSnapshotCreate>
  ): Promise<PrototypeSnapshot>;
  deletePrototypeSnapshot(
    snapshotId: string,
    projectId: string
  ): Promise<SuccessResponse>;
}

// ==================== 实现 ====================

class PrototypeApiImpl implements PrototypeApi {
  private isOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  }

  async getPrototypeSnapshots(projectId: string): Promise<PrototypeSnapshot[]> {
    const cacheKey = getCacheKey('prototype_snapshots', projectId);
    const cached = cache.get<PrototypeSnapshot[]>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<PrototypeSnapshot[]>(
        `/prototype-snapshots?projectId=${projectId}`
      );
    });
    const snapshots = unwrapField<PrototypeSnapshot[]>(result, 'prototypeSnapshots')!;
    cache.set(cacheKey, snapshots);
    return snapshots;
  }

  async getPrototypeSnapshot(snapshotId: string): Promise<PrototypeSnapshot> {
    const cacheKey = getCacheKey('prototype_snapshot', snapshotId);
    const cached = cache.get<PrototypeSnapshot>(cacheKey);

    if (!this.isOnline() && cached) {
      return cached;
    }

    const result = await retry.execute(async () => {
      return await httpClient.get<PrototypeSnapshot>(
        `/prototype-snapshots/${snapshotId}`
      );
    });
    const snapshot = unwrapField<PrototypeSnapshot>(result, 'prototypeSnapshot')!;
    cache.set(cacheKey, snapshot);
    return snapshot;
  }

  async createPrototypeSnapshot(
    snapshot: PrototypeSnapshotCreate
  ): Promise<PrototypeSnapshot> {
    const result = await retry.execute(async () => {
      return await httpClient.post<PrototypeSnapshot>(
        `/prototype-snapshots`,
        snapshot
      );
    });
    const created = unwrapField<PrototypeSnapshot>(result, 'prototypeSnapshot')!;
    cache.remove(getCacheKey('prototype_snapshots', snapshot.projectId));
    return created;
  }

  async updatePrototypeSnapshot(
    snapshotId: string,
    data: Partial<PrototypeSnapshotCreate>
  ): Promise<PrototypeSnapshot> {
    const result = await retry.execute(async () => {
      return await httpClient.put<PrototypeSnapshot>(
        `/prototype-snapshots/${snapshotId}`,
        data
      );
    });
    return unwrapField<PrototypeSnapshot>(result, 'prototypeSnapshot')!;
  }

  async deletePrototypeSnapshot(
    snapshotId: string,
    projectId: string
  ): Promise<SuccessResponse> {
    const result = await retry.execute(async () => {
      return await httpClient.delete<SuccessResponse>(
        `/prototype-snapshots/${snapshotId}`
      );
    });
    cache.remove(getCacheKey('prototype_snapshots', projectId));
    return result;
  }
}

// ==================== 工厂函数 ====================

export function createPrototypeApi(): PrototypeApi {
  return new PrototypeApiImpl();
}

// ==================== 单例导出 ====================

export const prototypeApi = createPrototypeApi();
