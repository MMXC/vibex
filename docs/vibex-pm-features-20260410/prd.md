# PRD: VibeX PM Features 2026-04-10

**项目**: vibex-pm-features-20260410
**版本**: v1.0
**日期**: 2026-04-10
**负责人**: PM Agent
**状态**: Draft

---

## 执行摘要

### 背景

当前 VibeX 首页存在两个直接影响用户留存的问题：

1. **需求输入质量差**：新用户面对空白输入框不知从何下手，导致 AI 生成结果质量受限于输入质量。
2. **首次使用流失率高**：2026-04-06 移除了 `<NewUserGuide />` 后，onboarding overlay 覆盖不足，用户缺少有效引导。

### 目标

- **E1（需求模板库）**：提供可选择的行业模板，降低新用户输入门槛，目标将需求描述完整率提升 50%。
- **E2（新手引导流程）**：设计 4 步引导流程，目标引导完成率 > 70%，降低首次使用流失。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 模板使用率（选择模板后发起分析的比例）| ≥ 30% |
| 引导完成率（弹出引导后完成所有步骤的比例）| ≥ 70% |
| 首次使用后 7 日留存率 | 提升 15% |
| 新用户首次分析平均耗时 | 减少 2 分钟 |

---

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| F001 | 模板数据结构设计 | 定义模板 JSON Schema，含实体、限界上下文、示例需求 | 用户面对空白输入框 | 0.5h |
| F002 | `/templates` 页面 | 展示 ≥3 个行业模板，支持预览和选择 | 降低输入门槛 | 1.5h |
| F003 | 模板选择 → AI 分析 | 选择模板后自动填充示例需求，一键发起分析 | 降低操作成本 | 1h |
| F004 | 引导流程设计（4步） | 设计引导步骤，含跳过机制 | 首次使用流失 | 1h |
| F005 | Highlight + Tooltip 实现 | 高亮关键操作区域，显示操作说明 | 引导体验 | 1h |
| F006 | 引导状态持久化 | 引导完成后记录状态，不再重复弹出 | 避免骚扰用户 | 0.5h |
| **合计** | | | | **5.5h（约 6h）** |

---

## Epic 拆分

### Epic 1: 需求模板库（E1-P001）

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E1-P001 | S1.1 | 模板数据结构设计 | 0.5h | 模板 JSON 含 `industry`, `entities[]`, `boundedContexts[]`, `sampleRequirement` |
| E1-P001 | S1.2 | `/templates` 页面 | 1.5h | 页面显示 ≥3 个行业模板（电商/社交/SaaS），支持预览 |
| E1-P001 | S1.3 | 模板选择 → AI 分析 | 1h | 选择后自动填充需求文本，「开始分析」按钮触发分析 |

### Epic 2: 新手引导流程（E2-P002）

| Epic | Story | 描述 | 工时 | 验收标准 |
|------|-------|------|------|----------|
| E2-P002 | S2.1 | 引导流程设计（4步） | 1h | 引导步骤 ≤4，含跳过按钮 |
| E2-P002 | S2.2 | Highlight + Tooltip 实现 | 1h | 关键操作区域高亮，Tooltip 显示说明文字 |
| E2-P002 | S2.3 | 引导状态持久化 | 0.5h | 完成后 localStorage 标记，引导不再重复弹出 |

---

## 验收标准（expect() 断言）

### E1: 需求模板库

```
AC1: 新用户首次访问 /dashboard
     expect(引导流程弹出).toBe(true)
     expect(引导步骤数).toBeLessThanOrEqual(4)

AC2: 用户在引导中点击「跳过」
     expect(引导消失).toBe(true)
     expect(localStorage.getItem('onboarding_completed')).toBe(true)
     expect(刷新页面后引导不重复弹出).toBe(true)

AC3: 访问 /templates
     expect(页面渲染).toBe(true)
     expect(行业模板数量).toBeGreaterThanOrEqual(3)
     expect(模板列表).toContain('电商')
     expect(模板列表).toContain('社交')
     expect(模板列表).toContain('SaaS')

AC4: 选择「电商」模板
     expect(需求输入框文本).toContain('电商')
     expect(输入框非空).toBe(true)

AC5: 点击「开始分析」（基于模板内容）
     expect(AI分析调用).toHaveBeenCalled()
     expect(分析结果展示).toBe(true)
```

### E2: 新手引导流程

```
AC6: 引导 Tooltip 显示在正确元素上方
     expect(Tooltip位置.x).toBeCloseTo(目标元素.x, 10)
     expect(Tooltip位置.y).toBeLessThan(目标元素.y) // 箭头指向上方

AC7: 引导完成后，localStorage 标记正确
     expect(localStorage.getItem('onboarding_v2_completed')).toBe('true')
     expect(再次访问时引导不弹出).toBe(true)
```

