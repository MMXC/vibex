# PRD: VibeX 产品体验增强提案集

**项目**: vibex-pm-proposals-20260403_024652
**版本**: 1.0
**日期**: 2026-04-03
**负责人**: PM
**状态**: 已评审

---

## 1. Executive Summary

### 1.1 背景

VibeX 是 AI 驱动的 DDD 建模工具，当前处于 Sprint 3 阶段（Checkbox 修复、消息抽屉、响应式、快捷键），核心用户为产品经理和开发团队。

经过 PM 视角的产品体验审查，发现 Sprint 3 执行期间存在 **5 项尚未被覆盖的用户体验缺口**：

1. 新用户首次使用门槛高 — 无引导流程
2. 模板能力缺失 — 无预设模板，每次从空白画布开始
3. 导出体验割裂 — 各 Phase 导出入口分散
4. 项目首页无浏览入口 — 无法快速找到历史项目
5. 快捷键无个性化 — Power User 无法自定义快捷键

### 1.2 目标

| 目标 | 描述 | 衡量指标 |
|------|------|---------|
| 降低新用户首次流失率 | 首次进入完成引导流程的用户比例 | 引导完成率 ≥ 60% |
| 提升项目启动效率 | 使用模板创建项目的占比 | 模板使用率 ≥ 30% |
| 统一交付体验 | 用户能快速找到所有导出内容 | 交付中心使用率 ≥ 50% |
| 优化项目发现效率 | 用户能快速找到和打开历史项目 | 项目打开时长 < 3s |
| 提升效率用户满意度 | Power User 能自定义快捷键 | 快捷键配置使用率 ≥ 20% |

### 1.3 成功指标

| 指标 | 当前基线 | Sprint 4 目标 | Sprint 5 目标 |
|------|---------|--------------|--------------|
| 首次引导完成率 | 0% (无引导) | ≥ 60% | ≥ 75% |
| 模板项目创建率 | 0% (无模板) | ≥ 20% | ≥ 30% |
| 交付中心月活 | N/A (新功能) | ≥ 30% | ≥ 50% |
| 项目列表加载时长 | 未统计 | < 2s | < 1.5s |
| 快捷键配置使用率 | 0% (无配置) | ≥ 15% | ≥ 20% |

### 1.4 范围决策

**本次纳入范围**:
- E1: 新手引导流程 (P-001)
- E2: 项目模板库 (P-002)
- E3: 统一交付中心 (P-003)
- E4: 项目浏览体验优化 (P-004)
- E5: 快捷键个性化配置 (P-005)

**明确排除**:
- AI 生成模板（远期规划，需 AI API 稳定后评估）
- 云端快捷键同步（需用户体系，当前优先级低）
- 独立项目管理工作台（范围过大，超出当前 Sprint）

---

## 2. Epic Breakdown with Story Tables

---

### Epic E1: 新手引导流程

**目标**: 降低新用户首次使用门槛，通过渐进式引导帮助用户完成第一个 DDD 建模任务
**优先级**: P1
**工时**: 5-7h
**依赖**: Sprint 3 E1 Checkbox 修复完成

#### Story Table

| 字段 | 内容 |
|------|------|
| Story | E1-S1: 引导欢迎卡片 |
| 功能点 | 首次进入 Canvas 时显示引导欢迎卡片，提供"开始引导"和"跳过"两个选项 |
| 验收标准 | `expect(welcomeCard.isVisible()).toBe(true)` 首次访问时显示欢迎卡片<br>`expect(skipBtn.isVisible()).toBe(true)` 跳过按钮可见<br>`expect(startBtn.isVisible()).toBe(true)` 开始按钮可见<br>`expect(welcomeCard.find('#skip').onClick()).toBeDefined()` 跳过按钮可点击 |
| 页面集成 | 【需页面集成】Canvas 首页 |
| 工时 | 1h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E1-S2: 分步引导流程 |
| 功能点 | 按顺序引导用户完成：添加第一个限界上下文 → 添加业务流程 → 完成组件树。每步高亮目标区域，提示具体操作 |
| 验收标准 | `expect(guideTooltip.isVisible()).toBe(true)` 引导提示可见<br>`expect(highlightArea.isVisible()).toBe(true)` 高亮区域可见<br>`expect(highlightArea.find('button').isClickable()).toBe(true)` 高亮区域可点击<br>`expect(guideStore.currentStep()).toBe(1)` 当前步骤正确<br>`expect(guideStore.nextStep()).toEmitEvent('step-changed')` 步骤切换触发事件 |
| 页面集成 | 【需页面集成】Canvas 画布区域 |
| 工时 | 2h |
| 依赖 | E1-S1 |

