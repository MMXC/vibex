# Spec: E4-version-diff — 版本 Diff 四态规格

**对应 Epic**: E4 版本 Diff 验证
**组件范围**: VersionDiff 组件 + computeVersionDiff 函数
**版本**: 1.0.0

---

## 1. computeVersionDiff 函数规格

### 1.1 接口定义

```typescript
// ProtoNode — 节点基础类型
interface ProtoNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  position?: { x: number; y: number };
  children?: ProtoNode[];
}

// Edge — 连线类型
interface Edge {
  id: string;
  source: string;
  target: string;
  props?: Record<string, unknown>;
}

// PrototypeExportData — diff 输入
interface PrototypeExportData {
  nodes: ProtoNode[];
  edges: Edge[];
}

// DiffResult — diff 输出
interface DiffResult {
  nodes?: {
    added?: ProtoNode[];      // 绿色标记
    removed?: ProtoNode[];    // 红色标记
    modified?: Array<{
      before: ProtoNode;     // 黄色标记（前）
      after: ProtoNode;       // 黄色标记（后）
    }>;
  };
  edges?: {
    added?: Edge[];
    removed?: Edge[];
  };
}

// 核心函数签名
function computeVersionDiff(
  v1: PrototypeExportData,
  v2: PrototypeExportData
): DiffResult;
```

### 1.2 四场景行为规格

**场景 1 — Added（新增节点）**:
- 输入: `v1.nodes = [{id: 'n1'}]`，`v2.nodes = [{id: 'n1'}, {id: 'n2'}]`
- 输出: `diff.nodes.added = [{id: 'n2'}]`，`diff.nodes.removed = []`，`diff.nodes.modified = []`

**场景 2 — Removed（删除节点）**:
- 输入: `v1.nodes = [{id: 'n1'}, {id: 'n2'}]`，`v2.nodes = [{id: 'n1'}]`
- 输出: `diff.nodes.removed = [{id: 'n2'}]`，`diff.nodes.added = []`

**场景 3 — Modified（修改属性）**:
- 输入: `v1.nodes = [{id: 'n1', type: 'Button', props: {text: 'Click'}}]`，`v2.nodes = [{id: 'n1', type: 'Button', props: {text: 'Submit'}}]`
- 输出: `diff.nodes.modified = [{before: {id: 'n1', props: {text: 'Click'}}, after: {id: 'n1', props: {text: 'Submit'}}}]`

**场景 4 — 无差异（Identical）**:
- 输入: `v1 === v2`（相同数据）
- 输出: `diff = {}`（空对象，不是 `null`）

### 1.3 diff 分类规则

1. 节点 ID 在 v1 不存在，在 v2 存在 → **added**
2. 节点 ID 在 v1 存在，在 v2 不存在 → **removed**
3. 节点 ID 在 v1 和 v2 都存在，但 props 或 type 不同 → **modified**（before/after 都需要）
4. 节点 ID 在 v1 和 v2 都存在，props 和 type 完全相同 → 不出现在 diff 结果中
5. 同一节点同时满足 added 和 modified（理论上不可能，以 added 为准）

---

## 2. VersionDiff 组件四态

### 2.1 理想态 (ideal)

**触发条件**: 用户选择两个版本，两者之间存在差异

**UI 元素**:
- Diff 区域容器（`testId="version-diff-container"`，`role="region"`，`aria-label="版本对比结果"`）
- Diff 摘要（`testId="diff-summary"`）：显示 "+3 / -1 / ~2"（新增/删除/修改数量）
- 节点 diff 列表（`testId="diff-node-list"`）：
  - **Added**（绿色，`testId="diff-added"`，`role="listitem"`，每个节点）：
    - 绿色左边框 `border-left: 4px solid var(--color-diff-added, #22C55E)`
    - 绿色背景 `var(--color-diff-added-bg, #F0FDF4)`
    - 节点类型 badge + 节点名称
    - props 变更展示（如有）
  - **Removed**（红色，`testId="diff-removed"`，`role="listitem"`）：
    - 红色左边框 `border-left: 4px solid var(--color-diff-removed, #EF4444)`
    - 红色背景 `var(--color-diff-removed-bg, #FEF2F2)`
    - 节点类型 badge + 节点名称
  - **Modified**（黄色，`testId="diff-modified"`，`role="listitem"`）：
    - 黄色左边框 `border-left: 4px solid var(--color-diff-modified, #F59E0B)`
    - 黄色背景 `var(--color-diff-modified-bg, #FFFBEB)`
    - 显示 before 值 → after 值（props 变化）
    - before 显示删除样式（红色删除线），after 显示新增样式（绿色下划线）
- 展开/折叠（按节点分组，`testId="diff-toggle-group"`）
- 连线 diff 区域（`testId="diff-edge-list"`，如果 edges 有变化）
  - added edges: 绿色虚线
  - removed edges: 红色虚线

**情绪引导文案**: "版本之间的变化一目了然"

**间距规范（8倍数）**:
- 容器内边距: `padding: 16px`
- 节点 diff 项间距: `gap: 8px`
- 节点 diff 项内边距: `padding: 12px`
- diff 类型分组间距: `gap: 16px`
- before/after 之间的箭头间距: `gap: 4px`（箭头图标前后）

