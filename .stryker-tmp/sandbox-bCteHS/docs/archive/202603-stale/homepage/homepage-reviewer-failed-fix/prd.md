# PRD: homepage-reviewer-failed-fix

> **项目**: homepage-reviewer-failed-fix  
> **版本**: 1.0  
> **日期**: 2026-03-21  
> **负责人**: PM Agent  
> **状态**: 进行中

---

## 1. 执行摘要

**背景**: Sprint 1 Reviewer 审查失败，发现 5 个阻塞问题（4 CRITICAL + 1 MAJOR），需全部修复后才能合并。

**目标**: 修复所有审查失败项，通过 Reviewer 二次审查。

**关键指标**:
- 阻塞问题: 5 个
- 预估工时: 7 人日
- 验收通过率: 100% (所有 AC 通过)

---

## 2. Epic 拆分

### Epic 1: 状态管理修复（Zustand Store + 持久化）
**优先级**: P0 — CRITICAL，阻塞合并

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-9.1 | 实现 Zustand Store | `expect(useHomePageStore).toBeDefined()` | Store 文件存在且导出正确 |
| ST-9.2 | 添加 localStorage 持久化 | 刷新后 `currentStep` 保持 | Zustand persist middleware 配置正确 |
| ST-9.3 | 导出 Store 供全局使用 | `expect(useHomePageStore.getState()).toBeDefined()` | TypeScript 类型导出完整 |

**DoD**: 
- `src/stores/homePageStore.ts` 存在
- `useHomePageStore` 可被 import
- 刷新页面后 `currentStep` 值不变

---

### Epic 2: GridContainer 组件修复
**优先级**: P0 — CRITICAL，组件目录为空

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-1.1 | GridContainer 组件实现 | `expect(GridContainer).toBeDefined()` | `src/components/homepage/GridContainer/index.tsx` 存在 |
| ST-1.2 | GridContainer 渲染正确 | 组件可正常挂载 | 快照测试通过 |

**DoD**:
- `src/components/homepage/GridContainer/index.tsx` 存在且非空
- 组件可正常渲染
- 导出正确

---

### Epic 3: 步骤数修复
**优先级**: P1 — MAJOR，需求理解偏差

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-3.1 | 步骤数应为 4（不是 6） | `expect(steps.length).toBe(4)` | 步骤定义与 PRD 一致 |
| ST-3.2 | 各步骤内容正确 | 4 个步骤文案与设计稿一致 | 人工核对 |

**DoD**:
- `steps.length === 4` 断言通过
- 步骤顺序符合设计

---

### Epic 4: 快照功能
**优先级**: P0 — CRITICAL，功能完全缺失

| Story ID | 描述 | 验收标准 | DoD |
|----------|------|----------|-----|
| ST-4.1 | 实现 saveSnapshot | `expect(store.getState().saveSnapshot).toBeDefined()` | 函数存在且可调用 |
| ST-4.2 | 实现 restoreSnapshot | `expect(store.getState().restoreSnapshot).toBeDefined()` | 函数存在且可调用 |
| ST-4.3 | 快照保存/恢复可用 | 快照后 restore 数据一致 | 集成测试通过 |

**DoD**:
- `saveSnapshot()` 调用不报错
- `restoreSnapshot(id)` 可恢复正确状态
- 快照数据结构正确

---

## 3. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC-9.1 | 导入 homePageStore | import 语句执行 | `useHomePageStore` 已定义 |
| AC-9.2 | 刷新页面 | localStorage 有数据 | `currentStep` 保持原值 |
| AC-9.3 | 调用 store | 任意时刻 | `saveSnapshot` / `restoreSnapshot` 可用 |
| AC-1.1 | 文件存在检查 | `test -f GridContainer/index.tsx` | 文件存在且非空 |
| AC-3.1 | 获取 steps | 页面加载 | `steps.length === 4` |

---

## 4. 回归测试

| ID | 描述 | 预期 |
|----|------|------|
| RG-1 | 原有功能不受影响 | 4 个步骤均可正常切换 |
| RG-2 | Store 修改不影响其他组件 | 独立渲染测试通过 |
| RG-3 | localStorage 损坏容错 | 降级到默认值 |

---

## 5. 非功能需求

- **向后兼容**: 修复不影响已通过的功能
- **性能**: Store 响应 < 16ms（1帧）
- **代码质量**: TypeScript 类型完整，无 `any`

---

## 6. 依赖

| 依赖 | 来源 | 说明 |
|------|------|------|
| Zustand | 现有依赖 | persist middleware |
| React | 现有依赖 | 组件渲染 |
| Vitest | 现有测试框架 | 单元测试 |

---

## 7. 实施计划

| 阶段 | 内容 | 工时 | 执行者 |
|------|------|------|--------|
| Phase 1 | Epic 1 + 2（Store + GridContainer） | 4h | Dev |
| Phase 2 | Epic 3（步骤数修复） | 1h | Dev |
| Phase 3 | Epic 4（快照功能） | 1h | Dev |
| Phase 4 | 回归测试 + Reviewer 审查 | 1h | Tester + Reviewer |

**总计**: 7h

---

*PRD 完成，等待 Dev 领取实现任务*
