# Requirements Analysis — vibex-pm-proposals-20260408

**Project:** vibex-pm-proposals-vibex-proposals-20260408
**Date:** 2026-04-08
**Prepared by:** PM Agent
**参考流程:** /ce:plan Research

---

## 一、业务场景分析

### 1.1 产品定位

VibeX 是一个 AI 驱动的 DDD（领域驱动设计）产品建模平台。用户通过自然语言输入业务需求，VibeX 通过 AI 引导澄清需求，生成领域模型、业务流程图和低代码原型页面。

**核心用户旅程**:
```
输入需求 → AI 追问澄清 (Step1) → 业务流程 (Step2) → 组件图 (Step3) → 领域模型 (Step4) → 创建项目
```

**目标用户**:
- 产品经理：快速验证产品想法
- 开发者：加速开发流程
- 设计师：交互式原型

### 1.2 当前系统状态（基于 Git History 2026-04-05）

**最近 30 天关键进展**:
- Canvas 重构完成：TabBar 替代 PhaseProgressBar，Phase Guard 保护流程顺序
- Canvas API 补全：Flows CRUD + Snapshot API 已实现
- 类型安全：`as any` 清理完成，ESLint `@typescript-eslint/no-explicit-any` 升级为 error
- JsonRender Preview 集成：E1 完成，E3 实现 preview-edit 同步

**遗留问题**:
- 组件树生成 API（E3）返回空数据时无兜底 UI
- 删除按钮未完整绑定（三树中仅 Flow tree 有 `onDelete`）
- 三树组件各自 > 900 行，缺乏共享抽象
- Undo/Redo 功能虽添加了 snapshot 记录，但 UI 操作路径未完全验证

### 1.3 需求来源

| 来源 | 占比 | 说明 |
|------|------|------|
| FEATURE_REQUESTS.md | 40% | 历史沉淀的 10 项功能请求（2026-03-04） |
| Git History 分析 | 30% | 代码层面发现的 bug 和技术债 |
| 竞品对比 | 20% | 低代码平台标准功能对比 |
| 用户体验审视 | 10% | 新用户冷启动摩擦识别 |

---

## 二、技术方案选项

### 2.1 P-P0-1: 组件树生成空数据兜底

#### 方案 A: 前端轻量兜底（推荐）

**思路**: 在 `CanvasPage.tsx` 的 `handleContinueToComponents` 中，对空数据和 API 错误增加 UI 反馈。

**实现**:
```typescript
// 在 result.success && result.components.length > 0 判断后追加
if (!result.success || !result.components || result.components.length === 0) {
  // 显示 toast 错误提示
  toast.error('组件生成失败，请重试');
  return;
}
```

**优点**:
- 改动范围小，仅修改 CanvasPage.tsx 一处
- 风险低，不涉及 store 重构
- 实施快（预计 2h）

**缺点**:
- 治标不治本，空状态 UI 不够友好

---

#### 方案 B: Store 层兜底 + EmptyState 集成

**思路**: 在 `componentStore` 中添加 `componentError` / `componentEmpty` 状态，在 `ComponentTree` 中渲染 `EmptyState` 组件。

**实现**:
```typescript
// componentStore.ts
interface ComponentStore {
  componentError: string | null;
  componentEmpty: boolean;
  setComponentError: (msg: string) => void;
  clearComponentError: () => void;
}

// ComponentTree.tsx
{componentEmpty && <EmptyState type="component" onRetry={handleRetry} />}
```

**优点**:
- UI 体验好，用户知道发生了什么
- 符合架构分层原则（store 管状态，组件管渲染）

**缺点**:
- 改动范围大，涉及 store + 多个组件
- 需要设计 EmptyState 的类型和交互
- 预计 4-6h

**推荐**: 方案 A 作为 P0 快速止血，方案 B 在后续迭代中实现。

---

### 2.2 P-P0-2: 删除按钮未绑定

#### 方案 A: 补全 TreeToolbar onDelete 绑定（推荐）

**思路**: 在 `CanvasPage.tsx` 的 Context Tree 和 Component Tree 的 `TreeToolbar` 中补充 `onDelete` prop。

**实现**:
```typescript
// Context Tree Toolbar
onDelete={() => useContextStore.getState().deleteSelectedNodes?.('context')}

// Component Tree Toolbar
onDelete={() => useComponentStore.getState().deleteSelectedNodes?.()}
```

**优点**:
- 改动集中在一处（CanvasPage.tsx）
- 与 Flow Tree 现有模式一致
- 预计 1h

**缺点**:
- `deleteSelectedNodes` 方法在 Context/Component Store 中可能不存在或签名不一致

---

#### 方案 B: 统一删除操作到 TreeToolbar 抽象

**思路**: 抽取 `TreeToolbar` 支持 `treeType` 驱动的删除逻辑，消除重复绑定代码。

