# PRD — tree-toolbar-consolidation

**Agent**: PM
**日期**: 2026-04-04 20:20
**仓库**: /root/.openclaw/vibex
**基于**: docs/tree-toolbar-consolidation/analysis.md

---

## 执行摘要

### 背景
当前 `TreeToolbar` 作为 `actions` prop 传入 `TreePanel`，渲染在面板 body 内（节点列表上方）。用户需要滚动面板才能看到工具栏按钮，导致操作入口不显著、体验碎片化。

### 目标
将 `TreeToolbar` 按钮从面板内部移至 `TreePanel` 头部（headerActions slot），实现操作入口前置，减少滚动，提升三树（context/flow/component）的交互效率。

### 成功指标
| KPI | 当前 | 目标 |
|-----|------|------|
| 工具栏可见性 | 需滚动可见 | Header 始终可见 |
| 工具栏代码重复率 | 高（3处重复定义） | 通过 hook 复用 |
| 工具栏到达时间 | >2s（含滚动） | <500ms（无需滚动） |

---

## Epic 总览

| Epic | 名称 | 工时 | 优先级 |
|------|------|------|--------|
| E1 | TreeToolbar 集成到 Header | 4h | P1 |

---

## Epic 1: TreeToolbar 集成到 TreePanel Header

### Stories

#### Story E1-S1: TreePanel 新增 headerActions slot
- **问题**: TreePanel 当前只有 `actions` slot（面板内部），无 Header 右侧操作区
- **工时**: 1h
- **验收标准**:
```typescript
// E1-S1.1: TreePanel 接受 headerActions prop
// 修改 TreePanel.tsx 接口
expect(TreePanelProps).toMatchObject({
  headerActions: expect.anything(),
});

// E1-S1.2: headerActions 渲染在 Header 右侧
const header = screen.getByTestId('tree-panel-header-context');
const actions = within(header).getByTestId('tree-panel-header-actions');
expect(actions).toBeVisible();

// E1-S1.3: 折叠状态下 headerActions 不可交互
await userEvent.click(screen.getByTestId('tree-panel-toggle-context'));
expect(screen.queryByTestId('tree-panel-header-actions')).not.toBeInTheDocument();
```
- **页面集成**: 【需页面集成】

#### Story E1-S2: 创建 useTreeToolbarActions hook 复用事件绑定
- **问题**: 当前 CanvasPage 每处树实例重复定义 onSelectAll/onDeselectAll/onClear 事件处理器
- **工时**: 1h
- **验收标准**:
```typescript
// E1-S2.1: hook 导出正确
import { useTreeToolbarActions } from '@/hooks/canvas/useTreeToolbarActions';

// E1-S2.2: hook 返回 4 个 action
const { onSelectAll, onDeselectAll, onClear, onContinue } = useTreeToolbarActions('context');
expect(typeof onSelectAll).toBe('function');
expect(typeof onDeselectAll).toBe('function');
expect(typeof onClear).toBe('function');

// E1-S2.3: onSelectAll 全选 context 节点
onSelectAll();
const state = useContextStore.getState();
const contextActive = state.contextNodes.filter(n => n.isActive);
expect(contextActive.length).toBe(state.contextNodes.length);

// E1-S2.4: onClear 清空节点
onClear();
expect(useContextStore.getState().contextNodes.length).toBe(0);
```
- **页面集成**: 无

