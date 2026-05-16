# VibeX Sprint 37 — 实施计划

**Agent**: architect
**日期**: 2026-05-17
**项目**: vibex-proposals-sprint37

---

## Stage 流水线说明

每个 Epic 经历以下 stages，依次执行：

```
dev → tester → reviewer → reviewer-push × N → coord-completed
```

| Stage | 执行者 | 产出 | 门禁 |
|-------|--------|------|------|
| **dev** | dev-agent | 功能代码 + 单元测试 + CHANGELOG.md 草稿 | — |
| **tester** | tester-agent | 集成/E2E 测试 + 测试报告 | `pnpm test` 全部通过 |
| **reviewer** | reviewer-agent | Code Review + 批准/驳回 | `pnpm lint` + `pnpm type-check` 通过 |
| **reviewer-push** | reviewer-agent (push) | 远程分支推送 + PR 创建 | PR 创建成功 |
| **coord-completed** | coord-agent | Epic 状态更新 + 触发下一 Epic | — |

> **并行策略**: Epic 之间按优先级串行（F001→F002→F003→F004→F005）。Epic 内部 stage 串行，Reviewer 通过后可触发下一个 Epic 的 dev。

---

## Epic 拆分总览

| Epic | 功能 | Feature | 优先级 | Stage 路径 |
|------|------|---------|--------|-----------|
| E001 | 快捷键 Hook + Undo/Redo/Cancel | F001 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E002 | Tab 切换 + Node 创建快捷键 | F001 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E003 | Generate 快捷键 + Help overlay | F001 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E004 | E2E 快捷键测试 + 文档 | F001 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E005 | PNG/SVG 前端导出实现 | F002 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E006 | PDF 后端 API 实现 | F002 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E007 | 导出 UI 集成 + Loading/Error | F002 | P0 | dev→tester→reviewer→reviewer-push→coord |
| E008 | ErrorBoundary 组件 + Canvas 集成 | F003 | P1 | dev→tester→reviewer→reviewer-push→coord |
| E009 | Dashboard 集成 + 重试逻辑 | F003 | P1 | dev→tester→reviewer→reviewer-push→coord |
| E010 | 错误上报 + E2E 测试 | F003 | P1 | dev→tester→reviewer→reviewer-push→coord |
| E011 | Zustand Store + localStorage persistence | F004 | P1 | dev→tester→reviewer→reviewer-push→coord |
| E012 | Settings Page UI + theme 应用 | F004 | P1 | dev→tester→reviewer→reviewer-push→coord |
| E013 | defaultTemplate + shortcutCustomization | F004 | P1 | dev→tester→reviewer→reviewer-push→coord |
| E014 | ThemeProvider 架构 + 默认/Dark 主题 | F005 | P2 | dev→tester→reviewer→reviewer-push→coord |
| E015 | 企业品牌 A/B 主题 + 切换逻辑 | F005 | P2 | dev→tester→reviewer→reviewer-push→coord |
| E016 | Settings 集成 + 视觉回归测试 | F005 | P2 | dev→tester→reviewer→reviewer-push→coord |

---

## Epic 详细计划

### E001: F001 — 核心 Hook + Undo/Redo/Cancel 快捷键

**分支**: `epic/f001-keyboard-shortcuts-undo-redo`

**实现内容**:
- `src/hooks/useKeyboardShortcuts.ts` — Hook 核心，shortcut 注册/注销机制
- `src/hooks/__tests__/useKeyboardShortcuts.test.ts` — 单元测试
- `Ctrl+Z` → `undo()` action（调用现有 DDSToolbar undo）
- `Ctrl+Shift+Z` / `Ctrl+Y` → `redo()` action
- `Escape` → `cancelSelection()` action

**DoD Checklist**:
- [ ] `useKeyboardShortcuts` 单元测试覆盖率 > 80%
- [ ] `Ctrl+Z` undo 行为与 DDSToolbar Undo 按钮一致
- [ ] `Ctrl+Shift+Z` / `Ctrl+Y` redo 行为一致
- [ ] `Escape` 取消选择
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

