# VibeX Sprint 17 — 产品需求文档（PRD）

**项目**: vibex-proposals-20260428-sprint17
**Agent**: PM
**日期**: 2026-04-29
**版本**: v1.0
**仓库**: /root/.openclaw/vibex
**产出路径**: docs/vibex-proposals-20260428-sprint17/

---

## 1. 执行摘要

### 背景

Sprint 16 完成 6 个提案（P0-P2-2），全部已合入 main。Sprint 1-16 大量功能完成了"能用"，但缺乏"好用"和"验证完"的环节：
- E2E 覆盖率缺口：`code-generator-e2e.spec.ts` 从未创建（S16-P1-2 验收标准要求）
- MCP 工具治理：`GET /health` tool 列表未实现，`INDEX.md` 缺失（S16-P2-2 DoD gaps）
- Firebase 真实集成：从没在真实配置下验证过
- TypeScript 类型安全：`noUncheckedIndexedAccess` 未开启
- Analytics Dashboard：FunnelWidget + useFunnelQuery 无 E2E 保护

### 目标

Sprint 17 的首要任务是**收尾 + 深化**——把已有功能变成真实可用的产品，而不是堆新功能。

### 成功指标

| 指标 | 目标 |
|------|------|
| E2E 测试覆盖率 | `code-generator-e2e.spec.ts` + `design-review.spec.ts` 全通过 |
| MCP 健康检查 | `GET /health` 返回 `tools[]` |
| Firebase 性能 | 5 用户并发 presence 更新 < 3s |
| TypeScript | `tsc --noEmit` 0 errors（含 noUncheckedIndexedAccess） |
| Analytics E2E | `analytics-dashboard.spec.ts` 全通过 |
| 总工时 | ≤ 8.5d |

---

## 2. Epic 拆分

### Epic 1：验证收尾（Verification Completion）

| ID | Story | 描述 | 优先级 | 工时 | 依赖 |
|----|-------|------|--------|------|------|
| E1-S1 | S17-P0-1 | E2E 覆盖率补全 | P0 | 2d | S16-P1-2, S16-P0-1 |
| E1-S2 | S17-P1-1 | MCP Tool Registry 收尾 | P1 | 1d | S16-P2-2 |

### Epic 2：集成深化（Integration Deepening）

| ID | Story | 描述 | 优先级 | 工时 | 依赖 |
|----|-------|------|--------|------|------|
| E2-S1 | S17-P1-2 | Firebase 真实集成验证 | P1 | 2d | S16-P1-1 |

### Epic 3：技术深化（Technical Deepening）

| ID | Story | 描述 | 优先级 | 工时 | 依赖 |
|----|-------|------|--------|------|------|
| E3-S1 | S17-P2-1 | TypeScript noUncheckedIndexedAccess | P2 | 2d | 无 |
| E3-S2 | S17-P2-2 | Analytics Dashboard E2E 验证 | P2 | 1.5d | Sprint 14 E4 |

**总工时**: 8.5d（可分两批 Sprint 完成）

---

