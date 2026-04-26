/**
 * Batch Export Service — E1 Design-to-Code Pipeline
 *
 * Manages batch token export jobs with progress tracking.
 *
 * @module services/design-token/BatchExportService
 */

import type { DesignNode } from '@/types/codegen';
import { extractTokens } from './DesignTokenService';
import {
  renderCSS,
  renderSCSS,
  renderJS,
  renderJSON,
} from '@/lib/design-token/renderers';

type BatchJobStatus = 'pending' | 'processing' | 'done' | 'error';

interface BatchJob {
  jobId: string;
  sets: DesignNode[][];
  status: BatchJobStatus;
  progress: number;
  error?: string;
  createdAt: string;
}

interface BatchExportStatus {
  status: BatchJobStatus;
  progress: number;
  error?: string;
}

let jobCounter = 0;

/** In-memory job store (resets on page reload) */
const jobStore = new Map<string, BatchJob>();

/**
 * Queue a batch export job for multiple sets of design nodes.
 * Returns a unique job ID for status polling.
 */
export function queueBatchExport(sets: DesignNode[][]): string {
  const jobId = `batch-${Date.now()}-${++jobCounter}`;
  const job: BatchJob = {
    jobId,
    sets,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  jobStore.set(jobId, job);

  // Process asynchronously
  processJob(jobId).catch((err) => {
    const j = jobStore.get(jobId);
    if (j) {
      j.status = 'error';
      j.error = err instanceof Error ? err.message : String(err);
    }
  });

  return jobId;
}

/**
 * Get the current status of a batch export job.
 */
export function getBatchExportStatus(jobId: string): BatchExportStatus {
  const job = jobStore.get(jobId);
  if (!job) {
    return { status: 'error', progress: 0, error: 'Job not found' };
  }
  return {
    status: job.status,
    progress: job.progress,
    error: job.error,
  };
}

/**
 * Process a batch export job, extracting tokens from each set
 * and rendering all formats.
 */
async function processJob(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = 'processing';

  try {
    const total = job.sets.length;
    for (let i = 0; i < total; i++) {
      const set = job.sets[i];
      const { tokens } = extractTokens(set);

      // Render all formats (side-effect: triggers validation)
      renderCSS(tokens, '1.0.0', new Date().toISOString());
      renderSCSS(tokens, '1.0.0', new Date().toISOString());
      renderJS(tokens, '1.0.0', new Date().toISOString());
      renderJSON(tokens, '1.0.0', new Date().toISOString());

      // Update progress
      job.progress = Math.round(((i + 1) / total) * 100);

      // Yield to prevent blocking the main thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    job.status = 'done';
    job.progress = 100;
  } catch (err) {
    job.status = 'error';
    job.error = err instanceof Error ? err.message : String(err);
  }
}
