# PRD: VibeX P0 Bug 修复包 2026-04-06

> **项目**: vibex-p0-fixes-20260406
> **目标**: 修复 5 个 P0/P1 Bug（OPTIONS CORS、Canvas checkbox、flowId、SSE 超时、test-notify 去重）
> **来源**: analysis.md (vibex-p0-fixes-20260406)
> **PRD 作者**: PM Agent
> **日期**: 2026-04-06
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
5 个 Bug 来自 `vibex-quickfix-20260405` 和 `pm proposals` 分析，部分在之前修复后回归或遗漏：

| Bug | 来源 | 优先级 | 工时 |
|-----|------|--------|------|
| OPTIONS 预检 CORS | pm proposals | P0 | 0.5h |
| Canvas checkbox 不生效 | pm proposals | P0 | 0.3h |
| flowId = unknown | pm proposals | P0 | 0.3h |
| SSE 超时 + 连接清理 | pm proposals | P1 | 1.5h |
| test-notify 去重 | pm proposals | P1 | 1h |
| **合计** | | | **3.6h** |

### 目标
- P0：修复 3 个阻塞性 Bug（OPTIONS CORS 500、checkbox 不生效、flowId unknown）
- P1：推进 2 个稳定性改进（SSE 超时、test-notify 去重）

### 成功指标
- AC1: `curl -X OPTIONS -I /v1/projects` 返回 204 + CORS headers
- AC2: Canvas checkbox 点击 → `selectedNodeIds` 正确更新
- AC3: `generate-components` 输出 `flowId` ≠ `unknown`
- AC4: SSE 流 10s 无响应自动关闭
- AC5: test-notify 5min 内重复调用 → 跳过发送

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | Bug 关联 |
|------|------|--------|------|----------|
| E1 | OPTIONS 预检 CORS 修复 | P0 | 0.5h | Bug 1 |
| E2 | Canvas Context checkbox 修复 | P0 | 0.3h | Bug 2 |
| E3 | generate-components flowId 修复 | P0 | 0.3h | Bug 3 |
| E4 | SSE 超时 + 连接清理 | P1 | 1.5h | Bug 4 |
| E5 | test-notify 去重 | P1 | 1h | Bug 5 |
| **合计** | | | **3.6h** | |

---

### Epic 1: OPTIONS 预检 CORS 修复

**问题根因**: `protected_.options` 在 `authMiddleware` 之后注册，预检被 401 拦截。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 调整 OPTIONS 注册顺序 | 0.3h | OPTIONS 返回 204 |
| S1.2 | 回归验证 | 0.2h | GET/POST/DELETE 不受影响 |

**S1.1 验收标准**:
- `expect(status).toBe(204)` for OPTIONS
- `expect(headers['Access-Control-Allow-Origin']).toBe('*')`
- `expect(status).not.toBe(401)` for OPTIONS

**S1.2 验收标准**:
- `expect(GET /v1/projects).toBeValidResponse()`
- `expect(DELETE /v1/xxx).toBeValidResponse()`

**DoD**:
- [ ] `gateway.ts` 中 `protected_.options` 在 `authMiddleware` 之前
- [ ] `curl -X OPTIONS -I /v1/projects` 返回 204
- [ ] GET/POST/DELETE 请求测试通过

---

### Epic 2: Canvas Context checkbox 修复

**问题根因**: `BoundedContextTree.tsx` checkbox `onChange` 绑定到 `toggleContextNode` 而非 `onToggleSelect`。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | checkbox onChange 修复 | 0.3h | selectedNodeIds 更新 |

**S2.1 验收标准**:
- `expect(onToggleSelect).toHaveBeenCalledWith(nodeId)`
- `expect(selectedNodeIds).toContain(nodeId)` after click
- `expect(toggleContextNode).not.toHaveBeenCalled()` for checkbox

**DoD**:
- [ ] `BoundedContextTree.tsx` checkbox `onChange` 改为 `onToggleSelect`
- [ ] 右击 `toggleContextNode` 仍正常工作
- [ ] 手动测试 checkbox 选择功能

---

### Epic 3: generate-components flowId 修复

**问题根因**: AI schema 缺少 `flowId` 字段，prompt 未要求输出。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | schema + prompt 修复 | 0.3h | flowId 不是 unknown |

**S3.1 验收标准**:
- `expect(component.flowId).toMatch(/^flow-/)`
- `expect(flowId).not.toBe('unknown')`
- API 响应包含有效 flowId

