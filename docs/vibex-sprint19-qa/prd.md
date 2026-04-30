# VibeX Sprint 19 QA PRD — E19-1 Design Review MCP 集成验证

**版本**: v1.0
**日期**: 2026-04-30
**类型**: QA 验证计划
**状态**: 已采纳
**上游**: `docs/vibex-proposals-20260430-sprint19/prd.md` + `analysis.md`

---

## 1. 执行摘要

### 背景

Sprint 19 实现 E19-1 Design Review 真实 MCP 集成，消除 `useDesignReview` 中的 mock 数据。Analyst 完成了可行性分析，识别出 1 个 Blocker（B1: CHANGELOG 缺失）和 4 个建议修复项（S1–S4）。

### 目标

QA 验证 E19-1 四层实现（API Route / Hook / UI / E2E）的产出完整性、代码质量、交互可用性和设计一致性，确保功能可发布。

### 成功指标

| 指标 | 目标 | 验证方法 |
|------|------|----------|
| 产出物完整性 | 所有必需文件存在 + E19-1 commit 可追溯 | 文件存在性检查 + git log |
| Mock 数据清除率 | 100%（grep 0 matches） | grep 扫描源码 |
| TypeScript 编译 | 0 errors（E19-1 相关文件） | Next.js build TS阶段 |
| UI 四态 | loading/error/empty/success 全部可达 | Playwright E2E |
| E2E 测试通过率 | TC1–TC7 全部通过 | Playwright |
| 回归 | 原有 Design Review 功能不受影响 | E2E TC5–TC7 |

### ⚠️ 已知阻塞项

| ID | 问题 | 来源 | 状态 |
|----|------|------|------|
| B1 | CHANGELOG.md 缺失 E19-1 条目 | Analyst 报告 | ✅ 已确认存在（line 3–10） |

> QA 实测：`grep "E19-1" CHANGELOG.md` → 8 行匹配，Blocker B1 已解除。

---

## 2. Epic 拆分

### Epic E19-1-QA1: 产出物完整性验证

**本质需求穿透（神技1）**：
- 用户底层动机：确保每次交付可追溯，E19-1 变更历史透明可见
- 去掉现有方案：无法追踪变更来源，违反项目规范
- 解决本质问题：commit + CHANGELOG 双链路验证

**最小可行范围（神技2）**：
- **本期必做**：E19-1 commit 存在于 origin/main + CHANGELOG 条目存在
- **本期不做**：无
- **暂缓**：无

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| E19-1-QA1-S1 | E19-1 Commit 追溯 | 验证 `2f493df6d` 存在于 `origin/main`，范围覆盖 S1–S4 | 0.25d | 4 |
| E19-1-QA1-S2 | CHANGELOG 条目验证 | 验证 CHANGELOG.md 包含 E19-1 条目（条目内容完整） | 0.25d | 3 |
| E19-1-QA1-S3 | 文件结构完整性 | 验证 E19-1 涉及的 4 个文件存在且格式正确 | 0.25d | 4 |

**总工时**: 0.75d

### Epic E19-1-QA2: 代码质量验证

**本质需求穿透（神技1）**：
- 用户底层动机：代码能编译通过，生产环境不因 TS 错误或类型问题崩溃
- 去掉现有方案：无编译保证，运行时类型错误风险
- 解决本质问题：TypeScript 编译干净 + mock 完全清除

**最小可行范围（神技2）**：
- **本期必做**：TS 编译通过 + mock 清除 + API 错误处理
- **本期不做**：autoOpen prop 功能（建议项 S1）
- **暂缓**：designTokens 参数接入（建议项 S2）

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| E19-1-QA2-S1 | TypeScript 编译验证 | 验证 `route.ts` + `useDesignReview.ts` + `ReviewReportPanel.tsx` TS 编译干净 | 0.25d | 4 |
| E19-1-QA2-S2 | Mock 数据清除验证 | 验证 `useDesignReview.ts` 中 `setTimeout` + `// Mock` + `simulated` 关键词 grep = 0 | 0.25d | 4 |
| E19-1-QA2-S3 | API 错误处理验证 | 验证 `/api/mcp/review_design` 返回 400（缺 canvasId）和 500（服务端错误）| 0.25d | 4 |

