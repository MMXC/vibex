# PRD: VibeX PM 提案 — 产品功能实现规划

**Project**: vibex-pm-proposals-20260414_143000
**Stage**: create-prd
**PM**: PM Agent
**Date**: 2026-04-14
**Status**: Draft

---

## 执行决策
- **决策**: 已采纳（P-001/002/003/004/010 进 Sprint 1）
- **执行项目**: vibex-pm-proposals-20260414_143000
- **执行日期**: 2026-04-14

---

## 1. 执行摘要

### 背景

PM 提案 12 项，覆盖 VibeX 全产品链路。整体策略：**先打好用户体验基础，再扩展协作/高级功能**。

核心问题：
- **门面问题**：Auth 页面视觉割裂（浅色内联样式 vs 深色赛博朋克），损害第一印象
- **AI 价值链断裂**：需求输入模糊 → 直接生成 → 结果不符合预期 → 用户放弃
- **效率体验缺失**：10+ 项目后无法快速定位、Canvas Phase 导航混乱、错误提示不统一
- **企业场景空白**：团队协作 UI 完全缺失（KV 后端空转）

### 目标

| 目标 | 指标 |
|------|------|
| 品牌视觉统一 | Auth 页面使用 CSS 变量，无内联样式 |
| AI 补全上线 | 澄清响应 < 1s，追问轮次 ≤ 3 |
| 项目搜索可用 | 搜索响应 < 2s |
| Phase 导航清晰 | active 高亮，刷新保持 |
| 错误体验统一 | 全站人类可读错误提示 |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| Auth 深色覆盖率 | 100% |
| AI 澄清卡片用户满意度 | ≥ 4/5 |
| 项目搜索响应时间 | < 2s |
| TabBar E2E 测试通过率 | 100% |
| API 错误人类可读率 | 100% |

---

## 2. Feature List（来自 Analysis）

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | Auth 页面 CSS Module 迁移 | 内联样式迁移到 CSS Module，应用设计变量 | P-001 | 2h |
| F1.2 | 背景系统复用 | 复用 Dashboard 网格叠加 + 发光球 | P-001 | 0.5h |
| F2.1 | 澄清卡片 UI 组件 | 需求输入页显示 AI 澄清问题卡片 | P-002 | 2h |
| F2.2 | AI 追问 prompt 设计 | 设计追问 prompt，限制最大轮次 ≤ 3 | P-002 | 2h |
| F3.1 | Dashboard fuzzy 搜索 | 前端 fuzzy 搜索，debounce 300ms | P-003 | 2h |
| F4.1 | TabBar 行为一致性 | 所有 tab setPhase + setActiveTree 对称 | P-004 | 2h |
| F4.2 | Phase active 高亮 | 导航栏高亮当前 Phase，刷新保持 | P-004 | 1h |
| F5.1 | 后端错误格式统一 | 统一为 `{ error: { code, message } }` | P-010 + A-P1-3 | 2h |
| F5.2 | 前端错误展示重构 | 统一 Toast 组件，人类可读文字 | P-010 | 2h |
| F6.1 | 团队 CRUD API | 团队创建/邀请/权限管理 API | P-005 | 3h |
| F6.2 | 团队设置 UI | 团队设置页面 + 成员管理 | P-005 | 3h |
| F7.1 | 版本列表加载 | projectId 稳定后验证版本列表加载 | P-006 | 1h |
| F7.2 | 版本对比视图 | 两版本 diff 高亮（新增/删除/修改）| P-006 | 2h |
| F8.1 | 需求文档导入 | 支持 .md/.json/.yaml 格式导入 | P-007 | 1h |
| F8.2 | 设计产物导出 | 导出 Markdown/Mermaid/JSON | P-007 | 1h |
| **合计** | | | | **28.5h** |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 品牌一致性 | 2.5h | P0 | S1.1, S1.2 |
| E2 | 核心价值链 | 4h | P0 | S2.1, S2.2 |
| E3 | 效率体验 | 2h | P1 | S3.1 |
| E4 | Canvas 导航 | 3h | P1 | S4.1, S4.2 |
| E5 | 错误体验 | 4h | P1 | S5.1, S5.2 |
| E6 | 团队协作 | 6h | P2 | S6.1, S6.2 |
| E7 | 版本历史 | 3h | P2 | S7.1, S7.2 |
| E8 | 导入导出 | 2h | P2 | S8.1, S8.2 |

**总工时**: 26.5h（含 2h 缓冲）

---

### Epic 1: 品牌一致性（P0）

**目标**: Auth 页面视觉与 VibeX 深色赛博朋克风格完全统一。