| 字段 | 内容 |
|------|------|
| Story | E1-S3: 里程碑徽章系统 |
| 功能点 | 用户完成引导的每个阶段后，显示成就徽章（上下文探索者、流程设计师、组件架构师、DDD 入门） |
| 验收标准 | `expect(badge.isVisible()).toBe(true)` 徽章显示<br>`expect(badge.getType()).toBe('context-explorer')` 徽章类型正确<br>`expect(badge.getAnimation()).toBe('confetti')` 动画效果正常<br>`expect(localStorage.get('vibex-guide-badges')).toContain('context-explorer')` 徽章持久化 |
| 页面集成 | 【需页面集成】Canvas 完成引导后 |
| 工时 | 1h |
| 依赖 | E1-S2 |

| 字段 | 内容 |
|------|------|
| Story | E1-S4: 引导状态持久化 |
| 功能点 | 引导状态（已完成步骤、徽章、跳过标记）存储在 localStorage，再次访问时不重复显示引导 |
| 验收标准 | `expect(localStorage.get('vibex-guide-completed')).toBe(true)` 完成后标记已存储<br>`expect(localStorage.get('vibex-guide-step')).toBe(6)` 最终步骤已记录<br>`expect(welcomeCard.isVisible()).toBe(false)` 再次访问不显示引导 |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E1-S1, E1-S2, E1-S3 |

---

### Epic E2: 项目模板库

**目标**: 提供预设项目模板，用户可一键创建标准化 DDD 项目结构
**优先级**: P1
**工时**: 6-8h
**依赖**: 无

#### Story Table

| 字段 | 内容 |
|------|------|
| Story | E2-S1: 模板选择器入口 |
| 功能点 | 新建项目页面增加"从模板创建"入口，与"空白项目"并列显示 |
| 验收标准 | `expect(templateEntry.isVisible()).toBe(true)` 模板入口可见<br>`expect(templateEntry.getText()).toContain('模板')` 入口文案正确<br>`expect(templateEntry.isClickable()).toBe(true)` 入口可点击 |
| 页面集成 | 【需页面集成】新建项目页面 |
| 工时 | 1h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E2-S2: 模板卡片展示 |
| 功能点 | 模板选择器以网格视图展示模板卡片，每个卡片包含：缩略图、名称、描述、分类标签 |
| 验收标准 | `expect(templateCards.length()).toBeGreaterThanOrEqual(3)` 至少3个模板<br>`expect(templateCard.find('.thumbnail').isVisible()).toBe(true)` 缩略图可见<br>`expect(templateCard.find('.name').getText()).toBeTruthy()` 名称非空<br>`expect(templateCard.find('.tags').isVisible()).toBe(true)` 标签可见 |
| 页面集成 | 【需页面集成】模板选择器 |
| 工时 | 1h |
| 依赖 | E2-S1 |

| 字段 | 内容 |
|------|------|
| Story | E2-S3: 模板预览功能 |
| 功能点 | 点击模板卡片弹出预览弹窗，显示模板完整结构（上下文、流程、组件） |
| 验收标准 | `expect(previewModal.isVisible()).toBe(true)` 预览弹窗打开<br>`expect(previewModal.find('.contexts').isVisible()).toBe(true)` 上下文列表可见<br>`expect(previewModal.find('.flows').isVisible()).toBe(true)` 流程列表可见<br>`expect(previewModal.find('.create-btn').isClickable()).toBe(true)` 创建按钮可点击 |
| 页面集成 | 【需页面集成】模板选择器 |
| 工时 | 1h |
| 依赖 | E2-S2 |

