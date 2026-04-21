# AGENTS.md — vibex-next

**项目**: vibex-next
**日期**: 2026-04-19
**角色**: Architect
**受众**: Dev Agent、Review Agent、QA Agent

---

## 开发约束

### E1 — Firebase 实时协作

- **优先使用 Firebase Realtime Database**，不引入额外 WebSocket 服务端依赖
- `usePresence` hook：加入房间 → 更新光标 → 监听其他用户 → 断线清除（`onDisconnect().remove()`）
- `PresenceLayer` 组件：用户头像圆形徽标，位置跟随光标，颜色按 `userId` 哈希分配（同一用户颜色稳定）
- 节点同步消息类型 `node:create/update/delete`：通过 `MessageRouter` 路由，携带 `version` 乐观锁
- 冲突处理：**Last-Write-Wins (LWW)**，不实现 OT/CRDT
- ConflictBubble 组件：绝对定位气泡，淡入 < 200ms，同一冲突 5 分钟内不重复显示
- 重连策略：指数退避 1s→2s→4s→8s→16s，保留本地状态不清空
- **降级模式**：Firebase timeout 5s 内不可达 → 单用户模式（界面显示 toast，不阻断操作）
- Firebase 环境变量：`NEXT_PUBLIC_FIREBASE_*` 前缀，禁止明文写入代码

### E2 — 性能可观测性

- `useWebVitals` hook：采集 LCP / CLS，阈值告警 LCP > 4s / CLS > 0.1，超阈值输出 `console.warn`
- `/api/v1/health` 端点：**无 DB 查询**，纯内存计算 P50/P95/P99，响应时间 < 50ms
- `middleware/metrics.ts`：5 分钟滚动窗口，超出 TTL 的记录自动清除
- 告警阈值常量（`ALERT_THRESHOLDS`）：LCP 4000ms / CLS 0.1 / FCP 3000ms / FID 300ms / TTFB 800ms
- **不发送 Slack webhook**（E2-S2 范围外，架构不预设集成）

### E3 — 自建轻量 Analytics

- `POST /api/v1/analytics`：支持单条和批量，Zod schema 校验
- **静默失败**：端点异常不阻断用户操作（analytics 不可用时前端不报错）
- `expires_at` = `created_at + 7 days`，异步清理（每次写入时触发）
- 事件类型：`page_view` / `canvas_open` / `component_create` / `delivery_export`
- analytics client SDK（`src/lib/analytics/client.ts`）：`analytics.track(event, properties)` 接口
- analytics 数据：**不关联用户 PII**，sessionId 可选

### 测试要求

- **Vitest + Playwright**（前端），**Vitest**（后端）
- 节点同步：Playwright 双 tab 测试，Tab A 创建节点后 Tab B < 3s 看到
- /health 端点：`expect(res.status).toBe(200)` + `expect(body.latency).toHaveKeys(['p50','p95','p99'])`
- analytics 端点：批量上报 100 条返回 `received: 100`
- `pnpm build` 通过，`tsc --noEmit` 0 错误

### 技术债

- `snapshot.ts`（frontend）：已删除
- ESLint 豁免：`catalog.ts` / `registry.tsx` / `useDDDStateRestore.ts` 的 `as any`，已添加 `// MEMO:` 注释
- backend `vibex-backend/src/routes/v1/canvas/snapshot.ts`：**不要删除**，仍在使用

### 不在本期处理

- Firebase Auth 集成（仅 Realtime Database，无身份验证层）
- CRDT 冲突解决（E1 使用 LWW，Epic 4 可升级 Yjs）
- Analytics 仪表盘 UI（数据采集就绪，展示待后续 Epic）
- Slack webhook 告警
- WebSocket Server-Sent Events（SSE）替代方案

---

## 执行决策

- **决策**: 已采纳
- **执行日期**: 2026-04-19
- **代码推送**: origin/main (commits 53274d97, 862fb85a, 1277e652, 1d3870bb, 04dff5f3, 1ac78dcd, ff0cd56b, 7eb32abe, 26790fdb, 2675a813, 0e1b409b, e75641c4)
- **验收确认**:
  - `pnpm build` ✅
  - `tsc --noEmit` ✅
  - CHANGELOG.md ✅
