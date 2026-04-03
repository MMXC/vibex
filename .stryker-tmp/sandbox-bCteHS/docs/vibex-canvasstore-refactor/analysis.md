# VibeX canvasStore 职责拆分重构 — 需求分析文档

> **项目**: vibex-canvasstore-refactor  
> **阶段**: analyze-requirements  
> **作者**: analyst  
> **日期**: 2026-04-02  
> **状态**: ✅ 分析完成

---

## 1. 业务场景分析

### 1.1 现状问题

`canvasStore.ts` 当前 **1433 行**，将 17 个职责完全不同的领域塞进单个 Zustand store：

| # | 领域 | 职责 | 行估计 |
|---|------|------|--------|
| 1 | Phase Slice | phase, activeTree | ~20 |
| 2 | Panel Collapse Slice | 三面板折叠状态 | ~10 |
| 3 | Expand Slice | 面板展开逻辑、gridTemplate | ~50 |
| 4 | Drag Slice | 拖拽节点状态 | ~40 |
| 5 | Bounded Group Slice | 节点分组 | ~50 |
| 6 | BoundedEdge Slice | Context 连线 | ~20 |
| 7 | FlowEdge Slice | Flow 连线 | ~20 |
| 8 | Context Slice | contextNodes CRUD + history | ~120 |
| 9 | Flow Slice | flowNodes CRUD + steps + autoGenerate | ~250 |
| 10 | Component Slice | componentNodes CRUD + generate | ~100 |
| 11 | Multi-Select Slice | selectedNodeIds 批量操作 | ~50 |
| 12 | Queue Slice | 原型队列、轮询 | ~30 |
| 13 | AI Thinking Slice | AI 思考状态 | ~10 |
| 14 | Left/Right Drawer Slice | 抽屉开关、宽度 | ~30 |
| 15 | SSE Status Slice | SSE 连接状态、中断控制 | ~20 |
| 16 | Flow Generation Slice | 流程生成状态 | ~10 |
| 17 | Message Slice | 消息日志 | ~20 |
| - | CascadeUpdateManager | 级联更新管理器 | ~50 |
| - | Helpers/Migrations | 工具函数、数据迁移 | ~80 |
| - | Persist Config | localStorage 持久化 | ~60 |

**影响范围**: 
- 调用点: **250+ 处**（非测试代码）
- 测试文件: **17 个** canvas 相关测试
- 依赖组件: **~30 个** React 组件 + hooks

### 1.2 为什么需要拆分

| 痛点 | 影响 |
|------|------|
| **维护成本高** | 修改任何节点 CRUD 需要在 1433 行文件中导航；新人 onboarding 需要消化整块逻辑 |
| **测试困难** | 无法对 context CRUD 单独写单元测试；必须启动完整 store 才能 mock |
| **回归风险高** | 单 store 内跨 slice 隐性依赖多（如 `recomputeActiveTree` 同时读三个树），改一处可能伤及多处 |
| **团队协作冲突** | 多人同时改同一个文件，git 冲突频繁 |
| **状态订阅粒度粗** | 组件订阅 `useCanvasStore()` 时，任何 slice 变化都触发重渲染 |
| **违反 SRP** | Store 同时是"数据源"、"业务逻辑层"、"持久化层"、"级联协调器" |

### 1.3 已有基础设施

- ✅ `historySlice.ts` 已独立（undo/redo）
- ✅ 已有 17 个 canvas 测试文件
- ✅ Zustand `combine` 模式已用于其他 store
- ✅ `messageDrawerStore.ts` 刚合并入 canvasStore（Epic 6），说明团队已有 store 合并经验

---

## 2. 核心 JTBD（Jobs to be Done）

### JTBD-1: 快速定位并修改特定领域逻辑
> "作为开发者，我需要能快速找到并修改某个领域的代码"  
> **当前障碍**: 1433 行单文件，17 个领域混杂  
> **成功标准**: 每个领域 <300 行独立文件，文件名即领域名

### JTBD-2: 对单个领域写隔离的单元测试
> "作为开发者，我需要能对 contextNodes CRUD 单独写测试，不依赖 flowNodes 或 SSE"  
> **当前障碍**: 所有 slice 在同一 store 实例内，测试需要 mock 整个 store  
> **成功标准**: 每个新 store 有独立测试文件，测试覆盖率 ≥80%

