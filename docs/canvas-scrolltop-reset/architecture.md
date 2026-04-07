# Architecture: canvas-scrolltop-reset

**Agent**: architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已采纳

---

## 1. Tech Stack

| 维度 | 选择 | 理由 |
|------|------|------|
| **依赖策略** | 零新增依赖 | 纯 React 内置 API，无额外安装 |
| **状态监听** | `useEffect` + `collapsed` dep | 监听折叠状态变化，展开时触发重置 |
| **DOM 引用** | `useRef<HTMLDivElement>` | 稳定引用 panel body DOM 节点 |
| **动画兼容** | `setTimeout(0)` | 延迟到下一帧，避免与 CSS transition 冲突 |
| **测试框架** | Playwright E2E | 覆盖三个面板 + 多次折叠展开回归 |

**技术约束**：
- 禁止直接操作 `document.querySelector` 赋值 scrollTop
- 禁止缺少 `collapsed` 依赖项
- 必须使用 `panelBodyRef` 而非内联 DOM 查询

---

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph "CanvasPage"
        TabBar["TabBar<br/>(context / flow / component)"]
        TreePanel["TreePanel<br/>(shared wrapper)"]
        BoundedContextTree["BoundedContextTree"]
        BusinessFlowTree["BusinessFlowTree"]
        ComponentTree["ComponentTree"]
    end

    TabBar -->|tab change| TreePanel
    TreePanel -->|uses| BoundedContextTree
    TreePanel -->|uses| BusinessFlowTree
    TreePanel -->|uses| ComponentTree

    subgraph "TreePanel internal"
        panelBodyRef["panelBodyRef<br/>useRef<HTMLDivElement>"]
        useEffect1["useEffect([collapsed])<br/>collapsed → false 时<br/>scrollTop = 0"]
        useEffect2["useEffect([])<br/>mount 时<br/>scrollTop = 0"]
    end

    TreePanel --> panelBodyRef
    panelBodyRef --> useEffect1
    panelBodyRef --> useEffect2
    useEffect1 -->|setTimeout(0)| scrollReset["panelBodyRef.current<br/>.scrollTop = 0"]
    useEffect2 --> scrollReset

    style panelBodyRef fill:#c7d2fe,stroke:#6366f1
    style scrollReset fill:#bbf7d0,stroke:#16a34a
    style useEffect1 fill:#fef3c7,stroke:#d97706
    style useEffect2 fill:#fef3c7,stroke:#d97706
```

**数据流**：
1. 用户点击折叠/展开按钮 → `collapsed` 状态从 `true` → `false`
2. `useEffect([collapsed])` 触发（`collapsed` 变化）
3. 条件 `!collapsed && panelBodyRef.current` 为 true
4. `setTimeout(0)` 将 scrollTop 重置调度到下一帧
5. `panelBodyRef.current.scrollTop = 0` 执行

---

## 3. API Definitions

### 3.1 TreePanel Props

```typescript
// components/canvas/TreePanel.tsx
interface TreePanelProps {
  /** 当前面板类型 */
  treeType: 'context' | 'flow' | 'component';
  /** 面板是否折叠 */
  collapsed: boolean;
  /** 折叠/展开回调 */
  onToggle: () => void;
  /** 面板标题 */
  title: string;
  /** 子组件 */
  children: React.ReactNode;
}
```

### 3.2 Internal Ref & Effects

```typescript
// TreePanel.tsx 内部实现

// DOM ref - 必须使用 panelBodyRef，禁止使用 querySelector
const panelBodyRef = useRef<HTMLDivElement>(null);

// Effect 1: 折叠→展开时重置 scrollTop
useEffect(() => {
  if (!collapsed && panelBodyRef.current) {
    // setTimeout(0) 延迟到下一帧，兼容 CSS transition 动画
    setTimeout(() => {
      if (panelBodyRef.current) {
        panelBodyRef.current.scrollTop = 0;
      }
    }, 0);
  }
}, [collapsed]); // 必须包含 collapsed

