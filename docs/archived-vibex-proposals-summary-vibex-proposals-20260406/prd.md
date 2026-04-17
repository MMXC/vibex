# PRD: VibeX Proposals 2026-04-06

> **项目**: vibex-dev-proposals-vibex-proposals-20260406  
> **目标**: 基于 6 个 Agent 提案，汇总 P0/P1 修复项  
> **来源**: proposals/20260406/ (analyst, architect, pm, tester, reviewer)  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-06  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
2026-04-05 完成 5 个 Bug 修复任务，6 个 Agent 提案汇总出 3 个 P0 修复项需要推进。

### 提案来源
| Agent | 提案数 | P0 | P1 |
|-------|--------|-----|-----|
| analyst | 6 | 3 | 3 |
| architect | 4 | 2 | 2 |
| pm | 5 | 3 | 2 |
| tester | 4 | 3 | 1 |
| reviewer | 4 | 2 | 2 |
| **合计** | **23** | **13** | **10** |

### 目标
- P0: 修复 3 个阻塞性 Bug（OPTIONS、Ctx Selection、flowId）
- P1: 推进 3 个稳定性改进（SSE 超时、限流、去重）

### 成功指标
- AC1: OPTIONS 预检返回 204 + CORS headers
- AC2: Canvas checkbox 多选功能可用
- AC3: generate-components 输出正确 flowId
- AC4: SSE 流 10s 超时
- AC5: 限流跨 Worker 一致
- AC6: test-notify 5 分钟去重

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 提案来源 |
|------|------|--------|------|----------|
| E1 | OPTIONS 预检路由修复 | P0 | 0.5h | A-P0-1, P001, T-P0-1, R-P0-1 |
| E2 | Canvas Context 多选修复 | P0 | 0.3h | A-P0-2, P002, T-P0-2, R-P0-2 |
| E3 | generate-components flowId | P0 | 0.3h | A-P0-3, P003, T-P0-3 |
| E4 | SSE 超时 + 连接清理 | P1 | 1.5h | A-P1-1, A-P0-2, P005 |
| E5 | 分布式限流 | P1 | 1.5h | A-P1-2, P005 |
| E6 | test-notify 去重 | P1 | 1h | A-P1-3, P004, T-P1-1 |
| **合计** | | | **5.1h** | |

---

### Epic 1: OPTIONS 预检路由修复

**问题根因**: `protected_.options` 在 `authMiddleware` 之后注册，预检被 401 拦截。

**提案引用**: A-P0-1, P001, T-P0-1, R-P0-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 调整 OPTIONS handler 注册顺序 | 0.3h | OPTIONS 返回 204 |
| S1.2 | 回归验证 | 0.2h | GET 不受影响 |

**S1.1 验收标准**:
- `expect(OPTIONS.status).toBe(204)` ✓
- `expect(headers['Access-Control-Allow-Origin']).toBe('*')` ✓
- `expect(status).not.toBe(401)` for OPTIONS ✓

**S1.2 验收标准**:
- `expect(GET.status).toBe(200 or 401)` 不受修复影响 ✓

**DoD**:
- [ ] `gateway.ts` 中 `protected_.options` 在 `authMiddleware` 之前
- [ ] `curl -X OPTIONS -I /v1/projects` 返回 204
- [ ] GET 请求测试通过

---

### Epic 2: Canvas Context 多选修复

**问题根因**: `BoundedContextTree.tsx` checkbox 调用 `toggleContextNode` 而非 `onToggleSelect`。

**提案引用**: A-P0-2, P002, T-P0-2, R-P0-2

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | checkbox onChange 修复 | 0.3h | 见下方 |

**S2.1 验收标准**:
- `expect(onToggleSelect).toHaveBeenCalledWith(nodeId)` ✓
- 点击 checkbox → selectedNodeIds 更新 ✓
- `expect(toggleContextNode).not.toHaveBeenCalled()` ✓

**DoD**:
- [ ] `BoundedContextTree.tsx` checkbox `onChange` 改为 `onToggleSelect`
- [ ] 手动测试 checkbox 选择功能
- [ ] 回归验证 toggleContextNode 不受影响

---

### Epic 3: generate-components flowId

**问题根因**: AI schema 缺少 `flowId`，prompt 未要求输出。

**提案引用**: A-P0-3, P003, T-P0-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | schema + prompt 修复 | 0.3h | flowId 不再是 unknown |

**S3.1 验收标准**:
- `expect(component.flowId).toMatch(/^flow-/)` ✓
- `expect(flowId).not.toBe('unknown')` ✓

**DoD**:
- [ ] schema 添加 `flowId: string`
- [ ] prompt 明确要求 flowId 输出
- [ ] 测试验证 AI 输出包含 flowId

---

### Epic 4: SSE 超时 + 连接清理

**问题根因**: `aiService.chat()` 无超时，`setTimeout` 未在 `cancel()` 中清理。

**提案引用**: A-P1-1, A-P0-2, P005

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | AbortController 超时 | 0.5h | 10s 超时 |
| S4.2 | cancel() 清理 | 1h | 计时器清理 |