#### Story E1-S3: CanvasPage 三处调用迁移到 headerActions
- **问题**: CanvasPage 中 context（L515）、flow（L566）、component（L592）三处 TreeToolbar 需迁移
- **工时**: 1.5h
- **验收标准**:
```typescript
// E1-S3.1: context 树 Header 显示工具栏按钮
const contextHeader = screen.getByTestId('tree-panel-header-context');
const contextActions = within(contextHeader).getByTestId('tree-panel-header-actions');
expect(within(contextActions).getByRole('button', { name: /全选/ })).toBeVisible();
expect(within(contextActions).getByRole('button', { name: /继续/ })).toBeVisible();

// E1-S3.2: flow 树 Header 显示工具栏按钮（无继续按钮）
const flowHeader = screen.getByTestId('tree-panel-header-flow');
const flowActions = within(flowHeader).getByTestId('tree-panel-header-actions');
expect(within(flowActions).getByRole('button', { name: /全选/ })).toBeVisible();
expect(within(flowActions).queryByRole('button', { name: /继续/ })).not.toBeInTheDocument();

// E1-S3.3: component 树 Header 显示工具栏按钮（无继续按钮）
const componentHeader = screen.getByTestId('tree-panel-header-component');
const componentActions = within(componentHeader).getByTestId('tree-panel-header-actions');
expect(within(componentActions).getByRole('button', { name: /全选/ })).toBeVisible();

// E1-S3.4: 最大化模式（maximize）也使用 headerActions
// context maximize L820, flow maximize L871, component maximize L908
// 验收：maximize 状态下 headerActions 仍可见
```
- **页面集成**: 【需页面集成】

#### Story E1-S4: 样式调整 — Header 按钮尺寸和折叠菜单
- **问题**: Header 空间有限，工具栏按钮需缩小；超过 3 个按钮时需折叠菜单
- **工时**: 0.5h
- **验收标准**:
```typescript
// E1-S4.1: Header 按钮尺寸符合可访问性（>=44px）且不过大
const headerBtn = screen.getByTestId('tree-panel-header-actions').querySelector('button');
const box = await headerBtn.boundingBox();
expect(box.height).toBeGreaterThanOrEqual(36);
expect(box.height).toBeLessThanOrEqual(48);

// E1-S4.2: 移动端视口下显示折叠菜单
await page.setViewportSize({ width: 375, height: 812 });
const moreBtn = screen.getByTestId('tree-panel-more-actions');
expect(moreBtn).toBeVisible();
await userEvent.click(moreBtn);
expect(screen.getByRole('menu')).toBeVisible();
```
- **页面集成**: 【需页面集成】

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | headerActions slot | TreePanel 新增 headerActions prop | expect(headerActions visible in header) | 【需页面集成】 |
| E1-F2 | useTreeToolbarActions hook | 复用事件绑定逻辑 | expect(all 4 actions work) | 无 |
| E1-F3 | 三树迁移 | context/flow/component 迁移到 headerActions | expect(3 headers with buttons) | 【需页面集成】 |
| E1-F4 | Header 样式 | 按钮尺寸 + 移动端折叠菜单 | expect(boundingBox + menu) | 【需页面集成】 |

### DoD
- [ ] `TreePanel.tsx` 新增 `headerActions?: React.ReactNode` prop
- [ ] Header 右侧渲染 `headerActions`，有 `data-testid="tree-panel-header-actions"`
- [ ] 折叠时 headerActions 隐藏
- [ ] `useTreeToolbarActions.ts` hook 导出，4 个 action 正确绑定到 store
- [ ] CanvasPage 三处树实例使用 `useTreeToolbarActions` + `headerActions`
- [ ] 最大化和普通模式均显示 headerActions
- [ ] Header 按钮高度 36-48px，移动端有折叠菜单
- [ ] Playwright E2E 测试覆盖 E1-F1 到 E1-F4

---

## 验收标准汇总

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F1 | `expect(headerActions).toBeVisible()` | Playwright |
| E1-F2 | `expect(onSelectAll() → all selected)` | Playwright |
| E1-F3 | `expect(3 headers with buttons)` | Playwright |
| E1-F4 | `expect(boundingBox 36-48px && mobile menu)` | Playwright |

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 兼容性 | PC（1920×1080）+ 移动端（375×812） |
| 性能 | HeaderActions 渲染不增加页面 load 时间 |
| 可访问性 | 按钮高度 ≥ 36px，aria-label 正确 |

---

**PRD 状态**: ✅ 完成
**下一步**: Architect 架构确认 → Dev 实现