#### Story S1.1: Auth 页面 CSS Module 迁移

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | auth.module.css 创建 | 创建 `auth.module.css`，复用 Dashboard 背景 | `expect(fs.existsSync('auth.module.css')).toBe(true)` | 【需页面集成 /auth】 |
| F1.1.1 | 玻璃态卡片 | 登录卡片使用 `backdrop-filter: blur(20px)` | `expect(card).toContain('backdrop-filter: blur(20px)')` | 【需页面集成 /auth】 |
| F1.1.2 | 霓虹发光按钮 | 主按钮使用 `--gradient-primary` + 霓虹发光 | `expect(button).toContain('--gradient-primary')` | 【需页面集成 /auth】 |
| F1.1.3 | 内联样式清除 | 原有内联 `style={{}}` 全部迁移 | `expect(inlineStyleCount).toBe(0)` | 【需页面集成 /auth】 |

**DoD**: `/auth` 无内联样式，视觉与 `/canvas` 一致。

#### Story S1.2: 背景系统复用

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.2 | 网格叠加层 | 复用 `.gridOverlay` 样式 | `expect(css).toContain('background-image: linear-gradient')` | 【需页面集成 /auth】 |
| F1.2.1 | 发光球 | 复用 `.glowOrb` 样式 | `expect(css).toContain('radial-gradient')` | 【需页面集成 /auth】 |

**DoD**: Auth 背景与 Dashboard 完全一致。

---

### Epic 2: 核心价值链（P0）

**目标**: 实现需求智能补全，提升 AI 生成质量。

#### Story S2.1: 澄清卡片 UI 组件

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 澄清卡片组件 | 需求输入页显示 AI 澄清问题卡片 | `expect(card).toBeVisible()` | 【需页面集成 /confirm】 |
| F2.1.1 | 问题展示 | 每张卡片 1 个具体澄清问题 | `expect(questionText).not.toContain('请详细描述')` | 【需页面集成 /confirm】 |
| F2.1.2 | 跳过按钮 | 用户可跳过澄清继续生成 | `expect(skipButton).toBeVisible()` | 【需页面集成 /confirm】 |
| F2.1.3 | 最多显示 3 条 | 同一时间最多显示 3 张卡片 | `expect(cardCount).toBeLessThanOrEqual(3)` | 【需页面集成 /confirm】 |

**DoD**: 需求输入页显示 AI 澄清卡片，用户可回答或跳过。

#### Story S2.2: AI 追问 prompt 设计

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.2 | 追问 prompt | 设计追问 prompt，提取缺失关键信息 | `expect(prompt).toBeDefined()` | 否 |
| F2.2.1 | 最大轮次 ≤ 3 | 追问最多 3 轮，超出自动结束 | `expect(maxRounds).toBeLessThanOrEqual(3)` | 否 |
| F2.2.2 | 自动结束 | 连续 2 轮无新信息自动结束 | `expect(autoEndLogic).toBe(true)` | 否 |

**DoD**: AI 追问最大 3 轮，有自动结束逻辑。

---

### Epic 3: 效率体验（P1）

**目标**: 项目列表 fuzzy 搜索，提升多项目用户效率。

#### Story S3.1: Dashboard fuzzy 搜索

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 搜索输入框 | Dashboard 项目列表增加搜索框 | `expect(searchInput).toBeVisible()` | 【需页面集成 /dashboard】 |
| F3.1.1 | Fuzzy 搜索 | 关键词过滤项目名称，debounce 300ms | `expect(filterTime).toBeLessThan(200)` | 【需页面集成 /dashboard】 |
| F3.1.2 | 空结果友好提示 | 无结果时显示"暂无匹配项目" | `expect(emptyMessage).toBeVisible()` | 【需页面集成 /dashboard】 |
| F3.1.3 | 响应时间 | 搜索到结果展示 < 2s | `expect(responseTime).toBeLessThan(2000)` | 【需页面集成 /dashboard】 |

**DoD**: Dashboard 项目列表支持 fuzzy 搜索，响应 < 2s。

---

### Epic 4: Canvas 导航（P1）

**目标**: Canvas Phase 导航清晰化。

#### Story S4.1: TabBar 行为一致性

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | Tab 行为对称 | 所有 tab setPhase + setActiveTree 对称 | `expect(behaviorConsistent).toBe(true)` | 【需页面集成 /canvas】 |
| F4.1.1 | E2E 基线验证 | TabBar 切换 E2E 测试通过 | `expect(e2eTabs).toHaveCount(5)` | 【需页面集成 /canvas】 |
| F4.1.2 | Mobile prototype tab | 移动端 prototype tab 与桌面端一致 | `expect(mobileDesktopConsistent).toBe(true)` | 【需页面集成 /canvas】 |

**DoD**: TabBar 所有 tab 点击行为一致，E2E 测试通过。

