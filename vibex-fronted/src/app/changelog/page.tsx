'use client';

import { useEffect, useState } from 'react';
import styles from './changelog.module.css';

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
      '✅ @ci-blocking: 前缀 (vue-components/conflict-resolution/undo-redo)',
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
        console.error('Failed to fetch version:', error);
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
