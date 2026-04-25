# Spec: E3 — 版本历史四态 QA 规格

**对应 Epic**: E3 版本历史 QA 验证
**目标验证**: prototypeVersionStore + version-history 页面
**验证点**: F3.1 + F3.2

---

## 1. prototypeVersionStore 验证

### Store 结构验证
```typescript
expect(usePrototypeVersionStore).toBeDefined();
expect(typeof usePrototypeVersionStore.getState().snapshots).toBe('object');
expect(typeof usePrototypeVersionStore.getState().createSnapshot).toBe('function');
expect(typeof usePrototypeVersionStore.getState().restoreSnapshot).toBe('function');
expect(typeof usePrototypeVersionStore.getState().loadSnapshots).toBe('function');
expect(typeof usePrototypeVersionStore.getState().deleteSnapshot).toBe('function');
expect(typeof usePrototypeVersionStore.getState().setSelectedSnapshot).toBe('function');
expect(typeof usePrototypeVersionStore.getState().setComparePair).toBe('function');
```

### createSnapshot 验证
```typescript
const before = usePrototypeVersionStore.getState().snapshots.length;
const snapshot = await usePrototypeVersionStore.getState().createSnapshot('版本1');
const after = usePrototypeVersionStore.getState().snapshots.length;
expect(after).toBe(before + 1);
expect(snapshot.id).toBeTruthy();
expect(snapshot.createdAt).toBeTruthy();
expect(snapshot.data.nodes).toBeDefined();
```

### restoreSnapshot 验证
```typescript
const target = usePrototypeVersionStore.getState().snapshots[0];
const beforeNodes = JSON.stringify(usePrototypeStore.getState().nodes);
await usePrototypeVersionStore.getState().restoreSnapshot(target.id);
const afterNodes = JSON.stringify(usePrototypeStore.getState().nodes);
expect(afterNodes).toBe(JSON.stringify(target.data.nodes));
expect(usePrototypeVersionStore.getState().selectedSnapshotId).toBe(target.id);
```

---

## 2. version-history 页面四态

### 理想态
- 版本列表侧边栏存在（testId: `version-list`）
- 每个版本项存在（testId: `version-item`）
- 版本项显示：时间（`/2026-04-1\d/`）+ 名称 + 节点数量 badge
- 选中高亮
- hover 显示 "恢复" / "对比" / "删除" 按钮

### 空状态
- 无版本时：显示 "还没有保存过版本"
- 显示时间机器图标 SVG
- "保存第一个版本" 按钮

### 加载态
- 版本列表骨架屏（5 个灰色占位块，testId: `version-skeleton`）
- 禁止使用纯转圈

### 错误态
- 加载失败：toast + 重试按钮
- 恢复失败：toast "恢复失败，请重试"，当前画布数据不受影响

---

## 3. 验证场景汇总

| 场景 | 组件 | 测试 ID / 选择器 | 预期行为 |
|------|------|-----------------|---------|
| Store-结构存在 | prototypeVersionStore | `usePrototypeVersionStore` | Store 存在 |
| Store-快照创建 | prototypeVersionStore | `expect(after).toBe(before + 1)` | 快照数量+1 |
| Store-快照恢复 | prototypeVersionStore | `expect(afterNodes).toBe(JSON.stringify(target.data.nodes))` | 数据还原正确 |
| 理想态-版本列表 | version-history | `getByTestId('version-list')` | 列表可见 |
| 理想态-版本项 | version-history | `getAllByTestId('version-item')` | ≥1 个版本项 |
| 理想态-时间显示 | version-history | `getByText(/2026-04-1\d/)` | 时间文本可见 |
| 空状态-无版本 | version-history | `getByText(/还没有保存过版本/i)` | 引导文案可见 |
| 空状态-保存按钮 | version-history | `getByRole('button', { name: /保存第一个版本/i })` | 按钮可见 |
| 加载态-骨架屏 | version-history | `getAllByTestId('version-skeleton')` | 5个骨架屏 |
| 错误态-toast | version-history | `getByTestId('toast-error')` | 错误提示可见 |
| 错误态-重试按钮 | version-history | `getByRole('button', { name: /重试/i })` | 重试按钮可见 |
