# Vibex Phase 1 实施计划

**项目**: vibex-next
**阶段**: architect-review
**日期**: 2026-04-08
**总工期**: 19.5h
**Sprint**: 3 sprints

---

## Sprint 总览

| Sprint | 时长 | 故事 | 工时 | 交付物 |
|--------|------|------|------|--------|
| Sprint 1 | 2 天 | E0 (0.5h) + E1-S1 (3.5h) + E3-S1/S2 (1.5h) | 5.5h | Firebase Presence MVP + snapshot.ts 删除 |
| Sprint 2 | 3 天 | E1-S2/S3/S4 (7.5h) + E2-S1 (2h) | 9.5h | 节点同步 + 冲突 UI + /health 端点 |
| Sprint 3 | 2 天 | E2-S2/S3 (2.5h) + E3-S3 (2h) | 4.5h | WebVitals hook + analytics |

---

## Sprint 1 — 协作基础 + 技术债（5.5h）

### E0-S1: MEMORY.md A-010 设计补全（0.5h）

**Owner**: Architect → Dev 实现
**依赖**: 无
**交付物**: MEMORY.md A-010 条目

**状态**: ✅ 完成 (commit 53274d97)
- [x] Architect 签署: 2026-04-08

**实施步骤**:
1. 在 `MEMORY.md` 末尾追加 A-010 条目
2. 包含：指标定义（LCP/CLS/P99）、告警阈值（LCP>4s/CLS>0.1/P99>2s）、数据保留策略（7天滚动）
3. Architect 签署"设计就绪"

```markdown
### A-010: 性能可观测性设计

#### 指标定义
- LCP (Largest Contentful Paint): 页面主要内容加载时间
- CLS (Cumulative Layout Shift): 累积布局偏移
- P99 延迟: API 响应时间 P99

#### 告警阈值
| 指标 | 阈值 | 触发动作 |
|------|------|----------|
| LCP | > 4000ms | console WARNING + Slack webhook |
| CLS | > 0.1 | console WARNING |
| P99 延迟 | > 2000ms | Slack webhook |

#### 数据保留策略
- 监控数据: 7 天滚动清除
- analytics_events: expires_at = created_at + 7 days
- 清理触发: 每次写入时异步清理过期记录

#### 状态
- [x] Architect 签署: 2026-04-08
```

---

### E1-S1: Firebase Presence 接入（3.5h）

**Owner**: Dev
**依赖**: E0-S1 完成
**交付物**: 前端协作 Presence 功能

**状态**: ✅ 完成 (commits 0e1b409b)
- [x] usePresence hook (presence.ts)
- [x] PresenceLayer.tsx 头像层
- [x] Firebase 环境变量注入
- [x] 断线自动清除

**实施步骤**:

#### Step 1: Firebase 项目配置（0.5h）
```bash
# 1. 创建 Firebase 项目（或使用现有）
# 2. 启用 Realtime Database
# 3. 配置规则（测试模式，生产需限制读写）

# 安装依赖
cd vibex-fronted
pnpm add firebase firebase-admin

# 4. 配置环境变量
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://xxx.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

#### Step 2: Presence Hook 实现（1.5h）
**文件**: `src/lib/firebase/presence.ts`（新建）

```typescript
// 核心 API
export function usePresence(canvasId: string, userId: string) {
  // - 加入房间: setPresence()
  // - 更新光标: updateCursor(x, y)
  // - 监听其他用户: onOthers((users) => ...)
  // - 断线清除: onDisconnect().remove()
}
```

**验收**:
- [ ] 两个 tab 打开同一 canvasId，2s 内彼此可见对方头像
- [ ] 用户颜色可区分（哈希生成）
- [ ] 关闭 tab 后 5s 内其他用户头像消失

#### Step 3: 头像 + 光标 UI 集成（1h）
**文件**: `src/components/canvas/PresenceLayer.tsx`（新建）

- 用户头像圆形徽标（位置跟随光标）
- 颜色按 userId 哈希分配（保证同一用户颜色稳定）
- 最大显示 10 个用户头像（超出显示 +N）

#### Step 4: 编译验证（0.5h）
```bash
npm run type-check  # 0 errors
npm run lint        # 无新增 warning
```

---

### E3-S1: snapshot.ts 删除（0.5h）

**Owner**: Dev
**依赖**: 无
**交付物**: snapshot.ts 移除，build 通过

**实施步骤**:

```bash
# 1. 确认无引用
grep -r "snapshot" vibex-fronted/src --include="*.ts" --include="*.tsx" | grep -v "node_modules"

# 2. 删除文件
rm vibex-fronted/src/services/canvas/snapshot.ts  # 如存在

