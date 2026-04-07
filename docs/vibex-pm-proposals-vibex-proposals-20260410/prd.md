# VibeX PM Proposals 2026-04-10 — PRD

> **文档版本**: v1.0
> **作者**: PM Agent
> **日期**: 2026-04-10
> **状态**: Draft
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 1.1 背景

VibeX 是一个 AI 驱动的 DDD（领域驱动设计）产品建模平台，通过对话式需求分析生成领域模型、可视化流程和原型页面。当前产品在新用户引导、需求输入质量、多项目管理方面存在明显短板：

- **新用户流失率高**：首次访问面对空白输入框，不知从何下手
- **AI 生成质量不稳定**：用户输入模糊时，直接生成错误领域模型
- **项目管理功能弱**：项目数量增加后无法快速定位，协作功能缺失
- **版本管理缺失**：无法追溯需求变更历史

### 1.2 目标

在 3 个 Sprint（~14h）内完成 P0-P1 级核心功能，在第 4 个 Sprint（4h）完成 P2 级优化功能，全面提升新用户留存率和产品可用性。

### 1.3 成功指标

| 指标 | 当前基线 | 目标值 | 测量方式 |
|------|---------|--------|---------|
| 新用户首次引导完成率 | N/A | > 70% | 引导完成事件埋点 |
| AI 生成质量评分 | 3.0/5 | 4.0/5 | 用户反馈评分 |
| 项目搜索响应时间 | N/A | < 200ms | DevTools Network |
| 团队协作功能可用率 | 0% | 100% | 功能可用性测试 |
| 版本对比功能使用率 | N/A | > 40% | 功能点击埋点 |

---

## 2. Feature List

| ID | 功能名称 | 功能描述 | 根因关联 | 优先级 | 工时 |
|----|---------|---------|---------|--------|------|
| F01 | 需求模板库 | 提供电商/社交/SaaS 三类行业模板，用户选择后自动填充示例需求 | P001 / FR-001 | P0 | 3h |
| F02 | 新手引导流程 | 分步骤 overlay 引导新用户完成首次操作，支持跳过 | P002 / FR-009 | P0 | 3h |
| F03 | 需求智能补全 | 输入过程中 AI 主动检测关键词，触发澄清追问 | P003 / FR-002 | P1 | 4h |
| F04 | 项目搜索过滤 | 全局搜索栏支持按名称/时间/标签过滤，响应 < 200ms | P004 / FR-010 | P1 | 2h |
| F05 | 团队协作空间 | 基于 KV 的轻量团队协作，支持成员邀请和权限管理 | P005 / FR-004 | P1 | 6h |
| F06 | 项目版本对比 | 每次保存生成快照，支持版本历史查看和两版本差异高亮 | P006 / FR-003 | P1 | 3h |
| F07 | 快捷键系统 | 支持常用快捷键（Ctrl+S/Ctrl+Z），提供快捷键面板 | P007 / FR-007 | P2 | 1h |
| F08 | 离线模式提示 | 检测网络状态，离线时显示提示条并缓存操作 | P008 / FR-008 | P2 | 1h |
| F09 | 需求导入导出 | 支持 Markdown/JSON/YAML 格式的导入导出 | P009 / FR-005 | P2 | 1h |
| F10 | AI 生成结果评分 | 分析结果页支持 1-5 星评分和文字反馈 | P010 / FR-006 | P2 | 1h |
| **合计** | | | | | **25h** |

---

## 3. Epic 拆分

### Epic E01: 需求模板库（3h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E01-S1 | 模板存储结构定义 | 0.5h | 模板文件结构符合规范，支持 title/industry/entities/contexts/example_requirements |
| E01-S2 | 模板库页面开发 | 1.5h | `/templates` 页面显示模板卡片列表，每个模板显示名称、行业、描述 |
| E01-S3 | 模板选择与填充 | 1h | 点击模板后首页输入框自动填充模板内容，支持一键修改 |

