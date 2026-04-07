# 分析报告：E2E 测试失败问题

**项目**: vibex-e2e-failures-20260323  
**分析时间**: 2026-03-23  
**分析师**: Analyst  

---

## 1. 问题概述

### 核心发现

| 问题类型 | 描述 | 影响范围 |
|---------|------|---------|
| **路由缺失** | `/confirm` 页面不存在 | 所有涉及 `/confirm` 的 E2E 测试 |
| **静态导出配置** | `next.config.ts` 中 `output: 'export'` 限制了动态路由支持 | 性能测试、API 调用测试 |
| **首页加载失败** | 访问首页返回 404 错误 | 所有首页相关 E2E 测试 |

### 测试失败根因

从 `playwright-report` 和 `error-context.md` 分析，主要失败模式：

```
期望：HomePage 正确渲染，步骤指示器显示进度
实际：页面返回 404 "This page could not be found."
```

---

## 2. 技术分析

### 2.1 Next.js 静态导出问题

**当前配置** (`next.config.ts`):
```typescript
const nextConfig: NextConfig = {
  output: 'export',  // ⚠️ 问题：静态导出不支持动态路由
  // ...
};
```

**影响**:
- 无法使用 `getServerSideProps`、`getStaticProps`
- 无法使用 `API Routes` (但 `output: 'export'` 支持 API routes 在边缘运行)
- 无法使用 ISR (Incremental Static Regeneration)

### 2.2 `/confirm` 路由缺失

**现状**:
- 测试文件期望 `/confirm` 路由存在
- 实际搜索结果显示 `src/app/` 目录下**不存在** `confirm` 页面
- 只有 `confirmationStore.ts` 存在（store 文件，非页面组件）

**测试用例参考**:
```typescript
// activation.spec.ts
await page.goto(`${BASE_URL}/confirm`);

// integrated-preview.spec.ts  
await page.waitForURL('**/confirm**', { timeout: 5000 });
```

### 2.3 首页加载性能问题

**观察**:
- 测试超时设置为 60 秒
- `webServer` 启动超时 180 秒
- 多个重试（`retries: 2`）

**可能原因**:
1. 静态资源加载慢
2. `output: 'export'` 导致构建产物过大
3. 图片优化配置未生效

---

## 3. 技术方案

### 方案一：完整迁移到 SSR（推荐）

**改动点**:
1. 移除 `output: 'export'`
2. 部署到 Cloudflare Pages（而非静态部署）
3. 创建 `/confirm` 页面

**优点**:
- 完全支持动态路由
- 支持服务端 API
- 更好的 SEO

**缺点**:
- 需要改部署配置
- 可能影响现有部署流程

**工作量**: 高（需要完整评估部署影响）

### 方案二：保持静态导出 + 创建确认页面

**改动点**:
1. 保持 `output: 'export'`
2. 创建 `src/app/confirm/page.tsx` 作为静态页面
3. 使用客户端路由替代服务端路由

**优点**:
- 最小改动
- 保持当前部署流程

**缺点**:
- `/confirm` 无法使用服务端逻辑
- 需要确保客户端状态持久化

**工作量**: 低

### 方案三：使用 Cloudflare Workers 中间件

**改动点**:
1. 移除 `output: 'export'`
2. 使用 Cloudflare Workers 处理动态路由
3. 保持边缘计算能力

**优点**:
- 保持边缘计算性能
- 支持动态路由

**缺点**:
- 需要额外的 Workers 配置
- 增加架构复杂度

**工作量**: 中

---

## 4. 推荐方案

**推荐方案二**（保持静态导出 + 创建确认页面）

理由：
1. 改动最小，风险可控
2. 保持当前部署流程稳定
3. 适合 MVP 阶段快速迭代

**后续可在方案三基础上扩展**，当需要更复杂的服务端逻辑时再迁移到全 SSR。

---

## 5. 验收标准

| 编号 | 验收条件 | 测试方法 |
|-----|---------|---------|
| AC-1 | `npm run dev` 启动后首页正常加载，无 404 | Playwright `homepage.spec.ts` 通过 |
| AC-2 | 访问 `/confirm` 路由返回有效页面（非 404）| Playwright `activation.spec.ts` 通过 |
| AC-3 | `/confirm` 页面显示确认流程内容 | 截图对比测试 |
| AC-4 | E2E 测试套件整体通过率 ≥ 90% | Playwright 测试报告 |
| AC-5 | `npm run build` 成功且构建时间 < 5 分钟 | CI/CD 监控 |

---

## 6. 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| 静态导出限制功能 | 高 | 中 | 评估确认页面功能需求，如需服务端逻辑则迁移到 SSR |
| 页面状态丢失 | 中 | 中 | 确保 `confirmationStore` 正确实现持久化 |
| 部署配置变更 | 中 | 低 | 先在开发环境验证，再更新生产部署 |

---

## 7. 下一步行动

| 优先级 | 行动项 | 负责人 |
|-------|-------|--------|
| P0 | 创建 `src/app/confirm/page.tsx` 基础页面 | Dev |
| P1 | 修复首页 404 问题（检查路由配置）| Dev |
| P2 | 实现确认页面的客户端状态管理 | Dev |
| P3 | 添加 E2E 测试验证确认流程 | Tester |
| P4 | 评估是否需要 SSR 迁移 | Architect |

---

## 8. 附录

### A. 相关文件位置

- Next.js 配置: `/vibex-fronted/next.config.ts`
- 测试配置: `/vibex-fronted/playwright.config.ts`
- 确认 Store: `/vibex-fronted/src/stores/confirmationStore.ts`
- E2E 测试: `/vibex-fronted/tests/e2e/`

### B. 测试覆盖情况

| 测试文件 | 覆盖路由 | 状态 |
|---------|---------|------|
| activation.spec.ts | /confirm | ❌ 失败 |
| integrated-preview.spec.ts | 首页→/confirm | ❌ 失败 |
| confirmation-progress-persist.spec.ts | /confirm | ❌ 失败 |
| homepage.spec.ts | / | ❌ 失败 |
