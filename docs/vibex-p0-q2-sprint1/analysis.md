# 需求分析：vibex-p0-q2-sprint1

> **分析方**: Analyst Agent  
> **分析日期**: 2026-04-14  
> **主题**: Sprint 1 — P0清理 + 核心体验（正式任务）  
> **关联项目**: vibex-p0-q2-sprint1

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-p0-q2-sprint1
- **执行日期**: 2026-04-14

---

## 1. 业务场景分析

### 业务价值

Sprint 1 是 VibeX Q2 的第一个冲刺，定位为"**清理 P0 债务 + 夯实核心体验**"。主要解决：
1. **门面问题**：Auth + /pagelist 视觉不一致，损害第一印象
2. **基础体验**：项目搜索缺失、AI 补全不智能、导航易迷路
3. **CI 质量门禁**：tsconfig 和测试配置损坏，Dev 无可信的反馈回路

目标成果：一个品牌视觉统一、AI 能力增强、开发效率提升的 VibeX，为 Q2 后续协作功能打好基础。

### 目标用户

| 用户类型 | Sprint 1 受益 |
|---------|-------------|
| 新访客 | 首次访问即看到统一深色主题，不再有割裂感 |
| 已有用户 | 项目搜索更快，AI 需求补全更智能，Canvas 操作更清晰 |
| Dev Agent | CI 质量门禁可信，tsc 类型检查无错误，测试文件不被意外排除 |

---

## 2. 核心 JTBD（Jobs-To-Be-Done）

1. **When** 新访客访问 VibeX，**I want** Auth + /pagelist 页面与主站视觉完全一致，**So that** 建立专业品牌信任感
2. **When** 用户输入不完整需求，**I want** AI 主动澄清缺失信息（≤3 条），**So that** 输出的 DDD 模型更准确
3. **When** 用户拥有 10+ 项目，**I want** 输入关键词实时过滤，**So that** 2 秒内找到目标项目
4. **When** 用户在 Canvas 中切换 Phase，**I want** 清晰知道当前在哪一步，**So that** 不会迷失在多步流程中
5. **When** API 返回错误，**I want** 看到人类可读的统一格式提示，**So that** 知道下一步该做什么
6. **When** Dev 修改组件，**I want** CI 运行类型检查 + 测试，**So that** 不会意外破坏已有功能
7. **When** Dev 提交代码，**I want** Bundle size 增长可量化监控，**So that** 性能不随迭代退化

---

## 3. Sprint 范围与 Epic 分解

### Epic 1: Brand Consistency（3-4h）

**合并来源**: P-001（PM）+ A-P0-1（Architect）

| 任务 | 工时 | 负责 |
|------|------|------|
| Auth 页面重写 | 2h | Dev |
| /pagelist 页面重写 | 1-2h | Dev |

**方案**: 统一采用 `var(--color-bg-primary)` 等 CSS 变量，迁移内联样式到 CSS Modules。

---

### Epic 2: Core UX（5h）

**合并来源**: P-003（PM）+ Dev P0-1 + Dev P0-2

| 任务 | 工时 | 负责 |
|------|------|------|
| Dev P0-1: tsconfig 修复（移除 next 插件） | 1h | Dev |
| Dev P0-2: 测试文件 exclude 修复 | 2h | Dev |
| P-003: 项目搜索（前端 fuzzy 搜索） | 2h | Dev |

**方案**: P0-1/P0-2 必须 Sprint 第一天完成，是后续所有任务的质量基础。

---

### Epic 3: Canvas Health（3h）

**合并来源**: P-004（PM）

| 任务 | 工时 | 负责 |
|------|------|------|
| TabBar 无障碍后遗症修复 | 2h | Dev |
| Phase 导航清晰化（高亮 active 状态） | 1h | Dev |

**风险**: TabBar 改动有引入新 bug 的风险。必须先跑 E2E 基线测试。

---

### Epic 4: Error Experience（4h）

**合并来源**: P-010（PM）+ A-P1-3（Architect）

| 任务 | 工时 | 负责 |
|------|------|------|
| 后端 API 错误格式统一 `{ error: { code, message } }` | 2h | Dev |
| 前端错误展示组件重构 | 2h | Dev |

**方案**: 前后端并行开发，后端先 mock 格式，前端先处理现有错误格式。

---

### Epic 5: Core Value（4h）

**合并来源**: P-002（PM）

| 任务 | 工时 | 负责 |
|------|------|------|
| AI 澄清卡片 UI 组件 | 2h | Dev+PM |
| AI 追问 prompt 设计与调优 | 2h | PM |

**风险**: AI prompt 调优不确定性高。4h 内产出 MVP 版本（≤3 条追问），不追求完美。

---

### Epic 6: Performance Base（8h）

**合并来源**: Dev P0-3

| 任务 | 工时 | 负责 |
|------|------|------|
| Bundle 审计：识别 2MB lib 来源 | 2h | Dev |
| dynamic import 改造 | 4h | Dev |
| bundle size 阈值测试 + CI 集成 | 2h | Dev |

**风险**: 改造范围可能超出 8h。严格限定改造目标：仅处理体积 > 200KB 的直接依赖。

---

## 4. 可行性评估