**总工时**: 0.75d

### Epic E19-1-QA3: UI/交互验证

**本质需求穿透（神技1）**：
- 用户底层动机：按 Ctrl+Shift+R 后看到真实结果，评审过程不迷路、不焦虑
- 去掉现有方案：用户看到假数据失去信任，评审功能名存实亡
- 解决本质问题：真实 API 数据展示 + 四态引导文案

**最小可行范围（神技2）**：
- **本期必做**：四态全部可达 + 三 tab 展示 + 关闭按钮
- **本期不做**：autoOpen prop
- **暂缓**：无

**用户情绪地图（神技3）**：
- **进入评审时**：期待感 → 加载中骨架屏抚平焦虑，禁止用纯 spinner（会抖动）
- **看到空结果时**：困惑（"为什么没有结果？"）→ 引导文案"暂无评审结果，按 Ctrl+Shift+R 触发评审"
- **看到错误时**：焦虑 → 明确文案"设计评审暂时不可用，请稍后再试" + 重试按钮
- **看到真实结果时**：信任感 → 三个 tab 清晰展示 compliance/a11y/reuse

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| E19-1-QA3-S1 | 四态可达性验证 | loading/error/empty/success 四态均可通过用户操作触发并显示正确 UI | 0.5d | 8 |
| E19-1-QA3-S2 | 三 Tab 展示验证 | Compliance / Accessibility / Reuse 三 tab 切换正常，count 正确 | 0.25d | 4 |
| E19-1-QA3-S3 | 关闭交互验证 | 关闭按钮可正常 dismiss panel，callback 触发 | 0.25d | 2 |

**总工时**: 1d

**UI状态规范（神技4）**：详见 `specs/E19-1-QA3-states.md`

### Epic E19-1-QA4: E2E 测试覆盖验证

**本质需求穿透（神技1）**：
- 用户底层动机：自动化测试保障功能不退化，每次提交有回归网
- 去掉现有方案：手工测试无法覆盖所有路径，回归风险高
- 解决本质问题：Playwright TC1–TC7 全部通过

**最小可行范围（神技2）**：
- **本期必做**：TC1–TC4 新增路径 + TC5–TC7 回归路径
- **本期不做**：无
- **暂缓**：TC2 静默 skip 修复（建议项 S4）

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| E19-1-QA4-S1 | 新增路径 TC1–TC4 | Ctrl+Shift+R 触发 POST + 非 mock 验证 + 错误降级 + 重试按钮 | 0.5d | 6 |
| E19-1-QA4-S2 | 回归路径 TC5–TC7 | toolbar 打开 panel + 三 tab 展示 + 关闭按钮 | 0.25d | 4 |

**总工时**: 0.75d

### Epic E19-1-QA5: 建议修复项验证

| ID | Story | 描述 | 工时 | 验收标准数 |
|----|-------|------|------|-----------|
| E19-1-QA5-S1 | autoOpen prop 修复（S1） | 验证 autoOpen prop 加入 useEffect deps 或被删除 | 0.25d | 2 |
| E19-1-QA5-S2 | designTokens 参数说明（S2） | 验证 changelog 或代码注释中注明 designTokens 已知限制 | 0.25d | 2 |
| E19-1-QA5-S3 | TypeScript 类型优化（S3） | 验证 severity 推断无 `as unknown` 强制转换 | 0.25d | 2 |
| E19-1-QA5-S4 | E2E TC2 静默 skip（S4） | 验证 TC2 在 panel 不出现时正确 fail | 0.25d | 2 |

**总工时**: 1d

---

## 3. 验收标准（expect() 断言）

