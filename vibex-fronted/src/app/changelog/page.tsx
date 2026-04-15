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
    version: '1.0.236',
    date: '2026-04-16',
    changes: [
      '🔒 E6-S1: AST安全扫描 — `@babel/parser` 检测 eval/new Function/setTimeout 字符串参数，8/8 PASS',
    ],
    commit: '02263c66',
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