| Epic | 技术可行性 | 时间可行性 | 团队可行性 | 风险等级 |
|------|-----------|-----------|-----------|---------|
| Brand Consistency | ✅ 高 | ✅ | ✅ | 🟢 低 |
| Core UX | ✅ 高 | ✅ | ✅ | 🟢 低 |
| Canvas Health | ✅ 高 | ⚠️ 中（TabBar 风险） | ✅ | 🟠 中 |
| Error Experience | ✅ 高 | ✅ | ✅ | 🟢 低 |
| Core Value | ⚠️ 中（AI prompt 不确定） | ⚠️ 中 | ✅ | 🟠 中 |
| Performance Base | ⚠️ 中（改造范围不确定） | ⚠️ 中 | ⚠️ 中 | 🟠 中 |

**总体评估**: Sprint 1 可行，**预计完成率 85-90%**（6 个 Epic 中 5 个高可信，P-005 Collaboration MVP 不在 Sprint 1）。

---

## 5. 初步风险识别

### 技术风险

| 风险 | Epic | 等级 | 缓解措施 |
|------|------|------|---------|
| TabBar 修复引入新 bug | Canvas Health | 🟠 中 | 先跑 E2E 基线，改动后重复验证 |
| AI prompt 陷入无限追问循环 | Core Value | 🟠 中 | 强制限制最大追问轮次（≤3） |
| Bundle 改造范围超出 8h | Performance Base | 🟠 中 | 先审计明确目标，只处理 >200KB 的依赖 |
| tsconfig 修复后大量类型错误暴露 | Core UX | 🔴 高 | 先在干净分支跑 `tsc --noEmit` 评估影响 |

### 业务风险

| 风险 | Epic | 等级 | 缓解措施 |
|------|------|------|---------|
| Sprint 范围过大导致质量下降 | 整体 | 🟠 中 | WIP limit：同时进行 ≤ 2 个 Epic |
| Epic 5 AI 能力用户反馈不佳 | Core Value | 🟡 低 | 4h MVP，后续迭代优化 |

### 依赖风险

| 风险 | Epic | 等级 | 缓解措施 |
|------|------|------|---------|
| Epic 2 是所有其他 Epic 的质量前提 | Core UX | 🟠 中 | 必须 Sprint Day 1 完成 |
| Epic 4 前后端并行需对齐格式 | Error Experience | 🟡 低 | 定义共享错误格式 Schema，先文档再代码 |

---

## 6. 验收标准

- [ ] 访问 `/auth` 登录页 + `/pagelist` 页面，背景色为 `var(--color-bg-primary)`，无浅灰白背景，视觉与 `/canvas` 一致
- [ ] 项目列表页实现 fuzzy 搜索，关键词响应时间 < 2s，无搜索结果时不崩溃
- [ ] Canvas Phase 导航栏高亮当前步骤（active 状态），切换 4 个 Phase 无错位，刷新后状态保持
- [ ] API 错误响应格式统一：`{ error: { code: string, message: string } }`，前端显示人类可读提示
- [ ] `tsc --noEmit` 在前后端均无错误（包含测试文件），CI 质量门禁通过
- [ ] Dev P0-3 Bundle size 增长 < 200KB，新增 dynamic import 覆盖 3+ 个大组件
- [ ] Sprint 1 结束后，Epic 1-6 全部完成并部署到 vibex-app.pages.dev
- [ ] Epic 5（AI 补全）追问轮次 ≤ 3，连续 2 轮无新信息时自动结束追问

---

## 7. Sprint 执行顺序建议

```
Day 1:
  → Epic 2（Dev P0-1 + P0-2）优先完成
  → 建立可信的 CI 质量门禁

Day 2-3:
  → Epic 1（Brand Consistency）— 门面问题，用户感知最强
  → Epic 4（Error Experience）— 前后端并行

Day 4-5:
  → Epic 3（Canvas Health）— 需要 E2E 基线前置
  → Epic 5（Core Value AI）— 需要 PM prompt 配合

Day 6-7:
  → Epic 6（Performance Base）— 最后执行，有充足 buffer
  → Sprint 回顾 + 部署
```

---

## 8. Git History 分析记录

| 提交 | 关联 Epic | 说明 |
|------|----------|------|
| `8b1ec9f3` docs: update changelog for Epic2-Stories | 整体 | 最新 Epic 完成模式，changelog 规范参考 |
| `3bad72a2` test(design): Epic2-Stories — 52 unit tests | 质量保障 | Epic 测试覆盖参考（52 tests） |
| `c7e9ae95` review: vibex-canvas-history-projectid/epic2-stories | Epic 3 | Canvas 历史修复参考 |
| `00061ff3` feat(canvas): Phase2 P1 — 18 snapshot 单元测试 | Epic 3 | Canvas 测试锚点 |
| `ab3f9636` docs: update frontend changelog for Epic2 Phase2 P1 | 整体 | frontend changelog 规范参考 |
| `da11de72` test(design): Epic1-Stories — 52 unit tests + parser fix | 质量保障 | Epic 测试完成模式参考 |
| `497f4e76` feat(canvas): Phase1 P0 — catalog slots | Epic 1 | 组件整合/品牌一致性修复参考 |

**结论**: 历史 Git 记录显示 Epic-based 交付模式成熟：每 Epic 有 review → approval → changelog 更新。Sprint 1 应严格遵循：每个 Epic 完成后发布 changelog entry。

---

*分析完成 | Analyst Agent | 2026-04-14*