**测试命令**: `cd /root/.openclaw/vibex/vibex-fronted && pnpm exec vitest run src/hooks/__tests__/useKeyboardShortcuts.test.ts`

---

### E002: F001 — Tab 切换 + Node 创建快捷键

**分支**: `epic/f001-keyboard-shortcuts-tab-node`

**实现内容**:
- `Tab` → `nextTab()` action
- `Shift+Tab` → `prevTab()` action
- `Ctrl+N` → `createNewNode()` action（当前画布默认节点类型）

**DoD Checklist**:
- [ ] Tab 切换与手动点击 Tab 行为一致
- [ ] `Ctrl+N` 新建节点在 Canvas 中可见
- [ ] 单元测试覆盖 Tab 快捷键
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E003: F001 — Generate 快捷键 + Help overlay

**分支**: `epic/f001-keyboard-shortcuts-generate-help`

**实现内容**:
- `Ctrl+G` → `triggerGenerate()` action（与 Generate 按钮行为一致）
- `?` (无 modifier) → `toggleHelp()` — 显示 KeyboardHelpOverlay
- `src/components/shared/KeyboardHelpOverlay.tsx`
- `src/components/shared/KeyboardHelpOverlay.module.css`
- DDSCanvasPage 集成 KeyboardHelpOverlay

**DoD Checklist**:
- [ ] Help overlay 显示所有可用快捷键列表
- [ ] `?` 键在非文本输入区域触发 overlay
- [ ] overlay 可通过 `Escape` 或点击关闭
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E004: F001 — E2E 测试覆盖 + 文档

**分支**: `epic/f001-keyboard-shortcuts-e2e`

**实现内容**:
- Playwright E2E 测试：每个快捷键的端到端验证
- `src/e2e/keyboard-shortcuts.spec.ts`
- 更新 README 或 docs 中的快捷键文档

**DoD Checklist**:
- [ ] Playwright 测试覆盖所有 7 个快捷键
- [ ] 测试在 CI 中通过
- [ ] 文档更新
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E005: F002 — PNG/SVG 前端导出实现

**分支**: `epic/f002-export-png-svg`

**实现内容**:
- `src/hooks/useCanvasExport.ts` — 新增 `exportAsPNG()` 和 `exportAsSVG()`
- PNG: `html2canvas(canvasEl)` → `canvas.toBlob()` → `URL.createObjectURL()`
- SVG: DOM 序列化 → Blob → download
- 单元测试（mock canvas / html2canvas）

**DoD Checklist**:
- [ ] PNG 导出生成有效图片文件
- [ ] SVG 导出生成有效 SVG 文件
- [ ] 文件名格式: `canvas-{projectId}-{timestamp}.{ext}`
- [ ] `html2canvas` 通过 dynamic import 延迟加载（SSR 安全）
- [ ] CHANGELOG.md 已更新

**预估工时**: 1d

**测试命令**: `cd /root/.openclaw/vibex/vibex-fronted && pnpm exec vitest run src/hooks/__tests__/useCanvasExport.test.ts`

---

### E006: F002 — PDF 后端 API 实现

**分支**: `epic/f002-export-pdf-api`

**实现内容**:
- `vibex-backend/src/app/api/export/pdf/route.ts`
- 接收 canvasData JSON → 生成 PDF → 返回 binary
- Cloudflare Workers 部署脚本
- Backend 单元测试

**DoD Checklist**:
- [ ] `POST /api/export/pdf` 返回有效 PDF（含元数据 + chapters）
- [ ] 文件名: `canvas-{projectId}-{timestamp}.pdf`
- [ ] 401/404/500 错误响应正确
- [ ] Backend CHANGELOG.md 已更新

**预估工时**: 1d

---

### E007: F002 — 导出 UI 集成 + Loading/Error

**分支**: `epic/f002-export-ui-integration`

