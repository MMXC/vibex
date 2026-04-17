/**
 * Base Types for DDS Canvas
 * Shared by all card types — no imports to avoid circular deps
 */

export interface Position {
  x: number;
  y: number;
}

export interface BaseCard {
  id: string;
  type: string;          // CardType — narrowed in index.ts extending types
  title: string;
  description?: string;
  position: Position;
  createdAt: string;
  updatedAt: string;
}
