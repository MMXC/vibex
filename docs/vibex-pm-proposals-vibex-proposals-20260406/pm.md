# VibeX Sprint PM — 2026-04-06

> **Sprint**: 2026-04-06 (5-day)
> **目标**: 解除 Canvas 核心阻塞 + 建立质量/流程基线
> **背景**: 基于 2026-04-05 汇总的 6 个 Agent 提案（analyst、architect、pm、tester、reviewer），共 23 个改进点，P0×3 + P1×3

---

## 1. Sprint 背景

### 昨日完成
- Quick fixes: CORS（gateway拦截器）、Context（checkbox绑定）、flowId（补传）3 个 Bug ~4h
- reviewer-dedup: 任务状态机虚假触发修复 ~2-3h
- GLM canvas-optimization-roadmap: 6 阶段计划验证通过

### 遗留问题（来源: 2026-04-05 分析）
| 问题 | 现状 | 影响 |
|------|------|------|
| Canvas API 端点缺失 | 后端仅 9/32 端点（72%缺失） | E4 Version History 完全阻塞 |
| 跨项目依赖解析缺失 | `_ready_decision.py` 不查外项目 | 任务虚假触发 READY |
| Vitest 配置死代码 | jest.config.ts 阈值不生效 | CI 覆盖率门槛失效 |
| 6 个新 Hooks 覆盖率为 0 | regression 风险高 | 27h 补测工作量 |

### 本次 Sprint 来源
6 个 Agent 提案汇总 → 6 个 Epic（P0×3，P1×3）

---

## 2. Sprint 目标

**主目标**: 修复 3 个 P0 阻塞性 Bug，建立 3 个 P1 稳定性基线

**成功指标**:
- AC1: `OPTIONS /v1/projects` → 204 + CORS headers（不被 401 拦截）
- AC2: Canvas checkbox 点击 → `selectedNodeIds` 正确更新
- AC3: `generate-components` 输出 `flowId` ≠ `unknown`
- AC4: SSE 流 10s 无响应 → 自动关闭，Worker 不挂死
- AC5: 限流 100 并发 → 多 Worker 计数一致
- AC6: `test-notify` 5min 内重复调用 → 跳过发送

---

## 3. Sprint 规划

### 资源分配

| 轨道 | 负责人 | 工时 | 内容 |
|------|--------|------|------|
| Track A (Bug) | dev | 1.1h | E1 + E2 + E3（P0 优先） |
| Track B (Stability) | dev | 4h | E4 + E5 + E6（P1 改进） |
| Track C (Verification) | tester | 并行 | 测试 + 回归验证 |
| **合计** | | **5.1h** | |

> 注: 2026-04-05 Sprint 规划为 39h（5天），本次 Sprint 仅覆盖 P0/P1 修复包（5.1h），剩余工时用于 canvas-api-completion（7d）、tester-test-commands、internal-tools 等任务。

---

## 4. Epic 详情

### Epic 1: OPTIONS 预检路由修复（P0 | 0.5h）

**问题**: `protected_.options` 在 `authMiddleware` 之后注册，所有跨域 POST/PUT/DELETE 预检被 401 拦截

**根因**: `gateway.ts` 路由注册顺序错误，OPTIONS 在认证中间件之后执行

**解决方案**: 将 `protected_.options` 移到 `authMiddleware` 之前注册

**Estimate**: 0.5h

**验收标准**:
- `curl -X OPTIONS -I /v1/projects` 返回 204（非 401）
- `Access-Control-Allow-Origin: *` header 存在
- GET/POST 请求不受影响

**文件变更**: `gateway.ts`（路由注册顺序）

---

### Epic 2: Canvas Context 多选修复（P0 | 0.3h）

**问题**: 用户无法选择性发送上下文节点，checkbox 选择功能失效

**根因**: `BoundedContextTree.tsx` checkbox `onChange` 绑定到 `toggleContextNode`（右击菜单）而非 `onToggleSelect`（Zustand store）

**解决方案**: 将 checkbox `onChange` 改为 `onToggleSelect`

**Estimate**: 0.3h

**验收标准**:
- 点击 checkbox → `selectedNodeIds` 在 Zustand store 中更新
- 右击 `toggleContextNode` 仍正常工作
- 回归测试通过

**文件变更**: `BoundedContextTree.tsx`

---

### Epic 3: generate-components flowId 修复（P0 | 0.3h）

**问题**: AI 输出 `flowId=unknown`，后续 Version History 等流程无法关联

**根因**: AI schema 缺少 `flowId` 字段定义，prompt 未要求输出

