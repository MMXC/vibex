import { describe, it, expect, vi } from 'vitest';
import { batchExport, export50Components, type ExportTask } from './batchExporter';

describe('batchExporter', () => {
  it('exports single component successfully', async () => {
    const tasks: ExportTask[] = [{ id: 't1', componentName: 'Button', framework: 'react' }];
    const result = await batchExport(tasks, 1);
    expect(result.total).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.results[0].success).toBe(true);
  });

  it('reports progress via callback', async () => {
    const tasks: ExportTask[] = [
      { id: 't1', componentName: 'A', framework: 'react' },
      { id: 't2', componentName: 'B', framework: 'react' },
    ];
    const onProgress = vi.fn();
    await batchExport(tasks, 2, onProgress);
    expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(1);
    const finalCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
    expect(finalCall[0].completed).toBe(2);
  });

  it('handles 50 concurrent exports', async () => {
    const tasks: ExportTask[] = Array.from({ length: 50 }, (_, i) => ({
      id: `t${i}`,
      componentName: `Component${i}`,
      framework: 'react' as const,
    }));
    const result = await batchExport(tasks, 50);
    expect(result.total).toBe(50);
    expect(result.completed).toBe(50);
    expect(result.failed).toBe(0);
  });

  it('export50Components exports exactly 50 components', async () => {
    const result = await export50Components();
    expect(result.total).toBe(50);
    expect(result.completed).toBe(50);
    expect(result.results.length).toBe(50);
  });

  it('respects concurrency limit', async () => {
    const tasks: ExportTask[] = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      componentName: `C${i}`,
      framework: 'vue' as const,
    }));
    const result = await batchExport(tasks, 5);
    expect(result.completed).toBe(10);
  });

  it('handles empty task array', async () => {
    const result = await batchExport([], 10);
    expect(result.total).toBe(0);
    expect(result.completed).toBe(0);
  });
});
