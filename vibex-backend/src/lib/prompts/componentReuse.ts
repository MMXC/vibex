/**
 * Component Reuse Analyzer
 *
 * Identifies structurally similar canvas nodes that could be consolidated
 * into a shared component. Uses structural similarity scoring.
 *
 * Similarity threshold: > 0.7 (70%) → candidate for component extraction.
 *
 * @module lib/prompts/componentReuse
 */

// =============================================================================
// Types
// =============================================================================

export interface ReuseCandidate {
  nodeIdA: string;
  nodeNameA?: string;
  nodeIdB: string;
  nodeNameB?: string;
  similarityScore: number; // 0.0 – 1.0
  sharedFields: string[];
  differingFields: Array<{ field: string; valueA: unknown; valueB: unknown }>;
  recommendation: string;
}

export interface ReuseAnalysisResult {
  candidates: ReuseCandidate[];
  totalNodes: number;
  candidatesAboveThreshold: number;
  recommendations: string[];
}

// =============================================================================
// Similarity Scoring
// =============================================================================

/**
 * Extract a structural fingerprint from a node.
 * Ignores id, name, position, timestamp fields — focuses on type and layout.
 */
function fingerprint(node: Record<string, unknown>): Record<string, unknown> {
  const fp: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(node)) {
    // Skip identity and positional fields
    if (['id', 'name', 'label', 'position', 'x', 'y', 'z', 'createdAt', 'updatedAt', 'timestamp', 'version'].includes(k)) {
      continue;
    }

    // For primitive values, keep them (for structural comparison)
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      fp[k] = v;
    } else if (Array.isArray(v)) {
      // For arrays, keep the length and first few elements
      fp[k] = { length: v.length, sample: v.slice(0, 3) };
    } else if (typeof v === 'object' && v !== null) {
      // Recursively fingerprint nested objects
      fp[k] = fingerprint(v as Record<string, unknown>);
    }
  }

  return fp;
}

/**
 * Compute structural similarity between two fingerprints.
 * Returns a score between 0 (completely different) and 1 (identical).
 */
function similarity(fpA: Record<string, unknown>, fpB: Record<string, unknown>): number {
  const keysA = Object.keys(fpA);
  const keysB = Object.keys(fpB);

  if (keysA.length === 0 && keysB.length === 0) return 1;
  if (keysA.length === 0 || keysB.length === 0) return 0;

  const sharedKeys = keysA.filter((k) => k in fpB);
  const allKeys = new Set([...keysA, ...keysB]);

  if (sharedKeys.length === 0) return 0;

  let score = 0;
  for (const key of sharedKeys) {
    const valA = fpA[key];
    const valB = fpB[key];

    if (valA === valB) {
      score += 1;
    } else if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {
      // Recurse into nested objects
      score += similarity(
        valA as Record<string, unknown>,
        valB as Record<string, unknown>
      );
    }
  }

  return score / allKeys.size;
}

/**
 * Find differing fields between two nodes.
 */
function findDifferingFields(
  nodeA: Record<string, unknown>,
  nodeB: Record<string, unknown>
): Array<{ field: string; valueA: unknown; valueB: unknown }> {
  const differing: Array<{ field: string; valueA: unknown; valueB: unknown }> = [];
  const allKeys = new Set([...Object.keys(nodeA), ...Object.keys(nodeB)]);

  for (const key of allKeys) {
    if (['id', 'name', 'label', 'position', 'x', 'y', 'z', 'createdAt', 'updatedAt', 'timestamp', 'version'].includes(key)) {
      continue;
    }
    const valA = nodeA[key];
    const valB = nodeB[key];
    if (valA !== valB) {
      differing.push({ field: key, valueA: valA, valueB: valB });
    }
  }

  return differing;
}

/**
 * Find shared fields between two nodes.
 */
function findSharedFields(
  nodeA: Record<string, unknown>,
  nodeB: Record<string, unknown>
): string[] {
  return Object.keys(nodeA).filter((k) => {
    if (['id', 'name', 'label', 'position', 'x', 'y', 'z', 'createdAt', 'updatedAt', 'timestamp', 'version'].includes(k)) {
      return false;
    }
    return k in nodeB && nodeA[k] === nodeB[k];
  });
}

// =============================================================================
// Main API
// =============================================================================

const SIMILARITY_THRESHOLD = 0.7;

/**
 * Analyze canvas nodes for component reuse opportunities.
 *
 * @param nodes - Array of canvas nodes to analyze
 * @param threshold - Similarity score threshold (default: 0.7)
 * @returns ReuseAnalysisResult with all candidate pairs
 */
export function analyzeComponentReuse(
  nodes: Array<Record<string, unknown>>,
  threshold = SIMILARITY_THRESHOLD
): ReuseAnalysisResult {
  const candidates: ReuseCandidate[] = [];
  const recommendations: string[] = [];

  // Compare all pairs (O(n²) — acceptable for canvas size ≤ 200 nodes)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const idA = (nodeA.id as string) ?? `node-${i}`;
      const idB = (nodeB.id as string) ?? `node-${j}`;
      const typeA = (nodeA.type as string) ?? '';
      const typeB = (nodeB.type as string) ?? '';

      // Skip if types are completely different
      if (typeA !== typeB) continue;

      const fpA = fingerprint(nodeA);
      const fpB = fingerprint(nodeB);
      const score = similarity(fpA, fpB);

      if (score >= threshold) {
        const sharedFields = findSharedFields(nodeA, nodeB);
        const differingFields = findDifferingFields(nodeA, nodeB);

        candidates.push({
          nodeIdA: idA,
          nodeNameA: nodeA.name as string | undefined,
          nodeIdB: idB,
          nodeNameB: nodeB.name as string | undefined,
          similarityScore: Math.round(score * 100) / 100,
          sharedFields,
          differingFields,
          recommendation: `Consider extracting '${nodeA.name ?? idA}' and '${nodeB.name ?? idB}' into a shared component. ${sharedFields.length} shared fields, ${differingFields.length} customizable fields.`,
        });
      }
    }
  }

  // Sort by similarity score descending
  candidates.sort((a, b) => b.similarityScore - a.similarityScore);

  const aboveThreshold = candidates.filter((c) => c.similarityScore >= threshold).length;

  if (aboveThreshold > 0) {
    recommendations.push(
      `Found ${aboveThreshold} component reuse candidates above ${threshold * 100}% similarity threshold.`
    );
    recommendations.push(
      `Review candidates to determine if shared component extraction would reduce duplication.`
    );
  }

  return {
    candidates,
    totalNodes: nodes.length,
    candidatesAboveThreshold: aboveThreshold,
    recommendations,
  };
}