### Epic E02: 新手引导流程（3h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E02-S1 | 引导步骤配置 | 0.5h | 引导步骤可配置，步骤数 ≤4，支持 step/highlight/action 配置 |
| E02-S2 | Overlay 引导组件 | 1h | 复用 `<CanvasOnboardingOverlay />`，支持 next/prev/skip 按钮 |
| E02-S3 | 引导状态持久化 | 0.5h | 引导完成或跳过状态存入 localStorage，刷新后不重复弹出 |
| E02-S4 | 引导完成流程 | 1h | 引导完成后跳转 Dashboard，所有功能可用，无引导残留 |

### Epic E03: 需求智能补全（4h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E03-S1 | 关键词检测引擎 | 1h | 输入 ≥50 字时触发检测，支持实体名/动词/业务术语识别 |
| E03-S2 | 追问气泡 UI | 1.5h | 检测到关键词后显示追问气泡，响应时间 < 1s |
| E03-S3 | 多轮澄清逻辑 | 1.5h | 支持多轮追问，记录上下文，最终触发 AI 分析 |

### Epic E04: 项目搜索过滤（2h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E04-S1 | 搜索栏组件 | 0.5h | 全局搜索栏组件，支持实时搜索 |
| E04-S2 | 过滤逻辑实现 | 1h | 支持按名称/创建时间/标签过滤，搜索响应 < 200ms |
| E04-S3 | 分类视图 | 0.5h | 支持按时间/类型/状态分类展示 |

### Epic E05: 团队协作空间（6h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E05-S1 | 团队创建 | 1h | 支持创建团队，获取团队 ID，存入 KV |
| E05-S2 | 成员邀请与权限 | 2h | 支持邀请成员（邮箱/用户名），设置 owner/member/viewer 权限 |
| E05-S3 | 项目共享管理 | 2h | 支持将项目共享给团队，权限控制生效 |
| E05-S4 | 协作状态展示 | 1h | 协作视图中显示在线成员、实时光标（可选 MVP 跳过） |

### Epic E06: 项目版本对比（3h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E06-S1 | 版本快照生成 | 1h | 每次保存自动生成快照，存入 KV，包含时间/描述/内容 |
| E06-S2 | 版本历史列表 | 1h | 版本列表显示时间、描述、作者，支持翻页 |
| E06-S3 | 版本对比视图 | 1h | 两版本对比时高亮差异字段，支持 side-by-side 和 unified 模式 |

### Epic E07: 快捷键系统（1h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E07-S1 | 快捷键注册 | 0.5h | 注册 Ctrl+S（保存）/Ctrl+Z（撤销）/Ctrl+/（帮助面板） |
| E07-S2 | 快捷键面板 | 0.5h | 快捷键帮助面板显示所有可用快捷键 |

### Epic E08: 离线模式提示（1h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E08-S1 | 网络状态检测 | 0.5h | 使用 navigator.onLine 和 online/offline 事件检测网络 |
| E08-S2 | 离线提示与恢复 | 0.5h | 离线时显示提示条，缓存操作队列，恢复后自动同步 |

### Epic E09: 需求导入导出（1h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E09-S1 | 导入功能 | 0.5h | 支持 Markdown/JSON/YAML 格式导入，解析后填充需求 |
| E09-S2 | 导出功能 | 0.5h | 导出分析结果为 Markdown/JSON，包含完整分析内容 |

### Epic E10: AI 生成结果评分（1h）

| Story ID | Story 名称 | 工时 | 验收标准 |
|---------|-----------|------|---------|
| E10-S1 | 评分 UI | 0.5h | 分析结果页显示 1-5 星评分，支持文字反馈输入 |
| E10-S2 | 评分数据存储 | 0.5h | 评分数据存入 KV，支持按时间/项目聚合查询 |

---

## 4. 验收标准（assertions）

