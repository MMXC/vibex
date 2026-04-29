# VibeX Sprint 17 Backlog — 功能增强识别

**生成时间**: 2026-04-30
**Agent**: dev
**状态**: Draft

---

## 概述

本 backlog 基于 Sprint 1-17 代码分析和 TS 修复过程中识别的痛点，识别出以下高优先级功能增强。

---

## 功能点清单

| ID | 功能点 | 类别 | R | I | C | E | RICE | 优先级 |
|----|--------|------|-----|-----|-----|-----|-------|--------|
| B1 | 画布骨架屏加载状态 | UX | 3 | 2 | 3 | 3 | 54 | P0 |
| B2 | TS 严格模式渐进升级（消除 `as any`） | DX | 3 | 2 | 3 | 3 | 54 | P0 |
| B3 | 三树面板空状态优化 | UX | 3 | 2 | 3 | 3 | 54 | P0 |
| B4 | CanvasPage 全局错误边界增强 | DX | 3 | 2 | 2 | 2 | 36 | P1 |
| B5 | CodeGenerator E2E 测试补全 | QA | 3 | 3 | 3 | 3 | 81 | P0 |
| B6 | 实体关系图导出增强（格式支持） | Feature | 2 | 2 | 2 | 3 | 24 | P2 |

---

## B1: 画布骨架屏加载状态

**描述**: 当前画布页面在加载数据时没有骨架屏（skeleton screen），用户看到的是空白页面然后突然内容出现。`CanvasPage.tsx` 在 `useEffect` 中通过 `fetch(/api/projects/{id})` 加载项目数据（line 167），加载过程中仅显示空白容器，没有骨架屏占位符。

**RICE 评分**:
- Reach (覆盖用户): 3 — 所有画布用户都会遇到初始加载
- Impact (影响): 2 — 体验提升但不改变核心功能
- Confidence (置信度): 3 — 实现方案明确（基于 Suspense + 骨架屏组件）
- Effort (工时): 3 — 约 2-3 天

**RICE = 54**

**验收标准**:
- [ ] 画布组件加载时显示骨架屏占位符（三列布局骨架）
- [ ] 骨架屏与最终 UI 布局一致（BoundedContextTree / ComponentTree / BusinessFlowTree 三列）
- [ ] 加载完成后骨架屏淡出（opacity transition）
- [ ] `pnpm build` 通过
- [ ] 无新的 TypeScript 错误

---

## B2: TS 严格模式渐进升级（消除 `as any`）

**描述**: Sprint 17 E3-TSFIX 开启了 `noUncheckedIndexedAccess: true`，但 canvas 组件中仍有 12 处 `as any` 硬编码类型断言。这些 `as any` 掩盖了潜在的类型错误，应该逐步消除或替换为类型守卫函数（type guard）。

**RICE 评分**:
- Reach (覆盖用户): 3 — 所有开发人员
- Impact (影响): 2 — 类型安全提升，减少运行时错误
- Confidence (置信度): 3 — 已有 `isValidContextNodes` 等 type guard 可复用
- Effort (工时): 3 — 约 2-3 天

**RICE = 54**

**验收标准**:
- [ ] canvas 组件中 `as any` 用法从 12 处减少到 0 处
- [ ] 所有替换使用已有的 type guard 函数或新增类型守卫
- [ ] `pnpm exec tsc --noEmit` 0 errors
- [ ] `pnpm build` 通过

---

## B3: 三树面板空状态优化

**描述**: `BoundedContextTree.tsx`、`ComponentTree.tsx`、`BusinessFlowTree.tsx` 三个树组件在数据为空时没有良好的空状态提示。用户看到的是空白面板，不知道是因为没数据还是加载中或出错了。

**RICE 评分**:
- Reach (覆盖用户): 3 — 所有使用三树功能的用户
- Impact (影响): 2 — 显著减少用户困惑
- Confidence (置信度): 3 — 实现方案明确（EmptyState 组件）
- Effort (工时): 3 — 约 1-2 天

**RICE = 54**

**验收标准**:
- [ ] BoundedContextTree 空状态：显示 "暂无限界上下文，请先添加" + 引导按钮
- [ ] ComponentTree 空状态：显示 "暂无组件，请从限界上下文开始" + 引导文案
- [ ] BusinessFlowTree 空状态：显示 "暂无业务流程" + 引导文案
- [ ] 空状态文案与当前主题色一致
- [ ] `pnpm build` 通过

---

## B4: CanvasPage 全局错误边界增强

