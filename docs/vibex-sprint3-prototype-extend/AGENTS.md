# AGENTS.md — vibex-sprint3-prototype-extend

**项目**: vibex-sprint3-prototype-extend
**版本**: 1.0
**日期**: 2026-04-17
**角色**: Architect

---

## 开发约束总览

所有参与本 Sprint 的 Agent 必须遵守以下约束，违反者将触发 review 驳回。

---

## G1: 规范遵守（强制）

### G1.1 CLAUDE.md 强制要求

- **所有 UI 改动必须符合 `DESIGN.md`** 中定义的设计变量
- **禁止使用内联 `style={{}}`** 定义颜色/间距/字体（已定义变量的场景）
- **禁止引入 DESIGN.md 中未定义的新颜色**
- CSS Modules（`.module.css`）是唯一允许的组件样式方案
- **新增组件前先检查 `design-tokens.css`** 是否已有对应变量

### G1.2 TypeScript 严格模式

- 所有新增文件必须开启 strict mode
- 禁止 `any` 类型，必要时使用 `unknown` + 类型守卫
- 接口变更必须同步更新文档注释

### G1.3 代码验证（每次 PR 前）

```bash
# 检查内联样式（零容忍）
grep -rn "style={{" vibex-fronted/src/ --include="*.tsx" | grep -v node_modules | grep -v ".test."

# ESLint 验证
cd vibex-fronted && pnpm lint
```

---

## G2: prototypeStore 扩展规范

### G2.1 禁止破坏现有数据

- 新增 state 字段必须设默认值，不破坏 `localStorage` 中已有数据的兼容性
- 扩展已有 action 时，保持原有签名兼容（可选参数用默认值）
- `persist` middleware 配置不得删除或修改现有 key

### G2.2 edges 字段使用规范

- **仅 FlowTreePanel 管理 edges 创建和删除**
- ProtoFlowCanvas 只负责渲染和选择，不直接调用 `addEdge`/`removeEdge`
- edges 数据源永远是 `usePrototypeStore.getState().edges`，禁止在组件本地 state 冗余存储

### G2.3 breakpoint 状态规范

- `breakpoint` 取值严格限定：`'375' | '768' | '1024'`
- `setBreakpoint` 调用前不做类型转换，由 reducer 保证合法性
- 断点切换不触发节点重新创建，只改变 `display` 样式和缩放比例

---

## G3: ProtoEditor.tsx 修改规范（323行文件）

### G3.1 分区注释（强制）

所有修改必须用以下注释包裹，分区外不得修改任何代码：

```typescript
// === E3: DeviceSwitcher ===
// ... 新增代码 ...
// === E3: END ===
```

### G3.2 Feature Flag 保护

```typescript
const E3_ENABLED = process.env.NEXT_PUBLIC_E3_ENABLED === 'true';

{process.env.NEXT_PUBLIC_E3_ENABLED === 'true' && (
  // === E3: DeviceSwitcher ===
  <DeviceSwitcher />
  // === E3: END ===
)}
```

### G3.3 验证要求

- 每次修改后运行 `pnpm build` 确保 ProtoEditor 不破坏构建
- 运行 `pnpm test:unit` 确保 Vitest 测试通过

---

## G4: PropertyPanel 规范

### G4.1 组件目录结构

```
vibex-fronted/src/components/prototype/PropertyPanel/
├── PropertyPanel.tsx          # 主容器，管理 Tab 状态和 Drawer 开关（基于 ProtoAttrPanel 重构）
├── PropertyPanel.module.css   # 布局样式（320px drawer）
├── DataTab.tsx                # 数据 Tab
├── StyleTab.tsx               # 样式 Tab
├── NavigationTab.tsx          # 导航 Tab（调用 addEdge）
└── ResponsiveTab.tsx          # 响应式 Tab（调用 updateNodeBreakpoints）
```

> **注意**: PRD 中的 `MockDataPanel.tsx` 不存在，属性面板前身是 `ProtoAttrPanel.tsx`（已有 props/mock 两 Tab）。

### G4.2 Drawer 行为

- 宽度固定 320px，不随内容变化
- 打开动画：300ms ease-out，从右侧滑入
- 关闭时清空 Tab 状态
- 双击节点时自动切换到 DataTab（默认 Tab）

### G4.3 NavigationTab 联动规则

- Navigation Tab 选择目标页面时，**自动调用 `addEdge(selectedNodeId, targetPageId)`**
- 若该 edge 已存在（同名 source+target），更新而非重复创建
- 更新 `nodes[i].data.navigation` 字段

### G4.4 ResponsiveTab 联动规则

- 三个 Toggle（手机/平板/桌面）独立控制
- 至少保留一个断点为 true（禁止全部关闭）
- 更新 `nodes[i].data.breakpoints` 字段

---

## G5: React Flow 扩展规范

### G5.1 edge 类型

- 使用 React Flow 内置 `smoothstep` edge 类型（`type: 'smoothstep'`）
- 禁止自定义 EdgeTypes 除非架构评审通过

### G5.2 双击事件

- 双击节点：触发 `selectNode(node.id)` → PropertyPanel 打开
- 双击 edge：触发 `removeEdge(edge.id)` → 连线删除

### G5.3 缩放策略

- 断点缩放通过外层容器 CSS `transform: scale()` 实现
- 禁止修改 React Flow 内部 `zoom` 状态（由 `fitView` 控制）

