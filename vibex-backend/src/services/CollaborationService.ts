/**
 * CollaborationService — JSON file-level locking + authorization
 *
 * E2-T1: Prevents unauthorized updates when no lock is held.
 *
 * Usage:
 *   const svc = new CollaborationService();
 *   await svc.validateLock(projectId, stageId); // throws LockRequired if not locked
 *   await svc.acquireLock(projectId, stageId);
 *   // ... do work
 *   await svc.releaseLock(projectId, stageId);
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { LOCK_DIR } from './lockConstants.js';

export class LockRequiredError extends Error {
  constructor(message = 'LockRequired: must hold lock before updating') {
    super(message);
    this.name = 'LockRequiredError';
  }
}

export class LockHeldError extends Error {
  constructor(message = 'LockHeld: a valid lock already exists for this resource') {
    super(message);
    this.name = 'LockHeldError';
  }
}

export class CollaborationService {
  private lockDir: string;

  constructor(lockDir = LOCK_DIR) {
    this.lockDir = lockDir;
  }

  private lockPath(projectId: string, stageId: string): string {
    return path.join(this.lockDir, `${projectId}__${stageId}.lock`);
  }

  /** Acquire a lock for the given project+stage */
  async acquireLock(projectId: string, stageId: string, ttlMs = 300_000): Promise<void> {
    // S1.1: 先检查已有 lock，禁止直接覆写
    const locked = await this.hasLock(projectId, stageId);
    if (locked) {
      throw new LockHeldError(
        `LockHeld: lock already held for ${projectId}/${stageId}`
      );
    }
    await fs.mkdir(this.lockDir, { recursive: true });
    const lockFile = this.lockPath(projectId, stageId);
    const content = JSON.stringify({ projectId, stageId, acquiredAt: Date.now(), ttlMs });
    await fs.writeFile(lockFile, content, 'utf-8');
  }

  /** Release the lock — no-op if lock doesn't exist */
  async releaseLock(projectId: string, stageId: string): Promise<void> {
    const lockFile = this.lockPath(projectId, stageId);
    await fs.unlink(lockFile).catch(() => {/* already released */});
  }

  /** Check if a valid lock exists */
  async hasLock(projectId: string, stageId: string): Promise<boolean> {
    const lockFile = this.lockPath(projectId, stageId);
    try {
      const stat = await fs.stat(lockFile);
      // Lock expires after ttlMs
      const content = await fs.readFile(lockFile, 'utf-8');
      const lock = JSON.parse(content) as { ttlMs: number; acquiredAt: number };
      const age = Date.now() - lock.acquiredAt;
      return age < lock.ttlMs;
    } catch {
      return false;
    }
  }

  /**
   * Validate that the caller holds a valid lock.
   * Throws LockRequiredError if no valid lock exists.
   *
   * Use this at the start of any update operation.
   */
  async validateLock(projectId: string, stageId: string): Promise<void> {
    const locked = await this.hasLock(projectId, stageId);
    if (!locked) {
      throw new LockRequiredError(
        `LockRequired: must hold lock before updating ${projectId}/${stageId}`
      );
    }
  }
}

export const collaborationService = new CollaborationService();
