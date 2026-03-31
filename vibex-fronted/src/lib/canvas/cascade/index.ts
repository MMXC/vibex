export {
  cascadeContextChange,
  cascadeFlowChange,
  markFlowNodesPending,
  markComponentNodesPending,
  hasNodes,
  areAllConfirmed, // @deprecated alias for hasNodes
} from './CascadeUpdateManager';
export type { CascadeUpstream, CascadeResult } from '../types';
