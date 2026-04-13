# 分析报告：vibex-canvas-context-nav — 修复画布上下文/流程/组件/导航无法切回画布展示

> **任务**: vibex-canvas-context-nav / analyze-requirements
> **Agent**: analyst
> **日期**: 2026-04-13
> **状态**: Phase1 进行中

---

## 1. 问题描述（Problem Statement）

### 用户操作路径
1. 用户在 VibeX Canvas 页面完成原型生成（进入 `phase === 'prototype'`）
2. 用户点击左侧导航栏（Sidebar）或页面顶部的"上下文/流程/组件" Tab
3. 用户想切回画布展示（PrototypeQueuePanel），但无法回到 `phase === 'prototype'` 的展示状态

### 核心问题
**从 `phase === 'prototype'` 状态，无法通过 UI 操作切回画布展示。**

用户被困在 prototype phase，必须刷新页面或使用键盘快捷键才能恢复。

### 技术根因分析

通过代码审查，问题的技术实现如下：

#### 当前 phase 状态机（contextStore）
```
input → context → flow → component → prototype
```
Phase 只能向前推进（有 `nextPhase` 但无 `prevPhase` 或 `setPhase` 暴露）。

#### TabBar.tsx 的 phase guard
```typescript
// TabBar.tsx — handleTabClick
const PHASE_ORDER: Phase[] = ['input', 'context', 'flow', 'component', 'prototype'];
const phaseIdx = PHASE_ORDER.indexOf(phase);
const tabIdx = PHASE_ORDER.indexOf(tab.id);
if (tabIdx > phaseIdx) {
  // Tab not yet unlocked by phase — do nothing
  return;
}
```
TabBar 只负责 Tab 切换到对应树（`setActiveTree`），不涉及 phase 切换。

#### CanvasPage.tsx 的 phase 渲染逻辑
```typescript
{phase === 'prototype' ? (
  <div className={styles.prototypePhase}>
    <PrototypeQueuePanel ... />
  </div>
) : (
  // 三树视图
  <>
    {useTabMode ? <MobileTabs>...</MobileTabs> : <DesktopGrid>...</DesktopGrid>}
  </>
)}
```

#### 关键缺失
- **无"返回 prototype phase"的按钮或 Tab**：TabBar 不包含 prototype tab
- **无"返回画布"的快捷键或 UI 控件**：PhaseIndicator 允许切换 phase，但需要验证是否有 back 路径
- **`setPhase` 存在但未暴露在 UI 中**：可能缺少 UI 触发器

---

## 2. Research 成果（历史经验）

### 相关 Learnings

#### 1. canvas-testing-strategy（2026-04-05）
- Canvas hooks 拆分后缺少测试覆盖
- Mock Store 的真实性问题：测试通过但实际运行报错
- **对本任务启示**：修复后需要添加测试覆盖，特别是 `useCanvasPanels`、`setPhase` 相关的测试

#### 2. canvas-api-completion（2026-04-05）
- Hono route 顺序敏感性：特殊路径必须放在参数路径之前
- **对本任务启示**：如果有新增 route，需注意顺序

#### 3. vibex-e2e-test-fix（2026-04-05）
- 虚假完成检测：task status 和实际执行状态不一致
- **对本任务启示**：验证时要确保 task 状态正确更新

### Git History 分析

| Commit | 内容 | 与问题的关联 |
|--------|------|-------------|
| b7d725d3 | useCanvasPanels projectName 从 sessionStore 获取 | 确认 useCanvasPanels 是独立 hook |
| 8f2208e8 | [S3-1-1~10] refactor: canvas.module.css split into 10 sub-modules | CSS 架构已重构 |
| 0a6c93c9 | fix(canvas): Epic3 驳回修复 | 存在驳回历史，需注意需求完整性 |
| cf578266 | chore: update flaky-tests.json timestamp | 测试稳定性维护 |

### 关键发现
- `canvas-phase-nav-and-toolbar-issues` 项目目录存在（`docs/canvas-phase-nav-and-toolbar-issues/`），说明 phase navigation 问题**之前已被识别过**，但可能未彻底解决
- `canvas-context-nav` 是新开的独立项目，专门针对"上下文/流程/组件导航"问题

---

## 3. 业务场景分析

### 目标用户
- VibeX Canvas 用户：在完成三树配置后生成原型
- 使用场景：原型生成过程中需要回退查看/编辑上下文、流程或组件树

### 用户旅程
```
[配置上下文/流程/组件] → [生成原型] → [发现需要修改某棵树]
    ↑                                          ↓
    └──────── 点击导航切回某棵树 ⚠️ BUG ─────────┘
                                            [原型队列展示]
```

