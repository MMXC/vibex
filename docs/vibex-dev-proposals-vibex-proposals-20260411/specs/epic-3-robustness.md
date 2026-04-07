# Spec: Epic 3 — 健壮性增强

**Epic**: E3  
**Project**: vibex-dev-proposals-vibex-proposals-20260411  
**Date**: 2026-04-11

---

## 1. Overview

增强 `connectionPool` 异常处理和 `ai-service` JSON 解析的健壮性，增加降级策略和熔断告警机制，提升系统在高压力场景下的稳定性。

---

## 2. Stories

### E3-S1: connectionPool 异常处理增强

**文件**: `src/services/websocket/connectionPool.ts`

**现状**:
```ts
// handleMessage catch 块
} catch (error) {
  console.error('Failed to handle message:', error);
}
```
- 无错误计数
- 无阈值告警
- 无熔断机制

**修改方案**:

```ts
// 添加错误计数状态
private messageErrorCount = 0;
private readonly ERROR_THRESHOLD = 5;

// handleMessage catch 块
} catch (error) {
  this.messageErrorCount++;
  logger.error('message_handle_failed', {
    error: String(error),
    connectionId: connectionId,
    errorCount: this.messageErrorCount,
    timestamp: Date.now(),
  });

  // 连续 N 次失败，触发 health check
  if (this.messageErrorCount >= this.ERROR_THRESHOLD) {
    logger.warn('health_check_triggered', {
      reason: 'message_error_threshold_exceeded',
      errorCount: this.messageErrorCount,
      connectionId,
    });
    this.triggerHealthCheck(connectionId);
    this.messageErrorCount = 0; // 重置计数
  }
}

// 新增 health check 方法
private triggerHealthCheck(connectionId: string) {
  this.emit('healthCheck', { connectionId, timestamp: Date.now() });
  // 可选：向监控服务发送告警
}
```

**错误计数重置**: 正常消息处理成功后重置 `this.messageErrorCount = 0`

**验收**:
```ts
// Given: handleMessage 连续失败 5 次
// When: 第 5 次 catch 执行
// Then: health check 被触发（logger.warn + emit('healthCheck')）
// Given: 第 6 次消息正常处理
// Then: errorCount 重置为 0
```

---

### E3-S2: ai-service JSON 解析降级策略

**文件**: `src/services/ai-service.ts`

**现状**:
```ts
async parseJSONWithRetry(content: string, retries = 1): Promise<any> {
  try {
    return JSON.parse(content);
  } catch (error) {
    if (retries > 0) return parseJSONWithRetry(content, retries - 1);
    throw error;
  }
}
```

**问题**:
1. AI 回复常有 markdown 包裹 JSON（` ```json ... ``` `）未被处理
2. 超长 token 未做截断兜底

**修改方案**:

```ts
async parseJSONWithRetry(content: string, retries = 1): Promise<any> {
  // Stage 1: 去除 markdown 包裹
  let cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Stage 2: 尝试解析
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Stage 3: 提取 JSON 对象（兼容单行/多行）
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through to retry
      }
    }

    // Stage 4: 重试
    if (retries > 0) {
      logger.warn('json_parse_retry', { retries, contentLength: cleaned.length });
      return parseJSONWithRetry(cleaned, retries - 1);
    }

    // Stage 5: token 截断兜底（最后手段）
    const maxTokens = 50000;
    if (cleaned.length > maxTokens) {
      logger.warn('json_content_truncated', { originalLength: cleaned.length, maxTokens });
      cleaned = cleaned.substring(0, maxTokens);
    }

    throw new Error(`JSON parse failed after retry: ${firstError.message}`);
  }
}
```

**验收**:
```ts
// Case 1: markdown 包裹
const md = '```json\n{"key": "value"}\n```';
expect(await parseJSONWithRetry(md)).toEqual({ key: "value" });

// Case 2: 普通 JSON
const plain = '{"a": 1}';
expect(await parseJSONWithRetry(plain)).toEqual({ a: 1 });

// Case 3: 嵌套 markdown（多层）
const nested = '```\n```json\n{"k": "v"}\n```\n```';
expect(await parseJSONWithRetry(nested)).toEqual({ k: "v" });

// Case 4: 超长内容截断
const long = '{"data": "' + 'x'.repeat(100000) + '"}';
expect(await parseJSONWithRetry(long)).resolves.toBeDefined(); // 不 throw
```

**回归测试覆盖**: 需在 `test/` 目录下新增 `ai-service.test.ts`，覆盖以上场景。

---

## 3. Technical Notes

- **E3-S1 阈值可配置**: `ERROR_THRESHOLD` 可通过环境变量 `CONNECTION_ERROR_THRESHOLD` 配置，默认 5
- **E3-S2 不改变原 API 签名**: `parseJSONWithRetry(content, retries?)` 返回类型不变
- **降级策略记录**: JSON 解析的所有降级路径均通过 `logger.warn` 记录，便于监控

---

## 4. Dependencies

- `src/lib/logger.ts` — 新增 `logger.warn` 调用
- 测试框架 — 需新增 `ai-service.test.ts` 回归测试
- 环境变量 — `CONNECTION_ERROR_THRESHOLD` 需在 `.env.example` 中注明
