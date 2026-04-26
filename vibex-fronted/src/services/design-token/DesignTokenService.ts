/**
 * Design Token Service — E1 Design-to-Code Pipeline
 *
 * Extracts design tokens from DesignNode arrays, mapping Figma-style tokens
 * to the internal schema. Supports truncation with a configurable node limit.
 *
 * @module services/design-token/DesignTokenService
 */

import type { DesignNode } from '@/types/codegen';

const DEFAULT_MAX_NODES = 200;

interface ExtractTokensOptions {
  /** Maximum number of nodes to process (default 200) */
  maxNodes?: number;
}

interface ExtractTokensResult {
  /** Extracted token map keyed by token name */
  tokens: Record<string, unknown>;
  /** Number of nodes processed */
  nodeCount: number;
  /** Whether the node list was truncated */
  truncated: boolean;
}

/**
 * Figma token categories that are mapped to internal design tokens.
 */
const TOKEN_CATEGORY_MAP: Record<string, string[]> = {
  color: ['color', 'fill', 'stroke', 'background', 'borderColor'],
  spacing: ['spacing', 'gap', 'padding', 'margin'],
  typography: [
    'fontFamily',
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
  ],
  border: ['borderRadius', 'borderWidth'],
  effect: ['boxShadow', 'opacity'],
};

/**
 * Map a Figma-style token name to the internal token key.
 * e.g. "colors/primary" → "color-primary"
 */
function mapFigmaTokenToInternal(
  partialName: string,
  _nodeType: string
): string {
  const normalized = partialName
    .replace(/\//g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

  // Prefix with category based on node type
  const category = Object.entries(TOKEN_CATEGORY_MAP).find(([, keywords]) =>
    keywords.some((kw) => normalized.includes(kw))
  )?.[0];

  return category ? `${category}-${normalized}` : normalized;
}

/**
 * Extract tokens from an array of DesignNodes.
 *
 * Processes each node, maps Figma-style tokens to the internal schema,
 * and returns a consolidated token map. When node count exceeds maxNodes,
 * the list is truncated and the result is marked accordingly.
 */
export function extractTokens(
  nodes: DesignNode[],
  options: ExtractTokensOptions = {}
): ExtractTokensResult {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const truncated = nodes.length > maxNodes;

  if (truncated) {
    console.warn(
      `[DesignTokenService] Node count (${nodes.length}) exceeds maxNodes (${maxNodes}). Truncating.`
    );
  }

  const workingNodes = truncated ? nodes.slice(0, maxNodes) : nodes;
  const tokens: Record<string, unknown> = {};

  for (const node of workingNodes) {
    // Use node.name or node.id as the token key base
    const baseKey = node.name ?? node.id;
    const internalKey = mapFigmaTokenToInternal(baseKey, node.type);

    const tokenEntry: Record<string, unknown> = {
      type: node.type,
      name: node.name,
      description: node.description,
    };

    if (node.metadata) {
      // Spread known Figma metadata fields
      if (node.metadata['value'] !== undefined) {
        tokenEntry['value'] = node.metadata['value'];
      }
      if (node.metadata['description']) {
        tokenEntry['description'] = node.metadata['description'];
      }
    }

    // Position is metadata, not a design token value
    if (node.position) {
      tokenEntry['position'] = node.position;
    }

    // Avoid overwriting existing tokens with the same key
    if (tokens[internalKey] === undefined) {
      tokens[internalKey] = tokenEntry;
    } else {
      // Merge if duplicate key
      const existing = tokens[internalKey] as Record<string, unknown>;
      tokens[internalKey] = { ...existing, ...tokenEntry };
    }
  }

  return {
    tokens,
    nodeCount: workingNodes.length,
    truncated,
  };
}
