# Agent 协作指南: VibeX 产品体验增强提案集

**项目**: vibex-pm-proposals-20260403_024652
**版本**: 1.0
**日期**: 2026-04-03
**角色**: Solution Architect
**状态**: 协作指南完成

---

## 1. 项目概览

VibeX Sprint 4-6 的产品体验增强提案集，包含 5 个 Epic：

| Epic | 负责人 | 核心职责 |
|------|--------|---------|
| E1: 新手引导 | dev | guideStore + NewUserGuide + GuideOverlay + MilestoneBadge |
| E2: 项目模板 | dev | templateStore + TemplateSelector + 模板 JSON 制作 |
| E3: 交付中心 | dev | DeliveryCenter + 4 个 Tab + 批量导出 |
| E4: 项目浏览 | dev | projectStore + ProjectBrowser + 响应式 |
| E5: 快捷键配置 | dev | shortcutStore + ShortcutsTab + 冲突检测 |
| Test & Review | tester + reviewer | 全 Epic 测试覆盖 + Code Review |

---

## 2. Agent 工作流

### 2.1 Sprint 4: E1 + E5

```
pm
  └──→ architect (已完成 ✓)
          └──→ dev-1: E1 新手引导
          │       ├── 领取 E1 开发任务
          │       ├── Day 1-3: guideStore + 引导组件
          │       ├── Day 4-5: 徽章 + 持久化
          │       └── 完成后通知 tester
          │
          └──→ dev-2: E5 快捷键配置
                  ├── 领取 E5 开发任务
                  ├── Day 3-4: shortcutStore + ShortcutItem + 冲突检测
                  ├── Day 5: 重置 + E5 E2E
                  └── 完成后通知 tester

tester
  ├── Day 1-2: E1 单元测试 (guideStore.test.ts)
  ├── Day 4: E1 集成测试 (guide-flow.test.tsx)
  └── Day 5: E1 + E5 E2E (Playwright)

reviewer
  └── Day 5: Code Review + 合并到 main
```

### 2.2 Sprint 5: E2 + E4

```
pm
  └──→ dev-1: E2 项目模板
  │       ├── 领取 E2 开发任务
  │       ├── PM 制作 4 个模板 JSON (Day 1)
  │       ├── Day 6-7: 模板组件 + 创建逻辑
  │       └── 完成后通知 tester
  │
  └──→ dev-2: E4 项目浏览
          ├── 领取 E4 开发任务
          ├── Day 8-9: 项目浏览器 + 响应式
          └── 完成后通知 tester

tester
  ├── Day 7: E2 单元测试 + 集成测试
  ├── Day 9: E4 集成测试
  └── Day 10: E2 + E4 E2E

reviewer
  └── Day 10: Code Review + 合并
```

### 2.3 Sprint 6: E3

```
pm
  └──→ dev: E3 交付中心
          ├── 领取 E3 开发任务
          ├── 确认导出 API 稳定 (前提)
          ├── Day 11-12: 交付中心 + 各 Tab
          ├── Day 13: 批量导出 + 入口按钮
          └── 完成后通知 tester

tester
  ├── Day 14: E3 集成测试
  └── Day 15: E3 E2E + 性能测试

reviewer
  └── Day 15: Design Review + Code Review + 合并
```

---

## 3. 阶段任务领取

### 3.1 任务领取流程

```bash
# dev 领取 E1 开发任务
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py \
  update vibex-pm-proposals-20260403_024652 \
  dev-e1 new

# dev 领取 E5 开发任务
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py \
  update vibex-pm-proposals-20260403_024652 \
  dev-e5 new
```

### 3.2 任务状态流转

```
ready → in_progress → review → done
                      ↓
                   failed (打回重做)
                      ↓
                    ready (修复后重新领取)
```

---

## 4. 文件路径约定

所有相关文件位于项目目录:

