# AGENTS.md — vibex-nextjs-upgrade 验收脚本

> **项目**: vibex-nextjs-upgrade
> **工作目录**: `/root/.openclaw/vibex/vibex-fronted`
> **日期**: 2026-03-20

---

## 1. 开发环境命令

```bash
# 进入工作目录
cd /root/.openclaw/vibex/vibex-fronted

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

---

## 2. 测试命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 运行全部测试（CI 模式）
npm test -- --ci

# 监听模式（开发时）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 覆盖率检查（阈值验证）
npm run coverage:check

# E2E 测试
npm run test:e2e
```

---

## 3. 类型检查命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# TypeScript 类型检查
npx tsc --noEmit

# 生成类型声明文件
npm run generate:types
```

---

## 4. 静态检查命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# ESLint 检查
npm run lint

# 安全漏洞扫描
npm run scan:vuln

# 生成漏洞报告
npm run report:vuln
```

---

## 5. 验证检查单（心跳验证用）

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 1. Next.js 版本确认
grep '"next"' package.json
# 期望: "next": "16.2.0"

# 2. 构建验证
npm run build
# 期望: Exit 0

# 3. TypeScript 验证
npx tsc --noEmit
# 期望: Exit 0, 0 errors

# 4. 单元测试验证
npm test -- --ci
# 期望: ≥1751 tests passed

# 5. Sentry 兼容性（运行时）
grep '@sentry/nextjs' package.json
# 当前: @sentry/nextjs@10.44.0 (npm 报告 invalid 但运行时正常)
```

---

## 6. Storybook 命令

```bash
cd /root/.openclaw/vibex/vibex-fronted

# 启动 Storybook
npm run storybook

# 构建 Storybook
npm run build-storybook
```

---

## 7. 快速验证脚本（一键）

```bash
#!/bin/bash
cd /root/.openclaw/vibex/vibex-fronted

echo "=== Next.js 升级验证 ==="
echo "1. 版本检查..."
grep '"next"' package.json

echo "2. 构建..."
npm run build && echo "✅ Build OK" || echo "❌ Build FAILED"

echo "3. 类型检查..."
npx tsc --noEmit && echo "✅ TypeScript OK" || echo "❌ TypeScript FAILED"

echo "4. 测试..."
npm test -- --ci 2>&1 | tail -5
```

---

*Architect Agent | 2026-03-20*
