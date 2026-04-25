# Spec: E4 — 版本 Diff 四态 QA 规格

**对应 Epic**: E4 版本 Diff QA 验证
**目标验证**: VersionDiff 组件 + jsondiffpatch diff 计算
**验证点**: F4.1 + F4.2

---

## 1. VersionDiff 组件四态

### 理想态
- 两版本有差异时：diff 区域可见
- 绿色高亮：新增内容（testId: `diff-added`）
- 红色高亮：删除内容（testId: `diff-removed`）
- 黄色高亮：修改内容（testId: `diff-modified`）
- 支持展开/折叠（按节点分组）

### 空状态
- 两版本完全相同时：显示 "两个版本没有差异"
- 禁止只留白

### 加载态
- diff 计算中：骨架屏（testId: `diff-skeleton`）
- 禁止使用纯转圈

### 错误态
- diff 计算失败：显示错误信息
- 不渲染 diff 内容区域

---

## 2. jsondiffpatch diff 计算验证

### diff 计算函数
```typescript
function computeVersionDiff(
  v1: PrototypeExportData,
  v2: PrototypeExportData
): DiffResult;
```

### DiffResult 接口
```typescript
interface DiffResult {
  nodes?: {
    added?: ProtoNode[];    // 绿色
    removed?: ProtoNode[];   // 红色
    modified?: Array<{ before: ProtoNode; after: ProtoNode }>;  // 黄色
  };
  edges?: {
    added?: Edge[];
    removed?: Edge[];
  };
}
```

### 四场景测试用例

#### 场景 1: added（新增节点）
```typescript
const v1 = { nodes: [{ id: 'n1', type: 'Button', props: {} }] };
const v2 = { nodes: [{ id: 'n1', type: 'Button', props: {} }, { id: 'n2', type: 'Input', props: {} }] };
const diff = computeVersionDiff(v1, v2);
expect(diff.nodes.added).toHaveLength(1);
expect(diff.nodes.added[0].id).toBe('n2');
expect(diff.nodes.removed).toHaveLength(0);
```

#### 场景 2: removed（删除节点）
```typescript
const v1 = { nodes: [{ id: 'n1', type: 'Button' }, { id: 'n2', type: 'Input' }] };
const v2 = { nodes: [{ id: 'n1', type: 'Button' }] };
const diff = computeVersionDiff(v1, v2);
expect(diff.nodes.removed).toHaveLength(1);
expect(diff.nodes.removed[0].id).toBe('n2');
expect(diff.nodes.added).toHaveLength(0);
```

#### 场景 3: modified（修改属性）
```typescript
const v1 = { nodes: [{ id: 'n1', type: 'Button', props: { text: 'Click' } }] };
const v2 = { nodes: [{ id: 'n1', type: 'Button', props: { text: 'Submit' } }] };
const diff = computeVersionDiff(v1, v2);
expect(diff.nodes.modified).toHaveLength(1);
expect(diff.nodes.modified[0].before.props.text).toBe('Click');
expect(diff.nodes.modified[0].after.props.text).toBe('Submit');
```

#### 场景 4: 无差异
```typescript
const v1 = { nodes: [{ id: 'n1', type: 'Button' }] };
const diff = computeVersionDiff(v1, v1);
expect(diff).toEqual({});
```

---

## 3. 验证场景汇总

| 场景 | 组件 | 测试 ID / 断言 | 预期行为 |
|------|------|--------------|---------|
| 理想态-diff区域 | VersionDiff | `getByTestId('diff-added')` | 绿色新增可见 |
| 理想态-删除标记 | VersionDiff | `getByTestId('diff-removed')` | 红色删除可见 |
| 理想态-修改标记 | VersionDiff | `getByTestId('diff-modified')` | 黄色修改可见 |
| 空状态-无差异 | VersionDiff | `getByText(/两个版本没有差异/i)` | 文案可见 |
| 加载态-骨架屏 | VersionDiff | `getByTestId('diff-skeleton')` | 骨架屏可见 |
| 错误态-计算失败 | VersionDiff | `getByText(/diff 计算失败/i)` | 错误信息可见 |
| added-数量正确 | computeVersionDiff | `expect(diff.nodes.added).toHaveLength(1)` | 新增节点数=1 |
| removed-数量正确 | computeVersionDiff | `expect(diff.nodes.removed).toHaveLength(1)` | 删除节点数=1 |
| modified-属性变化 | computeVersionDiff | `expect(diff.nodes.modified[0].after.props.text).toBe('Submit')` | 属性值正确 |
| 无差异-空对象 | computeVersionDiff | `expect(diff).toEqual({})` | diff 为空 |
