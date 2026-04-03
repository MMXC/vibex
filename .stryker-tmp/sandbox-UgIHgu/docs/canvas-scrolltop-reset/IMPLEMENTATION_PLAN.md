# Implementation Plan: canvas-scrolltop-reset

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0
**Epic**: E1 — 树面板 scrollTop 重置
**总工时**: 1h | **优先级**: P0 | **状态**: 已采纳

---

## 1. Epic 概览

**目标**: 在 TreePanel 组件中添加 scrollTop 重置逻辑，覆盖 BoundedContextTree、BusinessFlowTree、ComponentTree 三个面板。

**成功标准**:
- 面板从折叠状态展开时，`scrollTop === 0`
- 三个面板全部生效
- 连续 10 次折叠展开无累积问题

---

## 2. 任务分解

```
E1: 树面板 scrollTop 重置 (1h)
├── E1-S1: 实现 scrollTop 重置逻辑 (0.5h)
├── E1-S2: 三面板验证 (0.25h)
└── E1-S3: 回归测试 (0.25h)
```

---

## 3. E1-S1: 实现 scrollTop 重置逻辑

**工时**: 0.5h | **状态**: ready | **执行者**: dev

### 3.1 修改文件

| 文件 | 操作 | 变更类型 |
|------|------|----------|
| `components/canvas/TreePanel.tsx` | 添加 panelBodyRef + 2个 useEffect | 修改 |

### 3.2 实现步骤

**Step 1**: 在 TreePanel 中添加 `panelBodyRef`

```typescript
const panelBodyRef = useRef<HTMLDivElement>(null);
```

**Step 2**: 在面板 body div 上绑定 ref

```tsx
<div ref={panelBodyRef} className={styles.panelBody}>
  {children}
</div>
```

**Step 3**: 添加 Effect 1 — 折叠→展开时重置

```typescript
useEffect(() => {
  if (!collapsed && panelBodyRef.current) {
    setTimeout(() => {
      if (panelBodyRef.current) {
        panelBodyRef.current.scrollTop = 0;
      }
    }, 0);
  }
}, [collapsed]);
```

**Step 4**: 添加 Effect 2 — 挂载时初始化

```typescript
useEffect(() => {
  if (panelBodyRef.current && panelBodyRef.current.scrollTop !== 0) {
    panelBodyRef.current.scrollTop = 0;
  }
}, []);
```

### 3.3 验收标准

- [ ] `panelBodyRef` 正确绑定到 panel body DOM 节点
- [ ] `collapsed` 在 useEffect 依赖数组中
- [ ] `setTimeout(0)` 包裹 scrollTop 赋值
- [ ] 挂载时 Effect 无依赖数组（`[]`）
- [ ] 代码审查确认无直接 `querySelector` 调用

---

## 4. E1-S2: 三面板验证

**工时**: 0.25h | **状态**: pending | **执行者**: tester

### 4.1 验证矩阵

| 面板 | 测试用例 | 操作 | 断言 |
|------|----------|------|------|
| BoundedContextTree | `context-panel-scroll-reset` | 展开→滚动→折叠→展开 | `scrollTop === 0` |
| BusinessFlowTree | `flow-panel-scroll-reset` | 展开→滚动→折叠→展开 | `scrollTop === 0` |
| ComponentTree | `component-panel-scroll-reset` | 展开→滚动→折叠→展开 | `scrollTop === 0` |

### 4.2 验收标准

- [ ] 三个面板 Playwright E2E 测试全部通过
- [ ] `expect(scrollTop).toBe(0)` 在每个面板通过

---

## 5. E1-S3: 回归测试

**工时**: 0.25h | **状态**: pending | **执行者**: tester

### 5.1 回归用例

| 测试用例 | 操作序列 | 断言 |
|----------|----------|------|
| `regression-10x-collapse-expand` | 连续 10 次折叠→展开 | 每次 scrollTop === 0 |

### 5.2 验收标准

- [ ] 10 次循环中每次展开 scrollTop 均为 0
- [ ] 无 DOM 引用泄漏
- [ ] 无 scrollTop 累积问题

---

## 6. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 重置时机过早导致闪烁 | 低 | 低 | `setTimeout(0)` 延迟到下一帧 |
| 移动端 touch scroll 冲突 | 低 | 低 | 仅在 collapsed 状态变化时触发，touch scroll 不受影响 |
| panelBodyRef 未挂载 | 极低 | 中 | Effect 内部已有 `panelBodyRef.current` 存在性检查 |

---

## 7. DoD 汇总

| Story | DoD |
|-------|-----|
| E1-S1 | TreePanel.tsx 有 panelBodyRef + 2个 useEffect；collapsed 在依赖数组中；setTimeout(0) 包裹重置 |
| E1-S2 | Context / Flow / Component 三个面板 E2E 测试全通过 |
| E1-S3 | 连续 10 次折叠展开，每次 scrollTop === 0 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-scrolltop-reset
- **执行日期**: 2026-04-01