---

## G6: E4 AI 导入规范

### G6.1 API Key 安全

- **禁止在前端代码中硬编码 API Key**
- API Key 通过 `NEXT_PUBLIC_AI_API_KEY` 环境变量注入
- 若使用服务端代理，调用 `/api/ai/analyze-image`（后端处理 Key）

### G6.2 错误处理

- AI 服务不可用：显示「识别失败，请重试」，不阻塞用户操作
- 图片过大（>10MB）：前端压缩或提示用户
- 识别结果为空：显示「未识别到组件」而非静默失败

### G6.3 导入结果

- `addNodes()` 批量导入后，**自动触发 `fitView()`** 让画布适应新节点
- 导入节点默认 `breakpoints: { mobile: true, tablet: true, desktop: true }`（全断点可见）

---

## G7: 测试规范

### G7.1 单元测试要求

每个 Epic 至少一个 Vitest 测试文件：

| Epic | 测试文件 | 覆盖率目标 |
|------|---------|-----------|
| E1 | `vibex-fronted/src/stores/__tests__/prototypeStore.test.ts` | > 80%（edges CRUD）|
| E2 | `vibex-fronted/src/components/prototype/__tests__/PropertyPanel.test.tsx` | > 80% |
| E3 | `vibex-fronted/src/components/prototype/__tests__/ProtoEditor.test.tsx` | > 80%（断点相关）|
| E4 | `vibex-fronted/src/services/figma/__tests__/image-import.test.ts` | > 80% |

### G7.2 gstack Browse QA 要求

每次 PR 必须包含以下自动化测试通过：

```bash
# 启动 gstack browse
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright

# E1 验证
$B goto http://localhost:3000/prototype/editor
$B is visible text="添加连线"
$B is visible svg path  # 连线渲染

# E2 验证
$B snapshot -i
$B click @eX  # 双击节点
$B is visible [data-testid="property-panel"]

# E3 验证
$B is visible [aria-label="手机"]
$B click [aria-label="手机"]
$B is visible [data-testid="canvas-container"][style*="375px"]

# E4 验证
$B is visible text="上传图片"
$B is visible text="正在识别组件..."
```

### G7.3 回归测试

- Sprint1 所有已有功能在 gstack browse 中必须保持通过
- 重点回归：`ProtoEditor` 加载、`ProtoFlowCanvas` 节点拖拽、`FlowTreePanel` 页面切换
- 运行 `pnpm test:unit` 确保 Vitest 测试全部通过

---

## G8: 文件路径规范

| 场景 | 路径规则 |
|------|---------|
| 新建组件 | `vibex-fronted/src/components/prototype/PropertyPanel/` |
| 测试文件 | 与源文件同目录 `__tests__/` 子目录 |
| 样式文件 | 同目录 `.module.css` 文件 |
| 测试样式 | 与源测试文件同目录 |
| 服务扩展 | `vibex-fronted/src/services/figma/image-import.ts` |

### G8.1 文件引用核查（强制）

**architect 在编写 IMPLEMENTATION_PLAN 时，必须对每个文件路径做代码库核查**（`find` / `grep` 确认文件存在），禁止引用不存在的文件。

**发现错误引用的处理方式**：
- Coord 发现文件路径不存在 → **驳回 architect 完善**，在 AGENTS.md 中记入本节
- Architect 收到驳回后，必须先 `find`/`grep` 代码库确认实际文件，再更新 IMPLEMENTATION_PLAN

**已发现并修正的错误引用（本案）**：
| 错误引用 | 正确引用 | 来源 |
|---------|---------|------|
| `MockDataPanel.tsx` | `ProtoAttrPanel.tsx`（258行）| Architect |
| `CanvasPage.tsx`（911行，三树并行画布）| `ProtoEditor.tsx`（323行，原型编辑器）| ce-plan 子任务 |
| `jest` 测试框架 | `vitest` 测试框架 | 项目实际配置 |
| E4 直调 OpenAI API | `/api/ai/analyze-image` 后端代理（llm-provider.ts）| ce-plan 子任务 |

**禁止**：
- ❌ 在非 `__tests__` 目录放置测试文件
- ❌ 在 `app/` 目录直接创建组件（组件放 `components/`）
- ❌ 在 `CanvasPage.tsx` 中增加原型编辑器功能（CanvasPage 是三树并行画布）
- ❌ 使用相对路径以外的方式引用组件
- ❌ 引用 IMPLEMENTATION_PLAN 时不核查代码库

---

## G9: PR 合并规范

- 每个 Epic 单独 PR（P0 E1+E2 可合并为一个 PR）
- PR 必须包含：单元测试、gstack browse QA 结果、架构说明更新
- Feature flag 默认为 `false`，在 PR 描述中明确说明如何打开
- 合并前必须通过 `pnpm lint` + TypeScript 类型检查 + Vitest 单元测试 + gstack browse QA

---

## G10: 文档更新规范

每个 Epic 完成后必须更新：

- [ ] `docs/vibex-sprint3-prototype-extend/architecture.md`（如有接口变更）
- [ ] `vibex-fronted/src/stores/prototypeStore.ts` 顶部注释（如有新 state 字段）
- [ ] `vibex-fronted/CLAUDE.md`（如有新增约定）
- [ ] `docs/vibex-sprint3-prototype-extend/AGENTS.md`（如有新增开发约束）
