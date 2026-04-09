# VibeX Canvas 演进路线图

> **维护者**: architect
> **更新**: 2026-04-10
> **状态**: 进行中

---

## Overview

VibeX Canvas 是 DDD 建模的核心工作空间，采用三树并行架构（Context / Flow / Component）。

## 已完成功能

| 功能 | Epic | 状态 | 备注 |
|------|------|------|------|
| 三列布局 (Context/Flow/Component) | Epic1 | ✅ | 三栏并排 |
| 阶段进度指示器 | Epic1 | ✅ | PhaseIndicator 组件 |
| 树面板折叠/展开 | Epic1 | ✅ | useCanvasPanels hook |
| 上下文生成 API 连接 | Epic1 | ✅ | canvasApi.generateContexts |
| TreeToolbar 抽取 | Epic1 | ✅ | renderContextTreeToolbar |
| ErrorBoundary 隔离 | E4.1 | ✅ | TreeErrorBoundary |
| @vibex/types 对齐 | E4.2 | ✅ | packages/types |
| groupByFlowId 优化 | E4.5 | ✅ | useMemo 记忆化 |

## 演进计划

### Phase 1: 稳定性 (Q2 2026)

- [ ] **Panel Error Recovery**: 单个 panel 错误不影响其他两栏
- [ ] **Persistence**: Canvas 状态持久化到 localStorage
- [ ] **Undo/Redo**: 完整的操作历史记录

### Phase 2: 协作 (Q2-Q3 2026)

- [ ] **Real-time Collaboration**: WebSocket 多人实时编辑
- [ ] **Presence Indicators**: 协作者光标和选择高亮
- [ ] **Conflict Resolution**: 并发编辑冲突处理

### Phase 3: AI 增强 (Q3 2026)

- [ ] **Context Auto-completion**: AI 建议上下文边界
- [ ] **Flow Pattern Detection**: 检测常见流程模式
- [ ] **Component Template Matching**: 智能组件推荐

## 技术债务

| Issue | Priority | 状态 | 备注 |
|-------|----------|------|------|
| TypeScript 206 errors | P0 | 🔄 | 正在清理 |
| waitForTimeout in E2E | P1 | ✅ | 替换为确定性等待 |
| Zod v4 API migration | P1 | 🔄 | 依赖 TS 清理 |

## 相关文档

- [PRD](./prd.md) — 功能需求文档
- [Implementation Plan](./canvas-code-audit/IMPLEMENTATION_PLAN.md) — 当前 sprint 实施计划
- [API Contract](./api-contract.yaml) — Canvas API 契约定义