#### Story S4.2: Phase active 高亮

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.2 | Active 高亮 | 当前 Phase tab 高亮（背景/边框/颜色区分）| `expect(activeTab).toHaveClass(/active/)` | 【需页面集成 /canvas】 |
| F4.2.1 | 刷新保持 | 页面刷新后 active Phase 保持 | `expect(stateAfterRefresh).toEqual(stateBefore)` | 【需页面集成 /canvas】 |
| F4.2.2 | 过渡动画 | Phase 切换 200ms ease-out 动画 | `expect(transitionDuration).toBe(200)` | 【需页面集成 /canvas】 |

**DoD**: Canvas Phase 导航高亮显示，刷新保持。

---

### Epic 5: 错误体验（P1）

**目标**: API 错误格式统一，全站展示人类可读提示。

#### Story S5.1: 后端错误格式统一

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | 统一错误格式 | 所有 API 错误响应 `{ error: { code, message } }` | `expect(errorFormat).toMatch('{ error: { code, message } }')` | 否 |
| F5.1.1 | 错误码映射表 | HTTP 状态码 → 人类可读文字 | `expect(mappingTable).toBeDefined()` | 否 |
| F5.1.2 | 覆盖 61 个路由 | 所有后端路由使用统一格式 | `expect(allRoutes).toBeCovered()` | 否 |

**DoD**: 后端所有路由错误响应符合统一格式。

#### Story S5.2: 前端错误展示重构

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.2 | Toast 错误组件 | 全站使用统一 `useToast` 组件 | `expect(toastGlobally).toBe(true)` | 【需页面集成 全站】 |
| F5.2.1 | 人类可读文字 | 不显示 "401 Unauthorized" 等技术描述 | `expect(humanReadable).toBe(true)` | 【需页面集成 全站】 |
| F5.2.2 | 重试按钮 | 5xx 错误显示重试按钮 | `expect(retryButton).toBeVisible()` | 【需页面集成 全站】 |
| F5.2.3 | Inline 错误 | Input 错误红色边框 + 错误文字 | `expect(inlineError).toBeVisible()` | 【需页面集成 全站】 |

**DoD**: 全站错误提示样式统一，人类可读。

---

### Epic 6: 团队协作（P2）

**目标**: 团队协作 UI 落地，企业场景就绪。

#### Story S6.1: 团队 CRUD API

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | 团队创建 API | POST /api/v1/teams 创建团队 | `expect(createTeam.status).toBe(201)` | 否 |
| F6.1.1 | 成员邀请 API | POST /api/v1/teams/:id/invite 邀请成员 | `expect(invite.status).toBe(200)` | 否 |
| F6.1.2 | 权限管理 API | Owner 可修改角色/移除成员 | `expect(roleUpdate.status).toBe(200)` | 否 |
| F6.1.3 | KV 后端验证 | CollaborationService 可用性验证 | `expect(kvServiceAvailable).toBe(true)` | 否 |

**DoD**: 团队 CRUD API 全部可用，KV 后端验证通过。

#### Story S6.2: 团队设置 UI

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.2 | 团队设置页 | 团队信息 + 成员列表 | `expect(teamSettingsPage).toBeVisible()` | 【需页面集成 /settings/team】 |
| F6.2.1 | 成员角色显示 | 列表显示 Owner/Member/Viewer | `expect(roleColumn).toContainAll(['Owner', 'Member', 'Viewer'])` | 【需页面集成 /settings/team】 |
| F6.2.2 | 权限冲突提示 | 多人同时编辑时提示 | `expect(conflictWarning).toBeVisible()` | 【需页面集成 /settings/team】 |

**DoD**: 团队设置 UI 完整，成员管理可用。

---

### Epic 7: 版本历史（P2）

**目标**: 版本历史稳定，加版本对比功能。

#### Story S7.1: 版本列表加载验证

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | projectId 链路验证 | projectId=null 时显示引导 UI | `expect(guideUI).toBeVisible()` | 【需页面集成 /canvas】 |
| F7.1.1 | 版本列表 API | GET /api/v1/projects/:id/versions | `expect(versionList.status).toBe(200)` | 否 |

**DoD**: 版本列表正常加载，projectId 链路稳定。

#### Story S7.2: 版本对比视图

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.2 | 版本 diff 高亮 | 选择两版本，diff 高亮（绿/红/黄）| `expect(diffView).toBeVisible()` | 【需页面集成 /canvas】 |
| F7.2.1 | 新增内容绿色 | 新增字段/节点显示绿色 | `expect(addedItems).toHaveClass(/added/)` | 【需页面集成 /canvas】 |
| F7.2.2 | 删除内容红色 | 删除字段/节点显示红色 | `expect(removedItems).toHaveClass(/removed/)` | 【需页面集成 /canvas】 |
| F7.2.3 | 恢复确认 | 可将旧版本恢复到当前（二次确认）| `expect(restoreConfirm).toBeVisible()` | 【需页面集成 /canvas】 |

