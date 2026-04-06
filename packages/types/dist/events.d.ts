/**
 * @fileoverview Event Types — event-driven architecture layer
 */
/** 事件总线事件基础类型 */
export interface AppEvent<T = unknown> {
    type: string;
    payload: T;
    timestamp: string;
    source?: string;
}
/** 事件处理器 */
export type EventHandler<T = unknown> = (event: AppEvent<T>) => void;
/** CardTree 节点状态变更事件 */
export interface CardTreeNodeStatusChanged {
    nodeId: string;
    oldStatus: string;
    newStatus: string;
    projectId?: string;
}
/** CardTree 节点勾选变更事件 */
export interface CardTreeNodeCheckedChanged {
    nodeId: string;
    childId: string;
    checked: boolean;
}
/** CardTree 加载事件 */
export interface CardTreeLoaded {
    projectId?: string;
    nodeCount: number;
}
/** Dedup 扫描开始事件 */
export interface DedupScanStarted {
    scanPath: string;
    timestamp: string;
}
/** Dedup 扫描完成事件 */
export interface DedupScanCompleted {
    scanPath: string;
    results: Array<{
        level: string;
        candidates: number;
        message: string;
    }>;
    durationMs: number;
}
//# sourceMappingURL=events.d.ts.map