# VibeX Sprint 35 — System Architecture

**Project**: vibex-proposals-sprint35
**Date**: 2026-05-11
**Status**: Technical Design — Architect Review
**Author**: architect
**WorkDir**: /root/.openclaw/vibex

---

## 1. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend Framework | Next.js | 15.x (standalone output) | Existing, stable |
| State management | Zustand | ^5.x | Existing canvas stores, middleware support |
| History management | Command Pattern + canvasHistoryStore | — | S34 遗留：undo/redo 双栈，50步限制 |
| Real-time collaboration | Firebase RTDB (REST) + mock fallback | — | S33 IntentionBubble/ConflictBubble 已集成 |
| Bundle analysis | @next/bundle-analyzer | ^0.11.x | S34 已建立 CI wiring |
| Performance CI | @lhci/cli + lighthouse | ^0.14.x | S34 lighthouserc.js 已配置 |
| Unit testing | Vitest | ^2.x | 53 tests passing |
| E2E testing | Playwright | ^1.x | sprint34-p001.spec.ts existing |
| CI/CD | GitHub Actions | — | bundle-report.yml, ai-review.yml |
| Storage | localStorage + IndexedDB (offline queue) | — | Existing |

**Compatibility note**: S35 在 S34 架构基础上延伸，新增功能无破坏性变更。

---

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph "S35-P001: Undo/Redo Completion"
        DCP[DDSCanvasPage.tsx<br/>undoCallback/redoCallback<br/>已连接 ✅]
        CHS[canvasHistoryStore<br/>双栈: past/future<br/>Command Pattern]
        MID[canvasHistoryMiddleware<br/>包装 ddsChapterActions]
        LS[vibex-dds-history-{canvasId}<br/>localStorage 持久化]
        SK[useKeyboardShortcuts<br/>Ctrl+Z / Ctrl+Shift+Z]
    end

    subgraph "S35-P002: Performance Baseline"
        BR[Bundle Report CI<br/>main 分支 baseline 记录<br/>PR 对比 +5% 阈值]
        LH[Lighthouse CI<br/>3 runs 中位数 warn 级别]
        PB[performance-baseline.md<br/>实测基线数值]
    end

    subgraph "S35-P003: Collaboration Research (调研)"
        IB[IntentionBubble<br/>edit/select/drag/idle<br/>500ms 延迟显示]
        CB[ConflictBubble<br/>冲突高亮可视化]
        PRES[usePresence hook<br/>Firebase RTDB + mock]
        RSC[collaboration-research.md<br/>竞品分析 + 方案推荐]
    end

    subgraph "S35-P004: Template Market Research (调研)"
        TEM[TemplatePage.tsx<br/>CRUD + 导入导出现有]
        RSC2[template-market-research.md<br/>用户故事 + API 设计]
    end

    DCP --> SK
    SK -->|"undo/redo →"| CHS
    CHS --> MID
    MID -->|"wrap actions"| DCP
    CHS --> LS
    BR --> PB
    LH --> PB
    IB --> PRES
    CB --> PRES
    PRES --> RSC

    style CHS fill:#e1f5fe
    style DCP fill:#fff9c4
    style RSC fill:#f3e5f5
    style RSC2 fill:#f3e5f5
    style PB fill:#e8f5e9