| 字段 | 内容 |
|------|------|
| Story | E2-S4: 模板分类筛选 |
| 功能点 | 模板选择器支持按分类筛选（全部/业务系统/用户管理/电商/通用） |
| 验收标准 | `expect(filterTabs.isVisible()).toBe(true)` 筛选标签可见<br>`expect(filterTabs.find('tab[active]').getText()).toBe('全部')` 默认显示全部<br>`expect(filterTabs.find('tab').at(1).isClickable()).toBe(true)` 分类可切换<br>`expect(templateCards.length()).toChangeWhenFilter('业务系统')` 筛选后卡片数量变化 |
| 页面集成 | 【需页面集成】模板选择器 |
| 工时 | 1h |
| 依赖 | E2-S2 |

| 字段 | 内容 |
|------|------|
| Story | E2-S5: 模板项目创建 |
| 功能点 | 用户选择模板后，自动创建包含预设上下文、流程、组件结构的项目，并跳转至画布页面 |
| 验收标准 | `expect(project.name).toBe(template.name)` 项目名称正确<br>`expect(project.contexts.length).toBe(template.contexts.length)` 上下文数量正确<br>`expect(project.flows.length).toBe(template.flows.length)` 流程数量正确<br>`expect(navigation.getCurrentPath()).toBe('/canvas/:id')` 跳转至画布页面 |
| 页面集成 | 【需页面集成】模板选择器 → Canvas |
| 工时 | 2h |
| 依赖 | E2-S3, E2-S4 |

---

### Epic E3: 统一交付中心

**目标**: 提供统一的交付面板，聚合所有设计产出的导出功能
**优先级**: P2
**工时**: 8-10h
**依赖**: 导出 API 稳定

#### Story Table

| 字段 | 内容 |
|------|------|
| Story | E3-S1: 交付中心入口 |
| 功能点 | Canvas 页面增加"交付中心"入口按钮，点击跳转至交付中心页面 |
| 验收标准 | `expect(deliveryBtn.isVisible()).toBe(true)` 入口按钮可见<br>`expect(deliveryBtn.isClickable()).toBe(true)` 按钮可点击<br>`expect(navigation.getCurrentPath()).toBe('/canvas/delivery')` 跳转至交付中心 |
| 页面集成 | 【需页面集成】Canvas 页面 |
| 工时 | 1h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E3-S2: 限界上下文导出 Tab |
| 功能点 | 交付中心显示限界上下文列表，每个上下文支持导出 JSON / Markdown / PlantUML 格式 |
| 验收标准 | `expect(tabBar.find('tab[active]').getText()).toBe('限界上下文')` 默认Tab正确<br>`expect(contextList.isVisible()).toBe(true)` 上下文列表可见<br>`expect(contextCard.find('.export-json').isClickable()).toBe(true)` JSON导出可点击<br>`expect(contextCard.find('.export-md').isClickable()).toBe(true)` Markdown导出可点击<br>`expect(contextCard.find('.export-plantuml').isClickable()).toBe(true)` PlantUML导出可点击 |
| 页面集成 | 【需页面集成】交付中心页面 |
| 工时 | 2h |
| 依赖 | E3-S1 |

| 字段 | 内容 |
|------|------|
| Story | E3-S3: 流程文档导出 Tab |
| 功能点 | 交付中心显示流程列表，每个流程支持导出 BPMN JSON / Markdown 步骤说明 |
| 验收标准 | `expect(tabBar.find('tab').at(1).isClickable()).toBe(true)` 流程Tab可切换<br>`expect(flowList.isVisible()).toBe(true)` 流程列表可见<br>`expect(flowCard.find('.export-bpmn').isClickable()).toBe(true)` BPMN导出可点击<br>`expect(flowCard.find('.export-steps').isClickable()).toBe(true)` 步骤导出可点击 |
| 页面集成 | 【需页面集成】交付中心页面 |
| 工时 | 2h |
| 依赖 | E3-S1 |