---

## DoD（Definition of Done）

### Epic 1 完成标准

- [ ] 模板 JSON Schema 已定义并通过 Schema 校验测试
- [ ] `/templates` 页面在 ≥3 个分辨率下可正常渲染
- [ ] 选择模板后需求输入框自动填充，文本内容符合模板行业特征
- [ ] 点击「开始分析」触发 AI 分析流程，数据正确传递到后端
- [ ] E2E 测试覆盖：模板选择 → 填充 → 分析完整链路
- [ ] Lighthouse Performance 评分下降 ≤ 5%（避免首屏性能劣化）

### Epic 2 完成标准

- [ ] 引导流程 4 步以内完成
- [ ] 跳过按钮功能正常，状态正确持久化
- [ ] Highlight 高亮不影响原有布局（z-index 隔离）
- [ ] Tooltip 跟随窗口 resize 重排位置
- [ ] 引导完成后刷新页面不重复弹出（localStorage 验证）
- [ ] E2E 测试覆盖：首次访问 → 完成引导 → 验证不再弹出

---

## 功能点汇总表（含页面集成标注）

| 功能点 | 涉及页面/组件 | 新增/修改 | 依赖方 |
|--------|--------------|-----------|--------|
| 模板 JSON 数据文件 | `data/templates/` | 新增 | S1.1 |
| `/templates` 路由 | `pages/templates.tsx` | 新增 | S1.2 |
| 模板卡片组件 | `components/TemplateCard.tsx` | 新增 | S1.2 |
| 模板填充逻辑 | `hooks/useTemplateFill.ts` | 新增 | S1.3 |
| 引导流程配置 | `data/onboarding-steps.ts` | 新增 | S2.1 |
| OnboardingOverlay 组件扩展 | `components/OnboardingOverlay.tsx` | 修改 | S2.2 |
| Highlight 高亮组件 | `components/OnboardingHighlight.tsx` | 新增 | S2.2 |
| 引导状态管理 | `hooks/useOnboarding.ts` | 新增 | S2.3 |
| localStorage 持久化 | `utils/onboarding-storage.ts` | 新增 | S2.3 |
| 首页入口 | `pages/index.tsx`（/templates 链接） | 修改 | - |
| 导航栏入口 | `components/Navbar.tsx`（模板入口） | 修改 | S1.2 |

---

## 实施计划（Sprint 排期）

### Sprint 1（Day 1，3h）

| 时间 | 任务 | 负责人 | 产出物 |
|------|------|--------|--------|
| 0-0.5h | S1.1 模板数据结构设计 | Dev | `data/templates/` JSON 文件 |
| 0.5-1.5h | S2.1 引导流程设计 | Dev | 引导步骤配置 `data/onboarding-steps.ts` |
| 1.5-2.5h | S2.2 Highlight + Tooltip 实现 | Dev | `OnboardingHighlight`, `OnboardingOverlay` 扩展 |
| 2.5-3h | S2.3 引导状态持久化 | Dev | `useOnboarding` hook + localStorage 工具 |

### Sprint 2（Day 2，3h）

| 时间 | 任务 | 负责人 | 产出物 |
|------|------|--------|--------|
| 0-1.5h | S1.2 `/templates` 页面 | Dev | `pages/templates.tsx`, `TemplateCard` |
| 1.5-2.5h | S1.3 模板选择 → AI 分析 | Dev | `useTemplateFill` hook + 集成到分析流程 |
| 2.5-3h | 集成测试 + Bug 修复 | Tester | E2E 测试用例 |

### 总工时: ~6h（2 个 Sprint）

---

## 技术决策记录

| 决策 | 选项 A（采用）| 选项 B（放弃）| 原因 |
|------|-------------|-------------|------|
| 模板存储方案 | 静态 JSON 文件 | API 动态加载 | 减少后端依赖，快速上线 |
| 引导实现方案 | 扩展现有 CanvasOnboardingOverlay | 新建独立引导组件 | 复用已有组件，减少重复代码 |

---

## 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 模板数量不足，用户期望落空 | 🟡 中 | 先做 3 个行业（电商/社交/SaaS），后期扩展 |
| 引导阻挡核心操作 | 🟡 中 | 所有引导步骤提供「跳过」按钮 |
| 与现有 onboarding 组件冲突 | 🟢 低 | 复用现有组件扩展，避免重复实现 |
| 首次加载性能劣化 | 🟢 低 | 模板 JSON 按需懒加载，不影响首屏 |

---

*文档状态: Draft → Review → Approved*
*下一个阶段: Epic 详细规格评审（见 specs/ 目录）*
