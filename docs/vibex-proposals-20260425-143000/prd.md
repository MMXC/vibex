# VibeX Sprint 9 PRD — 功能提案规划

**版本**: v1.0
**日期**: 2026-04-25
**作者**: PM
**项目**: vibex-proposals-20260425-143000
**状态**: 已完成

---

## 执行摘要

### 背景

VibeX 产品已完成 Sprint 1-8 核心功能交付。当前遗留问题：
- Analytics API 生产环境返回 500，无法展示用户活跃度数据
- Teams 前端代码存在但生产环境未验证，E2E 测试不完整
- Firebase 实时协作 MVP 存在，但冷启动性能未量化
- DDL Generator 仅支持 3 种数据类型（VARCHAR/INT/DATE），无法满足 PostgreSQL 复杂场景
- Canvas 三树渲染无性能基线，节点数增长时存在卡顿风险
- Canvas 内搜索功能缺失

### 目标

在 Sprint 9 交付以下成果：
1. Analytics Dashboard 修复后端 500 + 完成前端展示组件
2. Teams 前端生产验证 + E2E 测试补全到 8+
3. Firebase 实时协作基于 Sprint 8 验证结论，条件性升级
4. DDL 支持 ENUM/JSONB/UUID/ARRAY，PRD 输出 JSON Schema
5. Canvas 性能基线建立，节点 100 时 FPS ≥ 30
6. Canvas 内全局搜索，支持键盘快捷键

### 成功指标

| 指标 | 目标值 |
|------|--------|
| Analytics API 成功率 | 100%（200 OK） |
| Teams E2E 测试覆盖率 | 8+ 测试用例全部通过 |
| Firebase 冷启动延迟 | < 500ms（Sprint 8 验证前置） |
| DDL 类型覆盖率 | 7/7 类型（含 ENUM/JSONB/UUID/ARRAY） |
| Canvas 节点 100 时 FPS | ≥ 30 |
| Canvas 搜索响应时间 | < 200ms |

---

## Epic 1: Analytics 能力修复与展示

### Story 清单

| ID | Story | 描述 | 工时 | 优先级 | 验收标准 |
|----|-------|------|------|--------|----------|
| E1-S1 | 后端 API 修复 | 修复 `GET /api/v1/analytics` 500 错误 | 0.5d | P0 | 见下方 |
| E1-S2 | 前端 AnalyticsWidget | Dashboard 页面集成 analytics widget | 1d | P0 | 见下方 |

### E1-S1 验收标准（expect() 断言）

```ts
// API 测试
expect(response.status).toBe(200)
expect(response.body.success).toBe(true)
expect(response.body.data).toHaveProperty('page_view')
expect(response.body.data).toHaveProperty('canvas_open')
expect(response.body.data).toHaveProperty('component_create')
expect(response.body.data).toHaveProperty('delivery_export')

// 错误注入测试
expect(await fetch('/api/v1/analytics').then(r => r.status)).not.toBe(500)
```

### E1-S2 验收标准（expect() 断言）

```ts
// 组件挂载
expect(isVisible('.analytics-widget')).toBe(true)

// 四态验证
// 加载态
expect(screen.queryByTestId('analytics-skeleton')).toBeTruthy()

// 正常态
await waitFor(() => {
  expect(screen.queryByText('Page View')).toBeTruthy()
  expect(screen.queryByText('Canvas Open')).toBeTruthy()
  expect(screen.queryByText('Component Create')).toBeTruthy()
  expect(screen.queryByText('Delivery Export')).toBeTruthy()
})

// 空态
expect(screen.queryByTestId('analytics-empty')).toBeTruthy()

// 错误态
expect(screen.queryByTestId('analytics-error')).toBeTruthy()
expect(screen.queryByText(/重试/)).toBeTruthy()

// 单元测试
expect(await runVitest('analytics-widget.test.ts')).toBe(true)

// E2E 测试
expect(await runPlaywright('analytics-widget.spec.ts')).toBe(true)
```