| 字段 | 内容 |
|------|------|
| Story | E3-S4: 组件清单导出 Tab |
| 功能点 | 交付中心显示组件树列表，每个组件支持导出 TypeScript 接口 / JSON Schema |
| 验收标准 | `expect(tabBar.find('tab').at(2).isClickable()).toBe(true)` 组件Tab可切换<br>`expect(componentList.isVisible()).toBe(true)` 组件列表可见<br>`expect(componentCard.find('.export-ts').isClickable()).toBe(true)` TS接口导出可点击<br>`expect(componentCard.find('.export-json-schema').isClickable()).toBe(true)` Schema导出可点击 |
| 页面集成 | 【需页面集成】交付中心页面 |
| 工时 | 2h |
| 依赖 | E3-S1 |

| 字段 | 内容 |
|------|------|
| Story | E3-S5: PRD Tab |
| 功能点 | 交付中心显示自动生成的 PRD 大纲，支持导出 Markdown / 飞书文档格式 |
| 验收标准 | `expect(tabBar.find('tab').at(3).isClickable()).toBe(true)` PRD Tab可切换<br>`expect(prdOutline.isVisible()).toBe(true)` PRD大纲可见<br>`expect(prdOutline.find('.section').length).toBeGreaterThan(0)` 有章节内容<br>`expect(prdOutline.find('.export-md').isClickable()).toBe(true)` Markdown导出可点击<br>`expect(prdOutline.find('.export-feishu').isClickable()).toBe(true)` 飞书导出可点击 |
| 页面集成 | 【需页面集成】交付中心页面 |
| 工时 | 2h |
| 依赖 | E3-S1 |

| 字段 | 内容 |
|------|------|
| Story | E3-S6: 批量导出功能 |
| 功能点 | 每个 Tab 提供"导出全部"按钮，支持一键导出该分类下所有内容 |
| 验收标准 | `expect(exportAllBtn.isVisible()).toBe(true)` 批量导出按钮可见<br>`expect(exportAllBtn.isClickable()).toBe(true)` 按钮可点击<br>`expect(exportAllBtn.trigger()).toDownloadZip()` 触发ZIP下载 |
| 页面集成 | 【需页面集成】交付中心各Tab |
| 工时 | 1h |
| 依赖 | E3-S2, E3-S3, E3-S4, E3-S5 |

---

### Epic E4: 项目浏览体验优化

**目标**: 优化项目首页，提供清晰的最近项目浏览和快速创建入口
**优先级**: P2
**工时**: 5-6h
**依赖**: Sprint 3 E3 响应式完成

#### Story Table

| 字段 | 内容 |
|------|------|
| Story | E4-S1: 最近项目横向列表 |
| 功能点 | 首页显示"最近项目"横向滚动列表，每个卡片包含缩略图、名称、修改时间、Phase 进度 |
| 验收标准 | `expect(recentProjectsSection.isVisible()).toBe(true)` 最近项目区域可见<br>`expect(projectCards.length()).toBeGreaterThan(0)` 有项目卡片<br>`expect(projectCard.find('.thumbnail').isVisible()).toBe(true)` 缩略图可见<br>`expect(projectCard.find('.name').getText()).toBeTruthy()` 名称非空<br>`expect(projectCard.find('.modified-time').getText()).toMatch(/\d+.*前/)` 时间格式正确<br>`expect(projectCard.find('.phase-progress').isVisible()).toBe(true)` Phase进度可见 |
| 页面集成 | 【需页面集成】首页 |
| 工时 | 1h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E4-S2: 快速创建入口 |
| 功能点 | 首页 Hero 区域提供"快速开始"大型按钮，包含"创建新项目"和"从模板创建"两个子入口 |
| 验收标准 | `expect(heroSection.isVisible()).toBe(true)` Hero区域可见<br>`expect(createNewBtn.isVisible()).toBe(true)` 新建按钮可见<br>`expect(templateBtn.isVisible()).toBe(true)` 模板按钮可见<br>`expect(createNewBtn.isClickable()).toBe(true)` 新建可点击<br>`expect(templateBtn.isClickable()).toBe(true)` 模板可点击 |
| 页面集成 | 【需页面集成】首页 |
| 工时 | 1h |
| 依赖 | E4-S1 |

