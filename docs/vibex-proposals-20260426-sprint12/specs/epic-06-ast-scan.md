# Spec — E6: Prompts 安全 AST 扫描

**基于**: `vibex-architect-proposals-vibex-proposals-20260416/specs/epic-06-prompts-security-ast.md`

## 核心函数签名

```typescript
// 文件: vibex-backend/src/lib/prompts/analyzeCodeSecurity.ts

interface UnsafePattern {
  type: 'eval' | 'newFunction' | 'innerHTML' | 'setTimeout-string'
  node: BabelNode
  line: number
  column: number
}

interface SecurityAnalysisResult {
  hasUnsafe: boolean
  unsafePatterns: UnsafePattern[]
  confidence: number // 0-100
}

declare function analyzeCodeSecurity(code: string): SecurityAnalysisResult
```

## 危险模式检测规则

| 模式 | AST 节点类型 | 检测条件 |
|------|-------------|---------|
| eval | CallExpression | callee.name === 'eval' |
| new Function | NewExpression | callee.name === 'Function' |
| innerHTML | MemberExpression | property.name in ['innerHTML', 'outerHTML'] |
| setTimeout 字符串参数 | CallExpression | callee.name in ['setTimeout', 'setInterval'] AND arguments[1].type === 'StringLiteral' |

## Babel 解析失败 Fallback

```typescript
// 解析失败时返回
{
  hasUnsafe: false,
  unsafePatterns: [],
  confidence: 50
}
```

## 性能基准

- 5000 行代码 < 50ms
- 目标内存占用 < 50MB

## 集成点

- `vibex-backend/src/lib/prompts/code-review.ts` — 替换正则匹配
- `vibex-backend/src/lib/prompts/code-generation.ts` — 替换正则匹配

## 依赖

- `@babel/parser@^7.x` — npm，已在 backend 可用
- `@babel/traverse@^7.x` — npm
- `@babel/types@^7.x` — npm

## 验收测试用例

```typescript
describe('analyzeCodeSecurity', () => {
  it('detects eval', () => {
    expect(analyzeCodeSecurity('eval("x")').hasUnsafe).toBe(true)
  })
  it('detects new Function', () => {
    expect(analyzeCodeSecurity('new Function("return 1")').hasUnsafe).toBe(true)
  })
  it('passes safe code', () => {
    expect(analyzeCodeSecurity('const x = 1; return x').hasUnsafe).toBe(false)
  })
  it('detects innerHTML', () => {
    expect(analyzeCodeSecurity('element.innerHTML = "x"').hasUnsafe).toBe(true)
  })
  it('detects setTimeout string', () => {
    expect(analyzeCodeSecurity('setTimeout("alert(1)", 100)').hasUnsafe).toBe(true)
  })
  it('handles parse failure gracefully', () => {
    const result = analyzeCodeSecurity('// syntactically broken code }}}')
    expect(result.confidence).toBe(50)
    expect(result.hasUnsafe).toBe(false)
  })
  it('5000 lines < 50ms', () => {
    const code = generateLargeCode(5000)
    const start = Date.now()
    analyzeCodeSecurity(code)
    expect(Date.now() - start).toBeLessThan(50)
  })
  it('1000 samples < 1% false positive', () => {
    const samples = loadLegalSamples(1000)
    const results = samples.map(analyzeCodeSecurity)
    const fp = results.filter(r => r.hasUnsafe).length
    expect(fp / 1000).toBeLessThan(0.01)
  })
})
```
