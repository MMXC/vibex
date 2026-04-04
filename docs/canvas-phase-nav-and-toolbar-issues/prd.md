# PRD — canvas-phase-nav-and-toolbar-issues

**Agent**: PM
**日期**: 2026-04-04 18:25
**仓库**: /root/.openclaw/vibex
**基于**: docs/canvas-phase-nav-and-toolbar-issues/analysis.md

---

## 执行摘要

### 背景
Canvas 模块的阶段导航（PhaseProgressBar、PhaseIndicator）和工具栏（CanvasToolbar、TabBar）组件存在 4 个 UX 问题，影响用户操作效率和状态认知。

### 目标
修复 TabBar 与 PhaseProgressBar 状态同步、PhaseIndicator 节点计数、工具栏可点击性、Phase 切换动画 4 个问题，提升 Canvas 交互体验。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| TabBar/PhaseProgressBar 状态一致性 | 0%（不同步） | 100% |
| nodeCount 显示覆盖率 | 0%（未传入） | 100% |
| 工具栏按钮点击区域达标率 | 0%（<44px） | 100% ≥44px |
| Phase 切换动画覆盖率 | 0% | 100% |

---

## Epic 总览

| Epic | 名称 | 问题 | 工时 | 优先级 |
|------|------|------|------|--------|
| E1 | Canvas 导航与工具栏体验优化 | P1(同步)+P2(3项) | 2.5-3h | P1 |

---

## Epic 1: Canvas 导航与工具栏体验优化

### Stories

#### Story E1-S1: TabBar 与 PhaseProgressBar 状态同步
- **问题**: TabBar 切换时 PhaseProgressBar 不更新，两者使用不同 Store 字段
- **验收标准**:
```typescript
// TabBar 切换后 PhaseProgressBar 高亮同步
// 测试步骤:
// 1. 点击 TabBar 的 "flow" tab
// 2. 等待 PhaseProgressBar 更新
// 3. 验证 step-flow 有 active class
expect(screen.getByTestId('step-flow')).toHaveClass(/phase_active/);

// 验证两者 phase 值一致
// TabBar 切换到 component → PhaseProgressBar step-component 高亮
await userEvent.click(screen.getByTestId('tab-component'));
expect(screen.getByTestId('step-component')).toHaveClass(/phase_active/);
expect(screen.getByTestId('step-context')).not.toHaveClass(/phase_active/);
```
- **工时**: 1h

#### Story E1-S2: PhaseIndicator 传入 nodeCount
- **问题**: PhaseIndicator 组件支持 nodeCount 显示，但 CanvasPage 调用时未传入
- **验收标准**:
```typescript
// PhaseIndicator 根据 phase 显示对应节点数量
// context phase 时显示上下文节点数
const contextText = screen.getByTestId('phase-indicator').textContent;
expect(contextText).toMatch(/上下文.*\d+.*节点/);

// flow phase 时显示流程节点数
await userEvent.click(screen.getByTestId('step-flow'));
const flowText = screen.getByTestId('phase-indicator').textContent;
expect(flowText).toMatch(/流程.*\d+.*步骤/);

// component phase 时显示组件节点数
await userEvent.click(screen.getByTestId('step-component'));
const componentText = screen.getByTestId('phase-indicator').textContent;
expect(componentText).toMatch(/组件.*\d+.*节点/);
```
- **工时**: 0.5h

#### Story E1-S3: 工具栏按钮点击区域达标
- **问题**: 工具栏按钮 min-height 32px，不符合 iOS 可访问性标准（44px）
- **验收标准**:
```typescript
// 工具栏按钮高度 >= 44px
const undoBtn = screen.getByTestId('undo-btn');
const undoBox = await undoBtn.boundingBox();
expect(undoBox.height).toBeGreaterThanOrEqual(44);
expect(undoBox.width).toBeGreaterThanOrEqual(44);

const redoBtn = screen.getByTestId('redo-btn');
const redoBox = await redoBtn.boundingBox();
expect(redoBox.height).toBeGreaterThanOrEqual(44);

const zoomInBtn = screen.getByTestId('zoom-in-btn');
const zoomInBox = await zoomInBtn.boundingBox();
expect(zoomInBox.height).toBeGreaterThanOrEqual(44);

// 移动端视口下也达标
await page.setViewportSize({ width: 375, height: 812 });
const mobileUndoBox = await screen.getByTestId('undo-btn').boundingBox();
expect(mobileUndoBox.height).toBeGreaterThanOrEqual(44);
```
- **工时**: 0.5h

#### Story E1-S4: Phase 切换动画反馈
- **问题**: 点击 PhaseProgressBar 切换阶段时无视觉反馈
- **验收标准**:
```typescript
// 点击 Phase 按钮时有按压动画
const contextStep = screen.getByTestId('step-context');
await contextStep.dispatchEvent('mousedown');
expect(contextStep).toHaveStyle({ transform: 'scale(0.95)' });

await contextStep.dispatchEvent('mouseup');
// 动画结束后恢复
await waitFor(() => {
  expect(contextStep).toHaveStyle({ transform: 'scale(1)' });
});

// TabBar 切换到某 phase 时，该 phase 的 step 高亮有过渡动画
await userEvent.click(screen.getByTestId('step-flow'));
const flowStep = screen.getByTestId('step-flow');
// 检查是否有 transition 样式（非立即切换）
const computedStyle = await flowStep.evaluate(el => 
  window.getComputedStyle(el).transition
);
expect(computedStyle).not.toBe('none');
```
- **工时**: 0.5h

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | TabBar 同步 | TabBar 切换同步更新 PhaseProgressBar | expect(active class sync) | 【需页面集成】 |
| E1-F2 | nodeCount 传入 | PhaseIndicator 显示当前阶段节点数 | expect(nodeCount text) | 【需页面集成】 |
| E1-F3 | 点击区域 | 工具栏按钮 ≥44px | expect(boundingBox >= 44) | 【需页面集成】 |
| E1-F4 | 切换动画 | Phase 切换有 scale + transition | expect(scale + transition) | 【需页面集成】 |

### DoD
- [ ] TabBar 点击后 PhaseProgressBar 对应 step 高亮（active class）
- [ ] PhaseIndicator 在 context/flow/component 三种 phase 下分别显示对应节点数
- [ ] 工具栏 undo/redo/zoom 按钮 boundingBox.height ≥ 44px（PC 和移动端）
- [ ] Phase 按钮点击时有 scale(0.95) 按压动画
- [ ] Phase 按钮切换有 0.2s transition 过渡
- [ ] Playwright E2E 测试覆盖 E1-F1 到 E1-F4

---

## 验收标准汇总

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(screen.getByTestId('step-flow')).toHaveClass(/phase_active/)` | Playwright |
| E1-F2 | `expect(textContent).toMatch(/上下文.*\d+.*节点/)` | Playwright |
| E1-F3 | `expect(boundingBox.height).toBeGreaterThanOrEqual(44)` | Playwright |
| E1-F4 | `expect(style.transform).toBe('scale(0.95)')` | Playwright |

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | 桌面端（1920×1080）+ 移动端（375×812）均达标 |
| 性能 | 状态同步延迟 < 100ms |
| 可访问性 | 按钮点击区域 ≥ 44×44px（WCAG 2.1） |

---

**PRD 状态**: ✅ 完成
**下一步**: Architect 架构确认 → Dev 实现
