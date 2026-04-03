# PRD: homepage-sprint1-reviewer-fix

> **项目**: homepage-sprint1-reviewer-fix  
> **目标**: 修复 Sprint 1 Reviewer 失败的 5 个阻塞问题  
> **状态**: ✅ PRD 完成  
> **PM**: PM Agent  
> **生成时间**: 2026-03-21

---

## 执行摘要

Sprint 1 Reviewer 审查发现 5 个阻塞问题（4 CRITICAL + 1 MAJOR），需全部修复后方可上线。其中 **Epic 9 Zustand Store 完全缺失** 是核心阻塞，其他问题均为其衍生影响。

**关键指标**:
- 阻塞问题: 5 个 (4 CRITICAL, 1 MAJOR)
- 预估修复工时: 6 人日
- 影响范围: Sprint 1 无法上线

---

## Epic 拆分

### Epic 1: 状态管理 (Zustand Store) — P0 BLOCKING

**目标**: 创建 `src/stores/homePageStore.ts`，统一管理首页布局状态

| Story ID | 功能点 | 描述 | DoD | 优先级 |
|----------|--------|------|------|--------|
| ST-9.1 | localStorage 持久化 | 刷新后所有布局状态完整恢复 | `expect(useHomePageStore.persist.getStoredState()).toBeTruthy()` | P0 |
| ST-9.2 | 状态快照 | 支持保存/恢复最近 5 个快照 | `expect(store.getState().snapshots.length).toBeLessThanOrEqual(5)` | P0 |
| ST-9.3 | SSE 连接管理 | 组件挂载时连接，卸载时断开 | `expect(useSSEStore.getState().isConnected).toBe(true)` | P0 |
| ST-9.4 | 错误重连 | 指数退避 1s → 2s → 4s | `expect(reconnectCount).toBeLessThanOrEqual(5)` | P0 |

**DoD (Epic 9)**:
```
✅ src/stores/homePageStore.ts 存在且导出 useHomePageStore
✅ 单元测试: useHomePageStore.getState() 返回正确初始值
✅ persist middleware: 刷新后状态恢复
✅ 快照功能: push/pop 不超过 5 个
✅ SSE 连接: 挂载连接，卸载断开
```

### Epic 2: 布局组件修复 — P0 BLOCKING

**目标**: 修复 GridContainer 空目录 + 统一样式

| Story ID | 功能点 | 描述 | DoD | 优先级 |
|----------|--------|------|------|--------|
| ST-1.1 | GridContainer 组件 | 3×3 网格布局，1400px 居中 | `test -f src/components/homepage/GridContainer/index.tsx` | P0 |
| ST-1.2 | 响应式断点 | 支持 1200px / 900px 断点 | `expect(container.offsetWidth).toBeLessThanOrEqual(1400)` | P1 |

**DoD (Epic 2)**:
```
✅ GridContainer/index.tsx 存在且可渲染
✅ 3×3 网格布局视觉正确
✅ 1400px 居中，响应式断点工作正常
```

### Epic 3: 步骤导航修复 — P1

**目标**: 统一步骤数为 4 步（需求录入 → 需求澄清 → 业务流程 → 组件图）

| Story ID | 功能点 | 描述 | DoD | 优先级 |
|----------|--------|------|------|--------|
| ST-3.1 | 步骤数量 | 共 4 个步骤 | `expect(steps.length).toBe(4)` | P0 |
| ST-3.2 | 步骤名称 | 与 PRD 定义一致 | `expect(steps[0]).toBe('需求录入')` | P0 |
| ST-3.3 | 切换响应 | 切换响应 < 500ms | `expect(switchDuration).toBeLessThan(500)` | P1 |

**DoD (Epic 3)**:
```
✅ 步骤数量为 4
✅ 步骤名称: 需求录入 / 需求澄清 / 业务流程 / 组件图
✅ 切换动画流畅
✅ 切换响应 < 500ms
```

---

## 验收标准总表

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC-9.1 | 应用加载 | 首次访问 | `useHomePageStore` 已定义且可用 | P0 |
| AC-9.2 | 用户调整布局 | 刷新页面 | 布局状态完全恢复 | P0 |
| AC-9.3 | 用户保存快照 | 保存第 6 次 | 数组长度仍为 5（最早被清除） | P0 |
| AC-9.4 | 用户恢复快照 | 点击恢复 | 状态回退到快照时刻 | P0 |
| AC-9.5 | SSE 连接断开 | 网络中断 | 自动重连，最长等待 4s | P0 |
| AC-1.1 | 页面加载 | 渲染 GridContainer | 目录有 index.tsx | P0 |
| AC-1.2 | 窗口 resize | 宽度 < 1200px | 响应式布局切换 | P1 |
| AC-3.1 | 步骤导航 | 获取步骤列表 | 长度为 4 | P0 |
| AC-3.2 | 步骤切换 | 点击第 3 步 | 响应 < 500ms | P1 |

---

## 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F9.1 | Zustand Store | 统一状态管理 | expect(useHomePageStore).toBeDefined() | ✅ |
| F9.2 | localStorage 持久化 | 刷新状态恢复 | expect(store.getState()).toBeTruthy() | ✅ |
| F9.3 | 快照功能 | 保存/恢复状态 | expect(snapshots.length).toBeLessThanOrEqual(5) | ✅ |
| F9.4 | SSE 连接管理 | 连接/断开/重连 | expect(isConnected).toBe(true) | ✅ |
| F1.1 | GridContainer | 3×3 网格布局 | test -f GridContainer/index.tsx | ✅ |
| F1.2 | 响应式断点 | 1200/900px 断点 | expect(width).toBeLessThanOrEqual(1400) | ✅ |
| F3.1 | 步骤数量 | 4 个步骤 | expect(steps.length).toBe(4) | ✅ |
| F3.2 | 步骤名称 | 名称匹配 | expect(name).toBe('需求录入') | ✅ |

---

## 非功能需求

- **性能**: 状态切换 < 500ms，刷新后恢复 < 200ms
- **兼容性**: Chrome/Firefox/Safari 最新版
- **可维护性**: Store 测试覆盖率 ≥ 80%
- **可靠性**: SSE 重连成功率 ≥ 99%

---

## 实施计划

| 阶段 | 任务 | 负责 | 工时 |
|------|------|------|------|
| Phase 1 | 创建 HomePageStore + 持久化 + 快照 | Dev | 4h |
| Phase 2 | 实现 GridContainer 组件 | Dev | 2h |
| Phase 3 | 修复步骤数为 4 步 | Dev | 1h |
| Phase 4 | 全量回归测试 | Tester | 2h |
| Phase 5 | Reviewer 复审 | Reviewer | - |

**总工时**: ~9h（1人日）

---

## 上游产物

- 分析文档: `docs/homepage-sprint1-reviewer-fix/analysis.md`
- 验收标准: 本文档

## 下游依赖

- Dev: 领取 Epic 9 / Epic 1 / Epic 3 实现任务
- Tester: 编写/更新测试用例
- Reviewer: 修复完成后复审
