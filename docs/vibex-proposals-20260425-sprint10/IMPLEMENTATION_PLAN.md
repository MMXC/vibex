# Implementation Plan — VibeX Sprint 10

## 执行摘要

| Epic | 名称 | 工期 | 执行顺序 |
|------|------|------|----------|
| E0 | Sprint 9 债务清理 | 2-4h | Day 1 优先 |
| E3 | Firebase 实时协作 | 8-12h | Day 1 并行 |
| E6 | Canvas 本地持久化 | 6-10h | Day 1 并行 |
| E4 | PRD 双格式预览 | 4-6h | Day 2-3 |

**总工期**: 20-32h（并行安排约 2 人可 2 天完成）

---

## E0 — Sprint 9 债务清理（2-4h）

### 步骤

1. 运行 `make validate`，记录所有错误
2. 对照 Sprint 9 `coord-completed-report.md` 逐项核对完成状态
3. 修复 regression 错误（优先级：阻塞 CI 的先修）
4. 确认 E3 前置条件（Sprint 8 P002 验证结果）存在

### 验收检查单

- [ ] `make validate` 退出码 0
- [ ] `pnpm build` 退出码 0
- [ ] Sprint 9 E3/E6 未完成项已记录在 Sprint 10 backlog
- [ ] E3 前置条件已确认（Firebase 或 PartyKit 方案已定）

---

## E3 — Firebase 实时协作（8-12h）

### 步骤 1: Presence 后端 API（4h）

**文件**: `vibex-backend/src/routes/v1/presence.ts`（新建）

实现：
- `GET /api/v1/presence/users` — 返回在线用户列表
- `POST /api/v1/presence/heartbeat` — 用户心跳（TTL 15s）
- `DELETE /api/v1/presence/users/:userId` — 离线移除

```typescript
// 核心逻辑：TTL 过期自动清理（无持久化，内存/Redis）
// 在线用户: Map<userId, { userName, avatar, lastSeen }>
```

### 步骤 2: Firebase 冷启动验证（2h）

执行 Sprint 8 P002 验证：
```bash
curl -w "@timing_format.txt" https://api.vibex.top/api/v1/presence/users
# 验证 TTFB < 500ms
```

- **通过**: 继续 Firebase 方案
- **失败**: 切换 PartyKit（见 2b 步骤）

### 步骤 2b: PartyKit 备选方案（4h，若 Firebase 失败）

**文件**: `partykit.json`（新建） + `vibex-backend/src/routes/v1/presence-partykit.ts`

### 步骤 3: Dashboard Presence 消费层（4h）

**文件**: `vibex-fronted/src/hooks/usePresence.ts`（新建）

```typescript
// usePresence Hook
// - 组件挂载时调用 heartbeat
// - 每 10s 续一次 heartbeat
// - 组件卸载时调用 DELETE
// - 提供 users[] 状态给 UI
```

**UI 组件**: `vibex-fronted/src/app/dashboard/components/PresenceList.tsx`

### 步骤 4: E2E 测试（2h）

Playwright 测试：presence.spec.ts（见 architecture.md §5.1）

### E3 验收检查单

- [ ] GET /api/v1/presence/users 返回 `{ users: [] }` 或带数据
- [ ] Dashboard 展示在线用户列表
- [ ] Firebase TTFB < 500ms（或已切换 PartyKit）
- [ ] Playwright E2E 测试通过
- [ ] `make validate` 退出码 0

---

## E6 — Canvas 本地持久化（6-10h）

### 步骤 1: Zustand persist 配置（2h）

**文件**: `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`

修改 persist middleware 配置：

```typescript
// 添加 skipHydration: true
export const useDDSCanvasStore = create<DDSCanvasStoreState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'vibex-canvas-state',
      skipHydration: true,   // ← 关键修改
      partialize: (state) => ({
        projectId: state.projectId,
        activeChapter: state.activeChapter,
        chapters: state.chapters,
        crossChapterEdges: state.crossChapterEdges,
      }),
    }
  )
);
```

