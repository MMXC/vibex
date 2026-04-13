# VibeX TabBar 无障碍切换 — Feature List & Planning

**项目**: vibex / create-prd
**来源**: analysis.md (analyze-requirements)
**日期**: 2026-04-13
**状态**: Planning 完成

---

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|---|---|---|---|---|
| F1.1 | TabBar 移除 disabled 锁定逻辑 | 删除 `isLocked` 变量、`disabled` 属性、`handleTabClick` 中的 phase 守卫 | R1: disabled 静默拒绝 | 1h |
| F1.2 | 移动端内联 TabBar 同步移除 | CanvasPage 中 `useTabMode` 下的内联 tab bar 删除 disabled 逻辑，与桌面端 TabBar 行为一致 | R1+R3: 移动端不一致 | 0.5h |
| F2.1 | ContextTreePanel 空状态 | `nodes.length === 0` 显示引导提示"请先在需求录入阶段输入需求" | JTBD-2: 明确状态感知 | 0.5h |
| F2.2 | FlowTreePanel 空状态 | 空数据显示引导"请先确认上下文节点，流程将自动生成" | JTBD-2: 明确状态感知 | 0.5h |
| F2.3 | ComponentTreePanel 空状态 | 空数据显示引导"请先完成流程树，组件将自动生成" | JTBD-2: 明确状态感知 | 0.5h |
| F3.1 | 原型 tab 完全解锁 | prototype tab 不再受 phase 锁定，始终可点击（prototype tab 在 analysis 中定义为特殊行为） | JTBD-1: 自由浏览 | 0.5h |
| F4.1 | Tab active 状态正确 | 只有一个 tab 处于 active；context 默认为 active（activeTree === null 时） | AC-7 | 0.5h |
| F5.1 | E2E 测试新增 | 新增 `tab-switching.spec.ts` 覆盖 AC-1~AC-8 | AC-1~AC-8 | 1.5h |

**总工时**: 5.5h

---

## Epic/Story 划分

### Epic 1: TabBar 无障碍化改造
- S1.1: TabBar.tsx 移除 disabled 锁定逻辑（对应 F1.1）
- S1.2: CanvasPage.tsx 移动端内联 TabBar 同步改造（对应 F1.2）

### Epic 2: 空状态提示设计
- S2.1: ContextTreePanel 空状态
- S2.2: FlowTreePanel 空状态
- S2.3: ComponentTreePanel 空状态

### Epic 3: 行为验证与测试
- S3.1: prototype tab 解锁验证（对应 F3.1）
- S3.2: Tab active 状态验证（对应 F4.1）
- S3.3: E2E 测试覆盖（对应 F5.1）

---

## 关键设计决策

- **方案选择**: 方案 A — TabBar 移除 disabled + 空状态提示
- **推荐理由**: 改动集中（TabBar.tsx + CanvasPage.tsx），不破坏 phase 逻辑，空状态设计平滑过渡
- **PhaseIndicator**: 保持不变，继续承担 phase 进度告知职责
- **空状态设计**: 三个面板（Context/Flow/Component）各有独立引导文案，根据当前 phase 上下文适配
- **移动端**: 桌面端 TabBar 组件和移动端内联 tab bar 同步改造，确保行为一致
- **三树渲染**: 三树始终挂载（轻微性能开销，可通过 CSS `display:none` 优化），数据不丢失

---

*Planning 输入: analysis.md (analyze-requirements)*
*Planning 输出: docs/vibex/plan/feature-list.md*