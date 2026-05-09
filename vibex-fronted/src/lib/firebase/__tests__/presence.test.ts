/**
 * presence.ts — Unit Tests (Epic 3 Extension)
 * E3-U1: intention 字段扩展
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  type IntentionType,
  PresenceUser,
} from '../presence';

describe('presence — E3-U1: intention field', () => {
  describe('IntentionType', () => {
    it('supports edit, select, drag, idle', () => {
      const intentions: IntentionType[] = ['edit', 'select', 'drag', 'idle'];
      intentions.forEach((i) => {
        expect(['edit', 'select', 'drag', 'idle']).toContain(i);
      });
    });
  });

  describe('PresenceUser.intention field', () => {
    it('PresenceUser can have optional intention', () => {
      const user: PresenceUser = {
        userId: 'u1',
        name: 'Alice',
        color: '#FF6B6B',
        lastSeen: Date.now(),
      };
      // No intention = undefined (idle fallback)
      expect(user.intention).toBeUndefined();

      const userWithIntention: PresenceUser = {
        ...user,
        intention: 'edit',
      };
      expect(userWithIntention.intention).toBe('edit');
    });

    it('intention can be set to any valid type', () => {
      const types: IntentionType[] = ['edit', 'select', 'drag', 'idle'];
      types.forEach((t) => {
        const user: PresenceUser = {
          userId: 'u1', name: 'Bob', color: '#00ffff', lastSeen: Date.now(), intention: t,
        };
        expect(user.intention).toBe(t);
      });
    });
  });
});