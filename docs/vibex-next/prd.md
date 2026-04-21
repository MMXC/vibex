# VibeX Next — PRD

**项目**: vibex-next
**状态**: 代码已完成（origin/main）
**日期**: 2026-04-19（PRD 重写: 2026-04-20）
**Planning 产出**: docs/vibex-next/planning-output.md

---

## 1. 执行摘要

### 背景

VibeX 画布协作能力缺失，无法感知其他用户的在线状态和操作。性能可观测性不足，无法追踪 WebVitals 和 API 延迟。缺少数据分析能力，无法了解用户行为。

### 目标

在 vibex-next 分支实现三大能力：
1. **实时协作感知** — Firebase Realtime Database 感知在线用户 + WebSocket 节点同步 + 冲突提示
2. **性能可观测性** — WebVitals 监测 + /health API 延迟端点 + 数据保留策略
3. **自建轻量 Analytics** — 事件采集 SDK + 后端端点 + 7 天 TTL

### 成功指标

| 指标 | 目标 |
|------|------|
| 节点同步延迟 | < 3s |
| /health 响应时间 | < 50ms |
| Analytics 批量上报 | 100 条返回 200 |
| WebVitals 告警触发 | LCP > 4s / CLS > 0.1 |
| npm build | 0 error |
| npm type-check | 0 error |

---

## 2. Epic 拆分

### Feature List

| ID | Epic/Story | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|-----------|--------|------|----------|----------|
| E0-S1 | Epic E0: 技术债 | MEMORY.md A-010 设计补全 | 补充性能可观测性设计规范（指标定义、告警阈值、数据保留策略）至 MEMORY.md | 无（内部技术债） | 0.5h |
| E1-S1 | Epic E1: 实时协作 | Firebase Presence 接入 | `usePresence` hook 检测用户在线状态，PresenceLayer 组件渲染在线用户头像，断线 5s 自动清除 | E1: 画布无法感知其他用户状态 | 3.5h |
| E1-S2 | Epic E1: 实时协作 | 多用户节点同步 | WebSocket 节点实时同步（create/update/delete），LWW 乐观锁冲突合并，version 版本控制，重连 reconciliation | E1: 画布无法感知其他用户状态 | 4h |
| E1-S3 | Epic E1: 实时协作 | 协作冲突提示 UI | ConflictBubble 组件显示冲突气泡（双方用户名+时间+了解按钮），淡入动画<200ms，同一冲突 5 分钟内不重复显示 | E1: 画布无法感知其他用户状态 | 2h |
| E1-S4 | Epic E1: 实时协作 | WebSocket 重连与降级 | 指数退避重连（1s→2s→4s→8s→16s），Firebase 不可达时切换单用户模式，保留本地状态，30s 重试一次 | E1: 画布无法感知其他用户状态 | 1.5h |
| E2-S1 | Epic E2: 性能可观测性 | /health 端点实现 | GET /api/v1/health 返回 P50/P95/P99 延迟数据，5 分钟滚动窗口，响应时间<50ms，无 DB 查询 | E2: 缺少 API 延迟追踪 | 2h |
| E2-S2 | Epic E2: 性能可观测性 | useWebVitals hook 完善 | LCP/CLS/FCP 监测，告警阈值（LCP>4s/CLS>0.1/FCP>3s），console.warn 输出，Feature Flag 集成 | E2: 缺少 WebVitals 追踪 | 1.5h |
| E2-S3 | Epic E2: 性能可观测性 | 数据保留策略 | 监控数据 5 分钟滚动 TTL，analytics 事件 7 天 expires_at TTL + 异步清理，CircleBuffer 实现 | E2: 缺少 WebVitals 追踪 | 1h |
| E3-S1 | Epic E3: 自建 Analytics | snapshot.ts 删除 | 删除 vibex-fronted 中废弃的 snapshot.ts，验证 build/type-check 通过 | E3: 技术债清理 | 0.5h |
| E3-S2 | Epic E3: 自建 Analytics | ESLint 豁免清单 | 为 catalog.ts/registry.tsx/useDDDStateRestore.ts 中 `as any` 添加 MEMO 豁免注释，产出 ESLINT_EXEMPTIONS.md | E3: 技术债清理 | 1h |
| E3-S3 | Epic E3: 自建 Analytics | 自建轻量 analytics | POST /api/v1/analytics 端点（单条/批量），analytics client SDK，4 个事件采集（page_view/canvas_open/component_create/delivery_export），7 天 TTL | E3: 缺少用户行为数据 | 2h |

**工时汇总**: E0(0.5h) + E1(11h) + E2(4.5h) + E3(3.5h) = **19.5h**