### 功能点详情

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Analytics API 修复 | 修复后端 `/api/v1/analytics` 500 错误 | expect(status).toBe(200) | 否 |
| F1.2 | AnalyticsWidget 组件 | 四态（加载/正常/空/错误）SVG 折线图组件 | expect(isVisible('.analytics-widget')).toBe(true) | 是【需页面集成】 |
| F1.3 | 4 项指标展示 | page_view / canvas_open / component_create / delivery_export | expect指标数量).toBe(4) | 是【需页面集成】 |

---

## Epic 2: Teams 前端生产验证

### Story 清单

| ID | Story | 描述 | 工时 | 优先级 | 验收标准 |
|----|-------|------|------|--------|----------|
| E2-S1 | 生产验证 | 验证 `/dashboard/teams` 在生产环境正常渲染 | 0.5d | P0 | 见下方 |
| E2-S2 | E2E 补全 | 补全 E2E 测试到 8+，覆盖错误边界和权限 | 1.5d | P0 | 见下方 |

### E2-S1 验收标准（expect() 断言）

```ts
// gstack 验证
await page.goto('/dashboard/teams')
expect(page.locator('h1, [data-testid="teams-page-title"]')).toContainText('Teams')
expect(isVisible('.teams-list')).toBe(true)

// 401 场景
expect(isVisible('.teams-error')).toBe(true)
expect(screen.queryByText(/认证/)).toBeTruthy()

// 空态
expect(screen.queryByTestId('teams-empty-state')).toBeTruthy()
expect(screen.queryByText(/创建/)).toBeTruthy()
```

### E2-S2 验收标准（expect() 断言）

```ts
// 现有 4 个测试必须通过
expect(await runPlaywright('teams-ui.spec.ts')).toBe(true)

// 新增 4 个测试场景
// 1. 404 路由
await page.goto('/dashboard/teams/invalid-id-999')
expect(isVisible('.teams-error')).toBe(true)

// 2. 网络错误（mock）
await page.route('**/api/v1/teams', route => route.abort())
await page.reload()
expect(screen.queryByTestId('teams-network-error')).toBeTruthy()

// 3. 权限边界 - 成员视角
await loginAs('member')
await page.goto('/dashboard/teams')
expect(isHidden('.team-settings-btn')).toBe(true)

// 4. 并发创建冲突
await page.click('[data-testid="create-team-btn"]')
await page.fill('[data-testid="team-name"]', 'Duplicate')
await page.click('[data-testid="submit-btn"]')
await page.click('[data-testid="create-team-btn"]')
await page.fill('[data-testid="team-name"]', 'Duplicate')
await page.click('[data-testid="submit-btn"]')
expect(screen.queryByText(/已存在/)).toBeTruthy()

// Console 无 error
expect(page.consoleMessages.filter(m => m.type === 'error')).toHaveLength(0)
```

### 功能点详情

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | Teams 页面生产验证 | `/dashboard/teams` 页面正常渲染 | expect(h1).toContainText('Teams') | 是【需页面集成】 |
| F2.2 | 错误态 UI | 401/404/网络错误态展示 | expect(isVisible('.teams-error')).toBe(true) | 是【需页面集成】 |
| F2.3 | E2E 测试补全 | 从 4 个扩展到 8+ 测试 | expect(testCount).toBeGreaterThanOrEqual(8) | 否 |

---

## Epic 3: Firebase 实时协作升级（条件性）

### 前置条件

**⚠️ 依赖 Sprint 8 P002-S1（Architect 可行性评审）和 P002-S2（冷启动性能测试）必须完成且通过，冷启动 < 500ms。**

若 Sprint 8 未完成或验证失败，本 Epic 延后到 Sprint 10，并切换到 PartyKit/HocusPocus 备选方案。

### Story 清单

| ID | Story | 描述 | 工时 | 优先级 | 验收标准 |
|----|-------|------|------|--------|----------|
| E3-S1 | 多用户 Presence | Canvas 显示其他在线用户头像 + 名称 | 2d | P1 | 见下方 |
| E3-S2 | Cursor 同步 | React Flow 内多用户 Cursor 实时同步 | 1.5d | P1 | 见下方 |
| E3-S3 | ConflictBubble 增强 | 冲突气泡显示节点 ID + 解决建议 | 0.5d | P1 | 见下方 |