**描述**: `AppErrorBoundary.tsx` 已存在但未被 CanvasPage 使用。当 AI 生成、API 调用或 Store 状态异常时，CanvasPage 没有统一的错误边界，导致错误直接暴露或白屏。需要为 CanvasPage 的每个异步数据加载路径（fetch/useAIController/useCanvasStore）添加隔离的错误边界。

**RICE 评分**:
- Reach (覆盖用户): 2 — 遇到错误时画布用户
- Impact (影响): 2 — 优雅降级，减少崩溃感
- Confidence (置信度): 2 — 需要梳理 CanvasPage 中的异步边界
- Effort (工时): 2 — 约 1-2 天

**RICE = 36**

**验收标准**:
- [ ] CanvasPage 异步加载路径（有 Suspense boundary）有对应的 ErrorBoundary 包裹
- [ ] AI 生成失败时显示错误提示而非白屏
- [ ] API fetch 失败时显示重试按钮
- [ ] `pnpm build` 通过

---

## B5: CodeGenerator E2E 测试补全

**描述**: Sprint 16 P1-2 提案的验收标准明确要求 `pnpm playwright test code-generator-e2e.spec.ts` 全通过，但该文件从未创建。`design-to-code-e2e.spec.ts` 覆盖了 ConflictResolutionDialog 三面板 Diff，未覆盖 CodeGenPanel 真实组件生成逻辑。

**RICE 评分**:
- Reach (覆盖用户): 3 — 所有代码生成功能用户
- Impact (影响): 3 — 核心功能保护，防止回归
- Confidence (置信度): 3 — 验收标准明确，技术路径清晰
- Effort (工时): 3 — 约 2-3 天

**RICE = 81**

**验收标准**:
- [ ] `code-generator-e2e.spec.ts` 文件创建于 `vibex-fronted/e2e/` 目录
- [ ] 覆盖 CodeGenPanel 真实组件生成逻辑（FlowStepCard props → TSX 输出）
- [ ] 覆盖 Framework selector 切换
- [ ] 覆盖 CSS 变量验证
- [ ] 覆盖语法错误断言
- [ ] `pnpm playwright test code-generator-e2e.spec.ts` 全通过（≥ 5 tests）

---

## B6: 实体关系图导出增强（格式支持）

**描述**: 当前导出功能支持 Mermaid 格式导出实体关系图，但缺少 PlantUML、SVG 图片格式和 JSON Schema 格式的导出支持。用户（尤其企业用户）需要多种格式以适配不同文档工具。

**RICE 评分**:
- Reach (覆盖用户): 2 — 需要导出的用户
- Impact (影响): 2 — 提升导出灵活性
- Confidence (置信度): 2 — 需要调研现有导出架构
- Effort (工时): 3 — 约 3-4 天

**RICE = 24**

**验收标准**:
- [ ] ExportControls 组件添加 PlantUML 导出选项
- [ ] ExportControls 组件添加 SVG 图片导出选项
- [ ] ExportControls 组件添加 JSON Schema 导出选项
- [ ] 各格式导出后文件格式正确
- [ ] `pnpm build` 通过

---

## 分析依据

- **代码扫描**: `CanvasPage.tsx`（946行）fetch 数据时无骨架屏；12 处 `as any` 用法在 canvas 组件
- **Git 历史**: E18-TSFIX-2 修复了 196 个 TS strict errors；E18-TSFIX-3 添加了类型守卫函数
- **PRD 缺口**: Sprint 17 PRD 明确指出 `code-generator-e2e.spec.ts` 缺失
- **三树组件**: `BoundedContextTree.tsx`、`ComponentTree.tsx`、`BusinessFlowTree.tsx` 无空状态处理
- **ErrorBoundary**: `AppErrorBoundary.tsx` 存在但 CanvasPage 未集成

## Top 3 优先级

1. **B5** — CodeGenerator E2E 测试补全 (RICE: 81, P0)
2. **B1** — 画布骨架屏加载状态 (RICE: 54, P0)
3. **B2** — TS 严格模式渐进升级（消除 `as any`）(RICE: 54, P0)

---

## 实施建议

- B5 可在 Sprint 17 Week 1 完成（直接补全 PRD 验收标准缺口）
- B1/B2 可在 Sprint 17 Week 2 完成
- B3/B4 可在 Sprint 18 Week 1 完成
- B6 建议 Sprint 18+（需先调研导出架构）
- 建议从 B5 开始（用户可见度高，且是遗留验收标准）