### JTBD-3: 理解三树之间的数据流向
> "作为开发者，我需要清楚理解 context → flow → component 的级联关系"  
> **当前障碍**: 级联逻辑内聚在 store 内部，边界不清晰  
> **成功标准**: 级联协议通过类型化接口暴露，文档说明跨 store 调用约定

### JTBD-4: 添加新功能不引发回归
> "作为开发者，我添加 component 生成功能时，不担心破坏 context 确认逻辑"  
> **当前障碍**: 单 store 共享状态，隐性依赖多  
> **成功标准**: 每个 store 独立发布 CI，单元测试 100% 通过后才可合并

### JTBD-5: UI 状态与领域状态解耦
> "作为开发者/用户，UI 状态变化（面板折叠）不应触发领域逻辑重执行"  
> **当前障碍**: `useCanvasStore()` 全订阅，任何状态变化都触发所有订阅组件重渲染  
> **成功标准**: UI store 变更不导致 Flow/Context 组件重渲染

---

## 3. 技术方案选项

### 选项 A: 全量拆分（Zustand `combine` 根 store 模式）

**架构设计**:

```
canvasStore (根 store, ~80行)
├── contextStore   (~180行) — contextNodes, contextDraft, CRUD
├── flowStore      (~350行) — flowNodes, flowDraft, steps, autoGenerate
├── componentStore (~180行) — componentNodes, componentDraft, generate
├── uiStore        (~280行) — panels, drawers, expand, selection, drag
├── sessionStore   (~150行) — SSE, AI thinking, queue, messages
└── historyStore   (已存在)
```

**核心机制**:
```typescript
// 使用 Zustand combine 组合子 store
export const useCanvasStore = create<CanvasStore>()(
  devtools(
    persist(
      combine(
        { ...contextStore, ...flowStore, ...uiStore, ...sessionStore },
        (state, set) => ({ /* cross-slice actions */ })
      ),
      { name: 'canvas-store', /* persist config */ }
    ),
    { name: 'canvasStore' }
  )
);

// 保持向后兼容的 re-export（临时的）
export const {
  // context slice
  setContextNodes, addContextNode, editContextNode, deleteContextNode,
  confirmContextNode, contextNodes, contextDraft, setContextDraft,
  // flow slice
  flowNodes, flowDraft, setFlowNodes, addFlowNode, editFlowNode,
  deleteFlowNode, confirmFlowNode, setFlowDraft,
  // ...全部 100+ 个接口
} = useCanvasStore.getState();
```

**工作估算**:
- 拆分 5 个新 store 文件: 3 天
- 更新 250+ 调用点（渐进式）: 4 天
- 迁移 localStorage persist 配置: 1 天
- 跨 store 级联逻辑重构: 1.5 天
- 测试补充（30+ 新测试）: 2 天
- 回归验证: 1.5 天
- **总计: ~13 个工作日（2 dev + 1 reviewer）**

**优点**:
- 真正的职责分离
- 每个 store 可独立测试
- Zustand `combine` 保持 persist 统一配置
- 团队可并行开发不同 store

**缺点**:
- 一次性改动大，回归风险集中
- 需要一次性更新所有调用点（或维护长期兼容层）
- 可能引入跨 store 循环依赖风险

---

### 选项 B: 渐进式拆分 + 向后兼容层（✅ 推荐）

**策略**: 分 5 个 phase，每 phase 拆分 1 个 slice，维持 `canvasStore` 向后兼容 re-export，每 phase 独立可测、可回滚。

**Phase 1 — 提取 `contextStore`**
```
新文件: src/lib/canvas/stores/contextStore.ts
提取内容: contextNodes, contextDraft, setContextNodes, addContextNode,
          editContextNode, deleteContextNode, confirmContextNode, setContextDraft
行数: ~180行
向后兼容: canvasStore 保留所有 context 接口 re-export
风险等级: 🟢 低（context slice 与其他 slice 无隐式依赖）
```
**交付物**:
- [ ] `contextStore.ts` 独立文件
- [ ] `contextStore.test.ts` 覆盖率 ≥80%
- [ ] canvasStore 向后兼容 re-export
- [ ] 17 个现有测试全部通过

