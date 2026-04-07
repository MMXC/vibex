# PRD - VibeX 导航组件验证补全

**项目代号**: vibex-nav-verification  
**状态**: In Progress  
**创建时间**: 2026-03-06  
**负责人**: PM Agent  

---

## 1. 功能需求 (Functional Requirements)

### 1.1 核心功能

| 功能点 | 描述 | 优先级 |
|-------|------|-------|
| E2E 导航测试 | 覆盖全局导航、项目切换、项目内导航等核心用户流程 | P0 |
| 截图验证 | 桌面端/移动端导航截图，视觉回归检测 | P0 |
| 性能指标监控 | 导航加载时间、页面切换时间等关键指标 | P0 |
| 部署验证 | 构建成功、静态资源完整、路由正常 | P0 |

### 1.2 用户故事

#### Epic 1: E2E 导航测试

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-001 | 全局导航点击测试 | 点击顶部导航项正确跳转 |
| US-002 | 项目切换测试 | 切换项目后导航内容正确更新 |
| US-003 | 项目内导航测试 | 点击左侧导航项正确切换页面 |
| US-004 | 路由同步测试 | URL 变化与导航高亮一致 |
| US-005 | 权限验证测试 | 未登录用户导航受限 |

#### Epic 2: 截图验证

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-010 | 全局导航桌面端截图 | 1280x720 分辨率截图生成 |
| US-011 | 全局导航移动端截图 | 375x667 分辨率截图生成 |
| US-012 | 项目导航桌面端截图 | 1280x720 分辨率截图生成 |
| US-013 | 项目导航移动端截图 | 375x667 分辨率截图生成 |
| US-014 | 导航过渡动画截图 | 动画过程截图捕获 |

#### Epic 3: 性能指标

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-020 | 导航加载时间监控 | 加载时间 < 500ms |
| US-021 | 页面切换时间监控 | 切换时间 < 300ms |
| US-022 | FCP 指标监控 | 首次内容绘制 < 1.5s |
| US-023 | LCP 指标监控 | 最大内容绘制 < 2.5s |
| US-024 | CLS 指标监控 | 累积布局偏移 < 0.1 |

#### Epic 4: 部署验证

| Story ID | 描述 | 验收标准 |
|----------|------|----------|
| US-030 | 构建验证 | 构建成功，无错误 |
| US-031 | 静态资源验证 | index.html 和资源文件存在 |
| US-032 | 路由功能验证 | E2E 测试验证路由正常 |
| US-033 | CDN 部署验证 | 部署状态检查通过 |

---

## 2. UI/UX 交互流程

### 2.1 验证流程

```
代码变更 → 触发 CI → E2E 测试 → 截图验证 → 性能测试 → 部署验证 → 报告生成
```

### 2.2 测试文件结构

```
tests/
├── e2e/
│   ├── navigation.spec.ts       # 导航 E2E 测试
│   └── screenshots/
│       ├── global-nav-desktop.png
│       ├── global-nav-mobile.png
│       ├── project-nav-desktop.png
│       └── project-nav-mobile.png
├── performance/
│   └── navigation-metrics.spec.ts
└── deployment/
    └── verify.sh
```

---

## 3. Epics 拆分 (业务级)

| Epic | 名称 | 描述 | 工作量 |
|------|------|------|-------|
| Epic 1 | E2E Navigation Tests | 编写 Playwright 导航测试用例 | 1h |
| Epic 2 | Screenshot Validation | 截图配置和自动化 | 30min |
| Epic 3 | Performance Metrics | 性能指标监控和阈值 | 30min |
| Epic 4 | Deployment Verification | 部署验证脚本 | 30min |

---

## 4. 非功能需求 (Non-Functional Requirements)

| 需求类型 | 要求 |
|---------|------|
| 测试覆盖率 | 导航相关测试覆盖率 > 80% |
| 执行时间 | E2E 测试 < 5 分钟 |
| 可靠性 | 测试通过率 > 95% |
| 可维护性 | 测试用例文档化，易于扩展 |

---

## 5. 验收标准 (可写 expect() 断言)

### 5.1 E2E 测试验收

```typescript
// 全局导航测试
expect(page.locator('.global-nav')).toBeVisible()
await page.click('.global-nav .nav-item:has-text("项目")')
expect(page).toHaveURL(/\/projects/)

// 项目切换测试
await page.click('.project-card:first-child')
expect(page.locator('.project-nav')).toBeVisible()
expect(page.locator('.project-nav .nav-item.active')).toHaveText('Dashboard')

// 项目内导航测试
await page.click('.project-nav .nav-item:has-text("Chat")')
expect(page).toHaveURL(/\/chat/)
expect(page.locator('.project-nav .nav-item.active')).toHaveText('Chat')

// 路由同步测试
await page.goto('/projects/test/chat')
expect(page.locator('.project-nav .nav-item.active')).toHaveText('Chat')
```

### 5.2 截图验证验收

```typescript
expect(await takeScreenshot('global-nav-desktop')).toMatchSnapshot()
expect(await takeScreenshot('global-nav-mobile')).toMatchSnapshot()
expect(await takeScreenshot('project-nav-desktop')).toMatchSnapshot()
```

### 5.3 性能指标验收

```typescript
const navLoadTime = await measureNavigationLoadTime()
expect(navLoadTime).toBeLessThan(500) // ms

const pageSwitchTime = await measurePageSwitchTime()
expect(pageSwitchTime).toBeLessThan(300) // ms

const fcp = await measureFCP()
expect(fcp).toBeLessThan(1500) // ms

const lcp = await measureLCP()
expect(lcp).toBeLessThan(2500) // ms

const cls = await measureCLS()
expect(cls).toBeLessThan(0.1)
```

### 5.4 部署验证验收

```bash
# 构建验证
expect(build.exitCode).toBe(0)

# 静态资源验证
expect(fs.existsSync('out/index.html')).toBe(true)

# 路由功能验证
expect(e2eTestsPassed).toBe(true)
```

---

## 6. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 测试环境不稳定 | 中 | 添加重试机制和错误处理 |
| 性能指标波动 | 低 | 使用多次测量取中位数 |
| 截图差异误报 | 中 | 人工审核差异图片 |

---

*PRD 创建完成于 2026-03-06 15:15 (Asia/Shanghai)*
