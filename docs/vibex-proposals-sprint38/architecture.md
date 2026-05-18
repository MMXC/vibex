**Agent**: hermes (coord self-implement)
**日期**: 2026-05-18
**项目**: vibex-proposals-sprint38
**触发**: architect-review ghost — 26h+ in-progress, no architecture.md output; coord self-implemented

---

## 1. 架构设计原则

1. **渐进增强**: 不破坏现有架构，新增能力以装饰器/hook 模式叠加
2. **Store 原子化**: 每个 feature 独立 store field，不跨 feature 共享状态
3. **可测试性**: 所有新逻辑通过 `pnpm test` 验证，E2E 覆盖 approve/reject/diff 路径
4. **性能隔离**: P005 虚拟化通过 feature flag 控制，默认关闭
5. **i18n 非侵入**: 使用 React context 而非 props drilling，不改变现有组件签名

---

## 2. 技术决策记录（TDR）

### TDR-001: i18n 框架选型
- **选项**: next-intl vs react-i18next
- **决策**: `next-intl`
- **理由**: 与 Next.js App Router 原生集成，支持 App Router 中间件自动语言检测，`Accept-Language` header 劫持成本最低；`react-i18next` 需要额外 `I18nextProvider` wrapper
- **约束**: `next-intl` 版本 ≥ 3.x，App Router 专用

### TDR-002: 虚拟化库选型
- **选项**: react-window vs @tanstack/react-virtual
- **决策**: `@tanstack/react-virtual`
- **理由**: 支持动态高度（非固定行高），API 更接近 Zustand store 模式，tree-shakable 优于 react-window

### TDR-003: Diff 展示方案
- **选项**: 第三方 diff 库（diff-match-patch, jsdiff）vs 手写
- **决策**: `diff` npm 包（jsdiff）
- **理由**: 行级 diff 算法成熟，覆盖率高，输出格式与 GitHub diff 一致；无需引入重型库

### TDR-004: 冲突检测策略
- **选项**: OT (Operational Transform) vs 简单时间戳 vs 乐观锁
- **决策**: 乐观锁 + oplog
- **理由**: WebSocket 协作层不在 Sprint 38 范围内；oplog append-only + 5s 窗口警告在当前阶段性价比最高；冲突保留在 confirmationStore（已有基础设施）

---

## 3. 全局 Store 变更

### 3.1 userPreferencesStore（已有，S37-E011）
```typescript
// 新增字段（向后兼容）
interface UserPreferences {
  theme: 'light' | 'dark';
  locale: 'en' | 'zh';           // 新增
  aiScores: AIScore[];          // 新增，P003
}
```

### 3.2 businessFlowStore（修改）
```typescript
// 新增字段
interface businessFlowStore {
  // ... 现有字段 ...
  oplog: OperationEntry[];       // 新增，P002
}

// OperationEntry shape
interface OperationEntry {
  id: string;                    // uuid
  userId: string;               // 'ai' | 'user'
  nodeId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;            // Date.now()
  payload?: unknown;
}
```

