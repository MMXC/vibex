# VibeX Sprint 35 — 多人协作能力增强调研

**Agent**: ARCHITECT | **日期**: 2026-05-11 | **项目**: vibex-proposals-sprint35
**类型**: 调研文档（不实施）
**归属**: S35-P003

---

## 1. 背景

Sprint 33 已实现：
- `IntentionBubble`：协作者意图气泡（edit/select/drag/idle），500ms 延迟显示
- `ConflictBubble`：冲突可视化，冲突节点红框脉冲
- `usePresence` hook：Firebase RTDB + Zustand mock fallback
- `updateCursor(intention)`：支持 intention 参数

Sprint 34 无协作增强。Sprint 35 需要调研下一阶段方向：实时多人光标、Presence 增强、冲突仲裁 UX 改进。

---

## 2. 竞品对比分析

| 功能 | Figma | Miro | Notion | VibeX 当前 |
|------|-------|------|--------|-----------|
| 多人实时光标 | ✅ <50ms | ✅ 50-100ms | ✅ 200-500ms | ❌ 暂无 |
| Presence 列表 | ✅ 头像+状态 | ✅ 头像 | ❌ | ✅ 意图气泡（单端）|
| 冲突检测 | ✅ OT 算法 | ✅ OT | ❌ | ✅ ConflictBubble（可视化）|
| 冲突解决 | ✅ 实时合并 | ✅ 实时合并 | ❌ | ✅ ConflictDialog（手动）|
| 离线支持 | ✅ | ✅ | ❌ | 部分（离线队列）|
| 视频/语音 | ✅ 嵌入 | ✅ 嵌入 | ❌ | ❌ |

**关键发现**：
- Figma / Miro 使用 Operational Transform (OT) 实现实时协同，延迟 < 100ms
- Notion 的协作延迟高（200-500ms），因为使用粗粒度锁定而非 OT
- VibeX 当前处于 Notion 阶段（冲突可视化 + 手动仲裁），差距在于实时光标和 OT

---

## 3. 技术风险识别

### 3.1 Firebase RTDB 扩展性

**限制分析**：

| 指标 | 免费层 | Flame 层 ($25/mo) | Blaze (按量) |
|------|--------|------------------|------------|
| 并发连接数 | 100 | 100k | 无上限 |
| 同时写入数 | 100/s | 100k/s | 无上限 |
| 存储 | 1 GB | 2.5 GB | $5/GB |
| 网络传输 | 10 GB/月 | 50 GB/月 | $1/GB |

**20 并发用户场景估算**：
- 每用户 presence 心跳：每 5s 更新一次 → 4 writes/s per user
- 20 用户总计：~80 writes/s，远低于免费层 100/s 限制
- cursor 移动更新（假设每用户 1 move/s）：额外 20 writes/s
- 总计 ~100 writes/s → 刚好达到免费层上限

**结论**：免费层 Firebase RTDB 支持 ~20 并发用户。超过 20 用户需要升级到 Blaze 或迁移到自建方案。

### 3.2 WebSocket vs WebRTC

| 维度 | WebSocket | WebRTC |
|------|-----------|--------|
| 架构 | 服务器中转 | P2P 直连（需要 STUN/TURN）|
| 延迟 | 50-100ms | < 20ms |
| 服务器成本 | O(n) — 每用户占用一个连接 | O(1) — 无服务器转发 |
| NAT 穿透 | 自动 | 需要 STUN/TURN 服务器 |
| 适用规模 | 10-50 用户 | 2-20 用户 |
| 实现复杂度 | 低（已有库）| 高（ICE协商/ICE候选交换）|

**推荐**：VibeX Canvas 场景，用户数 5-20 人，WebSocket 更合适（实现简单，延迟可接受）。

### 3.3 Operational Transform vs CRDT

| 维度 | OT (Operational Transform) | CRDT |
|------|---------------------------|------|
| 冲突解决 | 基于操作转换，需中心协调 | 无需协调，任意合并 |
| 实现复杂度 | 高（需要完整 OT 算法库）| 中（已有 yjs/automerge）|
| 离线支持 | 差（需要重连重放）| 强（本地操作自动合并）|
| 适用场景 | 文本编辑（Figma/Miro）| 任意数据（JSON树）|
| 库选择 | ShareDB, quill | Yjs, Automerge |

**VibeX Canvas 结论**：Canvas 卡片数据是 JSON 结构，适合 CRDT（Yjs）。OT 更适合 Figma 的实时文本协同。

---

## 4. 可选方案

### 方案 A：Firebase RTDB + Presence 增强

**描述**：在 S33 现有 Firebase RTDB 架构基础上，扩展实时光标和 Presence 功能。