**Phase 2 — 提取 `uiStore`**
```
新文件: src/lib/canvas/stores/uiStore.ts
提取内容: panelCollapse, expand, drawer, drag, selection, boundedGroups, boundedEdges, flowEdges
行数: ~280行
向后兼容: canvasStore 保留所有 UI 接口 re-export
风险等级: 🟡 中（UI slice 被 ~20 个组件直接订阅）
```
**交付物**:
- [ ] `uiStore.ts` 独立文件
- [ ] `uiStore.test.ts` 覆盖率 ≥80%
- [ ] 更新 ProjectBar, TreePanel, CardTreeRenderer 等 ~20 个组件

**Phase 3 — 提取 `flowStore`**
```
新文件: src/lib/canvas/stores/flowStore.ts
提取内容: flowNodes, flowDraft, steps, autoGenerateFlows
行数: ~350行
特殊处理: 
  - 需要从 historyStore 读取 snapshot（已有接口）
  - 需要调用 contextStore 的 confirm 状态（Phase 1 已独立）
  - CascadeUpdateManager 中的 flow 逻辑移入 flowStore
风险等级: 🟡 中（step 操作复杂，有 reorder 逻辑）
```
**交付物**:
- [ ] `flowStore.ts` 独立文件
- [ ] `flowStore.test.ts` 覆盖率 ≥80%
- [ ] CascadeUpdateManager 重构为 FlowStore 内部逻辑

**Phase 4 — 提取 `componentStore`**
```
新文件: src/lib/canvas/stores/componentStore.ts
提取内容: componentNodes, componentDraft, generateComponentFromFlow
行数: ~180行
特殊处理: 
  - 依赖 flowStore（读取 flowNodes 生成组件）
  - 依赖 contextStore（读取 contextNodes）
风险等级: 🟡 中
```
**交付物**:
- [ ] `componentStore.ts` 独立文件
- [ ] `componentStore.test.ts` 覆盖率 ≥80%

**Phase 5 — 提取 `sessionStore` + 清理根 store**
```
新文件: src/lib/canvas/stores/sessionStore.ts
提取内容: sseStatus, aiThinking, flowGenerating, queue, messages
新文件: src/lib/canvas/stores/index.ts （barrel export）
清理: 移除 canvasStore 中所有 re-export，只保留跨 slice actions
行数: ~150行
风险等级: 🟢 低（session slice 与领域逻辑解耦最彻底）
```
**交付物**:
- [ ] `sessionStore.ts` 独立文件
- [ ] `stores/index.ts` 统一导出
- [ ] `canvasStore.ts` 压缩至 ~100 行（仅保留跨 slice actions + persist）

**工作估算**:
- Phase 1: 3 天（dev） + 0.5 天（reviewer）
- Phase 2: 4 天 + 0.5 天
- Phase 3: 4 天 + 1 天
- Phase 4: 3 天 + 0.5 天
- Phase 5: 2 天 + 0.5 天
- 集成回归测试: 2 天
- **总计: ~21 个工作日（1 dev 串行，1 dev 并行 reviewer）**

**优点**:
- 每 phase 独立可验证
- 随时可暂停或回滚到上一稳定状态
- 不需要一次性更新所有 250+ 调用点
- 渐进式用户体验

**缺点**:
- 总工期更长（21 vs 13 工作日）
- Phase 1-4 中需要维护双向 re-export，临时复杂
- 需要 discipline 确保不在中间 phase 引入新耦合

---

### 选项 C: 轻量重构（保持单 store，内部分片）

**策略**: 不拆分 store 文件，用 Zustand slice 模式 + 清晰注释 + `subscribeWithSelector` 做订阅优化。

**工作估算**: ~3 天

**结论**: 不推荐。只解决了部分问题（订阅粒度），未解决维护性和测试性。

---

## 4. 可行性评估

### 4.1 技术可行性

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Zustand 支持 combine | ✅ | 已在其他 store 使用 |
| historySlice 已独立 | ✅ | 证明拆分模式可行 |
| 测试基础设施 | ✅ | 已有 17 个 canvas 测试 |
| TypeScript 类型共享 | ✅ | types.ts 已在 canvasStore 同级 |
| persist 配置迁移 | ⚠️ | 需要重新设计 localStorage key 策略 |
| 循环依赖风险 | ⚠️ | flowStore ↔ componentStore 需要单向依赖约定 |

### 4.2 架构约束