# 3. 验证 build
cd vibex-fronted && npm run build
```

**注意**: backend `vibex-backend/src/routes/v1/canvas/snapshot.ts` **不要删除**，仍在使用。

---

### E3-S2: ESLint 豁免清单（1h）

**Owner**: Dev
**依赖**: 无
**交付物**: MEMO 豁免记录 + ESLint 配置

**实施步骤**:

```bash
# 1. 确认 3 处 as any 的位置和原因
grep -rn "as any" vibex-fronted/src --include="*.ts" --include="*.tsx"

# 2. 在每个 as any 上方添加 MEMO 注释
// MEMO: 豁免原因 - 2026-04-08
// Reason: [具体原因]
// eslint-disable-next-line @typescript-eslint/no-explicit-any

# 3. 更新 .eslintrc 或创建 ESLINT_EXEMPTIONS.md
```

**MEMO 格式**:
```markdown
## ESLint 豁免清单

| 文件:行 | 原因 | 日期 | 豁免人 |
|---------|------|------|--------|
| src/lib/api.ts:42 | 第三方 SDK 类型定义缺失 | 2026-04-08 | Dev |
| ... | ... | ... | ... |
```

---

## Sprint 2 — 节点同步 + /health（9.5h）

### E1-S2: 多用户节点同步（4h）

**Owner**: Dev
**依赖**: E1-S1 完成
**交付物**: WebSocket 节点实时同步

**状态**: ✅ 完成 (commits 7eb32abe, 26790fdb)
- [x] MessageRouter.ts 新增 node 消息类型
- [x] collaborationSync.ts 节点变更广播
- [x] Store 协作状态集成（LWW）
- [x] version 乐观锁

**实施步骤**:

#### Step 1: WebSocket 消息协议扩展（1h）
**文件**: `src/lib/websocket/MessageRouter.ts`（修改）

```typescript
// 新增消息类型
interface NodeSyncMessage {
  type: 'node';
  action: 'create' | 'update' | 'delete';
  nodeId: string;
  data?: NodeData;
  version: number;
  userId: string;
  timestamp: number;
}
```

#### Step 2: Zustand Store 协作集成（1.5h）
**文件**: `src/stores/canvasStore.ts`（修改）

- `createNode()` 时广播 `node:create` 消息
- `updateNode()` 时广播 `node:update` 消息
- 收到远端消息时合并到本地状态（带 version 乐观锁）
- 冲突时保留最新写入（Last-Write-Wins）

#### Step 3: 同步延迟测试（0.5h）
```bash
# 用 Playwright 双 tab 测试
# Tab A 添加节点，Tab B 验证 < 3s 看到新节点
```

#### Step 4: Analytics 埋点（0.5h）
- `node_sync` 事件上报（通过 E3-S3 的 analytics 端点）
- 已在 E1-S1 前置条件中定义

#### Step 5: Reconciliation 逻辑（0.5h）
- 重连后拉取最新画布状态
- 合并本地离线期间的操作

---

### E1-S3: 协作冲突提示 UI（2h）

**Owner**: Dev
**依赖**: E1-S2 完成
**交付物**: 冲突提示气泡组件

**状态**: ✅ 完成 (commit 2675a813)
- [x] ConflictBubble.tsx 绝对定位气泡
- [x] 淡入动画 < 200ms
- [x] 5 分钟内不重复显示

**实施步骤**:

#### Step 1: 冲突检测（0.5h）
```typescript
// 在 canvasStore 中检测
if (remoteUpdate.nodeId === localEditingNodeId && remoteUpdate.userId !== currentUserId) {
  // 触发冲突事件
  conflictEventBus.emit('conflict', { nodeId, userA, userB, timestamp });
}
```

#### Step 2: ConflictBubble 组件（1h）
**文件**: `src/components/canvas/ConflictBubble.tsx`（新建）

- 绝对定位气泡，出现在被冲突节点的旁边
- 内容：双方用户名 + 冲突时间 + "了解" 按钮
- 动画：淡入 < 200ms
- 关闭后不再重复显示（同一冲突 5 分钟内）

#### Step 3: 集成到 Canvas（0.5h）
- `ConflictBubble` 挂载在 Canvas Container 内
- 通过 React Context 接收冲突事件

---

### E1-S4: WebSocket 重连与降级（1.5h）

**Owner**: Dev
**依赖**: E1-S2 完成
**交付物**: 重连逻辑 + 单用户降级

**状态**: ✅ 完成 (commit ff0cd56b)
- [x] 指数退避重连（1s→2s→4s→8s→16s）
- [x] 保留本地状态不清空
- [x] Firebase 降级单用户模式
- [x] 5s Firebase timeout

**实施步骤**:

#### Step 1: 重连策略优化（0.5h）
**文件**: `src/hooks/useCollaboration.ts`（修改）

- 指数退避：1s → 2s → 4s → 8s → 16s（最大 5 次）
- 重连时保留本地状态，不清空
- 重连成功后自动 reconciliation

#### Step 2: Firebase 降级（0.5h）
- Firebase 不可达（网络错误/timeout 5s）时切换为"单用户模式"
- 界面显示"协作暂时不可用" toast（不阻断操作）
- 每 30s 重试一次

#### Step 3: 单用户模式验证（0.5h）
```typescript
// 测试场景
1. Firebase 服务宕机
2. 用户仍可正常编辑（单用户降级）
3. appCrashed = false
4. 恢复后自动同步最新状态
```

---

### E2-S1: /health 端点实现（2h）

**Owner**: Dev
**依赖**: E0-S1 完成
**交付物**: GET /api/v1/health 端点

**实施步骤**:

#### Step 1: 指标采集中间件（0.5h）
**文件**: `vibex-backend/src/middleware/metrics.ts`（新建）

```typescript
// 记录每次 API 请求延迟
export function metricsMiddleware(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  metricsStore.push({ timestamp: start, duration });
}
```

#### Step 2: P50/P95/P99 计算（0.5h）
```typescript
// 5 分钟滚动窗口
function calculatePercentiles(records: LatencyRecord[]): { p50: number; p95: number; p99: number } {
  const sorted = records.map(r => r.duration).sort((a, b) => a - b);
  return {
    p50: percentile(sorted, 0.50),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  };
}
```

#### Step 3: 扩展现有 health 路由（0.5h）
**文件**: `vibex-backend/src/routes/v1/ws-health.ts`（修改）

- 合并到 `/api/v1/health`
- 返回 `latency` + `webVitals` 字段

#### Step 4: 测试（0.5h）
```bash
# 功能测试
curl https://api.vibex.top/api/v1/health
# 期望: 200, { latency: { p50, p95, p99, window: "5m" }, ... }

