# 测试前置检查 PRD

**项目**: vibex-pre-test-check  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

项目在运行测试前缺少自动化前置检查，导致：
- TypeScript 类型错误未提前发现
- ESLint 问题未检测
- 构建失败才暴露问题
- 测试环境不完整

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 明确检查项列表
- 设计合理的脚本架构
- 测试前自动执行检查

### 2.2 Non-Goals
- 不修改现有测试用例
- 不改变 CI/CD 配置

---

## 3. Check Items (检查项列表)

### 3.1 5 项检查

| # | 检查项 | 命令 | 重要性 |
|---|--------|------|--------|
| 1 | TypeScript 类型检查 | `tsc --noEmit` | 🔴 高 |
| 2 | ESLint 检查 | `eslint . --ext .ts,.tsx` | 🔴 高 |
| 3 | 构建验证 | `next build` | 🟡 中 |
| 4 | 依赖检查 | 检查 node_modules | 🟢 低 |
| 5 | 环境变量检查 | 检查 .env | 🟢 低 |

### 3.2 检查顺序

```
1. TypeScript → 2. ESLint → 3. 构建 → 4. 依赖 → 5. 环境
```

---

## 4. Script Design

### 4.1 文件结构

```
scripts/
├── pre-test-check.js      # 主脚本
├── checks/
│   ├── typescript.js      # TypeScript 检查
│   ├── eslint.js          # ESLint 检查
│   ├── build.js           # 构建检查
│   ├── dependencies.js    # 依赖检查
│   └── environment.js     # 环境检查
└── utils/
    ├── logger.js          # 日志工具
    └── runner.js          # 命令执行器
```

### 4.2 主脚本逻辑

```javascript
// scripts/pre-test-check.js
async function runPreTestChecks() {
  // 1. TypeScript 检查
  const tsResult = await runTypeScriptCheck()
  
  // 2. ESLint 检查
  const eslintResult = await runESLintCheck()
  
  // 3. 构建检查 (CI 环境)
  if (process.env.CI) {
    const buildResult = await runBuildCheck()
  }
  
  // 4. 依赖检查
  const depResult = await runDependencyCheck()
  
  // 5. 环境检查
  const envResult = await runEnvironmentCheck()
  
  // 汇总结果
  if (failed.length > 0) {
    process.exit(1)
  }
}
```

### 4.3 输出格式

```
🔍 Running pre-test checks...

1️⃣ TypeScript check...
✅ TypeScript: No errors

2️⃣ ESLint check...
⚠️ ESLint: 3 warnings (non-blocking)

3️⃣ Build check...
✅ Build: Success

4️⃣ Dependency check...
✅ Dependencies: All installed

5️⃣ Environment check...
✅ Environment: All variables present

==================================================
📊 Results: 5/5 passed

✅ All pre-test checks passed!
```

---

## 5. Implementation Steps

### 步骤 1: 创建检查模块

- `checks/typescript.js`
- `checks/eslint.js`
- `checks/build.js`
- `checks/dependencies.js`
- `checks/environment.js`

### 步骤 2: 创建主脚本

- `scripts/pre-test-check.js`

### 步骤 3: 更新 package.json

```json
{
  "scripts": {
    "pretest": "node scripts/pre-test-check.js",
    "test": "jest",
    "test:full": "npm run pretest && npm run test"
  }
}
```

### 步骤 4: 集成 Git Hooks (可选)

```bash
# .husky/pre-commit
npm run pretest
```

---

## 6. Acceptance Criteria (验收标准)

### 6.1 功能验收

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | TypeScript 错误被检测 | 注入错误运行检查 |
| AC-02 | ESLint 错误被检测 | 注入错误运行检查 |
| AC-03 | 构建失败被检测 | 模拟构建失败 |
| AC-04 | 依赖缺失被检测 | 删除 node_modules |
| AC-05 | 环境变量缺失被检测 | 缺少 .env |

### 6.2 执行验收

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-06 | 脚本正常执行 | `npm run pretest` |
| AC-07 | 输出格式清晰 | 检查日志 |
| AC-08 | 失败时退出码为 1 | 检查退出码 |

---

## 7. Definition of Done (DoD)

### 7.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | TypeScript 检查集成 |
| DoD-2 | ESLint 检查集成 |
| DoD-3 | 构建检查集成 (CI 环境) |
| DoD-4 | 依赖检查集成 |
| DoD-5 | 环境变量检查集成 |
| DoD-6 | 测试前自动执行检查 |

### 7.2 质量 DoD

| # | 条件 |
|---|------|
| DoD-7 | 错误输出清晰 |
| DoD-8 | 成功时退出码为 0 |
| DoD-9 | 失败时退出码为 1 |

---

## 8. Timeline Estimate

| 阶段 | 工作量 |
|------|--------|
| 创建检查模块 | 1h |
| 创建主脚本 | 1h |
| 集成 package.json | 0.5h |
| 测试验证 | 0.5h |
| **总计** | **3h** |

---

## 9. Dependencies

- **前置**: analyze-check-needs (已完成)
- **依赖**: TypeScript, ESLint, Jest

---

*PRD 完成于 2026-03-05 (PM Agent)*
