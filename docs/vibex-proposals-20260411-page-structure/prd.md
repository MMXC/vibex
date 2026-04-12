# PRD: 组件树页面结构增强

**项目**: vibex-proposals-20260411-page-structure
**版本**: v1.0
**日期**: 2026-04-12
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景
当前组件树通过 `flowId` 关联 BusinessFlowNode.name 来展示页面归属，无独立 `pageId` 和 `pageName` 概念。用户无法直观看到组件的明确页面归属，JSON 预览功能缺乏统一入口查看整体树结构。

### 目标
在 `ComponentNode` 上增加 `pageName` 可选字段，允许覆盖 BusinessFlowNode.name；分组元数据增加 `pageId` 和 `componentCount`；组件树顶部增加「📋 JSON」预览入口，展示 pageId + pageName + 组件结构的 JSON 树视图。

### 成功指标
- 组件树分组标题支持显示自定义 `pageName`
- JSON 预览入口可见且数据格式正确
- 通用组件组保持置顶，label 为「🔧 通用组件」，pageId='__common__'
- 相关单元测试 100% pass

---

## 2. Epic 拆分

### Epic E1: ComponentNode 页面元数据增强

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E1-S1 | pageName 类型扩展 | ComponentNode 增加 `pageName?: string` 可选字段 | 0.5h | expect(pageName: '自定义名称').toBeTruthy() |
| E1-S2 | pageName 标签优先级 | `getPageLabel()` 优先使用 pageName，fallback 到 BusinessFlowNode.name | 0.5h | expect(label).toBe('自定义名称') |
| E1-S3 | 分组元数据 | ComponentGroup 增加 pageId + componentCount 字段 | 0.5h | expect(group.pageId).toBeTruthy(); expect(group.componentCount).toBeGreaterThan(0) |

**总工时估算**: 1.5h

### Epic E2: JSON 预览功能

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E2-S1 | JSON 预览按钮 | 组件树顶部添加「📋 JSON」按钮 | 0.5h | expect(button).toBeVisible(); expect(button.textContent).toContain('JSON') |
| E2-S2 | JSON 树视图渲染 | 点击后展示 pageId + pageName + 组件结构的 JSON 树 | 1h | expect(jsonView.data).toMatchObject({ pages: expect.any(Array) }) |
| E2-S3 | 通用组件组 JSON | JSON 输出中 pageId='__common__' 的通用组件组 | 0.5h | expect(jsonData.pages).toContainEqual(expect.objectContaining({ pageId: '__common__' })) |

**总工时估算**: 2h

### Epic E3: 回归与测试

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|----------|
| E3-S1 | 单元测试 | getPageLabel + groupByFlowId 的 pageName fallback 逻辑测试 | 0.5h | test coverage >80% |
| E3-S2 | E2E 测试 | JSON 预览按钮可见且点击后显示正确结构 | 0.5h | expect(JSONPreviewModal).toBeVisible() |

**总工时估算**: 1h

**项目总工时**: 4.5h（方案 A 最小增强，原估 3h 适度上调）

---

## 3. 验收标准（expect() 断言）

### E1-S1: pageName 类型扩展

```typescript
// ComponentNode 类型定义
const node: ComponentNode = {
  nodeId: 'c1',
  name: 'LoginForm',
  type: 'form',
  flowId: 'flow-login-001',
  pageName: '登录页（自定义）', // 新增可选字段
};
expect(node.pageName).toBe('登录页（自定义）');

// 未设置 pageName 时类型兼容
const node2: ComponentNode = { nodeId: 'c2', name: 'Button', type: 'button', flowId: '' };
expect(node2.pageName).toBeUndefined();
```

### E1-S2: pageName 标签优先级

```typescript
// pageName 存在时，优先于 BusinessFlowNode.name
const flowNodes = [{ nodeId: 'flow-login-001', name: '登录页面' }];
const component = { flowId: 'flow-login-001', pageName: '自定义登录页' };
const label = getPageLabel(component, flowNodes);
expect(label).toBe('自定义登录页');

// pageName 不存在时，fallback 到 BusinessFlowNode.name
const component2 = { flowId: 'flow-login-001' };
const label2 = getPageLabel(component2, flowNodes);
expect(label2).toBe('登录页面');
```

### E1-S3: 分组元数据

```typescript
// groupByFlowId 输出包含 pageId 和 componentCount
const groups = groupByFlowId(components, flowNodes);
groups.forEach(group => {
  expect(group.pageId).toBeTruthy();
  expect(typeof group.pageId).toBe('string');
  expect(group.componentCount).toBeGreaterThanOrEqual(0);
  expect(typeof group.componentCount).toBe('number');
});

// JSON 序列化包含 pageId 和 componentCount
const jsonStr = JSON.stringify(groups);
expect(jsonStr).toContain('pageId');
expect(jsonStr).toContain('componentCount');
```

### E2-S1: JSON 预览按钮

```typescript
// 组件树顶部存在 JSON 按钮
const treeWrapper = render(<ComponentTree />);
const jsonButton = treeWrapper.getByRole('button', { name: /json/i });
expect(jsonButton).toBeVisible();

// 按钮位置在组件树顶部
expect(jsonButton.parentElement).toBe(treeWrapper.container.firstElementChild);
```

### E2-S2: JSON 树视图渲染