```
/root/.openclaw/vibex/
├── docs/vibex-pm-proposals-20260403_024652/
│   ├── prd.md              # PM: 产品需求文档
│   ├── analysis.md         # Analyst: 需求分析报告
│   ├── architecture.md     # Architect: 架构设计文档
│   ├── IMPLEMENTATION_PLAN.md  # Architect: 实施计划
│   ├── AGENTS.md           # Architect: 协作指南 (本文件)
│   └── specs/              # PM: 各 Epic 详细规格
│       ├── e1-new-user-guide.md
│       ├── e2-project-templates.md
│       ├── e3-delivery-center.md
│       ├── e4-project-browse.md
│       └── e5-shortcut-config.md
│
└── src/
    ├── components/
    │   ├── guide/          # E1 组件
    │   ├── template/       # E2 组件
    │   ├── delivery/       # E3 组件
    │   ├── project/        # E4 组件
    │   └── shortcuts/      # E5 组件
    ├── stores/             # Zustand Stores
    ├── hooks/              # 自定义 Hooks
    ├── lib/                # 工具函数
    └── types/              # TypeScript 类型
```

---

## 5. Git 分支命名

```bash
# 功能分支
git checkout -b feature/e1-new-user-guide
git checkout -b feature/e2-project-templates
git checkout -b feature/e3-delivery-center
git checkout -b feature/e4-project-browser
git checkout -b feature/e5-shortcut-config

# 提交规范 (Conventional Commits)
git commit -m "feat(e1): add NewUserGuide component with overlay"
git commit -m "fix(e5): resolve shortcut conflict detection edge case"
git commit -m "test(e2): add template creation integration tests"
git commit -m "docs: update AGENTS.md for sprint 4"
```

---

## 6. 组件命名约定

| 组件 | 命名 | 文件路径 |
|------|------|---------|
| 引导主组件 | `NewUserGuide` | `components/guide/NewUserGuide.tsx` |
| 引导遮罩 | `GuideOverlay` | `components/guide/GuideOverlay.tsx` |
| 引导提示 | `GuideTooltip` | `components/guide/GuideTooltip.tsx` |
| 高亮遮罩 | `GuideHighlightMask` | `components/guide/GuideHighlightMask.tsx` |
| 徽章 | `MilestoneBadge` | `components/guide/MilestoneBadge.tsx` |
| 模板选择器 | `TemplateSelector` | `components/template/TemplateSelector.tsx` |
| 模板卡片 | `TemplateCard` | `components/template/TemplateCard.tsx` |
| 模板预览 | `TemplatePreview` | `components/template/TemplatePreview.tsx` |
| 交付中心 | `DeliveryCenter` | `components/delivery/DeliveryCenter.tsx` |
| 导出 Tab | `{Context|Flow|Component|Prd}ExportTab` | `components/delivery/` |
| 项目浏览器 | `ProjectBrowser` | `components/project/ProjectBrowser.tsx` |
| 快捷键 Tab | `ShortcutsTab` | `components/shortcuts/ShortcutsTab.tsx` |

---

## 7. 状态管理约定

### 7.1 Zustand Store 命名

```typescript
// 命名: use{Feature}Store
export const useGuideStore = create<GuideStore>()(
  persist(
    (set, get) => ({
      state: initialGuideState,
      start: () => set({ state: { ...get().state, status: 'in_progress', currentStep: 0, startedAt: Date.now() } }),
      nextStep: () => set({ state: { ...get().state, currentStep: get().state.currentStep + 1 } }),
      // ...
    }),
    { name: 'vibex-guide' } // localStorage key prefix
  )
);
```

### 7.2 localStorage Key 约定

| Store | Key 前缀 | 示例 |
|-------|---------|------|
| guideStore | `vibex-guide-` | `vibex-guide-completed`, `vibex-guide-badges` |
| templateStore | `vibex-template-` | `vibex-template-filter`, `vibex-template-cache` |
| projectStore | `vibex-project-` | `vibex-project-view-mode`, `vibex-project-sort` |
| shortcutStore | `vibex-shortcuts` | `vibex-shortcuts` (完整 Map) |

---

## 8. 验收标准检查清单