**颜色 Token**:
- Added 边框: `var(--color-diff-added, #22C55E)`
- Added 背景: `var(--color-diff-added-bg, #F0FDF4)`
- Added 文字: `var(--color-diff-added, #22C55E)`
- Removed 边框: `var(--color-diff-removed, #EF4444)`
- Removed 背景: `var(--color-diff-removed-bg, #FEF2F2)`
- Removed 文字: `var(--color-diff-removed, #EF4444)`
- Modified 边框: `var(--color-diff-modified, #F59E0B)`
- Modified 背景: `var(--color-diff-modified-bg, #FFFBEB)`
- Modified 文字: `var(--color-diff-modified, #F59E0B)`

---

### 2.2 空状态 (empty)

**触发条件**: 用户选择两个版本，两者完全相同

**UI 元素**:
- Diff 区域容器保持渲染
- 空状态文案（`testId="no-diff-text"`，`role="status"`）："两个版本没有差异"
- 空状态图标（SVG inline，`color: var(--color-text-muted, #9CA3AF)`）
- 禁止纯空白，容器必须填充内容

**情绪引导文案**: "一模一样 — 没有变化就是最好的状态"

**间距规范**: 同 ideal，容器内居中

**颜色 Token**: 同 ideal，空状态文案/图标使用 `var(--color-text-muted, #9CA3AF)`

---

### 2.3 加载态 (loading)

**触发条件**: 用户选择了两个版本，等待 diff 计算期间

**UI 元素**:
- Diff 区域容器保持显示
- 骨架屏（`testId="diff-skeleton"`，`role="progressbar"`）：
  - 3 个灰色占位块（模拟 added/removed/modified 各一个）
  - 每个 `height: 64px`，`border-radius: 8px`
- 进度文案: "正在计算差异..."
- 禁止使用纯 spinner，必须有骨架屏

**情绪引导文案**: "正在计算版本差异，稍等片刻..."

**间距规范**: 同 ideal，骨架屏间距 `gap: 8px`

**颜色 Token**:
- 骨架屏背景: `var(--color-skeleton, #F3F4F6)`
- 骨架屏动画: `@keyframes shimmer`

---

### 2.4 错误态 (error)

**触发条件**: diff 计算过程中出错（数据结构异常 / 数据损坏）

**UI 元素**:
- Diff 区域容器保持显示
- 错误信息（`testId="diff-error"`，`role="alert"`）：
  - 红色背景 `var(--color-error-bg, #FEF2F2)`
  - 错误文案: "差异计算失败，请重新选择版本"
- 错误状态不渲染 diff 内容区域
- "重新选择" 按钮（`testId="reselect-btn"`）

**情绪引导文案**: "计算失败了，但可以选择其他版本再试"

**间距规范**: 同 ideal

**颜色 Token**:
- 错误背景: `var(--color-error-bg, #FEF2F2)`
- 错误文字: `var(--color-error, #EF4444)`

---

## 3. 验收标准

### QA 验证点映射

| 验证点 | 组件 | 场景 | 测试断言 |
|--------|------|------|---------|
| F4.1 | VersionDiff | ideal-added | `expect(getAllByTestId('diff-added')).toHaveLength(1)` |
| F4.1 | VersionDiff | ideal-removed | `expect(getAllByTestId('diff-removed')).toHaveLength(1)` |
| F4.1 | VersionDiff | ideal-modified | `expect(getAllByTestId('diff-modified')).toHaveLength(1)` |
| F4.1 | VersionDiff | empty | `expect(getByTestId('no-diff-text')).toHaveTextContent(/两个版本没有差异/i)` |
| F4.1 | VersionDiff | loading | `expect(getByTestId('diff-skeleton')).toBeVisible()` |
| F4.1 | VersionDiff | error | `expect(getByTestId('diff-error')).toBeVisible()` |
| F4.2 | computeVersionDiff | added | `expect(diff.nodes.added).toHaveLength(1)`<br>`expect(diff.nodes.added[0].id).toBe('n2')` |
| F4.2 | computeVersionDiff | removed | `expect(diff.nodes.removed).toHaveLength(1)`<br>`expect(diff.nodes.removed[0].id).toBe('n2')` |
| F4.2 | computeVersionDiff | modified | `expect(diff.nodes.modified).toHaveLength(1)`<br>`expect(diff.nodes.modified[0].before.props.text).toBe('Click')`<br>`expect(diff.nodes.modified[0].after.props.text).toBe('Submit')` |
| F4.2 | computeVersionDiff | identical | `expect(diff).toEqual({})` |

---

## 4. 设计约束

### 通用约束

- **间距**: 所有间距使用 8 倍数（`4px / 8px / 12px / 16px`），禁止硬编码非 8 倍数
- **颜色**: 所有颜色通过 CSS Custom Properties（Token）引用，禁止硬编码 hex 值。diff 颜色使用专用 Token（`var(--color-diff-added)` 等）
- **字体**: 节点名称使用 `var(--text-sm, 14px)`，diff 摘要使用 `var(--text-base, 16px)`
- **动画时长**: `var(--duration-fast, 150ms)` / `var(--duration-base, 300ms)`

### 四态设计原则

- **ideal**: 颜色编码清晰（绿/红/黄），变化一目了然
- **empty**: 具体文案说明"没有差异"，不产生困惑
- **loading**: 骨架屏 + 进度文案，禁止纯 spinner
- **error**: 错误信息具体，给出重新选择路径，不渲染脏 diff
