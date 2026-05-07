/**
 * PRD Canvas API Service
 * E05 S05.2: PRD → Canvas 自动生成
 */

import { httpClient } from '../client';

export interface PRDRequirement {
  id: string;
  text: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface PRDStep {
  id: string;
  title: string;
  requirements: PRDRequirement[];
}

export interface PRDChapter {
  id: string;
  title: string;
  steps: PRDStep[];
}

export interface PRDDocument {
  id: string;
  title: string;
  chapters: PRDChapter[];
}

export interface CanvasNode {
  id: string;
  type: 'context' | 'flow' | 'design';
  label: string;
  metadata: {
    sourceType: 'chapter' | 'step' | 'requirement';
    sourceId: string;
    priority?: 'P0' | 'P1' | 'P2';
    text?: string;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface FromPRDResponse {
  success: boolean;
  nodes: {
    leftPanel: CanvasNode[];
    centerPanel: CanvasNode[];
    rightPanel: CanvasNode[];
  };
  edges: CanvasEdge[];
}

export async function generateCanvasFromPRD(prd: PRDDocument): Promise<FromPRDResponse> {
  return await httpClient.post<FromPRDResponse>('/canvas/from-prd', { prd });
}
