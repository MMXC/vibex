export {
  cascadeContextChange,
  cascadeFlowChange,
  markFlowNodesPending,
  markComponentNodesPending,
  hasNodes,
  areAllConfirmed, // @deprecated use hasNodes instead
} from './CascadeUpdateManager';
export type { CascadeUpstream, CascadeResult } from '../types';
