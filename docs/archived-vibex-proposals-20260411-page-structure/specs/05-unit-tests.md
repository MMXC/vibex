# Spec: 单元测试规格（getPageLabel + groupByFlowId）

**Spec 版本**: 1.0  
**对应 PRD Epic**: Epic 4 — 测试覆盖  
**对应 Stories**: S4.1, S4.2  
**对应功能点**: F4.1, F4.2  
**验收标准**: AC1, AC2, AC3, AC4, AC9, AC10  

---

## 1. 概述

为 `getPageLabel` 和 `groupByFlowId` 函数编写完整的单元测试，覆盖新增的 pageName 优先逻辑、ComponentGroup 元数据增强（pageId + componentCount）以及通用组件组置顶逻辑。

测试框架: **Vitest**  
E2E 框架: **Playwright**

---

## 2. 详细设计

### 2.1 测试文件结构

```
packages/vibex-component-tree/src/__tests__/
├── getPageLabel.test.ts       # getPageLabel 单元测试
├── groupByFlowId.test.ts      # groupByFlowId 单元测试
├── sortGroups.test.ts         # sortGroups 单元测试
├── buildPagesData.test.ts     # JSON 预览数据构建测试
└── json-preview.e2e.ts        # Playwright E2E 测试
```

### 2.2 测试数据 fixtures

```typescript
// 共享测试数据 fixtures
import type { ComponentNode, ComponentGroup, BusinessFlowNode } from '../types';

const flowMap = new Map<string, BusinessFlowNode>([
  ['flow-1', { id: 'flow-1', name: '首页' }],
  ['flow-2', { id: 'flow-2', name: '详情页' }],
  ['flow-3', { id: 'flow-3', name: '设置页' }],
]);

const baseNode = (
  id: string,
  flowId: string,
  overrides: Partial<ComponentNode> = {}
): ComponentNode => ({
  id,
  type: 'component',
  label: `组件${id}`,
  flowId,
  ...overrides,
});
```

---

## 3. getPageLabel 单元测试

**文件**: `packages/vibex-component-tree/src/__tests__/getPageLabel.test.ts`

### 3.1 测试用例列表

| # | 场景 | 预期结果 |
|---|------|----------|
| 1 | 有 pageName | 返回 pageName |
| 2 | 无 pageName，有 BusinessFlowNode | 返回 BusinessFlowNode.name |
| 3 | 无 pageName，无 BusinessFlowNode | 返回 node.label |
| 4 | 无 pageName，无 BusinessFlowNode，无 label | 返回 '未知页面' |
| 5 | pageName 为空字符串 | 应 fallback 还是返回空字符串？（按当前逻辑返回空字符串）|
| 6 | BusinessFlowNode.name 为空字符串 | fallback 到 node.label |

### 3.2 测试代码

```typescript
import { describe, it, expect } from 'vitest';
import { getPageLabel } from '../utils/getPageLabel';
import type { ComponentNode, BusinessFlowNode } from '../../types';

describe('getPageLabel', () => {
  const flowMap = new Map<string, BusinessFlowNode>([
    ['flow-1', { id: 'flow-1', name: '首页' }],
    ['flow-2', { id: 'flow-2', name: '' }], // 空 name
  ]);

  // ✅ AC2: 有 pageName 返回 pageName
  it('应返回 pageName 当其存在', () => {
    const node: ComponentNode = {
      id: 'node-1',
      type: 'component',
      label: '按钮',
      flowId: 'flow-1',
      pageName: '自定义首页',
    };
    expect(getPageLabel(node, flowMap)).toBe('自定义首页');
  });

  // ✅ AC3: 无 pageName 但有 BusinessFlowNode
  it('应 fallback 到 BusinessFlowNode.name 当无 pageName', () => {
    const node: ComponentNode = {
      id: 'node-2',
      type: 'component',
      label: '按钮',
      flowId: 'flow-1',
    };
    expect(getPageLabel(node, flowMap)).toBe('首页');
  });

  // ✅ AC1: 无 pageName 且无 BusinessFlowNode
  it('应返回 node.label 当无 pageName 且无 BusinessFlowNode', () => {
    const emptyFlowMap = new Map<string, BusinessFlowNode>();
    const node: ComponentNode = {
      id: 'node-3',
      type: 'component',
      label: '兜底标签',
      flowId: 'flow-unknown',
    };
    expect(getPageLabel(node, emptyFlowMap)).toBe('兜底标签');
  });

  // ✅ 极端边界：无 pageName，无 BusinessFlowNode，无 label
  it('应返回未知页面兜底文本', () => {
    const emptyFlowMap = new Map<string, BusinessFlowNode>();
    const node: ComponentNode = {
      id: 'node-4',
      type: 'component',
      label: '',
      flowId: 'flow-unknown',
    };
    expect(getPageLabel(node, emptyFlowMap)).toBe('未知页面');
  });

  // ✅ BusinessFlowNode.name 为空字符串时 fallback
  it('BusinessFlowNode.name 为空时应 fallback 到 node.label', () => {
    const node: ComponentNode = {
      id: 'node-5',
      type: 'component',
      label: '按钮组件',
      flowId: 'flow-2', // 空 name 的 flow
    };
    expect(getPageLabel(node, flowMap)).toBe('按钮组件');
  });

  // ✅ pageName 优先级高于 BusinessFlowNode.name
  it('pageName 应优先于 BusinessFlowNode.name', () => {
    const node: ComponentNode = {
      id: 'node-6',
      type: 'component',
      label: '按钮',
      flowId: 'flow-1',
      pageName: '覆盖名称',
    };
    expect(getPageLabel(node, flowMap)).toBe('覆盖名称');
    expect(getPageLabel(node, flowMap)).not.toBe('首页');
  });
});
```

