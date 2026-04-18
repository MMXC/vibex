# Spec: E4 — 版本 Diff 可视化规格

**对应 Epic**: E3-C4（暂缓 P2）
**目标文件**: `vibex-fronted/src/components/version-diff/VersionDiff.tsx`
**相关**: `vibex-fronted/src/lib/diff/diffpatcher.ts`

---

## 1. VersionDiff 组件规格

### 理想态
- 展示两个版本的 diff
- diff 类型：
  - 绿色高亮：`+` 新增（节点/边/属性）
  - 红色高亮：`-` 删除
  - 黄色高亮：`~` 修改（属性值变化）
- 支持展开/折叠（按节点分组）

### 空状态
- 两个版本完全相同时：显示 "两个版本没有差异"
- 禁止只留白

### 加载态
- diff 计算中：骨架屏
- 禁止使用纯转圈

### 错误态
- diff 计算失败：显示错误信息

---

## 2. diff 输出格式规范

```typescript
// 使用 jsondiffpatch
import { diff } from 'jsondiffpatch';

interface DiffResult {
  nodes?: {
    added?: ProtoNode[];    // 绿色
    removed?: ProtoNode[];   // 红色
    modified?: Array<{ id: string; before: ProtoNode; after: ProtoNode }>;  // 黄色
  };
  edges?: {
    added?: Edge[];
    removed?: Edge[];
  };
}

function computeVersionDiff(v1: PrototypeExportData, v2: PrototypeExportData): DiffResult {
  const delta = diff(v1, v2);
  return parseDiffDelta(delta);
}
```

---

## 3. 验证用例

```typescript
// diff-U1: 新增节点
test('diff-U1: v2 比 v1 多一个节点，diff 正确标记为 added', () => {
  const diffResult = computeVersionDiff(v1, v2);
  expect(diffResult.nodes.added).toHaveLength(1);
  expect(diffResult.nodes.added[0].id).toBe('new-node-id');
});

// diff-U2: 删除节点
test('diff-U2: v2 比 v1 少一个节点，diff 正确标记为 removed', () => {
  expect(diffResult.nodes.removed).toHaveLength(1);
});

// diff-U3: 修改节点属性
test('diff-U3: 节点属性变化，diff 正确标记为 modified', () => {
  expect(diffResult.nodes.modified).toHaveLength(1);
  expect(diffResult.nodes.modified[0].before.props.text).toBe('old');
  expect(diffResult.nodes.modified[0].after.props.text).toBe('new');
});

// diff-U4: 无差异
test('diff-U4: 两个版本完全相同，diff 为空', () => {
  expect(computeVersionDiff(v1, v1)).toEqual({});
});
```

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 新增：`background: var(--color-diff-added)` token（绿色）
- 删除：`background: var(--color-diff-removed)` token（红色）
- 修改：`background: var(--color-diff-modified)` token（黄色）