| 字段 | 内容 |
|------|------|
| Story | E4-S3: 视图切换与筛选排序 |
| 功能点 | 支持网格视图/列表视图切换，支持按状态筛选（全部/进行中/已完成/已归档），支持排序（最近修改/名称/创建时间） |
| 验收标准 | `expect(viewToggle.isVisible()).toBe(true)` 视图切换可见<br>`expect(viewToggle.find('grid').isClickable()).toBe(true)` 网格视图可切换<br>`expect(viewToggle.find('list').isClickable()).toBe(true)` 列表视图可切换<br>`expect(filterTabs.isVisible()).toBe(true)` 筛选标签可见<br>`expect(sortDropdown.isVisible()).toBe(true)` 排序下拉可见<br>`expect(projectCards.length()).toChangeWhenFilter('进行中')` 筛选生效 |
| 页面集成 | 【需页面集成】首页 |
| 工时 | 2h |
| 依赖 | E4-S1 |

| 字段 | 内容 |
|------|------|
| Story | E4-S4: 项目卡片悬停操作 |
| 功能点 | 鼠标悬停在项目卡片上显示快速操作菜单（打开/复制/删除） |
| 验收标准 | `expect(projectCard.hover().find('.actions').isVisible()).toBe(true)` 悬停显示操作菜单<br>`expect(projectCard.find('.action-open').isClickable()).toBe(true)` 打开可点击<br>`expect(projectCard.find('.action-duplicate').isClickable()).toBe(true)` 复制可点击<br>`expect(projectCard.find('.action-delete').isClickable()).toBe(true)` 删除可点击 |
| 页面集成 | 【需页面集成】首页 |
| 工时 | 1h |
| 依赖 | E4-S1 |

| 字段 | 内容 |
|------|------|
| Story | E4-S5: 空状态引导 |
| 功能点 | 当项目列表为空时，显示引导提示，引导用户创建第一个项目 |
| 验收标准 | `expect(emptyState.isVisible()).toBe(true)` 空状态可见<br>`expect(emptyState.find('.guide-text').getText()).toContain('创建')` 引导文案正确<br>`expect(emptyState.find('.create-btn').isClickable()).toBe(true)` 创建按钮可点击 |
| 页面集成 | 【需页面集成】首页 |
| 工时 | 1h |
| 依赖 | E4-S1 |

---

### Epic E5: 快捷键个性化配置

**目标**: 提供本地快捷键配置功能，Power User 可自定义快捷键映射
**优先级**: P3
**工时**: 4-5h
**依赖**: Sprint 3 E4 快捷键完成

#### Story Table

| 字段 | 内容 |
|------|------|
| Story | E5-S1: 快捷键配置 Tab |
| 功能点 | 设置页面增加"快捷键"配置 Tab，显示快捷键分类（导航/编辑/视图/Phase切换） |
| 验收标准 | `expect(shortcutsTab.isVisible()).toBe(true)` 快捷键Tab可见<br>`expect(shortcutsTab.find('tab-nav').getText()).toContain('导航')` 导航分类存在<br>`expect(shortcutsTab.find('tab-edit').getText()).toContain('编辑')` 编辑分类存在<br>`expect(shortcutsTab.find('tab-view').getText()).toContain('视图')` 视图分类存在<br>`expect(shortcutsTab.find('tab-phase').getText()).toContain('Phase切换')` Phase分类存在 |
| 页面集成 | 【需页面集成】设置页面 |
| 工时 | 1h |
| 依赖 | 无 |

| 字段 | 内容 |
|------|------|
| Story | E5-S2: 快捷键重绑定 |
| 功能点 | 点击快捷键条目进入编辑模式，等待用户按键输入，保存新快捷键映射 |
| 验收标准 | `expect(shortcutItem.find('.edit-btn').isClickable()).toBe(true)` 编辑按钮可点击<br>`expect(shortcutItem.find('.input').isFocused()).toBe(true)` 进入编辑模式<br>`expect(keyboard.press('Cmd+S').inInput(shortcutItem)).toCaptureKey()` 捕获按键<br>`expect(shortcutItem.find('.new-key').getText()).toBe('⌘S')` 显示新快捷键 |
| 页面集成 | 【需页面集成】设置页面 |
| 工时 | 1h |
| 依赖 | E5-S1 |