### E3-S1 验收标准（expect() 断言）

```ts
// 5 用户并发 presence 测试
const users = await createNUsers(5)
await Promise.all(users.map(u => u.joinCanvas('canvas-id-1')))

await waitFor(() => {
  const presenceIndicators = page.locator('.presence-indicator')
  expect(presenceIndicators).toHaveCount(5)
})

// 在线状态实时更新
await users[0].leave()
await waitFor(() => {
  expect(page.locator('.presence-indicator')).toHaveCount(4)
})

// 头像 + 名称显示
const firstAvatar = page.locator('.presence-indicator').first()
expect(firstAvatar.locator('.avatar-img')).toBeVisible()
expect(firstAvatar.locator('.user-name')).toContainText(/\w/)
```

### E3-S2 验收标准（expect() 断言）

```ts
// Cursor 同步延迟 < 500ms
const t1 = Date.now()
await users[0].moveCursor(400, 300)
await waitFor(() => {
  const cursor = page.locator('.remote-cursor').first()
  expect(isVisible(cursor)).toBe(true)
  const t2 = Date.now()
  expect(t2 - t1).toBeLessThan(500)
})

// Cursor 离开画布区域消失
await users[0].moveCursor(-100, -100)
expect(isHidden('.remote-cursor')).toBe(true)
```

### E3-S3 验收标准（expect() 断言）

```ts
// ConflictBubble 内容
const bubble = page.locator('.conflict-bubble').first()
expect(bubble).toBeVisible()
expect(bubble.locator('.node-id')).toContainText(/node-[a-z0-9]+/)
expect(bubble.locator('.conflict-hint')).toContainText(/(接受|拒绝|合并)/)

// 点击解决建议
await bubble.locator('button:has-text("接受")').click()
expect(isHidden('.conflict-bubble')).toBe(true)
```

### 功能点详情

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 多用户 Presence 头像 | Canvas 侧边栏显示在线用户列表 | expect(avatarCount).toBe(5) | 是【需页面集成】 |
| F3.2 | Cursor 实时同步 | React Flow 内多用户 Cursor < 500ms | expect(syncDelay).toBeLessThan(500) | 是【需页面集成】 |
| F3.3 | ConflictBubble 增强 | 冲突气泡含节点 ID + 解决按钮 | expect(hasNodeId).toBe(true) | 是【需页面集成】 |

---

## Epic 4: DDL/PRD Generator v2

### Story 清单

| ID | Story | 描述 | 工时 | 优先级 | 验收标准 |
|----|-------|------|------|--------|----------|
| E4-S1 | DDL 类型扩展 | 支持 ENUM / JSONB / UUID / ARRAY | 1d | P1 | 见下方 |
| E4-S2 | PRD 双格式输出 | 输出 Markdown + JSON Schema | 0.5d | P1 | 见下方 |
| E4-S3 | PRD 预览面板 | Generator 页面增加预览面板 | 0.5d | P1 | 见下方 |

### E4-S1 验收标准（expect() 断言）

```ts
// 类型覆盖率测试
const types = ['VARCHAR', 'INT', 'DATE', 'ENUM', 'JSONB', 'UUID', 'ARRAY']
for (const type of types) {
  const result = generateDDL({ columns: [{ name: 'col1', type }] })
  expect(result).toContain(type)
}

// CREATE INDEX 语句
const ddl = generateDDL({ table: 'orders', columns: [...], indexes: ['user_id'] })
expect(ddl).toContain('CREATE INDEX')
expect(ddl).toContain('idx_orders_user_id')

// 单元测试
expect(await runVitest('generators.test.ts')).toBe(true)

// E2E: DDL → pgAdmin 可执行
const ddl = await generateDDLThroughUI()
expect(await isExecutableInPgAdmin(ddl)).toBe(true)
```

