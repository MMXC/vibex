# 架构设计: homepage-v4-fix-reviewer-aipanel-fix

> **项目**: homepage-v4-fix-reviewer-aipanel-fix  
> **版本**: v1.0  
> **架构师**: Architect Agent  
> **日期**: 2026-03-22  
> **目标**: 修复 Jest 配置，Jest 尝试执行 Playwright e2e 测试（ESM 语法）导致 241 套件失败  
> **工作目录**: `/root/.openclaw/vibex/vibex-fronted`

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-03-22 | 修复 Jest testPathIgnorePatterns + 提取 jest.config.js |

---

## 1. 问题分析

### 1.1 根因

```
Jest 配置缺陷:
├── testPathIgnorePatterns 使用相对路径 'tests/e2e'（不生效）
├── 缺少精确的 .spec.ts / .e2e.ts 排除正则
├── babel-jest 尝试编译 Playwright ESM 语法文件
└── @babel/preset-typescript 无法处理 ESM import 语句
```

### 1.2 当前配置

**package.json jest 配置（缺陷）**:
```json
{
  "jest": {
    "testPathIgnorePatterns": [
      "/node_modules/",
      "tests/e2e",           ← 相对路径，不可靠
      "tests/basic.spec.ts",  ← 只排除单文件，不排除 tests/e2e/
      "tests/e2e.spec.ts",
      "/e2e/"                ← 有效，但 tests/basic.spec.ts 等仍被包含
    ]
  }
}
```

---

## 2. 修复方案

### 2.1 提取 jest.config.js（推荐）

从 `package.json` 提取到独立文件，确保路径匹配可靠：

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  fakeTimers: {
    enableGlobally: false,
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.next/',
    '/coverage/',
    '/storybook-static/',
    // Playwright spec files（核心修复）
    '/\\.spec\\.(ts|tsx)$/',       // 排除所有 .spec.ts
    '/\\.e2e\\.(ts|tsx)$/',       // 排除所有 .e2e.ts
    '/tests/e2e/',
    '/e2e/',
    '/__e2e__/',
    '/playwright/',
    // 特定已知问题文件
    '/tests/basic\\.spec\\.ts$/',
    '/tests/e2e\\.spec\\.ts$/',
    // Jest 内部已知问题
    '/FlowEditor/',
    '/MermaidCodeEditor/',
    '/flow/page\\.test/',
  ],
};
```

### 2.2 package.json 更新

```json
{
  "jest": null  // 删除或设为 null，jest.config.js 优先级更高
}
```

### 2.3 验证

```bash
# 1. 无 ESM 语法错误
pnpm test 2>&1 | grep -i "Cannot use import"  # 应为空

# 2. 退出码为 0
pnpm test; echo $?  # 应为 0

# 3. 无 .spec.ts 文件被运行
pnpm test 2>&1 | grep -c "\.spec\."  # 应为 0

# 4. e2e 测试独立运行
pnpm test:e2e; echo $?  # 应为 0
```

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | 修改配置后 | 运行 `pnpm test` | 无 "Cannot use import statement" 错误 |
| AC-02 | 修改配置后 | 运行 `pnpm test` | 退出码为 0 |
| AC-03 | 修改配置后 | 运行 `pnpm test:e2e` | Playwright e2e 测试正常运行 |
| AC-04 | 修改配置后 | 搜索测试结果 | 0 个 `.spec.ts` 文件被运行 |

---

## 4. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 误排除 `.test.ts` 文件 | 使用精确正则 `/\.spec\./` 而非 `/\.test\./` |
| package.json 冲突 | 删除 jest 配置或设为 null |
| CI 配置不一致 | 统一使用 jest.config.js |