### E01 需求模板库

```javascript
// E01-S2: 模板库页面
expect(await page.goto('/templates')).resolves.toBeOK()
expect(await page.locator('.template-card').count()).toBeGreaterThanOrEqual(3)
expect(await page.locator('.template-card').first().locator('.template-name')).toBeVisible()

// E01-S3: 模板选择与填充
await page.click('.template-card[data-industry="ecommerce"]')
await expect(page.locator('#requirement-input')).toHaveValue(/电商|订单|用户/)
await page.fill('#requirement-input', '自定义需求')
await expect(page.locator('#requirement-input')).toHaveValue('自定义需求')
```

### E02 新手引导流程

```javascript
// E02-S2: 引导触发
await page.evaluate(() => localStorage.clear())
await page.goto('/dashboard')
await expect(page.locator('.onboarding-overlay')).toBeVisible()
await expect(page.locator('.onboarding-step').count()).toBeLessThanOrEqual(4)

// E02-S3: 跳过不重复
await page.click('.onboarding-skip')
await expect(page.locator('.onboarding-overlay')).not.toBeVisible()
await page.reload()
await expect(page.locator('.onboarding-overlay')).not.toBeVisible()
```

### E03 需求智能补全

```javascript
// E03-S1: 关键词检测触发
await page.fill('#requirement-input', '这是一个关于订单管理的系统，需要记录用户的购买记录和支付信息')
await expect(page.locator('.smart-hint-bubble')).toBeVisible({ timeout: 1000 })

// E03-S2: 追问响应时间
const start = Date.now()
await page.fill('#requirement-input', '用户想要下单并完成支付')
await page.waitForSelector('.smart-hint-bubble')
expect(Date.now() - start).toBeLessThan(1000)
```

### E04 项目搜索过滤

```javascript
// E04-S2: 搜索响应
const start = Date.now()
await page.fill('#project-search', '电商')
const results = await page.locator('.project-item').all()
expect(Date.now() - start).toBeLessThan(200)

// E04-S2: 多维度过滤
await page.selectOption('#filter-type', 'ecommerce')
await expect(page.locator('.project-item').first()).toBeVisible()
```

### E05 团队协作空间

```javascript
// E05-S1: 创建团队
await page.click('#create-team-btn')
await page.fill('#team-name-input', '测试团队')
await page.click('#confirm-create-team')
await expect(page.locator('.team-list')).toContainText('测试团队')

// E05-S2: 成员邀请
await page.fill('#invite-email', 'teammate@example.com')
await page.selectOption('#member-role', 'member')
await page.click('#send-invite')
await expect(page.locator('.member-list')).toContainText('teammate@example.com')

// E05-S4: 权限控制
const memberUser = await loginAs('member@example.com')
await memberUser.goto(`/project/${projectId}`)
await expect(memberUser.locator('#edit-btn')).toBeDisabled()
```

### E06 项目版本对比

```javascript
// E06-S1: 版本快照
await page.click('#save-btn')
await page.fill('#version-description', '添加订单模块')
await page.click('#confirm-save')
await expect(page.locator('.version-list')).toContainText('添加订单模块')

// E06-S3: 版本对比
await page.click('.version-item[data-index="1"]')
await page.click('.version-item[data-index="0"]')
await page.click('#compare-btn')
await expect(page.locator('.diff-highlight-add')).toBeVisible()
await expect(page.locator('.diff-highlight-remove')).toBeVisible()
```

### E07 快捷键系统

```javascript
// E07-S1: 快捷键生效
await page.keyboard.press('Control+s')
await expect(page.locator('.save-indicator')).toContainText('已保存')

// E07-S2: 快捷键面板
await page.keyboard.press('Control+/')
await expect(page.locator('.shortcuts-panel')).toBeVisible()
await expect(page.locator('.shortcut-item')).toHaveCount.greaterThan(3)
```

### E08 离线模式提示

