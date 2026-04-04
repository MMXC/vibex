# 实施计划: VibeX 产品体验增强提案集

**项目**: vibex-pm-proposals-20260403_024652
**版本**: 1.0
**日期**: 2026-04-03
**角色**: Solution Architect
**状态**: 计划完成

---

## 1. Sprint 规划总览

| Sprint | Epics | 工时 | 目标 |
|--------|-------|------|------|
| Sprint 4 | E1 新手引导 + E5 快捷键配置 | 9-12h | 降低首次流失 + 提升效率用户满意度 |
| Sprint 5 | E2 项目模板 + E4 项目浏览优化 | 11-14h | 提升启动效率 + 优化项目发现 |
| Sprint 6+ | E3 统一交付中心 | 8-10h | 统一交付体验（依赖导出 API） |

---

## 2. Sprint 4 详细计划

**主题**: 新手引导 + 快捷键配置
**目标**: E1 + E5 全部完成
**依赖**: Sprint 3 E1 Checkbox 修复完成、Sprint 3 E4 快捷键完成

### Week 1 (Day 1-5)

#### Day 1: E1 基础设施

| 任务 | 类型 | 工时 | 负责人 | 依赖 |
|------|------|------|--------|------|
| 创建 guideStore.ts (Zustand + persist) | 开发 | 1h | dev | 无 |
| 实现 GuideOverlay + GuideHighlightMask 组件 | 开发 | 2h | dev | 无 |
| 定义 GUIDE_STEPS 步骤数组 | 开发 | 0.5h | dev | 无 |
| 编写 guideStore 单元测试 | 测试 | 1h | tester | guideStore 完成 |
| **Day 1 合计** | | **4.5h** | | |

#### Day 2: E1 引导流程

| 任务 | 类型 | 工时 | 负责人 | 依赖 |
|------|------|------|--------|------|
| 实现 GuideTooltip 组件 | 开发 | 1h | dev | Day 1 |
| 实现 NewUserGuide 主控制器 | 开发 | 2h | dev | Day 1 |
| 集成引导到 Canvas 页面 | 开发 | 1h | dev | Day 1 |
| E1-S1 引导欢迎卡片 | 开发 | 1h | dev | NewUserGuide |
| **Day 2 合计** | | **5h** | | |

#### Day 3: E1 引导完善 + E5 启动

| 任务 | 类型 | 工时 | 负责人 | 依赖 |
|------|------|------|--------|------|
| E1-S2 分步引导流程 | 开发 | 2h | dev | Day 2 |
| E1-S3 里程碑徽章 (Framer Motion confetti) | 开发 | 1.5h | dev | Day 2 |
| 创建 shortcutStore.ts (Zustand + persist) | 开发 | 1h | dev | 无 |
| 定义 DEFAULT_SHORTCUT_DEFINITIONS | 开发 | 0.5h | dev | 无 |
| **Day 3 合计** | | **5h** | | |

#### Day 4: E1 完善 + E5 核心

| 任务 | 类型 | 工时 | 负责人 | 依赖 |
|------|------|------|--------|------|
| E1-S4 引导状态持久化 + localStorage | 开发 | 1h | dev | Day 3 |
| E1 集成测试 + 边界条件 | 测试 | 2h | tester | E1 核心完成 |
| 实现 ShortcutItem 可编辑行 | 开发 | 1.5h | dev | Day 3 |
| 实现快捷键冲突检测算法 | 开发 | 1h | dev | Day 3 |
| **Day 4 合计** | | **5.5h** | | |

#### Day 5: E5 完善 + Sprint 4 收尾

| 任务 | 类型 | 工时 | 负责人 | 依赖 |
|------|------|------|--------|------|
| E5-S3 冲突检测 UI + 警告提示 | 开发 | 1h | dev | Day 4 |
| E5-S4 配置持久化 + 立即生效 | 开发 | 1h | dev | Day 4 |
| E5-S5 重置默认按钮 | 开发 | 0.5h | dev | Day 4 |
| E1 + E5 E2E 测试 (Playwright) | 测试 | 2h | tester | E1 + E5 完成 |
| Sprint 4 Code Review + 合并 | 流程 | 1h | reviewer | 测试通过 |
| **Day 5 合计** | | **5.5h** | | |

### Sprint 4 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| E1 引导与其他 UI 元素冲突 | 中 | 阻断 | z-index 最高，点击跳过立即退出 |
| E5 冲突检测不准确 | 中 | 中 | 100% 单元测试覆盖，边界条件充分 |
| Sprint 3 E1 Checkbox 延迟 | 低 | 高 | E1 与 E1 Checkbox 独立，mock 节点完成 |
| Framer Motion confetti 性能 | 低 | 低 | 使用 `onlyOnMount` 减少重绘 |

---

## 3. Sprint 5 详细计划

**主题**: 项目模板 + 项目浏览优化
**目标**: E2 + E4 全部完成
**依赖**: Sprint 4 完成

### Week 2 (Day 6-10)

#### Day 6-7: E2 项目模板

