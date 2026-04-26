# Spec — E9: AI 设计评审 MCP 工具

## MCP 工具签名

```typescript
// packages/mcp-server/src/tools/reviewDesign.ts

interface DesignReviewReport {
  overall_score: number       // 0-100
  issues: DesignIssue[]
  suggestions: string[]
  compliance: {
    colors: boolean
    typography: boolean
    spacing: boolean
  }
}

interface DesignIssue {
  type: 'design-compliance' | 'a11y' | 'component-reuse' | 'security'
  severity: 'low' | 'medium' | 'high'
  description: string
  location?: string          // e.g. "Node: node-3/chapter: requirement"
}

// MCP tool definition
const reviewDesignTool: MCPTool = {
  name: 'review_design',
  description: 'Review Canvas design for DESIGN.md compliance, a11y, and component reuse',
  inputSchema: {
    type: 'object',
    properties: {
      canvasId: { type: 'string', description: 'Canvas flow ID to review' },
      spec: {
        type: 'object',
        description: 'Optional DesignSpec overrides',
        properties: {
          includeA11y: { type: 'boolean', default: true },
          includeReuse: { type: 'boolean', default: true }
        }
      }
    },
    required: ['canvasId']
  }
}
```

## 合规性检测规则

```typescript
// vibex-backend/src/lib/prompts/designCompliance.ts

interface ComplianceRules {
  // 颜色: 必须使用 CSS 变量，不接受硬编码 hex/rgba
  colors: {
    allowed: [/var\(--color-[^)]+\)/, 'transparent', 'inherit', 'currentColor'],
    forbidden: [/#([0-9a-fA-F]{3}){1,2}/, /rgba?\(/, /rgb\(/]
  }
  // 字体: 必须使用 CSS 变量
  typography: {
    allowed: [/var\(--font-[^)]+\)/, 'inherit'],
    forbidden: [/['"](?!var\(--font))/]  // 字面量字符串（非 var）
  }
  // 间距: 4px 基准网格
  spacing: {
    base: 4,  // px
    allowed: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96]
  }
}
```

## a11y 检测规则（无 LLM，纯规则）

```typescript
// vibex-backend/src/lib/prompts/a11yChecker.ts

interface A11yIssue {
  type: 'a11y'
  severity: 'high' | 'medium' | 'low'
  description: string
  location: string
  wcagRef?: string
}

const a11yRules = [
  {
    name: 'image-alt-missing',
    check: (node: CanvasNode) => {
      if (node.type === 'image' && !node.data.alt) {
        return { severity: 'high', description: `Image node "${node.data.label}" missing alt text`, wcagRef: 'WCAG 2.1 SC 1.1.1' }
      }
    }
  },
  {
    name: 'interactive-no-keyboard',
    check: (node: CanvasNode) => {
      if (['button', 'link', 'menu-item'].includes(node.type) && !node.data.keyboardHint) {
        return { severity: 'medium', description: `Interactive node "${node.data.label}" lacks keyboard operation hint`, wcagRef: 'WCAG 2.1 SC 2.1.1' }
      }
    }
  },
  {
    name: 'color-contrast',
    check: (node: CanvasNode) => {
      // 固定阈值: 4.5:1 (WCAG AA)
      // 检测前景/背景颜色组合，若无法解析则 skip
      const fg = parseColor(node.data.textColor)
      const bg = parseColor(node.data.backgroundColor)
      if (fg && bg) {
        const ratio = computeContrastRatio(fg, bg)
        if (ratio < 4.5) {
          return { severity: 'high', description: `Text contrast ${ratio.toFixed(1)}:1 below WCAG AA 4.5:1`, wcagRef: 'WCAG 2.1 SC 1.4.3' }
        }
      }
    }
  }
]
```

## 组件复用检测

```typescript
// vibex-backend/src/lib/prompts/componentReuse.ts

interface ReuseIssue {
  type: 'component-reuse'
  severity: 'low' | 'medium'
  description: string
  similarNodes: string[]
}

// 检测策略: 结构相似度（基于 node type + data keys）
// threshold: 0.7 相似度以上视为可合并
function detectSimilarNodes(flow: Flow): ReuseIssue[] {
  const issues: ReuseIssue[] = []
  const nodes = flow.nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = computeNodeSimilarity(nodes[i], nodes[j])
      if (similarity > 0.7) {
        issues.push({
          type: 'component-reuse',
          severity: 'low',
          description: `Nodes "${nodes[i].data.label}" and "${nodes[j].data.label}" have similar structure (${(similarity * 100).toFixed(0)}% match). Consider extracting a shared component.`,
          similarNodes: [nodes[i].id, nodes[j].id]
        })
      }
    }
  }
  return issues
}
```

## 依赖

- E6 `analyzeCodeSecurity` — 复用安全检测
- E7 `StructuredLogger` — 工具调用日志
- `vibex-backend/src/lib/prompts/code-review.ts` — 已存在，复用

## 错误处理

```typescript
async function reviewDesign(args: { canvasId: string }): Promise<DesignReviewReport> {
  try {
    const flow = loadFlow(args.canvasId)
    if (!flow) {
      return { overall_score: 0, issues: [], suggestions: [], compliance: { colors: false, typography: false, spacing: false }, error: `Canvas ${args.canvasId} not found` }
    }
    // ... 检测逻辑
  } catch (e) {
    logger.error('review_design failed', { error: e.message })
    return { overall_score: 0, issues: [], suggestions: [], compliance: { colors: false, typography: false, spacing: false }, error: e.message }
  }
}
```
