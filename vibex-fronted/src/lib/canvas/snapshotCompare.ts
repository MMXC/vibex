/**
 * snapshotCompare.ts — Pure function for computing snapshot diffs
 * E1 (Sprint65): Extracted from canvasHistoryStore.compareSnapshots for reuse in dialogs
 */

export interface SnapshotNode {
  id: string;
  label?: string;
  [key: string]: unknown;
}

export interface SnapshotData {
  nodes: SnapshotNode[];
  edges?: unknown[];
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  data: SnapshotData;
  branchName?: string;
  isStarred?: boolean;
  parentSnapshotId?: string | null;
}

export interface SnapshotDiff {
  added: Array<{ id: string; label?: string }>;
  removed: Array<{ id: string; label?: string }>;
  modified: Array<{
    id: string;
    label?: string;
    changes?: Record<string, { before: unknown; after: unknown }>;
  }>;
}

/**
 * Compare two snapshots and return added/removed/modified nodes.
 * Exported for use in SnapshotCompareDialog without requiring the full store.
 */
export function computeSnapshotDiff(snapA: Snapshot, snapB: Snapshot): SnapshotDiff {
  const nodesA = (snapA.data.nodes ?? []) as SnapshotNode[];
  const nodesB = (snapB.data.nodes ?? []) as SnapshotNode[];

  const idsA = new Set(nodesA.map((n) => String(n.id)));
  const idsB = new Set(nodesB.map((n) => String(n.id)));
  const allIds = new Set([...idsA, ...idsB]);

  const mapA = new Map(nodesA.map((n) => [String(n.id), n]));
  const mapB = new Map(nodesB.map((n) => [String(n.id), n]));

  const added: SnapshotDiff['added'] = [];
  const removed: SnapshotDiff['removed'] = [];
  const modified: SnapshotDiff['modified'] = [];

  for (const id of allIds) {
    const inA = idsA.has(id);
    const inB = idsB.has(id);

    if (!inA && inB) {
      const node = mapB.get(id)!;
      added.push({ id, label: node.label });
    } else if (inA && !inB) {
      const node = mapA.get(id)!;
      removed.push({ id, label: node.label });
    } else if (inA && inB) {
      const a = mapA.get(id)!;
      const b = mapB.get(id)!;
      const changes: Record<string, { before: unknown; after: unknown }> = {};
      let isModified = false;

      const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of allKeys) {
        if (key === 'id') continue;
        const before = a[key];
        const after = b[key];
        if (JSON.stringify(before) !== JSON.stringify(after)) {
          changes[key] = { before, after };
          isModified = true;
        }
      }

      if (isModified) {
        modified.push({ id, label: a.label, changes });
      }
    }
  }

  return { added, removed, modified };
}