| 任务 | 类型 | 工时 | 负责人 | 状态 |
|------|------|------|--------|------|
| 制作 4 个模板 JSON 文件 | 内容 | 2h | PM | ✅ 已交付 (3个模板) |
| 创建 templateStore.ts | 开发 | 1h | dev | ✅ 已交付 (projectTemplateStore.ts) |
| 实现 TemplateCard + TemplateSelector 组件 | 开发 | 2h | dev | ✅ 已交付 (DDDTemplateSelector) |
| E2-S2 模板卡片网格展示 | 开发 | 1h | dev | ✅ 已交付 |
| E2-S3 模板预览弹窗 | 开发 | 1h | dev | ✅ 已交付 |
| E2-S4 模板分类筛选 | 开发 | 1h | dev | ✅ 已交付 |
| E2-S5 模板项目创建 (深度克隆 + API) | 开发 | 2h | dev | ⏳ 进行中 |
| 模板 Store 单元测试 | 测试 | 1h | tester | 待领取 |
| **Day 6-7 合计** | | **11h** | | **✅ E2-S1 完成** |

#### Day 8-9: E4 项目浏览优化

| 任务 | 类型 | 工时 | 负责人 | 状态 |
|------|------|------|--------|------|
| 创建 projectStore.ts (扩展现有) | 开发 | 1h | dev | ✅ 已交付 (dashboard 已有) |
| 实现 ProjectCard 组件 (含悬停) | 开发 | 1.5h | dev | ✅ 已交付 |
| E4-S1 最近项目横向滚动 (Intersection Observer) | 开发 | 1.5h | dev | ✅ 已交付 (recentProjects) |
| E4-S2 Hero 快速开始入口 | 开发 | 1h | dev | ✅ 已交付 (heroSection) |
| E4-S3 视图切换 (Grid/List) + 筛选排序 | 开发 | 2h | dev | ✅ 已交付 (viewMode toggle) |
| E4-S4 悬停操作菜单 (打开/复制/删除) | 开发 | 1h | dev | ✅ 已交付 (已有基础) |
| E4-S5 空状态引导 | 开发 | 1h | dev | ✅ 已交付 (zeroEmptyState) |
| 首页集成 + 响应式 (与 Sprint 3 E3 协同) | 开发 | 1h | dev | ✅ 已交付 |
| **Day 8-9 合计** | | **10h** | | **✅ E4 完成** |

#### Day 10: Sprint 5 收尾

| 任务 | 类型 | 工时 | 负责人 | 依赖 |
|------|------|------|--------|------|
| E2 + E4 集成测试 | 测试 | 2h | tester | E2 + E4 完成 |
| E2 + E4 E2E 测试 (Playwright) | 测试 | 2h | tester | 集成测试通过 |
| Design Review (UI 验收) | 审查 | 1h | reviewer | 功能完成 |
| Sprint 5 Code Review + 合并 | 流程 | 1h | reviewer | 测试通过 |
| **Day 10 合计** | | **6h** | | |

### Sprint 5 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 模板 JSON Schema 未来变更 | 中 | 中 | 版本字段 + Schema 校验 |
| 首页改版影响现有用户习惯 | 低 | 低 | 提供视图切换，保持默认行为不变 |
| html2canvas 缩略图性能 | 中 | 低 | 使用 Canvas 原生截图 + 缓存 |

---

## 4. Sprint 6+ 详细计划

**主题**: 统一交付中心
**目标**: E3 全部完成
**依赖**: Sprint 5 完成 + 导出 API 稳定

### Week 3 (Day 11-15)

| 任务 | 类型 | 工时 | 负责人 | 状态 |
|------|------|------|--------|------|
| 创建 /canvas/delivery 路由 + 页面 | 开发 | 1h | dev | ✅ 已交付 |
| 实现 DeliveryTabBar 组件 | 开发 | 1h | dev | ✅ 已交付 |
| E3-S2 限界上下文导出 Tab | 开发 | 2h | dev | ✅ 已交付 (ContextTab) |
| E3-S3 流程文档导出 Tab | 开发 | 2h | dev | ✅ 已交付 (FlowTab) |
| E3-S4 组件清单导出 Tab | 开发 | 2h | dev | ✅ 已交付 (ComponentTab) |
| E3-S5 PRD Tab (自动生成大纲) | 开发 | 2h | dev | ✅ 已交付 (PRDTab) |
| E3-S6 批量导出 (JSZip → ZIP) | 开发 | 1h | dev | ✅ 已交付 (exportAll) |
| Toolbar 增加交付中心入口按钮 | 开发 | 0.5h | dev | ⏳ 待集成 |
| E3 集成测试 + E2E 测试 | 测试 | 3h | tester | 待领取 |

**E3 整体状态**: ✅ Sprint 6 前端已交付，测试待覆盖
| Design Review + Code Review | 审查 | 1.5h | reviewer | 测试通过 |
| **Sprint 6 合计** | | **16h** | | |

---

## 5. 并行化机会

### 5.1 Sprint 4 并行化 (dev × 2)