| 字段 | 内容 |
|------|------|
| Story | E5-S3: 冲突检测与提示 |
| 功能点 | 当用户绑定的快捷键与现有快捷键冲突时，显示警告提示 |
| 验收标准 | `expect(conflictWarning.isVisible()).toBe(true)` 冲突警告可见<br>`expect(conflictWarning.getText()).toContain('冲突')` 警告文案正确<br>`expect(saveBtn.isDisabled()).toBe(true)` 冲突时保存按钮禁用 |
| 页面集成 | 【需页面集成】设置页面 |
| 工时 | 1h |
| 依赖 | E5-S2 |

| 字段 | 内容 |
|------|------|
| Story | E5-S4: 配置持久化与生效 |
| 功能点 | 快捷键配置保存到 localStorage，新快捷键立即生效，覆盖默认快捷键 |
| 验收标准 | `expect(localStorage.get('vibex-shortcuts')).toBeTruthy()` 配置已存储<br>`expect(shortcutManager.getActiveShortcut('Cmd+S')).toBe('save')` 新快捷键生效<br>`expect(shortcutManager.usesCustomConfig()).toBe(true)` 使用自定义配置 |
| 页面集成 | 无 |
| 工时 | 1h |
| 依赖 | E5-S2, E5-S3 |

| 字段 | 内容 |
|------|------|
| Story | E5-S5: 重置默认 |
| 功能点 | 提供"重置默认"按钮，一键恢复所有快捷键为默认值 |
| 验收标准 | `expect(resetBtn.isVisible()).toBe(true)` 重置按钮可见<br>`expect(resetBtn.isClickable()).toBe(true)` 按钮可点击<br>`expect(localStorage.get('vibex-shortcuts')).toBeNull()` 配置已清除<br>`expect(shortcutManager.getActiveShortcut('Cmd+S')).toBeDefault('save')` 恢复默认 |
| 页面集成 | 【需页面集成】设置页面 |
| 工时 | 1h |
| 依赖 | E5-S4 |

---

## 3. 工时汇总

| Epic | Story | 工时 |
|------|-------|------|
| E1: 新手引导 | E1-S1 ~ E1-S4 | 5h |
| E2: 项目模板库 | E2-S1 ~ E2-S5 | 6h |
| E3: 统一交付中心 | E3-S1 ~ E3-S6 | 10h |
| E4: 项目浏览优化 | E4-S1 ~ E4-S5 | 6h |
| E5: 快捷键配置 | E5-S1 ~ E5-S5 | 5h |
| **总计** | | **32h** |

---

## 4. Sprint 排期

| Sprint | Epic | 工时 | 依赖条件 |
|--------|------|------|---------|
| Sprint 4 | E1 新手引导 + E5 快捷键配置 | 10h | E1需Sprint3 E1完成; E5需Sprint3 E4完成 |
| Sprint 5 | E2 项目模板 + E4 项目浏览 | 12h | 无特殊依赖 |
| Sprint 6+ | E3 统一交付中心 | 10h | 导出API稳定 |

---

## 5. Acceptance Criteria

### E1: 新手引导流程

| ID | Given | When | Then |
|----|-------|------|------|
| AC-E1-1 | 首次访问 Canvas | 用户未完成引导 | 显示引导欢迎卡片 |
| AC-E1-2 | 引导欢迎卡片 | 用户点击"跳过" | 隐藏引导，记录跳过状态 |
| AC-E1-3 | 引导流程中 | 用户完成当前步骤 | 自动切换到下一步，高亮下一区域 |
| AC-E1-4 | 引导完成后 | 用户完成所有步骤 | 显示里程碑徽章动画，记录完成状态 |
| AC-E1-5 | 再次访问 | 引导已完成 | 不显示引导欢迎卡片 |