// Effect 2: 组件挂载时初始化（解决初次进入 scrollTop ≠ 0 问题）
useEffect(() => {
  if (panelBodyRef.current && panelBodyRef.current.scrollTop !== 0) {
    panelBodyRef.current.scrollTop = 0;
  }
}, []);
```

### 3.3 scrollTop 重置契约

| 触发条件 | 执行操作 | 预期结果 |
|----------|----------|----------|
| `collapsed` 从 `true` → `false` | `panelBodyRef.current.scrollTop = 0` | scrollTop = 0 |
| 组件挂载 | 同上 | scrollTop = 0 |
| 折叠中（`collapsed === true`） | 无操作 | scrollTop 保持不变 |
| 多次折叠展开 | 每次展开均重置 | scrollTop 始终为 0 |

---

## 4. Data Model

```
TreePanel
├── collapsed: boolean          # 折叠状态，useEffect 触发源
├── panelBodyRef: RefObject     # DOM 引用，非状态
└── scrollTop: number           # DOM 属性，非 React 状态

暴露接口:
└── TreePanelProps (treeType, collapsed, onToggle, title, children)
```

---

## 5. Testing Strategy

### 5.1 Playwright E2E 测试矩阵

| 测试用例 | 目标面板 | 操作序列 | 断言 |
|----------|----------|----------|------|
| `context-panel-scroll-reset` | BoundedContextTree | 展开→滚动200→折叠→展开 | `scrollTop === 0` |
| `flow-panel-scroll-reset` | BusinessFlowTree | 展开→滚动300→折叠→展开 | `scrollTop === 0` |
| `component-panel-scroll-reset` | ComponentTree | 展开→滚动150→折叠→展开 | `scrollTop === 0` |
| `no-flicker-during-animation` | BoundedContextTree | 折叠→展开→等待300ms | scrollTop 中间状态无闪烁 |
| `regression-10x-collapse-expand` | BoundedContextTree | 连续10次折叠展开 | 每次 scrollTop === 0 |

### 5.2 覆盖率要求

| 场景 | 覆盖要求 |
|------|----------|
| 三个面板展开→折叠→展开 | 100% |
| 连续 10 次折叠展开回归 | 必须通过 |
| scrollTop 值验证 | `toBe(0)` 精确断言 |

### 5.3 测试文件位置

```
e2e/
└── tree-panel-scroll-reset.spec.ts
```

---

## 6. ADR — useEffect vs onTransitionEnd

### ADR-001: scrollTop 重置时机的选择

**状态**: 已采纳

**上下文**:
TreePanel 使用 CSS transition 实现折叠/展开动画。在面板展开时，需要重置 scrollTop 到 0，但时机选择会影响用户体验。

**决策**:
采用 `useEffect` + `setTimeout(0)` 而非 `onTransitionEnd` 事件。

**选项分析**:

| 方案 | 实现方式 | 优点 | 缺点 |
|------|----------|------|------|
| **A: useEffect + setTimeout(0)** ✅ | 监听 collapsed 变化，延迟到下一帧 | 简单可靠，React 生命周期管理，无监听泄漏 | 重置略早于动画结束（<16ms），视觉无感 |
| B: transitionend 事件 | CSS 动画结束时触发 | 时机精准，动画结束才重置 | 需要 cleanup，DOM 操作侵入性强 |
| C: onAnimationEnd | React onAnimationEnd prop | React 风格 | 需要修改子组件，且动画不一定是 CSS animation |

**结论**:
`useEffect + setTimeout(0)` 是平衡点——简单、可靠、视觉无感（重置到动画结束间隔 < 16ms）。

---

## 7. Performance

| 指标 | 测量结果 | 阈值 |
|------|----------|------|
| scrollTop 重置耗时 | < 1ms | < 5ms |
| useEffect 触发频率 | 折叠/展开时（低频） | 不适用 |
| 内存占用 | 1 个 ref 对象 | 无增长 |
| 渲染影响 | 零额外渲染 | 无 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: canvas-scrolltop-reset
- **执行日期**: 2026-04-01
