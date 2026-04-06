# PRD: VibeX Reviewer Proposals 2026-04-08

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260408
> **目标**: 修复 Canvas 质量漏洞（测试缺失 + 类型安全违规）
> **来源**: proposals/20260408/reviewer.md
> **PRD 作者**: pm agent
> **日期**: 2026-04-08
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
Reviewer 从代码审查视角识别出 8 个质量/安全问题：
- **P0×4**: 2 个 canvas hooks 无测试（重构无保护）、useDDDStateRestore 用 `as any`、Snapshot schema 无校验
- **P1×3**: useAutoSave 边界测试缺失、useCanvasExport isExporting 非响应式、DDD store 类型不一致
- **P2×1**: Snapshot schema 升级为结构化

### 目标
- P0: 止血（补测试 + 移除 as any + Schema 校验）
- P1: 补质量缺口（边界测试 + 响应式修复 + 类型统一）
- P2: 技术债务（Schema 升级）

### 成功指标
- AC1: `useTreeToolbarActions` + `useCanvasPreview` 测试覆盖率 100%
- AC2: `useDDDStateRestore` 移除 `as any`，TypeScript 编译 0 errors
- AC3: Snapshot API 拒绝无效 payload 返回 400
- AC4: `useAutoSave` 边界测试覆盖 debounce/并发/beacon
- AC5: `useCanvasExport` isExporting 变为响应式状态
- AC6: DDD store hooks 统一类型导出

---

## 2. Planning — Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 | 优先级 |
|----|--------|------|---------|------|--------|
| F1.1 | useTreeToolbarActions 单元测试 | 覆盖三种 treeType 返回对应 store | R-P0-1 | 1h | P0 |
| F1.2 | useCanvasPreview 单元测试 | 覆盖 canPreview 和 isVisible | R-P0-2 | 1h | P0 |
| F1.3 | useCanvasPreview isVisible 修复 | 改为响应式或移除硬编码 false | R-P0-2 | 0.5h | P0 |
| F2.1 | useDDDStateRestore 类型接口 | 定义 Store accessor interface，移除 as any | R-P0-3 | 1h | P0 |
| F2.2 | DDD store hooks 类型统一导出 | index.ts 导出具体 store 类型 | R-P1-3 | 0.5h | P1 |
| F3.1 | Snapshot schema Zod 校验 | context/flow/componentNodes 结构化 | R-P0-4 | 1h | P0 |
| F3.2 | Snapshot schema 完整结构化 | 版本化 + 共享 schema 来源 | R-P2-1 | 3h | P2 |
| F4.1 | useAutoSave 边界测试 | debounce/并发/beacon/unmount | R-P1-1 | 3h | P1 |
| F5.1 | useCanvasExport isExporting 响应式 | ref → useState 状态 | R-P1-2 | 1h | P1 |
| **合计** | | | | **13h** | |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 提案来源 |
|------|------|--------|------|----------|
| E1 | Canvas Hooks 测试补全 | P0 | 2.5h | R-P0-1, R-P0-2 |
| E2 | 类型安全修复 | P0 | 1.5h | R-P0-3, R-P1-3 |
| E3 | Snapshot Schema 校验 | P0 | 1h | R-P0-4 |
| E4 | useAutoSave 边界测试 | P1 | 3h | R-P1-1 |
| E5 | useCanvasExport 响应式修复 | P1 | 1h | R-P1-2 |
| E6 | Snapshot Schema 升级 | P2 | 3h | R-P2-1 |
| **合计** | | | **12h** | |

---

### Epic 1: Canvas Hooks 测试补全

**问题根因**: `useTreeToolbarActions` 和 `useCanvasPreview` 无测试文件，重构时无保护。

**提案引用**: R-P0-1, R-P0-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | useTreeToolbarActions 单元测试 | 1h | 测试通过 |
| S1.2 | useCanvasPreview 单元测试 | 1h | 测试通过 |
| S1.3 | isVisible 硬编码修复 | 0.5h | 响应式或移除 |

