# Requirements Analysis — vibex-reviewer-proposals

**项目**: vibex-reviewer-proposals-vibex-proposals-20260408  
**日期**: 2026-04-08  
**分析者**: analyst  
**状态**: ✅ 完成

---

## 业务场景分析

### 当前状态
vibex 项目处于快速迭代期，Canvas 模块经历了多轮 Epic 重构（canvas-json-persistence、canvas-split-hooks、canvas-optimization-roadmap 等），积累了相当的技术债务和质量隐患。最近一轮审查（2026-04-07）已识别 Review SOP 标准化和测试覆盖率门槛问题，本轮从 reviewer 视角进一步深入代码层，识别出 4 个 P0 级别质量和安全问题。

### 核心发现

| 问题类型 | 数量 | 严重度 |
|---------|------|--------|
| 缺失测试（P0） | 2 | 🔴 破坏性重构风险 |
| 类型安全违规（P0） | 2 | 🔴 隐性运行时崩溃 |
| 测试缺口（P1） | 2 | 🟡 数据一致性风险 |
| 架构问题（P1） | 1 | 🟡 状态不可预测 |
| 性能/优化（P2） | 1 | 🟡 技术债务 |

### 影响分析

**直接用户影响**:
- P0 问题未被修复前，DDD 页面 state restore 和 canvas 预览功能可能产生运行时错误
- Snapshot API 数据无校验可能导致前端 canvas 读取历史快照时崩溃

**开发效率影响**:
- 2 个 hook 无测试 → 重构时无法感知回归，每次改动静默破坏风险高
- `as any` 传播链 → TypeScript 类型系统完全失效，重构成本翻倍

---

## 技术方案选项

### 方案 A：逐个修复（保守推进）

每个提案独立实施，按优先级排队：

**Phase 1（P0 立即修复，2-3h）**:
- R-P0-1: 为 `useTreeToolbarActions` 编写单元测试（1h）
- R-P0-2: 为 `useCanvasPreview` 编写测试 + 修复 `isVisible` 硬编码（1h）
- R-P0-3: 为 `useDDDStateRestore` 添加类型接口，移除 `as any`（0.5h）
- R-P0-4: 为 Snapshot schema 添加 Zod 结构化校验（0.5h）

**Phase 2（P1 中期修复，4-6h）**:
- R-P1-1: 补全 `useAutoSave` 边界测试（3h）
- R-P1-2: 修复 `useCanvasExport` 的 `isExporting` 响应式问题（1h）
- R-P1-3: 统一 DDD store hooks 类型导出（1h）

**Phase 3（P2 技术债务，后续迭代）**:
- R-P2-1: Snapshot schema 版本化和完整结构化

**优点**: 风险可控，每步可独立验证  
**缺点**: 需要协调多个 agent 任务，执行周期长

### 方案 B：批量修复（激进推进）

创建单一 `vibex-canvas-quality-fix` 项目，将 4 个 P0 + 3 个 P1 合并为 2 个 Epic：

**Epic 1（测试覆盖，P0 + P1，4-5h）**:
- E1: `useTreeToolbarActions` 单元测试
- E2: `useCanvasPreview` 测试 + isVisible 修复
- E3: `useAutoSave` 边界测试补全
- E4: `useCanvasExport` isExporting 响应式修复

**Epic 2（类型安全，P0，2h）**:
- E1: `useDDDStateRestore` 类型接口重构，移除 `as any`
- E2: Snapshot API schema 结构化（Zod validation）
- E3: DDD store hooks 统一类型导出

**优点**: 一次项目完成所有质量修复，效率高  
**缺点**: 单次 Epic 规模偏大（4-5 功能点），需要充分拆分

### 推荐方案

**推荐方案 A（保守推进）**，原因：
1. P0 问题虽然严重，但影响面有限（特定页面/特定操作路径）
2. 方案 A 的 Phase 1 可在 1 天内完成，Phase 2 可并行
3. 质量修复有先后依赖（先有类型接口，再补测试）

---

## 可行性评估

