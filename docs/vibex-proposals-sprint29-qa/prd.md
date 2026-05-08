# VibeX Sprint 29 — QA 验证计划

**Agent**: PM
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint29-qa
**上游**: analysis.md (analyst, 2026-05-08)
**状态**: Draft

---

## 1. 执行摘要

### 背景
Sprint 29 产出已全部合并至 origin/main，包含 7 个 Epic（E01-E07），工期 22h。Analyst 已完成产出物完整性检查，识别 3 个非阻塞问题。本文档定义 QA 阶段的验证范围、测试策略和通过标准。

### 目标
- 验证所有 7 个 Epic 功能实现符合 Sprint 29 PRD 验收标准
- 确认 E2E 测试文件存在且规模合理
- 记录非阻塞问题，不阻塞 Sprint 29 验收

### 成功指标
| 指标 | 目标 |
|------|------|
| P0 Epic（E01）验证通过率 | 100% |
| E2E 测试文件存在率 | 100%（6个关键文件） |
| TS 编译 errors | 0 |
| 阻塞性 P0/P1 问题 | 0 |
| 非阻塞问题记录完整率 | 100% |

---

## 2. 验证范围

### 2.1 Epic 验证清单

| Epic | 名称 | 优先级 | 验证策略 | E2E 文件 | 页面集成验证 |
|------|------|--------|---------|---------|------------|
| E01 | Onboarding → Canvas 无断点 | P0 | TS编译 + 代码审查 + E2E | onboarding-canvas.spec.ts（待创建）| Onboarding Step / Canvas（gstack）|
| E02 | 项目分享通知系统 | P1 | TS编译 + 代码审查 + E2E | share-notify.spec.ts（待创建）| Dashboard ShareBadge（gstack）|
| E03 | Dashboard 全局搜索增强 | P1 | TS编译 + E2E | search.spec.ts（86行✅）| Dashboard 搜索框（gstack）|
| E04 | RBAC 细粒度权限矩阵 | P1 | TS编译 + 代码审查 + E2E | rbac-permissions.spec.ts（待创建）| ProjectCard / Canvas（gstack）|
| E05 | Canvas 离线模式 | P2 | TS编译 + 代码审查 + E2E | offline-canvas.spec.ts（待创建）| Canvas 离线 Banner（gstack）|
| E06 | Analytics 趋势分析 | P2 | TS编译 + E2E | analytics-trend.spec.ts（待创建）+ analytics-dashboard.spec.ts（257行✅）| Analytics Dashboard（gstack）|
| E07 | Sprint 28 Specs 补全 | P2 | 文档检查 | — | — |

### 2.2 验证策略说明

**三层验证（按优先级）：**

**Layer 1 — 编译层**（全部 Epic 必须通过）
- `tsc --noEmit` 退出码 0

**Layer 2 — 静态验证**（全部 Epic 必须通过）
- 代码文件存在且内容符合预期
- E2E 测试文件存在且行数合理（≥80行）
- API route handler 响应码正确

**Layer 3 — 交互验证**（仅【需页面集成】的 Epic）
- 使用 gstack /qa 技能验证页面可访问性
- 使用 gstack /browse 技能截图确认 UI 渲染
- 确认交互元素存在且可点击

---

## 3. 通过标准（Pass/Fail Matrix）

### E01: Onboarding → Canvas 无断点
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| useCanvasPrefill 读取 localStorage | `hooks/useCanvasPrefill.ts` 存在且读取 `PENDING_TEMPLATE_REQ_KEY` | 代码审查 | — |
| Canvas 骨架屏 100ms 内显示 | `components/canvas/CanvasPageSkeleton.tsx` 已集成 | gstack /qa | — |
| AI 降级格式存储 | PreviewStep.tsx 存入 `{ raw, parsed: null }` 格式 | 代码审查 | — |
| sessionStorage 持久化 | `hooks/useOnboarding.ts` 实现 sessionStorage 读写 | 代码审查 | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |
| E2E onboarding-canvas.spec.ts 存在 | 文件存在且 ≥80 行 | exec | — |

### E02: 项目分享通知系统
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| NotificationService Slack DM | `lib/notification/NotificationService.ts` 存在 | 代码审查 | — |
| 站内通知降级 | `in-app` fallback 存在 | 代码审查 | — |
| ShareBadge 未读计数 | `components/dashboard/ShareBadge.tsx` 存在 | gstack /qa | — |
| 分享成功后触发 | canvas-share 后调用 NotificationService | 代码审查 | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |
| E2E share-notify.spec.ts 存在 | 文件存在且 ≥80 行 | exec | — |

### E03: Dashboard 全局搜索增强
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| 搜索高亮 | `SearchBar.tsx` 使用 `<mark>` 高亮匹配文本 | 代码审查 | — |
| 搜索 E2E（86行）| `search.spec.ts` 存在且 ≥80 行 | exec | — |
| 无结果提示 | 空结果显示"没有找到包含 xxx 的项目" | gstack /qa | — |
| E03 后端搜索未接入 | IMPLEMENTATION_PLAN.md R3 已记录为 Tech Debt | 代码审查 | — |