**DoD**:
- [ ] schema 添加 `flowId: string`
- [ ] prompt 明确要求 flowId 输出
- [ ] 测试验证 AI 输出包含 flowId

---

### Epic 4: SSE 超时 + 连接清理

**问题根因**: `aiService.chat()` 无超时，10s 无响应时 Worker 挂死；`cancel()` 未清理 `setTimeout`。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | AbortController 超时 | 0.5h | 10s 超时 |
| S4.2 | cancel() 清理 timers | 1h | 计时器清理 |

**S4.1 验收标准**:
- `expect(stream).toBeInstanceOf(ReadableStream)`
- 10s 无响应时 `controller.close()` 触发
- 前端收到流结束事件

**S4.2 验收标准**:
- `expect(clearTimeout).toHaveBeenCalled()` on cancel
- Worker 不挂死

**DoD**:
- [ ] `AbortController.timeout(10000)` 包装 aiService.chat
- [ ] ReadableStream.cancel() 清理所有 timers
- [ ] jest 测试覆盖

---

### Epic 5: test-notify 去重

**问题根因**: Python 版已有去重，JS 版遗漏。

**Story**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | 去重模块实现 | 0.5h | 5 分钟窗口 |
| S5.2 | 集成与测试 | 0.5h | 重复跳过 |

**S5.1 验收标准**:
- `expect(checkDedup(key).skipped).toBe(true)` within 5min
- 状态持久化到 `.dedup-cache.json`

**S5.2 验收标准**:
- `expect(webhookCalls).toBe(1)` for duplicate
- 5min 后重新发送

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
| F2.1 | checkbox onChange 修复 | E2 | expect(selectedNodeIds).toContain(nodeId) | 【需页面集成】 |
| F3.1 | flowId schema 修复 | E3 | expect(flowId).toMatch(/^flow-/) | 无 |
| F4.1 | AbortController 超时 | E4 | expect(timeout).toBe(10000) | 无 |
| F4.2 | cancel() 清理 | E4 | expect(clearTimeout).toHaveBeenCalled() | 无 |
| F5.1 | 去重模块 | E5 | expect(skipped).toBe(true) | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | OPTIONS 请求 | `/v1/projects` | 204 + CORS headers |
| AC2 | Canvas checkbox | 点击 | selectedNodeIds 更新 |
| AC3 | generate-components | AI 输出 | flowId 不是 unknown |
| AC4 | SSE 流 | 10s 无响应 | 流关闭，Worker 不挂死 |
| AC5 | test-notify | 5min 内重复 | 跳过发送 |

---

## 5. DoD (Definition of Done)

### E1: OPTIONS 预检 CORS 修复
- [ ] `gateway.ts` 路由顺序调整
- [ ] `curl -X OPTIONS -I /v1/projects` 返回 204
- [ ] GET/POST/DELETE 不受影响

### E2: Canvas Context checkbox 修复
- [ ] `BoundedContextTree.tsx` checkbox onChange 修复
- [ ] checkbox 选择功能测试通过
- [ ] toggleContextNode 不受影响

### E3: generate-components flowId 修复
- [ ] schema 添加 flowId
- [ ] prompt 明确要求
- [ ] AI 输出包含 flowId

### E4: SSE 超时 + 连接清理
- [ ] AbortController.timeout(10000)
- [ ] cancel() 清理 timers
- [ ] jest 测试通过

### E5: test-notify 去重
- [ ] dedup.js 模块
- [ ] 5 分钟去重窗口
- [ ] jest 测试通过

---

## 6. 实施计划

### Sprint 1 (P0, 1.1h)

| Epic | 内容 | 工时 |
|------|------|------|
| E1 | OPTIONS 预检 CORS 修复 | 0.5h |
| E2 | Canvas Context checkbox 修复 | 0.3h |
| E3 | generate-components flowId 修复 | 0.3h |

### Sprint 2 (P1, 2.5h)

| Epic | 内容 | 工时 |
|------|------|------|
| E4 | SSE 超时 + 连接清理 | 1.5h |
| E5 | test-notify 去重 | 1h |

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
| OPTIONS 修改破坏其他中间件 | 仅调整顺序，测试覆盖 GET/POST/DELETE |
| SSE 超时破坏事件顺序 | 外层 try-catch，不影响内部流处理 |
| 去重文件损坏 | 启动时验证 JSON 有效性，损坏则重建 |

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
