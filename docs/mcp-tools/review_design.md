# `review_design` MCP Tool

## Overview

| Property | Value |
|----------|-------|
| Name | `review_design` |
| Status | `stable` |
| Category | Design Review |
| Rate Limit | 5 req/min |
| Since | v0.1.0 |

Performs automated design review against the VibeX design system. Checks design tokens, Figma imports, and UI components for compliance and accessibility.

## Input Schema

```typescript
{
  type: "object",
  required: ["projectId"],
  properties: {
    projectId: {
      type: "string",
      description: "Project identifier"
    },
    figmaUrl: {
      type: "string",
      description: "Figma file or frame URL (optional if designTokens provided)"
    },
    designTokens: {
      type: "array",
      description: "Design tokens to review (CSS custom properties, Figma tokens)"
    },
    checkTypes: {
      type: "array",
      description: "Types of checks to run",
      items: {
        type: "string",
        enum: ["compliance", "accessibility", "reuse", "performance"]
      },
      default: ["compliance", "accessibility"]
    },
    wcagLevel: {
      type: "string",
      enum: ["A", "AA", "AAA"],
      default: "AA"
    }
  }
}
```

## Output Schema

```typescript
{
  success: true,
  data: {
    compliance: Array<{
      id: string;
      severity: "critical" | "warning" | "info";
      category: "compliance";
      message: string;
      location?: string;
      wcagRef?: string;
    }>;
    accessibility: Array<{
      id: string;
      severity: "critical" | "warning" | "info";
      category: "accessibility";
      message: string;
      location?: string;
      wcagRef?: string;
    }>;
    reuse: Array<{
      id: string;
      message: string;
      priority: "high" | "medium" | "low";
      suggestion?: string;
    }>;
    summary: {
      totalIssues: number;
      critical: number;
      warning: number;
      info: number;
      reviewDurationMs: number;
      falsePositiveRate: number;
    };
  },
  metadata: {
    durationMs: number;
    timestamp: number;
    designSystemVersion: string;
  }
}
```

## Error Responses

| Code | Condition | Recovery |
|------|-----------|----------|
| `INVALID_PARAMS` | Missing tokens and URL | Provide tokens or URL |
| `NOT_FOUND` | Figma file not accessible | Check URL permissions |
| `TIMEOUT` | Review > 60s | Retry with fewer tokens |
| `RATE_LIMITED` | > 5 calls/min | Wait and retry |

## Issue Severity Levels

| Level | Meaning | Action Required |
|-------|---------|----------------|
| `critical` | Blocks accessibility (e.g., missing aria-label) | Fix immediately |
| `warning` | Design system violation | Fix before merge |
| `info` | Suggestion for improvement | Consider fixing |

## Examples

### Review Design Tokens

**Request:**
```json
{
  "name": "tools/call",
  "arguments": {
    "projectId": "proj-abc123",
    "designTokens": [
      { "name": "--color-primary", "value": "#00ffff" },
      { "name": "--spacing-md", "value": "16px" }
    ],
    "checkTypes": ["compliance", "accessibility"],
    "wcagLevel": "AA"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compliance": [
      {
        "id": "c1",
        "severity": "critical",
        "category": "compliance",
        "message": "Primary color #00ffff on white #ffffff fails WCAG AA contrast (2.8:1, required 4.5:1)",
        "location": "--color-primary"
      }
    ],
    "accessibility": [
      {
        "id": "a1",
        "severity": "critical",
        "category": "accessibility",
        "message": "Icon-only button missing aria-label",
        "location": "exportBtn",
        "wcagRef": "WCAG 2.1 SC 4.1.2"
      }
    ],
    "reuse": [
      {
        "id": "r1",
        "message": "Glassmorphism pattern (backdrop-filter) duplicated — extract to .glass utility",
        "priority": "medium"
      }
    ],
    "summary": {
      "totalIssues": 3,
      "critical": 2,
      "warning": 0,
      "info": 1,
      "reviewDurationMs": 1234,
      "falsePositiveRate": 0.0
    }
  }
}
```

## Design Checks

### Compliance Checks

- [ ] Token naming convention (`--{category}-{name}`)
- [ ] Token value syntax (valid CSS units)
- [ ] WCAG color contrast (AA minimum)
- [ ] Spacing scale consistency
- [ ] Typography scale hierarchy
- [ ] Shadow level consistency

### Accessibility Checks

- [ ] Interactive elements have accessible names
- [ ] Focus order is logical
- [ ] Color is not the only indicator of state
- [ ] Text has sufficient contrast
- [ ] Touch targets ≥ 44x44px
- [ ] No keyboard traps

### Reuse Checks

- [ ] Duplicate component patterns extracted
- [ ] Shared CSS extracted to utilities
- [ ] Icon components shared
- [ ] State management logic DRY

## CLI Usage

```bash
# Review design tokens from file
mcp-tools review-design --tokens ./tokens.json --wcag AA

# Review Figma frame
mcp-tools review-design --figma https://figma.com/file/xxx --wcag AA
```

## Testing

```bash
# Unit tests
pnpm vitest run src/utils/driftDetector.test.ts

# E2E tests
pnpm playwright test tests/e2e/design-review.spec.ts
```