### 技术可行性
| 提案 | 可行性 | 风险 |
|------|--------|------|
| R-P0-1 测试 | ✅ 高 | Mock store 需要正确实现 `getState/subscribe` |
| R-P0-2 测试 | ✅ 高 | 同上 |
| R-P0-3 类型 | ✅ 高 | 只需定义 interface，不改实现逻辑 |
| R-P0-4 Schema | ✅ 高 | Zod schema 可逐步增强，无需一次性完整 |
| R-P1-1 边界测试 | ✅ 高 | 需 Mock `navigator.sendBeacon` 和定时器 |
| R-P1-2 ref→state | ✅ 高 | 纯 ref→state 迁移，无逻辑变更 |
| R-P1-3 类型统一 | ✅ 高 | 纯类型重构，无运行时风险 |

### 资源需求
- Dev 熟悉 canvas hooks: 2h
- TypeScript 能力强: 1h
- 合计: 3 agents 并行，6-9h 总工时

---

## 初步风险识别

### 🔴 高风险
1. **测试覆盖误报**: `useTreeToolbarActions` 和 `useCanvasPreview` 现有无测试，容易引入新 bug。**缓解**: 必须先写测试 TDD 模式。
2. **Schema 破坏兼容**: 修改 Snapshot schema 可能导致历史快照无法读取。**缓解**: 保持 `z.array(z.any())` 作为 fallback，渐进式增强。

### 🟡 中风险
3. **DDD store 类型重构传播**: 移除 `as any` 可能暴露其他文件的问题。**缓解**: 先测小范围，确认无破坏再扩展。
4. **`useAutoSave` 边界测试复杂度**: Mock 定时器 + beacon + concurrent saves 三重复杂度。**缓解**: 拆分为 3 个独立测试文件。

### 🟢 低风险
5. **`useCanvasExport` isExporting**: 纯 UI 状态修复，无业务逻辑变更。

---

## 验收标准（具体可测试）

### R-P0-1: useTreeToolbarActions 测试
- [ ] `tests/unit/hooks/canvas/useTreeToolbarActions.test.ts` 存在
- [ ] 测试覆盖三种 treeType 返回对应的 store
- [ ] `pnpm vitest run tests/unit/hooks/canvas/useTreeToolbarActions.test.ts` 通过

### R-P0-2: useCanvasPreview 测试 + isVisible 修复
- [ ] `tests/unit/hooks/canvas/useCanvasPreview.test.ts` 存在
- [ ] `canPreview` 正确反映 `componentNodes.length > 0`
- [ ] `isVisible` 不再硬编码为 `false`（改为 `useState` 或从 store 读取）
- [ ] 相关测试全部通过

### R-P0-3: 移除 useDDDStateRestore 中的 `as any`
- [ ] `src/hooks/ddd/useDDDStateRestore.ts` 中无 `as any` 或 `@ts-ignore`
- [ ] `checkDDDStateRestore` 参数类型为具体 interface
- [ ] TypeScript 编译无错误：`cd vibex-fronted && npx tsc --noEmit`

### R-P0-4: Snapshot API schema 数据校验
- [ ] `CreateSnapshotSchema` 中 `contextNodes` / `flowNodes` / `componentNodes` 不再使用 `z.array(z.any())`
- [ ] API 拒绝无效 payload 返回 400：`{ "error": "Validation failed", "details": [...] }`
- [ ] 有效 payload 正常创建快照（200）
- [ ] 后端单元测试验证 schema 校验逻辑

### R-P1-1: useAutoSave 边界测试
- [ ] `tests/unit/hooks/canvas/useAutoSave.boundary.test.ts` 存在
- [ ] 覆盖：debounce 2s 后触发、连续变更合并为一次保存、保存中不重复请求
- [ ] 所有边界测试通过

### R-P1-2: useCanvasExport isExporting 响应式
- [ ] `isExporting` 变为 `useState` 响应式状态
- [ ] 导出进行中 `isExporting === true`，导出完成后 `isExporting === false`
- [ ] UI 层（导出按钮）正确显示 loading 状态

### R-P1-3: DDD store hooks 统一类型导出
- [ ] `@/stores/ddd/index.ts` 导出类型：`DDDContextStore`, `DDDModelStore`, `DDDDesignStore`
- [ ] `checkDDDStateRestore` 使用具体类型签名
- [ ] `useDDDStateRestore` 无 `as any` 编译警告