### E19-1-QA1-S1: E19-1 Commit 追溯

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA1-S1.1 | `2f493df6d` commit 存在于 `origin/main` | `expect(await gitLog()).toContain('2f493df6d')` |
| QA1-S1.2 | commit 消息包含 `E19-1` | `expect(await gitShow('2f493df6d', '--format=%s')).toContain('E19-1')` |
| QA1-S1.3 | commit 包含 `route.ts` 文件变更 | `expect(await gitShow('2f493df6d', '--name-only')).toContain('route.ts')` |
| QA1-S1.4 | commit 包含 `useDesignReview.ts` 文件变更 | `expect(await gitShow('2f493df6d', '--name-only')).toContain('useDesignReview')` |

### E19-1-QA1-S2: CHANGELOG 条目验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA1-S2.1 | CHANGELOG.md 包含 `E19-1` 关键词 | `expect(grep('CHANGELOG.md', 'E19-1')).toHaveLength(>=1)` |
| QA1-S2.2 | CHANGELOG 条目包含日期（2026-04-30） | `expect(grep('CHANGELOG.md', '2026-04-30')).toHaveLength(>=1)` |
| QA1-S2.3 | CHANGELOG 条目包含 S1–S4 子项描述 | `expect(changelog).toContain('API Route')` + `expect(changelog).toContain('E2E')` |

### E19-1-QA1-S3: 文件结构完整性

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA1-S3.1 | `route.ts` 文件存在且行数 >= 200 | `expect(fileExists('route.ts')).toBe(true)` + `expect(lineCount).toBeGreaterThan(200)` |
| QA1-S3.2 | `useDesignReview.ts` 包含 `callReviewDesignMCP` 函数 | `expect(fileContains('useDesignReview.ts', 'callReviewDesignMCP')).toBe(true)` |
| QA1-S3.3 | `ReviewReportPanel.tsx` 包含四态分支（loading/error/empty/success） | `expect(fileContains('ReviewReportPanel.tsx', 'panel-loading')).toBe(true)` + `expect(fileContains('ReviewReportPanel.tsx', 'panel-error')).toBe(true)` + `expect(fileContains('ReviewReportPanel.tsx', 'panel-empty')).toBe(true)` |
| QA1-S3.4 | `design-review.spec.ts` 包含 TC1–TC4 | `expect(fileContains('spec.ts', 'TC1\\|Ctrl\\+Shift\\+R')).toBe(true)` |

### E19-1-QA2-S1: TypeScript 编译验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA2-S1.1 | `route.ts` 无 TS 编译错误 | Next.js build TypeScript 阶段通过（无声输出 0 errors） |
| QA2-S1.2 | `useDesignReview.ts` 无 TS 编译错误 | 同上 |
| QA2-S1.3 | `ReviewReportPanel.tsx` 无 TS 编译错误 | 同上 |
| QA2-S1.4 | E19-1 相关文件无 `as unknown` 强制转换 | `expect(grep('useDesignReview.ts', 'as unknown')).toHaveLength(0)` |

### E19-1-QA2-S2: Mock 数据清除验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA2-S2.1 | `useDesignReview.ts` 无 `setTimeout` 调用 | `expect(grep('useDesignReview.ts', 'setTimeout')).toHaveLength(0)` |
| QA2-S2.2 | `useDesignReview.ts` 无 `// Mock` 注释 | `expect(grep('useDesignReview.ts', '// Mock')).toHaveLength(0)` |
| QA2-S2.3 | `useDesignReview.ts` 无 `simulated` 关键词 | `expect(grep('useDesignReview.ts', 'simulated')).toHaveLength(0)` |
| QA2-S2.4 | `useDesignReview.ts` 调用 `/api/mcp/review_design` | `expect(fileContains('useDesignReview.ts', '/api/mcp/review_design')).toBe(true)` |

### E19-1-QA2-S3: API 错误处理验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA2-S3.1 | 缺 `canvasId` 返回 400 | `expect(await fetch('/api/mcp/review_design', {method:'POST',body:'{}'})).resolves.toHaveProperty('status', 400)` |
| QA2-S3.2 | 正常请求返回 200 + 正确结构 | `expect(response.status).toBe(200)` + `expect(response.data).toHaveProperty('summary')` |
| QA2-S3.3 | `summary` 包含 `compliance` + `a11y` + `reuseCandidates` | `expect(report.summary).toHaveProperty('compliance')` + `expect(report.summary).toHaveProperty('a11y')` + `expect(report.summary).toHaveProperty('reuseCandidates')` |
| QA2-S3.4 | 服务端异常返回 500 + 错误信息 | `expect(response.status).toBe(500)` + `expect(response.data).toHaveProperty('error')` |

