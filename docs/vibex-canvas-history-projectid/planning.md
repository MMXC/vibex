# vibex-canvas-history-projectid — Planning

**项目**: vibex-canvas-history-projectid
**日期**: 2026-04-14
**作者**: PM Agent
**基于**: analysis.md

---

## 执行摘要

Canvas 页面"保存历史版本"和"获取历史版本"功能因 `projectId` 缺失导致 API 400 错误。项目分析已完成（见 `analysis.md`），确认三类失败场景。本 Planning 产出 Feature List 并划分 Epic/Story。

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | Hook 层 projectId 空值防护 | `useVersionHistory` 在 `projectId=null` 时拦截 API 调用，展示引导 UI | 场景A/B | 0.5d |
| F1.2 | projectId 变化自动重载 | Hook 订阅 `projectId` 变化，rehydrate 完成后自动刷新快照列表 | 场景B | 0.25d |
| F1.3 | createSnapshot 空值拦截 | `projectId=null` 时 `createSnapshot` reject 并展示明确错误，不发 API | 场景A | 0.25d |
| F1.4 | E2E 测试补充：无项目场景 | 新增 E2E：场景A（无项目保存）+ 场景B（快速点击） | 场景A/B | 0.5d |
| F2.1 | URL 参数注入 projectId | CanvasPage 从 `?projectId=xxx` URL 读取并初始化 sessionStore | 场景C（根治） | 1d |
| F2.2 | projectId 合法性校验 | URL projectId 必须对应真实项目，否则降级到无项目模式 | F2.1 | 0.5d |
| F2.3 | Hook 订阅 store+URL 双源 | `useVersionHistory` 同时订阅 store 和 URL，保证任何来源的 projectId 生效 | F2.1 | 0.5d |

---

## Epic 拆分

### Epic 1 — 止血修复（Phase 1，方案 A + C）

**目标**: 在 projectId 缺失时展示明确引导，而非 API 400 错误。工时合计 1.5d。

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S1.1 | Hook 层空值拦截（loadSnapshots） | `projectId=null` 时调用 `loadSnapshots()` → 展示"请先创建项目"引导 UI，API 不发送 | 0.5d |
| S1.2 | Hook 层空值拦截（createSnapshot） | `projectId=null` 时调用 `createSnapshot()` → reject + 明确错误提示，不发 API 400 | 0.25d |
| S1.3 | projectId 变化自动重载 | `projectId` 从 null → 有效值变化时，`useEffect` 自动触发 `loadSnapshots()` | 0.25d |
| S1.4 | E2E 补充：无项目操作场景 | E2E 覆盖场景A（无项目点击保存）和场景B（快速点击历史按钮） | 0.5d |

### Epic 2 — 深度修复（Phase 2，方案 B）

**目标**: 通过 URL 注入 projectId，从根本上解决时序和缺失问题。工时合计 2d。

| Story ID | Story | 验收标准 | 工时 |
|----------|-------|----------|------|
| S2.1 | URL 参数读取与初始化 | `CanvasPage` 从 `?projectId=xxx` 读取并在 mount 时初始化 sessionStore | 1d |
| S2.2 | projectId 合法性校验 | URL projectId 不对应真实项目时 → toast 提示 + 降级无项目模式 | 0.5d |
| S2.3 | Hook 双源订阅适配 | `useVersionHistory` 订阅 store projectId 变化，支持从 URL 注入的 projectId 生效 | 0.5d |

---

## 依赖关系

```
Epic 1 (止血)
├── S1.1 基础拦截 ← 优先
├── S1.2 拦截 createSnapshot ← 依赖 S1.1 模式
├── S1.3 自动重载 ← 依赖 S1.1
└── S1.4 E2E 补充 ← 依赖 S1.1+S1.2+S1.3

Epic 2 (根治) — 依赖 Epic 1 完成
├── S2.1 URL 注入 ← 依赖 S1.1
├── S2.2 合法性校验 ← 依赖 S2.1
└── S2.3 Hook 适配 ← 依赖 S2.1
```

---

## 技术决策

1. **Phase 1 先于 Phase 2**: 止血修复风险低、工期短（1.5d），应优先交付用户体验改善
2. **Hook 层为单一改动入口**: 不改组件、不改 API，只改 `useVersionHistory`（Phase 1）和 `CanvasPage`（Phase 2）
3. **E2E 优先于单元测试**: 场景A/B 是用户触发的真实路径，E2E 覆盖优先
4. **Phase 2 URL 注入不破坏现有创建流程**: `setProjectId` 在创建项目时仍可正常覆盖 URL 参数

---

## 风险识别

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 快速点击时序（场景B）仍部分失败 | 低 | 低 | S1.3 auto-reload + E2E 覆盖验证 |
| URL projectId 与 store 不一致 | 中 | 中 | S2.3 双源订阅以 store 为主 |
| build 失败（类型错误） | 低 | 中 | `pnpm build` 在 DoD 中强制要求 |

---

*PM Agent — 2026-04-14*