# 性能测试
curl -w "\nTime: %{time_total}s\n" https://api.vibex.top/api/v1/health
# 期望: < 50ms
```

---

## Sprint 3 — WebVitals + Analytics（4.5h）

### E2-S2: useWebVitals hook 完善（1.5h）

**Owner**: Dev
**依赖**: E0-S1 完成
**交付物**: 完整的 WebVitals 告警

**实施步骤**:

#### Step 1: 补全告警逻辑（0.5h）
**文件**: `vibex-fronted/src/hooks/useWebVitals.ts`（修改）

```typescript
// 已有骨架，只需补全阈值告警
const threshold = thresholds?.[metric.name];
if (threshold && metric.value > threshold) {
  console.warn(`[Performance] WARNING: ${metric.name} = ${metric.value}ms > ${threshold}ms`);
  // 发送 Slack webhook（可选，E2-S2 范围外）
}

// 阈值常量
const ALERT_THRESHOLDS = {
  LCP: 4000,  // ms
  CLS: 0.1,
  FID: 300,   // ms
  FCP: 3000,  // ms
  TTFB: 800,  // ms
};
```

#### Step 2: CLS delta 累加修复（0.5h）
- 已有 `CLSEntry` 类型但 CLS 值累加逻辑需验证
- 确保 `hadRecentInput` 时跳过（用户输入不计入 CLS）

#### Step 3: Feature Flag 集成（0.5h）
```typescript
// 读取 feature flag
const webVitalsEnabled = useFeatureFlag('web_vitals');

useEffect(() => {
  if (!webVitalsEnabled) return;
  initWebVitals();
}, [webVitalsEnabled]);
```

---

### E2-S3: 数据保留策略（1h）

**Owner**: Dev
**依赖**: E2-S1 完成
**交付物**: 7 天滚动清除逻辑

**实施步骤**:

#### Step 1: 内存数据 TTL（0.5h）
```typescript
// metricsStore.ts
class CircularBuffer {
  private records: LatencyRecord[] = [];
  private readonly maxAge = 5 * 60 * 1000; // 5 分钟

  push(record: LatencyRecord) {
    this.records.push(record);
    this.records = this.records.filter(r => Date.now() - r.timestamp < this.maxAge);
  }
}

// 每分钟执行清理
setInterval(() => { metricsStore.cleanup(); }, 60 * 1000);
```

#### Step 2: Analytics TTL 清理（0.5h）
```sql
-- 写入 analytics 时触发清理
DELETE FROM analytics_events WHERE expires_at < :now;
-- 或后台定时任务
```

#### Step 3: 验证（内联测试）
```typescript
// jest: metrics-ttl.test.ts
it('超过 5 分钟的记录自动清除', () => { ... });