**解决方案**: schema 添加 `flowId: string`，prompt 明确要求输出

**Estimate**: 0.3h

**验收标准**:
- `expect(flowId).toMatch(/^flow-/)`
- `expect(flowId).not.toBe('unknown')`
- API 响应包含有效 flowId

**文件变更**: `schema.ts` + prompt 文件

---

### Epic 4: SSE 超时 + 连接清理（P1 | 1.5h）

**问题**: `aiService.chat()` 无超时控制，10s 无响应时 Worker 挂死；`cancel()` 未清理 `setTimeout`

**根因**: 缺少 `AbortController` 超时包装，timer 泄漏

**解决方案**: `AbortController.timeout(10000)` 包装 aiService 调用，`ReadableStream.cancel()` 清理所有 timers

**Estimate**: 1.5h

**验收标准**:
- SSE 流 10s 无响应 → `controller.close()`，前端收到流结束
- `stream.cancel()` 后 `clearTimeout` 被调用
- jest 测试覆盖

**文件变更**: `aiService.ts`

---

### Epic 5: 分布式限流（P1 | 1.5h）

**问题**: 内存 Map 存储限流计数器，Cloudflare Workers 多 Worker 部署下不共享，限流完全失效

**根因**: 内存变量不跨 Worker 同步

**解决方案**: 使用 Cloudflare Workers 内置 `caches.default` 替代内存 Map（需 wrangler 启用）

**Estimate**: 1.5h

**验收标准**:
- `expect(caches.default).toBeDefined()`
- 100 并发请求后限流一致（后续请求返回 429）
- 接口不变，兼容现有调用方

**文件变更**: `rateLimit.ts` + `wrangler.toml`

---

### Epic 6: test-notify 去重（P1 | 1h）

**问题**: JS 版 `test-notify` 缺少 5 分钟时间窗口去重，重复事件被重复通知

**根因**: Python 版已有去重，JS 版遗漏

**解决方案**: 实现 `dedup.js`（`checkDedup` + `recordSend`），状态持久化到 `.dedup-cache.json`

**Estimate**: 1h

**验收标准**:
- 首次调用 → `{ sent: true }`
- 5min 内重复 → `{ skipped: true }`
- jest 测试通过

**文件变更**: `dedup.js` + `test-notify.js`

---

## 5. 优先级矩阵

| Epic | 优先级 | 工时 | 依赖 | 风险 |
|------|--------|------|------|------|
| E1: OPTIONS 修复 | P0 | 0.5h | 无 | 中（影响所有跨域请求） |
| E2: Canvas 多选修复 | P0 | 0.3h | 无 | 低（仅前端组件） |
| E3: flowId 修复 | P0 | 0.3h | 无 | 低（AI 输出增强） |
| E4: SSE 超时清理 | P1 | 1.5h | 无 | 中（影响流处理） |
| E5: 分布式限流 | P1 | 1.5h | wrangler 配置 | 中（部署依赖） |
| E6: test-notify 去重 | P1 | 1h | 无 | 低（幂等改进） |

---

## 6. Sprint 执行策略

### Phase 1: P0 Bug 修复（Day 1，1.1h）
E1 → E2 → E3 并行或顺序执行，dev 优先完成

### Phase 2: P1 稳定性改进（Day 2-3，4h）
E4 → E5 → E6 顺序执行，注意 E5 需提前确认 wrangler 配置

### Phase 3: 验证与部署（Day 4-5）
- tester 回归测试覆盖
- Playwright E2E 测试
- wrangler 部署 + 监控

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 修改不引入额外延迟（P0 修改均为<1h，应无性能影响） |
| 兼容性 | 不破坏现有功能，所有 P0 修改需回归验证 |
| 可观测性 | SSE 超时后应记录日志便于排查 |
| 部署安全 | E5 限流修改需 wrangler 配置变更，需 review 确认 |

---

## 8. 风险缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| OPTIONS 修改破坏其他中间件 | 低 | 高 | 仅调整注册顺序，测试覆盖 GET/POST/DELETE |
| SSE 超时破坏事件顺序 | 中 | 中 | 外层 try-catch，不影响内部流处理 |
| Cache API wrangler 未启用 | 中 | 高 | 提前在 `wrangler.toml` 添加 `cache_api_enabled = true` |
| 去重文件损坏 | 低 | 低 | 启动时验证 JSON 有效性，损坏则重建 |

---

*PM 文档版本: v1.0 | 编写日期: 2026-04-06 | Sprint: 2026-04-06*