**S1.1 验收标准**:
- `expect(vitest.run('useTreeToolbarActions')).toBeDefined()` ✓
- `expect(treeType='context').toEqual(contextStore)` ✓
- `expect(pnpx vitest run tests/.../useTreeToolbarActions.test.ts).toBe(0)` ✓

**S1.2 验收标准**:
- `expect(canPreview).toBe(componentNodes.length > 0)` ✓
- `expect(nodes).toEqual(componentNodes)` ✓

**S1.3 验收标准**:
- `expect(isVisible).not.toBe(false)` or 移除硬编码注释 ✓

**DoD**:
- [ ] `tests/unit/hooks/canvas/useTreeToolbarActions.test.ts` 存在且通过
- [ ] `tests/unit/hooks/canvas/useCanvasPreview.test.ts` 存在且通过
- [ ] `isVisible` 不再硬编码为 `false`
- [ ] `pnpm vitest run` 全通过

---

### Epic 2: 类型安全修复

**问题根因**: `useDDDStateRestore` 用 `as any` 绕过类型检查，DDD store 类型定义不完整。

**提案引用**: R-P0-3, R-P1-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | Store accessor interface | 定义统一接口，移除 as any | 1h |
| S2.2 | DDD store 类型统一导出 | index.ts 导出具体类型 | 0.5h |

**S2.1 验收标准**:
- `expect(grep -c 'as any' src/hooks/ddd/useDDDStateRestore.ts).toBe(0)` ✓
- `expect(tsc --noEmit).toBe(0)` ✓

**S2.2 验收标准**:
- `expect(grep 'export type' stores/ddd/index.ts).toBeTruthy()` ✓

**DoD**:
- [ ] `useDDDStateRestore.ts` 无 `as any`
- [ ] `DDDContextStore` / `DDDModelStore` / `DDDDesignStore` 类型导出
- [ ] TypeScript 编译 0 errors

---

### Epic 3: Snapshot Schema 校验

**问题根因**: `z.array(z.any())` 无结构校验，错误 payload 可写入数据库。

**提案引用**: R-P0-4

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | Zod 结构化 schema | context/flow/componentNodes 字段定义 | 1h |

**S3.1 验收标准**:
- `expect(z.object({...}).safeParse(invalid).success).toBe(false)` ✓
- `expect(invalidPayload).toBe(400)` via API ✓
- `expect(validPayload).toBe(201)` via API ✓

**DoD**:
- [ ] `contextNodes` / `flowNodes` / `componentNodes` 不再是 `z.array(z.any())`
- [ ] API 拒绝无效 payload 返回 400 + details
- [ ] 后端单元测试验证校验逻辑

---

### Epic 4: useAutoSave 边界测试

**问题根因**: 缺少 debounce/并发/beacon/unmount 边界测试，数据持久化有隐患。

**提案引用**: R-P1-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 边界测试文件 | 覆盖 6 个边界场景 | 3h |

**S4.1 验收标准**:
- debounce 2s 后触发 ✓
- 连续变更合并为一次保存 ✓
- 保存中不重复请求 ✓
- `beforeunload` 正确序列化 ✓
- `unmount` 后不调用 setState ✓
- `onSaveSuccess` 回调被调用 ✓

**DoD**:
- [ ] `tests/unit/hooks/canvas/useAutoSave.boundary.test.ts` 存在
- [ ] 6 个边界场景全部覆盖
- [ ] `pnpm vitest run` 全通过

---

### Epic 5: useCanvasExport 响应式修复

**问题根因**: `isExporting` 返回 ref 静态值，UI 无法感知导出状态。

**提案引用**: R-P1-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | ref → useState | isExporting 改为响应式状态 | 1h |

**S5.1 验收标准**:
- `expect(isExportingRef.current).toBeUndefined()` (不再直接返回) ✓
- `expect(isExporting).toBe(true)` during export ✓
- `expect(isExporting).toBe(false)` after export ✓

**DoD**:
- [ ] `isExporting` 变为 `useState` 响应式
- [ ] 导出按钮正确显示 loading 状态
- [ ] 现有导出功能测试全部通过

---

### Epic 6: Snapshot Schema 升级

**问题根因**: Snapshot schema 无版本化，历史快照无法向后兼容。