### E4-S2 验收标准（expect() 断言）

```ts
// JSON Schema 输出
const prd = generatePRD({ schema: sampleSchema })
expect(prd).toHaveProperty('markdown')
expect(prd).toHaveProperty('jsonSchema')
expect(prd.jsonSchema).toHaveProperty('type', 'object')
expect(prd.jsonSchema).toHaveProperty('properties')
expect(prd.jsonSchema.properties).toHaveProperty('id')
expect(prd.jsonSchema.properties.id).toHaveProperty('type', 'string')

// Schema 字段覆盖
expect(Object.keys(prd.jsonSchema.properties)).toContain('id')
expect(Object.keys(prd.jsonSchema.properties)).toContain('name')
```

### E4-S3 验收标准（expect() 断言）

```ts
// 预览面板可见
expect(isVisible('[data-testid="prd-preview-panel"]')).toBe(true)

// Markdown 预览渲染
expect(screen.queryByText('## 需求概述')).toBeTruthy()

// JSON Schema 预览渲染
expect(screen.queryByText('"type": "object"')).toBeTruthy()

// Tab 切换
await page.click('[data-testid="tab-markdown"]')
expect(isVisible('.prd-markdown-preview')).toBe(true)

await page.click('[data-testid="tab-json"]')
expect(isVisible('.prd-json-preview')).toBe(true)
```

### 功能点详情

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | DDL 类型扩展 | 支持 ENUM/JSONB/UUID/ARRAY | expect(ddl).toContain(type) | 是【需页面集成】 |
| F4.2 | CREATE INDEX | DDL 含索引语句 | expect(ddl).toContain('CREATE INDEX') | 是【需页面集成】 |
| F4.3 | PRD JSON Schema | PRD 同时输出 Markdown + JSON | expect(prd).toHaveProperty('jsonSchema') | 是【需页面集成】 |
| F4.4 | PRD 预览面板 | Markdown/JSON 双 Tab 预览 | expect(isVisible('.prd-preview-panel')).toBe(true) | 是【需页面集成】 |

---

## Epic 5: Canvas 性能优化

### Story 清单

| ID | Story | 描述 | 工时 | 优先级 | 验收标准 |
|----|-------|------|------|--------|----------|
| E5-S1 | 性能基线建立 | Lighthouse Performance 基线数据存档 | 0.5d | P2 | 见下方 |
| E5-S2 | 三树渲染优化 | 节点 100 时 FPS ≥ 30，三树切换 < 200ms | 1.5-2d | P2 | 见下方 |

### E5-S1 验收标准（expect() 断言）

```ts
// Lighthouse 基线存档存在
const baselineReport = fs.readFileSync('reports/lighthouse-baseline.json')
expect(baselineReport).toBeTruthy()
const metrics = JSON.parse(baselineReport)
expect(metrics).toHaveProperty('categories.performance.score')
expect(metrics.categories.performance.score).toBeGreaterThan(0)
```

### E5-S2 验收标准（expect() 断言）

```ts
// 节点 100 时 FPS ≥ 30
await loadCanvasWithNodes(100)
const fps = await measureFPS()
expect(fps).toBeGreaterThanOrEqual(30)

// 三树切换延迟 < 200ms
const t1 = Date.now()
await page.click('[data-testid="tree-tab-2"]')
await waitFor(() => isVisible('.tree-rendered'))
const t2 = Date.now()
expect(t2 - t1).toBeLessThan(200)

// Lighthouse Performance 不劣化
const currentScore = await runLighthouse().then(r => r.categories.performance.score)
const baselineScore = baselineReport.categories.performance.score
expect(currentScore).toBeGreaterThanOrEqual(baselineScore - 0.05) // 允许 5% 波动
```

### 功能点详情

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | Lighthouse 基线 | 存档 Performance 基线报告 | expect(baselineReport).toBeTruthy() | 是【需页面集成】 |
| F5.2 | FPS 优化 | 节点 100 时 FPS ≥ 30 | expect(fps).toBeGreaterThanOrEqual(30) | 是【需页面集成】 |
| F5.3 | 三树切换优化 | 三树切换延迟 < 200ms | expect(switchDelay).toBeLessThan(200) | 是【需页面集成】 |