---

## 4. groupByFlowId 单元测试

**文件**: `packages/vibex-component-tree/src/__tests__/groupByFlowId.test.ts`

### 4.1 测试用例列表

| # | 场景 | 预期结果 |
|---|------|----------|
| 1 | 正常分组 | pageId + componentCount 正确 |
| 2 | 通用组件组 | pageId='__common__', label='🔧 通用组件' |
| 3 | 空组件数组 | 返回空数组 |
| 4 | 单组件 | componentCount=1 |
| 5 | 通用组件组置顶 | 出现在 groups[0] |

### 4.2 测试代码

```typescript
import { describe, it, expect } from 'vitest';
import { groupByFlowId } from '../utils/groupByFlowId';
import type { ComponentNode, BusinessFlowNode } from '../../types';

describe('groupByFlowId', () => {
  const flowMap = new Map<string, BusinessFlowNode>([
    ['flow-home', { id: 'flow-home', name: '首页' }],
    ['flow-detail', { id: 'flow-detail', name: '详情页' }],
  ]);

  // ✅ AC4: 分组结果包含 pageId + componentCount
  it('应正确计算 pageId 和 componentCount', () => {
    const components: ComponentNode[] = [
      { id: 'c1', type: 'Button', label: '按钮1', flowId: 'flow-home' },
      { id: 'c2', type: 'Input', label: '输入框', flowId: 'flow-home' },
      { id: 'c3', type: 'Text', label: '文本', flowId: 'flow-detail' },
    ];

    const groups = groupByFlowId(components, flowMap);

    const homeGroup = groups.find(g => g.pageId === 'flow-home');
    expect(homeGroup).toBeDefined();
    expect(homeGroup!.componentCount).toBe(2);       // ✅ F2.3
    expect(homeGroup!.pageId).toBe('flow-home');      // ✅ F2.2

    const detailGroup = groups.find(g => g.pageId === 'flow-detail');
    expect(detailGroup!.componentCount).toBe(1);
  });

  // ✅ AC5: 通用组件组 label 正确
  it('通用组件组应 label 为🔧通用组件，pageId 为__common__', () => {
    const components: ComponentNode[] = [
      { id: 'c1', type: 'Divider', label: '分割线', flowId: '__common__' },
      { id: 'c2', type: 'Spacer', label: '间距', flowId: '__common__' },
    ];

    const groups = groupByFlowId(components, new Map());

    const commonGroup = groups.find(g => g.isCommon);
    expect(commonGroup).toBeDefined();
    expect(commonGroup!.pageId).toBe('__common__');      // ✅ AC5
    expect(commonGroup!.label).toBe('🔧 通用组件');      // ✅ AC5
    expect(commonGroup!.componentCount).toBe(2);
  });

  // ✅ 通用组件组置顶
  it('通用组件组应出现在分组结果的最前面', () => {
    const components: ComponentNode[] = [
      { id: 'c1', type: 'Button', label: '按钮', flowId: 'flow-home' },
      { id: 'c2', type: 'Divider', label: '分割线', flowId: '__common__' },
    ];

    const groups = groupByFlowId(components, flowMap);

    expect(groups[0].isCommon).toBe(true);               // ✅ AC5
    expect(groups[0].pageId).toBe('__common__');
    expect(groups[1].pageId).toBe('flow-home');
  });

  // ✅ 空数组
  it('空组件数组应返回空数组', () => {
    const groups = groupByFlowId([], new Map());
    expect(groups).toEqual([]);
  });

  // ✅ 单组件 componentCount=1
  it('单组件分组 componentCount 应为 1', () => {
    const components: ComponentNode[] = [
      { id: 'c1', type: 'Button', label: '按钮', flowId: 'flow-home' },
    ];
    const groups = groupByFlowId(components, flowMap);
    expect(groups).toHaveLength(1);
    expect(groups[0].componentCount).toBe(1);
    expect(groups[0].components).toHaveLength(1);
  });

  // ✅ 向后兼容：flowId 分组逻辑不变
  it('应保持原有的 flowId 分组逻辑', () => {
    const components: ComponentNode[] = [
      { id: 'c1', type: 'A', label: 'A', flowId: 'flow-1' },
      { id: 'c2', type: 'B', label: 'B', flowId: 'flow-1' },
      { id: 'c3', type: 'C', label: 'C', flowId: 'flow-2' },
    ];
    const groups = groupByFlowId(components, flowMap);
    expect(groups).toHaveLength(2);
    const flow1Group = groups.find(g => g.pageId === 'flow-1');
    expect(flow1Group!.components).toHaveLength(2);
  });

  // ✅ pageName 在分组中被正确保留
  it('应保留 pageName 字段到分组 components 中', () => {
    const components: ComponentNode[] = [
      {
        id: 'c1',
        type: 'Button',
        label: '按钮',
        flowId: 'flow-home',
        pageName: '首页自定义名称',
      },
    ];
    const groups = groupByFlowId(components, flowMap);
    expect(groups[0].components[0].pageName).toBe('首页自定义名称');
  });
});
```