```typescript
// 点击按钮后弹出 JSON 视图，数据结构正确
fireEvent.click(jsonButton);
const modal = screen.getByTestId('json-preview-modal');
expect(modal).toBeVisible();

const jsonData = JSON.parse(modal.textContent);
// 主结构
expect(jsonData).toHaveProperty('pages');
expect(Array.isArray(jsonData.pages)).toBe(true);

// 页面组结构
const page = jsonData.pages[0];
expect(page).toHaveProperty('pageId');
expect(page).toHaveProperty('pageName');
expect(page).toHaveProperty('componentCount');
expect(page).toHaveProperty('components');
expect(Array.isArray(page.components)).toBe(true);

// 组件节点结构
const comp = page.components[0];
expect(comp).toHaveProperty('nodeId');
expect(comp).toHaveProperty('name');
expect(comp).toHaveProperty('type');
expect(comp).toHaveProperty('flowId');
```

### E2-S3: 通用组件组 JSON

```typescript
// JSON 数据中包含 __common__ 组
const commonGroup = jsonData.pages.find(p => p.pageId === '__common__');
expect(commonGroup).toBeDefined();
expect(commonGroup.pageName).toBe('🔧 通用组件');
expect(commonGroup.componentCount).toBeGreaterThan(0);
expect(Array.isArray(commonGroup.components)).toBe(true);

// __common__ 组位于 pages 数组最前或最后
const commonIndex = jsonData.pages.findIndex(p => p.pageId === '__common__');
expect(commonIndex).toBeGreaterThanOrEqual(0);
```

### E3-S1: 单元测试覆盖

```typescript
// getPageLabel pageName fallback 逻辑
expect(getPageLabel({ flowId: 'f1', pageName: 'X' }, nodes)).toBe('X');
expect(getPageLabel({ flowId: 'f1' }, nodes)).toBe(nodes[0].name);
expect(getPageLabel({ flowId: '' }, nodes)).toBeNull();

// groupByFlowId 输出结构
const groups = groupByFlowId([{ flowId: '', type: 'modal' }], nodes);
expect(groups[0].pageId).toBe('__common__');
expect(groups[0].componentCount).toBe(1);
```

### E3-S2: E2E 测试

```typescript
// 浏览器端到端测试
await page.goto('/canvas');
await page.waitForSelector('[data-testid="component-tree"]');
const jsonBtn = page.getByRole('button', { name: /json/i });
await expect(jsonBtn).toBeVisible();
await jsonBtn.click();
const modal = page.getByTestId('json-preview-modal');
await expect(modal).toBeVisible();
const content = await modal.textContent();
const data = JSON.parse(content);
expect(data.pages).toBeInstanceOf(Array);
expect(data.pages.length).toBeGreaterThan(0);
```

---

## 4. 功能点明细

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | pageName 可选字段 | ComponentNode 类型增加 `pageName?: string` | expect(pageName: 'X').toBeTruthy() | 否 |
| F1.2 | pageName 标签优先级 | getPageLabel 优先显示 pageName | expect(label).toBe('自定义名称') | 否 |
| F1.3 | pageId + componentCount | ComponentGroup 增加这两个元数据字段 | expect(group.pageId).toBeTruthy() | 否 |
| F2.1 | 📋 JSON 按钮 | 组件树顶部添加 JSON 预览按钮 | expect(button).toBeVisible() | 是【需页面集成】 |
| F2.2 | JSON 树视图 | 展示 pageId + pageName + 组件结构 | expect(data.pages).toBeInstanceOf(Array) | 是【需页面集成】 |
| F2.3 | __common__ 组 JSON | pageId='__common__' 的通用组件组展示 | expect(pageId).toBe('__common__') | 是【需页面集成】 |
| F3.1 | 单元测试覆盖 | getPageLabel + groupByFlowId fallback 测试 | 29+ tests pass | 否 |
| F3.2 | E2E 测试 | JSON 预览按钮端到端测试 | expect(JSONPreviewModal).toBeVisible() | 是【需页面集成】 |

---

## 5. DoD (Definition of Done)

### E1 完成标准
- [ ] `src/lib/canvas/types.ts` 中 `ComponentNode` 接口包含 `pageName?: string`
- [ ] `src/components/canvas/ComponentTree.tsx` 中 `getPageLabel` 优先使用 `pageName`
- [ ] `ComponentGroup` 类型包含 `pageId: string` 和 `componentCount: number`
- [ ] 单元测试覆盖 pageName fallback 逻辑，测试通过

### E2 完成标准
- [ ] 组件树顶部渲染「📋 JSON」按钮，可点击
- [ ] 点击后弹出 JSON 视图模态框，数据格式符合 `{ pages: [{pageId, pageName, componentCount, components:[...]}] }`
- [ ] JSON 数据包含 `__common__` 通用组件组，pageId='__common__'，pageName='🔧 通用组件'
- [ ] 使用现有 `JsonTreeRenderer` 组件渲染 JSON 视图（复用不重复造轮子）

### E3 完成标准
- [ ] `pnpm test -- --testPathPattern=ComponentTree` 全通过
- [ ] E2E 测试 `npx playwright test` 包含 JSON 预览测试用例，通过
- [ ] 手动测试验证：设置 `pageName='自定义页面'` 的组件在树中显示该名称

---

## 6. 依赖关系

```
E1-S1 → E1-S2 → E1-S3 → E3-S1（可并行）
                             ↘ E3-S2（依赖 E2 完成后）
E2-S1 → E2-S2 → E2-S3 → E3-S2
```

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| pageName 与 BusinessFlowNode.name 不同步 | 低 | pageName 可选，用户主动配置才生效 |
| JSON 预览数据结构与现有 catalog 不兼容 | 低 | JSON 预览是独立视图，不影响现有 CanvasPreviewModal |
| 组件拖拽到页面功能超出范围 | 低 | 本次不含拖拽，仅静态展示 |

---

*PM: vibex-proposals-20260411-page-structure | 生成日期: 2026-04-12*
