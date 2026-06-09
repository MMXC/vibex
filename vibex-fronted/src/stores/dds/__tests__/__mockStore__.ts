import { vi } from 'vitest';

// hoisted() — same instance in both test module and vi.mock factory
export const { mockUpdateStatus, mockScheduledExports } = vi.hoisted(() => {
  const mockUpdateStatus = vi.fn();
  const mockScheduledExports: Record<string, any> = {};
  return { mockUpdateStatus, mockScheduledExports };
});