## 3. 功能点清单

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | code-generator-e2e.spec.ts 创建 | 为 CodeGenPanel 创建 E2E 测试 | `pnpm playwright test code-generator-e2e.spec.ts` 全通过，≥5 tests，覆盖 CodeGenPanel 真实组件生成逻辑（FlowStepCard props → TSX 输出）+ Framework selector 切换 + CSS 变量验证 + 语法错误断言 | 【需页面集成】CodeGenPanel, FrameworkSelector |
| F1.2 | design-review.spec.ts 生产路径补充 | 补充快捷键 + ReportPanel 状态测试 | `pnpm playwright test design-review.spec.ts` 增量 ≥3 tests，覆盖 Ctrl+Shift+R + 加载态/结果态/空态 + WCAG 违规高亮 | 【需页面集成】DDSToolbar, ReviewReportPanel |
| F2.1 | GET /health 返回 tools[] | MCP Server 添加健康端点 | `curl localhost:3100/health` 返回 `{..., "tools": [{name, description, inputSchema}...]}` 数组 | 无（后端 API） |
| F2.2 | generate-tool-index.ts | 自动生成工具索引脚本 | 脚本可独立运行 `node scripts/generate-tool-index.ts`，输出 0 exit code，生成 `docs/mcp-tools/INDEX.md` 包含所有已交付工具索引 | 无（脚本） |
| F3.1 | Firebase 冷启动 benchmark | 量化 Firebase 初始化时间 | benchmark 报告显示冷启动时间，目标 < 500ms | 无（benchmark） |
| F3.2 | 5 用户并发延迟验证 | 验证多用户 presence 性能 | 5 用户并发 presence 更新延迟 < 3s | 【需页面集成】PresenceAvatars |
| F3.3 | Firebase 降级策略 | mock/真实环境均可降级 | `isFirebaseConfigured() === false` 时 PresenceAvatars 不渲染（Playwright assert） | 【需页面集成】PresenceAvatars |
| F4.1 | noUncheckedIndexedAccess 开启 | 数组下标访问严格化 | `tsconfig.json` 添加 `"noUncheckedIndexedAccess": true`，`pnpm exec tsc --noEmit` 0 errors | 无（TypeScript 配置） |
| F5.1 | analytics-dashboard.spec.ts | Analytics E2E 测试 | `pnpm playwright test analytics-dashboard.spec.ts` 全通过，≥5 tests，覆盖 FunnelWidget 四态（idle/loading/success/error）+ 折线图渲染 + error 降级文案 | 【需页面集成】FunnelWidget, Analytics Dashboard |
| F5.2 | useFunnelQuery 单元测试 | Hook 状态覆盖 | `npx vitest run useFunnelQuery.test.ts` 全通过 | 无（单元测试） |

---

## 4. 验收标准（expect() 断言）

### E1-S1: S17-P0-1 E2E 覆盖率补全

**F1.1 — code-generator-e2e.spec.ts**
```typescript
// S17-P0-1 E1-S1 F1.1
await page.goto('/canvas');
await page.waitForSelector('[data-testid="codegen-panel"]');
await expect(page.locator('[data-testid="codegen-panel"]')).toBeVisible();
// 真实 props 验证
const generated = await page.locator('[data-testid="codegen-output"]').textContent();
expect(generated).toContain('stepName');
expect(generated).toContain('actor');
expect(generated).toContain('pre');
expect(generated).toContain('post');
// Framework selector
await page.click('[data-testid="framework-react"]');
expect(await page.locator('[data-testid="codegen-output"]').textContent()).toMatch(/const.*=.*React/);
await page.click('[data-testid="framework-vue"]');
expect(await page.locator('[data-testid="codegen-output"]').textContent()).toMatch(/script setup/);
// CSS 变量验证
expect(generated).toMatch(/var\(--/);
expect(generated).not.toMatch(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/); // 无硬编码颜色
// 语法检查
const { error } = await evaluateAsync(generated, 'tsx');
expect(error).toBeNull();
```

**F1.2 — design-review.spec.ts 生产路径**
```typescript
// S17-P0-1 E1-S1 F1.2
// Ctrl+Shift+R 快捷键
await page.goto('/canvas');
await page.keyboard.press('Control+Shift+R');
await expect(page.locator('[data-testid="review-report-panel"]')).toBeVisible();
// 加载态
await expect(page.locator('[data-testid="review-loading"]')).toBeVisible();
// 结果态（等待完成后）
await page.waitForSelector('[data-testid="review-result"]', { timeout: 10000 });
// 空态（无违规时）
await page.evaluate(() => localStorage.setItem('mock-no-violations', 'true'));
await page.reload();
await page.keyboard.press('Control+Shift+R');
await expect(page.locator('[data-testid="review-empty"]')).toBeVisible();
```

### E1-S2: S17-P1-1 MCP Tool Registry 收尾

**F2.1 — GET /health**
```bash
# E1-S2 F2.1
curl -s http://localhost:3100/health | jq .
# 期望输出包含 tools 数组
expect(tools).toBeInstanceOf(Array);
expect(tools[0]).toHaveProperty('name');
expect(tools[0]).toHaveProperty('description');
expect(tools[0]).toHaveProperty('inputSchema');
```

**F2.2 — generate-tool-index.ts**
```typescript
// E1-S2 F2.2
import { generateIndex } from './scripts/generate-tool-index';
const result = await generateIndex();
expect(result.exitCode).toBe(0);
expect(result.index).toContain('# MCP Tools Index');
expect(result.index).toContain('review_design');
expect(result.index).toContain('figma_import');
expect(result.index).toContain('generate_code');
```

