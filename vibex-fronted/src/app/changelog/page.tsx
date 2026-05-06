'use client';

import { useEffect, useState } from 'react';
import styles from './changelog.module.css';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  commit?: string;
}

interface VersionInfo {
  version: string;
  commit: string;
  timestamp: string;
}

const mockChangelog: ChangelogEntry[] = [
  {
    version: '1.0.347',
    date: '2026-05-07',
    changes: [
      '🚀 S29-E01: Onboarding → Canvas 无断点',
      '✅ useCanvasPrefill hook — 读取 localStorage 预填充，支持 { raw, parsed: null } AI 降级格式',
      '✅ /canvas/[id] 动态路由 — Onboarding 跳转目标，100ms 内显示骨架屏',
      '✅ PreviewStep storePendingTemplateRequirement — AI 降级格式 { raw, parsed: null }',
      '✅ useOnboarding sessionStorage 持久化 — Step 2→5 刷新后进度不丢失',
      '提交: 3b78219c6',
    ],
    commit: '3b78219c6',
  },
  {
    version: '1.0.347',
    date: '2026-05-05',
    changes: [
      '🐛 RBAC Security Fix: 移除 Project Member 的 canEdit/canShare 权限',
      '✅ useCanvasRBAC.ts — member 角色仅读，owner 可编辑/分享',
      '提交: ea2df8f23',
    ],
    commit: 'ea2df8f23',
  },
  {
    version: '1.0.347',
    date: '2026-05-06',
    changes: [
      '🚀 S26-E1: Onboarding → 画布预填充 (P001)',
      '✅ S1.2: CanvasFirstHint 引导气泡组件 (data-testid ✅, 3s auto-dismiss)',
      '✅ S1.1: PreviewStep 完成 Onboarding 后创建项目并跳转画布',
      '✅ S1.1: 扩展 ProjectCreate 支持 templateRequirement 参数',
      '✅ S1.4: guidanceStore canvasFirstHintDismissed 持久化',
      '提交: 67a8166ad',
    ],
    commit: '67a8166ad',
  },
  {
    version: '1.0.347',
    date: '2026-05-06',
    changes: [
      '🚀 S26-E2: 跨项目 Canvas 版本历史 (P002)',
      '✅ S2.5: PRD 规范 API — GET/POST/DELETE `/api/v1/projects/:id/versions`',
      '✅ S2.4: 版本恢复二次确认弹窗 (useConfirmDialogStore)',
      '✅ S2.3: VersionHistoryPanel data-testid + CanvasPage 集成',
      '✅ S2.6: 清空版本历史按钮 (clearAllSnapshots)',
      '提交: b8edd59ea',
    ],
    commit: 'b8edd59ea',
  },
  {
    version: '1.0.348',
    date: '2026-05-06',
    changes: [
      '🚀 S26-E4: 移动端渐进适配 (P004)',
      '✅ S4.5: viewport meta (userScalable: false, maximumScale: 1)',
      '✅ S4.1: Canvas 响应式 CSS 断点 (<768px / 768-1024px)',
      '✅ S4.2: Canvas 移动端只读模式 (data-testid=mobile-read-only-banner)',
      '✅ S4.3: 移动端写保护提示 banner (data-testid=mobile-write-blocked)',
      '✅ Dashboard mobile 适配 (projectCard/bulkActionBar/sectionHeader)',
      '提交: d32eee41b',
    ],
    commit: 'd32eee41b',
  },
  {
    version: '1.0.348',
    date: '2026-05-06',
    changes: [
      '🚀 S26-E3: Dashboard 项目批量操作 (P003)',
      '✅ S3.1: 项目卡片 checkbox 多选 (data-testid=project-checkbox-{id})，stopPropagation 防止 Link 跳转',
      '✅ S3.5: 全选/取消全选 (data-testid=select-all-projects, indeterminate 状态)',
      '✅ S3.2: 固定底部批量操作栏 (data-testid=bulk-action-bar)，archive/delete/export 三个按钮',
      '✅ S3.4: 批量导出 JSON (vibex-projects-export-{timestamp}.json)',
      '✅ S3.3: 批量删除/归档二次确认，复用 openConfirm Dialog',
      '提交: 205bc8a19',
    ],
    commit: '205bc8a19',
  },
  {
    version: '1.0.346',
    date: '2026-05-05',
    changes: [
      '🚀 S25-E5: Teams × Canvas 共享权限',
      '✅ F5.1: canvas-share API (POST/GET/DELETE) + lib/api/canvas-share.ts',
      '✅ F5.2: /dashboard/teams 团队 Canvas 标签页 (data-testid ✅)',
      '✅ F5.3: useCanvasRBAC 扩展 teamId 维度 (owner/admin/member)',
      '✅ F5.4: share-to-team button (data-testid ✅) + ShareToTeamModal',
      '✅ F5.4: dashboard team-project-badge (蓝色徽章)',
      '提交: c5d6f5952 / 57da72128',
    ],
    commit: '57da72128',
  },
  {
    version: '1.0.345',
    date: '2026-05-04',
    changes: [
      '🚀 S25-E2: 跨 Canvas 项目版本对比',
      '✅ S2.1: /canvas-diff 路由 + data-testid="canvas-diff-page"',
      '✅ S2.1: 引导文案（首次进入 / 选A后）',
      '✅ S2.2: CanvasDiffSelector data-testid',
      '✅ S2.4: export-btn + diff-report-{nameA}-vs-{nameB}-{date}.json',
      '提交: 2abe36e9f',
    ],
    commit: '2abe36e9f',
  },
  {
    version: '1.0.344',
    date: '2026-05-04',
    changes: [
      '🚀 S25-E1: Onboarding + 需求模板库捆绑交付',
      '✅ S1.1: PreviewStep.tsx Step5 模板推荐卡片 (data-testid ✅)',
      '✅ S1.2: ChapterPanel auto-fill (autoFilledRef guard, 已有内容保护)',
      '✅ S1.3: ClarifyStep 场景化推荐 (SCENARIO_OPTIONS + filterByScenario)',
      '✅ S1.4: onboardingStore complete() → localStorage 完成标记',
      '提交: ceb6cbf73 / b360d8c9a / da6488937 / 60203c181',
    ],
    commit: '60203c181',
  },
  {
    version: '1.0.343',
    date: '2026-05-03',
    changes: [
      '🚀 S24-P005: Canvas 对比',
      '✅ T5.1: /canvas-diff 路由 + CanvasDiffSelector',
      '✅ T5.2: canvasDiff.ts 三树 diff 算法 (6 UT)',
      '✅ T5.3: CanvasDiffView 三色展示 + JSON 导出',
      '提交: e62f161fc',
    ],
    commit: 'e62f161fc',
  },
  {
    version: '1.0.342',
    date: '2026-05-03',
    changes: [
      '🚀 S24-P004: API Module Tests',
      '✅ T4.1-T4.3: API 测试 94 passed (auth 11 / project 20 / page 11 / canvas 12 / canvasApi 40)',
      '✅ T4.4/T4.5: CI Coverage Gate ≥60% + check-coverage.js',
      '提交: 56f424db2',
    ],
    commit: '56f424db2',
  },
  {
    version: '1.0.341',
    date: '2026-05-03',
    changes: [
      '🚀 S24-P002: TypeScript Debt Confirm',
      '✅ T2.1-T2.5: frontend/backend/mcp-server 三包 tsc --noEmit 0 errors',
      '✅ P002 无需纳入 Sprint 24 修复（coord 已决策）',
    ],
    commit: '4a297074a',
  },
  {
    version: '1.0.340',
    date: '2026-05-03',
    changes: [
      '🚀 S24-P001: E2E Slack Webhook Dry-run',
      '✅ T1.2: webhook-dryrun.ts — SLACK_WEBHOOK_URL 验证，exit 0/1',
      '✅ T1.3: package.json webhook:dryrun script',
      '提交: b9a00e199',
    ],
    commit: 'b9a00e199',
  },
  {
    version: '1.0.339',
    date: '2026-05-03',
    changes: [
      '🚀 S23-E5: Epic E5 Template Library',
      '✅ E5-U1: useTemplateManager — exportTemplate Blob/importTemplate JSON验证/getHistory/createSnapshot/deleteSnapshot',
      '✅ E5-U2: TemplateHistoryPanel — history-item data-testid，MAX 10 snapshots，restore/delete',
      '提交: 0a076d3c5',
    ],
    commit: '0a076d3c5',
  },
  {
    version: '1.0.338',
    date: '2026-05-03',
    changes: [
      '🚀 S23-E4: Epic E4 Export Formats',
      '✅ E4-U1: plantuml.ts — class/sequence/usecase diagram，pumlEscape() 防注入',
      '✅ E4-U2: json-schema.ts — JSON Schema draft-2020-12，try-catch 降级',
      '✅ E4-U3: svg.ts — 1200×800 canvas SVG，svgEscape() 防注入，fallback',
      '提交: 7539b2763',
    ],
    commit: '7539b2763',
  },
  {
    version: '1.0.337',
    date: '2026-05-03',
    changes: [
      '🚀 S23-E3: Epic E3 Firebase Cursor Sync',
      '✅ E3-U1: presence.ts — REST API PATCH 零 SDK，EventSource SSE + 2s polling fallback',
      '✅ E3-U2: RemoteCursor SVG arrow + username label，isMockMode guard',
      '✅ E3-U3: useCursorSync — 100ms debounce cursor write，moveCursor isMockMode fast path',
      '提交: 5430f7394',
    ],
    commit: '5430f7394',
  },
  {
    version: '1.0.336',
    date: '2026-05-03',
    changes: [
      '🚀 S23-E2: Epic E2 Design Review Diff 视图',
      '✅ E2-U1: ReviewReportPanel re-review-btn — ↻ Re-review 触发重新评审',
      '✅ E2-U2: useDesignReview diffResult state + previousReportId 支持',
      '✅ E2-U3: DiffView Added(红)/Removed(绿)/Unchanged 三区，data-testid 完整',
      '提交: 4da2805b6',
    ],
    commit: '4da2805b6',
  },
  {
    version: '1.0.335',
    date: '2026-05-03',
    changes: [
      '🚀 S23-E1: Epic E1 E2E CI 闭环落地',
      '✅ E1-U1: e2e-summary-to-slack.ts Block Kit payload — results.json 解析，postToSlack() error handling，main() exit 0',
      '✅ E1-U2: test.yml CI workflow — e2e job 后执行 e2e:summary:slack，if:always()，传递 webhook env',
      '提交: 276f1ba26',
    ],
    commit: '276f1ba26',
  },
  {
    version: '1.0.334',
    date: '2026-05-02',
    changes: [
      '🔧 S22-E3: Epic3-Teams-Collab-UI — 团队协作 UI',
      '✅ E3-S1: PresenceAvatars team border — showTeamBadge + teamMemberIds props，TEAM_COLORS 常量',
      '✅ E3-S2: useCanvasRBAC hook — canDelete/canShare/canEdit/canView，5min LRU 缓存',
      '✅ E3-S3: DDSToolbar RBAC buttons — 导出/导入按钮 disabled 逻辑',
      '提交: 0a64dca25',
    ],
    commit: '0a64dca25',
  },
  {
    version: '1.0.333',
    date: '2026-05-02',
    changes: [
      '📋 S22-E2: E2E 稳定性监控 — flaky-monitor 脚本 + CI 集成',
      '✅ E2-U1: e2e-flaky-monitor.ts — flaky rate 计算、运行历史追踪、Slack 告警（5% 阈值或连续 3 次失败触发）',
      '✅ E2-U2: .github/workflows/test.yml 添加 flaky-monitor step，if: always()',
      '✅ E2-U3: 逻辑修复 (1c6303fe1) — shouldAlert 连续失败检查、历史加载顺序、零结果早期退出',
      '提交: 714d2b42b (feat), 1c6303fe1 (fix)',
    ],
    commit: '714d2b42b, 1c6303fe1',
  },
  {
    version: '1.0.332',
    date: '2026-05-01',
    changes: [
      '🔧 E2-QA: Workbench /canvas /project 页面验证 + P006 API 输入校验 + Backend 降级测试',
      '✅ /workbench (flag=false) → HTTP 404 ✅',
      '✅ /canvas → 307→/auth（auth 保护正确）✅',
      '✅ POST /api/agent/sessions + empty/whitespace → 400 ✅',
      '✅ OpenClaw gateway /health → live ✅',
      '✅ dev+tester 独立验证 100% 一致 ✅',
    ],
    commit: '0e08dbe1e, a244138d8',
  },
  {
    version: '1.0.331',
    date: '2026-05-01',
    changes: [
      '🔧 P006-AI Agent 真实接入: OpenClawBridge spawnAgent (sessions_spawn) + 30s timeout + isRuntimeUnavailable',
      '✅ P006 Backend: /api/agent/sessions full CRUD (POST/GET/GET:id/GET:id/status/DELETE), 40 UT passed',
      '✅ P006 Frontend: CodingAgentService mock 全部移除，proxy 到 backend',
      '✅ P006 Test: sessions.test.ts 13 + OpenClawBridge.test.ts 15 + agent-sessions.test.ts 12',
    ],
    commit: 'a0929d868, 652a267b9, 59d44ade1',
  },
  {
    version: '1.0.330',
    date: '2026-05-01',
    changes: [
      '🔧 P003-Workbench 生产化: /workbench 路由 + NEXT_PUBLIC_WORKBENCH_ENABLED flag guard',
      '✅ P003-T1: WorkbenchUI + SessionList + TaskInput + CSS 模块',
      '✅ P003-T2: docs/feature-flags.md 文档',
      '✅ P003-T3: /api/agent/sessions GET/POST + agentSessionStore (50 sessions 上限)',
      '✅ P003-T4: workbench-journey.spec.ts 8 E2E passed (API 4 + UI 4)',
    ],
    commit: '3f2903613, abcd0b75e',
  },
  {
    version: '1.0.329',
    date: '2026-05-01',
    changes: [
      '🔧 P004-Canvas 虚拟化: @tanstack/react-virtual useVirtualizer 替换 .map() 渲染，estimateSize:120, overscan:3',
      '✅ P004-T3: DDSCanvasStore selectedCardSnapshot 跨虚拟边界选择状态',
      '✅ P004-T4: ChapterPanel.tsx 虚拟化实现 + parentRef scroll container',
      '✅ P004-T5: DDSCanvasStore.test.ts +131 lines selectedCardSnapshot 单元测试 (31 passed)',
      '✅ P004-T6: benchmark-canvas.ts 输出 P50/P95/P99 JSON 性能指标',
    ],
    commit: 'a5db58799, 9588265db, 9eac94c1d, 25cc0aaf0',
  },
  {
    version: '1.0.328',
    date: '2026-05-01',
    changes: [
      '🔧 P001-MCP-DoD 收尾: /health 集成到 stdio 启动序列（setupHealthEndpoint 返回 Promise，错误通过 reject 传递，不单独 process.exit）',
      '✅ P001-T1: main() 中 await setupHealthEndpoint(3100) 先于 stdio transport，/health 在主进程生命周期内',
      '✅ P001-T2: generate-tool-index.ts exit 0',
      '✅ P001-T3: INDEX.md 7 tools documented',
      '✅ P001-T4: mcp-server tsc --noEmit 0 errors, 12 unit tests passed',
    ],
    commit: '85e114400',
  },
  {
    version: '1.0.327',
    date: '2026-04-30',
    changes: [
      '🚀 S19-E19-1: Design Review MCP 集成 — API Route `/api/mcp/review_design` + 真实 API 调用 + 优雅降级 + E2E',
      '✅ E19-1-S1: POST /api/mcp/review_design 桥接层（design compliance / a11y / reuse 内联逻辑）',
      '✅ E19-1-S2: useDesignReview 移除 mock，改为真实 API 调用',
      '✅ E19-1-S2 测试: 9 UT (AS2.1–AS2.6) + ReviewReportPanel 10 UT 全部通过',
      '✅ E19-1-S3: ReviewReportPanel 四状态（loading/error/empty/success）',
      '✅ E19-1-S4: E2E 覆盖真实 API 路径和降级路径',
    ],
    commit: '2f493df6d, 434c8e99d',
  },
  {
    version: '1.0.327',
    date: '2026-05-02',
    changes: [
      '📋 vibex-proposals-20260501 Sprint21 Epic1-E2E-Staging-Isolation: CI 环境隔离',
      '✅ C1: BASE_URL 移除生产 fallback（`|| vibex.top`），严格使用 CI vars',
      '✅ C2: CI staging health check（3次重试 curl /api/health）',
      '✅ C3: BASE_URL 域名验证（检测 vibex.top → exit 1）',
      '✅ C4: e2e:db:reset 脚本（staging DB 清理，支持 --dry-run）',
      '✅ C5: e2e:summary:slack 脚本（Playwright 结果 → Slack webhook）',
    ],
    commit: '6e6dc7c0f',
  },
  {
    version: '1.0.326',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-QUALITY-2: DX 改进（类型文档 & Migration Guide）',
      '✅ QUALITY-2: docs/types/README.md — 类型系统文档 + E18-TSFIX-2 迁移指南',
    ],
    commit: '93b33afe3',
  },
  {
    version: '1.0.325',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-QUALITY-1: 测试覆盖率提升',
      '✅ QUALITY-1: @vibex/types guards 122 tests (84 vitest + 38 Node runner)',
    ],
    commit: '412827d85',
  },
  {
    version: '1.0.324',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-CORE-3: 三树面板空状态优化',
      '✅ CORE-3: BoundedContextTree/BusinessFlowTree/ComponentTree 空状态增强',
      '✅ BoundedContextTree/BusinessFlowTree 添加手动新增按钮',
    ],
    commit: '3f65313c6',
  },
  {
    version: '1.0.323',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-CORE-2: Canvas 骨架屏加载状态',
      '✅ CORE-2: CanvasPageSkeleton — 三列骨架屏对应 canvas 三面板布局',
      '✅ SkeletonLine/SkeletonBox 辅助组件',
    ],
    commit: '8af38ce53',
  },
  {
    version: '1.0.322',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-CORE-1: Sprint 1-17 Backlog 扫描与优先级排序',
      '✅ CORE-1: docs/backlog-sprint17.md — 6 个功能点 RICE 评分，Top 3: B5(81)/B1(54)/B2(54)',
    ],
    commit: '9b4b0ea33',
  },
  {
    version: '1.0.321',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-TSFIX-3: @vibex/types 类型基础设施',
      '✅ TSFIX-3: @vibex/types 新增 19 个 type predicate guards — pnpm run build → 0 errors ✅',
      '✅ guards.ts: CardTree/BoundedContext/Dedup/TeamTask/Events 类型守卫',
    ],
    commit: 'd6332dd3f',
  },
  {
    version: '1.0.320',
    date: '2026-04-30',
    changes: [
      '📋 vibex-proposals-20260430 Sprint18 S18-E18-TSFIX-2: vibex-fronted TypeScript 严格模式修复',
      '✅ TSFIX-2: 351 TS errors resolved (batch1 155 + batch2 196) — tsc --noEmit → 0 errors ✅',
      '✅ unwrapField/unwrapData: 返回值添加 ! 非空断言 (91 files)',
      '✅ css-modules.d.ts: 增强 named properties 类型定义',
      '✅ noUncheckedIndexedAccess: array index guards (??, !, ?.)',
      '✅ canvas/lib: BoundedContextTree/BusinessFlowTree/mermaid-parser null guards',
    ],
    commit: '18bda9f69',
  },
  {
    version: '1.0.319',
    date: '2026-04-29',
    changes: [
      '📋 vibex-proposals-20260428 Sprint17 S17-E3: Epic 3 Technical Deepening',
      '✅ E3-U1: tsconfig.json — noUncheckedIndexedAccess: true (array index returns T | undefined)',
      '✅ E3-U3: confirmationStore null guards — 3 guards for history[] access (goBack/goForward/jumpToSnapshot)',
      '✅ E3-U4: analytics-dashboard.spec.ts — 7 E2E tests (AD-01~AD-05 + range toggle + CSV export)',
      '⚠️ E3-U2/U3 defer: TypeScript type fixes (342 errors) → Sprint 18',
    ],
    commit: 'bd1fb2051',
  },
  {
    version: '1.0.318',
    date: '2026-04-29',
    changes: [
      '📋 vibex-proposals-20260428 Sprint17 S17-E2: Epic 2 E2-U1~U3 Integration Deepening',
      '✅ E2-U1: benchmark/firebase-benchmark.ts — 5 iterations, 500ms threshold, FirebaseMock cold start 0.02ms',
      '✅ E2-U2: firebase-presence.spec.ts +4 tests (S17-P1-2) — 5-user concurrent <3s, avatar count check',
      '✅ E2-U3: PresenceAvatars returns null when !isAvailable — WiFi-off hidden, four states (ideal/empty/loading/error)',
    ],
    commit: 'e8ec84fe0',
  },
  {
    version: '1.0.317',
    date: '2026-04-29',
    changes: [
      '📋 vibex-proposals-20260428 Sprint17 S17-E1: Epic 1 E1-U1~U4 Verification',
      '✅ E1-U1: code-generator-e2e.spec.ts (6 E2E tests for CodeGenPanel)',
      '✅ E1-U2: design-review.spec.ts +3 tests (CodeGenPanel production path)',
      '✅ E1-U3: mcp-server/src/routes/health.ts — Node.js HTTP /health on port 3100',
      '✅ E1-U4: scripts/generate-tool-index.ts — generates docs/mcp-tools/INDEX.md (7 tools)',
    ],
    commit: '8f817a5c0',
  },
  {
    version: '1.0.316',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260428 Sprint16 S16-P2-2: MCP Tool Governance & Documentation',
      '✅ P2-2-review_design.md (222L): Overview/Input/Output/Error/Examples/CLI',
      '✅ P2-2-figma_import.md (175L): fileKey/nodeIds params, token extraction',
      '✅ P2-2-generate_code.md (176L): 3 modes (flowstep/apientrypoint/statemachine)',
      '✅ P2-2-MCP_TOOL_GOVERNANCE.md (134L): naming conv, versioning, deprecation',
      '✅ P2-2-ERROR_HANDLING_POLICY.md (243L): error codes E100-E108, retry strategy',
      '⚠️ P2-2-DoD gaps: INDEX.md + generate-tool-index.ts script + GET /health 未实现',
    ],
    commit: '9e09edfea',
  },
  {
    version: '1.0.315',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260428 Sprint16 S16-P2-1: Canvas Version History Production',
      '✅ P2-1-useVersionHistory: 30s debounce auto-snapshot, max 50 snapshots, restore with backup',
      '✅ P2-1-VersionHistoryPanel: Manual/Auto sections, restore confirmation, projectId=null guide UI',
      '✅ P2-1-Tests: 8 unit tests (useVersionHistory) + 7 E2E tests (version-history-e2e.spec.ts)',
    ],
    commit: 'b9c63cc4a',
  },
  {
    version: '1.0.314',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260428 Sprint16 S16-P1-2: Code Generator Real Component Generation',
      '✅ P1-2-FlowStepCard: Real props (stepName/actor/pre/post), cyberpunk styling',
      '✅ P1-2-APIEndpointCard: Real props (method/path/summary), METHOD_COLORS map',
      '✅ P1-2-StateMachineCard: Real props (states/transitions/initialState), "+N more" truncation',
      '✅ P1-2-codegen types: FlowStepProps/APIEndpointProps/StateMachineProps/ComponentSpec',
      '✅ P1-2-Tests: 7 unit tests (codeGenerator.test.ts)',
    ],
    commit: '5afccdc7f',
  },
  {
    version: '1.0.313',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260428 Sprint16 S16-P1-1: Firebase Mock + Config Path',
      '✅ P1-1-FirebaseMock: 4 states (CONNECTED/DEGRADED/DISCONNECTED/RECONNECTING), exponential backoff',
      '✅ P1-1-useFirebase: cold start < 500ms fallback, connect/disconnect/reconnect',
      '✅ P1-1-ConflictBubble: 4-state banner, auto-dismiss 2s, a11y (aria-live)',
      '✅ P1-1-Tests: 4 unit tests (useFirebase) + 5 E2E tests (firebase-presence.spec.ts)',
    ],
    commit: '712d23854',
  },
  {
    version: '1.0.312',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260428 Sprint16 S16-P0-2: Design-to-Code Bidirectional Sync',
      '✅ P0-2-ConflictResolutionDialog: 3-panel diff (Design/Token/Code), Accept Design/Code/Token/Merge All',
      '✅ P0-2-driftDetector: detectDrift() with 3 scenarios (A/B/C), false positive rate calculation',
      '✅ P0-2-batchExporter: batchExport() 50 concurrent, progress callback, export50Components()',
      '✅ P0-2-Tests: 14 unit tests (8 drift + 6 batch) + 6 E2E tests (design-to-code-e2e.spec.ts)',
    ],
    commit: '8ea6fbee1',
  },
  {
    version: '1.0.311',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260428 Sprint16 S16-P0-1: Design Review UI Integration',
      '✅ P0-1-DDSToolbar: Design Review button (data-testid="design-review-btn")',
      '✅ P0-1-useDesignReview: Mock review_design MCP call, 3 compliance + 3 a11y issues + 3 reuse recs',
      '✅ P0-1-ReviewReportPanel: Glassmorphism overlay, 3 tabs (Compliance/Accessibility/Reuse), severity badges',
      '✅ P0-1-Keyboard: Ctrl+Shift+R / Cmd+Shift+R triggers design review',
      '✅ P0-1-Tests: 8 unit tests (ReviewReportPanel) + 7 E2E tests (design-review.spec.ts)',
    ],
    commit: '1e56cac17',
  },
  {
    version: '1.0.310',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260427 S15-E15-P006: Tech Debt Cleanup',
      '✅ P006 ESLint: 197 → 28 errors (partial)',
      '✅ P006 init.ts: replaced dynamic require with top-level import',
    ],
    commit: '3279e7f35',
  },
  {
    version: '1.0.309',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260427 S15-E15-P005: MCP Server Integration',
      '✅ P005-U1 MCP Server: tools (createProject/getProject/listComponents/generateCode/heartbeat), ListTools handler',
      '✅ P005-U2 Claude Desktop Config: mcp-claude-desktop-setup.md',
      '✅ P005-U3 Backend APIs: /api/delivery/snapshots, /api/delivery/versions',
      '✅ P005 Integration: snapshotStore + confirmationStore tests, tester report verified',
    ],
    commit: '235449050, 9e8ddc1bc',
  },
  {
    version: '1.0.308',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260427 S15-E15-P004: Version Compare UI',
      '✅ P004-U1 SnapshotSelector: /version-history page, localStorage snapshots',
      '✅ P004-U2 VersionPreview.tsx: full-viewport diff overlay, line-by-line JSON comparison',
      '✅ P004-U3 confirmationStore: addCustomSnapshot for backup (max 20)',
      '✅ P004 Tests: version-history/page.test.tsx 5 tests, confirmationStore.test.ts 8 tests',
    ],
    commit: 'f387a26dd, c7a1e8f32',
  },
  {
    version: '1.0.307',
    date: '2026-04-28',
    changes: [
      '📋 vibex-proposals-20260427 S15-E15-P003: BPMN Export',
      '✅ P003-U1 Dynamic Import: bpmn-js/bpmn-moddle (no SSR bundle)',
      '✅ P003-U2 exportFlowToBpmn(): maps BusinessFlow to BPMN 2.0 XML',
      '✅ P003-U3 FlowTab Integration: real .bpmn file download',
      '✅ P003-U4 Unit Tests: 11 tests (Modeler + 4 XML types + escapeXml + xmlToBlob)',
    ],
    commit: 'c8acde7b8, 52b3bf64b',
  },
  {
    version: '1.0.306',
    date: '2026-04-27',
    changes: [
      '📋 vibex-proposals-20260427 S14-E2: Canvas Import/Export',
      '✅ E2-U1 JSON Canvas Format: CanvasDocument schema (v1.2.0, metadata, chapters, crossChapterEdges)',
      '✅ E2-U2 File Import UI: useCanvasImport (validateFile, importFile, showFilePicker, 10MB limit)',
      '✅ E2-U3 File Export UI: useCanvasExport (exportAsJSON .json + exportAsVibex .vibex gzip)',
      '✅ E2-U4 Import History: ImportHistoryService (localStorage, 50-entry cap, getImportLog, clearImportLog)',
      '✅ E2 E2E tests: canvas-import-export.spec.ts (3 tests), ImportHistoryService 6 tests, useCanvasExportE2 4 tests',
    ],
    commit: '87fb0d285, fa9dd4da0',
  },
  {
    version: '1.0.305',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426 E4: Firebase 实时协作',
      '✅ E4-S1 配置检查: isFirebaseConfigured() 检测Firebase环境',
      '✅ E4-S2 PresenceAvatars集成: DDSCanvasPage底部右侧,四态(在线/空/加载/错误)',
      '✅ E4-S3 鼠标位置跟踪: mousemove→throttle(100ms)→updateCursor广播',
    ],
    commit: '597bd49bf, a06db153b',
  },
  {
    version: '1.0.304',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426 E3: 画布搜索',
      '✅ E3-S1 搜索面板UI: DDSSearchPanel深色主题,键盘导航,data-testid',
      '✅ E3-S2 全文搜索: useDDSCanvasSearch 300ms debounce,5 chapter覆盖',
      '✅ E3-S3 搜索跳转: scrollIntoView+smooth+highlight动画',
      '✅ E3-S4 Ctrl+K: DDSCanvasPage集成,onOpenSearch no-op修复',
    ],
    commit: '9bc9330c1, d48ad4f09',
  },
  {
    version: '1.0.303',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426 E2: 画布快捷键系统',
      '✅ E2-S1 键盘监听: useKeyboardShortcuts集成DDSCanvasPage',
      '✅ E2-S2 ShortcutEditModal: shortcutStore.startEditing唤起,Portal条件渲染',
      '✅ E2-S3 快捷键绑定: Delete→deleteCard, Ctrl+Z/Y→placeholder, Esc→deselectAll',
      '✅ E2-S4 E2E测试: F4.5 ?打开modal, F4.6 Delete, F4.7 Escape',
    ],
    commit: '9a4403419, 044611019',
  },
  {
    version: '1.0.302',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426 E1: 后端TS债务清理（Sprint 11）',
      '✅ E1-S1 wrangler types: 生成与env.ts类型整合, 零TS错误',
      '✅ E1-S2 ZodSchema泛型: ZodType<unknown>用于API参数泛型, 合理且通过tsc',
      '✅ E1-S3 DurableObject绑定: 67处as any在test/schema场景, env.ts提供完整类型兜底',
      '✅ E1-S4 CI typecheck-backend gate: test.yml第49行, working-directory: vibex-backend',
    ],
    commit: 'e41f1ff2a',
  },
  {
    version: '1.0.301',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260425 E4: PRD 双格式预览',
      '✅ E4-S1 格式转换库: yamlToJson/jsonToYaml 双向转换, 友好错误提示',
    ],
    commit: '557fda78',
  },
  {
    version: '1.0.304',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426-sprint12 E10: 设计稿代码生成',
      '✅ E10-S1 codeGenerator: generateComponentCode(flow,framework), sanitizeName, packageAsZip',
      '✅ E10-S1 类型定义: CanvasNode/CanvasFlow/Chapter, flow-specific types, CanvasNodeType枚举',
      '✅ E10-S2 CodeGenPanel: framework selector, generate button, code preview tabs, download ZIP',
      '✅ E10-S2 CSS Module: CSS变量(--color-*/--spacing-*/--radius-*), 响应式, WCAG AA',
      '✅ E10 测试: 25 tests (types/TSX/CSS/index/node limit/ZIP) ✅',
      '✅ E10 修复: CodeGenPanel tabs类型注解 TS null check',
    ],
    commit: 'ea8c6e79f',
  },
  {
    version: '1.0.303',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426-sprint12 E9: AI 设计评审',
      '✅ E9-S1 review_design MCP: 工具注册+execute case, DesignReviewReport(compliance/a11y/reuse)',
      '✅ E9-S2 Design Compliance: 硬编码hex/rgba/字体检测, 4px grid间距校验, extractStrings递归',
      '✅ E9-S3 A11y Checker: WCAG 2.1 AA - missing-alt(critical)/aria-label/contrast/keyboard-hint',
      '✅ E9-S3 Component Reuse: 结构相似度fingerprint, similarityScore>0.7提取候选',
      '✅ E9 测试: 40 tests (designCompliance11 + a11yChecker12 + componentReuse10) ✅',
    ],
    commit: '9519d0602',
  },
  {
    version: '1.0.303',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426-sprint12 E8: Canvas 协作冲突解决',
      '✅ E8-S1 conflictStore: LWW仲裁 startDraft/clearDraft/checkConflict, resolveKeepLocal/resolveUseRemote',
      '✅ E8-S1 Firebase RTDB锁: lockCard/unlockCard/syncLocks, 60s timeout, graceful fallback',
      '✅ E8-S2 ConflictDialog: 三选项UI(WCAG 2.1 AA), focus trap, keyboard nav, data-testid',
      '✅ E8-S2 ConflictBubble: 订阅activeConflict, toDialogProps格式转换, merge占位',
      '✅ E8-S3 collaborationSync: handleRemoteNodeSync调用checkConflict先于merge, 动态import',
      '✅ E8 测试: conflictStore.test.ts 12✅, ConflictDialog.test.tsx 28✅, E2E 426行',
    ],
    commit: 'ae5f566e1',
  },
  {
    version: '1.0.302',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426-sprint12 E6: Prompts 安全 AST 扫描',
      '✅ E6-S1 接口对齐: SecurityReport → SecurityAnalysisResult, UnsafePattern 含 type/line/column',
      '✅ E6-S2 轻量级Walker: 移除 @babel/traverse Path开销, walkNode()递归, ~299ms/5000行',
      '✅ E6-S3 innerHTML检测: MemberExpression visitor 检测 innerHTML/outerHTML 赋值',
      '✅ E6-S4 集成: code-review.ts + code-generation.ts 已迁移到 generateSecurityWarnings()',
      '✅ E6-S5 测试覆盖: 21 tests (TC01-TC06 + perf + edge cases), 1000合法样本',
      '📋 vibex-proposals-20260426-sprint12 E7: MCP 可观测性',
      '✅ E7-S1 动态版本: readFileSync + import.meta.url 读取 package.json.version',
      '✅ E7-S1 HealthCheck: performHealthCheck(options.serverVersion), connectedClients=1(stdio)',
      '✅ E7-S2 结构化日志: logger.logToolCall(tool/duration/success), 启动时记录version+sdk',
      '✅ E7-S2 敏感脱敏: sanitize()递归过滤8种key, 支持嵌套对象',
    ],
    commit: '4bf59939e',
  },
  {
    version: '1.0.301',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260426 E4: Firebase 实时协作',
      '✅ E4-S1 配置检查: isFirebaseConfigured() 检查 env vars',
      '✅ E4-S2 usePresence RTDB写入: updateCursor 节流 100ms',
      '✅ E4-S3 PresenceAvatars: fixed bottom-right zIndex 9999',
      '✅ E4-S4 DDSCanvasPage集成: mouseMove cursorPos 追踪',
    ],
    commit: 'a06db153b',
  },
  {
    version: '1.0.300',
    date: '2026-04-26',
    changes: [
      '📋 vibex-proposals-20260425 E6: Canvas 本地持久化',
      '✅ E6-S1 Zustand Persist: partialize白名单projectId/chapters/crossChapterEdges, 排除UI状态',
      '✅ E6-S2 useCanvasPersistence: 暴露canvas/setCanvas/clearCanvas Hook',
    ],
    commit: 'a41b1bdc',
  },
  {
    version: '1.0.299',
    date: '2026-04-25',
    changes: [
      '📋 vibex-proposals-20260425 E3: Firebase 实时协作',
      '✅ E3-S2 RemoteCursor: SVG光标+用户名标签, 集成PresenceLayer, usePresence提供实时位置',
      '✅ E3-S3 ConflictBubble增强: .node-id/.conflict-hint, 接受按钮点击后气泡消失',
    ],
    commit: '0b271cfdb',
  },
  {
    version: '1.0.298',
    date: '2026-04-25',
    changes: [
      '📋 vibex-proposals-20260425 E0: Sprint 9 债务清理',
      '✅ E0-U1 js-yaml: useCanvasExport.ts + yaml-importer.ts TS2307, pnpm install 解决',
      '✅ E0-U2 useSearchParams/Suspense: 提取 VersionHistoryContent, 包裹 Suspense boundary, 修复 prerender crash',
    ],
    commit: 'abc28cfc',
  },
  {
    version: '1.0.297',
    date: '2026-04-24',
    changes: [
      '📋 vibex-sprint7-fix EpicE1: CI TypeScript Gate',
      '✅ E1-U1 TypeScript Gate: typecheck-backend+typecheck-frontend独立job',
      '✅ E1-U2 as any Baseline: 基线163, pre-existing存量',
    ],
    commit: '6b4e432c',
  },
  {
    version: '1.0.296',
    date: '2026-04-24',
    changes: [
      '📋 vibex-sprint7-fix EpicE5: Batch Export Real DB + KV',
      '✅ E5-U1 ZipArchiveService: D1查询+JSZip生成Uint8Array',
      '✅ E5-U2 KV存储: POST返回download URL, 5min TTL',
      '✅ E5-U3 一次性下载: GET从KV读取→解码→delete→返回ZIP',
      '✅ E5-U4 ENV配置: EXPORT_KV binding',
    ],
    commit: '76fc9719',
  },
  {
    version: '1.0.295',
    date: '2026-04-24',
    changes: [
      '📋 vibex-sprint7-fix EpicE2: Firebase Presence 真实接入',
      '✅ E2-U1 Firebase REST API: 零SDK依赖, fetch+EventSource实时同步, polling fallback',
      '✅ E2-U2 PresenceAvatars四态: 理想态/空状态/加载态/错误态',
      '✅ E2-U3 visibilitychange兜底: hidden时removePresence',
      '✅ E2-U4 usePresence真实接入: setPresence/subscribeToOthers',
    ],
    commit: '3c092e14',
  },
  {
    version: '1.0.294',
    date: '2026-04-22',
    changes: [
      '📋 vibex-pm-proposals E8-U1: Import/Export API',
      '✅ JSON+YAML parsers: json-importer/yaml-importer + json-exporter/yaml-exporter',
      '✅ Backend: POST /v1/projects/import (5MB limit, SSRF protection), GET /v1/projects/export (JSON/YAML)',
      '✅ import-export.test.ts: 12 tests PASS',
    ],
    commit: '80d2801e',
  },
  {
    version: '1.0.293',
    date: '2026-04-22',
    changes: [
      '📋 vibex-pm-proposals E7-U1: 版本历史 projectId=null 边界处理',
      '✅ projectId=null → 显示引导 UI（"请先选择项目" + /projects/new 链接）',
      '✅ useSearchParams() 读取 projectId，CSS .emptyAction 蓝色按钮样式',
      '✅ page.test.tsx: 2 tests PASS',
    ],
    commit: 'feb5dff1',
  },
  {
    version: '1.0.292',
    date: '2026-04-22',
    changes: [
      '📋 vibex-pm-proposals E6-U1: Teams API',
      '✅ D1 migration: Team + TeamMember + TeamInvite 表，role 分层 (owner/admin/member)',
      '✅ Backend: GET/POST /v1/teams, GET/PUT/DELETE /v1/teams/:id, CRUD members, permissions',
      '✅ Frontend: teams.ts client + team.ts types',
      '✅ TeamService.test.ts: 9 unit tests PASS',
    ],
    commit: '276d56ad + 96422922',
  },
  {
    version: '1.0.291',
    date: '2026-04-22',
    changes: [
      '📋 vibex-pm-proposals E5-U1: 统一 API 错误格式',
      '✅ 61 个后端路由全部迁移到 apiError() — 统一 { error, code, status, details } 格式',
      '✅ 修复 8 处漏网之鱼 (chat/component-manager/ai-ui-generation)',
      '✅ api-error-integration.test.ts: 26 tests, 后端 2 suites PASS',
    ],
    commit: '13e4f079 + 0c06941a',
  },
  {
    version: '1.0.290',
    date: '2026-04-22',
    changes: [
      '📋 vibex-pm-proposals E4-U1: TabBar Phase 对齐',
      '✅ PHASE_TABS 映射: input 仅 context, context/flow 仅 context+flow, component/prototype 显示全部',
      '✅ 双向同步: TabBar 点击 → setPhase(phase)，与 PhaseNavigator 对称',
      '✅ TabBarSymmetry.test.tsx: 13 tests, 26 total TabBar tests PASS',
    ],
    commit: '6c319f5e',
  },
  {
    version: '1.0.260',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint5-delivery-integration E1: 数据层集成',
      '✅ T1 loadFromStores: 从 prototypeStore + DDSCanvasStore 拉取数据',
      '✅ T2 数据转换: toComponent/toSchema/toDDL 函数实现',
      '✅ deliveryStore 测试: 12 个用例',
    ],
    commit: 'a57b23f1 + 2d540bca',
  },
  {
    version: '1.0.266',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint5-delivery-integration E2: 跨画布导航',
      '✅ T4 DeliveryNav: 3-canvas nav tabs (原型画布/详设画布/交付中心)',
      '✅ T5 CanvasBreadcrumb: 面包屑导航组件',
      '✅ 测试: DeliveryNav 7 + CanvasBreadcrumb 4 = 11 passing (QA扩自3)',
    ],
    commit: '75bf4ec3 + e213ccc5 (QA)',
  },
  {
    version: '1.0.268',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint5-delivery-integration E3: DDL 生成',
      '✅ T6 DDLGenerator: generateDDL() API → DDLTable[]',
      '✅ T7 formatDDL: formatDDL() + downloadDDL() SQL formatting',
      '✅ 测试: DDLGenerator 3 + formatDDL 5 = 8 passing',
      '✅ E3-U1 扩测: DDLGenerator 10→16 tests (custom prefix/v2 stripping/pluralization/VARCHAR/TINYINT)',
    ],
    commit: '6ee00b62 + 31275654',
  },
  {
    version: '1.0.277',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint5-delivery-integration E4: PRD 融合',
      '✅ E4-U1 PRDGenerator: generatePRD() + generatePRDMarkdown() 动态生成',
      '✅ E4-U2 PRDTab: 移除硬编码，动态展示 contexts/flows/components 数量',
      '✅ E4-U3 exportItem: /api/delivery/export POST API 实现',
      '✅ 测试: delivery/__tests__ 27 passing',
    ],
    commit: '339d2da9',
  },
  {
    version: '1.0.279',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint5-delivery-integration E5: PRDTab 空状态组件',
      '✅ E5-U1 空状态引导: "请先在 DDS 画布中创建限界上下文..."',
      '✅ E5-U1 样式: delivery.module.css .emptyStateText',
      '✅ 测试: delivery/__tests__ 34 passing',
    ],
    commit: '03df8e2c',
  },
  {
    version: '1.0.282',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint5-delivery-integration-qa E6: 缺陷归档 + E7: 最终报告',
      '✅ E6: BLOCKER×4 + P1×1 + P2×2 + P0×5 = 12 defects归档，7必需字段 ✅',
      '✅ E7: qa-final-report.md — E1~E7 全部 PASS，DoD 全部通过 ✅',
    ],
    commit: '8400ef2d',
  },
  {
    version: '1.0.261',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint3-prototype-extend E2-QA: 节点属性更新测试',
      '✅ E2-QA prototypeStore: updateNodeNavigation 4 个用例 (E2-U1)',
      '✅ E2-QA prototypeStore: updateNodeBreakpoints 4 个用例 (E2-U2)',
      '✅ E2-QA prototypeStore: navigation + breakpoints 组合 1 个用例 (E2-U3)',
      '✅ prototypeStore 测试: 9 个新用例，36 total',
    ],
    commit: 'd48fc901',
  },
  {
    version: '1.0.263',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint3-prototype-extend E3-QA: 节点断点自动标注测试',
      '✅ E3-QA addNode: breakpoint=375 → mobile, breakpoint=768 → tablet, breakpoint=1024 → desktop',
    ],
    commit: 'd48fc901',
  },
  {
    version: '1.0.265',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint3-prototype-extend E4-QA: 图片导入测试',
      '✅ E4-QA image-import: 5 个用例 (success/empty/non-JSON/file-size/timeout)',
      '✅ E4-QA image-ai-import: 6 个用例 (AC1/AC2/AC3)',
    ],
    commit: 'd48fc901',
  },
  {
    version: '1.0.262',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend E3: 跨章节集成',
      '✅ E3-U1 DDSToolbar: 5 章节按钮，点击切换 activeChapter',
      '✅ E3-U1 DDSCanvasPage: ?chapter= URL 参数支持',
      '✅ E3-U2 CrossChapterEdgesOverlay: 5-chapter 支持',
      '✅ 测试: ChapterPanel 24/24, CrossChapterEdgesOverlay 5/5, DDSToolbar 15/15',
    ],
    commit: 'f3271119 + 92f1e00d',
  },
  {
    version: '1.0.264',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend E4: 导出功能',
      '✅ E4-U1 APICanvasExporter: exportDDSCanvasData() → OpenAPI 3.0.3 JSON',
      '✅ E4-U2 SMExporter: exportToStateMachine() → StateMachine JSON',
      '✅ E4-U3/U4 Export Modal: DDSToolbar OpenAPI + StateMachine download',
      '✅ E4-U5 Tests: exporter.test.ts — 16 passing tests',
      '✅ E4 spec-alignment tests: spec-alignment.test.ts — 5 passing tests',
    ],
    commit: '9a3e239d',
  },
  {
    version: '1.0.267',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend E5: 章节四态规范',
      '✅ E5-U1 CardErrorBoundary: 捕获卡片渲染异常',
      '✅ E5-U2 章节四态: 骨架屏/加载中/空状态/错误态',
      '✅ 测试: DDSFourStates.test.tsx — 5 passing',
    ],
    commit: '9d1bd809',
  },
  {
    version: '1.0.275',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend E5-QA: 章节存在性测试',
      '✅ chapter-existence.test.ts: 3 个测试用例',
    ],
    commit: '5ee0081e',
  },
  {
    version: '1.0.276',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend tester-gstack: G1-G5 UI 验证',
      '✅ G1: DDSToolbar 5 chapters ✅ | G2/G3: P0-006 ChapterEmptyState ❌ (待修复)',
      '✅ G4/G5: Export Modal + method badge ✅',
    ],
    commit: '7d2fc9be',
  },
  {
    version: '1.0.278',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend reviewer-E4-defects: E4 缺陷归档 QA',
      '✅ E4-U1 缺陷归档: P0×6 + P1×1 + P2×2 = 9 defects，全部含7必需字段',
      '✅ E4-U2 格式审查: 严重性/Epic/Spec引用/问题描述/代码证据/修复建议/影响范围',
    ],
    commit: 'adc7e7a0',
  },
  {
    version: '1.0.281',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend E5: QA 最终报告',
      '✅ E5-U1 qa-final-report.md: E1~E4 全部 PASS，DoD 全部通过',
    ],
    commit: '7ba2f35b',
  },
  {
    version: '1.0.271',
    date: '2026-04-18',
    changes: [
      '🐛 vibex-sprint4-spec-canvas-extend P0: 硬编码颜色修复',
      '✅ CSS tokens: APIEndpointCard/StateMachineCard 移除硬编码颜色',
      '✅ exporter.ts: 修复导出类型定义',
    ],
    commit: '83d40fae',
  },
  {
    version: '1.0.272',
    date: '2026-04-18',
    changes: [
      '🐛 vibex-sprint4-spec-canvas-extend E3-E5 P1/P2: exporter 语法修复',
      '✅ exporter.ts: 修复 toStateMachineSpec 缺少的大括号语法错误',
      '✅ exporter.ts: 变量作用域修复 (allStates → states)',
      '✅ exporter.test.ts: 扩展至 17 测试',
    ],
    commit: '7debf56e',
  },
  {
    version: '1.0.259',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint6-ai-coding-integration E1: 设计稿导入',
      '✅ E1-U1 /api/figma route: GET/POST Figma REST API proxy',
      '✅ E1-U1 Image AI import: importFromImage(file) — AI vision 分析图片，base64 → GPT-4o vision',
      '✅ E1-U1 /api/chat route: AI chat completions 端点，支持 vision image_url',
      '✅ 单元测试: image-ai-import.test.ts — 6 个用例 (AC1/AC2/AC3)',
    ],
    commit: 'e6dd07a5',
  },
  {
    version: '1.0.273',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint6-ai-coding-integration E1-QA: 设计稿元数据 Store',
      '✅ designStore: 重构 343 行，新增 designs[] + CRUD，localStorage 持久化',
      '✅ /api/designs: GET/POST/DELETE endpoints — 设计稿元数据 CRUD',
      '✅ 测试: designStore.test.ts — 6 个用例',
    ],
    commit: 'a12689e7 + 347d5cda',
  },
  {
    version: '1.0.269',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint6-ai-coding-integration E2: AI Coding Agent',
      '✅ U4 AgentFeedbackPanel: AI 反馈面板，session list + message history + retry',
      '✅ U5 AgentSessions: 会话列表，支持新建/删除/切换',
      '✅ agentStore: sessions/activeSession/currentMessage/retryCount 状态管理',
      '✅ E2-U1 mock stub 确认: CodingAgentService mockAgentCall() 已确认，TODO 待替换',
    ],
    commit: '0d36227d + a1f09907',
  },
  {
    version: '1.0.270',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint6-ai-coding-integration E3: 版本 Diff',
      '✅ U6 VersionDiff: diffVersions() 结构化 diff (added/removed/modified/changed)',
      '✅ U7 集成: app/canvas/delivery/version/page.tsx — VersionDiff 页面',
      '✅ 测试: VersionDiff.test.ts — 11 passing',
      '✅ E3-U1/U2 QA确认: VersionDiff ✅, /canvas/delivery/version 路由缺失 BLOCKER 已归档',
    ],
    commit: '90a90155 + 8f97bd90',
  },
  {
    version: '1.0.280',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint6-ai-coding-integration E6: 缺陷归档',
      '✅ E6-U1 缺陷归档确认: BLOCKER×2 + P0×2 + P1×1 + P2×3 = 8 defects',
    ],
    commit: '8c0a8823',
  },
  {
    version: '1.0.258',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint3-prototype-extend E1-QA: 页面跳转连线测试',
      '✅ E1-QA EdgeCreationModal 组件: modal 对话框，源/目标页面下拉选择，同页校验',
      '✅ E1-QA EdgeCreationModal 测试: 8 个单元测试用例（render/cancel/validation）',
      '✅ E1-QA FlowTreePanel 集成: +连线按钮注入 CanvasPage 工具栏',
    ],
    commit: 'd48fc901',
  },
  {
    version: '1.0.257',
    date: '2026-04-18',
    changes: [
      '📋 vibex-sprint4-spec-canvas-extend E1: API 规格章节',
      '✅ E1-U1 类型定义: types/dds/api-endpoint.ts — APIEndpointCard 接口 (HTTPMethod/APIParameter/APIResponse)',
      '✅ E1-U2 组件: APIEndpointCard — method badge 颜色映射 + path monospace + summary + tags + status codes',
      '✅ E1-U3 CardRenderer 注册: case api-endpoint 分发 + UnknownCardFallback 兜底',
      '✅ E1-U4 DDSCanvasStore: initialChapters 新增 api，chapter CRUD actions',
      '✅ E1-U5 持久化: ddsPersistence exportToJSON/quickSave/saveSnapshot 全部包含 api chapter',
      '✅ Canvas 布局: 4-chapter (requirement/context/flow/api) 完整落地',
      '✅ 单元测试: APIEndpointCard.test.tsx — 11 个测试用例',
    ],
    commit: '581b5ad7',
  },
  {
    version: '1.0.256',
    date: '2026-04-17',
    changes: [
      '📋 vibex-sprint2-spec-canvas Epic5: 状态与错误处理',
      '✅ E5-U1 骨架屏: ChapterPanel.tsx — loading时显示 shimmer skeleton cards (3张卡片, shimmer动画)',
      '✅ E5-U2 空状态引导: ChapterPanel.tsx — 无卡片时显示空状态插图 + 引导文字',
      '✅ E5-U3 错误态重试: ChapterPanel.tsx — error message + loadChapter 重试按钮, error优先于loading/empty',
    ],
    commit: '676c1be9',
  },
  {
    version: '1.0.254',
    date: '2026-04-17',
    changes: [
      '📋 vibex-sprint2-spec-canvas Epic4: 章节间 DAG 关系',
      '✅ E4-U1 跨章节边创建: addCrossChapterEdge/deleteCrossChapterEdge, crossChapterEdges state',
      '✅ E4-U2 跨章节边渲染: CrossChapterEdgesOverlay SVG (ResizeObserver + RAF 双层监听)',
      '✅ E4-U2 虚线样式: strokeDasharray="6 4" + arrow marker, crypto.randomUUID() 边ID',
      '✅ E4-U1 handleConnect: 自动识别跨章节连接, 双轨设计 (overlay SVG vs React Flow edges)',
      '✅ E4-U2 cardAbsoluteCenter: PANEL_HEADER_HEIGHT + card.position 坐标系转换',
    ],
    commit: '2b3d69f4',
  },
  {
    version: '1.0.255',
    date: '2026-04-17',
    changes: [
      '📋 vibex-sprint3-prototype-extend E1: 页面跳转连线',
      '✅ E1-U1 prototypeStore edges: addEdge/removeEdge (smoothstep + animated)',
      '✅ E1-U2 RoutingDrawer 连线 UI: 添加按钮 + 源/目标选择器 + 连线列表',
      '✅ E1-U3 ProtoFlowCanvas 连线渲染: onConnect 启用 + Delete 键删除',
      '✅ E1 测试: 7 个新用例覆盖 CRUD + 幂等性 + edges/nodes 独立性',
      '⚠️ Note: 代码在 2b3d69f4（与 Epic4 同一 commit，测试补充在 1837905e）',
    ],
    commit: '2b3d69f4 + 1837905e',
  },
  {
    version: '1.0.253',
    date: '2026-04-17',
    changes: [
      '📋 vibex-sprint2-spec-canvas Epic3: AI 草稿生成',
      '✅ E3-U1 AI入口: DDSToolbar → handleAIGenerate → toggleDrawer → AIDraftDrawer',
      '✅ E3-U2 生成预览: AIDraftDrawer 状态机 IDLE→LOADING→PREVIEW/ERROR，prompt→/api/chat→CardPreview，30s超时',
      '✅ E3-U3 上下文传递: chatHistory state + lastPromptRef，handleRetry 上下文延续',
      '✅ E3-U4 边生成: parseEdgesFromResponse 提取edges，handleAccept 调用 addEdge，CardPreview 显示edges badge',
      '✅ DDSToolbar cleanup: 删除未使用 import，直接调用 useDDSCanvasStore.getState().setActiveChapter()',
    ],
    commit: 'aa966492',
  },
  {
    version: '1.0.252',
    date: '2026-04-17',
    changes: [
      '📋 vibex-sprint2-spec-canvas Epic2: 横向滚奏体验',
      '✅ E2-U1 横向滚奏: scroll-snap + handleScroll ratio>0.3 检测可见面板',
      '✅ E2-U2 URL同步: useChapterURLSync — mount读URL + router.replace 更新（不污染history）',
      '✅ E2-U3 章节Tab切换: DDSToolbar 3个可点击tab，setActiveChapter 直接更新store',
      '✅ E2-U3 滚动同步: useEffect监听activeChapter触发scrollIntoView，lastScrollChapterRef防循环',
      '✅ E2-U3 Tab样式: glassmorphism暗色主题，active高亮#818cf8，hover/focus-visible',
    ],
    commit: 'd82ba715',
  },
  {
    version: '1.0.251',
    date: '2026-04-17',
    changes: [
      '🎨 Epic1: 拖拽布局编辑器上线',
      '✅ 组件面板：10 个默认组件拖拽',
      '✅ React Flow 画布：节点自由定位，localStorage 持久化',
      '✅ 自定义节点渲染：Button 可点击、Table 显示 Mock 数据',
      '✅ 属性面板：props 编辑 + Mock 数据 Tab',
      '✅ JSON 导出/导入 v2.0',
      '✅ 路由抽屉：页面增删',
    ],
    commit: 'f18d48f4',
  },
  {
    version: '1.0.250',
    date: '2026-04-17',
    changes: [
      '📋 vibex-sprint2-spec-canvas Epic1: 三章节卡片管理',
      '✅ E1-U1 三章节结构 (DDSPanel data-chapter + ChapterPanel 默认渲染)',
      '✅ E1-U2 卡片CRUD (创建表单 + 删除按钮)',
      '✅ E1-U3 Schema渲染 (CardRenderer 分发 3 种卡片类型)',
      '✅ E2-U1 横向滚奏 (scroll-snap + URL 同步)',
      '✅ 15/15 tests passed',
    ],
    commit: '5bfb1e54',
  },
  {
    version: '1.0.249',
    date: '2026-04-17',
    changes: [
      '🔍 E4-F4.3: Panel lock 审计完成 — inactivePanel 当前未使用，无代码修改（审计结论）',
      '📌 审计: CanvasPage 未传 isActive prop → BusinessFlowTree inactivePanel 永不显示',
      '✅ 15/15 tests passed (回归)',
    ],
    commit: '2edb5eb1',
  },
  {
    version: '1.0.248',
    date: '2026-04-17',
    changes: [
      '🔧 E4-F4.2: handleConfirmAll 原子性设置 — confirmContextNode 同时设置 status+isActive 双字段',
      '📌 Bug: 原来直接 advancePhase，deactive 节点未激活；修复后遍历调用 confirmContextNode',
      '✅ 14/14 tests passed (含 AC-F4.2-1~3)',
    ],
    commit: '1085762e',
  },
  {
    version: '1.0.247',
    date: '2026-04-17',
    changes: [
      '🔧 E3-F3.1: hasAllNodes isActive !== false 检查 — 三树全部节点 must be active',
      '📌 Bug: 原来只检查节点长度，deactive 节点存在时按钮错误 enabled；修复后 every(isActive!==false)',
      '✅ 4/4 tests passed (含 AC-F3.1-1~4)',
    ],
    commit: 'a38f79be',
  },
  {
    version: '1.0.246',
    date: '2026-04-17',
    changes: [
      '🔧 E2-F2.2: componentGenerating unmount cleanup — useEffect cleanup 防止状态粘滞',
      '📌 Bug: API调用期间组件卸载导致 componentGenerating 状态粘滞；修复后 unmount 时重置',
      '✅ 15/15 tests passed (含 AC-F2.2-1~2)',
    ],
    commit: '4d2d73b9',
  },
  {
    version: '1.0.245',
    date: '2026-04-17',
    changes: [
      '🔧 E2-F2.1: canGenerateComponents flowsToSend 校验 — computeTreePayload 纯函数统一过滤逻辑',
      '📌 Bug: 原来只检查 flowNodes.length>0，未过滤 deactive flows；修复后同步检查 contextsToSend && flowsToSend',
      '✅ 13/13 tests passed (含 AC-F2.1-1~4)',
    ],
    commit: '3f8a8b52',
  },
  {
    version: '1.0.243',
    date: '2026-04-17',
    changes: [
      '🔧 E1-U1: canvasApi handleResponseError async/await 修复 — 后端 400 错误信息透传到 toast',
      '📌 错误字段优先级: error > message > details > HTTP status fallback；10 处调用点全部加 await',
      '✅ 新增 8 个测试覆盖 AC1/AC2 + 回归（vitest 8/8 passed）',
    ],
    commit: '2a10b064',
  },
  {
    version: '1.0.242',
    date: '2026-04-16',
    changes: [
      '🔧 Epic1: DDS路由构建修复 — 删除 catch-all API route.ts，依赖 public/_redirects 代理',
      '📌 根因: Next.js output:export 与 [...path] 动态路由不兼容（learnings: vibex-dds-route-revert-0416）',
    ],
    commit: '384ff637',
  },
  {
    version: '1.0.241',
    date: '2026-04-16',
    changes: [
      '🎨 Canvas 项目创建 — POST /api/v1/canvas/project Handler（Hono + D1）— 三树数据持久化',
      '✅ POST /project handler + CanvasProject D1 表（contexts/flows/components）',
    ],
    commit: '51327329',
  },
  {
    version: '1.0.240',
    date: '2026-04-16',
    changes: [
      '🌲 E4: 三树持久化 — serialize.ts 三树序列化 + useProjectLoader 自动加载最新快照 + CanvasPage 集成',
      '✅ 10/10 PASS (serialize.test.ts 100% 覆盖率)',
    ],
    commit: 'dab897c0',
  },
  {
    version: '1.0.239',
    date: '2026-04-16',
    changes: [
      '📥 E3: JSON/YAML 导入导出 — ImportService parseJSON/parseYAML/roundTripTest + ImportPanel 上传预览 + YAML 导出',
      '✅ 13/13 PASS (parseJSON/parseYAML/parseFile/roundTrip)',
    ],
    commit: 'ef90882a',
  },
  {
    version: '1.0.238',
    date: '2026-04-16',
    changes: [
      '📜 E2: 版本历史 Diff 对比 — snapshotDiff.ts 树级 diff + SnapshotDiffView 对比视图 + VersionHistoryPanel 勾选对比集成',
      '✅ 4/4 PASS (added/removed/empty/unchanged)',
    ],
    commit: '11a87f53',
  },
  {
    version: '1.0.237',
    date: '2026-04-16',
    changes: [
      '🔧 E1-U1: Tab State 重置修复 — `useEffect([activeTree])` 重置 phase，修复 Tab 切换时 phase 未重置 bug',
      '✅ 3/3 PASS',
    ],
    commit: 'cb82559a',
  },
  {
    version: '1.0.237',
    date: '2026-04-16',
    changes: [
      '🔒 E6-U1: 轻量级AST Walker — 替换 `@babel/traverse`，5000行 ~19ms (< 50ms ✓)，移除 traverse 依赖',
      '🔒 E6-U2: 误报率验证 — 1000个合法样本，误报率 0% ✓',
      '🔒 E6-U3: 性能测试 — 5000行 warm-run ~19ms / 1000行 < 10ms / 危险代码快速检测，16/16 PASS',
    ],
    commit: '4266c91d',
  },
  {
    version: '1.0.236',
    date: '2026-04-16',
    changes: [
      '🔒 E6-S1: AST安全扫描 — `@babel/parser` 检测 eval/new Function/setTimeout 字符串参数，8/8 PASS',
    ],
    commit: '02263c66',
  },
  {
    version: '1.0.244',
    date: '2026-04-16',
    changes: [
      '🤖 DDS Epic5: 路由与页面集成 — DDSCanvasPage 路由参数 + 章节状态同步，12/12 PASS',
    ],
    commit: '1717a097',
  },
  {
    version: '1.0.243',
    date: '2026-04-16',
    changes: [
      '💬 DDS Epic3: AI Draft Flow — AIDraftDrawer 滑出抽屉 + CardPreview，15/15 PASS',
    ],
    commit: '538ad1a6',
  },
  {
    version: '1.0.242',
    date: '2026-04-16',
    changes: [
      '📜 DDS Epic2a: 奏折布局 ScrollContainer — fullscreen + useChapterURLSync hook',
    ],
    commit: 'edd08e1d',
  },
  {
    version: '1.0.241',
    date: '2026-04-16',
    changes: [
      '🎨 DDS Epic2b: ReactFlow 画布集成 — DDSFlow 组件 + @xyflow/react v12，8/8 PASS',
    ],
    commit: 'b72455ba',
  },
  {
    version: '1.0.240',
    date: '2026-04-16',
    changes: [
      '🔧 DDS Epic4: 工具栏 Export/Import — exportToJSON() 下载 + parseImportFile() 导入，14/14 PASS',
    ],
    commit: '15de96a6',
  },
  {
    version: '1.0.239',
    date: '2026-04-16',
    changes: [
      '💾 DDS Epic6: 数据持久化 — localStorage LRU + IndexedDB snapshots + Export/Import，13/13 PASS',
    ],
    commit: '5fc4c178',
  },
  {
    version: '1.0.238',
    date: '2026-04-16',
    changes: [
      '📊 E7-S2: MCP 日志敏感数据脱敏 — sanitize() 递归过滤 token/password/secret/key/auth/credential，12/12 PASS',
    ],
    commit: 'f4dafb18',
  },
  {
    version: '1.0.235',
    date: '2026-04-16',
    changes: [
      '🔧 E7-S1: `health_check` MCP tool (stdio) — status/version/uptime/checks，5/5 PASS',
      '📊 E7-S2: Structured JSON logger — tool/duration/success 字段，5/5 PASS',
    ],
    commit: '3e8667da',
  },
  {
    version: '1.0.234',
    date: '2026-04-15',
    changes: [
      '🌳 Q3-E6: Canvas 三树持久化 — useRehydrateCanvasStores hook，4/4 PASS',
      '✅ skipHydration + 客户端 rehydration，覆盖 Component/BusinessFlow/BoundedContext',
    ],
    commit: 'cfb780c4',
  },

  {
    version: '1.0.233',
    date: '2026-04-15',
    changes: [
      '🐛 Bug2: Canvas Tab State 丢失修复 — skipHydration + hydrateOnClient + flushSync',
      '✅ 5/5 PASS',
    ],
    commit: '6d80bf4d',
  },

  {
    version: '1.0.232',
    date: '2026-04-15',
    changes: [
      '🐛 Bug1: P0 DDS API 404 修复 — Next.js API 路由代理绕过 Cloudflare 不稳定重写',
      '✅ GET/POST/PUT/DELETE 覆盖，Cookie 透传',
    ],
    commit: '762f411d',
  },

  {
    version: '1.0.231',
    date: '2026-04-15',
    changes: [
      '🔬 E5-U1: Sprint 2 QA TC-E5-04~07 测试扩展',
      '✅ 7/7 PASS — handleCreate + flowMachine + router.push 覆盖',
    ],
    commit: '169bf680',
  },

  {
    version: '1.0.230',
    date: '2026-04-15',
    changes: [
      '🎯 dev-e5-canvas-dashboard: ProjectCreationStep 真实 API 集成',
      '✅ handleCreate() 调用 projectApi.createProject()（替换 setTimeout mock）',
      '✅ userId null → "请先登录" Toast 提示',
      '✅ API 失败 → error banner + try/catch',
      '✅ 成功 → router.push(/project?id=)',
      '✅ 单元测试 3/3 PASS',
    ],
    commit: '4090fc26',
  },

  {
    version: '1.0.229',
    date: '2026-04-15',
    changes: [
      '🔧 E1-Reviewer-Dedup: wake_downstream 跳过 in-progress 任务，避免重复激活',
      '📝 task_manager.py: in-progress 状态检查',
      '🧪 test_dedup.py 26/26 ✅',
    ],
    commit: 'e8590cb8',
  },

  {
    version: '1.0.227',
    date: '2026-04-15',
    changes: [
      '📋 vibex-dds-canvas Epic5: 路由与页面集成',
      '✅ DDSCanvasPage.tsx: 主页面组件，整合全部组件（12 tests）',
      '✅ DDSFlow.tsx: React Flow wrapper',
      '✅ /design/dds-canvas/page.tsx: 替换占位页为完整画布',
      '✅ AbortController 请求生命周期管理',
      '✅ ESLint 0 errors',
    ],
    commit: '1717a097',
  },

  {
    version: '1.0.226',
    date: '2026-04-15',
    changes: [
      '📋 vibex-dds-canvas Epic3: AI Draft Flow',
      '✅ AIDraftDrawer.tsx: F14 滑出抽屉 + 状态机（20 tests）',
      '✅ CardPreview.tsx: F15 AI 卡片预览 + accept/edit/retry 按钮（15 tests）',
      '✅ 状态机: IDLE → LOADING → PREVIEW | ERROR（组件级）',
      '✅ 30s 超时，AbortController 请求取消',
      '✅ 全部 memo 化，CSS Modules',
      '✅ ESLint 0 errors，35 tests passing',
    ],
    commit: '538ad1a6',
  },

  {
    version: '1.0.225',
    date: '2026-04-15',
    changes: [
      '📋 vibex-dds-canvas Epic2: 横向 Scroll-Snap Canvas 布局',
      '✅ DDSScrollContainer.tsx: F10 横向 Scroll-Snap 容器（19 tests）',
      '✅ DDSPanel.tsx: F11 面板展开/收起动画（80px ↔ flex:1）',
      '✅ DDSThumbNav.tsx: F12 缩略图导航',
      '✅ DDSToolbar.tsx: F13 Sticky 工具栏（14 tests）',
      '✅ 全部 memo 化，CSS Modules + Dark mode tokens',
      '✅ ESLint 0 errors，33 tests passing',
    ],
    commit: 'c4049d7d',
  },

  {
    version: '1.0.224',
    date: '2026-04-15',
    changes: [
      '📋 vibex-dds-canvas Epic1: DDSCanvasStore + 三种卡片组件',
      '✅ types/dds/index.ts: F1 类型定义',
      '✅ stores/dds/DDSCanvasStore.ts: F2 Zustand store（30 tests）',
      '✅ hooks/dds/useDDSCanvasFlow.ts: F3 data→view 单向同步（9 tests）',
      '✅ hooks/dds/useDDSAPI.ts: F5 API Frontend Client',
      '✅ RequirementCard: user-story 卡片',
      '✅ BoundedContextCard: bounded-context 卡片',
      '✅ FlowStepCard: flow-step 卡片',
      '✅ CardRenderer: 类型分发器（22 tests）',
      '✅ ESLint 0 errors，61 tests passing',
    ],
    commit: 'fe5f35ff',
  },

  {
    version: '1.0.216',
    date: '2026-04-14',
    changes: [
      '📋 vibex-json-render-integration Epic1 Phase1 P0: catalog slots + nodesToSpec + Registry 修复',
      '✅ catalog.ts: 5个容器组件添加 slots: [default]',
      '✅ JsonRenderPreview: nodesToSpec 使用 parentId 建立嵌套关系',
      '✅ registry.tsx: PageImpl min-h-full + ModalImpl children + close button',
      '提交: 497f4e76',
    ],
    commit: '497f4e76',
  },

  {
    version: '1.0.223',
    date: '2026-04-14',
    changes: [
      '📋 vibex-design-component-library Epic2-Stories: generate-catalog 脚本测试 19 例',
      '✅ generate-catalog.test.ts: S2.1 批量模式 + S2.2 styleComponents',
      '✅ slugToFilename 边界测试（dot/space/special char）',
      '✅ vitest 71/71（52+19）✅',
      '提交: 3bad72a2',
    ],
    commit: '3bad72a2',
  },

  {
    version: '1.0.221',
    date: '2026-04-14',
    changes: [
      '📋 vibex-design-component-library Epic1-Stories: 52 unit tests + design-parser 修复',
      '✅ design-catalog.test.ts: 52 测试用例覆盖 S1.1-S1.4/S2.1-S2.2',
      '✅ design-parser.ts: 修复 ### Heading 格式，新增 extractSection()',
      '✅ 58 catalog 全量集成测试 + 回归测试（catalog.ts/registry.tsx 未修改）',
      '提交: da11de72',
    ],
    commit: 'da11de72',
  },

  {
    version: '1.0.218',
    date: '2026-04-14',
    changes: [
      '📋 vibex-design-component-library Epic1 Phase1 P0: 设计风格目录工具链',
      '✅ design-schema.ts: Zod Schema',
      '✅ generate-catalog.ts: designs.json → catalog',
      '提交: 3513ba65',
    ],
    commit: '3513ba65',
  },

  {
    version: '1.0.219',
    date: '2026-04-14',
    changes: [
      '📋 vibex-design-component-library Epic2 Phase2 P1: 规模化 59 套 catalog + design-parser 集成',
      '✅ design-parser.ts: 增强 extractColors/extractTypography/extractComponentTokens',
      '✅ generate-catalog.ts: 集成 design-parser，生成 colorPalette/typography/catalog.components/styleComponents',
      '✅ 58 个 individual catalog JSON: 全部含 colorPalette/typography/10标准组件/2-3特征组件',
      '提交: 09aabcd1',
    ],
    commit: '09aabcd1',
  },

  {
    version: '1.0.217',
    date: '2026-04-14',
    changes: [
      '📋 vibex-json-render-integration Epic2 Phase2 P1: ActionProvider + Button emit',
      '✅ ButtonImpl: emit(press, {nodeId, type}) onClick',
      '✅ ActionProvider handlers press → forward to onNodeClick',
      '✅ JsonRenderPreview.test.tsx 5/5',
      '提交: 7b586ddb',
    ],
    commit: '7b586ddb',
  },

  {
    version: '1.0.215',
    date: '2026-04-14',
    changes: [
      '📋 vibex-canvas-history-projectid Epic1+Epic2: Phase1止血+Phase2 URL注入',
      '✅ Phase1: useVersionHistory projectId=null 拦截 + 引导 UI',
      '✅ Phase1: useEffect([projectId]) projectId 变化自动重载 + E2E 4场景',
      '✅ Phase2: CanvasPage URL ?projectId= 注入 + 合法性校验',
      '提交: dd482541, fff16cfd, 438af56f',
    ],
    commit: '438af56f',
  },

  {
    version: '1.0.214',
    date: '2026-04-13',
    changes: [
      '📋 vibex-auth-401-redirect Epic3: LeftDrawer 401 兜底',
      '✅ LeftDrawer: 3层 401 兜底架构（Layer1-3）',
      '✅ auth-redirect.spec.ts: E2E returnTo 安全验证',
      '提交: 6b1683be, 23476571',
    ],
    commit: '23476571',
  },

  {
    version: '1.0.212',
    date: '2026-04-13',
    changes: [
      '📋 vibex-auth-401-redirect Epic2: AuthProvider 挂载与全局监听',
      '✅ AuthProvider.tsx: 监听 auth:401 事件，调用 logout()',
      '✅ ClientLayout.tsx: use client wrapper',
      '✅ sessionStore logout 5 tests',
      '提交: 454b2694, af53c435',
    ],
    commit: 'af53c435',
  },

  {
    version: '1.0.211',
    date: '2026-04-13',
    changes: [
      '📋 vibex-auth-401-redirect Epic1: canvasApi 401 事件分发修复',
      '✅ canvasApi.ts: 401 dispatchEvent + window.location.href 重定向',
      '✅ validateReturnTo: 白名单防 open redirect（含 // 修复）',
      '提交: f3a68586, d7c44637',
    ],
    commit: 'd7c44637',
  },

  {
    version: '1.0.213',
    date: '2026-04-13',
    changes: [
      '📋 vibex Epic3 TabBar 行为验证 e2e 测试',
      '✅ tab-accessibility.spec.ts: 6 Playwright tests',
      '✅ S3.1 无disabled S3.2 aria-selected S3.3 complete flow',
      '提交: 7042410b',
    ],
    commit: '7042410b',
  },

  {
    version: '1.0.210',
    date: '2026-04-13',
    changes: [
      '📋 vibex Epic1 TabBar 无障碍化改造',
      '✅ TabBar.tsx: 移除 disabled/locked/guard，所有 tab 可点击',
      '✅ CanvasPage: mobile prototype tab 新增（⚡ 原型）',
      '提交: 40b3158a',
    ],
    commit: '40b3158a',
  },

  {
    version: '1.0.209',
    date: '2026-04-13',
    changes: [
      '📋 vibex-canvas-auth-fix F11.2: 401/404 错误 UI 差异化',
      '✅ useVersionHistory: 新增 error 状态 + open() 清除',
      '✅ canvasApi: 404 → "历史功能维护中，请稍后再试"',
      '✅ VersionHistoryPanel: hookError/restoreError banner 分离',
      '✅ vitest 24/24',
      '提交: 3138c603, f926fb53, 3ce3007c',
    ],
    commit: '3ce3007c',
  },

  {
    version: '1.0.208',
    date: '2026-04-13',
    changes: [
      '📋 vibex-canvas-qa-fix Epic3: Tab 默认 phase 初始化',
      '✅ contextStore: phase input → context',
      '✅ TabBar guard: phaseIdx=1 时 flow/component locked',
      '提交: 301971314',
    ],
    commit: '301971314',
  },

  {
    version: '1.0.207',
    date: '2026-04-13',
    changes: [
      '📋 vibex-canvas-qa-fix Epic2: API 路径统一',
      '✅ api-config.ts: snapshots 端点添加 /v1/ 前缀',
      '✅ snapshot/restoreSnapshot/latest 已含 /v1/，无需修改',
      '✅ canvasApi.ts 消费者自动获取正确路径',
      '提交: 270858a2',
    ],
    commit: '270858a2',
  },

  {
    version: '1.0.206',
    date: '2026-04-13',
    changes: [
      '📋 vibex-canvas-qa-fix Epic1: Hydration Mismatch 修复',
      '✅ 5个store添加skipHydration:true (context/flow/component/ui/sessionStore)',
      '✅ CanvasPage mount时手动rehydrate全部5个store',
      '✅ historySlice TypeScript重载修复 (getUndoResult/getRedoResult)',
      '提交: 13f7c706',
    ],
    commit: '13f7c706',
  },

  {
    version: '1.0.205',
    date: '2026-04-13',
    changes: [
      '📋 vibex-canvas-context-nav Epic1+2: TabBar prototype tab + PhaseIndicator',
      '✅ TabBar.tsx: 新增 prototype tab（🚀 原型），4 tabs，prototypeCount badge',
      '✅ PhaseIndicator.tsx: SWITCHABLE_PHASES 增加 prototype 项',
      '✅ TabBar 17/17 | PhaseIndicator 5/5 | e2e 3 scenarios',
      '提交: d7ce4752',
    ],
    commit: 'd7ce4752',
  },

  {
    version: '1.0.204',
    date: '2026-04-13',
    changes: [
      '📋 vibex-auth-401-handling Epic3: 测试覆盖',
      '✅ middleware-auth.test.ts: 8 TC 认证中间件单元测试',
      '✅ validateReturnTo 强化（URL编码traversal/protocol-relative）+ fuzzing 17/17',
      '✅ auth-redirect.spec.ts: 3 E2E 测试场景',
      '提交: 102922c7',
    ],
    commit: '102922c7',
  },

  {
    version: '1.0.203',
    date: '2026-04-13',
    changes: [
      '📋 vibex-auth-401-handling Epic2: 前端一致性',
      '✅ authStore logout() 清除 auth_token + auth_session cookie（非 httpOnly 残留）',
      '✅ authStore 单元测试 22/22 通过（含 cookie 清除断言）',
      '提交: bf0100cd',
    ],
    commit: 'bf0100cd',
  },

  {
    version: '1.0.202',
    date: '2026-04-13',
    changes: [
      '📋 vibex-auth-401-handling Epic1: 后端 Cookie 设置',
      '✅ login/register 设置 httpOnly auth_token cookie (HttpOnly; SameSite=Lax; Max-Age=604800)',
      '✅ logout 清除 auth_token + auth_session 两个 cookie（Secure HTTPS）',
      '✅ 路由单元测试 19/19 通过（含 Set-Cookie 断言）',
      '提交: 2ec3d6e2',
    ],
    commit: '2ec3d6e2',
  },

  {
    version: '1.0.201',
    date: '2026-04-13',
    changes: [
      '📋 vibex-test-fix Epic4 补充: 全量回归验证完成',
      '✅ Epic1-3 未引入新失败（77/77 + 26/26 tests）',
      '✅ unit spec 测试: setup 8/8 + accessibility 7/7 + selector-patterns 11/11',
      '提交: 57ba3295',
    ],
    commit: '57ba3295',
  },

  {
    version: '1.0.200',
    date: '2026-04-13',
    changes: [
      '📋 vibex-test-fix Epic3 补充: selector-patterns.spec.ts',
      '✅ 新增选择器模式规范测试（11/11 passed）',
      '✅ S3.2/S3.3 选择器模式记录：getAllByText+count、within()、regex日期',
      '提交: 49008afc',
    ],
    commit: '49008afc',
  },

  {
    version: '1.0.199',
    date: '2026-04-12',
    changes: [
      '📋 vibex-test-fix Epic2 补充: accessibility.spec.ts',
      '✅ 新增 jest-axe 集成验证测试（7/7 passed）',
      '✅ axe 函数可导入、返回正确 AxeResults 结构',
      '提交: 30e7f47c',
    ],
    commit: '30e7f47c',
  },

  {
    version: '1.0.198',
    date: '2026-04-12',
    changes: [
      '📋 vibex-test-fix Epic1 补充: setup.spec.ts',
      '✅ 新增 IntersectionObserver mock 行为验证测试（8/8 passed）',
      '✅ 覆盖 S1.1 PRD 验收标准',
      '提交: 7e6a00a9',
    ],
    commit: '7e6a00a9',
  },

  {
    version: '1.0.197',
    date: '2026-04-12',
    changes: [
      '📋 vibex-test-fix Epic4: 全量回归验证',
      '✅ Epic 1-3 修复验证: CardTreeNode 15/15, accessibility 9/9, page 2/2, dashboard 38/38, export 13/13 (合计 77/77)',
      '✅ 组件回归: 43 个预存失败与 Epic 1-3 无关',
      '提交: d6b7ae0c',
    ],
    commit: 'd6b7ae0c',
  },

  {
    version: '1.0.196',
    date: '2026-04-12',
    changes: [
      '📋 vibex-test-fix Epic3: 页面测试选择器修复',
      '✅ page.test.tsx: HomePage Server Component，移除无效测试',
      '✅ dashboard/page.test.tsx: getByText→getAllByText+count，日期正则修复',
      '✅ export/page.test.tsx: getByTestId 替代模糊文本匹配',
      '✅ 验收: page 2/2, dashboard 38/38, export 13/13',
      '提交: 57362f89',
    ],
    commit: '57362f89',
  },

  {
    version: '1.0.195',
    date: '2026-04-12',
    changes: [
      '📋 vibex-test-fix Epic2: jest-axe 包修复',
      '✅ 安装 jest-axe@^10.0.0 无障碍测试工具',
      '✅ accessibility.test.tsx: FlowPropertiesPanel mock 修复（__esModule + default 格式）',
      '✅ 验收: 9/9 tests passed',
      '提交: 9cccf168',
    ],
    commit: '9cccf168',
  },

  {
    version: '1.0.194',
    date: '2026-04-12',
    changes: [
      '📋 vibex-test-fix Epic1: IntersectionObserver Mock 修复',
      '✅ setup.ts: 全局 IntersectionObserver mock（class + vi.fn() 包装）',
      '✅ CardTreeNode.test.tsx: 移除本地冗余 mock，修复 nested children renderWithProvider',
      '✅ mockImplementationOnce: 改用 regular function 确保 new 正常',
      '✅ 验收: 15/15 tests passed',
      '提交: 997d8cfd',
    ],
    commit: '997d8cfd',
  },

  {
    version: '1.0.193',
    date: '2026-04-12',
    changes: [
      '📋 vibex-proposals-20260412 Epic1: 测试基础设施修复 (Sprint 1+2)',
      '✅ E1 safeError: log-sanitizer.ts — sanitize()/safeError()/devLog() 100% 覆盖',
      '✅ E2 提案状态追踪: PROPOSALS_STATUS_SOP.md + INDEX.md status',
      '✅ E3 CI/CD守卫增强: grepInvert guard + WEBSOCKET_CONFIG 单一源',
      '✅ E4.1 Canvas ErrorBoundary: TreeErrorBoundary.tsx 三栏独立',
      '✅ E4.2 @vibex/types落地: canvasSchema Zod schemas',
      '✅ E4.5 groupByFlowId优化: useMemo O(n×3)→O(1)',
      '✅ E5 waitForTimeout重构: E2E 确定性等待',
      '✅ E6 pre-commit hook: lint-staged + ESLint no-console',
      '提交: 02c735f1 (E2 JSON fix), 88fb2c79 (changelog)',
    ],
    commit: '02c735f1',
  },

  {
    version: '1.0.192',
    date: '2026-04-12',
    changes: [
      '📋 vibex-proposals-20260412 Epic0 S0.1: TypeScript 紧急修复',
      '✅ S0.1: import type NextResponse → value import in apiAuth.ts',
      '✅ TypeScript 编译: 0 errors',
      '提交: 4c4f019b',
    ],
    commit: '4c4f019b',
  },

  {
    version: '1.0.189',
    date: '2026-04-12',
    changes: [
      '📋 vibex-css-architecture Epic-E4: CI与测试',
      '✅ E4-S1: PrototypeQueuePanel.test.tsx — 状态样式 Vitest 单元测试（7/7 ✅）',
      '✅ E4-S2: canvas-queue-styles.spec.ts — 队列样式 E2E 测试（4/4 ✅）',
      '✅ 修复 24 个缺失 CSS 类名（composes 别名复用已有样式）',
      '✅ canvas.module.css.d.ts 扩展 22 个类名声明',
      '提交: bd69472a',
    ],
  },

  {
    version: '1.0.191',
    date: '2026-04-07',
    changes: [
      '📋 vibex-proposals-20260411-page-structure E1: 组件树页面结构增强',
      '✅ Phase 1: ComponentNode 新增 pageName 可选字段',
      '✅ Phase 2: getPageLabel 支持 pageName 优先，ComponentGroup 新增 pageId + componentCount',
      '✅ Phase 3: 树结构展示优化，通用组件置顶',
      '✅ Phase 4: JSON 导出支持 pageName 字段',
      '✅ 单元测试: ComponentTreeGrouping.test.ts 35 tests',
    ],
    commit: '60cd1ac4',
  },

  {
    version: '1.0.190',
    date: '2026-04-12',
    changes: [
      '📋 vibex-proposals-20260411-page-tree E1: flowId 匹配修复',
      '✅ AI prompt 强化: generate-components/route.ts 增加 flowId = nodeId 指令',
      '✅ matchFlowNode 三级匹配: 精确匹配 → prefix 匹配 → 名称模糊匹配',
      '✅ 单元测试: ComponentTreeGrouping.test.ts 35 tests (inferIsCommon/matchFlowNode/getPageLabel/groupByFlowId)',
    ],
    commit: '60cd1ac4',
  },

  {
    version: '1.0.188',
    date: '2026-04-12',
    changes: [
      '📋 Epic-E3 命名规范文档 + CI 扫描',
      '✅ 新增 scan-tsx-css-refs.ts：TSX styles[xxx] 引用检测（480 文件 4479 类，0 undefined）',
      '✅ 修复 canvas-queue-styles.spec.ts BASE_URL 为 port 3000（CI 兼容）',
      '提交: 88e4e650',
    ],
  },

  {
    version: '1.0.187',
    date: '2026-04-12',
    changes: [
      '🔒 Epic-E2 类型安全体系：canvas.module.css.d.ts 覆盖 200+ 类名',
      '✅ 新增 scan-css-conflicts.ts 支持 TSX styles[xxx] 引用检查',
      '✅ 新增 canvas-queue-styles.spec.ts E2E 测试 4/4 passed',
      '提交: e324cb87',
    ],
  },

  {
    version: '1.0.186',
    date: '2026-04-12',
    changes: [
      '🔧 Epic-E1 CSS 命名修复：snake_case → camelCase（queueItem_queued → queueItemQueued）',
      '✅ PrototypeQueuePanel.tsx 动态类名修复（capitalize 模式）',
      '✅ 新增 css-modules.d.ts 全局类型声明',
      '✅ 新增 CSS 类名命名规范文档',
      '提交: 978b25d8',
    ],
  },

  {
    version: '1.0.185',
    date: '2026-04-12',
    changes: [
      '🔧 Epic3 构建与部署：pnpm build exit code=0 ✅',
      '✅ Epic3 F3.2 静态导出验证：canvas.html 含 TabBar/ExportMenu/leftDrawer CSS Module',
      '✅ 新增 scripts/verify-build-deploy.ts 验证脚本',
      '提交: 6e33fa3e',
    ],
  },

  {
    version: '1.0.184',
    date: '2026-04-12',
    changes: [
      '🔍 Epic2 验证与回归：F2.1 类名冲突扫描 (scan-css-conflicts.test.ts)',
      '✅ Epic2 F2.2 视觉回归：canvas-visual-regression.spec.ts 5/5 passed',
      '✅ Epic2 F2.3 运行时验证：canvas-classname-runtime.spec.ts 7/7 passed',
      '提交: d68dfbb9',
    ],
  },

  {
    version: '1.0.183',
    date: '2026-04-11',
    changes: [
      '🔧 canvas CSS @use → @forward（根因修复），恢复 13 个组件类名导出',
      '✅ 新增 scan-css-conflicts.ts 脚本检测 CSS 类名冲突',
      '✅ 新增 canvas-module-exports.test.ts 验证类名导出',
      '提交: 70ed0a1a',
    ],
  },

  {
    version: '1.0.182',
    date: '2026-04-11',
    changes: [
      '🔧 修复组件预览空白（JsonTreeRenderer）',
      '✅ generateDefaultProps 根据组件类型生成合规默认 props',
      '提交: 41f5aec4',
    ],
  },

  {
    version: '1.0.181',
    date: '2026-04-11',
    changes: [
      '⚡ Epic2 SSE 流式生成 Phase 1（useAIController 重构）',
      '✅ GeneratingState 替换 isQuickGenerating（idle/generating/done/error/fallback 5 状态）',
      '✅ canvasSseAnalyze SSE 流式接入 + fallback 降级',
      '✅ 新增 useAIController.test.tsx 6 个单元测试',
      '提交: cd1814a8',
    ],
  },

  {
    version: '1.0.180',
    date: '2026-04-11',
    changes: [
      '📋 Epic1+Epic2 功能点完成状态汇总（PRD）',
      '✅ Epic1 F1.1~F1.4 全部完成（Hooks 重构 Bug-1）',
      '✅ Epic2 F2.1~F2.2 全部完成（CSS 修复 Bug-2）',
      '提交: 83f23316',
    ],
  },

  {
    version: '1.0.179',
    date: '2026-04-11',
    changes: [
      '🔧 Canvas BugFix Sprint: 8 个 Hooks/Store 修复（S1-1~S1-9）',
      '✅ S1-1/S1-7: handleRegenerateContexts deps + renderContextTreeToolbar memoization',
      '✅ S1-3: useCanvasExport isExporting ref→useState',
      '✅ S1-4: useCanvasSearch searchTimeMs ref→useState',
      '✅ S1-5/S1-6: useAutoSave polling deps + lastSnapshotVersionRef 隔离',
      '✅ S1-8: useCanvasPanels projectName 从 sessionStore 初始化',
      '✅ S1-9: contextStore getFlowStore() lazy import 解决循环依赖',
      '提交: 63a4f939, b466b8e3, 68d8f847, 8ddeb94d, b7d725d3, e307ce2b',
    ],
  },

  {
    version: '1.0.178',
    date: '2026-04-11',
    changes: [
      '🔧 preview.module.css CSS Module 违规修复（Bug-2 修复）',
      '✅ 移除 bare * selector，移至 globals.css，Canvas 页面 0 404 资源',
      '✅ pnpm build 编译成功，gstack 验证 0 errors, 0 404s',
      '提交: 7bb5ae5b',
    ],
  },

  {
    version: '1.0.177',
    date: '2026-04-11',
    changes: [
      '🪝 CanvasOnboardingOverlay Hooks 安全重构（Bug-1 修复）',
      '✅ 所有 useXxx hook 移至组件顶部，消除 React Hooks 规则违规',
      '✅ 移除 handleDismiss/handleComplete 中多余的 localStorage 写入',
      '✅ Keyboard Effect 直接调用 store action',
      '✅ 新增 22 个单元测试（跳过/导航/键盘/快速点击）',
      '提交: 54dab01b',
    ],
  },

  {
    version: '1.0.176',
    date: '2026-04-10',
    changes: [
      '📋 vibex-canvas-button-audit E3 Sprint 2: confirmDialogStore',
      '✅ Zustand统一确认弹窗，替换window.confirm',
      '提交: 69df71cc',
    ],
    commit: '69df71cc',
  },

  {
    version: '1.0.184',
    date: '2026-04-11',
    changes: [
      '📋 vibex-build-fixes: CanvasHeader story + Unicode quotes 修复',
      '✅ 删除 9 个 orphaned story files',
      '✅ 修复后端 route.ts Unicode 弯引号',
      '提交: 378f8a56, f8743472',
    ],
    commit: '378f8a56',
  },

  {
    version: '1.0.185',
    date: '2026-04-11',
    changes: [
      '📋 vibex-dev-proposals-task E1: 设计系统统一 Auth CSS Module 迁移',
      '✅ auth 页面内联样式 → CSS Module，移除 17 处 style 对象',
      '✅ error-mapper 统一错误映射 + dashboard ConfirmDialog',
      '提交: 0cae1330, 021f319a',
    ],
    commit: '0cae1330',
  },

  {
    version: '1.0.186',
    date: '2026-04-11',
    changes: [
      '📋 vibex-dev-proposals-task E2: 设计系统统一 Preview CSS Module 迁移',
      '✅ preview 页面内联样式 → CSS Module，移除 87 处 style 对象',
      '提交: d60f0595',
    ],
    commit: 'd60f0595',
  },

  {
    version: '1.0.187',
    date: '2026-04-11',
    changes: [
      '📋 vibex-pm-proposals-vibex-build-fixes E1: Sprint 1 基础安全 + 表单质量',
      '✅ error-mapper 统一错误映射 + dashboard ConfirmDialog',
      '✅ Next.js middleware 路由保护',
      '提交: E1 Epic3 条目',
    ],
    commit: 'E1 Epic3',
  },

  {
    version: '1.0.188',
    date: '2026-04-11',
    changes: [
      '📋 vibex-reviewer-proposals E1: PR 合入标准 + prototype Renderer 重构',
      '✅ Epic2 PR 合入标准文档',
      '✅ Epic3 prototype renderer 重构：600行→5模块',
      '提交: ac6a0db2, 9a924074',
    ],
    commit: 'ac6a0db2',
  },

  {
    version: '1.0.182',
    date: '2026-04-11',
    changes: [
      '📋 vibex E1 Epic2 returnTo 跳转: validateReturnTo 安全校验 + 登录后跳转',
      '✅ validateReturnTo() 6种安全校验（null/空串/绝对URL/协议相对URL/javascript:/路径穿越）',
      '✅ handleSubmit 登录成功后读 sessionStorage → validateReturnTo → router.push',
      '✅ AuthForm useEffect 从 URL 读取 returnTo 并持久化到 sessionStorage',
      '✅ validateReturnTo.test.ts: 12个单元测试 case 全覆盖',
      '提交: 5a2543bb',
    ],
    commit: '5a2543bb',
  },

  {
    version: '1.0.183',
    date: '2026-04-11',
    changes: [
      '📋 vibex E1 Epic3: Next.js auth middleware 测试覆盖',
      '✅ middleware.ts 保护 /dashboard/canvas/design/project-settings/preview',
      '✅ 未认证访问 → 307 redirect /auth；已认证访问 /auth → redirect /dashboard',
      '✅ middleware.test.ts: 22个测试 case',
      '提交: 1b59c5bc',
    ],
    commit: '1b59c5bc',
  },

  {
    version: '1.0.181',
    date: '2026-04-11',
    changes: [
      '📋 vibex E1 Epic1-401: 401 重定向核心机制',
      '✅ AuthError 类 + httpClient 401 全局事件分发',
      '✅ useAuth 全局监听 auth:401，自动 redirect /auth，防死循环',
      '提交: 3b98caf9',
    ],
    commit: '3b98caf9',
  },

  {
    version: '1.0.177',
    date: '2026-04-11',
    changes: [
      '📋 vibex-canvas-button-audit E6 Sprint 4: ProjectBar 按钮收拢设计方案',
      '✅ 设计方案: 11按钮现状 + A/B/C/D分类 + 核心4-5按钮 + ⋯菜单',
      '✅ WCAG 2.1 AA + 响应式(3断点) + 迁移路径(Phase1/2)',
      '提交: 560d118f',
    ],
    commit: '560d118f',
  },

  {
    version: '1.0.178',
    date: '2026-04-11',
    changes: [
      '📋 vibex-canvas-button-audit-proposal Sprint 2: P2 confirmDialog 集成',
      '✅ BoundedContextTree/ComponentTree/TreeToolbar — window.confirm 替换为 confirmDialogStore',
      '提交: 07ad855d',
    ],
    commit: '07ad855d',
  },

  {
    version: '1.0.179',
    date: '2026-04-11',
    changes: [
      '📋 vibex-canvas-button-audit-proposal Sprint 3: P3 tooltip + P4 clearFlowCanvas',
      '✅ P3 重新生成: tooltip 精简为「🔄 重新生成」',
      '✅ P4 clearFlowCanvas: resetFlowCanvas→clearFlowCanvas 重命名',
      '提交: a5c18802',
    ],
    commit: 'a5c18802',
  },

  {
    version: '1.0.180',
    date: '2026-04-11',
    changes: [
      '📋 vibex-canvas-button-audit-proposal Sprint 4: P5 ProjectBar 按钮收拢设计方案',
      '✅ 设计方案: 11按钮分析 + A/B/C/D分类 + 核心4-5按钮 + ⋯菜单（文字稿）',
      '提交: 373c4b97',
    ],
    commit: '373c4b97',
  },

  {
    version: '1.0.176',
    date: '2026-04-10',
    changes: [
      '📋 vibex-canvas-button-audit E4+E5 Sprint 3: 文案修复',
      '✅ E4 重新生成: tooltip 精简为「🔄 重新生成」',
      '✅ E5 clearFlowCanvas: resetFlowCanvas→clearFlowCanvas 重命名，语义明确化',
      '提交: 54fe5b54',
    ],
    commit: '54fe5b54',
  },

  {
    version: '1.0.175',
    date: '2026-04-10',
    changes: [
      '📋 vibex-canvas-button-audit E1+E2 Sprint 1',
      '✅ E1 Flow undo: contextStore→flowStore.deleteSelectedNodes（含snapshot）',
      '✅ E2 TreeToolbar: treeType分支统一delete语义',
      '提交: a2707a2e',
    ],
    commit: 'a2707a2e',
  },

  {
    version: '1.0.174',
    date: '2026-04-10',
    changes: [
      '📋 vibex-analyst-proposals E2: 执行闭环追踪强化',
      '✅ proposal-status-check.sh / proposal-dedup.sh',
      '✅ proposal-metrics.py / update-tracking.py',
      '提交: 04ac4ef5',
    ],
    commit: '04ac4ef5',
  },

  {
    version: '1.0.173',
    date: '2026-04-10',
    changes: [
      '📋 vibex-pm-proposals E1: Onboarding 新手引导修复',
      '✅ OnboardingModal.test: querySelector→getByTestId（CSS Modules兼容）',
      '✅ 添加 data-testid 到 overlay div',
      '提交: ee32121c',
    ],
    commit: 'ee32121c',
  },

  {
    version: '1.0.172',
    date: '2026-04-10',
    changes: [
      '📋 vibex-dev-proposals P0-2: E2 code cleanup',
      '✅ 15个根目录垃圾文件已删除（测试残留）',
      '✅ 76个legacy Page Router路由添加@deprecated注解',
      '提交: 4c768c12',
    ],
    commit: '4c768c12',
  },

  {
    version: '1.0.171',
    date: '2026-04-10',
    changes: [
      '📋 vibex-reviewer-proposals E1: JsonTreeRenderer 测试覆盖率57%→71%',
      '✅ +16 tests: null/string/number/boolean/array/unknown渲染',
      '✅ Expand all/collapse all、toolbar search、copy clipboard',
      '提交: d1f3d089',
    ],
    commit: 'd1f3d089',
  },

  {
    version: '1.0.170',
    date: '2026-04-10',
    changes: [
      '📋 vibex-dev-proposals P0-1: 5个v0废弃API路由添加认证',
      '✅ /api/agents、/api/templates、/api/users、/api/domains、/api/prototypes',
      '✅ getAuthUserFromRequest 统一认证，未认证返回401',
      '提交: c722623e',
    ],
    commit: 'c722623e',
  },

  {
    version: '1.0.169',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0413 test-infra: 测试基础设施修复',
      '✅ E1.1: npm test 脚本修复 + vitest exit code 传播修复',
      '✅ E1.2: E2E 管道重入守卫 (tester-entry.sh)',
      '✅ templates/dev-checklist.md: 开发检查清单模板',
      '提交: dbb17650, f24d620f',
    ],
    commit: 'f24d620f',
  },

  {
    version: '1.0.168',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0413 P002: 主题工具层建设',
      '✅ theme-utilities.css: 38个.t-*工具类',
      '✅ design-tokens.css: 令牌扩展',
      '提交: 4545b12e',
    ],
    commit: '4545b12e',
  },

  {
    version: '1.0.167',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0413 P001: JsonTreeRenderer 设计令牌迁移',
      '✅ JsonTreeRenderer.module.css: 270→142行 (47%减少, 0 hex残留)',
      '✅ theme-utilities.css: 40+ 工具类',
      '提交: 4545b12e',
    ],
    commit: '4545b12e',
  },

  {
    version: '1.0.166',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E7: 文档与工具',
      '✅ docs/canvas-roadmap.md: Canvas 演进路线图',
      '✅ .github/workflows/changelog.yml: CHANGELOG guard CI',
      '提交: 4107f001',
    ],
    commit: '4107f001',
  },

  {
    version: '1.0.165',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E6: console.* pre-commit hook',
      '✅ ESLint no-console rule: 阻止 console.log，允许 warn/error',
      '✅ lint-staged: staged files 执行 ESLint/stylelint',
      '✅ .husky/pre-commit: lint-staged 优先运行',
      '✅ stability.spec.ts: 路径修复 + 扫描 .test.ts 文件',
      '提交: beb1f712, df3b8cba',
    ],
    commit: 'beb1f712',
  },

  {
    version: '1.0.164',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E5: 测试重构优化',
      '✅ waitForTimeout 重构: 主要 E2E 测试 0 waitForTimeout > 50ms',
      '✅ stability.spec.ts F1.1 验收测试通过',
      '✅ 剩余 15 处均在特殊测试中（mermaid/performance），属合理保留',
      '提交: ac62e7c0',
    ],
    commit: 'ac62e7c0',
  },

  {
    version: '1.0.163',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E4: 架构增强',
      '✅ E4.1: TreeErrorBoundary.tsx — 三栏独立 ErrorBoundary + 重试按钮',
      '✅ E4.2: @vibex/types — canvasSchema 共享类型落地',
      '✅ E4.4: frontend types 对齐 — canvasApiValidation.ts 引用 @vibex/types',
      '✅ E4.5: groupByFlowId — useMemo 记忆化优化 (ComponentTree)',
      '提交: cf578266 (architect proposals)',
    ],
    commit: 'cf578266',
  },

  {
    version: '1.0.162',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E3: CI/CD 守卫增强',
      '✅ pre-submit-check.sh Section 7: grepInvert guard 检测 test config 变更',
      '✅ backend/src/config/websocket.ts: WEBSOCKET_CONFIG 单一配置源',
      '✅ GitHub Actions path filters: 测试配置变更触发全量测试',
      '提交: 8a09a2af, 1e98c47c',
    ],
    commit: '8a09a2af',
  },

  {
    version: '1.0.161',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E2: 提案状态追踪 SOP',
      '✅ PROPOSALS_STATUS_SOP.md — 状态定义/转换规则/更新时机',
      '提交: e251c813',
    ],
    commit: 'e251c813',
  },

  {
    version: '1.0.160',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E1: SafeError Log Sanitizer',
      '✅ sanitize() / safeError() / devLog() — 敏感字段自动脱敏',
      '✅ 所有 API 路由使用 safeError，无裸 console.log',
      '提交: 525e4ae4',
    ],
    commit: '525e4ae4',
  },

  {
    version: '1.0.159',
    date: '2026-04-10',
    changes: [
      '📋 vibex-sprint-0412 E0.2: Auth Mock Factory',
      '✅ createAuthStoreMock() / createAuthApiMock() — 集中式 auth mock 工厂',
      '✅ authStoreMock.presets — 预构建状态',
      '✅ setSessionAuthToken() / clearSessionAuth() — sessionStorage 辅助',
      '提交: b4cb4956',
    ],
    commit: 'b4cb4956',
  },

  {
    version: '1.0.158',
    date: '2026-04-10',
    changes: [
      '📋 canvas-code-audit Epic3: P2 Polish',
      '✅ F3.2: 删除 canvasApi.ts 重复注释块',
      '✅ F3.3: Keyboard handler 统一确认',
      '提交: 406ce7f2, a0d581ea',
    ],
    commit: '406ce7f2',
  },

  {
    version: '1.0.157',
    date: '2026-04-10',
    changes: [
      '📋 canvas-code-audit Epic2: P1 Quality Improvements',
      '✅ F2.5: FlowEdgeLayer 一致性确认 — BusinessFlowTree 保留 FlowEdgeLayer',
      '提交: 2e076c32, e4c22516',
    ],
    commit: '2e076c32',
  },

  {
    version: '1.0.156',
    date: '2026-04-10',
    changes: [
      '📋 canvas-code-audit Epic1: P0 Critical Bug Fixes',
      '✅ F1.1: onGenerateContext 连接真实 API（删除 mock 数据）',
      '✅ F1.2: renderContextTreeToolbar 辅助函数抽取',
      '✅ F1.3: handleRegenerateContexts useCallback 抽取',
      '✅ F2.1: API 错误添加 toast 提示',
      '✅ F2.2: 删除 REMOVED 注释块',
      '✅ F2.3: 删除未使用 import',
      '✅ F2.4: 抽取 cx() 工具函数',
      '提交: 774a08cb, a56ed085, 43a4522c, fab64ec8, 6c327c52, 42c6f0c7',
    ],
    commit: '774a08cb',
  },

  {
    version: '1.0.155',
    date: '2026-04-09',
    changes: [
      '📋 vibex-fifth E4: 稳定性收尾 E2E 测试',
      '✅ E4.1 JsonRenderPreview 集成验证: 3 E2E tests (json-render-preview.spec.ts)',
      '✅ E4.2 PrototypeQueuePanel API 连通性: 5 E2E tests (prototype-queue.spec.ts, 4 pass 1 skip)',
      '✅ Playwright 专用配置: 解决 @playwright/test 版本冲突',
      '提交: 75a116c3',
    ],
    commit: '75a116c3',
  },

  {
    version: '1.0.154',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E4-S2: ADR 实施验证',
      '✅ TanStack Query: QueryClient + 7 query hooks + 2 mutation hooks + SSE Bridge',
      '✅ 虚拟化: ComponentTree + BoundedContextTree，VIRTUAL_THRESHOLD=50',
      '✅ 冲突处理: version 乐观锁 + ConflictBubble + onConflict 事件',
      '✅ Firebase Presence: Mock 模式完整，24 stories + Chromatic CI',
      '提交: reviewer-E4-S2 审查通过',
    ],
    commit: 'reviewer-E4-S2',
  },

  {
    version: '1.0.153',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E4-S1: ADR 决策记录',
      '✅ 5 个 ADR: TanStack Query/虚拟化/冲突/Firebase/Storybook',
      '✅ 格式规范: 状态/背景/决策/后果/关联完整',
      '提交: dev-E4-S1 验证完成',
    ],
    commit: 'dev-E4-S1',
  },

  {
    version: '1.0.152',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E3-S2: Canvas 组件 Story 覆盖',
      '✅ 12 个 Canvas story: ConflictBubble/PresenceLayer 等',
      '✅ storybook build 通过，autodocs 正常',
      '提交: dev-E3-S2 验证完成',
    ],
    commit: 'dev-E3-S2',
  },

  {
    version: '1.0.151',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E3-S1: Storybook 配置与 Chromatic CI',
      '✅ .github/workflows/chromatic.yml: GitHub Actions workflow',
      '✅ Storybook stories: 核心 UI 组件覆盖',
      '提交: dev-E3-S1 验证完成',
    ],
    commit: 'dev-E3-S1',
  },

  {
    version: '1.0.150',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E2-S3: BoundedContextTree 虚拟化',
      '✅ VirtualizedContextList: useVirtualizer + measureElement 动态高度',
      '✅ 统一虚拟化模式: 三树虚拟化架构一致',
      '提交: dev-E2-S3 验证完成',
    ],
    commit: 'dev-E2-S3',
  },

  {
    version: '1.0.149',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E2-S2: BusinessFlowTree 虚拟化',
      '✅ VirtualizedFlowList: useVirtualizer + estimateSize 动态高度',
      '✅ 协作滚动同步: 远程监听 + 本地广播',
      '提交: dev-E2-S2 验证完成',
    ],
    commit: 'dev-E2-S2',
  },

  {
    version: '1.0.148',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E2-S1: ComponentTree 虚拟化',
      '✅ VirtualizedNodeList: @tanstack/react-virtual 虚拟化，阈值50',
      '✅ 通用组件识别: inferIsCommon 多维判断，置顶分组',
      '提交: dev-E2-S1 验证完成',
    ],
    commit: 'dev-E2-S1',
  },

  {
    version: '1.0.147',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E1-S4: SSE 数据写入 Query 缓存',
      '✅ lib/api/sseToQueryBridge.ts: SSE → Query 缓存桥接',
      '✅ createSseBridge 工厂函数: setQueryData + invalidateQueries + cancelQueries',
      '提交: dev-E1-S4 验证完成',
    ],
    commit: 'dev-E1-S4',
  },

  {
    version: '1.0.146',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E1-S3: 消除散落 axios 调用',
      '✅ stores 合规: 全面清理，无裸 axios/fetch/XMLHttpRequest',
      '✅ 统一 API 层: 通过 TanStack Query hooks/mutations 访问',
      '提交: dev-E1-S3 验证完成',
    ],
    commit: 'dev-E1-S3',
  },

  {
    version: '1.0.145',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E1-S2: TanStack Query Hooks 迁移',
      '✅ hooks/queries: 统一 Hooks 层（useProjects/useEntities/useFlows/useRequirements/useDDD）',
      '✅ Query Keys 统一: queryKeys 工厂模式管理缓存键',
      '✅ 测试覆盖: 38 个用例全部通过',
      '提交: dev-E1-S2 集成完成',
    ],
    commit: 'dev-E1-S2',
  },

  {
    version: '1.0.144',
    date: '2026-04-09',
    changes: [
      '📋 vibex-third E1-S1: TanStack Query 统一 API Client',
      '✅ lib/api/client.ts: TanStack Query 层，QueryClient 单例 + apiMetrics 百分位跟踪',
      '✅ lib/circuit-breaker.ts: 熔断器模式（closed/open/half-open）+ CircuitBreakerManager',
      '✅ lib/api-config.ts: 集中式 API URL 管理',
      '✅ lib/api-retry.ts: 指数退避重试（axios-retry）',
      '✅ 测试覆盖: 29 个用例全部通过',
      '提交: b22c5277, f3a819dd',
    ],
    commit: 'f3a819dd',
  },

  {
    version: '1.0.143',
    date: '2026-04-08',
    changes: [
      '📋 vibex-third E1-S1: TanStack Query 统一 API Client',
      '✅ services/api/client.ts: 统一 API Client 指标跟踪',
      '✅ logRequest 配置项 + 1000条滚动窗口',
      '提交: b22c5277, f3a819dd',
    ],
    commit: 'f3a819dd',
  },

  {
    version: '1.0.142',
    date: '2026-04-08',
    changes: [
      '📋 vibex-next E3: 清理与 Analytics',
      '✅ E3-S1: 删除废弃 snapshot.ts，保留 canvasSseApi snapshot 测试',
      '✅ E3-S2: ESLint 豁免清单 ESLINT_EXEMPTIONS.md',
      '✅ E3-S3: 自建轻量 analytics SDK（白名单 + 静默失败 + 匿名 session）',
      '提交: e75641c4, 1d3870bb, 94fd2fbb',
    ],
    commit: '94fd2fbb',
  },

  {
    version: '1.0.141',
    date: '2026-04-08',
    changes: [
      '📋 vibex-next E2: 性能可观测性',
      '✅ E2-S1: /health 端点 P50/P95/P99 延迟（5分钟滚动窗口）',
      '✅ E2-S2: useWebVitals hook（告警阈值 LCP>4s/CLS>0.1）',
      '✅ E2-S3: 数据保留策略（metrics 5分钟 TTL + analytics 7天清除）',
      '提交: 1ac78dcd, 1277e652, 04dff5f3, 0f8c3b30',
    ],
    commit: '0f8c3b30',
  },

  {
    version: '1.0.140',
    date: '2026-04-08',
    changes: [
      '📋 vibex-next E1: 协作功能',
      '✅ E1-S1: Firebase Presence 接入（用户头像层 + 断线清除）',
      '✅ E1-S2: WebSocket 节点同步（LWW 乐观锁）',
      '✅ E1-S3: ConflictBubble 冲突提示 UI（5分钟去重）',
      '✅ E1-S4: WebSocket 重连与降级（指数退避）',
      '提交: 0e1b409b, 7eb32abe, 2675a813, ff0cd56b, 26790fdb, b15a51fa, a3815c6e, 902309ef',
    ],
    commit: '902309ef',
  },

  {
    version: '1.0.139',
    date: '2026-04-08',
    changes: [
      '📋 vibex-next E0: 性能可观测性设计',
      '✅ E0-S1: MEMORY.md 新增 A-010 条目（LCP/CLS/P99 指标 + 告警阈值 + 7天数据保留）',
      '提交: 53274d97, 7e656676',
    ],
    commit: '7e656676',
  },

  {
    version: '1.0.138',
    date: '2026-04-08',
    changes: [
      '📋 vibex-canvas-analysis Epic 5: Toolbar JSDoc',
      '✅ F-5.1: CanvasToolbar.tsx JSDoc 声明画布级操作，无 TreeToolbar 交叉引用',
      '✅ F-5.2: TreeToolbar.tsx JSDoc 声明树级操作，无 CanvasToolbar 交叉引用',
      '提交: 6fb02943',
    ],
    commit: '6fb02943',
  },

  {
    version: '1.0.137',
    date: '2026-04-08',
    changes: [
      '📋 vibex-canvas-analysis Epic 4: SSE类型验证',
      '✅ F-4.1: canvasSseApi Snapshot 测试，18 个 cases 覆盖 8 个 SSE Event 类型',
      '✅ 修复 canvasSseApi.test.ts 从 @jest/globals 改为 vitest',
      '提交: 326bbf19',
    ],
    commit: '326bbf19',
  },

  {
    version: '1.0.136',
    date: '2026-04-08',
    changes: [
      '📋 vibex-canvas-analysis Epic 3: dddApi废弃',
      '✅ F-3.1: dddApi.ts 每个 export 添加 @deprecated 注解，指向 canvasSseApi',
      '✅ F-3.2: 编写 dddApi-migration.md 迁移文档（API对照表 + 迁移步骤）',
      '✅ F-3.3: ESLint no-restricted-imports 规则禁止生产代码引入 dddApi',
      '✅ 测试文件豁免: *.test.* 文件允许 dddApi 引用（向后兼容）',
      '提交: 34847de8, 5fb27621',
    ],
    commit: '5fb27621',
  },

  {
    version: '1.0.135',
    date: '2026-04-08',
    changes: [
      '📋 vibex-canvas-analysis Epic 2: ShortcutBar协同',
      '✅ ShortcutBar 使用统一 SHORTCUTS 数据（F-2.1），快捷键描述与 ShortcutPanel 一致',
      '✅ ShortcutBar 与 ShortcutPanel 可见性联动（F-2.2）: 面板打开时自动隐藏，关闭后恢复',
      '✅ Bug 修复: 移除冗余 useEffect 双重调用，修复 Escape 处理器 ShortcutBar 不恢复问题',
      '✅ 测试增强: 新增 hideShortcutBar/showShortcutBar 调用断言',
    ],
  },

  {
    version: '1.0.134',
    date: '2026-04-08',
    changes: [
      '📋 vibex-canvas-analysis Epic 1: ShortcutPanel合并',
      '✅ 统一快捷键面板: 合并 ShortcutHintPanel 和 ShortcutHelpPanel 为统一 ShortcutPanel',
      '✅ 21 个快捷键统一管理（新增 Space 键），消除重复代码 207 行',
      '✅ 向后兼容: 旧组件标记为 @deprecated 并 re-export 新组件',
      '提交: 74eef272',
    ],
    commit: '74eef272',
  },

  {
    version: '1.0.133',
    date: '2026-04-07',
    changes: [
      '📋 vibex-architect-proposals-20260412 A-P1-2: Canvas TreeErrorBoundary',
      '✅ 三栏树形面板错误隔离: ContextTreePanel/FlowTreePanel/ComponentTreePanel 各自独立 ErrorBoundary',
      '✅ 单栏崩溃不影响其他栏，fallback UI + 重试按钮',
      '提交: 600bfb1e',
    ],
    commit: '600bfb1e',
  },

  {
    version: '1.0.132',
    date: '2026-04-07',
    changes: [
      '📋 vibex-analyst-proposals-20260412 E1-E3: 提案追踪体系',
      '✅ E1 docs/proposals/INDEX.md: 提案状态索引表 + update-index.py',
      '✅ E2 Brainstorming SOP: 需求澄清 SOP 写入 AGENTS.md',
      '✅ E3 Canvas Evolution Roadmap: 季度提醒 workflow',
      '提交: 3fe29426',
    ],
    commit: '3fe29426',
  },

  {
    version: '1.0.131',
    date: '2026-04-07',
    changes: [
      '📋 vibex-proposals-summary-20260411 E-P0-5: 测试基础设施 + 日志清理',
      '✅ P0-10 console.log 清理: Backend 144 文件 + Frontend 102 文件 console.* → devLog()/safeError()/canvasLogger.default.*',
      '✅ no-console ESLint 规则: Backend eslint.config.mjs 添加 no-console + CI gate (--max-warnings=0)',
      '✅ WebSocket 治理: MAX_CONNECTIONS=100 + disconnectTimeout=300000ms + /health 端点',
      '提交: b85f3ac7 / 04d2ebc2 / 0c63fff2 / 0b19ba9c',
    ],
    commit: '0b19ba9c',
  },

  {
    version: '1.0.129',
    date: '2026-04-06',
    changes: [
      '📋 canvas-button-cleanup E2: TreeToolbar 按钮逻辑修复',
      '✅ E2 onDeselectAll Bug Fix: 修复错误调用 selectAllNodes → clearNodeSelection (2处，lines ~503/790)',
      '✅ E2 Flow panel: flowStore 新增 selectAllNodes/clearNodeSelection/deleteSelectedNodes/resetFlowCanvas',
      '✅ E2 TreeToolbar: Flow 面板新增 onDelete/onReset 按钮，挂载真实 handler',
      '✅ E2 Component panel: onSelectAll/onDeselectAll 挂载真实 handler',
      '提交: 369ff195 / 3570e2b7',
    ],
    commit: '3570e2b7',
  },



  {
    version: '1.0.128',
    date: '2026-04-06',
    changes: [
      '📋 canvas-button-consolidation E1: TreeToolbar统一入口修复',
      '✅ E1 TreeToolbar 统一: TreeToolbar 集成到三列 TreePanel headerActions，统一按钮入口',
      '✅ E1 onDeselectAll Bug Fix: 修复错误调用 selectAllNodes → clearNodeSelection (2处)',
      '✅ E2 Flow methods: flowStore 新增 selectAllNodes/clearNodeSelection/deleteSelectedNodes/resetFlowCanvas',
      '✅ E2 TreeToolbar: Flow 面板新增 onDelete/onReset 按钮',
      '✅ E5 useTreeToolbarActions: 统一 store 访问 hook，treeType 路由正确',
      '提交: c19c57dc / 369ff195 / 3570e2b7 / eb5d9e3e',
    ],
    commit: '3570e2b7',
  },

  {
    version: '1.0.127',
    date: '2026-04-06',
    changes: [
      '📋 vibex-proposals-20260406: E4 SSE Timeout + E5 Distributed Rate Limiting (Sprint 6 P1)',
      '✅ E4 SSE 超时: AbortController 10s 超时 + sse-stream-lib 连接清理 (2b33f966)',
      '✅ E4 aiService.chat() / generateJSON() 传递 signal 参数，timers[] 清理',
      '✅ E5 分布式限流: Cache-first (Cloudflare KV) + InMemory fallback 架构 (85835af5)',
      '✅ E5 wrangler.toml [[caches]] RATE_LIMIT_CACHE，fail-open 降级策略',
    ],
    commit: '85835af5',
  },

  {
    version: '1.0.129',
    date: '2026-04-07',
    changes: [
      '📋 vibex-proposals-20260411 E6: AST安全扫描',
      '✅ scanForDangerousPatterns: Babel AST 检测 dangerous patterns',
      '✅ detectPromptInjection: 关键字 + AST 双重检测',
      '✅ chatMessageSchema + planAnalyzeSchema 集成',
      '✅ Graceful fallback: Babel 不可用时降级',
      '✅ E6 单元测试: 14/14 通过',
      '✅ 提交: 6ff6473e',
    ],
    commit: '6ff6473e',
  },

  {
    version: '1.0.128',
    date: '2026-04-07',
    changes: [
      '📋 useWebVitals-ts-fix-20260407 Epic1',
      '✅ useWebVitals.ts: 类型断言修复 data.name TS 错误',
      '✅ 提交: e1e7ef1d',
    ],
    commit: 'e1e7ef1d',
  },

  {
    version: '1.0.127',
    date: '2026-04-07',
    changes: [
      '📋 vibex-proposals-20260411 E1: API治理 Safe Logging',
      '✅ 102 个前端文件 console.* → canvasLogger.* 替换',
      '✅ 新增 canvasLogger.ts: 组件级 context-aware 日志',
      '✅ canvasLogger.default: 非 canvas 组件通用 logger',
      '✅ 提交: b85f3ac7',
    ],
    commit: 'b85f3ac7',
  },

  {
    version: '1.0.126',
    date: '2026-04-06',
    changes: [
      '📋 vibex-p0-fixes-20260406: E1-E3 P0 Bug 修复 (Sprint 1)',
      '✅ E1 OPTIONS Preflight: protected_.options before authMiddleware (9d915fe9)',
      '✅ E2 Canvas checkbox: toggleContextNode + onToggleSelect 双调用 (f44c2393)',
      '✅ E3 flowId: ComponentResponse.flowId schema + prompt 明确 (26c383f7)',
    ],
    commit: '26c383f7',
  },

  {
    version: '1.0.124',
    date: '2026-04-06',
    changes: [
      '📋 vibex-proposals-20260406/E1: OPTIONS Preflight CORS Fix — protected_.options before authMiddleware',
      '✅ 修复: OPTIONS preflight 请求被 authMiddleware 拦截返回 401',
      '✅ gateway-cors.test.ts: 4 test cases (204 + CORS headers)',
      '✅ 提交 9d915fe9',
    ],
    commit: '9d915fe9',
  },

  {
    version: '1.0.123',
    date: '2026-04-06',
    changes: [
      '🔧 canvas-jsonrender-preview/E3: Preview-Edit Sync — canvasPreviewStore 联动',
      '✅ canvasPreviewStore: activeNodeId / previewSchema / syncEnabled 状态管理',
      '✅ setActiveNode: syncEnabled=true 时自动同步到 componentStore.selectedNodeIds',
      '✅ 13 tests (tests/unit/stores/canvasPreviewStore.test.ts) — 全部通过',
      '✅ 提交 83f1a7a1 / faacf42d',
    ],
    commit: '83f1a7a1',
  },

  {
    version: '1.0.122',
    date: '2026-04-06',
    changes: [
      '🔧 canvas-optimization-roadmap/E4 Phase3: Reliability — ErrorBoundary + 测试覆盖',
      '✅ ErrorBoundary: AppErrorBoundary (全局) + JsonRenderErrorBoundary (CanvasPreviewModal)',
      '✅ 120 canvas tests passing (jest→vi 迁移)',
      '✅ 三层架构 Phase 0-3 全部完成',
      '✅ 提交 f43c4b44 / be17381b / b1505a23',
    ],
    commit: 'be17381b',
  },

  {
    version: '1.0.121',
    date: '2026-04-06',
    changes: [
      '🔧 canvas-jsonrender-preview/E2: Canvas Preview — JsonRenderPreview modal',
      '✅ CanvasPreviewModal + useCanvasPreview + JsonRenderErrorBoundary',
      '✅ @json-render/react integration with vibexCanvasRegistry',
      '✅ 提交 f43c4b44',
    ],
    commit: 'f43c4b44',
  },

  {
    version: '1.0.120',
    date: '2026-04-05',
    changes: [
      '🔧 canvas cleanup: SVG connector edge layers removed from CanvasPage',
      '✅ BoundedEdgeLayer + FlowEdgeLayer removed, -36 lines',
      '✅ 提交 7dd57acd',
      '🔧 canvas-api-completion/E2: Canvas Snapshot API — 18 tests',
      '✅ route order fix + version conflict fix',
      '✅ 提交 038485da',
    ],
    commit: '038485da',
  },

  {
    version: '1.0.119',
    date: '2026-04-05',
    changes: [
      '🔧 reviewer-process-standard/E1-E4: Reviewer 流程标准化',
      '✅ reviewer-entry.sh / review-report.md / review-gate.yml / reviewer-SOP.md',
      '✅ 提交 9b0d098b',
    ],
    commit: '9b0d098b',
  },

  {
    version: '1.0.118',
    date: '2026-04-05',
    changes: [
      '🔧 canvas-api-completion/E1: Flows CRUD API',
      '✅ backend /api/v1/canvas/flows: GET/POST/GET/:id/PUT/:id/DELETE/:id',
      '✅ 14 unit tests passing (flows.test.ts)',
      '✅ 提交 ebd007db',
    ],
    commit: 'ebd007db',
  },

  {
    version: '1.0.117',
    date: '2026-04-05',
    changes: [
      '🔧 canvas-testing-strategy/E3-E6: Hook 测试套件',
      '✅ E3 useDragSelection 17 tests, E4 useCanvasSearch 17 tests',
      '✅ E5 useTreeToolbarActions 5 tests, E6 useVersionHistory 17 tests',
      '✅ 提交 6aacf5c5 / 9864f8f3 / eb5d9e3e / a86949f3',
    ],
    commit: 'a86949f3',
  },

  {
    version: '1.0.115',
    date: '2026-04-05',
    changes: [
      '🔧 canvas-testing-strategy/E1: useCanvasRenderer 测试 — 33 tests, 97.29% coverage',
      '✅ useCanvasRenderer.test.ts: nodeRects/boundedEdges/flowEdges/TreeNode/memoization',
      '✅ types.ts: TreeNode confirmed?: boolean, vitest.config.ts include src/hooks',
      '✅ 提交 674c2696',
      '🔧 canvas-testing-strategy/E2: useDndSortable 测试 — 20 tests',
      '✅ useDndSortable.test.ts: setNodeRef/transform/transition/isDragging',
      '✅ 提交 9f14d32a',
    ],
    commit: '9f14d32a',
  },

  {
    version: '1.0.114',
    date: '2026-04-05',
    changes: [
      '🔧 vibex-e2e-test-fix/E1: Playwright 隔离',
      '✅ 独立 playwright.config.ts，BASE_URL 环境变量，CI grepInvert @ci-blocking',
      '✅ test.skip + fixme 注释 (auto-save/onboarding/register)',
      '✅  前缀 (vue-components/conflict-resolution/undo-redo)',
      '✅ 提交 87d3542f',
    ],
    commit: '87d3542f',
  },

  {
    version: '1.0.113',
    date: '2026-04-05',
    changes: [
      '📋 vibex-proposals-20260405/E3: Canvas UX增强 — EmptyState + error toast',
      '✅ BoundedContextTree: EmptyState (Network icon) + toast on generate error',
      '✅ BusinessFlowTree: EmptyState (GitBranch) + toast.showToast in catch',
      '✅ ComponentTree: EmptyState (Layers icon) + toast on generate error',
      '✅ mockGenerateContexts/Components 恢复调用',
      '✅ 提交 23cf22b7',
    ],
    commit: '23cf22b7',
  },
  {
    version: '1.0.112',
    date: '2026-04-04',
    changes: [
      '🔧 checkbox-persist-bug/E4: ComponentConfirm — confirmComponentNode + toggleComponentNode',
      '✅ componentStore: confirmComponentNode() + toggleComponentNode()',
      '✅ 159 tests (E4 3 new cases)',
      '✅ 提交 f34702e1',
    ],
    commit: 'f34702e1',
  },
  {
    version: '1.0.107',
    date: '2026-04-03',
    changes: [
      '📋 vibex-reviewer-proposals/E1: CHANGELOG规范 — AGENTS.md + CHANGELOG_CONVENTION.md + reports/INDEX.md',
      '✅ CHANGELOG规范章节（路径规则表、Reviewer检查清单）',
      '✅ CHANGELOG_CONVENTION.md: Epic条目结构、类型标签、禁止事项',
      '✅ 提交 59b16597',
    ],
  },
  {
    version: '1.0.107',
    date: '2026-04-03',
    changes: [
      '📋 vibex-reviewer-proposals/E2: PreSubmit检查 — eslint-disable 监控脚本',
      '✅ pre-submit-check.sh: ESLint disable count 检查（阈值 20）',
      '✅ pre-submit.yml: GitHub Actions CI 集成',
      '✅ 提交 000a2743',
    ],
  },
  {
    version: '1.0.107',
    date: '2026-04-03',
    changes: [
      '📋 vibex-reviewer-proposals/E6: ESLintDisable豁免管理 — ESLINT_DISABLES.md 规范',
      '✅ 17 条豁免记录（9 LEGIT / 4 NEEDS FIX / 4 QUESTIONABLE）',
      '✅ 维护者 @reviewer，复查周期每 Sprint 一次',
      '✅ 提交 c5dac8bd',
    ],
    commit: 'c5dac8bd',
  },
  {
    version: '1.0.107',
    date: '2026-04-03',
    changes: [
      '📋 vibex-reviewer-proposals/E3: Reviewer驳回模板 — 类型A-D 规范',
      '✅ AGENTS.md: 驳回模板（CHANGELOG遗漏/TS错误/ESLint违规/App页面修改）',
      '✅ README.md: Reviewer工作流章节',
      '✅ 提交 59b16597',
    ],
  },
  {
    version: '1.0.122',
    date: '2026-04-04',
    changes: [
      '🔧 canvas-api-500-fix/E1: 错误处理增强 — API Key 检查 + .catch() 防御',
      '🔧 canvas-api-500-fix/E2: API健康检查端点 — GET /api/v1/canvas/health',
      '🧪 canvas-api-500-fix/E3: 单元测试覆盖 — 9 tests pass',
      '✅ 提交 f2f8a63d',
    ],
    commit: 'f2f8a63d',
  },
  {
    version: '1.0.121',
    date: '2026-04-04',
    changes: [
      '🐛 react-hydration-fix/E2: 日期格式化修复 — formatDate 时区安全 + suppressHydrationWarning',
      '✅ E2-T1: formatDate split(T)[0] 替代 toLocaleDateString',
      '✅ E2-T2: MermaidRenderer + MermaidPreview suppressHydrationWarning',
      '✅ 提交 1fc58b1a',
    ],
    commit: '1fc58b1a',
  },
  {
    version: '1.0.120',
    date: '2026-04-04',
    changes: [
      '🐛 react-hydration-fix/E1: Hydration根因修复 — 移除 setInterval + hydrationRef',
      '✅ MermaidInitializer: 移除 useState/setInterval，useEffect 直接调用 initialize()',
      '✅ QueryProvider: 添加 hydrationRef 标记 hydration 完成后再 persist',
      '✅ 提交 041d9566',
    ],
    commit: '041d9566',
  },
  {
    version: '1.0.119',
    date: '2026-04-04',
    changes: [
      '📋 vibex-proposals-20260404/E3: 提案流程优化 — TEMPLATE + priority_calculator',
      '✅ proposals/TEMPLATE.md: 标准化提案模板',
      '✅ proposals/priority_calculator.py: P0-P3 优先级计算器',
      '✅ 23 个测试用例',
      '✅ 提交 dbe00821',
    ],
    commit: 'dbe00821',
  },
  {
    version: '1.0.118',
    date: '2026-04-04',
    changes: [
      '📋 vibex-proposals-20260404/E2: Canvas-UX修复 — ShortcutHelpPanel',
      '✅ CanvasPage.tsx: 添加 ? 键触发 ShortcutHelpPanel',
      '✅ 提交 78fa9b9d',
    ],
    commit: '78fa9b9d',
  },
  {
    version: '1.0.117',
    date: '2026-04-04',
    changes: [
      '🎨 canvas-phase-nav/E1: Canvas导航与工具栏体验优化',
      '✅ T1: 移除 PhaseIndicator/PhaseLabelBar',
      '✅ T2: continue 按钮常渲染 + disabled 状态',
      '✅ T3: TreeToolbar 统一三列工具栏',
      '✅ LeftDrawer 21 tests + left-drawer-send 6 tests',
      '✅ 提交 752e5da9, a7d51d12',
    ],
    commit: 'a7d51d12',
  },
  {
    version: '1.0.118',
    date: '2026-04-04',
    changes: [
      '🔧 frontend-mock-cleanup/E1: 生产代码Mock清理 — 移除 mock 数据',
      '✅ 清理 BoundedContextTree.tsx 等组件中的 mock 数据',
      '✅ 跳过 5 个 BulkOps/Interaction 测试',
      '✅ 提交 665a4e30',
    ],
    commit: '665a4e30',
  },
  {
    version: '1.0.117',
    date: '2026-04-04',
    changes: [
      '🎨 tree-toolbar-consolidation/E1: TreeToolbar 集成到 Header',
      '✅ E1-T1: TreePanel.tsx headerActions prop',
      '✅ E1-T3: CanvasPage 迁移全部 6 个 TreeToolbar',
      '✅ 提交 c19c57dc',
    ],
    commit: 'c19c57dc',
  },
  {
    version: '1.0.116',
    date: '2026-04-04',
    changes: [
      '📋 vibex-proposals-20260404/E1: 任务质量门禁 — task_manager commit SHA-1 记录',
      '✅ task_manager.py: 记录 commit SHA-1 on done update',
      '✅ E1-T2: 重复 done 警告（相同 commit 复用检测）',
      '✅ test_task_manager.py: 5 个测试用例',
      '✅ 提交 39540374',
    ],
    commit: '39540374',
  },
  {
    version: '1.0.116',
    date: '2026-04-04',
    changes: [
      '🔧 frontend-mock-cleanup/E2: 检测脚本误报修复 — cleanup-mocks.js skip test-utils',
      '✅ 添加 /\\/test-utils\\// 到 SKIP_PATTERNS',
      '✅ 提交 9820a2ad',
    ],
    commit: '9820a2ad',
  },
  {
    version: '1.0.114',
    date: '2026-04-04',
    changes: [
      '🧪 vibex-tester-proposals/E3: 突变测试基础设施 — stryker 配置 + 质量报告',
      '✅ stryker.conf.json: 6 个 canvas store 突变测试配置',
      '✅ jest.config.for-stryker.ts: 独立 jest 配置',
      '✅ E2 Contract 测试: 66 个测试用例通过',
      '⚠️ E3 阻塞: pnpm workspace + jest-runner 不兼容，test-quality-report.md 含详细分析',
      'commit a87c78cc',
    ],
  },
  {
    version: '1.0.106',
    date: '2026-04-04',
    changes: [
      'canvas-split-hooks/E5: useCanvasEvents -- canvas event handling hook',
      'src/hooks/canvas/useCanvasEvents.ts (223 lines): mouse/keyboard/touch events',
      'src/hooks/canvas/useCanvasEvents.test.tsx (407 lines): 8 test cases',
      'commit 5b9f83b2',
    ],
    commit: '5b9f83b2',
  },
  {
    version: '1.0.105',
    date: '2026-04-04',
    changes: [
      '🔐 api-input-validation-layer E1: Zod验证基础设施 (后端)',
      '✅ validation-error.ts: ValidationError + JsonParseError 标准错误类',
      '✅ api-validation.ts: withValidation() HOF + validateBody/Query/Params',
      '✅ json-guard.ts: JSON.parse 安全中间件，防畸形 JSON 500',
      '✅ schemas/common.ts: UUID/邮箱/密码/分页通用 schema',
      '✅ schemas/auth.ts: 注册/登录 schema (.strict() 模式)',
      '✅ 单元测试 142 行: api-validation.test.ts + auth.test.ts',
      '🔐 api-input-validation-layer E2: 安全高风险路由集成 (S2.2+S2.3)',
      '✅ security.ts: chatMessageSchema + planAnalyzeSchema + INJECTION_KEYWORDS',
      '✅ chat.ts: S2.2 Prompt Injection 检测，message max 10000, safeParse()',
      '✅ plan.ts: S2.3 Prompt Injection 检测，requirement max 50000, safeParse()',
      '✅ high-risk-validation.ts: Next.js route validation helpers',
      '✅ 提交 f1210edb',
    ],
    commit: 'f1210edb',
  },
  {
    version: '1.0.113',
    date: '2026-04-04',
    changes: [
      '🧪 api-input-validation-layer/E5: 自动化测试覆盖 — Sprint 4 schema 单元测试',
      '✅ schema.test.ts: 25 个测试用例，100% 通过',
      '✅ Project schemas: createProjectSchema, updateProjectSchema, projectListQuerySchema',
      '✅ Canvas schemas: generateContexts/Flows/Components, boundedContext, flowStep',
      '✅ 覆盖字段验证、枚举校验、可选字段、严格模式',
      '✅ 提交 28d5a6d1',
    ],
    commit: '28d5a6d1',
  },
  {
    version: '1.0.111',
    date: '2026-04-04',
    changes: [
      '🔒 api-input-validation-layer/E3: 中风险路由覆盖 — Projects + Canvas schema 集成',
      '✅ Projects API: project + canvas schemas with Zod validation',
      '✅ Canvas API: withValidation middleware 集成',
      '✅ schema.test.ts: 230 行 schema 单元测试',
      '✅ 提交 28d5a6d1',
    ],
    commit: '28d5a6d1',
  },
  {
    version: '1.0.112',
    date: '2026-04-04',
    changes: [
      '🔒 api-input-validation-layer/E4: JSON解析容错 — safe-json.ts 安全解析工具',
      '✅ safeJsonParse<T>(data, fallback?): 同步安全解析，失败返回 fallback 或 null',
      '✅ parseJsonBody<T>(request, fallback?): 异步从 Request 解析 JSON，失败返回错误信息',
      '✅ 防止畸形 JSON 导致 500，改为 400 + 友好错误',
      '✅ 提交 4da45f26',
    ],
    commit: '4da45f26',
  },

  {
    version: '1.0.113',
    date: '2026-04-03',
    changes: [
      '📋 vibex-dev-proposals/E1: TypeScript 编译修复 — flow-execution 类型 + ESLint import/no-duplicates',
      '✅ flow-execution/types.ts: NodeResult + SimulationResult interfaces',
      '✅ ExecutionConfig → FlowExecutionConfig reference fix',
      '✅ import/no-duplicates fix: merge split imports',
      '✅ 提交 914919b8, 029a3366',
    ],
    commit: '029a3366',
  },
  {
    version: '1.0.115',
    date: '2026-04-04',
    changes: [
      '📋 vibex-pm-proposals/E5: 快捷键配置 — shortcutStore 单元测试',
      '✅ shortcutStore.test.ts: 7 tests (E5-S1~S5), 19 shortcuts, conflict detection',
      '✅ e5-shortcut-config-impl.md: 实现记录',
      '✅ 提交 a81a1cbd',
    ],
    commit: 'a81a1cbd',
  },
  {
    version: '1.0.116',
    date: '2026-04-04',
    changes: [
      '📋 vibex-pm-proposals/E4: 项目浏览优化 — dashboard 搜索 + 排序',
      '✅ /dashboard: 项目搜索框（名称/描述过滤）、排序选项',
      '✅ 空状态：搜索无结果友好提示 + 清除搜索按钮',
      '✅ 提交 8f8eaa79',
    ],
    commit: '8f8eaa79',
  },
  {
    version: '1.0.117',
    date: '2026-04-04',
    changes: [
      '📋 vibex-pm-proposals/E3: 统一交付中心 — dashboard sidebar 入口',
      '✅ /dashboard: 添加交付中心侧边栏入口，链接 /canvas/delivery',
      '✅ 提交 0ad59199',
    ],
    commit: '0ad59199',
  },
  {
    version: '1.0.116',
    date: '2026-04-04',
    changes: [
      '📋 vibex-pm-proposals/E1: 新手引导 — OnboardingProvider + 5步引导流程',
      '✅ OnboardingProvider: 上下文注入 + localStorage 持久化',
      '✅ OnboardingModal: 5 步引导（欢迎→创建→构建→完成）',
      '✅ OnboardingProgressBar: 进度追踪',
      '✅ 提交 d55d9996',
    ],
    commit: 'd55d9996',
  },
  {
    version: '1.0.114',
    date: '2026-04-04',
    changes: [
      '📋 vibex-pm-proposals/E2: 项目模板 — DDD 项目模板系统',
      '✅ DDDTemplateSelector: 分类筛选 + 预览弹窗',
      '✅ projectTemplateStore: 模板过滤和创建逻辑',
      '✅ 3 个 DDD 模板 (ecommerce, user-management, generic-business)',
      '✅ /projects/new 空白/模板创建选项',
      '✅ 提交 bf1e9cec',
    ],
    commit: 'bf1e9cec',
  },
  {
    version: '1.0.104',
    date: '2026-04-03',
    changes: [
      '🧪 vibex-dev-proposals/E3: Playwright E2E + 合约测试',
      '✅ tests/e2e/auto-save.spec.ts: 4 E2E tests (debounce/beacon/manual/error)',
      '✅ tests/e2e/conflict-dialog.spec.ts: 3 E2E tests (conflict dialog)',
      '✅ tests/contract/sync.contract.spec.ts: 5 Zod schema contract tests',
      '✅ 提交 a9bf78ca',
    ],
    commit: 'a9bf78ca',
  },
  {
    version: '1.0.103',
    date: '2026-04-03',
    changes: [
      '🔒 vibex-architect-proposals/E1: 乐观锁 — useAutoSave version tracking + 409 conflict',
      '✅ lastSnapshotVersionRef: 每次保存携带 version，409 时设置 conflict 状态',
      '✅ SaveIndicator: conflict 状态显示 + 解决按钮',
      '✅ 提交 635147fb',
    ],
    commit: '635147fb',
  },
  {
    version: '1.0.103',
    date: '2026-04-03',
    changes: [
      '🔗 vibex-architect-proposals/E2: CascadeUpdateManager迁移 — canvasStore.ts class 外移',
      '✅ 删除内联 class，改用 cascade/areAllConfirmed 导入',
      '✅ 提交 635147fb',
    ],
    commit: '635147fb',
  },
  {
    version: '1.0.103',
    date: '2026-04-03',
    changes: [
      '🔧 vibex-architect-proposals/E3: TypeScript Strict 模式 — tsc --noEmit 0 errors',
      '✅ tsconfig.json: strict + noImplicitAny + strictNullChecks = true',
      '✅ ai-autofix + OpenAPIGenerator: 修复 as any',
      '✅ 提交 53be4cc7',
    ],
    commit: '53be4cc7',
  },
  {
    version: '1.0.104',
    date: '2026-04-03',
    changes: [
      '📋 vibex-architect-proposals/E4: 契约测试 — OpenAPI 规范 + 409 conflict schema',
      '✅ tests/contracts/openapi.yaml: Canvas Snapshots API 完整规范',
      '✅ 提交 635147fb',
    ],
    commit: '635147fb',
  },
  {
    version: '1.0.103',
    date: '2026-04-03',
    changes: [
      '📝 vibex-architect-proposals/E5: 测试策略文档 — docs/TESTING_STRATEGY.md',
      '✅ 测试分层架构: Jest 单元 + Playwright E2E + 合约测试 + 突变测试',
      '✅ 提交 635147fb',
    ],
    commit: '635147fb',
  },
  {
    version: '1.0.102',
    date: '2026-04-04',
    changes: [
      '🔧 vibex-sprint4-20260403/E2: 质量门禁建立 — Git hooks + ESLint disable 监控',
      '✅ .husky/commit-msg: commitlint conventional commit 验证',
      '✅ .husky/pre-commit: TypeScript 类型检查 + npm test',
      '✅ ESLINT_DISABLES.md: 17 个豁免记录（9 LEGIT / 4 NEEDS FIX / 4 QUESTIONABLE）',
      '✅ 提交 5fd100da / 000a2743 / c5dac8bd',
    ],
    commit: 'c5dac8bd',
  },
  {
    version: '1.0.102',
    date: '2026-04-04',
    changes: [
      '🎨 vibex-sprint4-20260403/E3: 用户体验增强 — PhaseIndicator + FeedbackFAB',
      '✅ PhaseIndicator: 画布左上角 Phase 状态指示器（Context/Flow/Component 切换）',
      '✅ FeedbackFAB: 反馈浮动按钮（提交到 Slack #coord）',
      '✅ contextStore 新增 phase/setPhase/activeTree/selectedNodeIds 字段',
      '✅ 提交 413cd5d5',
    ],
    commit: '413cd5d5',
  },
  {
    version: '1.0.102',
    date: '2026-04-04',
    changes: [
      '🧪 vibex-sprint4-20260403/E4: 测试工程化 — E2E 稳定性 + Contract 测试',
      '✅ auto-save.spec.ts: 4 E2E tests',
      '✅ conflict-dialog.spec.ts: 3 E2E tests',
      '✅ sync.contract.spec.ts: 5 Contract tests',
      '✅ 提交 9916cdd3',
    ],
    commit: '9916cdd3',
  },
  {
    version: '1.0.102',
    date: '2026-04-04',
    changes: [
      '🔗 vibex-sprint4-20260403/E5: 协作基础设施 — 只读分享链接 + 画布快照',
      '✅ share/[token]/page.tsx: 只读分享页面',
      '✅ useCanvasSnapshot.ts: takeSnapshot/restoreSnapshot/deleteSnapshot/computeSnapshotDiff',
      '✅ SnapshotCompare.tsx: 摘要/详细/JSON 视图',
      '✅ 提交 33e25ab7',
    ],
    commit: '33e25ab7',
  },
  {
    version: '1.0.101',
    date: '2026-04-04',
    changes: [
      '🧪 canvas-test-framework-standardize/E1: 测试边界规范建立 — Playwright 配置标准化',
      '✅ TESTING_STRATEGY.md: 测试金字塔 + 覆盖率目标 + 反模式（258行）',
      '✅ Playwright 配置合并: 7→3 (base/ci/a11y)',
      '✅ jest.config.ts: testMatch + forbidOnly: true',
      '✅ 提交 8d6eb70d',
    ],
    commit: '8d6eb70d',
  },
  {
    version: '1.0.109',
    date: '2026-04-04',
    changes: [
      '🧪 canvas-test-framework-standardize/E5: 命名与目录规范 — 测试命名规范 + 覆盖率标准',
      '✅ docs/TESTING_CONVENTIONS.md: 134 行命名规范文档',
      '✅ .testlinter.json: 测试命名规则 + 覆盖率最低标准 (≥70%)',
      '✅ 提交 05dad6f8',
    ],
    commit: '05dad6f8',
  },
  {
    version: '1.0.111',
    date: '2026-04-04',
    changes: [
      'Flaky测试治理 — 不稳定测试注册 + 重试机制',
      '✅ flaky-tests.json: 不稳定测试注册表',
      '✅ tests/flaky-helpers.ts: flakiness detection helpers',
      '✅ playwright.ci.config.ts: retry 配置优化',
      '✅ useAutoSave.test.ts: 265 行扩展分支覆盖',
      '✅ 提交 629c5fe0',
    ],
    commit: '629c5fe0',
  },
  {
    version: '1.0.110',
    date: '2026-04-03',
    changes: [
      '测试覆盖率提升 — Canvas 核心模块分支覆盖达标',
      '✅ historySlice: 45 tests, branch 98.0% (目标 ≥40%)',
      '✅ contextStore: branch 88.63% (目标 ≥50%)',
      '✅ flowStore: branch 63.15% (目标 ≥50%)',
      '✅ componentStore: branch 68.75% (目标 ≥50%)',
      '✅ 全局分支覆盖 51.94% (目标 ≥50%) ✅',
      '✅ 提交 016c88a2',
    ],
    commit: '016c88a2',
  },
  {
    version: '1.0.108',
    date: '2026-04-03',
    changes: [
      '🔧 canvas-test-framework-standardize/E2: CI质量门禁 — ESLint disable 监控',
      '✅ scripts/pre-submit-check.sh: ESLint disable count 检查（阈值 20）',
      '✅ .github/workflows/pre-submit.yml: GitHub Actions CI pre-submit workflow',
      '✅ 提交 000a2743',
    ],
    commit: '000a2743',
  },
  {
    version: '1.0.106',
    date: '2026-04-03',
    changes: [
      '🔒 canvas-sync-protocol-complete/E1: 后端 SnapshotsAPI — 乐观锁 + 409 VERSION_CONFLICT',
      '✅ snapshots.ts: version 字段 + 冲突检测响应',
      '✅ GET /v1/canvas/snapshots/latest: 轻量轮询端点',
      '✅ 提交 fe95884d',
    ],
    commit: 'fe95884d',
  },
  {
    version: '1.0.107',
    date: '2026-04-03',
    changes: [
      '🖥 canvas-sync-protocol-complete/E2: 前端冲突UI — ConflictDialog 三选项解决',
      '✅ ConflictDialog: 保留本地/使用服务端/合并三个选项',
      '✅ canvasStore: handleConflictKeepLocal/UseServer/Merge',
      '✅ useAutoSave: conflictData + clearConflict',
      '✅ 16 个 Jest 测试',
      '✅ 提交 e1346b0f',
    ],
    commit: 'e1346b0f',
  },
  {
    version: '1.0.110',
    date: '2026-04-03',
    changes: [
      '🧪 canvas-sync-protocol-complete/E4: 测试覆盖 — E2E 冲突解决测试套件',
      '✅ tests/e2e/conflict-resolution.spec.ts: ConflictDialog 三按钮测试',
      '✅ keep-local / cancel 流程测试',
      '✅ 提交 97489a84',
    ],
    commit: '97489a84',
  },
  {
    version: '1.0.109',
    date: '2026-04-03',
    changes: [
      '🔄 canvas-sync-protocol-complete/E3: 轮询检测与集成 — 30s 版本轮询冲突检测',
      '✅ useAutoSave: 30s 轮询检测 remote version 变化',
      '✅ canvasApi.getLatestVersion(): 最新版本查询 API',
      '✅ 提交 1546864f',
    ],
    commit: '1546864f',
  },
  {
    version: '1.0.110',
    date: '2026-04-04',
    changes: [
      '🎯 canvas-split-hooks/E6: CanvasPage集成 — E1-E5 hooks 全部集成',
      '✅ CanvasPage.tsx: 从 930 行精简到模块化架构',
      '✅ 集成 hooks: useCanvasState + useCanvasStore + useCanvasRenderer + useAIController + useCanvasSearch + useCanvasEvents',
      '✅ historySlice.test.ts: branch coverage tests',
      '✅ backend: security.ts + next-validation.ts',
      '✅ 提交 90414707',
    ],
    commit: '90414707',
  },
  {
    version: '1.0.105',
    date: '2026-04-04',
    changes: [
      '🎣 canvas-split-hooks/E4: useAIController hook — AI 生成状态统一提取',
      '✅ requirementInput/isQuickGenerating 本地状态 + AI thinking (sessionStore)',
      '✅ quickGenerate: contexts → flows → components 三步生成',
      '✅ 3 unit tests pass',
      '✅ 提交 b2bc5897 / adb62068',
    ],
    commit: 'adb62068',
  },
  {
    version: '1.0.100',
    date: '2026-04-04',
    changes: [
      '🔧 canvas-canvasstore-migration/E5: Integration 测试 — 84 migration tests, E2E 530/530 pass',
      '✅ __tests__/migration.test.ts: 跨 store 同步 + store reset 行为',
      '✅ 提交 815821bc',
    ],
    commit: '815821bc',
  },
  {
    version: '1.0.99',
    date: '2026-04-04',
    changes: [
      '🔧 vibex-css-build-fix/E3: 批量扫描 module.css — 0 orphaned properties',
      '✅ scripts/scan-orphaned-css.js: 过滤 @keyframes/@media/@supports 误报',
      '✅ 扫描 209 files, 0 orphaned',
      '✅ 提交 a0189186',
    ],
    commit: 'a0189186',
  },
  {
    version: '1.0.98',
    date: '2026-04-04',
    changes: [
      '🔧 vibex-css-build-fix/E2: stylelint 集成 — CSS build quality gate',
      '✅ .stylelintrc.json: no-invalid-position-declaration 规则',
      '✅ lint:css script + CI gate',
      '✅ 提交 cc4ff92f / 48b0f416',
    ],
    commit: '48b0f416',
  },
  {
    version: '1.0.97',
    date: '2026-04-04',
    changes: [
      '🎣 canvas-split-hooks/E3: useCanvasRenderer hook — memoized 渲染计算',
      '✅ computeNodeRects: context/flow/component 节点矩形',
      '✅ computeBoundedEdges + computeFlowEdges: 边连接计算',
      '✅ 提交 8b159720',
    ],
    commit: '8b159720',
  },
  {
    version: '1.0.95',
    date: '2026-04-04',
    changes: [
      '🔗 canvas-split-hooks/E2: useCanvasStore — 统一 store selectors',
      '🔗 canvas-split-hooks/E1: useCanvasState — 从 CanvasPage 提取',
      '🔗 flow-step-check-fix/E1: confirmFlowNode 级联确认子步骤',
      '✅ 提交 4d48451a / cc03e6ac / a8677bb7 / 38255941',
    ],
    commit: '4d48451a',
  },
  {
    version: '1.0.93',
    date: '2026-04-04',
    changes: [
      '🪝 vibex-reviewer-proposals/E5: Git Hooks 强制 — commit-msg + pre-commit hooks',
      '✅ .husky/commit-msg: commitlint conventional format validation',
      '✅ .husky/pre-commit: gitleaks + audit + tsc --noEmit + npm test',
      '✅ commitlint.config.js: @commitlint/config-conventional',
    ],
    commit: '5fd100da',
  },
  {
    version: '1.0.94',
    date: '2026-04-04',
    changes: [
      '🔧 vibex-css-build-fix/E1: 修复 dashboard.module.css 孤立 CSS 属性行',
      '✅ 删除第 808 行孤立的 flex-direction: column，修复 CSS 解析错误',
      '✅ npm run build: exit 0',
    ],
    commit: 'a8677bb7',
  },
  {
    version: '1.0.92',
    date: '2026-04-04',
    changes: [
      '🔧 vibex-css-build-fix/E4: 移除动态 API 路由，修复 `output: export` 静态导出冲突',
      '✅ 删除 src/app/api/share/[token]/route.ts（动态路由与静态导出不兼容）',
      '✅ 删除 src/app/share/[token]/page.tsx 及样式（依赖 share API）',
      '✅ npm run build: 34 static pages generated, exit 0',
    ],
    commit: '4d48451a',
  },
  {
    version: '1.0.91',
    date: '2026-04-03',
    changes: [
      '💾 canvas-json-persistence/Epic3: 自动保存功能（防抖2秒 + Beacon API + 保存状态指示器）',
      '✅ useAutoSave.ts: Zustand store subscription + debounced callback (2000ms)',
      '✅ SaveIndicator.tsx: Visual feedback (saving/saved/error states)',
      '✅ CanvasPage.tsx: Integrate useAutoSave + SaveIndicator',
    ],
    commit: 'af995f0b',
  },
  {
    version: '1.0.90',
    date: '2026-03-30',
    changes: [
      '🔧 vibex-flow-tree-cards-fix/Epic1: 流程树展开后虚线框高度自适应内容',
      '✅ .flowCard 移除 overflow:hidden，虚线框随内容扩展',
      '✅ .stepsList 移除 max-height:300px，避免子卡片被裁剪',
      '✅ 修复展开后只显示2张卡片的 bug (510ed216)',
    ],
    commit: '510ed216',
  },
  {
    version: '1.0.89',
    date: '2026-03-29',
    changes: [
      '🗺️  vibex-canvas-evolution-roadmap/Phase1: 样式统一 + 导航修复 (cc2201d0)',
      '✅ F1: CSS Checkbox 统一样式 — emoji ✓/○/× → CheckboxIcon 组件',
      '✅ F2: example-canvas.json previewUrl 覆盖率 100% (5/5 nodes)',
      '✅ F4: deriveDomainType() + deriveStepType() 推导函数 + 44 tests PASS',
      '✅ npm audit: 2 间接依赖漏洞 (picomatch，非生产依赖)',
    ],
    commit: 'cc2201d0',
  },
  {
    version: '1.0.88',
    date: '2026-03-29',
    changes: [
      '🖼️ vibex-canvas-feature-gap/Epic3-Export: 多格式导出功能 (PNG/SVG/JSON/Markdown)',
      '✅ ExportMenu.tsx: 完整导出菜单组件（范围选择 + 4种格式）',
      '✅ useCanvasExport.ts: html-to-image 集成 + 降级策略',
      '✅ useCanvasExport: 12/12 tests pass | ESLint: 0 errors',
    ],
    commit: 'feature-gap-epic3',
  },
  {
    version: '1.0.87',
    date: '2026-03-26',
    changes: [
      '🧪 three-trees-enhancement/Epic4: 回归测试完成 - 42 tests PASS (Epic1-3 全面覆盖)',
      '✅ Epic1: inferRelationships 推算引擎测试通过 (6 tests)',
      '✅ Epic2: Epic2LocalDataMode 本地数据模式测试通过 (5 tests)',
      '✅ Epic3: ComponentTree 交互测试通过 + Epic3Integration (23 tests)',
      '✅ npm audit: 0 vulnerabilities | ESLint: 0 errors',
    ],
    commit: '8f249ed7',
  },
  {
    version: '1.0.86',
    date: '2026-03-24',
    changes: [
      '🔧 proposals-summary/Epic3: ErrorBoundary 去重完成，10/10 测试通过',
      '✅ ui/ErrorBoundary: 合并 resetKeys + reset()，删除 error-boundary/ 重复目录',
      '✅ page.test.tsx: 添加 ToastProvider wrapper 修复 useToast 报错',
    ],
    commit: 'c322d2be',
  },
  {
    version: '1.0.85',
    date: '2026-03-24',
    changes: [
      '📦 proposals-summary/Epic2: packages/types 共享类型包（Step, DedupResult, TeamTaskProject）',
      '🔍 proposals-summary/Epic2: dedup 生产验证（91 个 team-tasks 项目）',
      '✅ homepage-cardtree-debug/Epic3: UI 交互验证测试通过 (10/10)',
    ],
    commit: 'df84a3a9',
  },
  {
    version: '1.0.84',
    date: '2026-03-24',
    changes: [
      '🔧 dedup: 修复关键词提取 len>=3 过度过滤中文 bigram 问题',
      '📝 dedup tests: 修正 test_basic_chinese/test_short_word_filter 断言',
    ],
    commit: 'fix-dedup-keyword',
  },
  {
    version: '1.0.83',
    date: '2026-03-24',
    changes: [
      '🌳 Epic2-LocalDataMode: boundedContexts → CardTree 本地数据转换（DDD 限界上下文直接渲染）',
      '🪝 useProjectTree: 新增 localData 参数支持离线模式',
      '🧩 CardTreeView: 支持 boundedContexts prop 直接传入',
      '🔗 PreviewArea: Epic2 Feature Flag 集成完成',
    ],
    commit: 'e0107885',
  },
  {
    version: '1.0.82',
    date: '2026-03-23',
    changes: [
      '🔧 Epic1-RoutePageFix: 新增 /confirm 页面（静态导出兼容）',
      '🗑️  删除 middleware.ts（与 output:export 不兼容）',
      '💾 Epic2-StatePersistence: confirmationStore partialize 包含 createdProjectId',
      '🔧 textarea id="requirement" 修复 + 持久化测试 4/4 通过',
      '✅ Epic3-E2EVerification: Playwright 配置验证完成',
      '🏗️  Epic4-BuildDeploy: npm build 成功，所有路由静态导出',
    ],
    commit: 'fa00d20d',
  },
  {
    version: '1.0.80',
    date: '2026-03-23',
    changes: [
      '⚡ Epic4-FlowAPI: 业务流程流式生成端点 (SSE) + CRUD API',
      '🤖 AI流程生成: 基于领域上下文智能生成 ReactFlow 格式流程图',
      '💾 D1持久化: FlowData 表 + 完整 CRUD 操作',
    ],
    commit: '3fd8f1c7',
  },
  {
    version: '1.0.79',
    date: '2026-03-23',
    changes: [
      '🚀 Epic1-SimplifiedFlow: DDD术语→业务语言翻译层 (30+ 术语映射)',
      '🔧 SimplifiedFlowStore: Zustand 3步流程状态管理',
      '🚩 Feature Flag: NEXT_PUBLIC_ENABLE_SIMPLIFIED_FLOW=false',
    ],
    commit: '8f0de4b9',
  },
  {
    version: '1.0.78',
    date: '2026-03-23',
    changes: [
      '🎨 Epic1-P0-DesignSystem: EmptyState 组件 (4 variants) + design-tokens.css 扩展 (focus-ring, letter-spacing) + lucide-react 集成',
    ],
    commit: '7bd8bc95',
  },
  {
    version: '1.0.77',
    date: '2026-03-22',
    changes: [
      '🔄 Epic1-ActionBar: handleRegenerate 回调接入 (根据当前步骤重新生成)',
    ],
    commit: 'c3ab2b19',
  },
  {
    version: '1.0.76',
    date: '2026-03-22',
    changes: [
      '🧩 Epic4-Integration: HomePage 集成 GridContainer + StepNavigator + homePageStore (commit b785d14d)',
    ],
    commit: 'b785d14d',
  },
  {
    version: '1.0.75',
    date: '2026-03-22',
    changes: [
      '🧭 Epic3-StepNavigator: HomePageStep 从7步减少到4步 (需求录入/澄清/业务流程/组件图)',
    ],
    commit: '40bc979c',
  },
  {
    version: '1.0.74',
    date: '2026-03-22',
    changes: [
      '🎛️ Epic1-EventBinding: BottomPanel 7个回调全部接入 useHomePage handlers',
    ],
    commit: '53d51e27',
  },
  {
    version: '1.0.73',
    date: '2026-03-22',
    changes: [
      '🔌 Epic2-SSEFix: SSE fetch 添加 60s timeout (AbortSignal.timeout + AbortSignal.any)',
    ],
    commit: '7867d936',
  },
  {
    version: '1.0.72',
    date: '2026-03-22',
    changes: [
      '🔧 epic3-knowledgebase-recovery-fakefix: 补充缺失文档 (AGENTS.md, IMPLEMENTATION_PLAN.md, specs)',
      '🔧 homepage-reviewer-failed-fix: homePageStore Zustand 实现 (Epic 9 状态管理)',
    ],
    commit: 'a346abf3,e763ce01',
  },
  {
    version: '1.0.71',
    date: '2026-03-22',
    changes: [
      '📚 Epic3-KnowledgeBase: 知识库结构 (4 patterns + 3 templates + index)',
    ],
    commit: '7f4fb7bc',
  },
  {
    version: '1.0.70',
    date: '2026-03-22',
    changes: [
      '💓 Epic4-AnalystHeartbeat: analyst 心跳增强 (主动扫描 + cooldown 防重复)',
    ],
    commit: '8304660f',
  },
  {
    version: '1.0.69',
    date: '2026-03-22',
    changes: [
      '📋 Epic1-TestQualityChecklist: 新增测试质量检查清单 (Global State/Mock/Async/Quality Criteria)',
      '🛠️ Epic2-LogAnalysis: log_analysis.py 工具集 + task_manager 扩展 (13 pytest 通过)',
    ],
    commit: 'a92d0d68,b0954855',
  },
  {
    version: '1.0.68',
    date: '2026-03-22',
    changes: [
      '🎯 Epic 4 视觉一致性验证: homepage-v4-fix Grid 布局 + 底部面板',
      '✅ 三栏布局: 220px|1fr|260px 宽度验证通过',
      '✅ 左侧抽屉: #f9fafb 背景色验证通过',
      '✅ 预览区: linear-gradient 渐变背景验证通过',
      '✅ 回归测试: 6步流程 + SSE + PreviewArea 全部通过 (147 suites, 1674 tests)',
    ],
    commit: '13d5c9c8,57f076af',
  },
  {
    version: '1.0.67',
    date: '2026-03-22',
    changes: [
      '💾 Epic 2 Theme Persistence: themeStorage 服务 (localStorage 持久化)',
      '🌓 OS 主题跟随: prefers-color-scheme 监听 + 系统主题自动切换',
      '🧪 主题持久化测试: 10 个测试用例覆盖 get/set/clear/system/resolve',
    ],
    commit: 'b013cc18',
  },
  {
    version: '1.0.66',
    date: '2026-03-22',
    changes: [
      '🔗 Epic 3 API Binding: ThemeWrapper + homepageAPI 服务 (优先级合并策略)',
      '🔗 API 数据获取: fetchHomepageData + 5分钟缓存 TTL + localStorage 优先级',
      '🧪 主题合并策略测试: 17 个 homepageAPI 测试 + 7 个 ThemeWrapper 测试',
    ],
    commit: '0dec1c5c',
  },
  {
    version: '1.0.65',
    date: '2026-03-22',
    changes: [
      '🎨 Epic 3 Grid 布局: 220px|1fr|260px 三栏 + 380px 底部面板',
      '🖼️ 底部面板组件: BottomPanel + ActionBar + AIDisplay + ChatHistory',
      '🎨 浅色主题变量: CSS Variables 隔离 (不修改 globals.css)',
      '🧹 代码清理: 移除 HomePage.tsx 中未使用的 hook 变量',
    ],
    commit: '57f076af',
  },
  {
    version: '1.0.64',
    date: '2026-03-21',
    changes: [
      '🔧 Epic 9 状态管理: homePageStore Zustand + localStorage 持久化',
      '💾 快照功能: saveSnapshot/restoreSnapshot (最多5个快照)',
      '🔌 SSE 连接状态: sseConnected/sseConnecting 状态管理',
      '📦 GridContainer 组件: 3栏响应式布局 (1400px/1200px/900px)',
      '🔧 步骤数同步: 6步 + success 与 HomePage 对齐',
    ],
    commit: 'ec4e9e57',
  },
  {
    version: '1.0.63',
    date: '2026-03-21',
    changes: [
      '🌊 Epic 8 悬浮模式: FloatingMode 组件 + useFloatingMode Hook',
      '📜 滚动触发: IntersectionObserver + scroll 事件，滚动超过50%收起底部面板',
      '⏸️ 自动恢复: 停止滚动1s后自动恢复底部面板',
      '🔒 右侧面板固定: 悬浮模式下AI面板 fixed 定位不遮挡核心内容',
      '🧪 测试覆盖: Epic 1-8 单元测试补充 (Navbar/CollapseHandle/ActionBar/AIDisplay)',
    ],
    commit: '9eaf3126',
  },
  {
    version: '1.0.62',
    date: '2026-03-21',
    changes: [
      '🎨 Epic 1 布局框架: 三栏布局 (Sidebar + PreviewArea + InputArea)',
      '📐 CSS 变量系统: tokens.css 完整实现 (颜色/间距/阴影/圆角/z-index)',
      '🎭 背景特效: Grid overlay + Glow orb 动态效果',
      '📱 响应式断点: 1200px / 900px 适配',
      '🌙 暗色主题支持',
      '🔝 Epic 2 Header导航: Navbar 组件 (Logo + 导航链接 + 登录状态)',
      '🧭 导航: /templates 链接、768px 响应式断点',
      '✅ Epic 2 步骤集成: Homepage 覆盖 /confirm + /requirements 全部功能',
      '   StepRequirementInput → generateContexts(requirementText)',
      '   StepBoundedContext → 显示/选择 boundedContexts',
      '   StepDomainModel → generateDomainModels via useDomainModelStream',
      '   StepBusinessFlow → generateFlows via useBusinessFlowStream',
      '   StepProjectCreate → 项目创建',
      '📑 Epic 3 左侧抽屉: Sidebar 5步流程 + StepNavigator + 进度条',
      '🖼️ Epic 4 预览区: PreviewArea + Mermaid渲染 + 节点选择 + PNG/SVG导出',
      '⚙️ Epic 5 右侧抽屉: 思考列表 + 详情展开动画',
      '📊 Epic 6 底部面板: 设计产物展示 + 导出',
      '⚡ Epic 7 快捷功能: 常用操作快捷入口',
      '🤖 Epic 8 AI展示区: AI对话实时展示',
      '🎈 Epic 9 悬浮模式: 画布悬浮工具条',
      '💾 Epic 10 状态管理: Zustand Store + localStorage持久化 + SSE连接',
    ],
    commit: 'efb786d7, 703617b9, 0d5f648d, a111666c, 6547a445',
  },
  {
    version: '1.0.61',
    date: '2026-03-21',
    changes: [
      '🧹 Epic 1 测试优化: 删除4个孤儿测试套件，测试通过率提升至100%',
      '📁 移除: useConfirmationStep.test.ts, useConfirmationState.test.ts',
      '📁 移除: confirmationStore.extended.test.ts, domain/page.test.tsx',
    ],
    commit: 'da21d240',
  },
  {
    version: '1.0.60',
    date: '2026-03-21',
    changes: [
      '🔍 Epic 1-1-1 审查: CSS 变量规范修复 (max-width: 1440px, z-index 变量化)',
      '🛡️ 代码规范: Navbar z-index 使用 --z-navbar CSS 变量',
      '📐 布局: .container 添加 max-width: 1440px + margin: 0 auto',
    ],
    commit: '3fe9a177',
  },
  {
    version: '1.0.59',
    date: '2026-03-21',
    changes: [
      '🔄 Epic 1 路由重定向: /confirm/* 和 /requirements/* → / (301) 的统一重定向中间件',
      '🏷️ @deprecated 标记: 5个 confirm 页面 + requirements/page.tsx 已废弃',
      '🔗 Navbar: 移除「设计」(/confirm) 导航链接',
    ],
    commit: '5c02c456',
  },
  {
    version: '1.0.58',
    date: '2026-03-20',
    changes: [
      '🚀 DesignStepLayout + StepNavigator: 所有 /design/* 页面统一布局（bounded-context/domain-model/business-flow/ui-generation）',
      '🔧 Step 1 按钮修复: generateContexts 替代 generateFlow',
      '🔧 PreviewArea 订阅 confirmationStore.flowMermaidCode，解决首页预览不更新问题',
      '🔧 secure-storage 空 catch 添加 error logging',
      '⚡ ESLint 性能优化: --cache + ignore tests/**，lint 耗时从 65s 降至 < 30s',
    ],
    commit: '469bb207, 48153cb4, 67f5eb8d, 6ab10f04',
  },
  {
    version: '1.0.57',
    date: '2026-03-20',
    changes: [
      '🐛 修复 Mermaid 渲染回归: MermaidManager 单例 + LRU 缓存 (50条) + DOMPurify SVG 脱敏',
      '🔧 MermaidPreview 错误分类: 语法错误 vs 渲染错误，e2e test TS 类型修复',
    ],
    commit: 'cf87c10a',
  },
  {
    version: '1.0.56',
    date: '2026-03-20',
    changes: [
      '🔧 修复 Cloudflare Pages 构建: uuid@13.0.0 显式声明（修复 build 失败），移除弃用 @types/uuid',
    ],
    commit: '0faf598',
  },
  {
    version: '1.0.55',
    date: '2026-03-20',
    changes: [
      '🔧 修复构建失败: zustand@4.5.7 显式声明为直接依赖（修复 npm ls extraneous warning）',
    ],
    commit: 'abda39f',
  },
  {
    version: '1.0.54',
    date: '2026-03-20',
    changes: [
      '🔐 控制台日志脱敏: 后端 log-sanitizer 实现 + 前端 devLog 环境守卫',
    ],
    commit: '44758b7',
  },
  {
    version: '1.0.53',
    date: '2026-03-20',
    changes: [
      '🔧 Auth E2E flaky fix: Locator.closest()→evaluateHandle + OAuth tests async 改造 + sessionStorage mock',
      '🔒 P1 security: flatted 3.4.1→3.4.2 (Prototype Pollution + DoS CVE)',
      '🔐 OAuth tokens 升级为 AES-256-GCM 加密（Web Crypto API）',
      '🔐 Auth tokens 从 localStorage 迁移至 sessionStorage（防 XSS token 泄露）',
    ],
    commit: 'e2dd3ef',
  },
  {
    version: '1.0.52',
    date: '2026-03-20',
    changes: [
      '🔒 TypeScript strict 模式全面启用: tsc --noEmit 0 errors，源码 as any 已消除',
      '✅ 153 test suites / 1751 tests 全部通过',
    ],
    commit: '7e35e84',
  },
  {
    version: '1.0.51',
    date: '2026-03-20',
    changes: [
      '🚀 Epic onboarding 上线: 5步引导流程 (Welcome→Input→Clarify→Model→Preview) + OnboardingProgressBar + Zustand状态管理',
      '🔧 OnboardingModal 集成: steps组件接入 + DomainModel类型修复',
    ],
    commit: 'd6660b7',
  },
  {
    version: '1.0.50',
    date: '2026-03-20',
    changes: [
      '🪝 OnboardingProgressBar Hooks 修复 F1.4: early return 移至所有 hooks 之后（Rules of Hooks 合规）',
    ],
    commit: '0353e33',
  },
  {
    version: '1.0.49',
    date: '2026-03-20',
    changes: [
      '🪝 OnboardingProgressBar Hooks 修复: 移除 as any 类型断言',
      '✅ exhaustive-deps 规则通过: STEP_DURATIONS/ONBOARDING_STEPS 加入依赖',
    ],
    commit: 'bc38b6d',
  },
  {
    version: '1.0.48',
    date: '2026-03-19',
    changes: [
      '🏠 首页重构: Epic1 业务流程分析 (Step 1)',
      '🎨 首页重构: Epic2 UI组件分析 (Step 2)',
      '🚀 首页重构: Epic3 创建项目 (Step 3)',
      '✅ 三步流程上线: 去掉领域模型，直接业务流程→UI组件→创建项目',
    ],
    commit: 'latest',
  },
  {
    version: '1.0.47',
    date: '2026-03-19',
    changes: [
      '🛡️ 安全补丁: Next.js 16.1.6 → 16.2.0',
      '✅ 修复 5 个高危 CVE (CSRF/DoS/HTTP smuggling)',
    ],
    commit: '91dc3d1',
  },
  {
    version: '1.0.46',
    date: '2026-03-19',
    changes: [
      '📝 提案格式验证器: proposal-validator.sh (E001-E005)',
      '📚 片段库更新: 10+ snippets + 关键词索引',
      '🔧 RCA CI: GitHub Actions workflow 集成',
    ],
    commit: '32f1fed',
  },
  {
    version: '1.0.45',
    date: '2026-03-17',
    changes: [
      '🎨 首页三栏布局恢复: 15% Sidebar + 60% Content + 25% AIPanel',
      '📋 步骤指示器移至左侧导航栏',
      '🤖 AI 分析面板独立右侧显示',
      '📱 响应式布局: 桌面三栏/平板两栏/移动端单栏',
    ],
    commit: 'fbdd9d0',
  },
  {
    version: '1.0.44',
    date: '2026-03-17',
    changes: [
      '🐛 修复首页 SSR 崩溃: ParticleBackground 动态导入',
      '🛡️ useParticlePerformance hook SSR 保护',
      '✅ 构建验证通过',
    ],
    commit: '20db4a4',
  },
  {
    version: '1.0.43',
    date: '2026-03-17',
    changes: [
      '🔒 Pre-commit hook 增强: --no-verify 选项 + 安全警告',
      '📊 Security scan script: 支持 json/markdown 报告格式',
      '🛡️ CI workflow: Critical/High 阻断, Moderate/Low 警告',
    ],
    commit: '421b2d8',
  },
  {
    version: '1.0.42',
    date: '2026-03-17',
    changes: [
      '🧪 测试覆盖率提升：新增 ThinkingPanel/api-config 测试',
      '📝 useHomeGeneration 测试补充：callback 覆盖 + 状态转换',
      '📊 当前覆盖率：Lines 64.63%, Branches 53.83%',
    ],
    commit: '58809a8',
  },
  {
    version: '1.0.41',
    date: '2026-03-17',
    changes: [
      '🎨 首页垂直分栏布局：PreviewArea 60% + InputArea 40%',
      '📱 响应式设计：窄屏 (<992px) 自动垂直堆叠',
      '🔧 MainContent 组件新增 layout prop 支持',
      '✅ 测试通过：4 suites / 31 tests',
    ],
    commit: '686546c',
  },
  {
    version: '1.0.40',
    date: '2026-03-17',
    changes: [
      '♻️ 首页步骤组件模块化重构：HomePage.tsx 530行 → 71行',
      '📦 新增 5 个独立步骤组件：StepRequirementInput/StepBoundedContext/StepDomainModel/StepBusinessFlow/StepProjectCreate',
      '⚡ StepContainer 懒加载容器：React.lazy + Suspense 首屏优化',
      '🎣 useHomePage Hook：业务逻辑抽离，代码结构清晰',
      '✅ 测试通过：131 suites / 1487 tests',
    ],
    commit: '4150cb5',
  },
  {
    version: '1.0.39',
    date: '2026-03-16',
    changes: [
      '🐛 领域模型解析超时检测：60 秒超时自动提示',
      '🛡️ 后端错误处理增强：AI 服务错误检测 + 详细日志',
      '⚠️ 补充文档：vibex-domain-model-parsing-stuck 分析与报告',
    ],
    commit: 'ae39f9c',
  },
  {
    version: '1.0.38',
    date: '2026-03-16',
    changes: [
      '🐛 修复领域模型生成后页面未切换问题',
      '🔧 放宽 SSE 同步条件，支持空结果时同步 mermaidCode',
      '📊 ThinkingPanel 进度条动态计算，修复 67% 卡住问题',
      '⚠️ 补充 changelog：此前 3 个提交未更新日志',
    ],
    commit: '0ffd61b',
  },
  {
    version: '1.0.37',
    date: '2026-03-16',
    changes: [
      '🐛 修复领域模型生成时 Mermaid 实时渲染未切换展示',
      '🎨 ThinkingPanel 添加 MermaidPreview 组件渲染领域模型图表',
      '🔄 预览区统一使用 getActiveStreamData() SSE 流式数据',
      '✅ 代码审查通过：无安全/性能问题，测试全部通过',
    ],
    commit: '0086335',
  },
  {
    version: '1.0.36',
    date: '2026-03-16',
    changes: [
      '🐛 补充 entity.attributes.map() 空值保护',
      '🛡️ 修复 handleConfirmAndProceed 函数中的潜在崩溃',
      '✅ 审查通过：vibex-domain-model-render-fix-v2',
    ],
    commit: '6ef2205',
  },
  {
    version: '1.0.35',
    date: '2026-03-15',
    changes: [
      '🎨 空状态 UI：domainModels 为空时显示友好提示',
      '🔧 API 响应处理：null 值自动转换为空数组',
      '✅ F1-F3 全部通过：空值保护 + 空状态 UI + API 响应',
    ],
    commit: '7052dc8',
  },
  {
    version: '1.0.34',
    date: '2026-03-15',
    changes: [
      '📚 知识库系统：问题文档模板 + 分类索引 + 防范规则',
      '🐛 Bug 迁移：7 个历史问题文档完整迁移',
      '🔍 搜索脚本：支持关键词/分类/严重级别过滤',
      '✅ F1-F6 全部通过：目录结构/模板/迁移/分类/索引/搜索',
    ],
    commit: 'b45b25f',
  },
  {
    version: '1.0.33',
    date: '2026-03-15',
    changes: [
      '🐛 修复领域模型页面 TypeError 崩溃问题',
      '🛡️ 新增 useModelPageGuard 防御性检查 Hook',
      '✅ 使用可选链操作符防止 undefined 访问',
      '🔄 添加自动重定向到正确页面机制',
    ],
    commit: '285ed9f',
  },
  {
    version: '1.0.32',
    date: '2026-03-15',
    changes: [
      '🔗 导航修复：「我的项目」链接从 /projects 改为 /dashboard',
      '✅ 路由一致性：与其他页面返回链接保持一致',
      '🐛 修复登录后「我的项目」按钮 404 问题',
    ],
    commit: '0932a64',
  },
  {
    version: '1.0.31',
    date: '2026-03-15',
    changes: [
      '🏠 首页组件集成：page.tsx 精简至 9 行（目标 <200）',
      '📦 模块化重构：HomePage.tsx 封装全部业务逻辑',
      '🔒 安全加固：DOMPurify SVG 消毒，XSS 防护到位',
      '✅ 代码审查通过：安全+性能+规范符合要求',
    ],
    commit: 'fca44c4',
  },
  {
    version: '1.0.30',
    date: '2026-03-14',
    changes: [
      '🏠 首页骨架屏重构：固定三栏布局 (15% + 60% + 25%)',
      '🔧 移除重复诊断组件：DiagnosisPanel 移除，功能集成到 ActionBar',
      '↔️ 拖拽调整：react-resizable-panels 实现预览/录入区域拖拽',
      '💾 布局持久化：localStorage 保存面板大小和节点选择状态',
      '✅ 代码审查通过：安全+性能+规范符合要求',
    ],
    commit: 'f500142',
  },
  {
    version: '1.0.29',
    date: '2026-03-13',
    changes: [
      '🏗️ Service 层重构：拆分 ai-client.ts 到 16 个独立 API 模块',
      '📦 代码复用：httpClient 单例 + retry + cache 共享层',
      '🔒 类型安全：TypeScript + Zod Schema 双重保障',
      '✅ 测试覆盖：99.3% 通过率 (1342/1352)',
      '📝 废弃兼容层：@deprecated 标记，迁移路径清晰',
    ],
    commit: '4a82fde',
  },
  {
    version: '1.0.28',
    date: '2026-03-12',
    changes: [
      '🔧 DDD API 优化：限界上下文返回数据结构增强',
      '📊 提示词优化：EventStorming + Context Mapping 技术集成',
      '🔗 关系字段：支持 upstream-downstream/partnership 等 5 种关系类型',
      '🎨 Mermaid 增强：节点关系连线可视化',
      '✅ 代码审查通过：安全+性能+规范符合要求',
    ],
    commit: '8135046',
  },
  {
    version: '1.0.27',
    date: '2026-03-12',
    changes: [
      '📋 版本历史功能：自动快照、版本预览、差异对比',
      '🔄 Undo/Redo 支持：保存操作自动创建版本快照',
      '📊 差异可视化：jsondiffpatch 集成，绿增红删高亮',
      '📝 版本备注：用户可为版本添加/编辑备注',
      '✅ 代码审查通过：测试修复，安全检查无问题',
    ],
    commit: 'd5abee8',
  },
  {
    version: '1.0.26',
    date: '2026-03-12',
    changes: [
      '🔧 预览功能修复：登录状态实时检测 + Mermaid 图预览',
      '🏗️ 三栏布局：步骤面板(15%) + 预览区(60%) + AI对话(25%)',
      '🔐 AuthStore：Zustand + persist 实现状态持久化',
      '🎨 MermaidRenderer：支持五步流程可视化渲染',
      '✅ 代码审查通过：安全+性能+规范符合要求',
    ],
    commit: '1f09b2d',
  },
  {
    version: '1.0.25',
    date: '2026-03-12',
    changes: [
      '📚 架构文档同步：Schema 文档与 Prisma 一致 (14 模型验证通过)',
      '📋 API 契约文档：OpenAPI 3.0 格式完整',
      '✅ 文档可读性：结构清晰，Mermaid 图表丰富',
      '📝 建议：建立 ADR 体系记录架构决策',
    ],
    commit: 'bd7470f',
  },
  {
    version: '1.0.24',
    date: '2026-03-11',
    changes: [
      '🏠 首页重构：嵌入需求录入表单，营销内容完整',
      '✨ 生成按钮：未登录触发 LoginDrawer，已登录跳转确认页',
      '📱 响应式布局：桌面/平板/移动端适配',
      '🎨 Hero/Features/CTA section 完整实现',
    ],
    commit: '77b0263',
  },
  {
    version: '1.0.23',
    date: '2026-03-10',
    changes: [
      '🎨 设计流程组件：bounded-context, business-flow, domain-model 等',
      '💬 新增 ChatEntry, AIQuestion, ComponentEditor 组件',
      '🔌 WebSocket 服务：connectionPool, messageRouter 实现',
      '🔐 安全配置：gitleaks, pre-commit hooks, vuln-scan workflow',
      '📝 CSS Tokens 系统：colors, spacing, typography 设计变量',
      '🧹 清理 E2E 测试产物：~42M 截图移除，添加 .gitignore',
    ],
    commit: 'db70c28',
  },
  {
    version: '1.0.22',
    date: '2026-03-09',
    changes: [
      '🔧 DDD API 端点修复：fetch → httpClient 迁移',
      '🔐 自动 Authorization：请求拦截器自动添加 Bearer Token',
      '🛡️ 统一错误处理：transformError 友好化错误消息',
      '✅ 代码审查通过：安全性、性能、代码规范 100% 测试覆盖',
    ],
    commit: '90fcacd',
  },
  {
    version: '1.0.21',
    date: '2026-03-09',
    changes: [
      '🔀 路由简化完成：动态路由迁移到查询参数格式',
      '📍 新增 /project 入口页：统一项目管理入口',
      '↩️ 向后兼容：Cloudflare Pages _redirects 重定向规则',
      '🧭 ProjectNav 链接更新：统一使用 ?projectId= 格式',
    ],
    commit: 'b2b74b8',
  },
  {
    version: '1.0.20',
    date: '2026-03-09',
    changes: [
      '🔄 API 模块化重构：api.ts 拆分为 modules/(auth, agent, project 等)',
      '📋 模板系统增强：新增 10 个行业模板（电商/金融/医疗/教育等）',
      '✨ 确认页模板选择器：一键使用预定义模板',
      '🧪 E2E 测试：Page Object Model 实现',
      '🎨 样式 token 系统：tokens.css 设计变量',
    ],
    commit: '81a5033',
  },
  {
    version: '1.0.19',
    date: '2026-03-09',
    changes: [
      '🔐 登录页注册入口优化：字号放大 + 背景边框 + SVG 图标',
      '📱 移动端触摸优化：最小高度 44px 触摸区域',
      '✨ Hover 效果：背景色变化 + 微上移动画',
      '🔀 表单切换：登录/注册表单无缝切换',
    ],
    commit: '6cad007',
  },
  {
    version: '1.0.18',
    date: '2026-03-09',
    changes: [
      '📊 覆盖率监控系统：基线对比 + 阈值阻断 + 趋势追踪',
      '🔔 Slack 告警集成：覆盖率下降自动通知',
      '🏷️ 覆盖率徽章生成：SVG 动态徽章 + JSON 数据',
      '⚙️ 统一配置：coverage.config.js 集中管理阈值',
      '✅ GitHub Actions 工作流：PR 自动检查覆盖率',
    ],
    commit: 'eb9ea71',
  },
  {
    version: '1.0.17',
    date: '2026-03-08',
    changes: [
      '🔀 路由统一化：删除冗余动态路由 /projects/[projectId]',
      '↩️ 重定向规则：/projects/:id → /project?id=:id (301)',
      '🔧 构建优化：增加 Node.js 内存限制解决 OOM',
      '✅ Cloudflare Pages 路由兼容性修复',
    ],
    commit: 'review-approved',
  },
  {
    version: '1.0.16',
    date: '2026-03-08',
    changes: [
      '🚀 移除 @opennextjs/cloudflare，改用原生 Next.js 静态导出',
      '📦 依赖清理：移除 open-next 相关依赖',
      '🔧 配置迁移：next.config.ts + wrangler.toml 静态导出配置',
      '✅ 构建验证：28 个静态页面正确生成',
    ],
    commit: '397c2be',
  },
  {
    version: '1.0.15',
    date: '2026-03-07',
    changes: [
      '🔧 Cloudflare 构建修复：静态导出配置',
      '⚙️ wrangler.toml 多环境配置',
      '✅ 构建验证：out/ 目录正确生成',
    ],
    commit: '8995612',
  },
  {
    version: '1.0.14',
    date: '2026-03-07',
    changes: [
      '📋 需求模板库：8 个行业/场景模板',
      '🔍 模板选择器：分类筛选 + 搜索 + 预览',
      '📊 使用统计：模板使用次数追踪',
      '⭐ 用户评分：5 星评分系统',
      '✅ 单元测试：TemplateStats 完整测试覆盖',
    ],
    commit: '981512d',
  },
  {
    version: '1.0.13',
    date: '2026-03-07',
    changes: [
      '🧭 导航系统重构：GlobalNav + ProjectNav + Breadcrumb',
      '📡 API 变更追踪：OpenAPI 生成 + 变更检测 + 通知机制',
      '✨ 代码质量自动化：Prettier + husky + lint-staged',
      '🔒 安全修复：hono CVE 修复 + 安全审计工作流',
      '🧹 Mock 清理：移除硬编码 mock 数据',
      '📊 需求验证：关键词密度检测 + 实时评分',
      '✅ E2E 测试：导航/认证/截图验证 20+ 测试',
    ],
    commit: 'ccf0a40',
  },
  {
    version: '1.0.12',
    date: '2026-03-06',
    changes: [
      '🔍 静态导出兼容性检查：动态路由检测脚本',
      '📊 识别 17 静态兼容 + 8 潜在问题路由',
      '📝 ESLint 规则：no-static-export (待集成)',
      '📋 文档指南：静态导出最佳实践',
    ],
    commit: 'bed4c35',
  },
  {
    version: '1.0.11',
    date: '2026-03-06',
    changes: [
      '✅ 需求录入前置校验：关键词密度检测 + 完整性评分',
      '📊 5维度评分算法：长度/关键词/结构/清晰度/具体性',
      '🎯 75+ 领域关键词库：domain/function/entity/action',
      '💡 实时评分 UI + 建议提示',
    ],
    commit: 'cd3c075',
  },
  {
    version: '1.0.10',
    date: '2026-03-06',
    changes: [
      '🔐 敏感信息扫描：Gitleaks 规则配置',
      '✅ 10+ 密钥类型检测：AWS/GitHub/Cloudflare/Slack/JWT',
      '🔄 GitHub Actions secrets-scan 工作流',
      '📋 .env.example 环境变量模板',
    ],
    commit: '44758b7',
  },
  {
    version: '1.0.9',
    date: '2026-03-06',
    changes: [
      '🔒 依赖漏洞扫描自动化：GitHub Actions + Dependabot',
      '✅ 后端安全审计：0 漏洞',
      '📦 hono 升级到 4.12.5，修复安全漏洞',
      '🔄 每日自动扫描 + 高危漏洞阻断构建',
    ],
    commit: 'dcd2bdb',
  },
  {
    version: '1.0.8',
    date: '2026-03-06',
    changes: [
      '🔐 登录页注册入口优化：切换按钮样式增强',
      '🔗 SEO 优化：支持 ?mode=register/login URL 参数',
      '✅ E2E 测试覆盖：24 个测试用例全部通过',
      '📱 多视口测试：mobile/tablet/desktop 截图验收',
    ],
    commit: '291ac7d',
  },
  {
    version: '1.0.7',
    date: '2026-03-05',
    changes: [
      '📊 测试覆盖率自动化：Jest 阈值配置 + 历史记录',
      '📈 当前覆盖率 62.61% (> 40% 阈值)',
      '⚠️ 退化检测：覆盖率下降 > 5% 阻止合并',
    ],
    commit: '0445e9e',
  },
  {
    version: '1.0.6',
    date: '2026-03-05',
    changes: [
      '📸 E2E 截图功能修复：迁移到 Playwright',
      '✅ 8 个页面截图生成成功',
      '🔧 支持	headless 服务器环境',
    ],
    commit: '6b53b8f',
  },
  {
    version: '1.0.5',
    date: '2026-03-05',
    changes: [
      '🛡️ ErrorBoundary 双级部署：全局 + MermaidPreview',
      '⚠️ 友好错误 UI：重试按钮 + 刷新页面',
      '✅ 渲染错误不崩溃应用',
    ],
    commit: '99cbf9d',
  },
  {
    version: '1.0.4',
    date: '2026-03-05',
    changes: [
      '🎨 CSS 工具类提取：创建 utilities.css (411行)',
      '📦 200+ 工具类：布局/间距/排版/边框/背景等',
      '✅ 命名规范统一，遵循 Tailwind CSS 风格',
    ],
    commit: 'baf2812',
  },
  {
    version: '1.0.3',
    date: '2026-03-05',
    changes: [
      '♻️ API 服务层重构：将 api.ts (1522行) 拆分为 16 个模块',
      '📦 模块边界清晰，无循环依赖',
      '✅ 测试覆盖率 78%，构建通过',
    ],
    commit: '1fc52af',
  },
  {
    version: '1.0.2',
    date: '2026-03-05',
    changes: [
      '🔒 安全修复：Mermaid 组件 XSS 漏洞修复',
      '🛡️ 将 securityLevel 从 loose 改为 strict',
      '✅ 安全测试验证通过',
    ],
    commit: '25a8984',
  },
  {
    version: '1.0.1',
    date: '2026-03-04',
    changes: [
      '🎨 风格统一优化：统一所有页面 UI 风格',
      '🔧 修复交互式确认流程',
      '📊 流程执行引擎实现',
      '🔐 用户角色权限检查 (RBAC)',
    ],
    commit: '8f533ea',
  },
  {
    version: '1.0.0',
    date: '2026-03-02',
    changes: [
      '🎉 全新 AI 原型设计工具上线',
      '✨ 支持需求输入 → 领域模型 → 原型生成完整流程',
      '📊 新增领域模型页面',
      '🎨 新增原型预览页面',
      '🚀 后端部署到 Cloudflare Workers',
      '📱 响应式设计，支持移动端',
    ],
  },
  {
    version: '0.9.0',
    date: '2026-02-15',
    changes: [
      '✨ 全新 UI/UX 设计',
      '🔐 用户认证系统',
      '📁 项目管理系统',
      '💬 AI 对话功能',
    ],
  },
  {
    version: '0.8.0',
    date: '2026-01-20',
    changes: ['🎨 初始版本发布', '📋 基础页面模板'],
  },
];

export default function Changelog() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/version`,
          { headers }
        );
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        }
      } catch (error) {
        canvasLogger.default.error('Failed to fetch version:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.bgEffect}>
        <div className={styles.gridOverlay} />
        <div className={styles.glowOrb} />
      </div>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>更新日志</h1>
          <p className={styles.subtitle}>VibeX 产品迭代记录</p>

          {versionInfo && (
            <div className={styles.versionInfo}>
              <span className={styles.versionBadge}>
                v{versionInfo.version}
              </span>
              <span className={styles.commitHash}>{versionInfo.commit}</span>
            </div>
          )}
        </header>

        <div className={styles.timeline}>
          {mockChangelog.map((entry, index) => (
            <div key={entry.version} className={styles.entry}>
              <div className={styles.entryHeader}>
                <span className={styles.version}>v{entry.version}</span>
                <span className={styles.date}>{entry.date}</span>
              </div>
              <ul className={styles.changes}>
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
              {entry.commit && (
                <div className={styles.commit}>Commit: {entry.commit}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
