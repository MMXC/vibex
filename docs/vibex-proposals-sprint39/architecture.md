# VibeX Sprint 39 — Architecture Design

**Agent**: hermes (coord heartbeat self-implement)
**日期**: 2026-05-28
**触发**: architect-review CLI-dispatch ghost — architect agent was never notified (updatedBy=cli, Slack socket instability), ~3.5h elapsed with no output

---

## 架构决策总览

| ID | 问题域 | 决策 | 状态 |
|----|--------|------|------|
| ARCH-001 | P002 WebSocket 传输层 | 方案 A：独立 WebSocket 服务（与 VibeX 后端并行），JWT 认证复用 | **待决策** |
| ARCH-002 | P004 MiniMap 搜索状态 | `useMiniMapSearch` hook 管理搜索词/高亮节点，状态提升到 DDSCanvasPage | **确定** |
| ARCH-003 | P005 SW 兼容 | 复用现有 `sw.js`（E05 产物），layout.tsx 客户端注册 | **确定** |
| ARCH-004 | P001 i18n AI 页面 | `src/app/ai/` 不存在，DDSToolbar AI 按钮 i18n 迁移 + 新建 AI 页面 | **确定** |

---

## ARCH-001: P002 WebSocket 协作传输层

**问题**: Cloudflare Workers 环境无 WebSocket 原生支持（纯 Worker）。

### 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A: 独立 WebSocket 服务器** (Fly.io/Railway) | 完整 WebSocket 支持，与 Cloudflare 部署解耦 | 额外基础设施成本，需要单独的 auth 同步 |
| **B: Cloudflare Durable Objects** | 与现有 Cloudflare 栈集成，按需计费 | 冷启动延迟，需要重构 API 到 DO 模式 |
| **C: Polling + SSE fallback** | 无额外基础设施，最简单 | 延迟高，无真正实时性 |

### 推荐方案：A

**理由**：
- VibeX 后端已部署于 Cloudflare Workers，引入独立 WS 服务不影响现有架构
- JWT token 复用，只需 WS 服务共享相同的 JWT secret
- 用户量初期有限，独立 WS 服务成本可控（~$5/月 Fly.io）
- WebSocket 未来可迁移到 Cloudflare Durable Objects，无需改客户端代码

**架构图**：
```
[浏览器] ←→ [WebSocket Server (Fly.io/Railway)] ←→ [VibeX Workers D1 DB]
  ↑                      ↑
  │ JWT                 │ 相同 JWT secret
  ↓                     
[VibeX Workers REST API]
```

**API 契约**：
```
WS URL: wss://ws.vibex.top?token=<jwt>
Client → Server: { type: "auth", token: "<jwt>" }
Client → Server: { type: "action", payload: { nodeId, action, data, timestamp } }
Server → Client: { type: "remote_action", payload: { userId, nodeId, action, data } }
Server → Client: { type: "presence", users: [{ userId, name, avatar, cursor? }] }
Server → Client: { type: "conflict", nodeId, conflictingUserId }
```

---

## ARCH-002: P004 MiniMap 搜索状态管理

**现有状态**：`@xyflow/react ^12.10.1` 已导出 `MiniMap`（`MiniMap`, `MiniMapNode`）。`DDSCanvas/DDSFlow.tsx` 当前**未**集成 MiniMap（PRD 中的描述不准确）。

**目标**：在 `DDSCanvas/DDSFlow.tsx` 中集成 MiniMap，同时实现搜索 + 高亮导航。

```
DDSCanvasPage (搜索输入框)
    ↓ useMiniMapSearch hook
    ↓
DDSFlow → <MiniMap
    nodeColor={isHighlighted ? '#3b82f6' : '#2d3748'}
    onClick={handleMiniMapClick}
    ...
```

**`useMiniMapSearch` hook**：
```typescript
// src/hooks/useMiniMapSearch.ts
export function useMiniMapSearch(nodes: Node[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const highlightedNodes = useMemo(
    () => nodes.filter(n => n.data?.label?.toLowerCase().includes(searchTerm.toLowerCase())),
    [nodes, searchTerm]
  );
  return { searchTerm, setSearchTerm, highlightedNodes };
}
```

**视口边框**：`@xyflow/react` 导出 `ViewportPortal`，用于在 MiniMap 覆盖层绘制当前视口矩形。

---

## ARCH-003: P005 Service Worker 集成

**现有状态**：`vibex-fronted/public/sw.js` 已存在（E05 产物），实现了：
- `CacheFirst` 静态资源缓存
- `NetworkFirst` API 缓存
- IndexedDB 离线写入队列

**待完成**：
1. **layout.tsx 注册**：客户端组件调用 `navigator.serviceWorker.register('/sw.js')`
2. **语言包缓存**：将 `/i18n/messages/zh.json` 和 `en.json` 加入 precache
3. **API 降级**：wrap `fetch('/api/...')` 失败时返回 `Cache.match()` 或 `{ offline: true }`

**现有 manifest.json 评估**：已包含 `name`, `short_name`, `icons: [192, 512]`, `start_url`, `display: standalone` — **E3 manifest 目标已达成**，无需额外工作。

---

## ARCH-004: P001 i18n AI 页面

**现有状态**：
- `src/i18n/messages/en.json` 和 `zh.json` 存在，`toolbar.*` namespace 已有基础翻译
- `src/app/` 下**无** `ai/` 目录
- DDSToolbar 已有部分 AI 按钮的 i18n key（`toolbar.aiGenerate` 等）

**目标**：
1. 新建 `src/app/ai/page.tsx`（或 `src/app/ai/[[...slug]]/page.tsx`）
2. 为 AI 页面补充 `ai.*` i18n namespace
3. App Router Server Component → 验证 locale 参数兼容

**i18n namespace 结构**（待补充）：
```json
// en.json
{
  "ai": {
    "title": "AI Coding Assistant",
    "generate": "Generate",
    "generating": "Generating...",
    "stop": "Stop",
    "pause": "Pause",
    "resume": "Resume",
    "export": "Export",
    "retry": "Retry"
  }
}
```

---

## 技术约束（所有 Epic 通用）

1. **禁止内联样式**：`src/app/` 下禁止 `style={{}}` 定义颜色/间距/字体，使用 CSS Modules
2. **Commit 格式**：`feat(S39-P00X-EY): ...`，禁止无 Epic 标识的 commit
3. **CHANGELOG 双更新**：`vibex-fronted/CHANGELOG.md` + `/root/.openclaw/vibex/CHANGELOG.md`
4. **类型检查**：`pnpm exec tsc --noEmit` 必须通过
5. **@xyflow/react 内置组件**：使用 `MiniMap`, `Controls`, `Background`, `Panel`, `ViewportPortal`（已有导出），无需额外 npm 包

---

## 风险评估

| 风险 | 影响 | 缓解 |
|------|------|------|
| WebSocket 服务成本超预期 | 低 | 初期用户量少，成本可控；后续可迁移 Durable Objects |
| Service Worker 与 Next.js App Router 冲突 | 中 | 客户端组件中注册，避免 SSR 上下文 |
| i18n AI 页面不存在导致 E1 工作量变化 | 低 | 新建页面，工作量可控 |