```

---

## 3. S35-P001: Undo/Redo 收尾 — 架构决策

### 现状评估

S34 已在 `DDSCanvasPage.tsx` 第 385-400 行完成了 undoCallback/redoCallback 连接：
```typescript
const undoCallback = useCallback(() => {
  useCanvasHistoryStore.getState().undo();
  return true;
}, []);
const redoCallback = useCallback(() => {
  useCanvasHistoryStore.getState().redo();
  return true;
}, []);
useKeyboardShortcuts({ undo: undoCallback, redo: redoCallback, ... });
```

`canvasHistoryMiddleware.ts` 也已在 S34 中实现，DDSCanvasPage 第 210-215 行的 useEffect 懒初始化 Middleware。

**S35-P001 工作是验证和补充**：
1. Middleware 初始化时机正确（已实现，第 210-215 行）
2. Ctrl+Z / Ctrl+Shift+Z 快捷键已连接（已实现，第 394 行）
3. `saveHistoryToStorage` / `loadHistoryFromStorage` 在 DDSCanvasPage 中未调用 — 需要补充
4. 现有 53 个 Canvas 单元测试需要全通过

### 补充项：localStorage 持久化调用

当前 `DDSCanvasPage.tsx` 第 210-215 行只初始化了 Middleware，没有调用 `saveHistoryToStorage`。

**补充点**：在 DDSCanvasPage 的 `useEffect` 中，每次 history 变更后保存到 localStorage：

```typescript
// 在 Middleware 初始化 useEffect 后追加
const historyState = useCanvasHistoryStore();
useEffect(() => {
  // 保存 history 到 localStorage（debounced, 500ms）
  const timeout = setTimeout(() => {
    const store = useDDSCanvasStore.getState();
    if (store.projectId) {
      saveHistoryToStorage(store.projectId);
    }
  }, 500);
  return () => clearTimeout(timeout);
}, [historyState.past.length, historyState.future.length]);
```

**注意**：`saveHistoryToStorage` 只能保存 metadata（id/timestamp/description），`execute`/`rollback` 闭包不可序列化。刷新后 history 重置为 empty，这是 S34 设计决策，已记录在 `canvasHistoryStore.ts` 注释中。

### 性能影响

- Middleware 每次 action 执行：O(1) 闭包创建 + `past.push(cmd)`，无性能问题
- localStorage 保存：debounced 500ms，偶发写入，不影响主线程
- 50 步限制：`past.shift()` O(n)，但 n=50 可忽略

---

## 4. S35-P002: 性能基线实测 — 架构决策

### 现状评估

S34 建立了 `.github/workflows/bundle-report.yml`（PR trigger）和 `lighthouserc.js`（warn 级别，3 runs）。`performance-baseline.md` 存在但为空。

### S35-P002 工作

1. **在 main 分支手动触发一次 Bundle Report CI**，记录基线数值
2. **在 CI workflow 中添加 baseline 写入步骤**：main 分支成功时，将当前 bundle size 写入 `performance-baseline.md`
3. **PR 中对比基线**：如果包体积增加 >5%，CI exit 1

### Bundle Report CI 增强

当前 `.github/workflows/bundle-report.yml` 在 PR trigger 时报告 bundle size，但没有：
- main 分支 baseline 记录
- PR vs baseline 对比
- 阈值失败机制

**增强方案**：

```yaml
# 在现有 bundle-report.yml 中追加 main 分支分支处理
jobs:
  bundle-report:
    if: github.event_name == 'pull_request'

  baseline-record:
    # 仅 main 分支运行，写入 baseline
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Record baseline
        run: |
          # 解析当前 bundle size 并写入 performance-baseline.md
          BUNDLE=$(grep -oP 'Route \(app\):.*?size: \K[0-9]+(?= kB)' ...)
          echo "| Metric | Value |" > performance-baseline.md
          echo "| main-bundle | ${BUNDLE} KB |" >> performance-baseline.md
