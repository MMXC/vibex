# `generate_code` MCP Tool

## Overview

| Property | Value |
|----------|-------|
| Name | `generate_code` |
| Status | `stable` |
| Category | Code Generation |
| Rate Limit | 5 req/min |
| Since | v0.1.0 |

Generates production-ready code from canvas node definitions. Supports React, Vue, and Solid.

## Input Schema

```typescript
{
  type: "object",
  required: ["projectId", "nodes", "framework"],
  properties: {
    projectId: {
      type: "string",
      description: "Project identifier"
    },
    nodes: {
      type: "array",
      description: "Canvas nodes to generate code for",
      items: {
        type: "object",
        required: ["id", "type", "name"],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["component", "flowstep", "apientrypoint", "statemachine", "page"]
          },
          name: { type: "string" },
          // Type-specific props
          props?: Record<string, unknown>;
          framework?: "react" | "vue" | "solid";
        }
      }
    },
    framework: {
      type: "string",
      enum: ["react", "vue", "solid"],
      description: "Target framework"
    },
    options: {
      type: "object",
      properties: {
        typescript: { type: "boolean", default: true },
        prettier: { type: "boolean", default: true },
        testFiles: { type: "boolean", default: false },
      }
    }
  }
}
```

## Output Schema

```typescript
{
  success: true,
  data: {
    files: Array<{
      path: string;       // e.g., "src/components/Button.tsx"
      content: string;     // Full file content
      language: "typescript" | "javascript";
    }>;
    summary: {
      totalFiles: number;
      componentsGenerated: number;
      generationDurationMs: number;
    };
  },
  metadata: {
    durationMs: number;
    timestamp: number;
    framework: string;
  }
}
```

## Error Responses

| Code | Condition | Recovery |
|------|-----------|----------|
| `INVALID_PARAMS` | Missing required fields | Fix input parameters |
| `NOT_FOUND` | Unknown node type | Check node.type values |
| `RATE_LIMITED` | > 5 calls/min | Wait 60s and retry |
| `TIMEOUT` | > 30s generation | Retry with fewer nodes |

## Examples

### Generate React Button Component

**Request:**
```json
{
  "name": "tools/call",
  "arguments": {
    "projectId": "proj-abc123",
    "nodes": [
      {
        "id": "node-1",
        "type": "component",
        "name": "PrimaryButton",
        "props": {
          "label": "string",
          "onClick": "() => void",
          "variant": "primary | secondary"
        }
      }
    ],
    "framework": "react"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "path": "src/components/PrimaryButton.tsx",
        "content": "export function PrimaryButton({ label, onClick, variant = 'primary' }: ButtonProps) { ... }",
        "language": "typescript"
      }
    ],
    "summary": {
      "totalFiles": 1,
      "componentsGenerated": 1,
      "generationDurationMs": 234
    }
  }
}
```

## Node Type Support

| Node Type | Supported | Notes |
|-----------|-----------|-------|
| `component` | ✅ | Generates React/Vue/Solid component |
| `flowstep` | ✅ | Generates FlowStep with pre/post conditions |
| `apientrypoint` | ✅ | Generates API endpoint handler |
| `statemachine` | ✅ | Generates state machine with XState |
| `page` | ✅ | Generates page component with routing |

## CLI Usage

```bash
# Via MCP server
mcp-tools generate --project proj-abc --nodes @canvas/nodes.json --framework react

# Via npx
npx @vibex/mcp-tools generate-code \
  --project proj-abc \
  --nodes ./nodes.json \
  --framework react \
  --output ./generated
```

## Testing

```bash
# Unit tests
pnpm vitest run src/lib/codeGenerator.test.ts

# E2E tests
pnpm playwright test tests/e2e/code-gen.spec.ts
```