// jest: analytics-retention.test.ts
it('超过 7 天的数据查询为空', () => { ... });
```

---

### E3-S3: 自建轻量 analytics（2h）

**Owner**: Dev
**依赖**: E2-S1 完成（可并行）
**交付物**: POST /api/v1/analytics 端点

**实施步骤**:

#### Step 1: 后端端点实现（1h）
**文件**: `vibex-backend/src/routes/v1/analytics.ts`（新建）

```typescript
// POST /api/v1/analytics
// 支持单条和批量
analytics.post('/', async (c) => {
  const body = await c.req.json();
  const events = Array.isArray(body) ? body : [body];
  
  // 验证 schema
  for (const event of events) {
    const parsed = AnalyticsEventSchema.safeParse(event);
    if (!parsed.success) {
      return c.json({ error: 'Invalid event' }, 400);
    }
    
    // 生成 ID，写入 DB
    const id = generateId();
    await db.run(
      'INSERT INTO analytics_events (id, event, session_id, user_id, properties, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, event.event, event.sessionId, event.userId || null, JSON.stringify(event.properties || {}), Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000]
    );
  }
  
  return c.json({ received: events.length, ids: [...] });
});
```

#### Step 2: 前端 Analytics Client（0.5h）
**文件**: `src/lib/analytics/client.ts`（新建）

```typescript
// 使用示例
analytics.track('project_create', { projectId: 'xxx' });
analytics.track('treemap_complete', { duration: 5000 });
analytics.track('collab_enabled', { method: 'firebase' });

// 特性: 静默失败（端点异常不阻断用户操作）
```

#### Step 3: 集成到核心漏斗（0.5h）
- `project_create`: 创建项目时调用
- `treemap_complete`: 三树完成时调用
- `ai_generate`: AI 生成节点时调用
- `export`: 导出时调用

---

## 风险缓解预案

| 风险 | 可能性 | 影响 | 预案 |
|------|--------|------|------|
| Firebase 在企业内网不可用 | 中 | 高 | Epic 1-S4 实现降级 + Epic 4 迁移 Yjs |
| 节点同步冲突超出 LWW 处理能力 | 低 | 中 | Epic 4 升级 Yjs CRDT（6h 额外）|
| analytics 数据量超出 SQLite 容量 | 低 | 低 | 7 天滚动 + 按需聚合 |
| WebVitals 在 SSR 环境中报错 | 低 | 低 | `typeof window === 'undefined'` guard |

---

## 测试策略

### 测试框架
- **前端**: Vitest + Playwright
- **后端**: Vitest（单元）+ Playwright（E2-S1 端到端）

### 覆盖率要求
- 核心业务逻辑（WebSocket 同步、冲突检测）: > 80%
- analytics 端点: > 90%（schema 校验、批量、TTL）

### 关键测试用例

```typescript
// E1-S2: 节点同步
it('Tab A 创建节点后，Tab B 在 3s 内看到新节点', async () => {
  // Playwright 双 tab 测试
});

// E1-S3: 冲突检测
it('两人同时编辑同一节点，1s 内显示冲突提示', async () => {
  // Firebase RTDB mock + 模拟并发
});

// E2-S1: /health 端点
it('返回 p50/p95/p99，响应时间 < 50ms', async () => {
  const res = await fetch('/api/v1/health');
  expect(res.status).toBe(200);
  expect(res.body.latency).toHaveKeys(['p50', 'p95', 'p99']);
});

// E3-S3: analytics 端点
it('批量上报 100 条返回 200', async () => {
  const events = Array.from({ length: 100 }, (_, i) => ({
    event: 'test',
    sessionId: `session-${i}`,
    timestamp: Date.now(),
  }));
  const res = await fetch('/api/v1/analytics', {
    method: 'POST',
    body: JSON.stringify(events),
  });
  expect(res.status).toBe(200);
  expect((await res.json()).received).toBe(100);
});
```

---

## 交付检查单

- [x] E0-S1: MEMORY.md A-010 签署完成
- [x] E1-S1: Firebase Presence MVP 上线
- [x] E1-S2: 节点同步 < 3s
- [x] E1-S3: 冲突提示 UI 上线
- [x] E1-S4: 重连 + 降级测试通过
- [ ] E2-S1: /health 端点 P50/P95/P99
- [ ] E2-S2: LCP > 4s 告警触发
- [ ] E2-S3: 7 天数据清除验证
- [ ] E3-S1: snapshot.ts 删除 + build 通过
- [ ] E3-S2: ESLint 豁免 MEMO 记录
- [ ] E3-S3: analytics 端点 + 4 个事件采集
- [ ] npm run build 通过
- [ ] npm run type-check 0 错误
- [ ] CHANGELOG.md 更新

---

*Architect Agent | 2026-04-08 22:15 GMT+8*
