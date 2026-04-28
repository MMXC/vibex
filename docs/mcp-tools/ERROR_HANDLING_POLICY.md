# MCP Tool Error Handling Policy

## Overview

This document defines the standard error handling approach for all MCP tools in VibeX.

## Error Response Format

All MCP tools MUST return errors in this format:

```typescript
interface ToolError {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable description
    recoverable: boolean;    // Whether retry might succeed
    details?: unknown;       // Additional context (optional)
  };
  metadata?: {
    durationMs: number;
    timestamp: number;
  };
}
```

## Error Code Reference

### `INVALID_PARAMS` (Recoverable: Yes)

**Condition**: Request parameters fail validation.

**Examples**:
- Missing required field
- Wrong parameter type
- Value out of allowed range
- Malformed JSON

**Recovery Strategy**: Fix parameters and retry.

```typescript
{
  success: false,
  error: {
    code: "INVALID_PARAMS",
    message: "Missing required field: projectId",
    recoverable: true,
    details: { field: "projectId", expected: "string" }
  }
}
```

### `NOT_FOUND` (Recoverable: Yes)

**Condition**: Referenced resource does not exist.

**Examples**:
- Project ID not found
- Figma file not accessible
- Node ID doesn't exist
- Tool not registered

**Recovery Strategy**: Verify resource exists and permissions are correct.

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Figma file not accessible. Check URL and sharing permissions.",
    recoverable: true,
    details: { figmaUrl: "https://figma.com/file/xxx", httpStatus: 403 }
  }
}
```

### `RATE_LIMITED` (Recoverable: Yes)

**Condition**: Too many requests in short period.

**Recovery Strategy**: Implement exponential backoff.

```
Attempt 1: Wait 1s
Attempt 2: Wait 2s
Attempt 3: Wait 4s
Attempt 4: Wait 8s
Attempt 5: Give up and report
```

```typescript
{
  success: false,
  error: {
    code: "RATE_LIMITED",
    message: "Rate limit exceeded (5 req/min). Retry after 60s.",
    recoverable: true,
    details: { limit: 5, windowMs: 60000, retryAfterMs: 60000 }
  }
}
```

### `TIMEOUT` (Recoverable: Yes)

**Condition**: Operation exceeded maximum allowed time.

**Recovery Strategy**: Retry with smaller scope or fewer items.

```typescript
{
  success: false,
  error: {
    code: "TIMEOUT",
    message: "Design review exceeded 60s timeout. Try fewer tokens.",
    recoverable: true,
    details: { timeoutMs: 60000, itemsProcessed: 150 }
  }
}
```

### `UNAUTHORIZED` (Recoverable: Yes)

**Condition**: Authentication failed or token expired.

**Recovery Strategy**: Re-authenticate.

```typescript
{
  success: false,
  error: {
    code: "UNAUTHORIZED",
    message: "Figma token expired. Please refresh.",
    recoverable: true,
    details: { service: "figma", tokenType: "access_token" }
  }
}
```

### `INTERNAL_ERROR` (Recoverable: No)

**Condition**: Unexpected server-side failure.

**Recovery Strategy**: Report to engineering team. Do NOT retry immediately.

```typescript
{
  success: false,
  error: {
    code: "INTERNAL_ERROR",
    message: "Unexpected error during code generation.",
    recoverable: false
  }
}
```

### `UNSUPPORTED` (Recoverable: No)

**Condition**: Requested feature not implemented or node type not supported.

**Recovery Strategy**: Upgrade VibeX or use supported alternatives.

```typescript
{
  success: false,
  error: {
    code: "UNSUPPORTED",
    message: "Node type 'flowchart' is not supported. Use 'flowstep' instead.",
    recoverable: false,
    details: { requested: "flowchart", supported: ["flowstep", "component", "page"] }
  }
}
```

## Client-Side Retry Implementation

```typescript
async function callWithRetry<T>(
  tool: string,
  args: Record<string, unknown>,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await mcpClient.callTool(tool, args);

    if (response.success) return response.data as T;

    const { code, recoverable, details } = response.error;

    if (!recoverable) {
      throw new Error(`Non-recoverable error: ${code}`);
    }

    if (attempt === maxAttempts) {
      throw new Error(`Max retry attempts reached for ${tool}: ${code}`);
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error('Should not reach here');
}
```

## Server-Side Implementation Guidelines

1. **Always return consistent format**: Even for unexpected errors
2. **Set `recoverable` correctly**: Be conservative (prefer `true`)
3. **Include `details` for debugging**: Add context without leaking sensitive info
4. **Log all errors server-side**: Include request ID for tracing
5. **Set appropriate timeouts**: Don't let operations hang indefinitely

## Timeout Reference

| Tool | Max Timeout |
|------|-------------|
| `generate_code` | 30s |
| `review_design` | 60s |
| `figma_import` | 120s |
| `canvas_snapshot` | 10s |
| `canvas_restore` | 10s |

## Testing Error Handling

```typescript
describe('Error handling', () => {
  it('returns INVALID_PARAMS for missing projectId', async () => {
    const response = await callTool('generate_code', {});
    expect(response.success).toBe(false);
    expect(response.error.code).toBe('INVALID_PARAMS');
    expect(response.error.recoverable).toBe(true);
  });

  it('returns RATE_LIMITED with retry info', async () => {
    // Call 6 times rapidly (limit is 5)
    for (let i = 0; i < 5; i++) await callTool('generate_code', args);
    const response = await callTool('generate_code', args);
    expect(response.error.code).toBe('RATE_LIMITED');
    expect(response.error.details.retryAfterMs).toBeGreaterThan(0);
  });
});
```