根据 AGENTS.md ADR-002 的约束：
- ✅ "状态分片按 context/flow/component/phase/queue 严格划分" — 拆分完全符合 ADR
- ✅ " CascadeUpdateManager 内聚在 store 内" — 重构后可内聚在各子 store
- ✅ "不在 confirmationStore 上扩展" — 不影响

### 4.3 关键决策点

> **1. 是否保留根 `canvasStore` 作为单一入口？**  
> 推荐保留。原因：250+ 调用点无需一次性修改；新组件可直接从子 store 导入；旧组件逐步迁移。

> **2. 子 store 之间的依赖如何管理？**  
> 推荐单向依赖树：`contextStore` 无依赖 → `flowStore` 依赖 contextStore → `componentStore` 依赖 flowStore + contextStore → `uiStore` 独立。严禁双向依赖。

> **3. persist 如何分配？**  
> 推荐：persist 配置保留在根 store；子 store 通过 `combine` 的 state 切片写入根 persist。

---

## 5. 风险识别与缓解

### 5.1 回归风险（高）

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 现有组件使用 `useCanvasStore()` 全订阅，分离后行为变化 | 高 | 高 | Phase 1 先从 contextStore 开始（最少被 UI 组件订阅）；使用 `combine` 保持单一 store 实例 |
| `recomputeActiveTree` 依赖多个 slice，拆分后逻辑失效 | 高 | 高 | 保留在根 store 或迁移到 `phaseStore`；Phase 3 单独处理 |
| `CascadeUpdateManager.markDownstreamPending` 跨 slice 调用 | 高 | 中 | 改为事件订阅模式：contextStore emit → flowStore subscribe |
| historyStore 记录 snapshot 依赖 `getHistoryStore()` | 中 | 中 | 保持 `getHistoryStore()` 接口不变；子 store 继续调用 |

### 5.2 接口兼容性风险（中）

| 风险 | 缓解措施 |
|------|----------|
| 250+ 调用点分散在 30+ 文件中，迁移工作量大 | 向后兼容 re-export；提供 codemod 脚本批量替换 |
| `useCanvasStore.getState()` 在 action 内部调用（如 `addContextNode` 中调用 `addMessage`） | 拆分后通过事件总线或 store 间引用解决 |
| `messageDrawerStore` 刚合并入 canvasStore（Epic 6），边界可能不清 | 澄清 message slice 的归属（建议归入 sessionStore） |

### 5.3 持久化迁移风险（中）

| 风险 | 缓解措施 |
|------|----------|
| `vibex-canvas-storage` localStorage key 中的状态结构变化 | 复用现有 `runMigrations` 框架；每个 phase 添加 migration handler |
| 子 store 独立 persist 时的 key 冲突 | 统一使用根 key；子 store 通过 `combine` 合并 |

### 5.4 团队协作风险（低）

- 多人同时修改 canvasStore → 拆分后各人独立负责不同 store，减少冲突
- 新功能等待重构完成 → Phase 1 后即可在新 store 上开发

---

## 6. 验收标准

### 总体目标

```
Phase 完成率    : 5/5 phases
现有测试通过率  : 100% (17/17 现有测试)
新增测试覆盖率  : 每个新 store ≥80% 行覆盖率
运行时错误      : 0 regression errors
回归 bug        : 0 P0/P1 regression bugs
Bundle size     : 拆分后 JS bundle size ≤ 拆分前 +5%
```

### 分阶段交付标准

#### ✅ Phase 1 交付（contextStore 独立）

| 验收项 | 验证方式 | 合格标准 |
|--------|----------|----------|
| contextStore.ts 独立文件 | 文件存在检查 | `src/lib/canvas/stores/contextStore.ts` 存在 |
| contextSlice 测试覆盖率 | `pnpm vitest run --coverage` | 行覆盖率 ≥80% |
| 现有测试通过 | `pnpm vitest run canvas/` | 17/17 通过 |
|向后兼容 re-export | `grep "contextNodes" canvasStore.ts` | canvasStore 保留 re-export |
| 手动功能验证 | Playwright E2E | 添加/编辑/删除 context 节点正常 |

#### ✅ Phase 2 交付（uiStore 独立）

