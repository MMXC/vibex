# VibeX Sprint 27 提案

**Agent**: analyst
**日期**: 2026-05-06
**项目**: vibex-proposals-sprint27
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-26 交付成果识别系统缺口

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | infrastructure | Real-time Collaboration — 多用户在线感知 | Canvas 编辑器全部用户 | P0 |
| P002 | carry-over | Sprint 26 E5 — 属性面板性能优化 | 大型项目（>200 nodes）用户 | P1 |
| P003 | improvement | AI-Assisted Requirements — ClarifyStep 智能需求生成 | Onboarding 新用户 | P1 |
| P004 | improvement | Template API 扩展 + Export 增强 | 模板使用者、高级用户 | P2 |

---

## 2. 提案详情

### P001: Real-time Collaboration — 多用户在线感知

**问题描述**:

Sprint 1-26 完成了个体用户全流程（Onboarding → 画布编辑 → 需求导出），但 Canvas 编辑器完全缺乏多用户协作感知。当前状态：
- 多人同时打开同一项目时，各自独立编辑，无感知
- 用户无法知道谁在画布上、谁在编辑哪个节点
- Sprint 13-14 完成 Teams API（Sprint 25 E5），提供了权限维度，但缺少实时状态维度

**影响范围**:

Canvas 编辑器 (`CanvasPage.tsx`)、WebSocket 基础设施（尚未引入）、`usePresenceStore`（不存在）

**验收标准**:

1. 打开同一项目的多个浏览器 Tab能看到对方的光标位置（用不同颜色区分）
2. 多人同时编辑时，节点更新实时同步（延迟 < 1s）
3. 团队成员列表在 Canvas 工具栏显示在线人数
4. 离线重连后状态自动恢复
5. 单用户场景（无 WebSocket 服务）降级为本地模式，不报错

---

### P002: Sprint 26 E5 Carry-over — 属性面板性能优化

**问题描述**:

Sprint 26 Implementation Plan 中 E5（大型项目属性面板性能优化）全部 5 个 Story（S5.1-S5.5）均未交付，状态全为 `[ ]`。该 Epic 原计划 Week 2 Day 6-10 实施，但因 Sprint 26 周期结束被搁置。

**影响范围**:

- 大型项目（>200 nodes）用户：属性面板渲染卡顿，响应时间 > 500ms
- Sprint 26 PRD 中 E5 成功指标：属性面板响应 < 200ms，LCP < 2.5s — 未达成

**验收标准**:

1. 节点数 100-500 的项目，属性面板渲染时间 < 200ms（Chrome DevTools Performance 测量）
2. 属性面板组件 `React.memo` + `useMemo` 优化后，TS 编译 0 errors
3. Lighthouse Performance Score ≥ 85（大型项目场景）
4. 加载节点数 > 200 时，显示进度指示器（S5.3）
5. CI 集成性能预算（构建时间 baseline 记录，增量 > 10% 报警）

---

### P003: AI-Assisted Requirements — ClarifyStep 智能需求生成

**问题描述**:

Sprint 25 E1 实现了模板 auto-fill（Onboarding Step 5），新用户在 ClarifyStep 手动输入需求内容时存在以下问题：

1. **输入质量差**：用户在空白框内随意填写，格式混乱，无法生成有效的结构化 Story Card
2. **上下文断链**：ClarifyStep 纯文本输入 → PreviewStep 手动选择模板 → 画布 auto-fill，三个步骤用户需要重复同一信息
3. **激活率影响**：Sprint 26 E1 解决了"进入画布后看到空白"的问题，但用户在上游输入的需求本身可能就缺乏结构

**复现步骤**:

1. 注册新账号，进入 Onboarding
2. Step 2（Scenario）选择 "new-feature"
3. Step 3（Clarify）文本框输入："我想做一个登录功能"
4. Step 5（Preview）观察：模板卡片过滤结果可能为空或过于宽泛
5. 进入画布：auto-fill 内容与用户意图偏差大

**根因分析**:

```
根因：ClarifyStep 是纯文本输入，没有结构化引导和即时反馈
证据：
- PreviewStep 过滤依赖 SCENARIO_OPTIONS（5类）+ 模板标签匹配
- 用户输入"登录功能" → SCENARIO_OPTIONS "new-feature" 过滤 → 可能匹配到 0 个模板
- 没有 LLM 语义理解层，无法从自然语言推断用户意图
```

**影响范围**:

Onboarding 新用户（预计每周新增 50-200 用户），Onboarding 完成率，直接影响激活率

**验收标准**:

1. ClarifyStep 文本输入后，显示 AI 解析预览（结构化：用户角色 + 目标 + 约束）
2. 用户可编辑/确认 AI 解析结果
3. 确认后自动跳转到 PreviewStep，模板过滤基于 AI 解析的语义标签
4. 进入画布的 auto-fill 内容与用户意图相关性 ≥ 80%（用户反馈评估）
5. AI 调用失败时降级为现有模板过滤逻辑，不阻断 Onboarding

