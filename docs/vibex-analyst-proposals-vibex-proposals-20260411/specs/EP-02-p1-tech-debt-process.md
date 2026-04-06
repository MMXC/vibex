# Epic 2 Spec: P1 Tech Debt + Process 改进

**Epic ID**: EP-02
**Epic 名称**: P1 Tech Debt + Process 改进
**优先级**: P1
**工时**: Option A 3.5h / Option B 12.5h
**Sprint**: Sprint 1（Option A 部分）/ Sprint 2（Option B 扩展）
**状态**: Ready

---

## 1. Overview

完成 P1 级别的 Tech Debt 修复和流程改进，重点是建立提案执行闭环机制（CLI CI 集成），防止 P0 问题再次遗留。

---

## 2. Stories

### S2.1: Tree Toolbar 按钮样式归一
**工时**: 0.5h | **负责人**: dev

#### 背景
Tree 组件 Toolbar 中存在 4 种按钮样式（`bg-blue-500`/`bg-gray-100`/`border`/裸按钮），视觉不一致，影响用户体验。

#### 实现方案
统一为 2 种按钮样式：
```typescript
// 定义统一样式常量
const BUTTON_STYLES = {
  primary: "bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-sm transition-colors",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-1.5 text-sm transition-colors",
};
```

#### 文件变更
```
components/Tree/Toolbar.tsx        — 应用统一样式
components/Tree/Toolbar.module.css — 删除废弃样式（如有）
```

#### 验收标准
- [ ] Toolbar 按钮样式归一为 ≤ 2 种（grep 验证）
- [ ] 截图对比审查无明显视觉差异
- [ ] 按钮 hover 状态正常（过渡动画）

#### 测试
```typescript
// 截图对比测试（Playwright）
test('Toolbar 按钮样式一致性', async ({ page }) => {
  await page.goto('/tree');
  const buttons = await page.locator('[data-testid="tree-toolbar"] button').all();
  const styles = await Promise.all(buttons.map(b => b.getAttribute('class')));
  const uniqueStyles = new Set(styles);
  expect(uniqueStyles.size).toBeLessThanOrEqual(2);
});
```

---

### S2.2: selectedNodeIds 状态统一
**工时**: 3h（Option B） | **负责人**: dev

#### 背景
`selectedNodeIds` 在 `treeStore` 和 `canvasStore` 中各有定义，状态同步逻辑缺失，多选切换时出现不一致。

#### 实现方案
统一到单一状态源 `treeStore.selectedNodeIds`：
```typescript
// stores/treeStore.ts
export const useTreeStore = create<{
  selectedNodeIds: Set<string>;
  selectNode: (id: string) => void;
  deselectNode: (id: string) => void;
  toggleSelect: (id: string) => void;
}>((set, get) => ({
  selectedNodeIds: new Set(),
  selectNode: (id) => set((state) => {
    const newSet = new Set(state.selectedNodeIds);
    newSet.add(id);
    return { selectedNodeIds: newSet };
  }),
  deselectNode: (id) => set((state) => {
    const newSet = new Set(state.selectedNodeIds);
    newSet.delete(id);
    return { selectedNodeIds: newSet };
  }),
  toggleSelect: (id) => set((state) => {
    const newSet = new Set(state.selectedNodeIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return { selectedNodeIds: newSet };
  }),
}));

// stores/canvasStore.ts
// 移除 selectedNodeIds 定义，改为 computed
export const useCanvasStore = create<{
  // ... 其他状态
  // selectedNodeIds 通过 computed 派生，不再独立定义
}>((set, get) => ({
  // ...
}));
```

#### 文件变更
```
stores/treeStore.ts    — 保留 selectedNodeIds 状态定义
stores/canvasStore.ts  — 移除 selectedNodeIds，改为 selector 派生
```

#### 验收标准
- [ ] 单一 `selectedNodeIds` 定义源（grep 验证，仅 treeStore.ts 中出现）
- [ ] 多选切换状态同步正确（集成测试验证）
- [ ] 所有使用 selectedNodeIds 的组件正常渲染

#### 测试
```typescript
test('多选切换状态同步', async () => {
  const store = useTreeStore.getState();
  store.selectNode('node-1');
  store.selectNode('node-2');
  expect(store.selectedNodeIds.size).toBe(2);
  store.toggleSelect('node-1');
  expect(store.selectedNodeIds.size).toBe(1);
  expect(store.selectedNodeIds.has('node-1')).toBe(false);
  expect(store.selectedNodeIds.has('node-2')).toBe(true);
});
```

---

### S2.3: componentStore 批量方法
**工时**: 3h（Option B） | **负责人**: dev

#### 背景
批量添加/删除/更新组件需逐个调用 API，N+1 问题严重，影响 Canvas 性能。

#### 实现方案
```typescript
// services/componentStore.ts

interface BatchResult<T> {
  success: T[];
  failed: Array<{ id: string; error: string }>;
}

export const componentStore = {
  async batchAdd(components: Component[]): Promise<BatchResult<Component>> {
    const results = await Promise.allSettled(
      components.map(c => api.createComponent(c))
    );
    return parseBatchResults(components, results);
  },

  async batchDelete(ids: string[]): Promise<BatchResult<{ id: string }>> {
    const results = await Promise.allSettled(
      ids.map(id => api.deleteComponent(id))
    );
    return parseBatchResults(ids.map(id => ({ id })), results);
  },

  async batchUpdate(items: Partial<Component>[]): Promise<BatchResult<Component>> {
    const results = await Promise.allSettled(
      items.map(item => api.updateComponent(item))
    );
    return parseBatchResults(items, results);
  },
};
```

