import { Node, Edge } from '@xyflow/react';

// ==================== 流程图相关类型 ====================

export interface FlowData {
  id: string;
  nodes: Node[];
  edges: Edge[];
  projectId: string;
  name?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowDataUpdate {
  nodes?: Node[];
  edges?: Edge[];
  name?: string | null;
}
