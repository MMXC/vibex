# VibeX Next — Feature List & Planning Output

**项目**: vibex-next
**状态**: 代码已完成（origin/main）
**生成日期**: 2026-04-20

---

## Epic 分组

按根因/功能内聚性分 3 组：

| Epic | 名称 | 根因 | 状态 |
|------|------|------|------|
| E1 | Firebase 实时协作感知 | 画布无法感知其他用户状态 | ✅ 已交付 |
| E2 | 性能可观测性 | 缺少 WebVitals 和 API 延迟追踪 | ✅ 已交付 |
| E3 | 自建轻量 Analytics | 缺少用户行为数据 | ✅ 已交付 |

---

## Feature List（功能清单）

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

---

## 工时汇总

| Epic | Story | 工时 |
|------|-------|------|
| E0 | E0-S1 | 0.5h |
| E1 | E1-S1 + E1-S2 + E1-S3 + E1-S4 | 11h |
| E2 | E2-S1 + E2-S2 + E2-S3 | 4.5h |
| E3 | E3-S1 + E3-S2 + E3-S3 | 3.5h |
| **合计** | | **19.5h** |

---

## Epic 分组详情

### Epic E1 — Firebase 实时协作感知（11h）

**根因**: 画布协作能力缺失，无法感知其他用户的在线状态和操作。

**Stories**:
- E1-S1: Firebase Presence 接入（3.5h）— MVP 层
- E1-S2: 多用户节点同步（4h）— 核心同步能力
- E1-S3: 协作冲突提示 UI（2h）— 冲突感知层
- E1-S4: WebSocket 重连与降级（1.5h）— 韧性层

**Epic 内依赖**: E1-S2 依赖 E1-S1；E1-S3 和 E1-S4 依赖 E1-S2。

---

### Epic E2 — 性能可观测性（4.5h）

**根因**: 性能可观测性不足，无法追踪 WebVitals 和 API 延迟。

**Stories**:
- E2-S1: /health 端点实现（2h）— API 延迟可观测
- E2-S2: useWebVitals hook 完善（1.5h）— 前端性能可观测
- E2-S3: 数据保留策略（1h）— 存储治理

**Epic 内依赖**: E2-S3 依赖 E2-S1；E2-S2 独立。

---

### Epic E3 — 自建轻量 Analytics（3.5h）

**根因**: 缺少数据分析能力，无法了解用户行为。

**Stories**:
- E3-S1: snapshot.ts 删除（0.5h）— 技术债清理
- E3-S2: ESLint 豁免清单（1h）— 技术债清理
- E3-S3: 自建轻量 analytics（2h）— 核心功能

**Epic 内依赖**: E3-S3 可与 E2-S1 并行开发；E3-S1 和 E3-S2 无依赖。

---

## Sprint 规划

| Sprint | 时长 | 故事 | 工时 | 交付物 |
|--------|------|------|------|--------|
| Sprint 1 | 2 天 | E0-S1 + E1-S1 + E3-S1 + E3-S2 | 5.5h | Firebase Presence MVP + 技术债清理 |
| Sprint 2 | 3 天 | E1-S2 + E1-S3 + E1-S4 + E2-S1 | 9.5h | 节点同步 + 冲突 UI + /health 端点 |
| Sprint 3 | 2 天 | E2-S2 + E2-S3 + E3-S3 | 4.5h | WebVitals hook + analytics |

---

## 关键验收标准（每 Story 独立可测）

| Story | 验收标准 |
|-------|----------|
| E1-S1 | 两个 tab 打开同一 canvasId，2s 内彼此可见对方头像；关闭 tab 后 5s 内其他用户头像消失 |
| E1-S2 | Tab A 创建节点后，Tab B 在 3s 内看到新节点；version 乐观锁冲突时 LWW 合并 |
| E1-S3 | 两人同时编辑同一节点，1s 内显示 ConflictBubble；淡入动画<200ms；同一冲突 5 分钟内不重复 |
| E1-S4 | Firebase 不可达时自动切换单用户模式，保留本地编辑状态不丢失；30s 后重试 |
| E2-S1 | `curl /api/v1/health` 返回 `{ latency: { p50, p95, p99 } }`，响应时间<50ms |
| E2-S2 | LCP>4s 或 CLS>0.1 时 console.warn 输出；`typeof window === 'undefined'` 时不报错 |
| E2-S3 | metrics 数据超过 5 分钟自动清除；analytics 数据超过 7 天查询结果为空 |
| E3-S1 | `rm snapshot.ts` 后 `npm run build` 和 `npm run type-check` 均通过 |
| E3-S2 | 3 处 `as any` 均有 MEMO 豁免注释，ESLINT_EXEMPTIONS.md 清单完整 |
| E3-S3 | POST /api/v1/analytics 单条返回 200；批量 100 条返回 200；4 个事件采集点均有效 |
