# Architecture: vibex-dev-proposals — Backend 开发改进

**项目**: vibex-dev-proposals-20260411
**阶段**: design-architecture
**Architect**: Architect
**日期**: 2026-04-07

---

## 1. 技术方案

### 1.1 日志基础设施

**Logger 接口设计**（基于现有 canvasLogger）:
```typescript
// src/lib/logger.ts
interface LogContext {
  projectId?: string;
  errorMsg?: string;
  userId?: string;
  [key: string]: unknown;
}

interface Logger {
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
}
```

**devDebug 统一模式**:
```typescript
// 替换前
devDebug('something');

// 替换后
const devDebug = process.env.LOG_LEVEL === 'debug'
  ? (msg: string) => logger.debug(msg)
  : () => {};
```

### 1.2 ai-service JSON 降级

```typescript
// src/lib/ai-service.ts
function parseJSONWithRetry(raw: string): unknown {
  // 方案 A: 直接解析
  try {
    return JSON.parse(raw);
  } catch {}

  // 方案 B: 提取 markdown 包裹的 JSON
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }

  // 方案 C: 提取裸 JSON
  const bareMatch = raw.match(/\{[\s\S]*\}/);
  if (bareMatch) {
    try {
      return JSON.parse(bareMatch[0]);
    } catch {}
  }

  // 兜底: token 截断 + warn
  logger.warn('JSON parse failed, returning empty object', { raw: raw.slice(0, 100) });
  return {};
}
```

### 1.3 ConnectionPool 熔断

```typescript
// src/lib/websocket/connectionPool.ts
interface ConnectionPool {
  errorCount: number;
  readonly ERROR_THRESHOLD = 5;
  readonly CIRCUIT_RESET_MS = 60000;

  handleMessage(connection: Connection, message: unknown): void {
    try {
      // ... 正常处理
      this.errorCount = 0;
    } catch (err) {
      this.errorCount++;
      logger.error('Message handling failed', { connectionId: connection.id, error: err });
      if (this.errorCount >= this.ERROR_THRESHOLD) {
        this.triggerHealthCheck();
      }
    }
  }
}
```

---

## 2. 模块划分

```
vibex-backend/
  src/
    lib/
      logger.ts           # 结构化日志（新增）
      websocket/
        connectionPool.ts  # 熔断逻辑
      ai-service.ts       # JSON 降级
    app/api/
      v1/projects/[id]/snapshots/route.ts  # 真实化
      v1/live-preview/route.ts             # console.error 替换
      v1/prototype-preview/route.ts        # console.error 替换
```

---

## 3. 风险评估

| 风险 | 等级 | 缓解 |
|------|------|------|
| logger 引入性能开销 | 低 | dev 模式才输出，prod 无 overhead |
| JSON 降级误解析 | 低 | 三级降级 + warn 日志兜底 |
| connectionPool 熔断误触发 | 低 | 阈值 5 次，连续失败才触发 |

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-dev-proposals-20260411
- **执行日期**: 2026-04-07