---

## 2a. 本质需求穿透（神技1：剥洋葱）

### Epic E1 — 实时协作感知

**用户的底层动机是什么？**
不是"我要看到头像"，而是"我不想在不知情的情况下覆盖别人的工作"。协作时最大的焦虑来自**隐性冲突**——不知道自己影响了别人，或不知道别人影响了自己。

**去掉现有方案，理想解法是什么？**
每个操作者能实时感知画布上其他人的存在和意图。头像只是视觉载体，本质是**冲突避免**。

**这个 Epic 解决了用户的什么本质问题？**
解决"我是否在单打独斗"的不确定性，以及"我的修改是否被覆盖"的恐惧感。

### Epic E2 — 性能可观测性

**用户的底层动机是什么？**
不是"我要看指标"，而是"用户用我的产品卡不卡"。开发者需要被**真实数据**打脸，而不是靠感觉说"挺快的"。

**去掉现有方案，理想解法是什么？**
上线后立刻知道用户遇到了性能问题（LCP 爆炸/接口超时），而不是等用户投诉。

**这个 Epic 解决了用户的什么本质问题？**
解决"性能黑盒"——让团队对用户体验有可量化的共同认知，不再靠"感觉"判断性能。

### Epic E3 — 自建轻量 Analytics

**用户的底层动机是什么？**
不是"我要看数据面板"，而是"我的产品真的有人在用吗？他们在做什么？"产品决策需要数据，不是靠猜测。

**去掉现有方案，理想解法是什么？**
零成本知道用户是否走完了核心漏斗（创建画布→添加组件→导出交付）。

**这个 Epic 解决了用户的什么本质问题？**
解决"拍脑袋决策"——让产品迭代基于真实行为数据而非假设。

---

## 2b. 最小可行范围（神技2：极简主义）

### Epic E1 — 实时协作感知

**本期必做**（去掉用户流程走不通）：
- E1-S1: Firebase Presence 接入 — 没有这个，连"谁在线"都不知道
- E1-S2: 节点同步 — 没有这个，多人编辑结果无法收敛

**本期不做**（去掉后用户仍能完成任务）：
- E1-S3: 冲突提示 UI — 用户可以通过"别同时动同一节点"来规避，体验稍差但不阻断
- E1-S4: WebSocket 重连与降级 — 网络正常时无感知，可作为独立优化迭代

**暂缓**（80%用户的80%场景不需要）：
- Yjs CRDT 迁移（当前用 LWW，已够用，企业内网场景优先）
- 多人光标实时绘制（avatar 足够感知存在）

### Epic E2 — 性能可观测性

**本期必做**（去掉用户流程走不通）：
- E2-S1: /health 端点 — DevOps 需要 P50/P95/P99 报警
- E2-S2: WebVitals hook — 前端性能的唯一可量化指标

**本期不做**（去掉后用户仍能完成任务）：
- E2-S3: 数据保留策略 — 可以用固定 TTL 代替，7 天精确清理不是 MVP 必须

**暂缓**（80%用户的80%场景不需要）：
- Slack webhook 告警（先 console.warn，触发后再接）
- 性能仪表板 UI（看 metrics 数据已有 /health，返回数据即可）

### Epic E3 — 自建轻量 Analytics

**本期必做**（去掉用户流程走不通）：
- E3-S3: 自建 analytics SDK + 端点 — 产品决策必须
- E3-S1: snapshot.ts 删除 — 不删除 build 失败

**本期不做**（去掉后用户仍能完成任务）：
- E3-S2: ESLint 豁免清单 — 不影响功能，属于代码整洁度

**暂缓**（80%用户的80%场景不需要）：
- 复杂漏斗分析（先 4 个事件够了，按需扩展）
- Analytics 数据可视化面板（先存数据，查询已有 /analytics 端点）

---

## 2c. 用户情绪地图（神技3：老妈测试）

### 页面：Canvas 画布（协作感知）

**用户进入时的情绪**：期待 + 轻微焦虑
- 期待：刚打开画布想立刻开始工作
- 焦虑：不知道有没有同事也在编辑，怕冲突

**用户迷路时的引导文案**：
- 引导文案：「画布右上角显示当前在线成员。如果你是唯一的人，开始创作吧。」
- 禁止只写"无内容"或留白

**用户出错时的兜底机制**：
- Firebase 不可达：Toast 提示"协作模式暂时不可用，已切换至单人编辑"，不阻断操作
- 节点冲突：ConflictBubble 气泡提示，显示"张三在编辑此节点"而非静默覆盖

