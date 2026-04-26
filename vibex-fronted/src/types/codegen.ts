/**
 * CodeGen Types — E1 Design-to-Code Pipeline
 *
 * Core type definitions for design token ingestion, code generation context,
 * and token snapshot management.
 *
 * @module types/codegen
 */

/**
 * A node extracted from a design tool (e.g., Figma).
 * Represents a single design entity with optional metadata.
 */
export interface DesignNode {
  /** Unique identifier for the node */
  id: string;
  /** Node type (e.g., 'frame', 'component', 'text', 'rectangle') */
  type: string;
  /** Optional display name */
  name?: string;
  /** Optional human-readable description */
  description?: string;
  /** Position on the canvas */
  position?: {
    x: number;
    y: number;
  };
  /** Arbitrary additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Context object produced by the design tool export plugin.
 * Embedded into the agent store via injectContext().
 */
export interface CodeGenContext {
  /** Discriminator — must be 'codegen' */
  type: 'codegen';
  /** The generated source code string */
  generatedCode: string;
  /** All design nodes extracted from the export */
  nodes: DesignNode[];
  /** Schema version of the export plugin (semver) */
  schemaVersion: string;
  /** ISO-8601 timestamp of when the export was created */
  exportedAt: string;
}

/**
 * A snapshot of design tokens at a specific point in time.
 * Used for drift detection and versioning.
 */
export interface TokenSnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** The token map (keyed by token name) */
  tokens: Record<string, unknown>;
  /** Semantic version of the token schema */
  version: string;
  /** ISO-8601 timestamp of creation */
  createdAt: string;
}