**S4.1 验收标准**:
- `expect(stream).toBeInstanceOf(ReadableStream)` ✓
- 10s 无响应时 `controller.close()` ✓

**S4.2 验收标准**:
- `expect(clearTimeout).toHaveBeenCalled()` on cancel ✓

**DoD**:
- [ ] `AbortController.timeout(10000)` 包装 aiService.chat
- [ ] ReadableStream.cancel() 清理所有 timers
- [ ] jest 测试覆盖

---

### Epic 5: 分布式限流

**问题根因**: 内存 Map 跨 Worker 不共享，限流失效。

**提案引用**: A-P1-2, P005

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | Cache API 替代 | 1h | 使用 caches.default |
| S5.2 | 集成测试 | 0.5h | 多 Worker 一致 |

**S5.1 验收标准**:
- `expect(caches.default.match(key)).toBeDefined()` ✓
- 并发 100 请求 → 限流一致 ✓

**DoD**:
- [ ] `rateLimit.ts` 使用 `caches.default`
- [ ] 保留原有接口
- [ ] wrangler 配置 Cache API

---

### Epic 6: test-notify 去重

**问题根因**: JS 版缺少 5 分钟去重，Python 版已有。

**提案引用**: A-P1-3, P004, T-P1-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | 去重模块 | 0.5h | 5 分钟窗口 |
| S6.2 | 集成 | 0.5h | 重复跳过 |

**S6.1 验收标准**:
- `expect(checkDedup(key).skipped).toBe(true)` within 5min ✓
- 状态持久化到 `.dedup-cache.json` ✓

**S6.2 验收标准**:
- `expect(webhookCalls).toBe(1)` for duplicate ✓

**DoD**:
- [ ] `dedup.js` 实现 `checkDedup()` 和 `recordSend()`
- [ ] 与 `test-notify.js` 集成
- [ ] jest 测试通过

---

## 3. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | OPTIONS 路由顺序 | E1 | expect(status).toBe(204) | 无 |
| F1.2 | OPTIONS 回归验证 | E1 | expect(GET).not.toBe(500) | 无 |
| F2.1 | checkbox onChange 修复 | E2 | expect(onToggleSelect).toHaveBeenCalled() | 【需页面集成】 |
| F3.1 | flowId schema 修复 | E3 | expect(flowId).toMatch(/^flow-/) | 无 |
| F4.1 | AbortController 超时 | E4 | expect(timeout).toBe(10000) | 无 |
| F4.2 | cancel() 清理 | E4 | expect(clearTimeout).toHaveBeenCalled() | 无 |
| F5.1 | Cache API 限流 | E5 | expect(caches.default).toBeDefined() | 无 |
| F6.1 | 去重模块 | E6 | expect(skipped).toBe(true) | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | OPTIONS 请求 | `/v1/projects` | 204 + CORS headers |
| AC2 | Canvas checkbox | 点击 | selectedNodeIds 更新 |
| AC3 | generate-components | AI 输出 | flowId 不是 unknown |
| AC4 | SSE 流 | 10s 无响应 | 流关闭，Worker 不挂死 |
| AC5 | 限流 | 100 并发 | 计数一致，后续 429 |
| AC6 | test-notify | 5min 内重复 | 跳过发送 |

---

## 5. DoD (Definition of Done)

### E1: OPTIONS 预检路由修复
- [ ] `gateway.ts` 路由顺序调整
- [ ] `curl -X OPTIONS -I /v1/projects` 返回 204
- [ ] GET/POST 不受影响

### E2: Canvas Context 多选修复
- [ ] `BoundedContextTree.tsx` checkbox onChange 修复
- [ ] checkbox 选择功能测试通过
- [ ] toggleContextNode 不受影响

### E3: generate-components flowId
- [ ] schema 添加 flowId
- [ ] prompt 明确要求
- [ ] AI 输出包含 flowId

### E4: SSE 超时 + 连接清理
- [ ] AbortController.timeout(10000)
- [ ] cancel() 清理 timers
- [ ] jest 测试通过

### E5: 分布式限流
- [ ] Cache API 替代内存 Map
- [ ] 限流接口不变
- [ ] 多 Worker 测试通过

### E6: test-notify 去重
- [ ] dedup.js 模块
- [ ] 5 分钟去重窗口
- [ ] jest 测试通过

---

## 6. 实施计划

### Sprint 1 (P0 优先，1.1h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | OPTIONS 预检路由修复 | 0.5h |
| E2 | Canvas Context 多选修复 | 0.3h |
| E3 | generate-components flowId | 0.3h |

### Sprint 2 (P1 改进，4h)
| Epic | 内容 | 工时 |
|------|------|------|
| E4 | SSE 超时 + 连接清理 | 1.5h |
| E5 | 分布式限流 | 1.5h |
| E6 | test-notify 去重 | 1h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 修改不引入额外延迟 |
| 兼容性 | 不破坏现有功能 |
| 可观测性 | Health Check 支持监控 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| OPTIONS 修改破坏其他中间件 | 仅调整顺序，测试覆盖 |
| SSE 超时破坏事件顺序 | 外层 try-catch，不影响内部 |
| 限流 Cache API 部署配置 | wrangler 默认启用 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