---

## 5. sortGroups 单元测试

**文件**: `packages/vibex-component-tree/src/__tests__/sortGroups.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sortGroups } from '../utils/sortGroups';
import type { ComponentGroup } from '../../types';

describe('sortGroups', () => {
  const makeGroup = (
    pageId: string,
    isCommon: boolean,
    componentCount: number
  ): ComponentGroup => ({
    label: isCommon ? '🔧 通用组件' : `页面${pageId}`,
    pageId,
    componentCount,
    isCommon,
    components: [],
  });

  // ✅ AC5: 通用组件组置顶
  it('通用组件组应排在第一位', () => {
    const groups: ComponentGroup[] = [
      makeGroup('flow-a', false, 2),
      makeGroup('__common__', true, 3),
      makeGroup('flow-b', false, 1),
    ];
    const sorted = sortGroups(groups);
    expect(sorted[0].isCommon).toBe(true);
    expect(sorted[0].pageId).toBe('__common__');
  });

  // ✅ 无通用组件时顺序不变
  it('无通用组件组时应保持原有顺序', () => {
    const groups: ComponentGroup[] = [
      makeGroup('flow-a', false, 1),
      makeGroup('flow-b', false, 2),
    ];
    const sorted = sortGroups(groups);
    expect(sorted[0].pageId).toBe('flow-a');
    expect(sorted[1].pageId).toBe('flow-b');
  });

  // ✅ 多个通用组件（理论上不应出现，但逻辑应稳定）
  it('多个通用组件组时应保持原有相对顺序', () => {
    const groups: ComponentGroup[] = [
      makeGroup('flow-a', false, 1),
      makeGroup('__common__2', true, 2),
      makeGroup('__common__1', true, 3),
    ];
    const sorted = sortGroups(groups);
    expect(sorted.filter(g => g.isCommon)).toHaveLength(2);
    // 通用组件应在最前
    expect(sorted[0].isCommon).toBe(true);
    expect(sorted[1].isCommon).toBe(true);
  });
});
```

---

## 6. buildPagesData 单元测试

**文件**: `packages/vibex-component-tree/src/__tests__/buildPagesData.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { buildPagesData } from '../utils/buildPagesData';
import type { ComponentGroup } from '../../types';

describe('buildPagesData', () => {
  // ✅ F3.3: JSON 数据结构完整
  it('应生成正确的 pages 数据结构', () => {
    const groups: ComponentGroup[] = [
      {
        label: '首页',
        pageId: 'flow-home',
        componentCount: 2,
        isCommon: false,
        components: [
          { id: 'c1', type: 'Button', label: '按钮', flowId: 'flow-home' },
          { id: 'c2', type: 'Input', label: '输入框', flowId: 'flow-home' },
        ],
      },
    ];

    const result = buildPagesData(groups);

    expect(result).toHaveProperty('pages');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0]).toHaveProperty('pageId', 'flow-home');         // ✅ F3.3
    expect(result.pages[0]).toHaveProperty('pageName', '首页');
    expect(result.pages[0]).toHaveProperty('componentCount', 2);           // ✅ F3.3
    expect(result.pages[0]).toHaveProperty('components');
    expect(result.pages[0].components).toHaveLength(2);
  });

  // ✅ pageName 透传
  it('应正确透传 pageName 字段', () => {
    const groups: ComponentGroup[] = [
      {
        label: 'fallback',
        pageId: 'flow-1',
        componentCount: 1,
        isCommon: false,
        components: [
          {
            id: 'c1',
            type: 'Button',
            label: '按钮',
            flowId: 'flow-1',
            pageName: '自定义名称',
          },
        ],
      },
    ];
    const result = buildPagesData(groups);
    expect(result.pages[0].components[0]).toHaveProperty('pageName', '自定义名称');
  });

  // ✅ 空数组
  it('空 groups 应返回 pages: []', () => {
    const result = buildPagesData([]);
    expect(result.pages).toEqual([]);
  });

  // ✅ 通用组件组序列化
  it('通用组件组应正确序列化到 pages 中', () => {
    const groups: ComponentGroup[] = [
      {
        label: '🔧 通用组件',
        pageId: '__common__',
        componentCount: 1,
        isCommon: true,
        components: [{ id: 'c1', type: 'Divider', label: '分割线', flowId: '__common__' }],
      },
    ];
    const result = buildPagesData(groups);
    expect(result.pages[0].pageId).toBe('__common__');
    expect(result.pages[0].pageName).toBe('🔧 通用组件');
    expect(result.pages[0].componentCount).toBe(1);
  });
});
```