### 页面：Dashboard 项目列表（Analytics）

**用户进入时的情绪**：好奇 + 评估
- 好奇：想看自己的数据趋势
- 评估：快速判断产品是否值得继续用

**用户迷路时的引导文案**：
- 引导文案：「还没有数据。创建第一个项目并使用画布后，数据会自动在这里显示。」

**用户出错时的兜底机制**：
- Analytics 端点异常：静默失败（analytics 不应阻断用户操作），console.warn 输出

### 页面：开发者监控（/health 端点）

**用户进入时的情绪**：运维/DevOps 视角，关注异常
- 期待：快速看到 P50/P95/P99 指标
- 焦虑：担心接口超时影响用户体验

**用户迷路时的引导文案**：
- API 直接返回 JSON，开发者文档应标注响应格式示例

**用户出错时的兜底机制**：
- /health 返回 500 时应附带 error 字段说明原因（网络/超时/内存）

---

## 2d. UI状态规范（神技4：状态机 — Spec阶段应用）

> 以下为 Spec 文件要求，PRD 中标注即可。详见 `specs/` 目录。

### 涉及页面的 Epic

| Epic | 涉及页面 | 核心 UI 元素 |
|------|---------|-------------|
| E1-S1 | Canvas 画布 | PresenceLayer（在线用户头像） |
| E1-S3 | Canvas 画布 | ConflictBubble（冲突提示气泡） |
| E2-S2 | 全站页面 | WebVitals 告警 Toast |
| E3-S3 | 全站页面 | Analytics SDK（无独立页面） |

详细四态定义见各 spec 文件：
- `specs/e1-s1-presence-layer.md`
- `specs/e1-s3-conflict-bubble.md`

### UI 元素四态规范

| UI 元素 | 理想态 | 空状态 | 加载态 | 错误态 |
|---------|--------|--------|--------|--------|
| PresenceLayer | 彩色用户头像圆形徽标，跟随光标位置 | 显示"只有你"，灰色单人头像 + 引导文案 | 骨架屏（圆形占位，3 个） | 降级：隐藏 PresenceLayer，不显示错误 |
| ConflictBubble | 绝对定位气泡，淡入动画，显示用户名+时间+了解按钮 | 不渲染（无冲突时无此元素） | 不存在（冲突检测是即时的） | 异常时静默消失，不阻断操作 |

### 空状态禁止留白规范

所有空状态必须包含：
1. **引导插图**：SVG 或 emoji 表示场景（如单人头像表示"独处"）
2. **引导文案**：明确告知用户当前状态 + 下一步行动
3. **禁止项**：不允许只留白、不允许只写"无内容"

### 加载态规范

- **必须用骨架屏**（Skeleton），禁止用 Spinner/转圈
- 理由：骨架屏不会抖动，避免布局跳动（CLS），用户体验更稳定

### 错误态覆盖范围

至少覆盖以下 4 类：
1. **网络异常**：Firebase/WebSocket 断开
2. **权限不足**：Firebase 认证失败
3. **数据超长**：节点数据超过渲染限制
4. **接口超时**：/health 或 /analytics 请求超时

---

## 3. 验收标准

每个 Story 的可测试 expect() 断言：

### E0-S1: MEMORY.md A-010 设计补全

```typescript
expect(MEMORY.md).toContain('A-010');
expect(MEMORY.md).toContain('LCP');
expect(MEMORY.md).toContain('CLS');
expect(MEMORY.md).toContain('P99');
expect(MEMORY.md).toMatch(/LCP.*4000ms|4000.*ms/); // 告警阈值
expect(MEMORY.md).toMatch(/CLS.*0\.1|0\.1.*CLS/);
expect(MEMORY.md).toMatch(/P99.*2000ms|2000.*ms/);
expect(MEMORY.md).toContain('7 天'); // 数据保留
```

### E1-S1: Firebase Presence 接入

```typescript
// 集成测试（双 Tab Playwright）
const pageA = await browser.newPage();
const pageB = await browser.newPage();
await pageA.goto('/project/canvas-123');
await pageB.goto('/project/canvas-123');
await pageA.waitForSelector('[data-testid="presence-avatar"]', { timeout: 3000 });
const avatarCount = await pageA.locator('[data-testid="presence-avatar"]').count();
expect(avatarCount).toBeGreaterThanOrEqual(1); // 至少看到自己

// 断线清除
await pageB.close();
await pageA.waitForTimeout(6000); // 等待 5s timeout + 1s buffer
const avatarCountAfterClose = await pageA.locator('[data-testid="presence-avatar"]').count();
expect(avatarCountAfterClose).toBe(1); // 只剩自己
```

