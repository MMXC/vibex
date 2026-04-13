# PRD: vibex-canvas-context-nav — 画布上下文/流程/组件/原型导航返回

> **任务**: vibex-canvas-context-nav / create-prd
> **Agent**: pm
> **日期**: 2026-04-13
> **状态**: Phase1 进行中

---

## 1. 执行摘要

### 背景

VibeX Canvas 用户在完成原型生成（`phase === 'prototype'`）后，需要切回上下文/流程/组件树修改配置。然而当前系统存在以下问题：

- TabBar 仅包含 context/flow/component 三个 Tab，无 prototype Tab
- PhaseIndicator 在 `phase === 'prototype'` 时隐藏（return null），用户无法通过它返回 prototype
- 用户被困在 prototype phase，只能刷新页面或使用键盘快捷键返回

### 目标

在 TabBar 增加 prototype Tab，并在 PhaseIndicator 中提供返回 prototype 的入口，实现用户可在 prototype phase 和三树视图之间自由切换。

### 成功指标

- 用户从 prototype 切到 context/flow/component，再切回 prototype，全程无需刷新页面
- 切换 phase 后，三树节点数据（contextNodes/flowNodes/componentNodes）完整保留
- 切换 phase 后，原型队列状态（queuePanelExpanded/progress/status/retryCount）完整保留
- 现有 TabBar 三树切换逻辑（context/flow/component）不受影响

---

## 2. Epic 拆分

### Epic 1: TabBar prototype Tab

| ID | Story | 描述 | 工时 |
|----|-------|------|------|
| S1.1 | prototype tab 渲染 | TabBar 增加第4个 Tab（id: prototype, emoji: 🚀, label: 原型），显示选中状态 | 0.5h |
| S1.2 | prototype tab phase 切换 | 点击 prototype tab 调用 setPhase('prototype')，无 phase guard（始终可点击） | 0.5h |
| S1.3 | prototype tab 计数徽章 | prototype tab 显示当前原型队列中的页面数量（sessionStore.prototypeQueue.length） | 0.5h |

### Epic 2: PhaseIndicator 原型返回

| ID | Story | 描述 | 工时 |
|----|-------|------|------|
| S2.1 | prototype 选项加入下拉 | PhaseIndicator 下拉菜单在 phase !== 'prototype' 时显示 prototype 选项 | 0.5h |
| S2.2 | prototype phase 显示 | PhaseIndicator 在 phase === 'prototype' 时可见（不 return null），显示 "🚀 原型队列" 作为当前阶段指示器 | 0h |

### Epic 3: 测试覆盖

| ID | Story | 描述 | 工时 |
|----|-------|------|------|
| S3.1 | TabBar prototype tab 单元测试 | 渲染测试、选中状态测试、setPhase 调用测试、phase guard 不存在验证 | 1h |
| S3.2 | E2E 路径覆盖 | 生成原型 → 切换到 context → 返回 prototype 的完整用户路径 E2E 测试 | 1h |

**总工时估算**: 5h（Epic1: 1.5h, Epic2: 0.5h, Epic3: 2h, buffer: 1h）

---

## 3. 验收标准

### Epic 1: TabBar prototype Tab

#### S1.1 prototype tab 渲染

- [ ] **AC-1.1.1**: TabBar 渲染4个 Tab（context/flow/component/prototype），`expect(tabs).toHaveLength(4)`
- [ ] **AC-1.1.2**: prototype tab emoji 为 🚀，`expect(screen.getByText('🚀')).toBeInTheDocument()`
- [ ] **AC-1.1.3**: prototype tab label 为"原型"，`expect(screen.getByText('原型')).toBeInTheDocument()`
- [ ] **AC-1.1.4**: `phase === 'prototype'` 时 prototype tab 有 `aria-selected="true"`，`expect(prototypeTab).toHaveAttribute('aria-selected', 'true')`

#### S1.2 prototype tab phase 切换

