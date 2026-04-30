# VibeX Sprint 19 PRD — Design Review 真实 MCP 集成

**版本**: v1.0
**日期**: 2026-04-30
**类型**: Epic + Stories
**状态**: 已采纳

---

## 1. 执行摘要

### 背景

Sprint 9 为 Design Review 实现了 `review_design` MCP tool，后端逻辑完整（`designCompliance`、`a11yChecker`、`componentReuse` 三层检查）。但前端 `useDesignReview` hook 始终使用 `setTimeout(1500)` + 硬编码假数据，从未调用真实 MCP tool。

用户按 Ctrl+Shift+R 看到的评审报告是伪造的，与真实设计状态毫无关系。

### 目标

消除 Design Review 全链路 mock，将前端 `useDesignReview` 接入真实 MCP tool `review_design`，确保每次评审反映真实设计状态。

### 成功指标

| 指标 | 目标 |
|------|------|
| 假数据清除率 | 100%（grep 0 matches） |
| 真实 MCP 调用覆盖率 | 100% |
| E2E 测试真实路径验证 | 通过 |
| `pnpm run build` | 0 errors |
| 优雅降级 | Server error 时显示友好提示，非白屏 |

---

## 2. Epic 拆分

### Epic E19-1: Design Review MCP 集成

| ID | Story | 描述 | 工时 | 验收标准数 | 优先级 |
|----|-------|------|------|-----------|--------|
| E19-1-S1 | API Route 桥接层 | 新建 `/api/mcp/review_design` 路由，复用后端 `reviewDesign()` 核心逻辑 | 1d | 4 | P0 |
| E19-1-S2 | 前端 Hook 接入 | 改造 `useDesignReview`，移除 mock，接入 API Route | 0.5d | 6 | P0 |
| E19-1-S3 | 优雅降级 | Server error / 加载中 / 空状态 UI | 0.5d | 4 | P1 |
| E19-1-S4 | E2E 测试覆盖 | 补充 `design-review.spec.ts` 真实路径测试 | 0.5d | 3 | P1 |

**总工时**: 2.5d

---

## 3. 验收标准（expect() 断言）

### E19-1-S1: API Route 桥接层

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| AS1.1 | API Route `/api/mcp/review_design` 存在且可调用 | `expect(await fetch('/api/mcp/review_design', {...})).resolves.toBeDefined()` |
| AS1.2 | 返回结构与 `DesignReviewReport` 接口一致 | `expect(response.data).toHaveProperty('summary')` + `expect(response.data.summary).toHaveProperty('compliance')` |
| AS1.3 | `canvasId` 参数正确透传到 `reviewDesign()` | 传入 `canvasId: 'test-123'`，返回 `report.canvasId === 'test-123'` |
| AS1.4 | 缺少必要参数时返回 400 错误 | `expect(await fetch('/api/mcp/review_design', {method:'POST',body:JSON.stringify({})})).resolves.toHaveProperty('status', 400)` |

**Spec 文件**: `specs/E19-1-S1-api-route.md`

### E19-1-S2: 前端 Hook 接入

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| AS2.1 | `useDesignReview` 中 mock 函数已移除 | `expect(grep('src/hooks/useDesignReview', 'setTimeout.*1500')).toHaveLength(0)` |
| AS2.2 | `callReviewDesignMCP` 调用 `/api/mcp/review_design` API | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/mcp/review_design'), expect.any(Object))` |
| AS2.3 | `runReview()` 返回的数据来自真实 API（非 mock） | 调用 hook 的 `runReview()`，`result` 中 `summary.compliance` 值来自服务端，非预设假数据 |
| AS2.4 | Hook 正确传递 `figmaUrl` 参数 | `expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({body: expect.stringContaining('figmaUrl')}))` |
| AS2.5 | Hook 在 API 失败时设置 `error` 状态 | `expect(result.error).toBeTruthy()` when API returns 500 |
| AS2.6 | `result` 结构与 `DesignReviewResult` 接口匹配 | `expect(result).toHaveProperty('compliance')` + `expect(result).toHaveProperty('accessibility')` + `expect(result).toHaveProperty('reuse')` |

**Spec 文件**: `specs/E19-1-S2-hook-integration.md`

### E19-1-S3: 优雅降级

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| AS3.1 | 加载中状态显示（非白屏） | `expect(screen.getByTestId('review-loading')).toBeInTheDocument()` when `isLoading === true` |
| AS3.2 | API 错误时显示友好文案（非假数据） | `expect(screen.getByText(/评审暂时不可用/i)).toBeInTheDocument()` when error |
| AS3.3 | 无数据时显示空状态 | `expect(screen.getByText(/暂无评审结果/i)).toBeInTheDocument()` when `result === null && !isLoading` |
| AS3.4 | 错误状态不阻塞 UI 交互 | Review panel 可关闭，`onClose` callback 正常触发 |

**Spec 文件**: `specs/E19-1-S3-graceful-degradation.md`