---

## Epic 6: Canvas 全局搜索

### Story 清单

| ID | Story | 描述 | 工时 | 优先级 | 验收标准 |
|----|-------|------|------|--------|----------|
| E6-S1 | Canvas 内搜索 | 画布内实时搜索过滤节点 | 1d | P2 | 见下方 |
| E6-S2 | 键盘快捷键 | `/` 快捷键聚焦搜索框 | 0.5d | P2 | 见下方 |

### E6-S1 验收标准（expect() 断言）

```ts
// 搜索框可输入
expect(isVisible('[data-testid="canvas-search-input"]')).toBe(true)
await page.fill('[data-testid="canvas-search-input"]', 'user')
await waitFor(() => {
  const results = page.locator('.search-result-item')
  expect(results.first()).toBeVisible()
})

// 高亮显示
expect(page.locator('.search-highlight')).toHaveCount({ min: 1 })

// 无匹配结果显示
await page.fill('[data-testid="canvas-search-input"]', 'xyznotexist123')
await waitFor(() => {
  expect(screen.queryByText('未找到')).toBeTruthy()
})

// 搜索响应时间 < 200ms
const t1 = Date.now()
await page.fill('[data-testid="canvas-search-input"]', 'component')
await waitFor(() => isVisible('.search-result-item'))
const t2 = Date.now()
expect(t2 - t1).toBeLessThan(200)

// 单元测试
expect(await runVitest('search.test.ts')).toBe(true)
```

### E6-S2 验收标准（expect() 断言）

```ts
// `/` 聚焦搜索框
await page.keyboard.press('/')
expect(page.locator('[data-testid="canvas-search-input"]')).toBeFocused()

// Escape 关闭搜索
await page.keyboard.press('Escape')
expect(page.locator('[data-testid="canvas-search-input"]')).not.toBeFocused()
expect(isHidden('.search-results-popover')).toBe(true)
```

### 功能点详情

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | Canvas 内搜索 | 实时过滤 + 高亮 | expect(isVisible('.search-result-item')).toBe(true) | 是【需页面集成】 |
| F6.2 | `/` 快捷键 | 聚焦搜索框 | expect(input).toBeFocused() | 是【需页面集成】 |
| F6.3 | 搜索性能 | 响应 < 200ms | expect(searchDelay).toBeLessThan(200) | 是【需页面集成】 |

---

## 优先级矩阵

| Epic | Story | 优先级 | 工时 | 前置依赖 | 备注 |
|------|-------|--------|------|----------|------|
| E1 | E1-S1 后端 API 修复 | P0 | 0.5d | 无 | 立即执行 |
| E1 | E1-S2 前端 Widget | P0 | 1d | E1-S1 | 零依赖 |
| E2 | E2-S1 生产验证 | P0 | 0.5d | 无 | 立即执行 |
| E2 | E2-S2 E2E 补全 | P0 | 1.5d | E2-S1 | 立即执行 |
| E3 | E3-S1 多用户 Presence | P1 | 2d | Sprint 8 P002 | 条件执行 |
| E3 | E3-S2 Cursor 同步 | P1 | 1.5d | E3-S1 | 条件执行 |
| E3 | E3-S3 ConflictBubble | P1 | 0.5d | E3-S1 | 条件执行 |
| E4 | E4-S1 DDL 扩展 | P1 | 1d | 无 | Sprint 9 选做 |
| E4 | E4-S2 PRD 双格式 | P1 | 0.5d | 无 | Sprint 9 选做 |
| E4 | E4-S3 PRD 预览 | P1 | 0.5d | E4-S2 | Sprint 9 选做 |
| E5 | E5-S1 性能基线 | P2 | 0.5d | 无 | Sprint 9 备选 |
| E5 | E5-S2 三树优化 | P2 | 1.5-2d | E5-S1 | Sprint 9 备选 |
| E6 | E6-S1 Canvas 搜索 | P2 | 1d | 无 | Sprint 9 备选 |
| E6 | E6-S2 键盘快捷键 | P2 | 0.5d | E6-S1 | Sprint 9 备选 |

