# E2E 测试指南

## 快速开始

### 本地运行

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 或直接使用 playwright
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e/auth-flow.spec.ts

# 运行带 UI 模式
npx playwright test --ui
```

### CI 运行

```bash
# CI 环境自动配置
CI=true npx playwright test
```

## 配置说明

### playwright.config.ts

- `testDir`: 测试文件目录 (`tests/e2e`)
- `projects`: 默认只运行 chromium，可根据需要添加更多浏览器
- `webServer`: 自动启动开发服务器
- `baseURL`: 默认 `http://localhost:3000`

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `BASE_URL` | http://localhost:3000 | 测试目标 URL |
| `CI` | false | CI 模式：禁用 .only、启用重试 |

## 测试结构

```
tests/
├── e2e/
│   ├── auth/              # 认证相关测试
│   ├── pages/             # 页面测试
│   ├── user-flows/        # 用户流程测试
│   ├── basic.spec.ts      # 基础测试
│   └── *.spec.ts          # 其他 E2E 测试
├── unit/                  # 单元测试
└── performance/           # 性能测试
```

## 常见问题

### 测试超时

增加超时时间：
```typescript
// playwright.config.ts
timeout: 60000,
expect: {
  timeout: 10000,
},
```

### 需要登录状态

使用 `storageState` 保存登录状态：
```typescript
// 在需要认证的测试中使用
use: {
  storageState: './tests/e2e/.auth/user.json',
},
```

### 调试模式

```bash
# UI 模式
npx playwright test --ui

# 保留跟踪文件
npx playwright test --trace on

# 只运行失败的测试
npx playwright test --grep "@failed"
```

## 维护指南

### 添加新测试

1. 在 `tests/e2e/` 下创建 `.spec.ts` 文件
2. 使用 `test` 和 `expect` 编写测试
3. 运行 `npx playwright test` 验证

### 更新依赖

```bash
# 更新 playwright
npm install -D @playwright/test@latest

# 更新浏览器
npx playwright install --with-deps
```
