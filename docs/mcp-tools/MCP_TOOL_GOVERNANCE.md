# MCP Tool Governance

## Overview

This document defines governance rules, naming conventions, and best practices for all MCP (Model Context Protocol) tools in the VibeX project.

## Tool Naming Conventions

### Format: `{domain}_{action}`

| Domain | Prefix | Examples |
|--------|--------|----------|
| Design | `design_` | `design_import`, `design_sync` |
| Code | `code_` | `code_generate`, `code_review` |
| Figma | `figma_` | `figma_import`, `figma_sync` |
| Canvas | `canvas_` | `canvas_snapshot`, `canvas_restore` |
| Collaboration | `collab_` | `collab_presence`, `collab_conflict` |

### Naming Rules

1. **Consistent verbs**: `generate`, `review`, `import`, `export`, `sync`
2. **No abbreviations**: Use full words (`generate_code`, not `gen_code`)
3. **Underscore separators**: `review_design`, not `review-design`
4. **Lowercase only**: All tool names lowercase
5. **Max 3 parts**: `domain_action_subaction` (e.g., `figma_import_tokens`)

## Tool Contract Schema

Every MCP tool MUST define:

```typescript
interface MCPTool {
  name: string;           // e.g., "generate_code"
  description: string;   // What it does (1-2 sentences)
  inputSchema: object;   // JSON Schema for parameters
  outputSchema: object;   // JSON Schema for response
  errorCodes: string[];  // Known error codes
  rateLimit?: number;     // calls per minute (if applicable)
}
```

## Input/Output Standards

### Input Schema Requirements

```typescript
{
  type: "object",
  required: ["projectId"],  // Always require projectId
  properties: {
    projectId: { type: "string" },
    // ... tool-specific params
  }
}
```

### Response Format

```typescript
interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  metadata?: {
    durationMs: number;
    timestamp: number;
  };
}
```

### Error Codes

| Code | Meaning | Recoverable |
|------|---------|------------|
| `INVALID_PARAMS` | Wrong parameters | Yes — retry with valid params |
| `NOT_FOUND` | Resource not found | Yes — check ID |
| `RATE_LIMITED` | Too many calls | Yes — backoff and retry |
| `TIMEOUT` | Operation timed out | Yes — retry with smaller scope |
| `UNAUTHORIZED` | Auth required or failed | Yes — re-authenticate |
| `INTERNAL_ERROR` | Unexpected server error | No — report to team |
| `UNSUPPORTED` | Feature not implemented | No — upgrade required |

## Tool Lifecycle Policy

1. **Draft**: Tool exists in code but not documented
2. **Alpha**: Documented but may break compatibility
3. **Stable**: Fully documented, backward compatible
4. **Deprecated**: Will be removed in future version
5. **Removed**: Deleted from codebase

### Stability Indicators

- `alpha` — Breaking changes possible
- `stable` — Semantic versioning respected
- `deprecated` — Use replacement tool instead

## Rate Limiting

| Tool Category | Default Limit |
|--------------|--------------|
| Read operations | 100 req/min |
| Write operations | 20 req/min |
| Heavy operations (code gen, design review) | 5 req/min |

## Versioning

Tools follow Semantic Versioning for their output schema:

- **Major**: Breaking changes to output format
- **Minor**: New optional fields added
- **Patch**: Bug fixes, no schema changes

## Security Policy

1. **No secrets in tools**: Credentials via environment, not parameters
2. **Audit logging**: All tool calls logged with user ID and timestamp
3. **Input validation**: All parameters validated against schema before execution
4. **Timeout enforcement**: All tools have max execution time

## Documentation Requirements

Every stable tool MUST have:

- [ ] `docs/mcp-tools/{tool_name}.md`
- [ ] Input schema documented with examples
- [ ] Output schema documented with examples
- [ ] Error codes and recovery strategies
- [ ] Rate limits documented
- [ ] Unit tests with > 80% coverage
- [ ] Integration tests for happy path
