/**
 * activityHandler — WebSocket handler for activity:update messages
 * S60-E3: 协作活动流 + 在线状态指示
 *
 * Registers with CollabWebSocket to handle 'activity:update' messages
 * from the server (broadcast every ~5s).
 */

import type { ActivityMessage } from './types';
import { useActivityStore } from './activityStore';

/** Register activity:update handler on a CollabWebSocket instance */
export function registerActivityHandler(
  onMessage: (handler: (msg: ActivityMessage) => void) => void
): void {
  onMessage((msg) => {
    if (msg.type !== 'activity:update') return;

    const { entries } = msg;

    // Update activity entries ring buffer
    useActivityStore.getState().addEntries(entries);

    // Update per-user status from entries
    for (const entry of entries) {
      useActivityStore.getState().updateUserStatus(
        entry.userId,
        entry.userName,
        entry.timestamp
      );
    }
  });
}