```

### 性能影响

- Bundle Report CI：每次 PR build 增加 ~2-3 分钟（纯 build，无额外 cost）
- Lighthouse CI：3 runs × ~30s = 90s，warn 级别不阻断 PR

---

## 5. S35-P003: 多人协作调研 — 架构方向

### 现状评估

S33 已交付：
- `IntentionBubble.tsx`：显示 edit/select/drag/idle 意图气泡
- `ConflictBubble.tsx`：冲突节点高亮
- `usePresence` hook：Firebase RTDB + Zustand mock fallback
- `updateCursor(intention)`：支持 intention 参数

### 调研方向

S35-P003 是调研阶段（不实施），需要产出 `collaboration-research.md`，包含：
1. 竞品对比（Figma / Miro / Notion）
2. Firebase RTDB 扩展性风险
3. WebSocket vs WebRTC 选型
4. 至少 2 个可选方案（含 Pros/Cons）
5. 推荐方案 + 工时估算

### 技术考量

**Firebase RTDB 扩展性**：
- 免费层：100 并发连接，1GB 存储
- Real-time presence 每用户每秒 ~1-2 次写入
- 20 并发用户时约 20-40 writes/s，远低于 RTDB 限制（1000/s）

**WebSocket vs WebRTC**：
- WebSocket：服务器中转，适合 10-50 用户，延迟 50-100ms
- WebRTC：P2P，适合 2-20 用户，直连延迟 <20ms，但需要 STUN/TURN 服务器

**S35 产出**：`docs/vibex-proposals-sprint35/collaboration-research.md`

---

## 6. S35-P004: 模板市场调研 — 架构方向

### 现状评估

当前模板系统：
- `src/features/template/` + `src/components/templates/`
- CRUD + 导入导出（.vibex 格式）
- 页面：`pages/template/index.tsx`

### 调研方向

S35-P004 是调研阶段，需要产出 `template-market-research.md`，包含：
1. 至少 3 个用户故事
2. API 设计草稿（`/api/templates/marketplace` 端点）
3. 自建 vs 第三方方案 Pros/Cons
4. 模板代码沙箱隔离安全方案

### 技术考量

- 模板格式：`VibexExportSchema`（JSON），`exportedAt` optional
- 模板可能包含用户编写的 prompt/代码，需要沙箱隔离
- MVP 可以只是"模板发现"（列表+搜索），不需要完整评分系统

**S35 产出**：`docs/vibex-proposals-sprint35/template-market-research.md`

---

## 7. API Definitions

### S35-P001: Undo/Redo 补充 API

无新增 API。现有接口完整：
- `canvasHistoryStore.getState().undo()` / `.redo()`
- `saveHistoryToStorage(canvasId)` / `loadHistoryFromStorage(canvasId)`

### S35-P002: 性能基线

无新增 API。`performance-baseline.md` 是文档文件。

### S35-P003 调研 API（文档定义，实际不实现）

```typescript
// 调研文档中定义的未来 API surface（不编码）
GET  /api/collaboration/presence    // 获取在线协作者列表
POST /api/collaboration/cursor     // 更新光标位置 + intention
GET  /api/collaboration/conflicts  // 获取活跃冲突列表
POST /api/collaboration/resolve   // 解决冲突（keep-local/use-remote/merge）
```

### S35-P004 调研 API（文档定义，实际不实现）

```typescript
// 调研文档中定义的未来 API surface（不编码）
GET    /api/templates/marketplace           // 列表/搜索模板
POST   /api/templates/marketplace            // 上传模板（需鉴权）
GET    /api/templates/marketplace/:id       // 模板详情
POST   /api/templates/marketplace/:id/rate  // 评分（1-5星）
DELETE /api/templates/marketplace/:id       // 删除自己的模板（软删除）
```

---

## 8. Data Model

### S35-P001: History State（无新增）

```typescript
// 复用现有 canvasHistoryStore interface
interface Command {
  id: string;
  execute: () => void;
  rollback: () => void;
  timestamp: number;
  description?: string;
}

interface CanvasHistoryState {
  past: Command[];        // max 50
  future: Command[];
  isPerforming: boolean;
}

// localStorage schema（metadata only）
interface HistoryMetadata {
  past: Array<{ id: string; timestamp: number; description?: string }>;
  future: Array<{ id: string; timestamp: number; description?: string }>;
}
// Key: `vibex-dds-history-{canvasId}`
```

### S35-P002: Performance Baseline（无新增）

```typescript
// performance-baseline.md
| Metric | Value |
|--------|-------|
| main-bundle | <N> KB |
| first-contentful-paint | <X> ms |
| largest-contentful-paint | <Y> ms |
| total-blocking-time | <Z> ms |
| cumulative-layout-shift | <W> |
```

### S35-P003 调研数据模型（文档定义）

```typescript
interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  intention?: 'edit' | 'select' | 'drag' | 'idle';
  cursor?: { x: number; y: number; nodeId: string | null; timestamp: number };
  lastSeen: number;
}
```

### S35-P004 调研数据模型（文档定义）

```typescript
interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  category: string;
  tags: string[];
  downloads: number;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Testing Strategy