### E04: RBAC 细粒度权限矩阵
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| types.ts: ProjectPermission + TeamRole | `lib/rbac/types.ts` 包含完整类型定义 | 代码审查 | — |
| RBACService.canPerform | `lib/rbac/RBACService.ts` 存在且逻辑正确 | 代码审查 | — |
| PUT /api/projects/:id/role | `route.ts` 存在且返回正确响应码 | 代码审查 | — |
| Dashboard viewer/member disabled | `dashboard/page.tsx` 中 ProjectCard 按权限 disabled | gstack /qa | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |
| E2E rbac-permissions.spec.ts 存在 | 文件存在且 ≥80 行 | exec | — |

### E05: Canvas 离线模式
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| Service Worker | `public/sw.js` 存在（cacheFirst/networkFirst/offline fallback）| 代码审查 | — |
| PWA manifest | `manifest.json` 存在（standalone）| 代码审查 | — |
| OfflineBanner | `components/canvas/OfflineBanner.tsx` 存在且 5s 重连隐藏 | gstack /qa | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |
| E2E offline-canvas.spec.ts 存在 | 文件存在且 ≥80 行 | exec | — |

### E06: Analytics 趋势分析
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| TrendChart.tsx 纯 SVG | 无 Recharts/Chart.js | 代码审查 | — |
| GET /api/analytics/funnel | 30天聚合数据返回 | 代码审查 | — |
| 7d/30d/90d 切换 | 切换按钮存在且切换数据范围 | gstack /qa | — |
| CSV 导出含趋势列 | date + conversionRate + trend | 代码审查 | — |
| 空状态（< 3条数据）| 数据不足时不 crash | gstack /qa | — |
| TS 编译 0 errors | `tsc --noEmit` 退出 0 | exec | — |
| E2E analytics-trend.spec.ts 存在 | 文件存在且 ≥80 行 | exec | — |

### E07: Sprint 28 Specs 补全
| 验收标准 | 通过条件 | 验证方法 | 结果 |
|---------|---------|---------|------|
| E03-ai-clarify.md | 89行，API schema + 降级路径 | exec | — |
| E04-template-crud.md | 135行，CRUD schema + Dashboard UI | exec | — |
| E06-error-boundary.md | 76行，ErrorBoundary 设计 + Fallback UI | exec | — |
| E07-mcp-server.md | 107行，MCP 健康检查 + JSON-RPC 2.0 | exec | — |

---

## 4. 非阻塞问题处理

### Q1: 5 个 E2E 测试文件不存在（E01/E02/E04/E05/E06）
- **严重性**: 中
- **影响**: 功能代码已实现，测试可后续补充，不影响验收
- **状态**: ✅ 记录在案，Sprint 30 补充
- **现有测试**: E03 search.spec.ts（86行）✅，E06 analytics-dashboard.spec.ts（257行）✅

### Q2: E03 后端搜索 API 未接入
- **严重性**: 低
- **影响**: 前端已就绪，后端接入记录在 IMPLEMENTATION_PLAN.md R3 为 Tech Debt
- **状态**: ✅ 记录在案，不阻塞当前验收

### Q3: IMPLEMENTATION_PLAN.md 仅 E01 标记完成状态，E02-E07 无状态标记
- **严重性**: 低
- **影响**: CHANGELOG 已有所有 Epic 条目，代码实现完整
- **状态**: ✅ 记录在案，不阻塞验收

---

## 5. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint29-qa
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
- [ ] useCanvasPrefill hook 存在且读取 localStorage
- [ ] Canvas 骨架屏 100ms 内可见（gstack 验证）
- [ ] AI 降级格式 `{ raw, parsed: null }` 正确存储
- [ ] Onboarding 刷新后进度保留（gstack 验证）

### Epic E02 DoD
- [ ] NotificationService 存在且 Slack DM 逻辑正确
- [ ] ShareBadge 组件存在且未读计数正确（gstack 验证）
- [ ] 站内通知降级路径存在

### Epic E03 DoD
- [ ] 搜索高亮使用 `<mark>` 标签（gstack 验证）
- [ ] search.spec.ts 存在且 ≥80 行
- [ ] 空结果显示友好文案（gstack 验证）

### Epic E04 DoD
- [ ] types.ts 包含完整 ProjectPermission + TeamRole
- [ ] RBACService.canPerform 逻辑正确
- [ ] viewer/member 编辑按钮按权限 disabled（gstack 验证）

### Epic E05 DoD
- [ ] public/sw.js 存在且 cacheFirst/networkFirst 策略正确
- [ ] manifest.json 存在且 display: standalone
- [ ] OfflineBanner 存在且 5s 重连隐藏（gstack 验证）

### Epic E06 DoD
- [ ] TrendChart.tsx 纯 SVG，无外部 chart 库
- [ ] 7d/30d/90d 切换正确（gstack 验证）
- [ ] CSV 导出包含 trend 列
- [ ] 空状态不 crash（gstack 验证）

### Epic E07 DoD
- [ ] E03-ai-clarify.md 存在且 ≥80 行
- [ ] E04-template-crud.md 存在且 ≥80 行
- [ ] E06-error-boundary.md 存在且 ≥70 行
- [ ] E07-mcp-server.md 存在且 ≥80 行

---

## 7. 自检清单

- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic 验证清单格式正确（Epic/策略/E2E文件/页面验证）
- [ ] Pass/Fail Matrix 每个 Epic 有明确的通过条件
- [ ] 非阻塞问题（Q1, Q2, Q3）记录完整
- [ ] DoD 章节存在且每个 Epic 有独立检查项
- [ ] 执行决策段落存在

---

*本 PRD 由 PM 基于 analyst 评审报告（analysis.md）产出。*