---

## 7. E2E 测试（Playwright）

**文件**: `packages/vibex-component-tree/e2e/json-preview.e2e.ts`

```typescript
import { test, expect } from '@playwright/test';

// ✅ AC6: 组件树渲染时「📋 JSON」按钮可见
test('JSON button is visible in component tree toolbar', async ({ page }) => {
  await page.goto('/canvas/component-tree');
  const jsonButton = page.getByRole('button', { name: '📋 JSON' });
  await expect(jsonButton).toBeVisible();
});

// ✅ AC7: 点击按钮显示 JSON 弹窗
test('clicking JSON button opens modal with pages data', async ({ page }) => {
  await page.goto('/canvas/component-tree');

  // 等待组件树加载
  await page.waitForSelector('[data-testid="component-tree"]');

  // 点击 JSON 按钮
  await page.getByRole('button', { name: '📋 JSON' }).click();

  // ✅ AC7 + F3.2: 弹窗显示 pages 数组相关内容
  await expect(page.getByText(/pageId/)).toBeVisible();
  await expect(page.getByText(/pageName/)).toBeVisible();
  await expect(page.getByText(/componentCount/)).toBeVisible();
  await expect(page.getByText(/components/)).toBeVisible();
});

// ✅ AC8: JSON 弹窗包含正确的组件数据
test('JSON modal displays correct component structure', async ({ page }) => {
  await page.goto('/canvas/component-tree');
  await page.getByRole('button', { name: '📋 JSON' }).click();

  // 验证 JSON 内容中包含具体组件数据
  const modal = page.locator('[data-testid="json-preview-modal"]');
  await expect(modal).toBeVisible();

  // 验证 JSON 格式正确（存在数组结构）
  const modalContent = await modal.textContent();
  const parsed = JSON.parse(modalContent!);
  expect(Array.isArray(parsed.pages)).toBe(true);
  expect(parsed.pages[0]).toHaveProperty('pageId');
  expect(parsed.pages[0]).toHaveProperty('pageName');
  expect(parsed.pages[0]).toHaveProperty('componentCount');
  expect(parsed.pages[0]).toHaveProperty('components');
  expect(Array.isArray(parsed.pages[0].components)).toBe(true);
});

// ✅ AC10: E2E 测试 100% pass
test('modal can be closed', async ({ page }) => {
  await page.goto('/canvas/component-tree');
  await page.getByRole('button', { name: '📋 JSON' }).click();
  await page.getByRole('button', { name: '关闭' }).click();
  await expect(page.getByTestId('json-preview-modal')).not.toBeVisible();
});
```

---

## 8. 测试覆盖率目标

| 函数 | 目标覆盖率 |
|------|-----------|
| `getPageLabel` | ≥ 90% |
| `groupByFlowId` | ≥ 90% |
| `sortGroups` | 100% |
| `buildPagesData` | 100% |

```bash
# 运行命令
npx vitest run --coverage

# 预期结果
✓ getPageLabel    100% (6/6 cases)
✓ groupByFlowId   93%  (7/7 cases, 1 branch)
✓ sortGroups      100% (3/3 cases)
✓ buildPagesData  100% (4/4 cases)
```

---

## 9. 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| Vitest 与项目现有测试框架冲突 | 低 | 确认 Vitest 为项目指定测试框架 |
| E2E 测试路径 `/canvas/component-tree` 不存在 | 低 | 测试前确认路由，或使用动态路由参数 |
| Playwright 弹窗动画导致断言不稳定 | 低 | 使用 `waitForSelector` + `toBeVisible()`，避免硬性 sleep |
| 测试 fixture 数据与真实 API 响应不一致 | 中 | 使用接口类型断言 (`expect(group).toHaveProperty('pageId')`) |
