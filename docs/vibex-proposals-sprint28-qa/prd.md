# VibeX Sprint 28 — QA 验证计划

**Agent**: PM
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint28-qa
**上游**: analysis.md (analyst, 2026-05-08)
**状态**: Draft

---

## 1. 执行摘要

### 背景
Sprint 28 产出已全部合并至 origin/main，包含 7 个 Epic（E01-E07），工期 24.5h。Analyst 已完成产出物完整性检查，识别 2 个非阻塞问题。本文档定义 QA 阶段的验证范围、测试策略和通过标准。

### 目标
- 验证所有 7 个 Epic 功能实现符合 PRD 验收标准
- 使用 gstack 浏览器工具验证交互类功能
- 确认 E2E 测试文件存在且规模合理
- 记录非阻塞问题，不阻塞 Sprint 28 验收

### 成功指标
| 指标 | 目标 |
|------|------|
| P0 Epic（E01, E02）验证通过率 | 100% |
| E2E 测试文件存在率 | 100%（5个关键文件） |
| TS 编译 errors | 0 |
| 阻塞性 P0/P1 问题 | 0 |
| 非阻塞问题记录完整率 | 100% |

---

## 2. 验证范围

### 2.1 Epic 验证清单

| Epic | 名称 | 优先级 | 验证策略 | E2E 文件 | 页面集成验证 |
|------|------|--------|---------|---------|------------|
| E01 | 实时协作整合 | P0 | TS编译 + 代码审查 + E2E | presence-mvp.spec.ts | CanvasPage（gstack） |
| E02 | Design Output 性能优化 | P0 | TS编译 + 代码审查 + Lighthouse | — | DDSCanvasPage（gstack） |
| E03 | AI 辅助需求解析 | P1 | TS编译 + unit tests | onboarding-ai.spec.ts | ClarifyStep（gstack） |
| E04 | 模板 API 完整 CRUD | P1 | TS编译 + unit tests | templates-crud.spec.ts | /dashboard/templates（gstack） |
| E05 | PRD → Canvas 自动流程 | P1 | TS编译 + E2E | prd-canvas-mapping.spec.ts | PRD Editor（gstack） |
| E06 | Canvas 错误边界完善 | P2 | TS编译 + unit tests | — | DDSCanvasPage（gstack） |
| E07 | MCP Server 集成完善 | P2 | TS编译 + unit tests | mcp-integration.spec.ts | — |

### 2.2 验证策略说明

**三层验证（按优先级）：**

**Layer 1 — 编译层**（全部 Epic 必须通过）
- `tsc --noEmit` 退出码 0
- Vitest unit tests 通过（E03: 19/19, E04: 31/31）

**Layer 2 — 静态验证**（全部 Epic 必须通过）
- 代码文件存在且内容符合预期
- E2E 测试文件存在且行数合理（≥100行）
- API route handler 响应码正确

**Layer 3 — 交互验证**（仅【需页面集成】的 Epic）
- 使用 gstack /qa 技能验证页面可访问性
- 使用 gstack /browse 技能截图确认 UI 渲染
- 确认交互元素存在且可点击

---

## 3. 通过标准（Pass/Fail Matrix）

### E01: 实时协作整合
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| PresenceLayer 在 CanvasPage 渲染 | CanvasPage 顶部存在 PresenceAvatars | gstack /qa → `expect(page.locator('[data-testid="presence-avatars"]').isVisible())` | — |
| useRealtimeSync defined + exported | `hooks/useRealtimeSync.ts` 存在，export 语句存在 | 代码审查 | — |
| last-write-wins 冲突处理 | RTDB helpers 存在冲突处理逻辑 | 代码审查 | — |
| Firebase 降级路径 | `isFirebaseConfigured` 检查存在，无配置时静默 | 代码审查 | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |
| E2E presence-mvp.spec.ts 存在 | 文件存在且 ≥100 行 | exec | — |

### E02: Design Output 性能优化
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| react-window FixedSizeList 在 ChapterPanel | `import { List } from 'react-window'` 且 rowHeight=120 | 代码审查 | — |
| 子组件 React.memo | CardItem wrapped with React.memo | 代码审查 | — |
| selectedIndex useMemo | useMemo 包裹 selectedIndex | 代码审查 | — |
| 加载进度指示器 | 节点数 >200 时显示 shimmer skeleton | gstack /qa | — |
| 空状态引导 | 无卡片时显示空状态插图 | gstack /qa | — |
| 错误态重试 | error message + loadChapter 重试按钮 | gstack /qa | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |

### E03: AI 辅助需求解析
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| POST /api/ai/clarify → 200 | route.ts 存在且返回 200 | 代码审查 | — |
| 无 API Key 显示 guidance，不阻断 | ruleEngine 降级路径存在 | 代码审查 | — |
| 超时 30s 降级 | `AbortSignal.timeout(30_000)` 存在 | 代码审查 | — |
| ClarifyStep 集成 ClarifyAI | useClarifyAI hook 集成 | 代码审查 | — |
| Vitest 19/19 通过 | vitest 运行输出 19 passing | exec | — |
| E2E onboarding-ai.spec.ts 存在 | 文件存在且 ≥200 行 | exec | — |

