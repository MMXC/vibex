# AGENTS.md - TypeScript Strict 模式迁移

**项目**: vibex-ts-strict  
**版本**: 1.0  
**日期**: 2026-03-19

---

## 1. 开发命令

### 1.1 类型检查

```bash
# 进入项目目录
cd /root/.openclaw/vibex/vibex-fronted

# 运行 TypeScript 类型检查
npm run type-check

# 或直接运行 tsc
npx tsc --noEmit
```

### 1.2 严格模式检查

```bash
# 运行严格模式检查
npx tsc --strict --noEmit
```

### 1.3 构建

```bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
```

---

## 2. 测试命令

### 2.1 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并监控
npm run test:watch

# 运行特定测试
npm test -- src/types.test.ts
```

### 2.2 覆盖率

```bash
# 运行测试并生成覆盖率
npm run test:coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

---

## 3. 代码质量检查

### 3.1 Lint

```bash
# 运行 ESLint
npm run lint

# 自动修复
npm run lint:fix
```

### 3.2 类型检查

```bash
# 检查 as any 使用
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | wc -l

# 检查 as unknown
grep -rn "as unknown" src/ --include="*.ts" --include="*.tsx" | wc -l
```

---

## 4. CI/CD 命令

### 4.1 类型检查 CI

```yaml
# .github/workflows/type-check.yml
name: Type Check
on: [push, pull_request]
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run type-check
```

### 4.2 完整检查

```bash
# 运行所有检查
npm run ci
```

---

## 5. 调试类型错误

### 5.1 常见错误修复

```typescript
// 错误: Parameter 'x' implicitly has an 'any' type
// 修复: 添加类型注解
function foo(x: string) { }

// 错误: Object is possibly 'null'
// 修复: 使用可选链或默认值
const value = obj?.prop ?? 'default';

// 错误: Cannot find name 'y'
// 修复: 检查变量作用域
```

### 5.2 类型工具

```bash
# 查看类型定义
npx tsc --noEmit --pretty false 2>&1 | grep "types.ts"

# 生成类型定义文件
npx tsc --declaration --emitDeclarationOnly
```

---

## 6. 常用命令速查

| 命令 | 用途 |
|------|------|
| `npm run type-check` | 运行类型检查 |
| `npx tsc --strict` | 严格模式检查 |
| `npm run lint` | 运行 lint |
| `npm test` | 运行测试 |
| `npm run build` | 构建项目 |

---

*AGENTS.md - 2026-03-19*