**实现**:
```typescript
// TreeToolbar.tsx 内部根据 treeType 调用对应 store
const deleteFn = {
  context: () => useContextStore.getState().deleteSelectedNodes?.('context'),
  flow: () => useFlowStore.getState().deleteSelectedNodes(),
  component: () => useComponentStore.getState().deleteSelectedNodes?.(),
}[treeType];

// onDelete 直接调用 deleteFn，无需父组件传 prop
```

**优点**:
- 从根本上解决三树按钮绑定不一致问题
- 减少 CanvasPage.tsx 中的重复代码

**缺点**:
- 涉及 TreeToolbar 重构，风险稍高
- 预计 2-3h

**推荐**: 方案 A 快速止血，方案 B 作为 P-P2-1 共享抽象重构的一部分。

---

### 2.3 P-P1-1: 新手引导流程

#### 方案 A: 引导蒙层（推荐）

**思路**: 基于 `onboardingStore` 实现步骤式引导蒙层。

**实现**:
```typescript
// 在 CanvasPage.tsx 入口处检查
const isOnboarded = localStorage.getItem('canvas_onboarded');

// 如果未引导，显示 OnboardingOverlay
{!isOnboarded && (
  <OnboardingOverlay
    steps={[
      { target: '#requirement-input', text: '在这里输入你的业务需求', position: 'bottom' },
      { target: '#continue-context-btn', text: '点击生成限界上下文', position: 'bottom' },
      { target: '#context-tree', text: '勾选需要的上下文，继续生成', position: 'right' },
    ]}
    onComplete={() => localStorage.setItem('canvas_onboarded', 'true')}
  />
)}
```

**优点**:
- 实现成本低，可复用现有 `onboardingStore`
- 用户体验好，有明确指引

**缺点**:
- 引导步骤与 UI 定位耦合，UI 变化时需要同步更新

---

#### 方案 B: 侧边栏引导面板

**思路**: 在左侧抽屉中实现可折叠的新手引导面板，不使用蒙层。

**优点**:
- 不遮挡 Canvas 内容
- 可随时重新查看引导

**缺点**:
- 占用 Canvas 空间，分散用户注意力
- 预计 4-6h

**推荐**: 方案 A（蒙层），因为 Canvas 空间宝贵，引导内容应简洁不干扰主流程。

---

## 三、可行性评估

### 3.1 技术可行性

| 提案 | 技术可行性 | 依赖 | 风险 |
|------|-----------|------|------|
| P-P0-1 空数据兜底 | ✅ 高 | 无外部依赖 | 低 — 仅改 CanvasPage |
| P-P0-2 删除按钮绑定 | ✅ 高 | 确认 store 方法存在 | 中 — store 方法签名需验证 |
| P-P1-1 新手引导 | ✅ 高 | 复用 onboardingStore | 低 — 有历史实现可参考 |
| P-P1-2 项目搜索 | ✅ 高 | Dashboard UI 改造 | 低 — 纯前端功能 |
| P-P1-3 需求模板库 | ✅ 高 | 模板 JSON 存储 | 低 — 静态数据加载 |
| P-P2-1 三树共享抽象 | ⚠️ 中 | 需要完整回归测试 | 中 — 重构范围大 |
| P-P2-2 Undo/Redo 验证 | ⚠️ 中 | 确认 snapshot 机制稳定 | 低 — 主要是验证工作 |

### 3.2 资源评估

| 提案 | 预计工时 | 人员 |
|------|---------|------|
| P-P0-1 空数据兜底 | 2h | dev |
| P-P0-2 删除按钮绑定 | 1h | dev |
| P-P1-1 新手引导 | 4h | dev + pm 确认步骤 |
| P-P1-2 项目搜索 | 6h | dev |
| P-P1-3 需求模板库 | 3h | dev |
| P-P2-1 三树共享抽象 | 8h | architect 指导 |
| P-P2-2 Undo/Redo 验证 | 4h | tester |

**总计**: 28h（约 3.5 人天）

---

## 四、初步风险识别

### 4.1 高风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 三树 `deleteSelectedNodes` 方法签名不一致 | P-P0-2 可能需要先修复 store | 先在代码中搜索确认方法存在再实施 |
| 新手引导与 UI 耦合导致维护成本 | 引导步骤失效后用户体验断崖 | 引导步骤使用 CSS class 而非 DOM 结构 |

### 4.2 中风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| P-P1-3 模板库扩展性问题 | 未来模板增多后需要管理后台 | 先用 JSON 文件存储，走 PR 流程管理 |
| P-P2-2 Undo/Redo snapshot 机制不完整 | 某些操作未触发 recordSnapshot | 先写集成测试验证现有 snapshot 覆盖 |

### 4.3 低风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 项目搜索性能（大量项目时） | 用户输入时列表卡顿 | 使用 debounce + 客户端搜索，避免每次按键触发 |

---

## 五、历史经验教训

### 5.1 来自 learnings/

**canvas-api-completion** (2026-04-05):
- Route 顺序敏感性：Hono 中 `GET /latest` 必须放在 `GET /:id` 之前
- 防范：API 设计时标注 route 匹配优先级，测试覆盖边界路径

