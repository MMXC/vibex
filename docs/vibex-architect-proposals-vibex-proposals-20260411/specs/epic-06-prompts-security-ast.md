# Spec: Epic 6 — Prompts 安全 AST 扫描

**Epic ID**: E6
**提案**: A-P2-2
**优先级**: P2
**工时**: 4h
**负责人**: Backend Dev

---

## 1. Overview

用 @babel/parser AST 解析替代 `lib/prompts/code-review.ts` 中的字符串正则匹配，精确检测 eval/new Function 等危险模式，降低误报率。

## 2. Scope

### In Scope
- `vibex-backend/src/lib/prompts/code-review.ts`
- `vibex-backend/src/lib/prompts/code-generation.ts`
- 新增安全分析工具函数

### Out of Scope
- 沙箱执行（Epic 独立评估，作为方案二）
- 其他 prompt 文件的安全分析

## 3. Technical Approach

采用**方案一：AST 解析替代字符串匹配**。

### 3.1 安全分析工具

```typescript
// vibex-backend/src/lib/security/codeAnalyzer.ts
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import type { Node } from '@babel/types'

interface SecurityReport {
  hasUnsafe: boolean
  unsafeEval: string[]
  unsafeNewFunction: string[]
  unsafeDynamicCode: string[]
  confidence: number  // 0-100，置信度
}

const DANGEROUS_PATTERNS = [
  'eval',
  'new Function',
  'setTimeout(code, 0)',
  'setInterval(code, 0)',
  'execScript',
  'importScripts',
]

function analyzeCodeSecurity(code: string): SecurityReport {
  const report: SecurityReport = {
    hasUnsafe: false,
    unsafeEval: [],
    unsafeNewFunction: [],
    unsafeDynamicCode: [],
    confidence: 100,
  }

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee

        // eval()
        if (callee.type === 'Identifier' && callee.name === 'eval') {
          report.unsafeEval.push(getSource(path.node))
          report.hasUnsafe = true
        }

        // new Function(...)
        if (
          callee.type === 'Identifier' &&
          callee.name === 'Function'
        ) {
          report.unsafeNewFunction.push(getSource(path.node))
          report.hasUnsafe = true
        }
      },

      // 字符串参数传入 setTimeout/setInterval
      CallExpression(path) {
        const callee = path.node.callee as any
        if (
          (callee.name === 'setTimeout' || callee.name === 'setInterval') &&
          path.node.arguments[0]?.type === 'StringLiteral'
        ) {
          report.unsafeDynamicCode.push(getSource(path.node))
          report.hasUnsafe = true
        }
      }
    })
  } catch (e) {
    report.confidence = 50  // 解析失败时降置信度
  }

  return report
}
```

### 3.2 集成到 code-review.ts

```typescript
import { analyzeCodeSecurity } from '../security/codeAnalyzer'

export async function analyzeCodeReview(request: CodeReviewRequest): Promise<CodeReviewResponse> {
  // 1. 原有 AI 分析
  const aiResult = await aiClient.complete(prompts.codeReview(request))

  // 2. 安全扫描（并行）
  const securityReport = analyzeCodeSecurity(request.code)

  // 3. 安全警告注入到结果
  if (securityReport.hasUnsafe) {
    aiResult.warnings.push({
      type: 'security',
      severity: 'high',
      message: `Dangerous patterns detected: ${securityReport.unsafeEval.join(', ')}`,
      confidence: securityReport.confidence
    })
  }

  return aiResult
}
```

## 4. File Changes

```
Added:
  vibex-backend/src/lib/security/codeAnalyzer.ts   (新建)
  vibex-backend/src/lib/security/__tests__/codeAnalyzer.test.ts

Modified:
  vibex-backend/src/lib/prompts/code-review.ts       (集成 AST 扫描)
  vibex-backend/src/lib/prompts/code-generation.ts   (集成 AST 扫描)
  vibex-backend/package.json                         (新增 @babel/parser, @babel/traverse, @babel/types)

Deleted:
  vibex-backend/src/lib/prompts/_regexSecurity.ts    (旧正则实现，移除)
```

## 5. Stories

| Story ID | 描述 | 工时 | 验收条件 |
|----------|------|------|---------|
| E6-S1 | @babel/parser AST 解析实现 | 2h | eval/new Function 精确检测 |
| E6-S2 | 误报率 <1% 测试集验证 | 1h | 1000 条合法代码样本误报率 <1% |
| E6-S3 | AST 解析性能验证 | 1h | 单文件解析 <50ms |

## 6. Acceptance Criteria

```typescript
// E6-S1
describe('analyzeCodeSecurity', () => {
  it('should detect eval()', () => {
    const report = analyzeCodeSecurity('eval("alert(1)")')
    expect(report.unsafeEval.length).toBeGreaterThan(0)
    expect(report.hasUnsafe).toBe(true)
  })

  it('should detect new Function()', () => {
    const report = analyzeCodeSecurity('new Function("return 1")')
    expect(report.unsafeNewFunction.length).toBeGreaterThan(0)
  })

  it('should not detect safe code as unsafe', () => {
    const report = analyzeCodeSecurity('const x = 1; return x * 2')
    expect(report.hasUnsafe).toBe(false)
  })
})

// E6-S2
it('should have false positive rate < 1%', () => {
  const falsePositives = safeCodeSamples
    .map(code => analyzeCodeSecurity(code))
    .filter(r => r.hasUnsafe).length
  const rate = falsePositives / safeCodeSamples.length
  expect(rate).toBeLessThan(0.01)
})

// E6-S3
it('should parse large file < 50ms', () => {
  const largeCode = generateLargeCodeFile(5000)  // 5000 行
  const start = Date.now()
  analyzeCodeSecurity(largeCode)
  expect(Date.now() - start).toBeLessThan(50)
})
```

## 7. Test Cases

| ID | 输入 | 预期输出 |
|----|------|---------|
| TC01 | `eval("x")` | hasUnsafe=true, unsafeEval=['eval("x")'] |
| TC02 | `new Function("return 1")` | hasUnsafe=true |
| TC03 | `const x = 1; x++` | hasUnsafe=false |
| TC04 | `setTimeout("code", 0)` | hasUnsafe=true |
| TC05 | 代码解析失败（语法错误） | confidence=50, hasUnsafe=false |

## 8. Edge Cases

- **Babel 解析失败**：某些 TypeScript/JSX 语法可能不完全支持，需添加 fallback
- **混淆代码**：`ev\x61l()` 等 Unicode 逃逸可能绕过 AST 检测（记录为 limitations）
- **依赖体积**：`@babel/parser` 包体积较大（~5MB），需确认 bundle size 限制

## 9. Definition of Done

- [ ] eval/new Function 检测精准
- [ ] 误报率 <1%（测试集验证）
- [ ] AST 解析性能 <50ms/文件
- [ ] 代码集成到 code-review.ts 和 code-generation.ts
- [ ] Lint + type-check 通过
- [ ] Code review 通过（≥1 reviewer）