### E19-1-QA3-S1: 四态可达性验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA3-S1.1 | 加载中状态显示骨架屏 + spinner | `expect(screen.getByTestId('panel-loading')).toBeInTheDocument()` when `isLoading === true` |
| QA3-S1.2 | 错误状态显示友好文案（非白屏）| `expect(screen.getByTestId('panel-error-message')).toBeInTheDocument()` when error |
| QA3-S1.3 | 错误文案区分：网络异常 vs 服务端错误 | 500 错误：`toContain('暂时不可用')`；fetch 错误：`toContain('网络连接异常')` |
| QA3-S1.4 | 重试按钮在错误状态可见 | `expect(screen.getByTestId('panel-retry')).toBeInTheDocument()` when error |
| QA3-S1.5 | 空状态显示引导文案 | `expect(screen.getByText('暂无评审结果')).toBeInTheDocument()` when no result |
| QA3-S1.6 | 空状态引导文案包含 Ctrl+Shift+R 提示 | `expect(screen.getByText(/Ctrl\\+Shift\\+R/)).toBeInTheDocument()` |
| QA3-S1.7 | 真实结果显示三 tab（success 态）| `expect(screen.getByTestId('panel-tabs')).toBeInTheDocument()` when result |
| QA3-S1.8 | 错误状态下 panel 仍可关闭 | 关闭按钮 callback 触发，panel 消失 |

### E19-1-QA3-S2: 三 Tab 展示验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA3-S2.1 | 三个 tab 按钮可见 | `expect(screen.getByTestId('tab-compliance')).toBeInTheDocument()` + a11y + reuse |
| QA3-S2.2 | tab count 显示正确 | `expect(screen.getByTestId('count-compliance')).toHaveTextContent('0')`（空数据时） |
| QA3-S2.3 | tab 切换切换对应内容 | 点击 tab 后 `tabpanel-compliance/tabpanel-accessibility/tabpanel-reuse` 之一显示 |
| QA3-S2.4 | 活跃 tab 有正确 aria 属性 | `expect(tab).toHaveAttribute('aria-selected', 'true')` |

### E19-1-QA3-S3: 关闭交互验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA3-S3.1 | 关闭按钮可见并可点击 | `expect(screen.getByTestId('panel-close')).toBeInTheDocument()` |
| QA3-S3.2 | 点击后 panel 消失 | `expect(screen.queryByTestId('review-report-panel')).not.toBeInTheDocument()` |

### E19-1-QA4-S1: 新增路径 TC1–TC4

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA4-S1.1 | TC1: Ctrl+Shift+R 触发 POST `/api/mcp/review_design` | `expect(page.waitForRequest(...)).resolves.toMatchObject({url: /api\\/mcp\\/review_design/})` |
| QA4-S1.2 | TC1: 请求 body 包含 `canvasId` + 三个 check 标志 | `expect(body).toHaveProperty('canvasId')` + `expect(body.checkCompliance).toBe(true)` |
| QA4-S1.3 | TC2: 结果不包含硬编码 mock 字符串（`3.2:1`） | `expect(page.textContent()).not.toContain('3.2:1')` |
| QA4-S1.4 | TC3: API 500 → 降级文案可见 | `await expect(page.locator('[data-testid="panel-error"]')).toBeVisible()` |
| QA4-S1.5 | TC4: 重试按钮点击后重新发起请求 | 第一次 500 → 重试 → 第二次 200 |
| QA4-S1.6 | TC4: 重试后 panel 不停留在 error 态 | `await expect(page.locator('[data-testid="panel-error"]')).not.toBeVisible()` |

