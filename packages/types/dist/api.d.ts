/**
 * @fileoverview HomePage Domain Types — API/Domain layer
 */
/** 步骤定义 */
export interface Step {
    id: number;
    label: string;
    description: string;
}
/** 限界上下文类型 */
export type BoundedContextType = 'core' | 'supporting' | 'generic' | 'external';
/** 限界上下文关系类型 */
export type ContextRelationshipType = 'upstream' | 'downstream' | 'symmetric';
/** 上下文关系 */
export interface ContextRelationship {
    id: string;
    fromContextId: string;
    toContextId: string;
    type: ContextRelationshipType;
    description: string;
}
/** 限界上下文 */
export interface BoundedContext {
    id: string;
    name: string;
    description: string;
    type: BoundedContextType;
    keyResponsibilities?: string[];
    relationships: ContextRelationship[];
}
/** 重复检测严重级别 */
export type DedupLevel = 'block' | 'warn' | 'pass';
/** 重复检测候选 */
export interface DedupCandidate {
    name: string;
    similarity: number;
    matchType: string;
    reason?: string;
}
/** 重复检测结果 */
export interface DedupResult {
    level: DedupLevel;
    candidates: DedupCandidate[];
    message: string;
}
//# sourceMappingURL=api.d.ts.map