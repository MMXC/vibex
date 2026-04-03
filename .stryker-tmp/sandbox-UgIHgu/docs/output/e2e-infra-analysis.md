# E2E 测试基础设施问题分析报告

**项目**: vibex-e2e-infra-fix  
**日期**: 2026-03-12  
**状态**: 分析完成

---

## 执行摘要

E2E 测试存在 **4 个主要问题**：
1. 登录状态加载测试失败
2. URL 断言路径不匹配（尾部斜杠）
3. 测试超时问题
4. 并发测试导致服务器资源竞争

---

## 问题定义

### 当前状态

| 指标 | 值 |
|------|-----|
| E2E 测试文件数 | 25+ |
| Playwright 版本 | 1.58.2 |
| 测试通过率 | ~70% |
| 主要失败原因 | 超时、断言失败 |

### 问题清单

| 问题 | 严重性 | 影响 |
|------|--------|------|
| 加载状态未正确显示 | 高 | 核心功能测试失败 |
| URL 路径断言失败 | 中 | 测试不稳定 |
| 测试超时 | 高 | 测试无法完成 |
| 并发资源竞争 | 中 | 测试结果不稳定 |

---

## 问题详细分析

### 问题 1: 登录加载状态测试失败

**错误信息**:
```
Error: expect(locator).toContainText failed
Expected substring: "处理中"
Received string: "登录"
```

**根因分析**:
- 测试期望提交按钮在点击后文本变为"处理中"
- 实际按钮文本仍为"登录"
- 可能原因：
  1. 前端未实现加载状态
  2. API 响应太快，加载状态未显示
  3. Mock 数据未正确配置

**解决方案**:
```typescript
// 方案 A: 修复前端加载状态实现
// 方案 B: 调整测试断言，检查禁用状态而非文本
await expect(page.locator('button[type="submit"]')).toBeDisabled();
```

### 问题 2: URL 路径断言失败

**错误信息**:
```
Expected: "http://localhost:3000/landing"
Received: "http://localhost:3000/landing/"
```

**根因分析**:
- Next.js 自动添加尾部斜杠
- 测试断言未考虑这种情况

**解决方案**:
```typescript
// 方案 A: 使用正则匹配
await expect(page).toHaveURL(/\/landing\/?$/);

// 方案 B: 标准化 URL 比较
const url = new URL(page.url());
expect(url.pathname).toBe('/landing');
```

### 问题 3: 测试超时

**错误信息**:
```
Test timeout of 30000ms exceeded.
Error: page.goto: Test timeout of 30000ms exceeded.
```

**根因分析**:
1. **开发服务器启动慢**: `webServer` 配置的 120 秒超时可能不够
2. **并发测试竞争**: 多个测试同时访问同一页面
3. **资源限制**: 服务器 CPU/内存不足

**影响因素**:
| 因素 | 影响 |
|------|------|
| webServer 启动 | 高 |
| 并发 workers | 中 |
| 网络延迟 | 低 |

**解决方案**:
```typescript
// playwright.config.ts 优化
export default defineConfig({
  timeout: 60000,  // 增加单测试超时
  workers: 1,      // 限制并发（CI 环境）
  retries: 2,      // 增加重试
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,  // 复用已有服务器
    timeout: 180000,            // 增加启动超时
  },
});
```

### 问题 4: 并发资源竞争

**现象**:
- 部分测试在单独运行时通过
- 批量运行时失败

**根因分析**:
- 多个测试同时操作同一数据库状态
- 测试之间没有正确隔离
- 没有测试数据清理机制

**解决方案**:
```typescript
// 使用 test.describe 配置串行执行
test.describe.configure({ mode: 'serial' });

// 或使用独立测试数据
test.beforeEach(async ({ page }) => {
  // 清理测试数据
  await page.request.post('/api/test/reset');
});
```

---

## Playwright 配置优化建议

### 当前配置

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,  // 问题：并发导致竞争
  timeout: 30000,       // 问题：可能不够
  workers: process.env.CI ? 1 : undefined,
});
```

### 推荐配置

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,  // 串行执行，避免竞争
  timeout: 60000,        // 增加超时
  retries: 2,
  workers: 1,            // 单 worker
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,  // 增加操作超时
  },
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,  // 复用服务器
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  
  // 分项目配置
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
```

---

## 测试分层建议

### 当前问题

- 所有测试在同一目录
- 无分层策略
- 无测试隔离

### 建议分层

```
tests/
├── e2e/
│   ├── setup/               # 测试环境设置
│   │   └── auth.setup.ts    # 登录状态设置
│   ├── smoke/               # 冒烟测试
│   │   └── basic.spec.ts
│   ├── critical/            # 关键流程测试
│   │   ├── auth-flow.spec.ts
│   │   └── requirement.spec.ts
│   ├── regression/          # 回归测试
│   │   └── *.spec.ts
│   └── visual/              # 视觉回归测试
│       └── *.spec.ts
└── fixtures/                # 测试 fixtures
    └── index.ts
```

---

## 工作量估算

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| Phase 1 | 修复配置问题 | 0.5 天 |
| Phase 2 | 修复失败测试 | 1 天 |
| Phase 3 | 添加测试分层 | 1 天 |
| Phase 4 | CI 集成优化 | 0.5 天 |
| **总计** | - | **3 天** |

---

## 风险评估

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| 测试不稳定 | 高 | 增加重试、串行执行 |
| 环境依赖 | 中 | Mock 外部依赖 |
| 维护成本 | 中 | 测试分层、代码复用 |

---

## 验收标准

1. ✅ 所有 E2E 测试通过率 > 95%
2. ✅ 无测试超时失败
3. ✅ 测试分层结构建立
4. ✅ CI 环境测试稳定

---

## 输出物

- 分析报告: `docs/output/e2e-infra-analysis.md`
- 优化后配置: `playwright.config.ts` (待修改)