#### API 设计
```
POST /api/components/batch
Body: { action: 'add' | 'delete' | 'update', items: Component[] }
Response: { success: Component[], failed: Array<{ id: string; error: string }> }
```

#### 验收标准
- [ ] 批量操作 API 响应时间 < 500ms（100 组件）
- [ ] 事务回滚支持（失败项正确返回）
- [ ] `npm run test` 全部通过

#### 测试
```typescript
test('批量添加 100 组件 < 500ms', async () => {
  const components = Array.from({ length: 100 }, (_, i) => ({
    id: `comp-${i}`,
    type: 'rectangle',
  }));
  const start = Date.now();
  const result = await componentStore.batchAdd(components);
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(500);
  expect(result.failed.length).toBe(0);
});
```

---

### S2.4: 提案追踪 CLI CI 集成
**工时**: 2h | **负责人**: analyst

#### 背景
提案追踪 CLI (`proposal_tracker.py`) 已开发但团队无人使用，TRACKING.md 仍手动维护，连续两轮 P0 提案因此遗留。**这是本 Epic 最关键的功能。**

#### 实现方案
**Step 1**: CI Pipeline Hook
```yaml
# .github/workflows/proposal-tracking.yml
name: Proposal Tracker
on:
  pull_request:
    types: [closed, merged]
  push:
    branches: [main]

jobs:
  update-tracking:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update proposal tracking
        env:
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
        run: |
          python3 scripts/proposal_tracker.py update \
            --project ${{ github.event.pull_request.head.ref }} \
            --status merged \
            --merged-by ${{ github.event.pull_request.merged_by.login }}
```

**Step 2**: pre-merge 强制检查
```bash
# scripts/pre-merge-check.sh
python3 scripts/proposal_tracker.py check --project $PROJECT
if [ $? -ne 0 ]; then
  echo "❌ 提案状态未更新，请先运行: proposal_tracker.py update --project $PROJECT --status in-progress"
  exit 1
fi
```

**Step 3**: AGENTS.md 更新
在 `AGENTS.md` 中强制要求：
- 每条 PR 必须附带提案状态更新
- `task_manager.py update <project> <stage> done` 在 PR merged 后立即执行

#### 文件变更
```
.github/workflows/proposal-tracking.yml  — 新增 CI workflow
scripts/pre-merge-check.sh               — 新增 pre-merge 检查
AGENTS.md                                 — 更新协作规范
```

#### 验收标准
- [ ] PR merge 后 TRACKING.md 自动更新（无需手动编辑）
- [ ] 连续 3 个 Sprint CLI 使用率 ≥ 80%
- [ ] pre-merge 检查有效（未更新状态的 PR 无法 merge）

#### 测试
```bash
# 验证 CLI CI 集成
python3 scripts/proposal_tracker.py update \
  --project test-project \
  --status done \
  --merged-by test-user
# 验证 TRACKING.md 是否正确更新
```

---

### S2.5: generate-components E2E 测试
**工时**: 1h | **负责人**: tester

#### 背景
Dev 在 commit `5f3a2d` 中修复了 flowId 关联，但无 E2E 测试验证，修复有效性无法确认。

#### 实现方案
```typescript
// tests/e2e/generate-components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('generate-components', () => {
  test('正确关联 flowId', async ({ page }) => {
    await page.goto('/canvas');
    
    // 触发组件生成
    await page.click('[data-testid="generate-components-btn"]');
    
    // 等待 API 响应
    const response = await page.waitForResponse(
      '**/api/generate-components'
    );
    
    const data = await response.json();
    
    // 验收断言
    expect(data.flowId).toBeDefined();
    expect(typeof data.flowId).toBe('string');
    expect(data.flowId.length).toBeGreaterThan(0);
    expect(Array.isArray(data.components)).toBe(true);
    expect(data.components.length).toBeGreaterThan(0);
    
    // 验证 flowId 在组件元数据中记录
    for (const component of data.components) {
      expect(component.meta?.flowId).toBe(data.flowId);
    }
  });

  test('flowId 在组件生命周期中持久化', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[data-testid="generate-components-btn"]');
    
    const response = await page.waitForResponse('**/api/generate-components');
    const { flowId } = await response.json();
    
    // 刷新页面
    await page.reload();
    
    // 验证 flowId 仍然存在
    const canvasState = await page.evaluate(() => {
      return window.__CANVAS_STATE__?.flowId;
    });
    expect(canvasState).toBe(flowId);
  });
});
```

#### 验收标准
- [ ] E2E 测试 100% 通过（Playwright）
- [ ] flowId 在组件元数据中正确记录
- [ ] flowId 在页面刷新后持久化

---

## 3. Epic Acceptance Criteria

- [ ] S2.1: Toolbar 按钮样式 ≤ 2 种，截图审查通过
- [ ] S2.2: selectedNodeIds 单一状态源（Option B）
- [ ] S2.3: 批量操作 API 响应 < 500ms（Option B）
- [ ] S2.4: CLI CI 集成生效，TRACKING.md 自动更新
- [ ] S2.5: E2E 测试通过
- [ ] 所有变更经过 code review
- [ ] Option A 部分在 Sprint 1 完成

## 4. 关键成功因素

**S2.4 是本 Epic 最关键的 Story**。提案执行闭环机制的建立是防止 P0 再次遗留的根本解决方案。如果 CLI CI 集成失败或使用率不足，P0 遗留问题将继续循环。