### 8.1 E1 新手引导 - Dev 自检

- [ ] guideStore init/reset/skip/nextStep/completeStep 全部可调用
- [ ] GuideOverlay 正确覆盖全屏，z-index 最高
- [ ] GuideHighlightMask 高亮区域可点击
- [ ] MilestoneBadge 使用 Framer Motion confetti 动画
- [ ] 引导状态正确持久化到 localStorage
- [ ] 再次访问时不显示引导卡片
- [ ] 跳过引导后记录 skipped 状态
- [ ] 响应式适配（移动端引导层不遮挡）

### 8.2 E2 项目模板 - Dev 自检

- [ ] 模板 JSON 加载成功（至少 4 个模板）
- [ ] TemplateCard 显示缩略图、名称、描述、标签
- [ ] 分类筛选切换后列表正确更新
- [ ] 预览弹窗显示模板完整结构
- [ ] 从模板创建后跳转到 /canvas/:id
- [ ] 创建的项目包含模板中的所有上下文、流程、组件

### 8.3 E3 交付中心 - Dev 自检

- [ ] /canvas/delivery 路由正确
- [ ] Tab 切换不触发页面刷新，内容懒加载
- [ ] 每个 Tab 导出按钮可点击
- [ ] 导出文件格式正确（JSON/Markdown/PlantUML 等）
- [ ] 批量导出生成 ZIP 文件，文件名正确
- [ ] 交付中心入口按钮（Toolbar）链接到 /canvas/delivery

### 8.4 E4 项目浏览 - Dev 自检

- [ ] 最近项目横向列表正常滚动
- [ ] 项目卡片悬停显示操作菜单
- [ ] 网格视图 / 列表视图切换正常
- [ ] 状态筛选（全部/进行中/已完成）正确过滤
- [ ] 排序（最近修改/名称/创建时间）正确排序
- [ ] 空状态引导提示正常显示
- [ ] 响应式适配（移动端布局正常）

### 8.5 E5 快捷键配置 - Dev 自检

- [ ] 设置页面有快捷键 Tab
- [ ] 4 个分类（导航/编辑/视图/Phase切换）正确显示
- [ ] 点击编辑后进入按键捕获模式
- [ ] 冲突快捷键显示警告，保存按钮禁用
- [ ] 保存后快捷键立即生效
- [ ] 配置正确持久化到 localStorage
- [ ] 重置默认按钮恢复所有默认值

---

## 9. 沟通与通知

### 9.1 每日站会 (异步 via Slack)

```
# 每日 09:00 前在 #sprint-4 频道发送

📊 Sprint 4 日报 - [日期]

E1 新手引导:
  - 昨日: guideStore + GuideOverlay 完成
  - 今日: 实现 GuideTooltip + 引导控制器
  - 阻塞: 无

E5 快捷键:
  - 昨日: shortcutStore 完成
  - 今日: 实现 ShortcutItem + 冲突检测
  - 阻塞: 无
```

### 9.2 任务完成通知

```bash
# E1 开发完成后
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py \
  update vibex-pm-proposals-20260403_024652 \
  dev-e1 done

# 测试完成后
python3 ~/.openclaw/skills/team-tasks/scripts/task_manager.py \
  update vibex-pm-proposals-20260403_024652 \
  test-e1 done
```

### 9.3 Code Review 流程

1. **PR 创建** → 通知 reviewer
2. **Review** → reviewer 在 PR 下评论
3. **修复** → dev 修复后 re-request review
4. **合并** → reviewer 批准后 merge

---

## 10. 风险升级路径

```
L1: Dev 自身尝试 3 轮后仍无法解决
    → 在 #dev 频道 @相关人 求助

L2: 依赖方阻塞（如导出 API 不稳定）
    → 在 #sprint-4 频道 @pm + @architect 确认

L3: 跨 Epic 协调问题
    → 升级到 #coord 频道

L4: 重大技术风险（如性能问题、安全问题）
    → 触发 #architect 紧急评审
```