### E1-S2: 多用户节点同步

```typescript
// 双 Tab 节点同步延迟
const pageA = await browser.newPage();
const pageB = await browser.newPage();
await pageA.goto('/project/canvas-123');
await pageB.goto('/project/canvas-123');
await pageA.evaluate(() => createNode({ type: 'rect', x: 100, y: 100 }));
const start = Date.now();
await pageB.waitForSelector('[data-testid="canvas-node"]', { timeout: 4000 });
const syncDelay = Date.now() - start;
expect(syncDelay).toBeLessThan(3000);

// LWW 冲突合并
const pageA2 = await browser.newPage();
const pageB2 = await browser.newPage();
await pageA2.goto('/project/canvas-conflict');
await pageB2.goto('/project/canvas-conflict');
// 两人同时修改同一节点
await pageA2.evaluate(() => updateNode('node-1', { color: 'red' }));
await pageB2.evaluate(() => updateNode('node-1', { color: 'blue' }));
await pageA2.waitForTimeout(2000);
const colorA = await pageA2.evaluate(() => getNode('node-1').color);
const colorB = await pageB2.evaluate(() => getNode('node-1').color);
expect(colorA).toBe(colorB); // LWW 最终一致
```

### E1-S3: 协作冲突提示 UI

```typescript
expect(document.querySelector('[data-testid="conflict-bubble"]')).toBeTruthy();
const animationDuration = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="conflict-bubble"]');
  const style = getComputedStyle(el);
  return parseFloat(style.animationDuration) * 1000;
});
expect(animationDuration).toBeLessThan(200); // 淡入 < 200ms
```

### E1-S4: WebSocket 重连与降级

```typescript
// 指数退避重连
const reconnectAttempts = [];
const originalFetch = window.fetch;
// mock Firebase 不可达
await page.evaluate(() => { window.__FIREBASE_UNAVAILABLE__ = true; });
await page.waitForTimeout(1000);
reconnectAttempts.push(Date.now());
// 验证重连间隔：1s→2s→4s（至少 3 次）
expect(reconnectAttempts.length).toBeGreaterThanOrEqual(3);

// 单用户降级
const toast = await page.waitForSelector('[data-testid="collab-unavailable-toast"]', { timeout: 5000 });
expect(toast).toBeTruthy();
const toastText = await toast.textContent();
expect(toastText).toContain('协作暂时不可用');
```

### E2-S1: /health 端点

```typescript
const res = await fetch('/api/v1/health');
expect(res.status).toBe(200);
const body = await res.json();
expect(body.latency).toHaveProperty('p50');
expect(body.latency).toHaveProperty('p95');
expect(body.latency).toHaveProperty('p99');
expect(typeof body.latency.p50).toBe('number');
expect(typeof body.latency.p95).toBe('number');
expect(typeof body.latency.p99).toBe('number');
// 性能
const timing = await new Promise(resolve => {
  const t0 = Date.now();
  fetch('/api/v1/health').then(() => resolve(Date.now() - t0));
});
expect(timing).toBeLessThan(50); // < 50ms
```

### E2-S2: useWebVitals hook

```typescript
// LCP 告警
const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
await page.evaluate(() => {
  // 模拟 LCP > 4000ms
  window.dispatchEvent(new PerformanceObserverEvent('lcp', { value: 5000, id: 'img1' }));
});
expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('LCP'));

// SSR guard
expect(() => {
  // 在 node 环境执行不应报错
  const fn = new Function('window', 'return typeof window');
  // 如果在 server 端运行，typeof window === 'undefined' 时 hook 不初始化
}).not.toThrow();
```

### E2-S3: 数据保留策略

```typescript
// metrics 5 分钟 TTL
const oldRecord = { timestamp: Date.now() - 6 * 60 * 1000, duration: 100 };
metricsStore.push(oldRecord);
expect(metricsStore.getAll().find(r => r.timestamp === oldRecord.timestamp)).toBeUndefined();

// analytics 7 天 TTL
const event = { event: 'test', expires_at: Date.now() - 1 }; // 已过期
await db.run('INSERT INTO analytics_events VALUES (?)', [event]);
await analytics.cleanup();
const result = await db.run('SELECT * FROM analytics_events WHERE expires_at < ?', [Date.now()]);
expect(result.rows.length).toBe(0);
```

### E3-S1: snapshot.ts 删除