**实现内容**:
- `src/components/dds/toolbar/ExportMenu.tsx` — 导出下拉菜单
- 修改 `src/components/dds/toolbar/DDSToolbar.tsx` — 集成 ExportMenu
- 导出菜单包含: JSON / Vibex / PDF / PNG / SVG
- Loading spinner 状态
- Toast notification 错误提示
- `useCanvasExport.ts` 集成 PDF 导出（调用 backend API）

**DoD Checklist**:
- [ ] DDSToolbar 显示导出菜单
- [ ] 所有 5 种格式可正常导出
- [ ] Loading 状态正确（按钮禁用 + spinner）
- [ ] 错误提示显示 Toast
- [ ] CHANGELOG.md 已更新

**预估工时**: 1d

---

### E008: F003 — ErrorBoundary 组件 + Canvas 集成

**分支**: `epic/f003-error-boundary-canvas`

**实现内容**:
- `src/components/shared/ErrorBoundary.tsx` — 通用 ErrorBoundary
- `src/components/shared/DDSErrorsFallback.tsx` — Canvas 降级 UI
- `src/components/shared/DDSErrorsFallback.module.css`
- `src/app/dds/[projectId]/error.tsx` — Next.js App Router Error Boundary
- DDSCanvasPage 集成

**DoD Checklist**:
- [ ] Canvas 崩溃时显示友好 UI（非白屏）
- [ ] 降级 UI 包含：错误信息 + 重试按钮 + 报告按钮
- [ ] 错误不影响其他 Tab（如 Dashboard）
- [ ] `console.error` 输出（含 stack + timestamp）
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E009: F003 — Dashboard 集成 + 重试逻辑

**分支**: `epic/f003-error-boundary-dashboard`

**实现内容**:
- `src/app/error.tsx` — 全局 App Router Error Boundary
- 重试按钮逻辑（使用 `reset()` 方法）
- Dashboard 页面级别保护

**DoD Checklist**:
- [ ] Dashboard 页面被 ErrorBoundary 保护
- [ ] 重试按钮正常工作
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E010: F003 — 错误上报 + E2E 测试

**分支**: `epic/f003-error-boundary-telemetry`

**实现内容**:
- `vibex-backend/src/app/api/telemetry/errors/route.ts` (可选)
- Playwright E2E 测试: 模拟组件抛错，验证降级 UI
- `src/e2e/error-boundary.spec.ts`

**DoD Checklist**:
- [ ] 错误上报端点正常（可选 feature flag 控制）
- [ ] E2E 测试覆盖错误降级场景
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E011: F004 — Zustand Store + localStorage persistence

**分支**: `epic/f004-preferences-store`

**实现内容**:
- `src/stores/userPreferencesStore.ts` — Zustand + persist middleware
- `src/stores/__tests__/userPreferencesStore.test.ts` — 单元测试
- 支持: theme / defaultTemplate / shortcutCustomization

**DoD Checklist**:
- [ ] `userPreferencesStore` 正确持久化到 localStorage
- [ ] 页面刷新后偏好保持
- [ ] 版本迁移机制（future-proof）
- [ ] 单元测试通过
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

**测试命令**: `cd /root/.openclaw/vibex/vibex-fronted && pnpm exec vitest run src/stores/__tests__/userPreferencesStore.test.ts`

---

### E012: F004 — Settings Page UI + theme 应用

**分支**: `epic/f004-preferences-settings-ui`

**实现内容**:
- `src/app/settings/page.tsx` — RSC 设置页面
- Settings UI: theme 选择器（light/dark/system）
- ThemeProvider 读取 store 并应用 CSS 变量

**DoD Checklist**:
- [ ] Settings Page 正确挂载在 `/settings`
- [ ] theme 选择器工作正常
- [ ] 主题切换无白屏（CSS 变量覆盖）
- [ ] CHANGELOG.md 已更新

**预估工时**: 1d

---

### E013: F004 — defaultTemplate + shortcutCustomization

**分支**: `epic/f004-preferences-shortcuts`

**实现内容**:
- Settings Page 增加 defaultTemplate 选择
- Settings Page 增加 shortcutCustomization UI
- 快捷键自定义面板（可重绑定快捷键）

