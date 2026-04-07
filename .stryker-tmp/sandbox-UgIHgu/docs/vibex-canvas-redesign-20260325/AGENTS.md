# AGENTS.md — VibeX Canvas 开发约束

**项目**: vibex-canvas-redesign-20260325
**角色**: architect
**日期**: 2026-03-25

---

## 技术决策（Architect Decision Record）

以下决策已由架构设计确定，Dev 必须遵守：

### ADR-001: 画布渲染技术选型
- ✅ 使用 dagre 布局 + SVG 渲染，**不要**引入 React Flow 或其他图库
- ✅ `CardTreeRenderer` 作为渲染引擎保留，**不要**重写
- ✅ 只在 `adapters/` 下扩展数据适配层

### ADR-002: 状态管理架构
- ✅ 新建 `stores/canvasStore.ts`，**不要**在 `confirmationStore` 上继续扩展
- ✅ 双 store 过渡期，`confirmationStore` 只读，`canvasStore` 驱动 UI
- ✅ 状态分片严格按 `context/flow/component/phase/queue` 划分，**不要**混排
- ✅ CascadeUpdateManager 放在 `lib/canvas/cascade/`，**不要**在组件内散落

### ADR-003: 原型队列
- ✅ API 端点统一前缀 `/api/canvas/`，**不要**使用 `/api/generate` 或其他路径
- ✅ 队列轮询间隔固定 5000ms，**不要**调整（除非性能数据支撑）
- ✅ 项目创建后 `projectId` 必须持久化到 localStorage

---

## 代码规范

### 文件命名
```
CanvasPage.tsx        # 页面组件（PascalCase）
canvasStore.ts        # store 文件（camelCase + Store 后缀）
dagreLayout.ts        # 工具函数（camelCase）
types.ts              # 类型定义（按目录组织）
```

### Store 规范
```typescript
// ✅ 正确：每个 slice 有独立 types + actions
interface ContextSlice {
  nodes: BoundedContextNode[];
  draft: Partial<BoundedContextNode> | null;
}

// ❌ 错误：在 slice 内混排其他领域的状态
interface MixedSlice {
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];  // ❌ flow 不属于 context slice
}
```

### 组件规范
```typescript
// ✅ 正确：组件接收 slice 相关的 props，不直接访问全局 store
interface TreePanelProps {
  tree: 'context' | 'flow' | 'component';
  nodes: TreeNode[];
  onNodeConfirm: (nodeId: string) => void;
  onNodeEdit: (nodeId: string, data: Partial<TreeNode>) => void;
}

// ❌ 错误：在 TreePanel 内直接 dispatch canvasStore 多个 slice
```

### API 规范
```typescript
// ✅ 正确：统一 API 客户端封装
export const canvasApi = {
  createProject: (data: CreateProjectInput): Promise<CreateProjectOutput> => ...,
  generate: (data: GenerateInput): Promise<GenerateOutput> => ...,
  getStatus: (projectId: string): Promise<StatusOutput> => ...,
  exportZip: (projectId: string): Promise<Blob> => ...,
};

// ❌ 错误：在组件内直接 fetch('/api/canvas/...')
```

---

## 禁止事项

| 禁止 | 原因 |
|------|------|
| 🚫 在 `components/canvas/` 外新建画布相关组件 | 画布组件必须集中在 `components/canvas/` |
| 🚫 在 `canvasStore` 之外单独管理画布状态 | 状态必须统一在 canvasStore，防止分散 |
| 🚫 直接修改 `CardTreeRenderer` 核心逻辑 | 只通过 adapter 适配数据，不改核心 |
| 🚫 跳过 CascadeUpdateManager 直接修改下游状态 | 必须经过级联管理器，保证一致性 |
| 🚫 使用 `any` 类型 | TypeScript 必须全类型覆盖 |
| 🚫 在 E2E 测试中使用 `setTimeout` 固定等待 | 必须用 Playwright 等待条件或 API 轮询 |
| 🚫 提交包含 `console.log` 的代码 | 生产代码禁止 debugger 日志 |

---

## PR 规范

### Commit Message 格式
```
feat(canvas): add PhaseProgressBar component
fix(store): correct cascade pending logic for flow→component
test(cascade): add 100% coverage for CascadeUpdateManager
refactor(api): move canvas endpoints to /api/canvas prefix
```

### PR 检查清单（PR Author 必须自检）

**功能**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] 相关 Epic 的所有 Story 验收标准满足
- [ ] CascadeUpdateManager 覆盖到位（边界 case 测了）
- [ ] 无 `any` 类型泄漏

**代码质量**:
- [ ] 新文件有 `// TODO: 注释` → 需在 PR 内实现或创建 issue
- [ ] 无 `console.log`
- [ ] 组件有 JSDoc 注释（Props 接口）
- [ ] store actions 有类型签名

**测试**:
- [ ] 核心逻辑有单元测试（canvasStore actions, CascadeUpdateManager）
- [ ] E2E 测试通过（Playwright）

---

## 协作接口

### 与 Tester 协作
- 单元测试覆盖率报告由 Tester 检查（>80%）
- E2E 测试用例由 Tester 补充
- 性能测试（>100 节点响应 <500ms）由 Tester 执行

### 与 Reviewer 协作
- 所有 PR 必须经过 Reviewer 审查
- 审查维度：架构一致性（是否符合 AGENTS.md）、代码质量、测试覆盖
- Reviewer 有权要求驳回不符合 AGENTS.md 的变更

---

## 参考文档

- 架构文档: `docs/vibex-canvas-redesign-20260325/architecture.md`
- 实施计划: `docs/vibex-canvas-redesign-20260325/IMPLEMENTATION_PLAN.md`
- PRD: `docs/vibex-canvas-redesign-20260325/prd.md`
- 分析: `docs/vibex-canvas-redesign-20260325/analysis.md`

---

*Architect — VibeX Canvas Redesign | 2026-03-25*
