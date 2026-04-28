/**
 * Design Sync Types — S16-P0-2
 * Shared types for design-to-code bidirectional sync
 */

export type TokenChangeType = 'added' | 'removed' | 'modified';

export interface DesignToken {
  id: string;
  name: string;
  value: string;
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'other';
}

export interface TokenChange {
  tokenId: string;
  type: TokenChangeType;
  oldValue?: string;
  newValue?: string;
  location?: string;
}

export interface DriftReport {
  hasDrift: boolean;
  changes: TokenChange[];
  falsePositiveRate: number;
  timestamp: number;
  scenario?: 'A' | 'B' | 'C';
}

export interface SyncState {
  lastSyncTimestamp: number | null;
  lastKnownGoodTokens: DesignToken[];
  currentTokens: DesignToken[];
  driftReport: DriftReport | null;
  isSyncing: boolean;
}

export type AcceptAction = 'design' | 'code' | 'token' | 'merge';