### S35-P001 测试策略

| 类型 | 范围 | 覆盖率目标 |
|------|------|-----------|
| 单元测试 | `canvasHistoryStore.ts` | > 90%（S34 已完成 15 cases）|
| 单元测试 | `DDSCanvasPage.tsx` undo/redo 连接 | 2 cases |
| 集成测试 | Middleware 初始化 + Ctrl+Z 快捷键 | 2 cases |
| E2E | `sprint34-p001.spec.ts` 刷新后历史保留 | 1 case |
| 回归 | 53 个 Canvas 单元测试全通过 | 100% |

### S35-P002 测试策略

| 类型 | 范围 | 验收标准 |
|------|------|----------|
| CI 验证 | main 分支 build + baseline 写入 | CI exit 0 |
| CI 验证 | PR bundle size 对比 +5% 阈值 | CI exit 1 |
| CI 验证 | Lighthouse CI 3 runs 中位数 | > 1 runs success |

### S35-P003 / S35-P004 测试策略

调研阶段无代码产出，无测试需求。调研文档验收通过人工评审。

---

## 10. Performance Impact Summary

| 功能 | Bundle 影响 | 运行时影响 | 风险 |
|------|-----------|-----------|------|
| S35-P001 补充 localStorage 调用 | 0 KB（新代码 < 20 行）| 低（debounced 500ms）| 低 |
| S35-P002 baseline CI | +0 KB | +2-3 min CI time | 低 |
| S35-P003 调研 | N/A（无代码）| N/A | 中（调研可能发现架构大改需求）|
| S35-P004 调研 | N/A（无代码）| N/A | 低 |

---

## 11. 依赖关系

```
S35-P001 (P0, 0.5d)
└─ 依赖: S34 canvasHistoryStore + Middleware 已完成
   └─ 页面集成: DDSCanvasPage.tsx (第 210-215, 385-400 行)
   └─ 约束: 不修改现有 action 签名；localStorage 仅存 metadata

S35-P002 (P1, 0.5d)
└─ 依赖: S34 bundle-report.yml + lighthouserc.js 已建立
   └─ 页面集成: 无（纯 CI）
   └─ 约束: Lighthouse warn 级别，3 runs 中位数

S35-P003 (P1, 1.5d)
└─ 依赖: S33 IntentionBubble / ConflictBubble 已完成
   └─ 页面集成: DDSCanvasPage.tsx 协作视图
   └─ 输出: collaboration-research.md

S35-P004 (P2, 0.5d)
└─ 依赖: 当前模板系统 CRUD 已完成
   └─ 页面集成: pages/template/index.tsx
   └─ 输出: template-market-research.md

无依赖链：S35-P001 / S35-P002 / S35-P003 / S35-P004 可并行
```

---

## 12. 文件变更清单

| 文件 | 操作 | 归属 |
|------|------|------|
| `vibex-fronted/src/components/dds/DDSCanvasPage.tsx` | 补充 saveHistoryToStorage 调用 | S35-P001 |
| `docs/vibex-proposals-sprint35/architecture.md` | 新建 | S35 architect |
| `docs/vibex-proposals-sprint35/IMPLEMENTATION_PLAN.md` | 新建 | S35 architect |
| `docs/vibex-proposals-sprint35/AGENTS.md` | 新建 | S35 architect |
| `docs/vibex-proposals-sprint35/collaboration-research.md` | 新建 | S35-P003 调研 |
| `docs/vibex-proposals-sprint35/template-market-research.md` | 新建 | S35-P004 调研 |
| `docs/vibex-proposals-sprint35/performance-baseline.md` | 更新（实测数值）| S35-P002 |
| `.github/workflows/bundle-report.yml` | 修改（main baseline + PR 对比）| S35-P002 |

---

*本文档由 Architect Agent 生成，作为 S35 architect-review 阶段产出。*
*所有技术决策均延续 S34 架构，无破坏性变更。*