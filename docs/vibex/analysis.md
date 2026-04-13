# 可行性分析: 上下文/流程/组件/原型 标签页合并为单一标签

**项目**: vibex / analyze-requirements
**Analyst**: Analyst
**日期**: 2026-04-13
**状态**: ✅ 分析完成

---

## 一、Research — 历史相关经验

### 1.1 docs/learnings/ 相关条目

| 历史项目 | 相关性 | 教训 |
|---------|--------|------|
| `canvas-cors-preflight-500` | 间接：Hono 路由中间件层级的顺序问题 | 禁用状态掩盖了真实访问路径，用户看不到原因。多层级守卫应让用户感知到当前状态，而非静默拒绝 |
| `vibex-e2e-test-fix` | 间接：disabled / skip 状态的滥用问题 | "用 skip 掩盖问题"和"用 disabled 锁 tab"本质相同——都是用阻断代替告知。`grepInvert` 优于 `test.skip`，同理：空状态优于 disabled |

**结论**：历史经验一致指向同一个反模式：用阻断代替告知。`disabled` 是一种静默拒绝，用户点击后没有任何反馈，体验断裂。

### 1.2 Git History — TabBar 相关改动轨迹

```
TabBar.tsx 首次引入: canvas-three-tree-unification epic
  - TabBar 含 4 tabs: context/flow/component/prototype
  - 初始实现即带 disabled 锁 tab 机制
  - 基于 phase 顺序: input → context → flow → component → prototype

最近相关改动: canvas-phase-nav-and-toolbar-issues
  - PhaseIndicator 被独立出来，作为阶段指示器
  - TabBar 和 PhaseIndicator 职责已部分分离
```

**关键发现**：
- TabBar 的 disabled 锁定机制从一开始就存在，从未经过 UX 验证
- PhaseIndicator 已经承担了"阶段状态告知"职责，与 TabBar 的 disabled 锁定存在职责重叠
- 移动端 `useTabMode` 有独立的 tab bar 实现，但 desktop 端 TabBar 是全局状态锁

### 1.3 当前 Tab/Phase 架构（关键代码）

**TabBar.tsx:37-42 — 禁用逻辑**：
```typescript
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
// ...
disabled={isLocked}
title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}
```

**TabBar.tsx:48-53 — 点击守卫**：
```typescript
if (tabIdx > phaseIdx) {
  // Tab not yet unlocked by phase — do nothing
  return;
}
```

**现状问题**：
- `disabled` 属性 + title 提示 → 用户点击无反应，title tooltip 需要 hover 才能看到
- 桌面端和移动端 tab 行为不一致（`useTabMode` 有独立 tab bar）
- phase 锁定逻辑分散在 TabBar 和 CanvasPage 两处

---

## 二、需求理解

**业务目标**：将 TabBar 4 个标签页（上下文/流程/组件/原型）改为单一标签切换模式，点击立即切换内容，**不使用 disabled 阻断状态**。

**核心意图**：用户可以自由浏览任意 Tab 的内容；phase 进度通过其他方式告知（如 PhaseIndicator），而非用 disabled 静默拒绝。

---

## 三、JTBD（Jobs To Be Done）

| ID | JTBD | 用户故事 |
|----|------|---------|
| JTBD-1 | **自由浏览** | "我能在任意阶段自由切换上下文/流程/组件标签页，查看已生成的内容" |
| JTBD-2 | **明确状态感知** | "当某个树还没有生成内容时，我能一眼看出是空的，而不是看到 disabled 按钮" |
| JTBD-3 | **Phase 引导** | "系统能告诉我当前在哪个阶段，下一步该做什么，而不是用 disabled 锁住我的操作" |
| JTBD-4 | **移动端一致性** | "在手机上切换标签页的体验和桌面端一致" |

---

## 四、技术方案分析（至少 2 个）

### 方案 A：TabBar 移除 disabled + 空状态提示（推荐）

**架构**：移除 `disabled` 属性和 phase 锁定逻辑；TabBar 只负责 UI 切换，数据面板始终挂载，内容根据实际数据量显示空状态。

```
TabBar onClick → setActiveTree(tab) → 三树面板始终渲染
→ 面板内部判断 nodes.length === 0 → 显示空状态提示
→ PhaseIndicator 继续承担 phase 进度告知职责
```

**核心改动**：

1. **TabBar.tsx — 移除 disabled + 锁定逻辑**
   ```typescript
   // 删掉:
   const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
   const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
   disabled={isLocked}

   // 删掉 handleTabClick 中的守卫:
   if (tabIdx > phaseIdx) { return; }

   // 改为始终可点击，但 active 判断保留:
   isActive = tab.id === 'context' ? (activeTree === null || activeTree === 'context')
            : activeTree === tab.id
   ```

2. **TreePanel 空状态** — 面板内容区根据 `nodes.length === 0` 显示友好提示
   - ContextTreePanel: "请先在需求录入阶段输入需求"
   - FlowTreePanel: "请先确认上下文节点，流程将自动生成"
   - ComponentTreePanel: "请先完成流程树，组件将自动生成"

3. **移动端 TabBar 同步移除** — `CanvasPage.tsx` 中 `useTabMode` 下的内联 tab bar 同步改造

**Pros**：
- 改动集中：TabBar.tsx + CanvasPage.tsx 两处
- 不破坏现有 phase 逻辑（PhaseIndicator 不变）
- 彻底消除 disabled 静默拒绝问题
- 移动端一致性自动解决（共享 TabBar 组件）

**Cons**：
- 用户仍可能点击到"空树"——需要良好的空状态设计
- 三树始终渲染（轻微性能开销），可通过 `display: none` 优化

**工期**：0.5-1 day
**复杂度**：低

---