```
dev-1: E1 新手引导
  Day 1-3: guideStore + 引导组件
  Day 4-5: 徽章 + 持久化

dev-2: E5 快捷键配置
  Day 3-4: shortcutStore + ShortcutItem
  Day 4-5: 冲突检测 + 重置

tester: 
  Day 1-2: E1 单元测试
  Day 4: E1 集成测试
  Day 5: E1 + E5 E2E

reviewer:
  Day 5: Code Review + 合并
```

### 5.2 Sprint 5 并行化 (dev × 2)

```
dev-1: E2 项目模板
  Day 6-7: 模板组件 + 创建逻辑

dev-2: E4 项目浏览
  Day 8-9: 项目卡片 + 列表 + 筛选

tester:
  Day 7: 模板 Store 单元测试
  Day 9: 集成测试
  Day 10: E2 + E4 E2E
```

---

## 6. 测试计划

### 6.1 测试执行顺序

| 阶段 | 时机 | 测试类型 | 覆盖率目标 |
|------|------|---------|-----------|
| T1: Store 单元 | 每 store 完成时 | Vitest unit | 100% (actions) |
| T2: 组件集成 | 组件完成时 | Vitest + RTL | > 70% |
| T3: E2E | Sprint 最后一天 | Playwright | PRD 验收标准 100% |
| T4: 性能 | Sprint 结束后 | Performance API | 所有阈值达标 |

### 6.2 关键路径测试

```
E1: 首次访问 → 引导卡片 → 完成引导 → 徽章显示 → 再次访问无引导
E2: 模板选择 → 预览 → 创建 → 跳转画布 → 项目结构正确
E3: 交付入口 → Tab 切换 → 单项导出 → 批量导出 → ZIP 下载
E4: 项目列表 → 视图切换 → 筛选排序 → 悬停操作 → 空状态
E5: 设置入口 → 编辑快捷键 → 冲突检测 → 保存 → 快捷键生效 → 重置
```

---

## 7. 交付物清单

### 7.1 代码交付

| 交付物 | Sprint | 验收标准 |
|--------|--------|---------|
| E1: NewUserGuide + guideStore | Sprint 4 | 引导流程完整，徽章显示，状态持久化 |
| E5: ShortcutsTab + shortcutStore | Sprint 4 | 可重绑、无冲突、重置生效 |
| E2: TemplateSelector + templateStore | Sprint 5 | 模板创建成功，项目结构正确 |
| E4: ProjectBrowser + projectStore | Sprint 5 | 列表完整、切换流畅、空状态正常 |
| E3: DeliveryCenter (所有 Tab) | Sprint 6 | Tab 切换正常，导出正确，ZIP 生成 |

### 7.2 测试交付

| 交付物 | Sprint | 验收标准 |
|--------|--------|---------|
| 单元测试 (~80 tests) | Sprint 4-5 | 覆盖率 > 80% |
| 集成测试 (~50 tests) | Sprint 4-5 | 所有 Store + Component |
| E2E 测试 (~30 tests) | Sprint 4-6 | PRD 验收标准 100% |
| 性能测试报告 | Sprint 6 | 所有指标 < 阈值 |

### 7.3 文档交付

| 交付物 | Sprint | 说明 |
|--------|--------|------|
| architecture.md | 当前 (已交付) | 技术架构、Mermaid 图、数据模型 |
| AGENTS.md | 当前 (本文件) | Agent 协作指南 |
| README.md 更新 | Sprint 6 | 新功能使用说明 |

---

## 8. 工时汇总

| Sprint | Epic | 开发 | 测试 | 审查 | 合计 |
|--------|------|------|------|------|------|
| Sprint 4 | E1 + E5 | 13h | 5h | 1h | 19h |
| Sprint 5 | E2 + E4 | 15h | 7h | 2h | 24h |
| Sprint 6+ | E3 | 9.5h | 5h | 1.5h | 16h |
| **总计** | | **37.5h** | **17h** | **4.5h** | **59h** |

> 注: 实际开发工时可能因并行化而压缩到 3 Sprint × 5d = 15 工作日

---

## 9. 回滚计划

| Epic | 回滚策略 |
|------|---------|
| E1 引导 | Feature Flag: `ENABLE_NEW_USER_GUIDE`，关闭后不影响现有功能 |
| E2 模板 | 模板选择器可关闭，用户仍可创建空白项目 |
| E3 交付 | 交付中心为独立页面 `/canvas/delivery`，不影响原有导出入口 |
| E4 浏览 | 首页增强通过 Feature Flag: `ENABLE_ENHANCED_HOME`，关闭恢复原有列表 |
| E5 快捷键 | 重置默认按钮 + localStorage 清除，紧急情况可清除 storage 恢复 |

---

## 10. 监控指标

| 指标 | 当前基线 | Sprint 4 目标 | Sprint 5 目标 | Sprint 6 目标 |
|------|---------|-------------|-------------|-------------|
| 首次引导完成率 | 0% | ≥ 60% | ≥ 75% | — |
| 模板项目创建率 | 0% | — | ≥ 20% | ≥ 30% |
| 交付中心月活 | N/A | — | — | ≥ 30% |
| 项目列表加载时长 | 未统计 | — | < 2s | < 1.5s |
| 快捷键配置使用率 | 0% | ≥ 15% | ≥ 20% | — |