```javascript
// E08-S1: 离线提示
await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { value: false }))
await page.dispatchEvent('body', 'offline')
await expect(page.locator('.offline-banner')).toBeVisible()
await expect(page.locator('.offline-banner')).toContainText('网络已断开')
```

### E09 需求导入导出

```javascript
// E09-S1: Markdown 导入
const file = new File(['# 订单系统\n## 实体\n- 订单\n- 用户'], 'requirements.md', { type: 'text/markdown' })
await page.setInputFiles('#import-input', file)
await expect(page.locator('#requirement-input')).toHaveValue(/订单系统/)

// E09-S2: JSON 导出
await page.click('#export-btn')
await page.click('.export-format[data-format="json"]')
await expect(page.locator('.export-download')).toBeAttached()
```

### E10 AI 生成结果评分

```javascript
// E10-S1: 评分交互
await page.goto('/analysis/result/123')
await page.click('.star-rating [data-value="5"]')
await page.fill('#feedback-input', '分析结果非常准确')
await page.click('#submit-rating')
await expect(page.locator('.rating-success')).toBeVisible()
```

---

## 5. Definition of Done

所有功能必须满足以下条件方可视为完成：

### 功能完成标准

- [ ] 所有 Story 实现代码已合并至 `main` 分支
- [ ] 对应 Epic 的 E2E 测试全部通过（assertions 覆盖）
- [ ] 功能验收标准（AC-001 ~ AC-018）100% 通过
- [ ] 代码审查（Code Review）已通过
- [ ] 无 P0/P1 级别 Bug 遗留

### 文档完成标准

- [ ] Epic Spec 文档已创建并 review 通过
- [ ] API 接口文档（如有）已更新
- [ ] 用户使用文档（如有）已更新

### 质量完成标准

- [ ] 新功能代码覆盖率 > 70%
- [ ] Lighthouse Performance Score > 80
- [ ] 无新增 console.error
- [ ] 无新增 accessibility 问题

---

## 6. 功能点汇总表（含页面集成标注）

| 功能 ID | 功能名称 | 涉及页面/路由 | 组件改动 | API 改动 |
|---------|---------|-------------|---------|---------|
| F01 | 需求模板库 | `/templates`, `/` (首页) | `TemplateCard`, `TemplateFilter` | 无（本地文件系统） |
| F02 | 新手引导流程 | `/dashboard`, `/` | `OnboardingOverlay`, `OnboardingTooltip` | 无 |
| F03 | 需求智能补全 | `/` (首页) | `SmartHintBubble`, `KeywordDetector` | 新增 `/api/v1/keyword-detect` |
| F04 | 项目搜索过滤 | `/projects` | `ProjectSearchBar`, `ProjectFilter` | 新增 `/api/v1/projects/search` |
| F05 | 团队协作空间 | `/teams`, `/projects/:id` | `TeamList`, `MemberInvite`, `PermissionGate` | 扩展 KV schema |
| F06 | 项目版本对比 | `/projects/:id/history` | `VersionList`, `DiffViewer` | 新增 `/api/v1/versions` |
| F07 | 快捷键系统 | 全局 | `ShortcutProvider`, `ShortcutsPanel` | 无 |
| F08 | 离线模式提示 | 全局 | `OfflineBanner`, `OperationQueue` | 无 |
| F09 | 需求导入导出 | `/` (首页), `/analysis/result` | `ImportModal`, `ExportModal` | 无 |
| F10 | AI 生成结果评分 | `/analysis/result/:id` | `StarRating`, `FeedbackForm` | 新增 `/api/v1/ratings` |

---

## 7. 实施计划（Sprint 排期）

### Sprint 1（6h）— 新用户激活