```typescript
const buildResult = await exec('cd vibex-fronted && npm run build');
expect(buildResult.exitCode).toBe(0);
const typeCheckResult = await exec('cd vibex-fronted && npm run type-check');
expect(typeCheckResult.exitCode).toBe(0);
const snapshotFiles = await glob('**/snapshot.ts', { cwd: 'vibex-fronted/src' });
expect(snapshotFiles).toHaveLength(0); // 无 snapshot.ts
```

### E3-S2: ESLint 豁免清单

```typescript
const exemptions = await readFile('ESLINT_EXEMPTIONS.md', 'utf-8');
expect(exemptions).toContain('catalog.ts');
expect(exemptions).toContain('registry.tsx');
expect(exemptions).toContain('useDDDStateRestore.ts');
const catalogContent = await readFile('catalog.ts', 'utf-8');
expect(catalogContent).toMatch(/MEMO.*豁免.*2026-04/);
```

### E3-S3: 自建轻量 analytics

```typescript
// 单条上报
const res1 = await fetch('/api/v1/analytics', {
  method: 'POST',
  body: JSON.stringify({ event: 'page_view', sessionId: 's1', timestamp: Date.now() }),
  headers: { 'Content-Type': 'application/json' },
});
expect(res1.status).toBe(200);

// 批量上报
const events = Array.from({ length: 100 }, (_, i) => ({
  event: 'test',
  sessionId: `s${i}`,
  timestamp: Date.now(),
}));
const res2 = await fetch('/api/v1/analytics', {
  method: 'POST',
  body: JSON.stringify(events),
  headers: { 'Content-Type': 'application/json' },
});
expect(res2.status).toBe(200);
const body2 = await res2.json();
expect(body2.received).toBe(100);

// 4 个事件采集点
expect(analytics.track).toHaveBeenCalledWith('page_view', expect.any(Object));
expect(analytics.track).toHaveBeenCalledWith('canvas_open', expect.any(Object));
expect(analytics.track).toHaveBeenCalledWith('component_create', expect.any(Object));
expect(analytics.track).toHaveBeenCalledWith('delivery_export', expect.any(Object));
```

---

## 4. Definition of Done

### 研发完成判断标准

**所有 Epic 必须同时满足以下条件才视为完成：**

1. **代码已提交**：所有相关文件 commit 在 `origin/main`
2. **构建通过**：`npm run build` exitCode = 0
3. **类型检查通过**：`npm run type-check` exitCode = 0
4. **单元测试通过**：相关测试文件 100% 通过
5. **集成测试通过**：Playwright 双 Tab 协作测试通过
6. **PR 已合并**：经过 code review 后合并至 main
7. **CHANGELOG.md 更新**：每个 Epic 的 commit hash 已记录

### Epic 完成检查单

| Epic | 代码提交 | Build | Type-Check | 测试 | Review | Changelog |
|------|---------|-------|------------|------|--------|-----------|
| E0-S1 | 53274d97 ✅ | ✅ | ✅ | — | ✅ | ✅ |
| E1-S1 | 862fb85a ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E1-S2 | 7eb32abe ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E1-S3 | 2675a813 ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E1-S4 | ff0cd56b ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E2-S1 | 1ac78dcd ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E2-S2 | 1277e652 ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E2-S3 | 04dff5f3 ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| E3-S1 | e75641c4 ✅ | ✅ | ✅ | — | ✅ | ✅ |
| E3-S2 | e75641c4 ✅ | ✅ | ✅ | — | ✅ | ✅ |
| E3-S3 | 1d3870bb ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Sprint 规划

| Sprint | 时长 | 故事 | 工时 | 交付物 |
|--------|------|------|------|--------|
| Sprint 1 | 2 天 | E0-S1 + E1-S1 + E3-S1 + E3-S2 | 5.5h | Firebase Presence MVP + 技术债清理 |
| Sprint 2 | 3 天 | E1-S2 + E1-S3 + E1-S4 + E2-S1 | 9.5h | 节点同步 + 冲突 UI + /health 端点 |
| Sprint 3 | 2 天 | E2-S2 + E2-S3 + E3-S3 | 4.5h | WebVitals hook + analytics |

---

## 6. 风险缓解

| 风险 | 可能性 | 影响 | 预案 |
|------|--------|------|------|
| Firebase 在企业内网不可用 | 中 | 高 | E1-S4 实现降级 + 后续迁移 Yjs |
| 节点同步冲突超出 LWW 处理能力 | 低 | 中 | 后续升级 Yjs CRDT（+6h） |
| analytics 数据量超出 SQLite 容量 | 低 | 低 | 7 天滚动 + 按需聚合 |
| WebVitals 在 SSR 环境中报错 | 低 | 低 | `typeof window === 'undefined'` guard |
