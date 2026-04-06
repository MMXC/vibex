/**
 * @fileoverview Store/Application State Types — state management layer
 */
/** CardTree 节点状态 */
export type CardTreeNodeStatus = 'pending' | 'in-progress' | 'done' | 'failed';
/** CardTree 节点 */
export interface CardTreeNode {
    /** 节点标题 */
    title: string;
    /** 描述 */
    description?: string;
    /** 状态 */
    status: CardTreeNodeStatus;
    /** Emoji 图标 */
    icon?: string;
    /** 子节点 */
    children?: CardTreeNodeChild[];
    /** 最后更新时间 (ISO) */
    updatedAt?: string;
}
/** CardTree 子节点 */
export interface CardTreeNodeChild {
    id: string;
    label: string;
    checked: boolean;
    description?: string;
}
/** CardTree 可视化数据 */
export interface CardTreeVisualization {
    nodes: CardTreeNode[];
    projectId?: string;
    name?: string;
}
/** Team-tasks 项目任务阶段 */
export interface TaskStage {
    agent?: string;
    status?: string;
    task?: string;
    startedAt?: string;
    completedAt?: string;
    output?: string;
    dependsOn?: string[];
    verification?: Record<string, unknown>;
}
/** Team-tasks 项目 */
export interface TeamTaskProject {
    project: string;
    goal?: string;
    created?: string;
    updated?: string;
    status?: string;
    mode?: string;
    workspace?: string;
    stages?: Record<string, TaskStage>;
}
//# sourceMappingURL=store.d.ts.map