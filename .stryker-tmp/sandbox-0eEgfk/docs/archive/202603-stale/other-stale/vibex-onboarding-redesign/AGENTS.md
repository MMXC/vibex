# AGENTS.md - 用户引导流程重新设计

**项目**: vibex-onboarding-redesign  
**版本**: 1.0  
**日期**: 2026-03-19

---

## 1. 开发命令

### 1.1 本地开发

```bash
# 进入项目目录
cd /root/.openclaw/vibex

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000/onboarding
```

### 1.2 构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

---

## 2. 测试命令

### 2.1 单元测试

```bash
# 运行所有单元测试
npm test

# 运行测试并监控
npm run test:watch

# 运行特定测试文件
npm test -- onboarding.test.tsx
```

### 2.2 集成测试

```bash
# 运行集成测试
npm run test:integration
```

### 2.3 E2E 测试

```bash
# 启动开发服务器（后台）
npm run dev &

# 运行 Playwright E2E 测试
npm run test:e2e

# 停止后台服务器
pkill -f "next dev"
```

### 2.4 测试覆盖率

```bash
# 运行测试并生成覆盖率报告
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

# 自动修复可修复的问题
npm run lint:fix
```

### 3.2 类型检查

```bash
# TypeScript 类型检查
npm run type-check

# 或直接运行 tsc
npx tsc --noEmit
```

### 3.3 格式化

```bash
# Prettier 格式化
npm run format

# 检查格式化
npm run format:check
```

---

## 4. CI/CD 命令

### 4.1 完整检查

```bash
# 运行所有检查（lint + type-check + test）
npm run ci
```

### 4.2 Git Hooks

```bash
# 安装 pre-commit hooks
npm run prepare

# pre-commit 会自动运行:
# - lint
# - type-check
# - test
```

---

## 5. 调试

### 5.1 React DevTools

- 安装 React DevTools 浏览器扩展
- 访问 http://localhost:3000/onboarding
- 打开 DevTools > Components

### 5.2 Zustand DevTools

```bash
# Zustand DevTools 在 development 模式自动启用
# 访问 http://localhost:3000/onboarding
# 打开 DevTools > Redux (Zustand 状态)
```

---

## 6. 常用命令速查

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm test` | 运行测试 |
| `npm run lint` | 运行 lint |
| `npm run type-check` | 类型检查 |
| `npm run build` | 构建生产版本 |

---

*AGENTS.md - 2026-03-19*
