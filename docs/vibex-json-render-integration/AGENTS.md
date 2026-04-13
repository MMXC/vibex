# AGENTS.md — vibex-json-render-integration 实施指南

**项目**: vibex-json-render-integration
**阶段**: 实施（Phase 1 + Phase 2）
**日期**: 2026-04-14
**基于**: architecture.md + IMPLEMENTATION_PLAN.md

---

## 角色与职责

| 角色 | 职责 |
|------|------|
| Architect | 提供架构方案、代码规范、验收清单 |
| Coder | Phase 1 + Phase 2 代码实现 |
| QA | E2E 测试编写与验证 |
| Reviewer | 代码审查 + 回归验证 |

---

## 实施顺序

### Phase 1（1d，P0）

1. **Coder**: catalog.ts — 补全 slots 声明（Step 1）
2. **Coder**: JsonRenderPreview.tsx — 修复 nodesToSpec parentId（Step 2）
3. **Coder**: registry.tsx — Page 尺寸修复（Step 3）
4. **Coder**: 构建验证 `pnpm build`（Step 4）
5. **Reviewer**: 代码审查 + 合入

### Phase 2（1.75d，P1）

1. **Coder**: ActionProvider handlers 实现（Step 5）
2. **Coder**: 新建单元测试 nodesToSpec.test.ts（Step 6）
3. **QA**: 新建 E2E 测试 json-render-nested.spec.ts（Step 7）
4. **Coder**: 最终验证（Step 8）
5. **Reviewer**: 代码审查 + 合入

---

## 关键文件清单

### 必改文件（Phase 1）

| 文件 | 改动类型 |
|------|----------|
| `src/lib/canvas-renderer/catalog.ts` | 修改：添加 slots 声明 |
| `src/components/canvas/json-render/JsonRenderPreview.tsx` | 修改：nodesToSpec parentId 映射 + ActionProvider |
| `src/lib/canvas-renderer/registry.tsx` | 修改：Page 尺寸 + Modal children |

### 新建文件

| 文件 | 说明 |
|------|------|
| `src/components/canvas/json-render/__tests__/nodesToSpec.test.ts` | 单元测试 |
| `e2e/json-render-nested.spec.ts` | E2E 嵌套渲染测试 |

### 必读文件

| 文件 | 说明 |
|------|------|
| `docs/vibex-json-render-integration/architecture.md` | 架构方案 |
| `docs/vibex-json-render-integration/IMPLEMENTATION_PLAN.md` | 详细实施步骤 |
| `docs/vibex-json-render-integration/analysis.md` | 根因分析 |
| `docs/vibex-json-render-integration/prd.md` | PRD 验收标准 |
| `src/lib/canvas/types.ts`（ComponentNode 接口） | 理解数据结构 |
| `src/components/canvas/json-render/__tests__/CanvasPreviewModal.test.tsx` | 现有测试参考 |

---

## 代码规范

### 原则

1. **不改依赖版本**: json-render 包不升级，不改 package.json
2. **parentId 优先**: `nodesToSpec` 中 children 构建以 parentId 映射为准
3. **零破坏性**: catalog props 不删除，仅添加 slots
4. **CSS 类替换优先**: Page 尺寸用 Tailwind 类替换，不引入 JS 逻辑
5. **ActionProvider 轻量**: handlers 仅记录日志，不引入复杂副作用

### 禁止

- 禁止删除现有 catalog 组件的 props 字段（向后兼容）
- 禁止在 `nodesToSpec` 中删除 `node.children ?? []` 的 fallback（容错）
- 禁止在 `ActionProvider` 中直接修改 `componentStore`（职责隔离）

---

## 验收标准

### Phase 1 完成标准

- [ ] `catalog.ts` 中 Page/Form/DataTable/DetailView/Modal 均有 `slots: ['default']`
- [ ] `COMPONENT_TYPE_MAP` 包含 `button: 'Button'`
- [ ] `nodesToSpec` 二层嵌套场景：`expect(elements[parentId].children).toEqual([childId])`
- [ ] `nodesToSpec` 三层嵌套场景：children 链正确
- [ ] `PageImpl` 无 `min-h-screen`，使用 `min-h-full`
- [ ] `pnpm build` 通过（零 TypeScript 错误）

### Phase 2 完成标准

- [ ] `ActionProvider` handlers 包含 click/submit/navigate
- [ ] `nodesToSpec.test.ts` 6 个场景全部通过
- [ ] E2E 嵌套渲染测试：Page → Form → Button 三层可见
- [ ] E2E Preview Modal 测试：无 overflow
- [ ] `pnpm build` 通过