---

### P004: Template API 扩展 + Export 增强

**问题描述**:

Sprint 25 E1 完成了模板库的 Onboarding 集成，但模板系统本身存在以下限制：

1. **模板来源单一**：只有内置模板，无法导入社区模板或导出自己的模板
2. **导出能力弱**：Canvas diff 有 JSON 导出（E2），但模板无法单独导出/分享
3. **模板管理缺失**：用户无法收藏、编辑、删除自定义模板

**影响范围**:

需要复用模板的团队、高级用户

**验收标准**:

1. `/api/v1/templates` REST API：GET 列表、POST 创建、PUT 更新、DELETE 删除
2. 模板导出：生成 `template-{name}-{date}.json`，包含模板结构 + 节点数据
3. 模板导入：上传 JSON 文件，解析后创建模板
4. Dashboard 新增 `/templates` 页面管理模板（列表 + 操作按钮）
5. 单元测试覆盖 template API（≥ 10 cases）

---

## 3. 执行依赖

### P001: Real-time Collaboration

- [ ] 需要修改的文件: `CanvasPage.tsx`, `gateway.ts` (WebSocket 集成), `vibex-backend/src/app/api/presence/route.ts` (新增)
- [ ] 前置依赖: `usePresenceStore`（新增，需状态管理设计）；WebSocket 服务（可复用现有 gateway.ts 或引入 Socket.IO）
- [ ] 需要权限: GitHub Actions CI/CD（添加 WebSocket E2E 测试）
- [ ] 预计工时: 8-10h（基础设施 3h + 前端协作 UI 4h + E2E 3h）
- [ ] 测试验证命令: `pnpm -C vibex-backend tsc --noEmit && pnpm exec tsc --noEmit`

### P002: Sprint 26 E5 Carry-over

- [ ] 需要修改的文件: `ChapterPanel.tsx`, `AttributePanel.tsx`, `vibex-fronted/src/hooks/useProjectSearch.ts` (参考 S4.1 hook 模式)
- [ ] 前置依赖: Sprint 26 E2/E3 已完成（项目 > 100 nodes 的测试数据已可构造）
- [ ] 需要权限: 无特殊权限
- [ ] 预计工时: 5.5h（S5.1: 2h + S5.2: 1h + S5.3: 0.5h + S5.4: 1h + S5.5: 1h）
- [ ] 测试验证命令: `pnpm exec tsc --noEmit && lighthouse https://staging.vibex.app/canvas/{large-project-id} --output=json`

### P003: AI-Assisted Requirements

- [ ] 需要修改的文件: `ClarifyStep.tsx`, `PreviewStep.tsx`, `ClarifyAI.tsx` (新增), `templateApi.ts` (扩展)
- [ ] 前置依赖: Sprint 26 E1 模板 auto-fill 已完成；需要 LLM API（OpenAI/Claude）密钥配置
- [ ] 需要权限: LLM API 配额（需 Coord 配置环境变量）
- [ ] 预计工时: 4h（AI 解析层 2h + UI 集成 1.5h + 降级逻辑 0.5h）
- [ ] 测试验证命令: `pnpm exec tsc --noEmit`

### P004: Template API 扩展

- [ ] 需要修改的文件: `vibex-backend/src/app/api/v1/templates/route.ts`, `lib/api/templates.ts`, `pages/dashboard/templates/page.tsx`
- [ ] 前置依赖: Sprint 25 E1 模板库（`useTemplates` hook 已存在）
- [ ] 需要权限: 无特殊权限
- [ ] 预计工时: 4h（API 2h + Dashboard 页面 1.5h + 测试 0.5h）
- [ ] 测试验证命令: `pnpm -C vibex-backend test`

---

## 4. 相关文件

- Sprint 26 PRD: `docs/vibex-proposals-sprint26/prd.md`
- Sprint 26 Implementation Plan: `docs/vibex-proposals-sprint26/IMPLEMENTATION_PLAN.md`
- Teams API 实现: `routes/v1/canvas-share.ts` (Sprint 25 E5)
- Onboarding auto-fill: `ChapterPanel.tsx` (Sprint 26 E1)

---

## 5. Sprint 27 工期估算

| Epic | 提案 | 工期 | 优先级 | Week |
|------|------|------|--------|------|
| E1 | P001 Real-time Collaboration | 8-10h | P0 | Week 1-2 |
| E2 | P002 Sprint 26 E5 Carry-over | 5.5h | P1 | Week 1 |
| E3 | P003 AI-Assisted Requirements | 4h | P1 | Week 2 |
| E4 | P004 Template API 扩展 | 4h | P2 | Week 2 |

**总工期: 21.5-23.5h**（2人 Sprint 60h 产能，有 buffer）

**推荐执行顺序**: P002 → P003 → P004 → P001
- P002 简单且已部分计划，继续 Sprint 26 未完成工作
- P003/P004 独立模块，可并行
- P001 最复杂，留到 Week 2 冲刺