**Sprint 9 第一批次（3.5d）**: E1-S1 + E1-S2 + E2-S1 + E2-S2，全部零依赖，立即可见价值。
**Sprint 9 第二批次（2d）**: E4-S1 + E4-S2，零依赖。
**Sprint 9 第三批次（3d，条件性）**: E3-S1 + E3-S2 + E3-S3，等 Sprint 8 验证通过。
**备选池**: E5 + E6。

---

## DoD (Definition of Done)

### 通用 DoD（所有 Epic 适用）

- [ ] 代码通过 `pnpm lint` 和 `pnpm typecheck`
- [ ] 所有新功能有单元测试（Vitest），覆盖率 ≥ 80%
- [ ] 所有新功能有 E2E 测试（Playwright），路径覆盖 ≥ 80%
- [ ] `git commit` 附带结构化 message（feat/fix/refactor: description）
- [ ] PR 已 review 并合并到 main branch
- [ ] 生产环境验证通过（gstack 或 CI/CD 部署后测试）

### Epic 专用 DoD

**E1（Analytics）**:
- [ ] `curl https://api.vibex.top/api/v1/analytics` 返回 200，4 项指标齐全
- [ ] Dashboard `/dashboard` 页面 analytics widget 四态（加载/正常/空/错误）均有 UI
- [ ] `npx vitest run analytics-widget.test.ts` 全部通过
- [ ] `npx playwright test analytics-widget.spec.ts` 全部通过

**E2（Teams）**:
- [ ] 生产环境 `/dashboard/teams` 页面 h1 包含 "Teams"，`.teams-list` 可见
- [ ] 401/404/网络错误态均有 UI
- [ ] Playwright 测试用例数 ≥ 8，100% 通过
- [ ] Console 无 error 级别日志

**E3（Firebase 协作）**:
- [ ] Sprint 8 P002-S1 Architect 评审报告已产出且通过
- [ ] Sprint 8 P002-S2 冷启动测试 < 500ms
- [ ] 5 用户并发 presence < 3s
- [ ] Canvas 显示其他用户头像 + 名称
- [ ] Cursor 同步 < 500ms
- [ ] Playwright E2E 5 用户并发场景通过

**E4（DDL/PRD v2）**:
- [ ] DDL 支持 VARCHAR/INT/DATE/ENUM/JSONB/UUID/ARRAY 共 7 种类型
- [ ] DDL 包含 CREATE INDEX 语句
- [ ] PRD 输出 Markdown + JSON Schema 双格式
- [ ] PRD Generator 页面有预览面板（Markdown/JSON Tab 切换）
- [ ] `npx vitest run generators.test.ts` 全部通过
- [ ] E2E: 生成的 DDL 在 pgAdmin 可执行

**E5（Canvas 性能）**:
- [ ] Lighthouse Performance 基线报告存档到 `reports/lighthouse-baseline.json`
- [ ] 节点数 100 时 FPS ≥ 30
- [ ] 三树切换延迟 < 200ms
- [ ] 优化后 Performance 分数不劣化（相比基线 -5% 以内）

**E6（全局搜索）**:
- [ ] Canvas 内搜索框可输入，实时过滤
- [ ] 搜索结果有高亮
- [ ] `/` 快捷键可聚焦搜索框，Escape 关闭
- [ ] 无匹配时显示"未找到"
- [ ] 搜索响应时间 < 200ms
- [ ] `npx vitest run search.test.ts` 全部通过

---

## PRD 格式校验（自检）

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
- [x] 功能点 ID 格式正确（F1.1 / E1-S1）
- [x] 【需页面集成】标注完整
- [x] 验收标准可测试、可验证

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID 待补充
- **执行日期**: 2026-04-25（Sprint 9 起始日）
