# Dev Proposals: vibex-backend 改进提案
**项目**: vibex-dev-proposals-vibex-proposals-20260411  
**产出时间**: 2026-04-11  
**扫描范围**: backend (vibex-backend/src/)

---

## Proposal #1: 日志污染治理 — 移除生产环境 console.log (P0)

### 严重程度: P0 (Bug/生产风险)

### 问题描述
`vibex-backend/src/services/websocket/connectionPool.ts` 中存在 4 处 `console.log`，在生产环境会：
- 泄露连接 ID 等敏感信息到 stdout
- 污染日志聚合系统
- 无结构化字段，无法被日志服务解析

```ts
// connectionPool.ts:66
console.log(`Connection added: ${connection.id}, total: ${this.connections.size}`);
// connectionPool.ts:77
console.log(`Connection removed: ${connectionId}, remaining: ${this.connections.size}`);
// connectionPool.ts:182
console.log(`Connection timeout: ${id}, last heartbeat: ${timeSinceHeartbeat}ms ago`);
// connectionPool.ts:224
console.log('Connection pool stopped');
```

### 修复方案
将所有 `console.log` 替换为项目已有的 `logger`（`src/lib/logger.ts`），示例：
```ts
import { logger } from '@/lib/logger';
logger.info('connection_added', { connectionId: connection.id, total: this.connections.size });
```

---

## Proposal #2: devDebug 治理 — 统一为结构化日志 (P1)

### 严重程度: P1 (代码质量)

### 问题描述
多个路由文件使用 `devDebug` 打印调试信息：
- `routes/plan.ts:112,249-251` — AI 调用参数和结果
- `routes/ddd.ts:60,209-211` — DDD 域模型生成
- `routes/ai-design-chat.ts` (14 处 devDebug)

这些调试信息在生产环境应该关闭或结构化。

### 修复方案
统一使用 `logger.debug()` 替代 `devDebug`，按 `LOG_LEVEL=debug|info|warn|error` 环境变量控制。

---

## Proposal #3: TODO 清理 — 消除技术债务 (P1)

### 严重程度: P1 (技术债务)

### 问题描述
共发现 **6 个 TODO** 分散在多个关键路由中：

| 文件 | 行号 | 内容 |
|------|------|------|
| `routes/project-snapshot.ts` | 47,60,63,66,69 | 5个 TODO：快照接口返回假数据（应查真实表） |
| `routes/clarification-questions.ts` | 53 | indexed lookup 实现 |
| `routes/diagnosis.ts` | 54 | 缓存检测 |
| `routes/business-domain.ts` | 308,398,437 | D1 不可用时跳过的 DB 操作（已有 console.log） |
| `services/prompts/flow-execution.ts` | 792 | 流程执行未实现 |

### 修复方案
按优先级：
- **P0**: `project-snapshot.ts` — 返回真实数据（涉及 5 个 TODO）
- **P1**: `clarification-questions.ts` — 添加索引查询
- **P2**: `diagnosis.ts` — 添加缓存检测逻辑
- **P3**: `business-domain.ts` — console.log 改为结构化日志

---

## Proposal #4: 路由层 console.error 统一日志格式 (P2)

### 严重程度: P2 (可维护性)

### 问题描述
`live-preview.ts` 和 `prototype-preview.ts` 中有 9 处 `console.error`，缺乏结构：
```ts
console.error('Error starting live preview:', error);
```
应改为：
```ts
logger.error('live_preview_start_failed', { error: String(error), projectId, ... });
```

### 修复方案
将所有 `console.error` 替换为 `logger.error`，统一添加 context 字段。

---

## Proposal #5: 移除遗留 debug 路径 (P2)

### 严重程度: P2 (安全/可维护性)

### 问题描述
`vibex-backend/src/services/` 目录下存在 `.backup-20260315235610` 备份文件：
- `llm-provider.ts.backup-20260315235610` (32KB)

### 修复方案
删除遗留备份文件，备份应通过 git tag 或 dedicated backup 工具管理。

---

## Proposal #6: connectionPool.ts 异常处理增强 (P1)

### 严重程度: P1 (Bug/健壮性)

### 问题描述
`connectionPool.ts` 中 `handleMessage` 的 catch 块只打印错误，不做告警或熔断：
```ts
} catch (error) {
  console.error('Failed to handle message:', error);
}
```
高频错误场景下会持续打日志但不触发告警。

### 修复方案
添加错误计数和阈值告警：
- 连续 N 次错误 → 触发 health check
- 错误超过阈值 → 向监控服务发送告警

---

## Proposal #7: ai-service.ts JSON 解析降级策略 (P1)

### 严重程度: P1 (Bug/健壮性)

### 问题描述
`ai-service.ts` 中 `parseJSONWithRetry` 只重试 1 次，重试后仍失败则直接 throw。但 AI 回复中偶有 markdown 包裹 JSON（如 ` ```json ... ``` `）的情况未被处理。

### 修复方案
在重试前添加 markdown JSON 提取：
```ts
content = content.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
```
并在 `parseJSONWithRetry` 中增加最大 token 截断兜底。

---

## 扫描摘要

| 类别 | 数量 | 严重程度 |
|------|------|---------|
| console.log (生产代码) | 4 | P0 |
| devDebug 调用 | ~20+ | P1 |
| console.error (无结构) | 9 | P2 |
| TODO | 6 | P1-P2 |
| 遗留备份文件 | 1 | P2 |
| 异常处理不足 | 2 | P1 |
| JSON 解析边界 | 1 | P1 |
| **合计** | **43+** | |

**关键发现**：
1. `websocket/connectionPool.ts` — console.log 污染最严重，需立即处理
2. `project-snapshot.ts` — 5个TODO，全部是假数据返回，影响核心功能正确性
3. AI 服务 JSON 解析有边界条件漏洞，高频影响 AI 生成流程
