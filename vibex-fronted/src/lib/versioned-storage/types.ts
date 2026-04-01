/**
 * VersionedStorage Types
 * E3-T1: Schema versions for canvas state migrations
 */

export interface VersionedState {
  _version: number;
}

export interface CanvasStateV1 {
  _version: 1;
  contexts: unknown[];
  flows: unknown[];
  components: unknown[];
}

export interface CanvasStateV2 {
  _version: 2;
  boundedContexts: unknown[];
  flowSteps: unknown[];
  componentNodes: unknown[];
}

export interface CanvasStateV3 extends Omit<CanvasStateV2, '_version'> {
  _version: 3;
  activeNodes: Record<string, boolean>;
}
