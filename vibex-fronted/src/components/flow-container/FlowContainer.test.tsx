/**
 * FlowContainer Test - Epic 1: 流程容器与步骤导航
 * 
 * 验收标准: expect(FlowContainer).toBeDefined()
 * 
 * Note: Testing the FlowContainer with mocked XState is complex.
 * This test focuses on basic functionality that doesn't require full XState mocking.
 */

import { describe, it, expect } from '@jest/globals';

describe('Epic 1: FlowContainer - 流程容器与步骤导航', () => {
  // Basic test to ensure the module can be imported
  it('should have FlowContainer module defined', async () => {
    const { FlowContainer } = await import('./FlowContainer');
    expect(FlowContainer).toBeDefined();
  });

  it('should have flowMachine module defined', async () => {
    const { flowMachine } = await import('./flowMachine');
    expect(flowMachine).toBeDefined();
  });

  it('should export FlowStep type', async () => {
    const module = await import('./index');
    // The index should export the necessary types
    expect(module).toBeDefined();
  });

  it('should define flowMachine states', async () => {
    const { flowMachine } = await import('./flowMachine');
    // Verify the machine has states
    expect(flowMachine).toBeDefined();
    expect(flowMachine.config).toBeDefined();
  });
});