### E19-1-S4: E2E 测试覆盖

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| AS4.1 | E2E 测试触发 Ctrl+Shift+R 调用真实 API | `await page.keyboard.press('Control+Shift+R'); await expect(fetchMock).toHaveBeenCalledWith('/api/mcp/review_design', ...)` |
| AS4.2 | E2E 测试验证真实评审结果显示在面板中 | `await expect(page.locator('[data-testid="review-report"]')).toBeVisible()` |
| AS4.3 | E2E 测试覆盖优雅降级路径 | 模拟 API 500 错误，验证降级文案显示 |

**Spec 文件**: `specs/E19-1-S4-e2e-tests.md`

---

## 4. 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E19-1-S1.F1 | `/api/mcp/review_design` API Route | 前端到 MCP 逻辑的 HTTP 桥接层，直接调用后端 `reviewDesign()` 核心逻辑 | AS1.1–AS1.4 | 【需页面集成】前端 hook 接入 |
| E19-1-S2.F1 | `useDesignReview` Mock 替换 | 移除 `setTimeout(1500)` 假数据，接入真实 API 调用 | AS2.1–AS2.6 | 【需页面集成】所有调用 `useDesignReview` 的页面 |
| E19-1-S3.F1 | 优雅降级 UI | 加载中/错误/空状态三种降级路径 | AS3.1–AS3.4 | 【需页面集成】ReviewReportPanel |
| E19-1-S4.F1 | E2E 真实路径测试 | Playwright 测试覆盖真实 API 调用链 | AS4.1–AS4.3 | 无（纯测试） |

---

## 5. DoD (Definition of Done)

### 研发完成判断标准

- [ ] API Route `/api/mcp/review_design` 已创建，TypeScript 编译通过（`tsc --noEmit`）
- [ ] API Route 单元测试覆盖 AS1.1–AS1.4（`vitest run` 通过）
- [ ] `useDesignReview` 源码中 `setTimeout` + `mock` 关键词 grep 结果为 0
- [ ] `useDesignReview` 单元测试覆盖 AS2.1–AS2.6（`vitest run` 通过）
- [ ] `pnpm run build` 在 frontend 目录执行，0 errors
- [ ] 优雅降级三种状态（loading/error/empty）均已实现且可触发
- [ ] Playwright E2E 测试 `tests/e2e/design-review.spec.ts` 通过（真实 API 路径）
- [ ] PRD 自检清单全部通过

### 可发布判断标准

- [ ] Ctrl+Shift+R 触发的评审数据来自真实 `reviewDesign()` 逻辑
- [ ] 模拟 MCP server 宕机时，用户看到友好降级文案（非白屏、无假数据）
- [ ] 回归测试：其他 Design Review 功能不受影响

---

## 6. 技术方案

### 架构决策

**问题**: MCP server 运行在 stdio transport，前端无法直接调用。

**方案**: 在 Next.js API Route 中直接导入后端 `reviewDesign()` 核心逻辑，绕过 MCP stdio transport。

```
前端 useDesignReview
  → POST /api/mcp/review_design
    → reviewDesign({ canvasId, nodes })
      → checkDesignCompliance + checkA11y + analyzeComponentReuse
        → 返回真实 DesignReviewReport
```

**选择理由**: 
- 避免每次请求 spawn 进程的开销
- 直接复用已实现的业务逻辑
- 架构简单，无额外依赖

**备选方案（已排除）**:
- 方案 B（MCP SDK 客户端）：引入新依赖，SDK 浏览器端支持度未知，实施成本 1-2d
- 方案 C（child_process spawn MCP）：每次请求启动进程，性能差，已排除

### 关键文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `vibex-fronted/src/app/api/mcp/review_design/route.ts` | 新增 | API Route 桥接层 |
| `vibex-fronted/src/hooks/useDesignReview.ts` | 修改 | 移除 mock，调用真实 API |
| `vibex-fronted/src/components/.../ReviewReportPanel.tsx` | 修改 | 优雅降级 UI |
| `vibex-fronted/tests/e2e/design-review.spec.ts` | 修改 | E2E 真实路径覆盖 |

---

## 7. 依赖关系

```
E19-1-S1（API Route）        ← 基础依赖
    ↑
E19-1-S2（Hook 接入）        ← 依赖 S1
    ↑
E19-1-S3（优雅降级）          ← 依赖 S2
    ↑
E19-1-S4（E2E 测试）          ← 依赖 S2+S3
```

S1 为关键路径，必须先完成。

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 后端 `reviewDesign()` 依赖缺失（prompts 文件路径问题） | 低 | 高 | 实施前验证所有 prompt 文件可访问 |
| API Route 性能慢（AST 扫描） | 中 | 低 | 异步处理 + 前端 loading state |
| mock 数据残留（代码审查遗漏） | 中 | 中 | grep 自检 + E2E 验证 |

---

## 9. PRD 自检清单

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言（每条对应具体断言表达式）
- [x] DoD 章节存在且具体（研发完成 + 可发布两阶段）
- [x] 功能点表格 ID 格式正确（E19-1-SX.FY）
- [x] 页面集成标注完整（【需页面集成】/ 无）
- [x] 依赖关系图已绘制

---

*文档版本: v1.0*
*创建时间: 2026-04-30 11:45 GMT+8*
*Agent: pm*