### E19-1-QA4-S2: 回归路径 TC5–TC7

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA4-S2.1 | TC5: toolbar 按钮打开 panel | `await page.click('[data-testid="design-review-btn"]')` → panel 出现 |
| QA4-S2.2 | TC5: panel title 正确 | `expect(title).toHaveText('Design Review Report')` |
| QA4-S2.3 | TC6: 三 tab 全部可见（回归）| 三个 tab button 可见 |
| QA4-S2.4 | TC7: 关闭按钮 dismiss panel（回归）| `await page.click('[data-testid="panel-close"]')` → panel 消失 |

### E19-1-QA5-S1: autoOpen prop 修复验证

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA5-S1.1 | autoOpen prop 在 deps 中或 prop 已删除 | `expect(grep('ReviewReportPanel.tsx', 'autoOpen')).toHaveLength(0)` 或 `expect(grep('ReviewReportPanel.tsx', 'autoOpen')).toBeInDeps` |

### E19-1-QA5-S2: designTokens 参数说明

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA5-S2.1 | 代码注释或 changelog 说明 designTokens 已知限制 | `expect(comment).toContain('designTokens')` + `expect(comment).toContain('known limitation\\|暂不接入\\|空数组')` |

### E19-1-QA5-S3: TypeScript 类型优化

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA5-S3.1 | `useDesignReview.ts` 无 `as unknown` 强制转换 | `expect(grep('useDesignReview.ts', 'as unknown')).toHaveLength(0)` |

### E19-1-QA5-S4: E2E TC2 静默 skip 修复

| ID | 验收标准 | 可测试断言 |
|----|---------|-----------|
| QA5-S4.1 | TC2 在 panel 不出现时 fail（不再静默通过）| `expect(page.waitForSelector).toThrow()` 或 TC2 使用 `expect(panel).toBeDefined()` |

---

## 4. 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E19-1-QA1.F1 | E19-1 Commit 可追溯 | git history + commit 内容验证 | QA1-S1.1–S1.4 | 无 |
| E19-1-QA1.F2 | CHANGELOG E19-1 条目 | 条目存在性 + 内容完整性 | QA1-S2.1–S2.3 | 无 |
| E19-1-QA1.F3 | 文件结构完整性 | 4 个核心文件存在 + 内联 checker 函数 | QA1-S3.1–S3.4 | 无 |
| E19-1-QA2.F1 | TypeScript 编译干净 | Next.js build TS 阶段 + `as unknown` 清除 | QA2-S1.1–S1.4 | 无 |
| E19-1-QA2.F2 | Mock 数据清除 | 3 类 mock 关键词 grep = 0，真实 API 调用存在 | QA2-S2.1–S2.4 | 无 |
| E19-1-QA2.F3 | API 错误处理 | 400 + 200 + 500 三路径 | QA2-S3.1–S3.4 | 无 |
| E19-1-QA3.F1 | 四态可达性 | loading/error/empty/success 均可触发并显示正确 UI | QA3-S1.1–S1.8 | 【需页面集成】ReviewReportPanel |
| E19-1-QA3.F2 | 三 Tab 展示 | compliance/a11y/reuse 三 tab 切换正常 | QA3-S2.1–S2.4 | 【需页面集成】ReviewReportPanel |
| E19-1-QA3.F3 | 关闭交互 | 关闭按钮 callback 正常触发 | QA3-S3.1–S3.2 | 【需页面集成】ReviewReportPanel |
| E19-1-QA4.F1 | E2E 新增路径 TC1–TC4 | Ctrl+Shift+R + 非 mock + 降级 + 重试 | QA4-S1.1–S1.6 | 无（E2E） |
| E19-1-QA4.F2 | E2E 回归路径 TC5–TC7 | toolbar + tab + 关闭 | QA4-S2.1–S2.4 | 无（E2E） |
| E19-1-QA5.F1 | autoOpen prop 修复 | ESLint dep 或 prop 删除 | QA5-S1.1 | 无 |
| E19-1-QA5.F2 | designTokens 限制说明 | changelog/注释注明已知限制 | QA5-S2.1 | 无 |
| E19-1-QA5.F3 | TS 类型断言优化 | `as unknown` 清除 | QA5-S3.1 | 无 |
| E19-1-QA5.F4 | TC2 静默 skip 修复 | TC2 panel 不出现时正确 fail | QA5-S4.1 | 无 |