### E2: 项目模板库

| ID | Given | When | Then |
|----|-------|------|------|
| AC-E2-1 | 新建项目页面 | 用户打开 | 显示"从模板创建"入口 |
| AC-E2-2 | 模板选择器 | 用户浏览模板 | 显示至少3个模板卡片 |
| AC-E2-3 | 模板卡片 | 用户点击预览 | 打开预览弹窗，显示完整结构 |
| AC-E2-4 | 模板选择器 | 用户选择分类 | 筛选显示该分类下的模板 |
| AC-E2-5 | 模板预览弹窗 | 用户点击"创建" | 创建项目并跳转至画布 |

### E3: 统一交付中心

| ID | Given | When | Then |
|----|-------|------|------|
| AC-E3-1 | Canvas 页面 | 用户查看 | 显示"交付中心"入口按钮 |
| AC-E3-2 | 交付中心 | 用户切换 Tab | 显示对应内容（上下文/流程/组件/PRD） |
| AC-E3-3 | 各 Tab | 用户点击导出 | 下载对应格式的文件 |
| AC-E3-4 | 各 Tab | 用户点击"导出全部" | 下载该分类下所有内容的 ZIP |

### E4: 项目浏览体验优化

| ID | Given | When | Then |
|----|-------|------|------|
| AC-E4-1 | 首页 | 用户打开 | 显示"最近项目"横向列表 |
| AC-E4-2 | 首页 Hero | 用户查看 | 显示"快速开始"区域和创建入口 |
| AC-E4-3 | 项目列表 | 用户切换视图 | 切换为网格视图或列表视图 |
| AC-E4-4 | 项目列表 | 用户筛选/排序 | 按条件重新排序列表 |
| AC-E4-5 | 项目列表为空 | 用户打开首页 | 显示空状态引导 |

### E5: 快捷键个性化配置

| ID | Given | When | Then |
|----|-------|------|------|
| AC-E5-1 | 设置页面 | 用户打开 | 显示"快捷键"配置 Tab |
| AC-E5-2 | 快捷键列表 | 用户点击编辑 | 进入按键捕获模式 |
| AC-E5-3 | 按键捕获中 | 用户按下冲突键 | 显示冲突警告，禁用保存 |
| AC-E5-4 | 配置保存 | 用户保存新快捷键 | 立即生效，存储到 localStorage |
| AC-E5-5 | 配置页面 | 用户点击"重置默认" | 恢复所有快捷键为默认值 |

---

## 6. Definition of Done (DoD)

### 6.1 Epic DoD

| 条件 | 描述 | 验证方式 |
|------|------|---------|
| 功能完成 | 所有 Story 的验收标准通过 | E2E 测试覆盖 |
| 视觉检查 | UI 符合设计稿，响应式适配完成 | Design Review |
| 性能达标 | 页面加载时长 < 2s，交互响应 < 100ms | Lighthouse + Manual |
| 代码质量 | 无 lint 错误，无 console error | CI Pipeline |
| 测试覆盖 | 核心功能单元测试覆盖率 ≥ 80% | Jest Coverage |
| 文档更新 | API 文档和使用说明更新 | PR Review |

### 6.2 Story DoD

| 条件 | 描述 |
|------|------|
| 代码实现 | 功能代码已合并到 main 分支 |
| 单元测试 | 核心逻辑有对应的 Jest 测试用例 |
| 集成测试 | Story 级别的 E2E 测试用例已通过 |
| 代码审查 | 至少1人 Code Review 通过 |
| 文档 | 组件使用文档已更新（如需） |

---

## 7. Non-Functional Requirements

### 7.1 性能要求

| 指标 | 要求 | 测试方法 |
|------|------|---------|
| 页面首次加载 | < 2s (3G 网络) | Lighthouse |
| 引导卡片渲染 | < 100ms | Performance API |
| 模板列表渲染 | < 500ms (10个模板) | Performance API |
| 交付中心 Tab 切换 | < 200ms | Performance API |
| 快捷键响应 | < 50ms | Manual + Performance API |
| 项目列表加载 | < 2s (50个项目) | Performance API |