**提案引用**: R-P2-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | 结构化 Node schemas | BoundedContext/Flow/ComponentNodeSchema | 2h |
| S6.2 | Schema 版本化 | schemaVersion + migrate 逻辑 | 1h |

**S6.1 验收标准**:
- `expect(BoundedContextNodeSchema.parse(validNode).id).toBeDefined()` ✓
- `expect(FlowNodeSchema.parse(invalid).success).toBe(false)` ✓

**DoD**:
- [ ] `BoundedContextNodeSchema` / `FlowNodeSchema` / `ComponentNodeSchema` 定义
- [ ] 前端 types 与后端 schema 共享来源
- [ ] schemaVersion 字段存在

---

## 4. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | useTreeToolbarActions 测试 | E1 | expect(vitest).toBe(0) | 无 |
| F1.2 | useCanvasPreview 测试 | E1 | expect(canPreview).toBeDefined() | 无 |
| F1.3 | isVisible 修复 | E1 | expect(isVisible).not.toBe(false) | 无 |
| F2.1 | Store accessor interface | E2 | expect(as any).toBe(0) | 无 |
| F2.2 | DDD store 类型导出 | E2 | expect(tsc).toBe(0) | 无 |
| F3.1 | Zod schema 校验 | E3 | expect(safeParse).toBe(false) | 无 |
| F4.1 | useAutoSave 边界测试 | E4 | expect(6 tests).toPass() | 无 |
| F5.1 | isExporting 响应式 | E5 | expect(useState).toBeDefined() | 无 |
| F6.1 | Node schemas 结构化 | E6 | expect(parse).toBeDefined() | 无 |

---

## 5. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | vitest run | useTreeToolbarActions.test.ts | 0 failures |
| AC2 | vitest run | useCanvasPreview.test.ts | 0 failures |
| AC3 | tsc --noEmit | useDDDStateRestore.ts | 0 errors |
| AC4 | 400 | 发送 invalid snapshot payload | 含 details 字段 |
| AC5 | vitest run | useAutoSave.boundary.test.ts | 0 failures |
| AC6 | useCanvasExport | 导出进行中 | isExporting === true |

---

## 6. DoD (Definition of Done)

### E1: Canvas Hooks 测试补全
- [ ] `useTreeToolbarActions.test.ts` 存在且通过
- [ ] `useCanvasPreview.test.ts` 存在且通过
- [ ] `isVisible` 不再硬编码 `false`

### E2: 类型安全修复
- [ ] `useDDDStateRestore.ts` 无 `as any`
- [ ] DDD store 类型统一导出
- [ ] TypeScript 编译 0 errors

### E3: Snapshot Schema 校验
- [ ] `z.array(z.any())` 替换为结构化 schema
- [ ] API 拒绝无效 payload 返回 400
- [ ] 后端单元测试通过

### E4: useAutoSave 边界测试
- [ ] 6 个边界场景覆盖
- [ ] vitest 全通过

### E5: useCanvasExport 响应式修复
- [ ] `isExporting` 变为 `useState`
- [ ] UI 正确显示 loading 状态

### E6: Snapshot Schema 升级
- [ ] Node schemas 结构化
- [ ] schemaVersion 字段存在

---

## 7. 实施计划

### Sprint 1 (P0, 5h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | Canvas Hooks 测试补全 | 2.5h |
| E2 | 类型安全修复 | 1.5h |
| E3 | Snapshot Schema 校验 | 1h |

### Sprint 2 (P1, 4h)
| Epic | 内容 | 工时 |
|------|------|------|
| E4 | useAutoSave 边界测试 | 3h |
| E5 | useCanvasExport 响应式 | 1h |

### Sprint 3 (P2, 3h)
| Epic | 内容 | 工时 |
|------|------|------|
| E6 | Snapshot Schema 升级 | 3h |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 测试引入新 bug | TDD 模式：先写测试再改实现 |
| Schema 破坏历史快照 | 保持 `z.array(z.any())` 作为 fallback |
| as any 移除暴露其他问题 | 先在小范围测试，确认无破坏再扩展 |

---

*文档版本: v1.0 | 最后更新: 2026-04-08*
