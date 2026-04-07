# 架构设计: homepage-v4-fix-epic1-aipanel-test

> **项目**: homepage-v4-fix-epic1-aipanel-test  
> **版本**: v1.0  
> **架构师**: Architect Agent  
> **日期**: 2026-03-22  
> **目标**: 修复 Jest 配置，Jest 错误执行 Playwright e2e 测试（ESM 语法）导致 241 套件失败  
> **工作目录**: `/root/.openclaw/vibex/vibex-fronted`

---

## 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-03-22 | 修复 Jest testPathIgnorePatterns + babel-jest 配置 |

---

## 1. 问题分析

### 1.1 根因

```
Jest 配置缺失:
├── testPathIgnorePatterns 缺少 e2e 目录
├── babel-jest 未正确排除 Playwright spec 文件
└── e2e 测试使用 ESM import 语法，Jest 无法解析
```

### 1.2 当前 jest 配置（package.json）

```json
{
  "jest": {
    "transform": {
      "^.+\\.(ts|tsx|js|jsx)$": "babel-jest"
    },
    "testPathIgnorePatterns": [
      "/node_modules/",
      "tests/e2e",         ← 相对路径，可能不生效
      "/e2e/"               ← 有效
    ],
    "testEnvironment": "jsdom"
  }
}
```

---

## 2. 修复方案

### 2.1 方案：明确 testPathIgnorePatterns

```json
// package.json 或 jest.config.js

{
  "jest": {
    "testPathIgnorePatterns": [
      "/node_modules/",
      "/dist/",
      "/.next/",
      "/coverage/",
      "/storybook-static/",
      "\\.e2e\\.spec\\.(ts|tsx)$",
      "\\.e2e\\.test\\.(ts|tsx)$",
      "/tests/e2e/",
      "/e2e/",
      "/__e2e__/",
      "/playwright/",
      "FlowEditor",
      "MermaidCodeEditor",
      "flow/page.test"
    ]
  }
}
```

### 2.2 babel.config.js（已正确）

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
```

**验证**: `@babel/preset-typescript` 已配置，无需修改。

### 2.3 jest.config.js（建议）

为避免配置分散，建议从 `package.json` 提取到独立文件：

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
    '/\\.e2e\\.(ts|tsx)$/',
    '/tests/e2e/',
    '/e2e/',
    '/__e2e__/',
    '/playwright/',
  ],
};
```

---

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC-01 | 修改配置后 | 运行 `pnpm test` | 无 "Cannot use import statement" 错误 |
| AC-02 | 修改配置后 | 运行 `pnpm test` | 退出码为 0 |
| AC-03 | 修改配置后 | 运行 `pnpm test:e2e` | Playwright e2e 测试正常运行 |
| AC-04 | 修改配置后 | 搜索 Jest 结果 | 0 个 e2e 测试被运行 |

---

## 4. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 误排除正常测试文件 | 添加精确的正则: `\\.e2e\\.spec\\.(ts|tsx)$` |
| CI 配置不一致 | 统一使用 jest.config.js 而非 package.json |