| Epic | Stories | 工时 | 负责人 | 开始 | 结束 |
|------|---------|------|--------|------|------|
| E02 新手引导 | E02-S1 ~ E02-S4 | 3h | dev | Week 1 Day 1 | Week 1 Day 2 |
| E01 模板库 | E01-S1 ~ E01-S3 | 3h | dev | Week 1 Day 2 | Week 1 Day 3 |

**Sprint 1 目标**: 新用户首次访问引导完成率 > 70%，用户输入质量提升

### Sprint 2（6h）— 核心体验提升

| Epic | Stories | 工时 | 负责人 | 开始 | 结束 |
|------|---------|------|--------|------|------|
| E03 智能补全 | E03-S1 ~ E03-S3 | 4h | dev + backend | Week 2 Day 1 | Week 2 Day 3 |
| E04 搜索过滤 | E04-S1 ~ E04-S3 | 2h | dev | Week 2 Day 1 | Week 2 Day 2 |

**Sprint 2 目标**: AI 生成质量评分 3.0 → 4.0，项目搜索响应 < 200ms

### Sprint 3（8h）— 企业场景铺垫

| Epic | Stories | 工时 | 负责人 | 开始 | 结束 |
|------|---------|------|--------|------|------|
| E05 协作空间 | E05-S1 ~ E05-S4 | 6h | dev | Week 3 Day 1 | Week 3 Day 4 |
| E06 版本对比 | E06-S1 ~ E06-S3 | 3h | dev | Week 3 Day 3 | Week 3 Day 5 |
| *(缓冲)* | | *1h* | | | |

**Sprint 3 目标**: 团队协作功能可用，版本对比功能使用率 > 40%

### Sprint 4（4h）— 效率优化

| Epic | Stories | 工时 | 负责人 | 开始 | 结束 |
|------|---------|------|--------|------|------|
| E07 快捷键 | E07-S1 ~ E07-S2 | 1h | dev | Week 4 Day 1 | Week 4 Day 1 |
| E08 离线提示 | E08-S1 ~ E08-S2 | 1h | dev | Week 4 Day 1 | Week 4 Day 2 |
| E09 导入导出 | E09-S1 ~ E09-S2 | 1h | dev | Week 4 Day 2 | Week 4 Day 2 |
| E10 AI 评分 | E10-S1 ~ E10-S2 | 1h | dev | Week 4 Day 2 | Week 4 Day 3 |

**Sprint 4 目标**: 高级用户效率提升，支持离线场景，评分数据积累

---

### 总工时汇总

| Sprint | 内容 | 工时 | 产出 |
|--------|------|------|------|
| Sprint 1 | P0×2（引导+模板） | 6h | 新用户激活 |
| Sprint 2 | P1×2（补全+搜索） | 6h | 核心体验 |
| Sprint 3 | P1×2（协作+版本） | 8h | 企业铺垫 |
| Sprint 4 | P2×4（键/离线/导入/评分） | 4h | 效率优化 |
| **合计** | | **24h** | |

> 注：总计与 Feature List 的 25h 存在 1h 差异（原估算含缓冲），实际实施以 Sprint 3 缓冲时间覆盖。

---

## 8. 非功能需求

| 类型 | 要求 |
|------|------|
| 性能 | 搜索响应 < 200ms，AI 追问响应 < 1s，页面首次加载 < 3s |
| 可用性 | 新用户引导完成率 > 70%，操作步骤 ≤ 4 步 |
| 可扩展性 | 模板库支持后续迁移至数据库方案（方案 B） |
| 安全性 | 团队权限控制符合最小权限原则 |
| 兼容性 | 支持 Chrome/Firefox/Safari 最新版本 |

---

## 9. Out of Scope

以下功能明确不在本次范围：

- ~~用户自定义模板提交~~（P001 方案 B）
- ~~复杂权限体系（行级权限）~~（P005 方案 B）
- ~~移动端支持~~（本期仅 Web）
- ~~AI 模型训练/微调~~（本期仅使用层面）
- ~~实时协作光标~~（E05-S4 MVP 跳过）