### E04: 模板 API 完整 CRUD
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| POST → 201 | route.ts POST handler 返回 201 | 代码审查 | — |
| PUT → 200 | PUT handler 返回 200 | 代码审查 | — |
| DELETE → 200/内置模板 403 | DELETE handler 区分内置模板 | 代码审查 | — |
| /dashboard/templates 可访问 | page.tsx 存在 | 代码审查 | — |
| 导入/导出 JSON | GET /export + POST /import 存在 | 代码审查 | — |
| Vitest 31/31 通过 | vitest 运行输出 31 passing | exec | — |
| E2E templates-crud.spec.ts 存在 | 文件存在且 ≥200 行 | exec | — |

### E05: PRD → Canvas 自动流程
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| POST /api/v1/canvas/from-prd → 200 | route.ts 存在且返回 200 | 代码审查 | — |
| Chapter → 左栏节点 | prd-canvas.ts 映射逻辑存在 | 代码审查 | — |
| Step → 中栏节点 | flow type 映射存在 | 代码审查 | — |
| Requirement → 右栏节点 | design type 映射存在 | 代码审查 | — |
| PRD Editor "生成 Canvas" 按钮 | `data-testid="generate-canvas-btn"` 存在 | gstack /qa | — |
| E2E prd-canvas-mapping.spec.ts 存在 | 文件存在且 ≥150 行 | exec | — |

### E06: Canvas 错误边界完善
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| DDSCanvasPage 包裹 TreeErrorBoundary | line 493-672 包含 ErrorBoundary | 代码审查 | — |
| Fallback 含"重试"按钮 | 错误态包含重试逻辑 | 代码审查 | — |
| 重试不触发整页刷新 | 组件级恢复，无 window.location | 代码审查 | — |
| DDSCanvasPage unit tests 12 个 | vitest DDSCanvasPage 通过 | exec | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |

### E07: MCP Server 集成完善
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| GET /api/mcp/health → 200 | route.ts 存在且返回 200 | 代码审查 | — |
| 响应包含 status/timestamp/service | response.body 结构正确 | 代码审查 | — |
| E2E mcp-integration.spec.ts 存在 | 文件存在且 ≥100 行 | exec | — |
| 6 个 E2E scenarios | spec.ts 中 ≥6 个 test() 块 | 代码审查 | — |

---

## 4. 非阻塞问题处理

### Q1: CHANGELOG.md 中 E05/E06/E07 无独立条目节
- **严重性**: 低
- **影响**: 文档同步问题，不影响功能验收
- **状态**: ✅ 记录在案，Sprint 29 补充
- **验收**: CHANGELOG.md 包含 E05-E07 changelog commit（`docs: update changelog...E05/E06/E07`），内容节缺失但 commit 存在

### Q2: E03/E04/E06/E07 specs 文档缺失
- **严重性**: 低
- **影响**: specs 文档不影响功能验收
- **状态**: ✅ 记录在案，Sprint 29 补全
- **现有 specs**: E01-realtime-collab.md, E02-perf-optimization.md, E03-ai-clarify.md, E05-prd-canvas.md（E04, E06, E07 缺失）
- **验收**: E01/E02/E05 specs 存在即可，功能代码已通过 Layer 1-2 验证

---

## 5. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint28-qa
- **执行日期**: 2026-05-08
- **QA 状态**: 待验证

---

## 6. Definition of Done（QA 阶段）

### 全部 Epic 通过条件
- [ ] Layer 1（编译层）：`tsc --noEmit` 退出 0
- [ ] Layer 2（静态验证）：所有代码文件存在且内容符合预期
- [ ] Layer 3（交互验证）：所有【需页面集成】的 Epic 通过 gstack 验证
- [ ] P0/P1 问题数 = 0
- [ ] 非阻塞问题已记录在案

### Epic E01 DoD
- [ ] PresenceLayer 在 CanvasPage 渲染（gstack 验证）
- [ ] Firebase 降级路径可验证（无 console.error）
- [ ] E2E presence-mvp.spec.ts 存在且 ≥100 行

### Epic E02 DoD
- [ ] react-window FixedSizeList 代码存在
- [ ] 所有子组件 React.memo
- [ ] DDSCanvasPage 加载态/空状态/错误态可验证（gstack 验证）

### Epic E03 DoD
- [ ] Vitest 19/19 通过
- [ ] E2E onboarding-ai.spec.ts 存在且 ≥200 行
- [ ] ClarifyStep 中 AI 结果可编辑确认（gstack 验证）

### Epic E04 DoD
- [ ] Vitest 31/31 通过
- [ ] E2E templates-crud.spec.ts 存在且 ≥200 行
- [ ] /dashboard/templates 页面可访问（gstack 验证）

### Epic E05 DoD
- [ ] E2E prd-canvas-mapping.spec.ts 存在且 ≥150 行
- [ ] PRD Editor "生成 Canvas" 按钮存在且可点击（gstack 验证）

### Epic E06 DoD
- [ ] DDSCanvasPage unit tests 全部通过
- [ ] ErrorBoundary 重试按钮存在（gstack 验证）

### Epic E07 DoD
- [ ] E2E mcp-integration.spec.ts 存在且 ≥100 行
- [ ] ≥6 个 E2E test scenarios

---

## 7. 自检清单

- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic 验证清单格式正确（Epic/策略/E2E文件/页面验证）
- [ ] Pass/Fail Matrix 每个 Epic 有明确的通过条件
- [ ] 非阻塞问题（Q1, Q2）记录完整
- [ ] DoD 章节存在且每个 Epic 有独立检查项
- [ ] 执行决策段落存在

---

*本 PRD 由 PM 基于 analyst 评审报告（analysis.md）产出。*
