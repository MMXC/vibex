# Spec: Epic 1 — 日志基础设施治理

**Epic**: E1  
**Project**: vibex-dev-proposals-vibex-proposals-20260411  
**Date**: 2026-04-11

---

## 1. Overview

将 `vibex-backend` 中的非结构化日志（`console.log`、`console.error`、`devDebug`）统一替换为结构化 `logger`，使日志输出符合生产可观测性标准，支持 `LOG_LEVEL` 环境变量控制。

---

## 2. Stories

### E1-S1: connectionPool.ts console.log → logger

**文件**: `src/services/websocket/connectionPool.ts`

**现状**:
```ts
// :66
console.log(`Connection added: ${connection.id}, total: ${this.connections.size}`);
// :77
console.log(`Connection removed: ${connectionId}, remaining: ${this.connections.size}`);
// :182
console.log(`Connection timeout: ${id}, last heartbeat: ${timeSinceHeartbeat}ms ago`);
// :224
console.log('Connection pool stopped');
```

**修改为**:
```ts
import { logger } from '@/lib/logger';

logger.info('connection_added', {
  connectionId: connection.id,
  total: this.connections.size,
  timestamp: Date.now(),
});

logger.info('connection_removed', {
  connectionId,
  remaining: this.connections.size,
  timestamp: Date.now(),
});

logger.warn('connection_timeout', {
  connectionId: id,
  lastHeartbeatMs: timeSinceHeartbeat,
  timestamp: Date.now(),
});

logger.info('connection_pool_stopped', { timestamp: Date.now() });
```

**验收**:
- `expect(logger.info).toHaveBeenCalledWith('connection_added', expect.objectContaining({ connectionId, total }))`
- 无 `console.log` 输出到 stdout

---

### E1-S2: devDebug 统一为 logger.debug

**涉及文件**:
- `src/routes/plan.ts` — 行 112, 249-251
- `src/routes/ddd.ts` — 行 60, 209-211
- `src/routes/ai-design-chat.ts` — 约 14 处

**现状**:
```ts
devDebug('AI request params:', params);
devDebug('AI response:', response);
```

**修改为**:
```ts
import { logger } from '@/lib/logger';

// 替换为
logger.debug('ai_request_params', { params });
logger.debug('ai_response', { response });
```

**LOG_LEVEL 控制**: `logger.debug` 仅在 `LOG_LEVEL=debug` 时输出，`LOG_LEVEL=info` 时静默。

**验收**:
- `LOG_LEVEL=info` → devDebug 位置无输出
- `LOG_LEVEL=debug` → `logger.debug` 被调用
- 无新增 `devDebug` 调用

---

### E1-S3: 路由 console.error 结构化

**涉及文件**:
- `src/routes/live-preview.ts`
- `src/routes/prototype-preview.ts`

**现状**:
```ts
console.error('Error starting live preview:', error);
```

**修改为**:
```ts
import { logger } from '@/lib/logger';

logger.error('live_preview_start_failed', {
  error: String(error),
  projectId,
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: Date.now(),
});
```

**验收**:
- 所有 9 处 `console.error` 已替换
- 每条日志含 `error`、`projectId`、`timestamp` 字段
- 无裸 `console.error` 遗留

---

## 3. Technical Notes

- 不改变 `src/lib/logger.ts` 的导出签名（向后兼容）
- 新增 `logger.debug` 需确认现有 `LOG_LEVEL` 支持 `debug` 值
- 批量替换使用正则辅助：`grep -rn "console\.\(log\|error\)" src/` 生成 diff，人工逐文件 review
- 每个 Story 独立 commit，便于回滚

---

## 4. Dependencies

- `src/lib/logger.ts` — 确认 `info`/`warn`/`error`/`debug` 接口稳定
- 环境变量 `LOG_LEVEL` — 需在 `.env.example` 中注明可用值