### E2-S1: S17-P1-2 Firebase 真实集成验证

**F3.1 — Firebase 冷启动 benchmark**
```typescript
// E2-S1 F3.1
const coldStartTime = await measureColdStart();
expect(coldStartTime).toBeLessThan(500); // < 500ms
// 记录报告
expect(report.coldStartMs).toBeLessThan(500);
```

**F3.2 — 5 用户并发延迟**
```typescript
// E2-S1 F3.2
const users = Array.from({ length: 5 }, (_, i) => simulateUser(`user${i}`));
const results = await Promise.all(users.map(u => measurePresenceUpdate(u)));
results.forEach(result => {
  expect(result.latencyMs).toBeLessThan(3000); // < 3s
});
```

**F3.3 — Firebase 降级策略**
```typescript
// E2-S1 F3.3
await page.goto('/canvas');
// 验证 isFirebaseConfigured === false 时 PresenceAvatars 不渲染
await expect(page.locator('[data-testid="presence-avatars"]')).toHaveCount(0);
// 验证 E2E 测试通过
await page.evaluate(() => {
  const firebaseConfigured = (window as any).__FIREBASE_CONFIGURED__;
  expect(firebaseConfigured).toBe(false);
});
```

### E3-S1: S17-P2-1 TypeScript noUncheckedIndexedAccess

**F4.1 — tsconfig.json 配置**
```typescript
// E3-S1 F4.1
const tsconfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf-8'));
expect(tsconfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
// 编译无错误
const { errors } = await runTypeCheck();
expect(errors).toHaveLength(0);
```

### E3-S2: S17-P2-2 Analytics Dashboard E2E

**F5.1 — FunnelWidget 四态**
```typescript
// E3-S2 F5.1
// idle 态
await page.goto('/dashboard');
await expect(page.locator('[data-testid="funnel-widget"]')).toBeVisible();
await expect(page.locator('[data-testid="funnel-idle"]')).toBeVisible();
// loading 态
await page.click('[data-testid="refresh-button"]');
await expect(page.locator('[data-testid="funnel-loading"]')).toBeVisible();
// success 态
await page.waitForSelector('[data-testid="funnel-success"]', { timeout: 5000 });
await expect(page.locator('[data-testid="funnel-chart"]')).toBeVisible();
// error 态 + 降级文案（非空白）
await page.evaluate(() => mockApiFailure());
await page.reload();
await expect(page.locator('[data-testid="funnel-error"]')).toBeVisible();
const errorText = await page.locator('[data-testid="funnel-error"]').textContent();
expect(errorText).not.toBe('');
expect(errorText).toMatch(/retry|error|failed/i);
```

**F5.2 — useFunnelQuery 单元测试**
```typescript
// E3-S2 F5.2
const { result } = renderHook(() => useFunnelQuery({ dateRange: '7d' }));
expect(result.current.isLoading).toBe(true);
await waitFor(() => expect(result.current.isSuccess).toBe(true));
expect(result.current.data).toHaveProperty('funnel');
// error 状态
const { result: errorResult } = renderHook(() => useFunnelQuery({ invalid: true }));
await waitFor(() => expect(errorResult.current.isError).toBe(true));
```

---

## 5. Definition of Done（DoD）

### E1-S1: S17-P0-1 E2E 覆盖率补全 ✅

- [ ] `pnpm playwright test code-generator-e2e.spec.ts` 全通过，≥5 tests
- [ ] `pnpm playwright test design-review.spec.ts` 全通过，≥3 tests 增量（总测试数含历史）
- [ ] E2E 测试覆盖 CodeGenPanel 真实组件生成逻辑（FlowStepCard props → TSX 输出）
- [ ] E2E 测试覆盖 Design Review 快捷键 + ReportPanel 状态（加载态/结果态/空态）
- [ ] 所有 `expect()` 断言可执行，测试稳定无 flaky

### E1-S2: S17-P1-1 MCP Tool Registry 收尾 ✅

- [ ] `curl localhost:3100/health` 返回 `tools[]` 数组（含 name/description/inputSchema）
- [ ] `docs/mcp-tools/INDEX.md` 存在且包含所有已交付工具索引（review_design / figma_import / generate_code）
- [ ] `scripts/generate-tool-index.ts` 可独立运行，输出 0 exit code
- [ ] INDEX.md 生成后可重复运行，幂等

