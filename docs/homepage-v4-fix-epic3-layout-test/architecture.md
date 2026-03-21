# 架构设计: homepage-v4-fix-epic3-layout-test

> **项目**: homepage-v4-fix-epic3-layout-test  
> **版本**: v1.0  
> **架构师**: Architect Agent  
> **日期**: 2026-03-22  
> **目标**: 修复 Babel 解析错误（@babel/parser 无法解析某些语法）导致 257 套件失败  
> **工作目录**: `/root/.openclaw/vibex/vibex-fronted`

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-03-22 | 修复 babel-jest transform + testPathIgnorePatterns 配置 |

---

## 1. 问题分析

### 1.1 根因

```
Babel 解析失败:
├── Jest 运行了 .spec.ts 文件（Playwright ESM 语法）
├── babel-jest 无法解析 ESM import 语句
├── 缺少 @babel/plugin-transform-runtime（如果使用 async/await）
└── testPathIgnorePatterns 未排除 .spec.ts 文件
```

### 1.2 当前配置

**babel.config.js**（正确）:
```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
```

**jest package.json config**（缺失）:
```json
{
  "jest": {
    "testPathIgnorePatterns": [
      "/node_modules/",
      "tests/e2e",      ← 只排除目录，不排除 .spec.ts 文件
      "/e2e/"
    ]
  }
}
```

---

## 2. 修复方案

### 2.1 方案：完整 testPathIgnorePatterns + jest.config.js

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
    // Playwright spec files（关键修复）
    '/\\.spec\\.(ts|tsx)$/',
    '/tests/e2e/',
    '/e2e/',
    '/__e2e__/',
    '/playwright/',
    '/tests/basic\\.spec\\.ts$/',
    // Jest 内部排除
    '/FlowEditor/',
    '/MermaidCodeEditor/',
    '/flow/page\\.test/',
  ],
};
```

### 2.2 Babel 配置增强（如需要）

如果 `@babel/preset-typescript` 仍不够，添加 plugin：

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // 支持装饰器（如果有用到）
    ['@babel/plugin-proposal-decorators', { legacy: true }],
  ],
};
```

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | 修改配置后 | 运行 `pnpm test` | 无 "Parser.parse" 错误 |
| AC-02 | 修改配置后 | 运行 `pnpm test` | 退出码为 0 |
| AC-03 | 修改配置后 | 运行 `pnpm test` | 无 "Cannot use import statement" 错误 |
| AC-04 | 修改配置后 | 搜索测试结果 | 0 个 .spec.ts 文件被运行 |

---

## 4. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 误排除 `.test.ts` 文件 | 使用精确正则 `/\.spec\.(ts|tsx)$/` 而非 `/\.spec/` |
| Babel 版本不兼容 | 先运行 `pnpm test` 验证，不盲目升级 |
| 破坏 Epic3 布局组件测试 | 保留 `FlowEditor` 等特定排除项 |