- [ ] **AC-1.2.1**: 点击 prototype tab，`setPhase('prototype')` 被调用一次
- [ ] **AC-1.2.2**: prototype tab 无 phase guard（`phase === 'input'` 时 prototype tab 仍可点击，`expect(prototypeTab).not.toHaveAttribute('aria-disabled', 'true')`）
- [ ] **AC-1.2.3**: 点击 prototype tab 后，CanvasPage 渲染 `<PrototypeQueuePanel />`，即 `phase === 'prototype'` 条件分支生效

#### S1.3 prototype tab 计数徽章

- [ ] **AC-1.3.1**: 当 sessionStore.prototypeQueue.length > 0 时，prototype tab 显示数字徽章
- [ ] **AC-1.3.2**: 数字徽章内容等于 prototypeQueue.length

### Epic 2: PhaseIndicator 原型返回

#### S2.1 prototype 选项加入下拉

- [ ] **AC-2.1.1**: `phase === 'context'` 时，PhaseIndicator 显示（不隐藏），下拉菜单包含 prototype 选项
- [ ] **AC-2.1.2**: 点击 prototype 选项，`onPhaseChange('prototype')` 被调用
- [ ] **AC-2.1.3**: `phase === 'prototype'` 时，PhaseIndicator **可见**（移除 return null），显示 "🚀 原型队列" 且 getCurrentPhaseMeta 有 prototype 兜底

### Epic 3: 测试覆盖

#### S3.1 TabBar prototype tab 单元测试

- [ ] **AC-T1**: `renders prototype tab with correct emoji and label` — 验证4个 tab 渲染
- [ ] **AC-T2**: `calls setPhase on prototype tab click` — 验证点击后 setPhase 被调用
- [ ] **AC-T3**: `prototype tab is not locked regardless of current phase` — 验证 phase === 'input' 时 prototype tab 仍可点击
- [ ] **AC-T4**: `prototype tab shows active state when phase === prototype` — 验证选中状态

#### S3.2 E2E 路径覆盖

- [ ] **AC-T5**: `generate prototype -> click context tab -> click prototype tab -> queue panel visible` — 完整路径 E2E

---

## 4. 功能点规格（specs/）

### Spec: F1 - TabBar prototype Tab

**文件**: `vibex-fronted/src/components/canvas/TabBar.tsx`

#### 变更摘要

1. TABS 数组增加第4个 entry：`{ id: 'prototype', label: '原型', emoji: '🚀' }`
2. `handleTabClick` 中，当 `tab.id === 'prototype'` 时调用 `setPhase('prototype')`
3. prototype tab 不受 phase guard 限制（`tabIdx > phaseIdx` 不适用于 prototype tab）
4. prototype tab 显示当前原型队列页面数量

#### 伪代码

```typescript
// TabBar.tsx — handleTabClick 变更
const handleTabClick = (tabId: TreeType | 'prototype') => {
  if (tabId === 'prototype') {
    setPhase('prototype');
    return;
  }
  const tabIdx = PHASE_ORDER.indexOf(tabId);
  if (tabIdx > phaseIdx) return;
  setActiveTree(tabId);
};

// prototype tab count
// ⚠️ prototypeQueue 在 sessionStore，不是 contextStore
const prototypeCount = useSessionStore((s) => s.prototypeQueue.length);
```

#### 验收断言

```typescript
// TabBar.test.tsx 新增测试
expect(screen.getAllByRole('tab')).toHaveLength(4);
expect(screen.getByText('🚀原型')).toBeInTheDocument();
```

### Spec: F2 - PhaseIndicator prototype 选项

**文件**: `vibex-fronted/src/components/canvas/features/PhaseIndicator.tsx`

#### 变更摘要