### E2-S1: S17-P1-2 Firebase 真实集成验证 ✅

- [ ] Firebase 冷启动 benchmark 报告产出，目标 < 500ms
- [ ] 5 用户并发 presence 更新延迟 < 3s
- [ ] `isFirebaseConfigured() === false` 时 PresenceAvatars 不渲染（Playwright assert 通过）
- [ ] 降级策略在 mock 和真实环境均可触发
- [ ] `pnpm playwright test firebase-presence.spec.ts` 全通过

### E3-S1: S17-P2-1 TypeScript noUncheckedIndexedAccess ✅

- [ ] `vibex-fronted/tsconfig.json` 添加 `"noUncheckedIndexedAccess": true`
- [ ] `pnpm exec tsc --noEmit` 在 vibex-fronted/ 返回 0 errors
- [ ] 重点审查 `src/services/` 和 `src/lib/` 目录的数组下标访问

### E3-S2: S17-P2-2 Analytics Dashboard E2E 验证 ✅

- [ ] `pnpm playwright test analytics-dashboard.spec.ts` 全通过，≥5 tests
- [ ] FunnelWidget 四态（idle/loading/success/error）全部可测试
- [ ] FunnelWidget error 状态显示降级文案（非空白）
- [ ] `npx vitest run useFunnelQuery.test.ts` 全通过

---

## 6. 优先级矩阵（RICE）

| Story | Reach | Impact | Confidence | Effort | RICE | 优先级 |
|-------|-------|--------|------------|--------|------|--------|
| S17-P0-1 | 所有用户 | 高 | 高 | 2d | ~最高 | P0 |
| S17-P1-1 | 开发/AI Agent | 中 | 高 | 1d | 高 | P1 |
| S17-P1-2 | 所有用户 | 高 | 中 | 2d | 中高 | P1 |
| S17-P2-1 | 开发 | 中 | 高 | 2d | 中 | P2 |
| S17-P2-2 | 分析用户 | 中 | 高 | 1.5d | 中高 | P2 |

**第一批（3d）**: S17-P0-1 + S17-P1-1
**第二批（3.5d）**: S17-P1-2 + S17-P2-2
**第三批（2d）**: S17-P2-1（独立推进）

---

## 7. 风险矩阵

| Story | 可能性 | 影响 | 综合风险 | 缓解策略 |
|-------|--------|------|----------|----------|
| S17-P0-1 E2E 补全 | 低 | 高 | 🟢 低 | 已有 design-to-code-e2e.spec.ts 参考模式 |
| S17-P1-1 MCP 收尾 | 低 | 低 | 🟢 低 | 5 docs 已就绪，仅缺 API 和脚本 |
| S17-P1-2 Firebase 真实验证 | 中 | 高 | 🟠 中 | 先用 Firebase Emulator，本地验证后再切真实配置 |
| S17-P2-1 noUncheckedIndexedAccess | 中 | 中 | 🟡 中 | 先扫描统计错误数量，再决定是否 Sprint 17 实施 |
| S17-P2-2 Analytics E2E | 低 | 中 | 🟢 低 | FunnelWidget 已有数据，可直接测试 |

---

## 8. 详细规格（specs/）

每个 Story 的详细实现规格见 `specs/` 目录：

| 文件 | 对应 Story |
|------|-----------|
| `specs/S17-P0-1-e2e-coverage.md` | E1-S1 (S17-P0-1) |
| `specs/S17-P1-1-mcp-registry.md` | E1-S2 (S17-P1-1) |
| `specs/S17-P1-2-firebase-real-integration.md` | E2-S1 (S17-P1-2) |
| `specs/S17-P2-1-typescript-strict-mode.md` | E3-S1 (S17-P2-1) |
| `specs/S17-P2-2-analytics-e2e.md` | E3-S2 (S17-P2-2) |

---

## 9. PRD 格式自检

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 `expect()` 断言
- [x] DoD 章节存在且具体（5 个 Story 各有独立 DoD）
- [x] 功能点清单包含所有 11 个功能点，ID 格式正确
- [x] 【需页面集成】标注清晰

---

## 10. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260428-sprint17
- **执行日期**: 2026-04-29

*文档版本: v1.0 | 2026-04-29 | PM*
