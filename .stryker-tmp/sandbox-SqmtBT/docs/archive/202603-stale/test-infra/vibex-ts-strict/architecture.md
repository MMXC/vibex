# Architecture: TypeScript Strict 模式迁移

**项目**: vibex-ts-strict  
**版本**: 1.0  
**日期**: 2026-03-19

---

## 1. Tech Stack

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 语言 | TypeScript 5.x | 现有版本 |
| 检查 | tsc --strict | 内置严格模式 |
| CI | GitHub Actions | 现有基础设施 |

---

## 2. 迁移策略

```mermaid
flowchart LR
    A[当前状态] --> B[启用 strict]
    B --> C[逐步修复]
    C --> D[CI 集成]
    D --> E[持续监控]
```

---

## 3. tsconfig.json 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

---

## 4. 修复优先级

| 优先级 | 问题类型 | 修复方式 |
|--------|----------|----------|
| P0 | as any | 替换为具体类型 |
| P1 | null/undefined | 可选链/默认值 |
| P2 | 函数类型 | 明确参数类型 |

---

## 5. CI 集成

```yaml
# .github/workflows/type-check.yml
name: Type Check
on: [push, pull_request]
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run type-check
```

---

## 6. 验收标准

| 标准 | 验证方式 |
|------|----------|
| tsc --strict 无 error | CLI 检查 |
| as any < 10 | grep 统计 |
| CI 类型检查通过 | CI 日志 |

---

*Architecture - 2026-03-19*
