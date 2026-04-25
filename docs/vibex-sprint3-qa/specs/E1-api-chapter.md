# Spec — E1: 页面跳转连线

**文件**: `specs/E1-api-chapter.md`
**Epic**: E1 页面跳转连线
**基于**: PRD vibex-sprint3-qa § Epic/Story 表格 E1
**状态**: Draft

---

## 组件描述

FlowTreePanel 连线模块。负责在原型编辑器的页面树面板中管理页面跳转连线，支持连线创建、选中、删除，以及页面删除时关联 edges 级联清除。连线在 ProtoFlowCanvas 中渲染为 SVG 箭头。

---

## 四态定义

### 1. 理想态（Ideal）

**触发条件**: 页面树包含 ≥2 个页面，且用户刚完成一次成功的连线交互

**视觉表现**:
- FlowTreePanel 底部「添加连线」按钮可用（`disabled=false`）
- 连线列表区（EdgeList）显示所有 edges，每条含 source/target 标签
- 连线列表项可点击选中，选中态高亮（背景色 `var(--color-surface-secondary)`，左侧 2px `var(--color-accent-primary)` 边框）
- ProtoFlowCanvas 画布中，两页面节点之间渲染 SVG path 箭头连线（`stroke: var(--color-accent-primary)`，箭头 `fill: var(--color-accent-primary)`）
- 连线创建后自动高亮 1.5s（`opacity: 1 → 0.6` 过渡），给予正向反馈

**交互行为**:
- 点击「添加连线」→ 出现 source/target 选择模态框
- 选择 source 页面 → target 选择区加载完毕 → 用户选择 target → 连线生成
- 点击某条连线 → 选中态高亮，store 同步 `selectedEdgeId`
- 选中连线状态下按 Delete 键 → 连线删除

**情绪引导**: ➕ 愉悦 — 首次成功添加连线时，画布两点间出现箭头，给用户「我的原型有导航逻辑了」的成就感。

---

### 2. 空状态（Empty）

**触发条件**: 页面树为空或只有 1 个页面

**视觉表现**:
- 「添加连线」按钮置灰（`disabled=true`），`cursor: not-allowed`
- 连线列表区显示空态插画 + 文字「至少需要 2 个页面才能添加连线」（文字 `var(--color-text-tertiary)`，字号 `var(--font-size-sm)`）
- 空态区 padding: `var(--space-24)` 上下，内容居中

**交互行为**:
- 点击置灰按钮 → 无响应（`pointer-events: none`）
- 无 hover 态（保持 `disabled` 外观）

**情绪引导**: 😕 困惑预防 — 按钮置灰 + 明确提示「至少需要 2 个页面」，主动消除「按钮能用吗」的困惑，避免无效操作。

---

### 3. 加载态（Loading）

**触发条件**: 用户触发「添加连线」流程，source 页面已选，正在加载 target 页面列表

**视觉表现**:
- target 选择区域显示 skeleton loader（3 个 shimmer 块，高度 `var(--space-32)`，间距 `var(--space-8)`）
- 模态框内按钮文案变为「加载页面列表...」，`disabled=true`
- 加载区 `aria-busy="true"`，`role="status"` skeleton 容器

**交互行为**:
- 所有操作按钮 `disabled`，禁止重复提交
- skeleton 持续到列表加载完成或超时（超时走错误态）

**情绪引导**: 无明显负面 — 骨架屏比 spinner 感知更快（先有轮廓），「加载页面列表...」文案告知用户系统在工作。

---

### 4. 错误态（Error）

**触发条件**: 添加连线请求失败（API 错误、网络错误、store 更新失败）

**视觉表现**:
- 模态框顶部显示错误横幅（背景 `var(--color-error-subtle)`，文字 `var(--color-error)`，padding: `var(--space-12) var(--space-16)`，圆角 `var(--radius-md)`）
- 横幅内容：「连线创建失败，请重试」（文字 `var(--font-size-sm)`，icon 警告色 `var(--color-error)`）
- 按钮文案恢复为「添加连线」，`disabled=false`
- `store.edges` 保持不变（事务回滚）

**交互行为**:
- 点击「重试」→ 重新发起连线创建请求
- 关闭模态框 → 返回原状态

**情绪引导**: ➖ 挫败可控 — 错误明确显示而非静默失败，横幅用 `var(--color-error-subtle)` 而非纯红降低视觉攻击性。「请重试」引导下一步行动，而非卡死。

---

## 验收标准（expect() 断言）

```typescript
// E1-AC1: 连线创建成功
test('E1-AC1: 添加连线后 store.edges 包含正确数据，画布渲染 edge 元素', () => {
  store.addPage('page-1');
  store.addPage('page-2');
  store.addEdge('page-1', 'page-2');

  expect(store.edges).toHaveLength(1);
  expect(store.edges[0]).toMatchObject({
    source: 'page-1',
    target: 'page-2',
    type: 'smoothstep',
  });
  expect(canvas.query('[data-edge-id]')).toBeInTheDocument();
});

// E1-AC2: 连线删除
test('E1-AC2: 选中连线后按 Delete，连线从 store.edges 清除', () => {
  const edgeId = store.edges[0].id;
  store.selectEdge(edgeId);
  fireEvent.keyDown(document, { key: 'Delete' });
  expect(store.edges).toHaveLength(0);
});

// E1-AC3: 节点删除时 edges 级联清除
test('E1-AC3: 删除页面节点后，相关 source/target 的 edges 自动清除', () => {
  store.addEdge('n1', 'n2');
  store.removeNode('n1');
  const relatedEdges = store.edges.filter(
    (e) => e.source === 'n1' || e.target === 'n1'
  );
  expect(relatedEdges).toHaveLength(0);
});
```

---

## 相关组件

- `FlowTreePanel` — 页面树 + 连线管理 UI
- `ProtoFlowCanvas` — 画布 SVG 连线渲染
- `EdgeList` — 连线列表组件
- `AddEdgeModal` — source/target 选择模态框
- `prototypeStore.edges` — 连线状态管理

---

## 依赖关系

```
E1 依赖:
  └── prototypeStore.edges (Zustand store)
  └── ProtoFlowCanvas SVG rendering
上游: PRD E1 Epic
下游: E2 PropertyPanel Navigation Tab（依赖 edge 创建能力）
```