### 核心价值
1. **连续工作流**：不中断用户工作节奏
2. **上下文保留**：切出再切回，原型队列状态不丢失
3. **操作可逆**：用户可以自由往返于"配置视图"和"原型视图"

---

## 4. Jobs-To-Be-Done (JTBD)

### JTBD-1：返回配置视图
**作为一个** 正在查看原型队列的用户，**我想要** 点击导航快速切回上下文/流程/组件树，**以便** 修改配置并重新生成。

**验收标准**：
- 点击 TabBar 中任意 Tab（context/flow/component）能立即切换显示对应树
- 切换后原型队列状态（queuePanelExpanded、progress 等）保持不变
- phase 状态应变为 `flow` 或 `component`（取决于点击的 Tab）

### JTBD-2：从配置视图返回原型视图
**作为一个** 正在编辑上下文/流程/组件树的用户，**我想要** 一键返回原型队列视图，**以便** 查看生成进度。

**验收标准**：
- 存在明确的 UI 控件（按钮或 Tab）可返回 prototype phase
- 点击后立即显示 PrototypeQueuePanel，状态完整保留
- PhaseIndicator 显示当前 phase，可点击切换回 prototype

### JTBD-3：状态完整性保证
**作为一个** 在配置视图和原型视图之间切换的用户，**我想要** 所有中间状态（选中的节点、输入的文本、队列进度）不被重置，**以便** 无缝衔接工作。

**验收标准**：
- 切换 phase 不触发 Zustand store 重置
- 队列中的 `progress`、`status`、`retryCount` 保持不变
- 三树节点数据（contextNodes、flowNodes、componentNodes）完全保留

---

## 5. 技术方案选项

### 选项 A：在 TabBar 中添加 "原型" Tab（推荐）

**思路**：TabBar 增加第 4 个 Tab（`prototype`），用户点击即可返回原型队列。

**实现**：
1. TabBar.tsx 增加 `prototype` Tab（emoji: 🚀，label: 原型）
2. `handleTabClick` 中，当 `tab.id === 'prototype'` 时调用 `setPhase('prototype')`
3. prototype Tab 解锁条件：`phase === 'prototype'` 时始终可点击（无需 phase guard）
4. prototype Tab 也显示队列中的页面数量

**优点**：
- 用户感知一致（Tab 切换）
- 实现简单，改动集中
- 符合 TabBar 的现有设计模式

**缺点**：
- prototype phase 不是"树"，语义上略有不一致
- 需要处理 prototype Tab 在其他 phase 下的显示状态

**涉及文件**：
- `src/components/canvas/TabBar.tsx` — 增加 prototype tab

---

### 选项 B：PhaseIndicator 提供"返回原型"按钮

**思路**：PhaseIndicator 组件中，当 phase !== 'prototype' 时，显示一个"返回原型队列"按钮。

**实现**：
1. PhaseIndicator.tsx 增加 `backToPrototype` 按钮
2. 条件渲染：仅当 `phase !== 'prototype' && componentNodes.length > 0` 时显示
3. 点击触发 `setPhase('prototype')`

**优点**：
- 语义更明确（PhaseIndicator 本身就是 phase 状态管理）
- 不改变 TabBar 结构

**缺点**：
- 需要改 PhaseIndicator 组件
- 按钮位置和样式需要设计

**涉及文件**：
- `src/components/canvas/features/PhaseIndicator.tsx`
- `src/hooks/canvas/useCanvasStore.ts`（确认 setPhase 可用）

---

### 选项 C：TabBar + PhaseIndicator 双路返回（最完整）

结合选项 A 和 B：
1. TabBar 增加 prototype tab（A）
2. PhaseIndicator 增加返回按钮（B）

**优点**：两条路径都能返回，用户体验最完整
**缺点**：实现工作量 x2，需要更多测试覆盖

---

## 6. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 技术复杂度 | ✅ 低 | 纯 UI 改动，不涉及 store 重构 |
| 影响范围 | ✅ 局部 | 只改 TabBar 和/或 PhaseIndicator |
| 测试覆盖 | ⚠️ 需补充 | 需要新增 TabBar 切换测试 |
| 回归风险 | ✅ 低 | 改动隔离，不影响现有三树逻辑 |
| 历史债务 | ✅ 无 | 无遗留技术债 |

**结论**：方案可行，技术风险低。

---

## 7. 风险矩阵

