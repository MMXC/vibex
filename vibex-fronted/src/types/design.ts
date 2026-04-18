/**
 * Design types — Sprint6 QA E1
 */

export interface DesignMetadata {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  source?: 'figma' | 'sketch' | 'manual';
  canvasType?: 'prototype' | 'dds';
}