---

## 5. DoD (Definition of Done)

### QA 通过判断标准

- [ ] Epic E19-1-QA1（产出物完整性）：全部 11 条验收标准通过
- [ ] Epic E19-1-QA2（代码质量）：全部 12 条验收标准通过
- [ ] Epic E19-1-QA3（UI/交互）：全部 14 条验收标准通过
- [ ] Epic E19-1-QA4（E2E 测试）：TC1–TC7 全部通过
- [ ] Epic E19-1-QA5（建议修复）：至少 2/4 项修复验证通过
- [ ] 无新增 Blocker（所有发现的 Blocker 均已修复或明确接受）
- [ ] gstack QA 验证完成（gstack browse 截图确认 UI 四态）
- [ ] QA 报告已产出：`docs/vibex-sprint19-qa/qa-report.md`

### 可发布判断标准

- [ ] E19-1 所有 4 个 Story 实现可发布（无 Blocker）
- [ ] Design Review 原有功能（toolbar 打开 / 三 tab / 关闭）回归通过
- [ ] CHANGELOG 条目已确认存在（B1 Blocker 解除）
- [ ] 建议修复项 S1–S4 已评估，暂缓项已在文档中标注

---

## 6. 验证方法

### gstack QA 强制要求

| 验证项 | gstack 命令 | 验证内容 |
|--------|------------|----------|
| UI 四态真实性 | `gstack browse` + 截图 | 截图验证 loading/error/empty/success 四态实际 UI |
| Ctrl+Shift+R 交互 | `gstack browse` | 按键触发 API 调用，panel 出现 |
| 重试按钮 | `gstack browse` | 模拟 500，观察错误文案 + 重试交互 |
| 回归功能 | `gstack browse` | toolbar / tab / close 交互正常 |

---

## 7. 依赖关系

```
E19-1-QA1（产出物完整性）
    ↑ 基础验证依赖
E19-1-QA2（代码质量）
    ↑
E19-1-QA3（UI/交互）← E19-1-QA2-S2 Mock 清除通过后开始
    ↑
E19-1-QA4（E2E）← E19-1-QA3 四态验证通过后开始
    ↑
E19-1-QA5（建议修复）← 可并行，不阻塞主线
```

---

## 8. 风险与验收

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Build error（`/api/analytics/funnel`）阻塞全量 build | 中 | 中 | 该错误与 E19-1 无关，验证 E19-1 相关文件 TS 编译即可 |
| 建议修复项 S1–S4 未全部解决 | 高 | 低 | S1–S4 为建议项，非 Blocker，评估通过即可 |
| autoOpen prop 始终为 false 导致 ESLint 警告 | 中 | 低 | 建议删除 prop 或加入 deps |
| TC2 在 CI 环境下静默跳过 | 中 | 中 | TC5–TC7 回归覆盖基本功能，S4 修复 TC2 |

---

## 9. PRD 自检清单

- [x] 执行摘要包含：背景 + 目标 + 成功指标 + 已知阻塞项
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体（QA通过 + 可发布两阶段）
- [x] 功能点表格 ID 格式正确（E19-1-QAX.FY）
- [x] 页面集成标注完整（【需页面集成】/ 无）
- [x] 依赖关系图已绘制
- [x] **神技1（剥洋葱）**：每个 Epic 有"本质需求穿透"描述
- [x] **神技2（极简主义）**：每个 Epic 有"最小可行范围"区分
- [x] **神技3（老妈测试）**：Epic E19-1-QA3 有"用户情绪地图"
- [x] **神技4（状态机）**：specs/E19-1-QA3-states.md 标注四态规范
- [x] gstack QA 强制要求已列入验证方法

---

*文档版本: v1.0*
*创建时间: 2026-04-30 23:15 GMT+8*
*Agent: pm*
*基于: analyst analysis.md + vibex-proposals-20260430-sprint19/prd.md*