**vibex-e2e-test-fix** (2026-04-05):
- PRD Epic 划分与实际实现的颗粒度差异：Epic 之间存在实现依赖时应合并
- IMPLEMENTATION_PLAN scope drift：IMPL 不得超出 PRD 范围
- 防范：跨提案借鉴时必须回溯原始 PRD 确认 scope

**canvas-testing-strategy** (2026-04-05):
- Mock store 的真实性问题：简化 mock 无法反映实际 Zustand 行为
- Vitest vs Jest 语法迁移中的路径污染

### 5.2 来自 Git History

**vibex-ts-any-cleanup**:
- `UndoBar.tsx` 有 6 个 `as any`，涉及 Undo/Redo 核心逻辑
- 清理后确认：ReactFlow edge/node 类型仍需更深层重构

**canvas-flowtree-api-fix**:
- E3 添加了 `flowId` 回退逻辑，但 `flowId = ''` 时仍发起无效请求
- 这是 P-P0-1 的直接触发点

**canvas-button-consolidation**:
- TreeToolbar 的 `onDelete` / `onReset` 按钮在 Flow Tree 中已添加
- 但 Context Tree 和 Component Tree 的 TreeToolbar 未同步添加

---

## 六、验收标准（具体可测试）

### P-P0-1: 组件树生成空数据兜底

- [ ] `flowId` 为空时，"继续·组件树"按钮显示 disabled 状态（视觉验证）
- [ ] API 返回空数据（`components.length === 0`）时，Console 无报错但节点列表不更新（E2E 测试）
- [ ] API 返回 HTTP 错误时，Console 记录 `canvasLogger.CanvasPage.error`（单元测试 mock 验证）
- [ ] `handleContinueToComponents` 在 `result.success === false` 时设置 `componentGenerating = false`（代码审查）

### P-P0-2: 删除按钮绑定

- [ ] 选中 Context 节点后，点击 TreeToolbar 删除按钮 → 节点从树中消失（E2E 测试）
- [ ] 选中 Component 节点后，点击 TreeToolbar 删除按钮 → 节点从树中消失（E2E 测试）
- [ ] 无选中节点时，TreeToolbar 删除按钮 disabled（视觉验证）
- [ ] 选中节点后删除前弹出确认对话框（手动测试）

### P-P1-1: 新手引导

- [ ] 清除 `localStorage.canvas_onboarded` → 访问 Canvas → 引导蒙层出现（E2E 测试）
- [ ] 点击"跳过引导"→ 蒙层消失 → `localStorage.canvas_onboarded` 被设置（E2E 测试）
- [ ] 刷新页面后，引导不重复出现（E2E 测试）
- [ ] 引导有 ≥3 个步骤（代码审查）

### P-P1-2: 项目搜索

- [ ] Dashboard 显示搜索输入框（视觉验证）
- [ ] 输入项目名后，列表在 500ms 内过滤（E2E 测试）
- [ ] 搜索无结果时显示空状态 + 创建入口（E2E 测试）
- [ ] 键盘上下键可导航搜索结果（手动测试）

### P-P1-3: 需求模板库

- [ ] Canvas 页面显示 ≥3 个模板卡片（视觉验证）
- [ ] 点击模板后，输入框自动填充对应需求描述（E2E 测试）
- [ ] 每个模板有行业图标和简介（视觉验证）
- [ ] "自定义需求"按钮可跳过模板直接输入（E2E 测试）
- [ ] 新增模板只需修改 JSON 文件，不需改代码（代码审查）

### P-P2-1: 三树共享抽象

- [ ] `TreeToolbar` 组件提取为独立文件（代码审查）
- [ ] 三树各自减少 ≥100 行重复代码（代码行数统计）
- [ ] 现有 E2E 测试全部通过（CI 验证）
- [ ] `TreeToolbar` 接收统一 props 类型，三树共用（TypeScript 编译验证）

### P-P2-2: Undo/Redo 功能

- [ ] 添加节点 → 撤销 → 节点消失 → 重做 → 节点恢复（E2E 测试）
- [ ] `Ctrl+Z` 触发撤销（手动测试）
- [ ] `Ctrl+Shift+Z` 触发重做（手动测试）
- [ ] UndoBar 显示当前历史步数（视觉验证）
- [ ] 无历史时 UndoBar 显示 disabled（视觉验证）

---

## 七、建议实施顺序

```
Phase 1 (P0 止血): P-P0-1 + P-P0-2  → 预计 3h
  ↓
Phase 2 (P1 UX 改善): P-P1-3 → P-P1-1 → P-P1-2  → 预计 13h
  ↓
Phase 3 (P2 架构优化): P-P2-1 + P-P2-2  → 预计 12h
```

**推荐并行执行**: P-P0-1 和 P-P0-2 可并行（均改 CanvasPage.tsx），降低上下文切换成本。

---

*Analysis — vibex-pm-proposals-vibex-proposals-20260408 — 2026-04-08*