### 步骤 2: ReactFlow 防抖同步（3h）

**文件**: `vibex-fronted/src/hooks/useCanvasPersistence.ts`（新建）

```typescript
// 关键实现：
// 1. useEffect(() => { hydrate from localStorage }, [])
// 2. ReactFlow onNodesChange / onEdgesChange → debounce → localStorage.setItem
// 3. 返回 { isHydrated, hydrationError }
```

### 步骤 3: Hydration 时序修复（2h）

**文件**: `vibex-fronted/src/app/design/page.tsx`（可能需要修改）

```typescript
// 确保客户端 hydrate 完成后才渲染 ReactFlow
// ReactFlow wrapper 添加 props: requireInit={!isHydrated}
```

### 步骤 4: 视口持久化（1h）

在 `useCanvasPersistence` 中同步 ReactFlow viewport：

```typescript
const onMoveEnd = useCallback(
  debounce((e: NodeChange[]) => {
    const viewport = rfInstance?.getViewport();
    if (viewport) setStorageItem('viewport', viewport);
  }, 500),
  [rfInstance]
);
```

### 步骤 5: E2E 测试（2h）

Playwright 测试：canvas-persistence.spec.ts（见 architecture.md §5.2）

### E6 验收检查单

- [ ] `DDSCanvasStore` 配置 `skipHydration: true`
- [ ] 刷新后节点完整恢复
- [ ] 刷新后连线完整恢复
- [ ] 刷新后视口位置/缩放比例恢复
- [ ] 刷新后无 React hydration 警告
- [ ] Playwright E2E 测试通过
- [ ] `make validate` 退出码 0

---

## E4 — PRD 双格式预览（4-6h）

### 步骤 1: 格式转换库（2h）

**文件**: `vibex-fronted/src/lib/prd-format.ts`（新建）

```typescript
import yaml from 'js-yaml';

export function yamlToJson(yamlStr: string) {
  try {
    const data = yaml.load(yamlStr);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: parseYamlError(e) };
  }
}

export function jsonToYaml(jsonStr: string) {
  try {
    const data = JSON.parse(jsonStr);
    const yamlStr = yaml.dump(data, { indent: 2 });
    return { ok: true, data: yamlStr };
  } catch (e) {
    return { ok: false, error: parseJsonError(e) };
  }
}
```

### 步骤 2: PRD Editor 格式切换 UI（2h）

**文件**: `vibex-fronted/src/app/editor/page.tsx`（修改）

```typescript
// 添加格式切换按钮（JSON | YAML）
// 切换时调用 prd-format.ts 的转换函数
// 转换成功：更新编辑器内容（React state，无页面刷新）
// 转换失败：显示友好错误提示（不是 raw stack trace）
```

### 步骤 3: E2E 测试（1h）

Playwright 测试：prd-format.spec.ts（见 architecture.md §5.3）

### E4 验收检查单

- [ ] JSON → YAML → JSON 双向转换无数据丢失
- [ ] 格式切换无页面刷新（单页内完成）
- [ ] 格式错误显示友好提示
- [ ] Playwright E2E 测试通过
- [ ] `make validate` 退出码 0

---

## 部署策略

所有修改均为增量代码变更，无基础设施变更。部署方式与现有流程一致。

| Epic | 部署范围 |
|------|----------|
| E3 | Backend (Cloudflare Workers) + Frontend (dashboard) |
| E6 | Frontend only (Zustand store) |
| E4 | Frontend only (PRD editor) |

---

## 紧急回滚

```bash
# 按 Epic 回滚
git checkout HEAD~1 -- vibex-backend/src/routes/v1/presence.ts  # E3
git checkout HEAD~1 -- vibex-fronted/src/stores/dds/DDSCanvasStore.ts  # E6
git checkout HEAD~1 -- vibex-fronted/src/app/editor/page.tsx  # E4
```

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260425-sprint10
- **执行日期**: 2026-04-25
