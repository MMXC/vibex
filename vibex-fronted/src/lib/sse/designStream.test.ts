/**
 * SSE Design Stream Tests
 */

import { generateDesignStream, type ProgressiveEvent } from '@/lib/sse/designStream';

describe('designStream', () => {
  describe('generateDesignStream', () => {
    it('should generate design events from requirement', async () => {
      const events: ProgressiveEvent[] = [];
      
      for await (const event of generateDesignStream('Create a user management system')) {
        events.push(event);
      }
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('progress');
    });

    it('should include context events', async () => {
      const events: ProgressiveEvent[] = [];
      
      for await (const event of generateDesignStream('Test requirement')) {
        events.push(event);
      }
      
      const contextEvents = events.filter(e => e.type === 'context:add');
      expect(contextEvents.length).toBeGreaterThan(0);
    });

    it('should include entity events', async () => {
      const events: ProgressiveEvent[] = [];
      
      for await (const event of generateDesignStream('Test requirement')) {
        events.push(event);
      }
      
      const entityEvents = events.filter(e => e.type === 'entity:add');
      expect(entityEvents.length).toBeGreaterThan(0);
    });

    it('should include complete event', async () => {
      const events: ProgressiveEvent[] = [];
      
      for await (const event of generateDesignStream('Test requirement')) {
        events.push(event);
      }
      
      const completeEvents = events.filter(e => e.type === 'complete');
      expect(completeEvents.length).toBe(1);
    });

    it('should include progress events', async () => {
      const events: ProgressiveEvent[] = [];
      
      for await (const event of generateDesignStream('Test requirement')) {
        events.push(event);
      }
      
      const progressEvents = events.filter(e => e.type === 'progress');
      expect(progressEvents.length).toBeGreaterThan(0);
    });

    it('should handle different requirements', async () => {
      const events1: ProgressiveEvent[] = [];
      const events2: ProgressiveEvent[] = [];
      
      for await (const event of generateDesignStream('Requirement 1')) {
        events1.push(event);
      }
      
      for await (const event of generateDesignStream('Requirement 2')) {
        events2.push(event);
      }
      
      expect(events1.length).toBeGreaterThan(0);
      expect(events2.length).toBeGreaterThan(0);
    });
  });
});