1. SWITCHABLE_PHASES 增加 prototype entry：`{ key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: '...' }`
2. `if (phase === 'input' || phase === 'prototype') return null;` 改为 `if (phase === 'input') return null;`
   **同时**: `getCurrentPhaseMeta` 需对 prototype 做兜底（SWITCHABLE_PHASES.find 无匹配时返回 undefined → 按钮 label 为 undefined）
3. 点击 prototype 选项时调用 `onPhaseChange('prototype')`

**⚠️ getCurrentPhaseMeta 兜底实现**:
```typescript
function getCurrentPhaseMeta(phase: Phase) {
  return SWITCHABLE_PHASES.find((p) => p.key === phase)
    ?? { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' };
}
```

#### 伪代码

```typescript
// PhaseIndicator.tsx — SWITCHABLE_PHASES 变更
const SWITCHABLE_PHASES = [
  { key: 'context', label: '◇ 上下文', icon: '◇', colorVar: '...' },
  { key: 'flow', label: '→ 流程', icon: '→', colorVar: '...' },
  { key: 'component', label: '▣ 组件', icon: '▣', colorVar: '...' },
  { key: 'prototype', label: '🚀 原型队列', icon: '🚀', colorVar: 'var(--tree-prototype-color)' },
];

// 移除 prototype 时的隐藏逻辑
if (phase === 'input') return null; // 移除 phase === 'prototype' 的 return null
```

---

## 5. DoD (Definition of Done)

### Epic 1: TabBar prototype Tab

- [ ] TabBar.tsx 中 TABS 数组包含 prototype entry
- [ ] prototype tab 渲染测试通过（emoji + label）
- [ ] 点击 prototype tab 后 phase === 'prototype'
- [ ] prototype tab 在任意 phase 下均可点击（无 aria-disabled）
- [ ] prototype tab 显示队列页面数量
- [ ] 现有 TabBar 测试（context/flow/component 切换）全部通过，无回归

### Epic 2: PhaseIndicator 原型返回

- [ ] PhaseIndicator 在 phase !== 'input' 时显示（含 prototype phase）
- [ ] 下拉菜单包含 prototype 选项
- [ ] 点击 prototype 选项触发 onPhaseChange('prototype')
- [ ] getCurrentPhaseMeta 有 prototype 兜底（不返回 undefined）
- [ ] PhaseIndicator 现有测试通过，无回归

### Epic 3: 测试覆盖

- [ ] TabBar prototype tab 单元测试文件已更新，4个新测试用例全部通过
- [ ] E2E 测试覆盖完整路径（生成 → 切换 → 返回）通过
- [ ] 所有现有测试套件（TabBar/PhaseIndicator）全部通过

### 整体 DoD

- [ ] PR 包含 TabBar.tsx + PhaseIndicator.tsx 改动
- [ ] 新增测试覆盖 prototype tab 交互
- [ ] E2E 路径测试通过
- [ ] 无 TypeScript 编译错误
- [ ] 功能点 ID 格式正确（F1.x, F2.x, F3.x）
- [ ] 所有页面集成需求已标注【需页面集成】

---

## 6. 依赖关系图

```
contextStore.setPhase (✅ 已存在)
       ↑
       |
TabBar.tsx ← 修改 → TabBar.test.tsx (新增测试)
       |
       +→ PhaseIndicator.tsx ← 修改 → PhaseIndicator.test.tsx (验证无回归)
```

**依赖项状态**:
- `setPhase`: ✅ 已暴露在 `contextStore.ts`
- `prototypeQueue`: ✅ 已确认在 `sessionStore`（`src/lib/canvas/stores/sessionStore.ts`），非 `contextStore`
- `TabBar.tsx`: ✅ 存在
- `PhaseIndicator.tsx`: ✅ 存在
- 现有测试套件: ✅ 存在

---

## 7. 执行摘要检查

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点 ID 格式正确（F1.x, F2.x, F3.x）
- [x] 页面集成已标注【需页面集成】(TabBar.tsx, PhaseIndicator.tsx)
- [x] Planning 已执行（feature-list.md 已产出）