| 验收项 | 验证方式 | 合格标准 |
|--------|----------|----------|
| uiStore.ts 独立文件 | 文件存在检查 | `src/lib/canvas/stores/uiStore.ts` 存在 |
| uiStore 测试覆盖率 | `pnpm vitest run --coverage` | 行覆盖率 ≥80% |
| 面板折叠/展开 | Playwright E2E | 三个面板折叠/展开正常 |
| 拖拽功能 | Playwright E2E | 节点拖拽正常 |
| Drawer 抽屉 | Playwright E2E | 左右抽屉开关正常 |
| 选中状态 | Playwright E2E | 多选/单选/批量删除正常 |

#### ✅ Phase 3 交付（flowStore 独立）

| 验收项 | 验证方式 | 合格标准 |
|--------|----------|----------|
| flowStore.ts 独立文件 | 文件存在检查 | `src/lib/canvas/stores/flowStore.ts` 存在 |
| flowStore 测试覆盖率 | `pnpm vitest run --coverage` | 行覆盖率 ≥80% |
| 级联更新 | Playwright E2E | context 变更后 flow 标记 pending |
| Step CRUD | Playwright E2E | 添加/编辑/删除/重排 steps 正常 |
| 自动生成流程 | Playwright E2E | 从 context 自动生成 flow 正常 |

#### ✅ Phase 4 交付（componentStore 独立）

| 验收项 | 验证方式 | 合格标准 |
|--------|----------|----------|
| componentStore.ts 独立文件 | 文件存在检查 | `src/lib/canvas/stores/componentStore.ts` 存在 |
| componentStore 测试覆盖率 | `pnpm vitest run --coverage` | 行覆盖率 ≥80% |
| 从 flow 生成 component | Playwright E2E | 生成功能正常 |
| component CRUD | Playwright E2E | 添加/编辑/删除 component 节点正常 |

#### ✅ Phase 5 交付（sessionStore + 清理）

| 验收项 | 验证方式 | 合格标准 |
|--------|----------|----------|
| sessionStore.ts 独立文件 | 文件存在检查 | `src/lib/canvas/stores/sessionStore.ts` 存在 |
| SSE 连接/断开 | Playwright E2E | SSE 状态显示正常 |
| AI Thinking 状态 | Playwright E2E | AI 思考状态显示正常 |
| canvasStore.ts 行数 | `wc -l canvasStore.ts` | ≤150 行 |
| localStorage 迁移 | 清除缓存后刷新 | 数据完整恢复，无 404 类型错误 |
| stores/index.ts 统一导出 | `grep "export.*from" stores/index.ts` | 5 个 store 全部导出 |

### 最终验收

| 验收项 | 标准 |
|--------|------|
| 代码行数 | canvasStore.ts ≤150 行，每个子 store ≤350 行 |
| 测试覆盖率 | 每个 store ≥80%，总体 ≥75% |
| Bundle size | `pnpm build` 后 JS bundle 增量 ≤5% |
| 回归 | 无 P0/P1 回归 bug |
| 文档 | 每个 store 有 JSDoc 注释，跨 store 调用有 ADR 说明 |

---

## 7. 推荐方案与实施建议

### 推荐: 选项 B（渐进式拆分）

**理由**:
1. 1433 行到 5 个独立 store，变革幅度大，全量拆分风险过于集中
2. 团队当前有 17 个测试文件，渐进拆分可逐步建立新测试覆盖
3. ADR-002 已规定"按 slice 严格划分"，渐进拆分是对现有约束的渐进式兑现
4. 250+ 调用点无需一次性修改，降低协作摩擦

### 实施顺序建议

```
Phase 1 (contextStore) → Phase 2 (uiStore) → Phase 3 (flowStore) 
    → Phase 4 (componentStore) → Phase 5 (sessionStore + 清理)
```

**注意**: `flowStore` 和 `componentStore` 之间有依赖关系（component 从 flow 生成），建议按此顺序确保单向依赖链。

### 下一步行动

1. **analyst** → 产出本分析文档 ✅
2. **pm** → 确认 Option B + 优先级排序 → 创建 IMPLEMENTATION_PLAN.md
3. **dev** → Phase 1 contextStore 拆分（预计 3 工作日）
4. **tester** → Phase 1 contextStore 测试覆盖（与 dev 并行）
5. **reviewer** → Phase 1 code review + 回归验证

---

*文档版本: 1.0 | 分析时间: 2026-04-02 | 状态: 提交评审*