### 方案 B：Tab 导航 + Phase 数据加载分离

**架构**：将"Tab 导航"和"Phase 引导"完全解耦——TabBar 只负责导航，数据按需加载（lazy load）。

```
TabBar click → 仅更新 activeTree 状态
→ TreePanel mount 时检查 nodes.length
  → 有数据 → 正常渲染
  → 无数据 → 显示 phase-gated 空状态（而非 disabled）
→ PhaseIndicator 保持独立，仍显示进度
```

**核心区别**：
- TabBar 完全不做 phase 检查
- 空状态提示包含 phase 引导信息
- TreePanel 根据 phase 判断显示"未到该阶段"还是"数据为空"

**工期**：1-1.5 days
**复杂度**：中（空状态逻辑需要跨组件协调）

---

### 方案对比

| 维度 | 方案 A（移除 disabled + 空状态） | 方案 B（Tab/Phase 完全解耦） |
|------|----------------------------------|------------------------------|
| 工期 | 0.5-1 day | 1-1.5 days |
| 复杂度 | 低 | 中 |
| 改动范围 | TabBar + CanvasPage | TabBar + TreePanel 空状态设计 |
| Phase 解耦程度 | 部分（仍依赖 phase 判断空状态） | 完全 |
| 推荐度 | **⭐⭐⭐⭐⭐** | **⭐⭐⭐** |

---

## 五、风险评估（Risk Matrix）

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| R1: 用户点击空树感到困惑 | 中 | 低 | 方案 A/B 均包含空状态提示；PhaseIndicator 引导下一步 |
| R2: 三树同时渲染性能下降 | 低 | 低 | 仅视觉隐藏（CSS `display:none`），不卸载数据 |
| R3: 移动端内联 tab 与桌面端 TabBar 行为不一致 | 高 | 中 | 方案 A 统一改造，两处引用同步修改 |
| R4: phase < tab 对应 phase 时，nodes 为空导致 UI 闪烁 | 低 | 低 | 初始渲染时 phase 决定默认 activeTree，空状态设计平滑 |
| R5: 原型 tab 与其他 tab 行为不一致（prototype 是 phase 驱动） | 低 | 中 | 原型 tab 有独立的 PrototypeQueuePanel，空状态逻辑需同步 |

---

## 六、依赖分析（Dependency Analysis）

```
前端:
  ├─ TabBar.tsx                         ← 核心改动：移除 disabled + 锁定逻辑
  ├─ CanvasPage.tsx                     ← 移动端内联 tab bar 同步改造
  ├─ ContextTreePanel.tsx               ← 空状态提示（可选）
  ├─ FlowTreePanelPanel.tsx             ← 空状态提示（可选）
  ├─ ComponentTreePanel.tsx            ← 空状态提示（可选）
  └─ e2e/tab-switching.spec.ts         ← 新增 E2E 测试

后端:
  └─ 无

外部依赖:
  └─ 无
```

**关键改动文件**：
- `vibex-fronted/src/components/canvas/TabBar.tsx` — 移除 `isLocked` + `disabled` + 守卫
- `vibex-fronted/src/components/canvas/CanvasPage.tsx` — 移动端内联 tab bar 移除 disabled

---

## 七、验收标准（Acceptance Criteria）

| ID | 场景 | 验收条件 | 测试方法 |
|----|------|---------|---------|
| AC-1 | TabBar 无 disabled 按钮 | 4 个 tab 按钮均无 `disabled` 属性 | Playwright: `expect(tab).not.toBeDisabled()` |
| AC-2 | 立即切换 | 点击任意 tab，内容立即切换，响应时间 < 100ms | Playwright: 计时 `tab.click()` → 内容可见 |
| AC-3 | 空树有状态提示 | 在 `input` 阶段点击 flow tab，应显示引导提示而非空白 | Visual inspection / screenshot |
| AC-4 | PhaseIndicator 不受影响 | TabBar 改动后 PhaseIndicator 仍正常显示当前 phase | Playwright: PhaseIndicator 存在且正确 |
| AC-5 | 移动端一致性 | `<768px` 视口下内联 tab bar 与桌面端 TabBar 行为一致 | Playwright mobile viewport |
| AC-6 | 原型 tab 正常 | prototype tab 始终可点击（与 phase 解耦），PrototypeQueuePanel 正常展示 | Playwright: prototype tab click |
| AC-7 | active 状态正确 | 只有一个 tab 处于 active 状态 | Playwright: `expect(tabs.filter({has: selected:true})).toHaveCount(1)` |
| AC-8 | 三树数据不丢失 | 切换 tab 后，三树数据（context/flow/component nodes）保持不变 | Unit test: 切换 tab 后检查 store 中的 nodes 数据 |

---

## 八、驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| 需求模糊无法实现 | ✅ 通过 | 需求清晰：TabBar 4 tabs 立即切换，无 disabled |
| 缺少验收标准 | ✅ 通过 | 8 条 AC 覆盖核心场景 |
| 未执行 Research | ✅ 通过 | 已搜索 learnings + git history |

---

## 九、执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks vibex / tab-bar-unified
- **执行日期**: 2026-04-13
- **推荐方案**: 方案 A（TabBar 移除 disabled + 空状态提示）

---

## 十、关键代码位置索引

| 文件 | 行 | 用途 |
|------|----|------|
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 37-42 | `isLocked` + `disabled` 定义 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 48-53 | `handleTabClick` 锁定守卫 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 54-61 | 按钮 disabled + class 条件 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | ~240-260 | 移动端内联 tab bar（含 disabled） |
| `vibex-fronted/src/components/visualization/ViewSwitcher/ViewSwitcher.tsx` | 34-50 | 无关：这是 Flow/Mermaid/JSON 视图切换器，与 TabBar 不同 |
