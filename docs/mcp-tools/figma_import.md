# `figma_import` MCP Tool

## Overview

| Property | Value |
|----------|-------|
| Name | `figma_import` |
| Status | `stable` |
| Category | Figma Integration |
| Rate Limit | 10 req/min |
| Since | v0.1.0 |

Imports design tokens, components, and styles from Figma. Extracts CSS custom properties, component props, and design metadata into VibeX canvas format.

## Input Schema

```typescript
{
  type: "object",
  required: ["projectId", "figmaUrl"],
  properties: {
    projectId: {
      type: "string",
      description: "VibeX project identifier"
    },
    figmaUrl: {
      type: "string",
      description: "Figma file or frame URL"
    },
    options: {
      type: "object",
      properties: {
        includeStyles: { type: "boolean", default: true },
        includeComponents: { type: "boolean", default: true },
        includeTokens: { type: "boolean", default: true },
        includeImages: { type: "boolean", default: false },
        maxDepth: { type: "number", default: 3, description: "Max frame nesting depth" }
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
    tokens: Array<{
      name: string;
      value: string;
      type: "color" | "spacing" | "typography" | "shadow" | "border";
      source: string;  // Figma node path
    }>;
    components: Array<{
      name: string;
      figmaId: string;
      props: Record<string, unknown>;
      frameUrl: string;
    }>;
    styles: Array<{
      name: string;
      type: string;
      value: string;
    }>;
    metadata: {
      totalTokens: number;
      totalComponents: number;
      totalStyles: number;
      importDurationMs: number;
    };
  }
}
```

## Error Responses

| Code | Condition | Recovery |
|------|-----------|----------|
| `INVALID_PARAMS` | Invalid Figma URL | Check URL format |
| `NOT_FOUND` | Figma file/frame not accessible | Check permissions |
| `RATE_LIMITED` | > 10 calls/min | Wait and retry |
| `TIMEOUT` | Import > 120s | Retry with maxDepth=1 |
| `UNAUTHORIZED` | No Figma API token | Set FIGMA_TOKEN env var |

## Examples

### Import Full Figma File

**Request:**
```json
{
  "name": "tools/call",
  "arguments": {
    "projectId": "proj-abc123",
    "figmaUrl": "https://www.figma.com/file/abc123/Design-System",
    "options": {
      "includeTokens": true,
      "includeComponents": true,
      "includeStyles": true
    }
  }
}
```

### Import Single Frame

**Request:**
```json
{
  "name": "tools/call",
  "arguments": {
    "projectId": "proj-abc123",
    "figmaUrl": "https://www.figma.com/file/abc123/Design-System?node-id=123:456",
    "options": {
      "includeTokens": true,
      "maxDepth": 2
    }
  }
}
```

## Token Extraction

### Color Tokens

Figma fills → CSS custom properties:
```
Figma: fill="#00ffff" → CSS: --color-primary: #00ffff
Figma: fill="#ffffff" opacity=0.8 → CSS: --color-overlay: rgba(255,255,255,0.8)
```

### Spacing Tokens

Figma auto-layout spacing → CSS custom properties:
```
Figma: spacing=16 → CSS: --spacing-md: 16px
Figma: spacing=8 → CSS: --spacing-sm: 8px
```

### Typography Tokens

Figma text styles → CSS custom properties:
```
Figma: "Heading 1/32 Bold" → CSS: --text-h1: 32px/1.2/700
```

## CLI Usage

```bash
# Set Figma token first
export FIGMA_TOKEN=figx_xxxx

# Import full file
mcp-tools figma-import \
  --project proj-abc \
  --figma https://figma.com/file/abc123/Design-System

# Import single frame
mcp-tools figma-import \
  --project proj-abc \
  --figma https://figma.com/file/abc123/Design-System?node-id=123:456 \
  --max-depth 2
```

## Testing

```bash
# Unit tests
pnpm vitest run src/utils/figmaParser.test.ts

# E2E tests (requires FIGMA_TOKEN)
FIGMA_TOKEN=figx_xxxx pnpm playwright test tests/e2e/figma-import.spec.ts
```
