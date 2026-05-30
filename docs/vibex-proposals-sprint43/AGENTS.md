# AGENTS.md — VibeX Sprint 43

> **日期**: 2026-05-30
> **Coord**: coord (architect-review self-implement)

---

## dev — Sprint43 开发者

### 工作范围
每个 Epic 的代码实现。

### 约束
- **分支命名**: `epic/s43-e{N}-{epic-name}`（见 IMP 分支命名规范）
- **commit message**: `feat|perf|fix(S43-P00X-EY): <description>`
- **每个 Epic 完成后**:
  1. vitest 测试通过
  2. TypeScript 编译通过
  3. dual-CHANGELOG 更新（root + vibex-fronted）
  4. `pnpm exec tsc --noEmit --skipLibCheck` 零新增错误
- **禁止**: 引入未在 IMP 中指定的第三方库
- **i18n**: 所有 UI 文本使用 `useTranslations('ai')()` 或 `useTranslations('ns')()`，禁止硬编码中文
- **Design System**: 遵守 `DESIGN.md` 颜色/间距变量，禁止内联 `style={{}}`

### 技术栈提醒
- 前端: Next.js 15 (App Router) + Svelte 5（并行调研）
- 状态: Zustand
- 画布: `@xyflow/react ^12.10.1`（内置 MiniMap/Controls/Background/Panel）
- 样式: CSS Modules + CSS Variables
- 后端: Cloudflare Workers
- 导出: `html-to-image`（已安装）+ `jspdf`（需添加）
- 持久化: `idb ^8.0.1`

### 关键文件路径
```
vibex-fronted/src/
├── components/dds/
│   ├── DDSCanvasPage.tsx         # E1 集成点
│   ├── presence/PresenceOverlay.tsx  # E1（已有）
│   └── toolbar/DDSToolbar.tsx    # E4 Export 按钮
├── lib/collaboration/
│   ├── presenceStore.ts           # E1（已有）
│   └── useWebSocketPresence.ts    # E1（已有）
├── hooks/
│   └── useKeyboardShortcuts.ts    # E5 已有基础
└── stores/userPreferencesStore.ts # E5 shortcutCustomization（已有）
```

---

## tester — Sprint43 测试工程师

### 工作范围
每个 Epic 的测试覆盖。

### 约束
- **vitest**: 所有新逻辑必须有单元测试（.test.ts）
- **E2E**: 每个 Epic 至少一个 Playwright spec（tests/e2e/）
- **命令**: `npx vitest run src/...`（不是 `pnpm test`，pnpm test 有 pre-test TypeScript 检查）
- **测试隔离**: 每个测试文件独立运行，不依赖其他测试的状态
- **覆盖率目标**: 关键逻辑 > 80%

### 测试文件命名
```
src/stores/__tests__/xxxStore.test.ts
src/lib/xxx/__tests__/xxx.test.ts
src/hooks/__tests__/useXxx.test.ts
tests/e2e/xxx.spec.ts
```

---

## reviewer — Sprint43 代码审查

### 工作范围
代码审查 + git push 验证。

### DoD 审查清单
- [ ] 代码符合 AGENTS.md 约束
- [ ] vitest 全部通过
- [ ] TypeScript 编译通过（`pnpm exec tsc --noEmit --skipLibCheck`）
- [ ] dual-CHANGELOG 正确更新（root + vibex-fronted）
- [ ] i18n keys 完整
- [ ] Design System 遵守
- [ ] PR 描述清晰，包含 DoD 清单勾选
- [ ] 无 console.error（测试运行期间）
- [ ] E2E 测试覆盖

### 约束
- **本地必须干净**: `git status -uno` 无未提交修改
- **push 目标**: `origin/main`（coord self-implement）或 `origin/epic/s43-e{N}-*`
- **reviewer-push** 后检查: `git diff origin/main HEAD --stat` 确认已推送

---

## 特殊约定

### E1 Presence Firebase → WebSocket 迁移
- 替换而非新增：完全移除 Firebase presence 调用
- `grep -rn "usePresence" vibex-fronted/src/` 确认无残留
- PresenceOverlay 渲染在 `<svg>` 之上（z-index 保证）

### E2 SSE 后端优先
- dev E2 前先确认后端 `/api/ai/generate` 支持 `stream: true`
- 如后端暂不支持：E2 降级为"添加 SSE 前端框架，标记 `// TODO: 后端 SSE`"

### E3 性能基准
- 用 `performance.now()` 测量首次加载时间
- Chrome DevTools Performance panel 截图作为证据

### E4 Export i18n
- i18n keys 在 `src/i18n/messages/en.json` + `zh.json` 添加
- 命名: `exportBtn`, `exportPNG`, `exportSVG`, `exportPDF`
- namespace: 复用 `ai` 或新建 `canvas` namespace