**Pros**：
- ✅ 延续 S33 技术路线，无需新增基础设施
- ✅ Firebase 免费层支持 20 并发用户（符合 MVP 目标）
- ✅ REST API，无 SDK 依赖，bundle 影响小（已在 `presence.ts` 实现）
- ✅ 降级方案完善：Firebase 未配置时使用 Zustand mock
- ✅ 开发成本低：预计 5-7 人天

**Cons**：
- ❌ 免费层 100 并发上限，20+ 用户需要升级
- ❌ Firebase RTDB 不支持 CRDT，冲突解决依赖 Last-Write-Wins
- ❌ 延迟 50-100ms，不适合对延迟敏感的场景

**依赖项**：
- `src/lib/firebase/presence.ts`（已存在）
- `src/components/presence/IntentionBubble.tsx`（已存在）
- `src/components/collaboration/ConflictBubble.tsx`（已存在）
- Firebase 项目配置（环境变量注入）

**工时估算**：5-7 人天
- 实时光标组件开发：2 人天
- Presence 列表 UI：1 人天
- 后端 API 适配：1 人天
- 集成测试：1 人天
- 文档和回归：1 人天

---

### 方案 B：自建 WebSocket + Yjs CRDT

**描述**：放弃 Firebase，使用自建 WebSocket 服务器 + Yjs CRDT 库，实现无上限并发和精确冲突解决。

**Pros**：
- ✅ 并发用户无上限（仅受服务器带宽限制）
- ✅ CRDT 支持离线操作合并，适合复杂场景
- ✅ 延迟低（< 20ms P2P）
- ✅ 不依赖第三方服务，数据完全自控

**Cons**：
- ❌ 需要 WebSocket 服务器（Node.js + ws 库）→ 运维成本
- ❌ 需要 STUN/TURN 服务器（NAT 穿透）→ 额外基础设施
- ❌ Yjs 学习曲线陡峭，集成到现有 Zustand store 需要适配层
- ❌ 开发成本高：预计 10-15 人天
- ❌ 离线队列需要重新设计（当前是 IndexedDB + 重放，CRDT 不需要）

**依赖项**：
- WebSocket 服务器（`services/ws-server/`）
- Yjs 库（`yjs` + `y-websocket`）
- STUN/TURN 服务器（`coturn` 或第三方如 Twilio）
- Zustand ↔ Yjs 适配层（需要新建）

**工时估算**：10-15 人天
- WebSocket 服务器：3 人天
- Yjs 集成层：4 人天
- 前端光标/Presence UI：2 人天
- STUN/TURN 配置：2 人天
- 测试和文档：3 人天

---

### 方案 C：混合方案（Firebase + CRDT）[备选]

**描述**：Firebase RTDB 用于 Presence（用户列表/光标），Yjs 用于 Canvas 数据协同。

**Pros**：
- ✅ Presence 用 Firebase（简单），Canvas 数据用 CRDT（精确）
- ✅ 可渐进迁移

**Cons**：
- ❌ 两套系统增加复杂度
- ❌ 需要维护两套同步逻辑

**工时估算**：8-10 人天

---

## 5. 推荐方案

### 推荐：方案 A（Firebase RTDB + Presence 增强）

**理由**：
1. **风险最低**：延续 S33 架构，不引入新基础设施，5-7 人天可交付
2. **符合当前规模**：VibeX MVP 阶段用户数 < 20，Firebase 免费层足够
3. **快速验证**：可以在 Sprint 36 用 1 周时间交付实时光标，验证用户需求
4. **可扩展**：当用户数超过 20 时，可以切换到方案 B 或升级 Firebase

**决策点**：Sprint 36 开始时，需要 Product 确认目标用户规模。如果 > 20，考虑直接选方案 B。

**实施建议**：
1. 先实现实时光标（只读 Presence），验证用户是否在意实时协作
2. 再实现双向同步（冲突仲裁），验证 CRDT 需求
3. 避免过度工程：MVP 阶段只需要光标，不需要 CRDT

---

## 6. 调研结论

| 结论项 | 内容 |
|--------|------|
| 竞品差距 | VibeX 当前处于 Notion 阶段（手动仲裁），Figma/Miro 已到 OT 实时协同 |
| 推荐方案 | 方案 A：Firebase RTDB + Presence 增强，5-7 人天 |
| 升级路径 | 用户 > 20 时迁移方案 B（WebSocket + Yjs）|
| Sprint 36 建议 | 先实现实时光标（只读 Presence），验证后再做双向同步 |
| 安全考量 | Firebase RTDB 使用 REST API，API Key 暴露风险通过环境变量缓解 |

---

## 7. 后续行动

- [ ] Sprint 36 决策：确认目标用户规模
- [ ] 如果采用方案 A：创建 Firebase 项目，配置环境变量
- [ ] 如果采用方案 B：调研 y-websocket + coturn 部署方案
- [ ] 调研文档签字归档，供 Sprint 36 参考

---

*本文档由 Architect Agent 生成。*
*仅供决策参考，不实施代码。*