**DoD**: 版本对比视图完整，支持高亮 diff。

---

### Epic 8: 导入导出（P2）

#### Story S8.1: 需求文档导入

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F8.1 | 文件格式支持 | 支持 .md/.json/.yaml 格式导入 | `expect(supportedFormats).toContainAll(['.md', '.json', '.yaml'])` | 【需页面集成 /confirm】 |
| F8.1.1 | 结构化解析 | 解析 bounded context / domain model / flow | `expect(parsedStructure).toBeDefined()` | 否 |
| F8.1.2 | 导入预览 | 导入前显示预览，用户确认 | `expect(preview).toBeVisible()` | 【需页面集成 /confirm】 |

**DoD**: 需求文档导入可用，预览确认后填充表单。

#### Story S8.2: 设计产物导出

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F8.2 | 多格式导出 | 导出 Markdown/Mermaid/JSON | `expect(downloadFormats).toContainAll(['.md', '.mermaid', '.json'])` | 【需页面集成 /canvas】 |
| F8.2.1 | 文件名规范 | 导出文件名包含项目名和时间戳 | `expect(filename).toMatch(/projectName_\d{8}_\d{6}/)` | 【需页面集成 /canvas】 |

**DoD**: 设计产物可导出为多格式，文件名规范。

---

## 4. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 访问 /auth | 页面加载 | 背景深色，无内联样式，玻璃态卡片 | P0 |
| AC2 | 用户输入需求 | 触发 AI | 显示澄清卡片（≤ 3 条），可回答或跳过 | P0 |
| AC3 | AI 追问 | 连续 2 轮无新信息 | 自动结束追问 | P0 |
| AC4 | Dashboard 列表 | 输入关键词 | 2s 内过滤，无结果显示友好提示 | P1 |
| AC5 | TabBar | 点击任意 tab | phase 正确更新，行为对称 | P1 |
| AC6 | Canvas Phase | 切换 Phase | active 高亮，刷新保持 | P1 |
| AC7 | API 错误 | 后端返回错误 | 格式 `{ error: { code, message } }` | P1 |
| AC8 | 前端错误展示 | 收到错误 | 人类可读，5xx 有重试按钮 | P1 |
| AC9 | 团队创建 | POST /api/v1/teams | 返回 201，KV 存储成功 | P2 |
| AC10 | 版本列表 | GET /api/v1/versions | 返回版本列表，无崩溃 | P2 |
| AC11 | 版本对比 | 选择两版本 | diff 高亮（绿/红/黄）| P2 |
| AC12 | 导入 .md 文件 | 上传文件 | 解析 bounded context/domain model/flow | P2 |

---

## 5. DoD (Definition of Done)

### E1 完成标准
- [ ] `auth.module.css` 存在，无内联 `style={{`
- [ ] `/auth` 使用 `--color-bg-primary`、玻璃态、`--gradient-primary` 按钮
- [ ] 背景与 Dashboard 一致

### E2 完成标准
- [ ] 澄清卡片组件可渲染，最多显示 3 张
- [ ] 追问最大 3 轮，自动结束逻辑存在
- [ ] 用户可跳过澄清继续生成

### E3 完成标准
- [ ] Dashboard 搜索 debounce 300ms，响应 < 2s
- [ ] 空结果友好提示

### E4 完成标准
- [ ] TabBar 所有 tab 行为对称
- [ ] active 高亮样式存在，刷新保持

### E5 完成标准
- [ ] 后端 61 个路由错误格式统一
- [ ] 前端 Toast 组件全局统一
- [ ] 人类可读文字，5xx 有重试按钮

### E6 完成标准
- [ ] 团队 CRUD API 可用，KV 后端验证通过
- [ ] 团队设置 UI 完整

### E7 完成标准
- [ ] 版本列表稳定加载
- [ ] diff 高亮视图完整

### E8 完成标准
- [ ] 支持 .md/.json/.yaml 导入
- [ ] 支持多格式导出，文件名规范

---

## 6. 规格文件（Specs）

| 文件 | 内容 |
|------|------|
| `specs/E1-auth-style.md` | Auth 页面 CSS Module 迁移详细规格 |
| `specs/E2-ai-clarification.md` | AI 澄清卡片组件 + prompt 设计规格 |
| `specs/E3-dashboard-search.md` | Dashboard fuzzy 搜索规格 |
| `specs/E4-canvas-nav.md` | Canvas Phase 导航 + TabBar 规格 |
| `specs/E5-error-experience.md` | 错误格式 + 展示规格 |
| `specs/E6-team-collab.md` | 团队协作 API + UI 规格 |
| `specs/E7-version-history.md` | 版本历史 + diff 规格 |
| `specs/E8-import-export.md` | 导入导出规格 |

---

*PRD Version: 1.0*
*Created by: PM Agent*
*Last Updated: 2026-04-14*