### 3.3 canvasStore（修改）
```typescript
// 新增字段
interface canvasStore {
  // ... 现有字段 ...
  viewportBounds: {             // 新增，P005
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### 3.4 confirmationStore（已有，S37）
```typescript
// 新增字段（P002）
interface confirmationStore {
  // ... 现有字段 ...
  conflictSnapshots: Record<string, SnapshotEntry[]>;  // 新增
}
```

### 3.5 useAIAgent hook（修改，S6 已有）
```typescript
// 新增返回字段
interface useAIAgentReturn {
  // ... 现有字段 ...
  lastResult: DiffResult | null;   // 新增，P003
  lastError: string | null;        // 新增，P003
}
```

---

## 4. 新增文件清单

### i18n 层（P001）
| 路径 | 说明 |
|------|------|
| `src/i18n/index.ts` | next-intl init，I18nProvider |
| `src/i18n/messages/en.json` | 英文语言包 |
| `src/i18n/messages/zh.json` | 中文语言包 |
| `src/hooks/useTranslations.ts` | 兼容层 hook（包装 next-intl） |

### 协作感知层（P002）
| 路径 | 说明 |
|------|------|
| `src/components/AIEditingIndicator/AIEditingIndicator.tsx` | AI 操作指示器 |
| `src/components/OperationOverlay/OperationOverlay.tsx` | Ctrl+H oplog overlay |

### AI 反馈回路（P003）
| 路径 | 说明 |
|------|------|
| `src/components/DiffOverlay/DiffOverlay.tsx` | Diff 展示 + Approve/Reject |
| `src/components/AIScoreCard/AIScoreCard.tsx` | 评分卡（可读性/复杂度/覆盖率） |

### 性能/虚拟化层（P005）
| 路径 | 说明 |
|------|------|
| `src/components/MiniMap/MiniMap.tsx` | 缩略图导航 |
| `src/hooks/useVirtualization.ts` | viewport culling hook |
| `src/hooks/useViewportBounds.ts` | 视口边界 hook |

---

## 5. 依赖关系图

```
P001 i18n (E1→E2→E3)
  └─ 依赖 S37 userPreferencesStore ✅

P002 协作感知 (E1→E2→E3)
  ├─ E1: businessFlowStore oplog ← P001 E1 (locale store) 无依赖
  ├─ E2: 冲突检测 ← P002 E1 完成后
  └─ E3: Ctrl+H overlay ← P002 E2 完成后

P003 AI 反馈回路 (E1→E2→E3)
  ├─ E1: useAIAgent lastResult ← S6 useAIAgent hook ✅
  ├─ E2: Approve/Reject ← P003 E1 完成后
  └─ E3: 评分卡 ← P003 E2 完成后

P004 E2E 治理 (E1→E2→E3)
  └─ 无跨 feature 依赖，独立实施

P005 虚拟化 (E1→E2→E3)
  ├─ E1: viewportBounds store ← S1 canvasStore ✅
  ├─ E2: ProtoFlowCanvas 集成 ← P005 E1 完成后
  └─ E3: MiniMap ← P005 E2 完成后
```

---

## 6. API/接口设计

### useAIAgent hook 扩展（P003）
```typescript
interface DiffResult {
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

interface AIScore {
  timestamp: number;
  readability: number;   // 1-5
  complexity: number;    // 1-5
  coverage: number;      // 1-5
  featureId: string;
}
```

### oplog API（内部）
```typescript
// businessFlowStore.actions
addOplogEntry(entry: Omit<OperationEntry, 'id' | 'timestamp'>): void;
getOplog(nodeId?: string): OperationEntry[];
```

---

## 7. 性能预算

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| P001 i18n 首屏增量 | ≤ 10KB | pnpm build bundle analyzer |
| P005 500节点帧率 | ≥ 50fps | performance.now() |
| P002 oplog 内存上限 | ≤ 1000条 | store 内存监控 |
| P003 DiffOverlay DOM | ≤ 500行 | DevTools Elements panel |

---

## 8. 测试策略

| Feature | 单元测试 | E2E |
|---------|---------|-----|
| P001 i18n | 语言包 key 完整性 | 设置页语言切换 |
| P002 协作 | oplog append | conflict warning |
| P003 AI | lastResult 状态 | DiffOverlay approve/reject |
| P004 E2E | — | 所有 spec 无 waitForTimeout |
| P005 虚拟化 | 500节点渲染 | 缩放帧率日志 |

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| P001 i18n 遗漏硬编码 | 中 | P0 | CI lint 规则强制检查 + grep 全量扫描 |
| P005 虚拟化与拖拽冲突 | 中 | P1 | feature flag 默认关闭，DevTools 帧率验证后开启 |
| P003 DiffOverlay 与 S6 hook 不兼容 | 低 | P1 | 先读 S6 architecture.md 确认接口 |
| P002 oplog 性能开销 | 低 | P2 | append-only 限制 1000 条，超出归档 |