**DoD Checklist**:
- [ ] defaultTemplate 设置正确
- [ ] 快捷键自定义生效（覆盖默认快捷键）
- [ ] E2E 测试覆盖
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E014: F005 — ThemeProvider 架构 + 默认/Dark 主题

**分支**: `epic/f005-theme-provider`

**实现内容**:
- `src/components/providers/ThemeProvider.tsx` — React Context + CSS variable 注入
- `src/styles/design-tokens.css` — 重构为 CSS Variable 定义
- `src/styles/themes/dark-theme.css` — Dark mode 变量
- `layout.tsx` 集成 ThemeProvider

**DoD Checklist**:
- [ ] ThemeProvider 正确嵌套在 App Router
- [ ] CSS Variable 动态注入
- [ ] Light/Dark 主题切换正常
- [ ] 无 FOUC (Flash of Unstyled Content)
- [ ] CHANGELOG.md 已更新

**预估工时**: 1d

---

### E015: F005 — 企业品牌 A/B 主题 + 切换逻辑

**分支**: `epic/f005-theme-enterprise`

**实现内容**:
- `src/styles/themes/enterprise-a-theme.css`
- `src/styles/themes/enterprise-b-theme.css`
- ThemeProvider 支持 4 个预设主题
- 主题配置数据结构

**DoD Checklist**:
- [ ] 4 个预设主题完整覆盖所有 design token
- [ ] 主题切换逻辑正确
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

### E016: F005 — Settings 集成 + 视觉回归测试

**分支**: `epic/f005-theme-settings-integration`

**实现内容**:
- Settings Page 集成主题选择器（扩展 E012）
- Playwright 视觉回归测试：5 个主题各截图对比
- 截图对比脚本

**DoD Checklist**:
- [ ] Settings Page 主题选择器包含所有 4 个预设主题
- [ ] 视觉回归测试覆盖所有主题
- [ ] 视觉差异 < 1% 阈值（排除 font rendering 差异）
- [ ] CHANGELOG.md 已更新

**预估工时**: 0.5d

---

## 测试策略汇总

| 测试类型 | 工具 | 覆盖范围 |
|---------|------|---------|
| 单元测试 | Vitest | Hooks, Stores, 工具函数 |
| 集成测试 | Vitest | 组件逻辑、store integration |
| E2E 测试 | Playwright | F001 快捷键、F002 导出、F003 降级、F004 Settings |
| 视觉回归 | Playwright screenshots | F005 主题系统 (4 themes) |
| 类型检查 | TypeScript | 全量 `tsc --noEmit` |
| Lint | ESLint | `pnpm lint` |

---

## CI/CD 流水线

```
PR 创建
  ↓
[1] pnpm install
[2] pnpm lint
[3] pnpm type-check
[4] pnpm test
[5] pnpm build
[6] Playwright E2E (分支环境)
  ↓
Reviewer 批准
  ↓
合并到 main
  ↓
自动部署到 vibex-app.pages.dev
```

---

## Sprint 37 日程建议

| 阶段 | 范围 | Epic | 预估 |
|------|------|------|------|
| Week 1 (Mon-Wed) | F001 快捷键系统 | E001-E004 | 2d |
| Week 1 (Thu-Fri) | F002 导出 (前端) | E005 | 1d |
| Week 2 (Mon-Tue) | F002 导出 (后端 + 集成) | E006-E007 | 2d |
| Week 2 (Wed-Thu) | F003 Error Boundary | E008-E010 | 1d |
| Week 2 (Thu-Fri) | F004 Preferences Store | E011 | 0.5d |
| Week 3 (Mon-Wed) | F004 Settings Page | E012-E013 | 1.5d |
| Week 3 (Thu-Fri) | F005 ThemeProvider | E014 | 1d |
| Week 4 (Mon-Tue) | F005 品牌主题 | E015-E016 | 1d |

> **交付策略**: F001 + F002 为 P0 核心，确保 Sprint 37 完成；F003-F005 根据团队节奏弹性调整。
