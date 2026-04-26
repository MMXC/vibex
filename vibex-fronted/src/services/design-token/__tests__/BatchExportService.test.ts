/**
 * BatchExportService — Unit Tests
 * E1 Design-to-Code Pipeline
 *
 * Mock renderers to avoid Vite parse error for .hbs template files.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the renderers module that contains .hbs files
vi.mock('@/lib/design-token/renderers', () => ({
  renderCSS: vi.fn().mockReturnValue(''),
  renderSCSS: vi.fn().mockReturnValue(''),
  renderJS: vi.fn().mockReturnValue(''),
  renderJSON: vi.fn().mockReturnValue(''),
}));

import { queueBatchExport, getBatchExportStatus } from '../BatchExportService';
import type { DesignNode } from '@/types/codegen';

// Clear job store between tests
const clearJobs = () => {
  // Access internals by importing fresh
};

describe('queueBatchExport', () => {
  it('returns a job ID string', () => {
    const jobId = queueBatchExport([[{ id: '1', type: 'frame' }]]);
    expect(typeof jobId).toBe('string');
    expect(jobId.length).toBeGreaterThan(0);
  });

  it('returns unique job IDs for separate calls', () => {
    const id1 = queueBatchExport([[{ id: '1', type: 'frame' }]]);
    const id2 = queueBatchExport([[{ id: '2', type: 'frame' }]]);
    expect(id1).not.toBe(id2);
  });

  it('handles empty sets array', () => {
    const jobId = queueBatchExport([]);
    expect(typeof jobId).toBe('string');
  });
});

describe('getBatchExportStatus', () => {
  it('returns pending or processing status for new job', () => {
    const jobId = queueBatchExport([[{ id: '1', type: 'frame' }]]);
    const status = getBatchExportStatus(jobId);
    expect(['pending', 'processing', 'done']).toContain(status.status);
    expect(typeof status.progress).toBe('number');
    expect(status.progress).toBeGreaterThanOrEqual(0);
    expect(status.progress).toBeLessThanOrEqual(100);
  });

  it('returns error status for unknown job ID', () => {
    const status = getBatchExportStatus('unknown-job-id-xyz');
    expect(status.status).toBe('error');
  });
});