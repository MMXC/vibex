/**
 * Drift Detector — E1 Design-to-Code Pipeline
 *
 * Detects version drift between local tokens and Figma tokens,
 * and performs three-way merge when bidirectional sync is enabled.
 *
 * @module services/design-token/DriftDetector
 */

/**
 * Determine whether local and Figma token versions have diverged.
 * Treats identical versions as in-sync (no drift).
 */
export function detectDrift(
  localVersion: string,
  figmaVersion: string
): boolean {
  return localVersion !== figmaVersion;
}

/**
 * Simple three-way merge for token strings.
 *
 * Strategy:
 * - If local === base → use remote
 * - If remote === base → use local
 * - If both changed identically → use local (deterministic)
 * - If both changed differently → concatenate with conflict markers
 *
 * For complex token objects, callers should parse JSON and merge field by field.
 */
export function threeWayMerge(
  base: string,
  local: string,
  remote: string
): string {
  // No changes anywhere — anything equals base
  if (local === base && remote === base) {
    return base;
  }

  // Only local changed
  if (remote === base) {
    return local;
  }

  // Only remote changed
  if (local === base) {
    return remote;
  }

  // Both changed identically — same result
  if (local === remote) {
    return local;
  }

  // Both changed differently — return remote with conflict marker
  // Caller should use ConflictResolutionDialog to resolve
  return [`<<<<<<< LOCAL`, local, `=======`, remote, `>>>>>>> REMOTE`].join(
    '\n'
  );
}

/**
 * Three-way merge for token objects (field-level).
 * Returns merged token map and list of conflicting keys.
 */
export function threeWayMergeTokens(
  base: Record<string, unknown>,
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): { merged: Record<string, unknown>; conflicts: string[] } {
  const merged: Record<string, unknown> = {};
  const conflicts: string[] = [];
  const allKeys = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(remote),
  ]);

  for (const key of allKeys) {
    const baseVal = base[key];
    const localVal = local[key];
    const remoteVal = remote[key];

    if (localVal === remoteVal) {
      // Both sides agree — use that value
      merged[key] = localVal;
    } else if (localVal === baseVal) {
      // Only remote changed
      merged[key] = remoteVal;
    } else if (remoteVal === baseVal) {
      // Only local changed
      merged[key] = localVal;
    } else {
      // Both changed differently — conflict
      merged[key] = remoteVal; // default to remote; dialog resolves
      conflicts.push(key);
    }
  }

  return { merged, conflicts };
}
