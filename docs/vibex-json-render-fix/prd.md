# PRD: vibex-json-render-fix — 组件预览空白问题修复

**项目**: vibex-json-render-fix
**阶段**: create-prd
**产出时间**: 2026-04-11 16:30 GMT+8
**PM**: pm
**依据**: analysis.md, feature-list.md

---

## 1. 执行摘要

### 背景

Canvas 的"预览"功能（CanvasPreviewModal → JsonRenderPreview）打开后显示空白：
- 组件节点已生成（有 name、type 数据）
- 但预览区域无渲染内容（空 div 结构）
- ErrorBoundary 未触发（无 JS 错误）

### 根因

`canvasApi.ts` 的 `fetchComponentTree()` 函数中，`props` 字段被硬编码为空对象 `{}`：

```typescript
// 当前错误代码
return result.components.map((comp) => ({
  ...
  props: {},  // ← 始终为空对象
  children: [],
}));
```

当 `nodesToSpec()` 将这些传给 json-render 时，所有组件仅有 `{ title: "组件名" }`，导致：
- Form → 渲染空表单（无字段）
- DataTable → 渲染空表格（无列）
- Page → 渲染空页面容器

### 目标

修复 `fetchComponentTree()` 的 props 填充逻辑，使预览区域显示有内容的组件。

### 成功指标

- [ ] Page 类型预览 → 显示带标题的页面容器
- [ ] Form 类型预览 → 显示带字段的表单（含邮箱/密码示例字段）
- [ ] List 类型预览 → 显示带列名的表格
- [ ] Detail 类型预览 → 显示带字段的详情页
- [ ] Modal 类型预览 → 显示带标题的弹窗
- [ ] E2E 测试 `json-render-preview.spec.ts` 全部通过（3 个测试）
- [ ] 单元测试 `JsonRenderPreview.test.tsx` 全部通过（5 个测试）

---

## 2. Epic 拆分

### Epic 1: 修复组件预览空白

**目标**: 通过补充 `generateDefaultProps()` 解决根因，使 json-render 能渲染有意义内容。

#### Story 1.1: 实现 generateDefaultProps() 辅助函数

| 字段 | 内容 |
|------|------|
| **Story ID** | S1.1 |
| **描述** | 在 `canvasApi.ts` 新增 `generateDefaultProps(type, name)` 函数，根据组件 type 返回符合 catalog schema 的默认 props |
| **工时** | 15 min |
| **依赖** | 无 |
| **验收标准** | 5 种组件类型（page/form/list/detail/modal）均返回符合 catalog Zod schema 的默认 props |

**具体返回结构**:

| type | 返回的 props |
|------|-------------|
| page | `{ title: name, layout: 'topnav' }` |
| form | `{ title: name, fields: [{name, label, type, placeholder, required}...] }` |
| list | `{ title: name, columns: [{key, label, sortable}...], rows: 10, searchable: true }` |
| detail | `{ title: name, fields: [{label, value}...] }` |
| modal | `{ title: name, size: 'md' }` |
| default | `{ title: name }` |

#### Story 1.2: 替换 fetchComponentTree 中的 props 填充

| 字段 | 内容 |
|------|------|
| **Story ID** | S1.2 |
| **描述** | 将 `fetchComponentTree` 返回中的 `props: {}` 替换为 `props: generateDefaultProps(comp.type, comp.name)` |
| **工时** | 5 min |
| **依赖** | S1.1 |
| **验收标准** | `props` 字段不再为空对象 `{}` |

#### Story 1.3: 验证预览渲染效果

| 字段 | 内容 |
|------|------|
| **Story ID** | S1.3 |
| **描述** | 运行 E2E 测试和单元测试，验证 5 种组件类型预览均有内容 |
| **工时** | 10 min |
| **依赖** | S1.1, S1.2 |
| **验收标准** | E2E 3 个测试 + 单元 5 个测试全部通过 |

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 实现 generateDefaultProps() | 根据 type 返回符合 catalog schema 的默认 props | expect(generateDefaultProps('form')).toMatchObject({ fields: expect.any(Array) }) | 否 |
| F1.2 | 替换 props 填充逻辑 | fetchComponentTree 使用 generateDefaultProps | expect(node.props).not.toEqual({}) | 否 |
| F1.3 | 验证渲染效果 | E2E + 单元测试验证 5 种组件非空白 | expect(e2eTests).toHaveLength(3) && expect(unitTests).toHaveLength(5) | 否 |

---

## 4. 验收标准（可写 expect() 断言）

### S1.1 — generateDefaultProps()

```typescript
expect(generateDefaultProps('page', 'TestPage')).toMatchObject({ title: 'TestPage', layout: 'topnav' });
expect(generateDefaultProps('form', 'TestForm')).toMatchObject({ title: 'TestForm', fields: expect.any(Array) });
expect(generateDefaultProps('list', 'TestList')).toMatchObject({ title: 'TestList', columns: expect.any(Array) });
expect(generateDefaultProps('detail', 'TestDetail')).toMatchObject({ title: 'TestDetail', fields: expect.any(Array) });
expect(generateDefaultProps('modal', 'TestModal')).toMatchObject({ title: 'TestModal', size: 'md' });
expect(generateDefaultProps('unknown', 'Test')).toMatchObject({ title: 'Test' });
```

### S1.2 — fetchComponentTree props

```typescript
const nodes = await fetchComponentTree(mockResponse);
nodes.forEach(node => {
  expect(node.props).not.toEqual({});
  expect(Object.keys(node.props).length).toBeGreaterThan(0);
});
```

### S1.3 — 测试通过

```typescript
// E2E
const result = execSync('cd vibex-fronted && pnpm e2e json-render-preview.spec.ts');
expect(result.status).toBe(0);

// 单元
const result2 = execSync('cd vibex-fronted && pnpm test JsonRenderPreview.test.tsx');
expect(result2.status).toBe(0);
```

---

## 5. DoD (Definition of Done)

以下条件**全部满足**时，视为研发完成：

- [ ] `generateDefaultProps()` 函数已实现，5 种 type 均返回符合 catalog schema 的 props
- [ ] `fetchComponentTree()` 中 `props: {}` 已替换为 `props: generateDefaultProps(comp.type, comp.name)`
- [ ] E2E 测试 `pnpm e2e json-render-preview.spec.ts` 退出码为 0（3 个测试全部通过）
- [ ] 单元测试 `pnpm test JsonRenderPreview.test.tsx` 退出码为 0（5 个测试全部通过）
- [ ] `pnpm build` 无 TypeScript 错误

---

## 6. 关键文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `vibex-fronted/src/lib/canvas/api/canvasApi.ts` | ❌ 需修复 | `fetchComponentTree` props 硬编码为空 |
| `vibex-fronted/src/components/canvas/json-render/JsonRenderPreview.tsx` | ✅ 正常 | 转换逻辑正确 |
| `vibex-fronted/src/lib/canvas-renderer/catalog.ts` | ✅ 正常 | Zod schema 参考 |
| `vibex-fronted/e2e/json-render-preview.spec.ts` | ✅ 正常 | 3 个 E2E 测试 |
| `vibex-fronted/tests/unit/components/canvas/json-render/JsonRenderPreview.test.tsx` | ✅ 正常 | 5 个单元测试 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-json-render-fix
- **执行日期**: 2026-04-11