### 7.2 兼容性要求

| 环境 | 要求 |
|------|------|
| Chrome | 最新版 + 2个历史版本 |
| Firefox | 最新版 + 2个历史版本 |
| Safari | 最新版 + 1个历史版本 |
| Edge | 最新版 + 1个历史版本 |
| 移动端 | iOS Safari 14+, Chrome Android 最新 |

### 7.3 可访问性要求

| 规范 | 要求 |
|------|------|
| WCAG 2.1 | AA 级别合规 |
| 键盘导航 | 所有交互元素可键盘操作 |
| 屏幕阅读器 | ARIA 标签完整，支持 NVDA/VoiceOver |
| 颜色对比度 | 文本与背景对比度 ≥ 4.5:1 |

### 7.4 安全要求

| 要求 | 描述 |
|------|------|
| 数据隔离 | localStorage 数据按项目隔离 |
| XSS 防护 | 用户输入内容进行转义处理 |
| CSP | 启用 Content Security Policy |
| 敏感信息 | 不在 localStorage 中存储敏感信息 |

---

## 8. Implementation Constraints

### 8.1 技术约束

| 约束 | 描述 |
|------|------|
| 框架版本 | React 18+, Next.js 14+, Zustand 4+ |
| 状态管理 | 使用 Zustand 统一管理引导状态 |
| 样式方案 | Tailwind CSS 3+ |
| 测试框架 | Vitest + React Testing Library + Playwright |
| 存储限制 | localStorage 单项限制 5MB |

### 8.2 架构约束

| 约束 | 描述 |
|------|------|
| 路由设计 | 交付中心路由为 `/canvas/delivery`，不影响现有路由 |
| 组件复用 | 复用现有 ExportMenu 组件扩展导出功能 |
| 状态隔离 | 引导状态与项目状态隔离管理 |

### 8.3 团队约束

| 约束 | 描述 |
|------|------|
| 代码规范 | 遵循 VibeX 项目 ESLint 配置 |
| 提交规范 | 使用 Conventional Commits |
| 分支策略 | 功能分支命名: `feature/pm-proposal-*` |
| Code Review | 所有 PR 需至少1人 Review |

### 8.4 风险缓解

| 风险 | 缓解措施 |
|------|---------|
| E1 引导覆盖其他 UI | 引导层 `z-index` 最高，点击跳过立即退出 |
| E2 模板 Schema 变更 | 版本字段 + Schema 校验 |
| E3 导出格式不统一 | 统一导出数据层，各 Tab 调用同一接口 |
| E4 首页改版影响习惯 | 提供视图切换，保持默认行为不变 |
| E5 快捷键冲突检测 | 按键监听器中统一检测，不依赖状态机 |

---

## 9. Appendix

### 9.1 相关文档

- 分析报告: `docs/vibex-pm-proposals-20260403_024652/analysis.md`
- Epic E1 详细规格: `docs/vibex-pm-proposals-20260403_024652/specs/e1-new-user-guide.md`
- Epic E2 详细规格: `docs/vibex-pm-proposals-20260403_024652/specs/e2-project-templates.md`
- Epic E3 详细规格: `docs/vibex-pm-proposals-20260403_024652/specs/e3-delivery-center.md`
- Epic E4 详细规格: `docs/vibex-pm-proposals-20260403_024652/specs/e4-project-browse.md`
- Epic E5 详细规格: `docs/vibex-pm-proposals-20260403_024652/specs/e5-shortcut-config.md`

### 9.2 术语表

| 术语 | 定义 |
|------|------|
| DDD | Domain-Driven Design，领域驱动设计 |
| 限界上下文 | Bounded Context，DDD 核心概念 |
| Epic | 用户价值的完整实现单元 |
| Story | 用户故事，Epic 的最小可交付单元 |
| JTBD | Jobs-To-Be-Done，待完成的工作 |

### 9.3 修订历史

| 版本 | 日期 | 修订人 | 变更内容 |
|------|------|--------|---------|
| 1.0 | 2026-04-03 | PM | 初始版本 |