| 风险 ID | 风险描述 | 可能性 | 影响 | 风险等级 | 缓解措施 |
|---------|---------|--------|------|---------|---------|
| R1 | prototype Tab 在非 prototype phase 下被误触 | 低 | 低 | 🟢 低 | 设置合理的解锁条件 |
| R2 | TabBar 增加 tab 导致布局溢出 | 中 | 低 | 🟡 中 | CSS flex 收缩或滚动 |
| R3 | `setPhase('prototype')` 触发副作用（如重新请求 API） | 低 | 中 | 🟡 中 | 审查 useCanvasStore.setPhase 实现 |
| R4 | phase 切换导致 ProtoQueuePanel 状态丢失 | 低 | 高 | 🟡 中 | 单元测试验证 store 状态不重置 |

---

## 8. 工期估算

| 工作项 | 预估工时 | 说明 |
|--------|---------|------|
| 方案 A：TabBar prototype tab | 2h | 改 TabBar + 样式 + 简单测试 |
| 方案 B：PhaseIndicator 返回按钮 | 1h | 改 PhaseIndicator + 样式 |
| 方案 A+B：双路返回 | 3h | 组合实现 + 完整测试 |
| 测试覆盖（任一方案） | 1h | TabBar 单元测试 |

**推荐工期**：方案 A（2h）优先，方案 B 作为备选

---

## 9. 验收标准

### 必选验收标准

- [ ] **AC-1**：点击 TabBar 的 prototype tab（🚀），立即切换到 prototype phase，显示 PrototypeQueuePanel
- [ ] **AC-2**：prototype tab 在 `phase === 'prototype'` 时显示选中状态
- [ ] **AC-3**：从 prototype phase 切到其他 phase（如 context），三树数据完整保留
- [ ] **AC-4**：从其他 phase 切回 prototype phase，原型队列状态（queued/generating/done/error）完整保留
- [ ] **AC-5**：TabBar 的 prototype tab 在 `phase !== 'prototype'` 时是否可点击需要明确（建议可选中，但需有条件限制）
- [ ] **AC-6**：现有三树切换逻辑（context/flow/component）不受影响

### 可选验收标准（方案 B）

- [ ] **AC-7**：PhaseIndicator 显示当前 phase，且可点击切换回 prototype
- [ ] **AC-8**：PhaseIndicator 在非 prototype phase 下显示"返回原型队列"按钮

### 测试验收

- [ ] **AC-T1**：`TabBar` 组件新增 prototype tab 的单元测试（渲染、可点击状态、phase 切换）
- [ ] **AC-T2**：E2E 测试覆盖：生成原型 → 切换到 context → 返回 prototype 的完整路径

---

## 10. 依赖分析

| 依赖项 | 描述 | 状态 |
|--------|------|------|
| `setPhase` | contextStore 的 phase setter | ✅ 已暴露在 useCanvasStore |
| `TabBar.tsx` | 需要修改的组件 | ✅ 存在 |
| `PhaseIndicator.tsx` | 可能需要修改的组件 | ✅ 存在 |
| `useCanvasPanels` | 包含 queuePanelExpanded 等状态 | ✅ 已拆分 |
| PrototypeQueuePanel | 原型队列展示组件 | ✅ 存在 |
| 现有测试套件 | TabBar / PhaseIndicator 测试 | ⚠️ 需确认 |

---

## 11. 待澄清问题（Resolve Before Implementation）

- [ ] **Q1**：TabBar prototype tab 在 `phase !== 'prototype'` 时是否应该可点击？目前 context/flow/component tabs 有 phase guard（不可选），prototype tab 是否遵循同样规则？（建议：prototype tab 无 phase guard，点击即切换，但需要设计视觉反馈）
- [ ] **Q2**：PhaseIndicator 已有 phase 切换功能，是否需要新增"返回原型"按钮，还是依赖 TabBar prototype tab 足够？
- [ ] **Q3**：原型队列（PrototypeQueuePanel）的展开状态（`queuePanelExpanded`）是否需要在 phase 切换间保持？
- [ ] **Q4**：用户是否需要通过侧边栏（LeftDrawer/MessageDrawer）快速访问 prototype view？

---

## 12. 初步推荐

**推荐方案 A（TabBar prototype tab）**，原因：
1. 实现最直接，与现有 TabBar 设计语言一致
2. 工期最短（2h）
3. 用户学习成本低（熟悉的 Tab 交互）

PhaseIndicator 的"返回原型"按钮可作为方案 B 独立跟进，不需要与方案 A 同时实施。

---

## 执行决策

- **决策**: 待评审
- **执行项目**: vibex-canvas-context-nav
- **执行日期**: 待定
