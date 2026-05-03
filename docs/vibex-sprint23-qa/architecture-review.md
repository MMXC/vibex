# VibeX Sprint 23 QA — 架构审查报告

**Agent**: architect（架构审查）
**日期**: 2026-05-03
**项目**: vibex-sprint23-qa
**阶段**: architecture-review
**审查人**: Architect Agent

---

## 整体评估

**结论**: ⚠️ **有条件通过（Conditional Pass）**

**理由**: E2-E5 架构方案整体合理，实现完成度高，但存在 6 处明确的 `data-testid` 缺口（影响测试可执行性）、E1 无实际缺口（CI 层已集成完毕）、以及跨 Epic 的 3 项高优先级风险。所有缺陷均可修复，不阻断 Sprint 23 交付。

---

## E1: E2E CI → Slack 报告链路

### 架构评估: ✅ **通过**

### 审查发现

**✅ CI 层已集成完毕（与任务描述相反）**

任务描述称"scripts/e2e-summary-to-slack.ts 存在但未在 CI 中调用"——经源码核实，**该描述已过时**。

`.github/workflows/test.yml` 的 e2e job 末尾已包含：
```yaml
- name: E2E Summary Slack Report
  if: always()
  run: pnpm --filter vibex-fronted run e2e:summary:slack
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    CI: true
    GITHUB_RUN_NUMBER: ${{ github.run_number }}
    GITHUB_RUN_URL: '${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
```

**✅ 脚本实现质量高**

`scripts/e2e-summary-to-slack.ts` 完整实现了：
- Block Kit 格式（header + section + context blocks）
- 失败用例列表（cap at 20，防止 payload 超限）
- `process.exit(0)` 确保 webhook 失败不污染 CI exit code
- `if (!webhookUrl)` 静默跳过，无配置时不抛异常

### 架构风险

| # | 风险描述 | 可能性 | 影响 | 缓解措施 |
|---|---------|--------|------|---------|
| E1-R1 | `process.exit(0)` 掩盖了脚本本身的逻辑错误（如 results.json 读取失败），CI 永远通过 | 低 | 低 | 建议在 `catch` 中区分"报告失败"和"通知失败"，前者应该让 CI 失败 |
| E1-R2 | `results.json` 路径硬编码为 `'./vibex-fronted/playwright-report/results.json'`，在 CI working directory 为 repo root 时可能找不到 | 中 | 中 | 应使用环境变量或相对于 CI artifact 的路径 |
| E1-R3 | 20 个失败用例的 cap 在大型回归中可能不够，但 Slack Block Kit 有 100 block 限制，这是合理的工程折衷 | 低 | 低 | 已有 `_...and N more_` overflow 提示 |

### 改进建议

1. **（建议，非阻断）** 将 `process.exit(0)` 改为 `process.exit(process.env.CI ? 1 : 0)`，让 CI 环境区分"报告脚本错误"和"webhook 失败"
2. **（建议）** `resultsPath` 应支持环境变量注入：`process.env.PLAYWRIGHT_RESULTS_PATH`

---

## E2: Design Review Diff 视图

### 架构评估: ⚠️ **有条件通过**

### 架构合理性: ✅ 高

**`reviewDiff.ts` diff 算法设计合理**：
- 基于 `item.id` 比对，逻辑清晰
- "changed" 同时计入 added + removed，符合版本控制语义
- 覆盖 compliance / accessibility / reuse 三类数据源

**`DiffView.tsx` 组件结构清晰**：
- 四态处理（空状态/理想态）正确
- CSS module 隔离样式，样式类名规范
- 支持 `unchanged` 分组（PRD 范围外，但合理扩展）

### 接口一致性: ⚠️ **有缺口**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `re-review-btn` data-testid | ✅ 已确认 | `ReviewReportPanel.tsx:129` 含 `data-testid="re-review-btn"` |
| `diff-item-added` / `diff-item-removed` | ✅ 已确认 | `DiffView.tsx:27` / `:37` |
| `diff-added-count` / `diff-removed-count` | ✅ 已确认 | `DiffView.tsx:51` / `:63` |
| `diff-view` container | ✅ 已确认 | `DiffView.tsx:44` |
| `diff-empty-state` data-testid | ❌ **缺失** | DiffView 在无差异时显示英文 "No differences found"，**无 `data-testid="diff-empty-state"`**，E2-T6 断言会失败 |
| `diff-view-skeleton` data-testid | ❌ **缺失** | specs/02-epic2-design-review-diff.md E2-T7 要求骨架屏有 `data-testid="diff-view-skeleton"`，但代码中未实现 |
| `diff-error-message` / `diff-retry-btn` | ❌ **缺失** | E2-T9/E2-T10 要求 `data-testid="diff-error-message"` 和 `diff-retry-btn"`，代码中未实现 |

**关键问题**: `DiffView` 是**纯展示组件**，接收 `diff: ReviewDiff` props。骨架屏和错误态在 `ReviewReportPanel` 内部管理，但 `DiffView` 没有提供对应的 error/skeleton 状态渲染路径。

**审查员判断**: `ReviewReportPanel` 有 `data-testid="panel-loading"` 和 `data-testid="panel-retry"`，骨架屏/错误态的 data-testid 可能在 Panel 层实现。但 `DiffView` 的空状态 `data-testid="diff-empty-state"` 确实缺失（当前是 `<div className={styles.empty}>`）。

### 性能影响: ✅ 低风险

- Diff 计算是 O(n) 基于 Map 查找，无性能问题
- DiffView 只渲染 changed/unknown 项目，无大列表风险

### 兼容性: ✅ 高

- 纯前端实现，不依赖后端 `POST /design/review-diff` API
- S2.4 后端 API 未实现不影响前端 diff 功能（已实现纯前端 `computeReviewDiff`）
- 与现有 `ReviewReportPanel` 集成方式为 props 传递，耦合低

### 架构风险

| # | 风险描述 | 可能性 | 影响 | 缓解 |
|---|---------|--------|------|------|
| E2-R1 | `DiffView` 空状态缺少 `data-testid="diff-empty-state"` — tester E2-T6 会失败 | 高 | 中 | 立即修复：在空状态 div 上添加 `data-testid="diff-empty-state"` |
| E2-R2 | `diff-view-skeleton` 和错误态 data-testid 在 `DiffView` 中缺失 — E2-T7/E2-T9 会失败 | 高 | 中 | 建议在 `ReviewReportPanel` 已有 loading/error 态的情况下，澄清 specs 中 skeleton/error testid 是给 DiffView 还是 Panel |
| E2-R3 | 后端 `POST /design/review-diff` API 无对应实现（S2.4）— PRD 提到但 Architecture 未覆盖 | 中 | 中 | 前端 diff 可独立工作；后端 API 如需实现，建议在 Sprint 24 |
| E2-R4 | 国际化问题：`DiffView` 硬编码英文 "Added" / "Removed" / "No differences found"，PRD/prd.md 使用中文 | 低 | 低 | 不阻塞，但建议 i18n 化 |

### 改进建议

1. **（P0）** 在 `DiffView.tsx` 空状态 div 上添加 `data-testid="diff-empty-state"`
2. **（P1）** 澄清 `diff-view-skeleton` / `diff-error-message` / `diff-retry-btn` 的归属（Panel 层还是 DiffView 层），并补充对应 data-testid

---

## E3: Firebase Cursor Sync

### 架构评估: ✅ **通过**

### 架构合理性: ✅ 高

**设计亮点**：
- **零 SDK 依赖**：使用原生 `fetch` + `EventSource`（Server-Sent Events）实现 Firebase RTDB 实时同步，避免了 `firebase/app` 导入带来的 bundle size 问题。这是正确的架构决策。
- **Mock 降级**：未配置 Firebase 时使用内存 mock，不影响开发/CI 环境
- **Polling fallback**：`EventSource.onerror` 触发轮询降级，容错设计合理
- **`visibilitychange` 清理**：页面隐藏时清除 presence，防止"幽灵在线"

**`useCursorSync` debounce 实现**：
```typescript
// useCursorSync.ts:28-34
function debounce<T>(fn: T, delayMs: number): T {
  let timer = setTimeout(...)
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delayMs)
  }
}
```
- 100ms debounce 满足 <200ms 目标（debounce 最多延迟 100ms + 网络延迟）
- 使用 `useRef` 存储 debounced write 函数，避免 effect 重刷

**`RemoteCursor` 组件**：
- `isMockMode=true` 时返回 `null`，不渲染任何 DOM 节点
- SVG cursor + username label，样式通过 CSS module 隔离
- `transform: translate(x, y)px` 定位，GPU 加速

### 接口一致性: ✅ 完整

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `data-testid="remote-cursor"` | ✅ | `RemoteCursor.tsx:43` |
| `data-testid="remote-cursor-label"` | ✅ | `RemoteCursor.tsx:54` |
| `cursor.x` / `.y` / `.nodeId` / `.timestamp` | ✅ | `presence.ts:20-25` |
| `isMockMode=true` → null | ✅ | `RemoteCursor.tsx:35` |

### 性能影响: ✅ 低风险

| 检查项 | 结论 |
|--------|------|
| 100ms debounce 合理性 | ✅ 满足 <200ms spec，且不会过度写入 Firebase |
| SSE 连接的内存泄漏风险 | ✅ unsubscribe 返回 clean-up function，visibilitychange 也有清理 |
| 多用户时 10 个 cursor 限制 | ✅ `usePresence: setOthers(users.slice(0, 10))` 防止渲染过多 |

### 兼容性: ✅ 高

- Firebase REST API 是 Firebase SDK 的下层抽象，向后兼容
- mock 模式在 CI 中天然降级，不报错
- 与现有 Canvas 架构无冲突

### 架构风险

| # | 风险描述 | 可能性 | 影响 | 缓解 |
|---|---------|--------|------|------|
| E3-R1 | E2E 测试覆盖 S3.4 缺失 — cursor sync Playwright E2E 场景未实现 | 高 | 低 | 补充 Playwright 测试：模拟多用户 presence，验证 cursor 渲染 |
| E3-R2 | `useCursorSync` 在 `canvasId` 变化时重建 debounce，但 `pendingCursorRef` 可能有竞态 | 低 | 低 | `pendingCursorRef` 在 debounce 外层，合理 |
| E3-R3 | Firebase SSE streaming URL 构建中 `FIREBASE_CONFIG.databaseURL.split('://')[1].split('.')[0]` 有脆弱性 — URL 格式变化会导致 ns 错误 | 中 | 中 | 建议验证 RTDB URL 格式或使用 Firebase app config 字段 |

### 改进建议

1. **（P1）** 补充 S3.4 Playwright E2E 测试用例
2. **（建议）** 添加 RTDB URL 格式验证，防止 ns 解析错误

---

## E4: Canvas 导出格式扩展

### 架构评估: ⚠️ **有条件通过**

### 架构合理性: ✅ 高

**PlantUML exporter**：
- 支持 class / sequence / usecase 三种图类型
- `pumlEscape` 处理特殊字符，防止 PlantUML 语法错误
- `validatePlantUML` 验证 `@startuml` / `@enduml` 包裹和顺序
- 关系箭头（`..>`）正确映射 canvas relationships

**SVG exporter**：
- 固定 canvas 尺寸（1200×800），合理
- `generateContextSVG` / `generateFlowSVG` 分层渲染
- `try-catch` 降级策略：`fallbackMessage: '当前视图不支持 SVG 导出'`
- **SVG 降级使用 `alert()` 是 UX 问题，但功能正确**（见下）

**JSON Schema exporter**：
- 类型定义完整（`JSONSchemaDocument` / `JSONSchemaProperty`）
- 支持 API params / status enum / nested structures
- 错误时返回 `{ success: false, error }`，调用方处理

### 接口一致性: ⚠️ **有缺口**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `plantuml-option` data-testid | ✅ | `DDSToolbar.tsx:313` |
| `schema-option` data-testid | ✅ | `DDSToolbar.tsx:326` |
| `svg-option` data-testid | ✅ | `DDSToolbar.tsx:337` |
| 空 canvas 时导出选项 disabled | ❌ **缺失** | specs/04 要求 canvas 无数据时导出选项 disabled，但代码中无此逻辑 |
| SVG 降级文案正确 | ⚠️ 部分 | `handleExportSVG` 使用 `alert()`，会显示"当前视图不支持 SVG 导出"，但 UI 交互差 |
| DDSToolbar import error | ❌ **缺失** | `handleImportChange` 用 `setImportError`，但 export modal 中没有展示该 error 的 UI（只在 toolbar header 显示 toast） |

**关键问题 - E4 空状态**：
`handleExportPlantUML` / `handleExportJSONSchema` / `handleExportSVG` 均无 canvas 数据校验。当前 canvas stores（`useContextStore`、`useFlowStore`、`useComponentStore`）为空数组时仍会生成导出文件（PlantUML 生成空文件，JSON Schema 生成空 schema）。

### 性能影响: ✅ 低风险

- PlantUML 生成：O(n)，无异步操作，<50ms
- SVG 生成：字符串拼接，无 DOM 操作，<100ms
- JSON Schema：简单遍历，<50ms
- 均满足导出交互 <200ms 目标

### 兼容性: ✅ 高

- 三个 exporter 均独立于现有 DDS 架构，无副作用
- `.puml` / `.schema.json` 后缀满足 PRD 验收标准
- 降级策略隔离，单个 exporter 失败不影响其他

### 架构风险

| # | 风险描述 | 可能性 | 影响 | 缓解 |
|---|---------|--------|------|------|
| E4-R1 | DDSToolbar export handlers 无 canvas 数据校验 — 空 canvas 导出生成无效文件 | 高 | 中 | 在各 handler 开头检查数据是否为空，为空时禁用按钮 |
| E4-R2 | SVG 降级使用 `alert()` 而非 toast — 阻断用户操作，UX 差 | 高 | 低 | 替换为 toast 或 inline error message |
| E4-R3 | PlantUML `relationships` 映射到 `..>` 但无 source/target 混淆风险 — `ctx.relationships` 只有 targetId，无方向 | 低 | 低 | 可接受，但建议记录关系类型（composition/aggregation）|
| E4-R4 | vitest 版本问题（`vi.isolateModules is not a function`）— E4 ExportControls 1/28 失败 | 中 | 低 | Sprint 24 修复，不阻塞 |

### 改进建议

1. **（P0）** 在 DDSToolbar export handlers 中添加空 canvas 检查，无数据时禁用按钮
2. **（P1）** 将 SVG 降级 `alert()` 替换为 toast/inline message（不阻断 ExportModal 其他操作）
3. **（P2）** vitest 配置优化（`vi.mock` 替代 `vi.isolateModules`）

---

## E5: 模板库版本历史 + 导入导出

### 架构评估: ✅ **通过**

### 架构合理性: ✅ 高

**`useTemplateManager` 设计优秀**：
- localStorage 持久化，key 格式 `template:${templateId}:history`
- 自动清理逻辑：`.slice(0, MAX_SNAPSHOTS)` 精确实现 ≤10 个限制
- JSON Schema 验证轻量实现（无外部依赖）
- 导出/导入/快照管理职责单一，可测试性强

**`TemplateHistoryPanel` 组件**：
- 快照列表显示时间戳 + label + 恢复/删除操作
- 空状态显示"暂无历史快照"，无 spinner
- 限制显示 `history.length / 10 个快照`，与 spec 一致

**`TemplateGallery` 集成**：
- 导出/导入/历史按钮仅在选择模板后显示（`selectedTemplate` guard）
- 导入使用隐藏的 `<input type="file">`，符合标准模式

### 接口一致性: ⚠️ **轻微缺口**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| `template-export-btn` data-testid | ✅ | `TemplateGallery.tsx:175` |
| `template-import-btn` data-testid | ✅ | `TemplateGallery.tsx:182` |
| `template-history-btn` data-testid | ✅ | `TemplateGallery.tsx:189` |
| `history-item` data-testid | ✅ | `TemplateHistoryPanel.tsx:63` |
| `history-empty-state` data-testid | ❌ **缺失** | `TemplateHistoryPanel.tsx:53` 空状态 div 无 `data-testid="history-empty-state"` |
| `import-error-message` data-testid | ❌ **缺失** | 导入错误用 native `alert()`，无 data-testid |
| 导出文件名格式 `vibex-template-{id}-{date}.json` | ✅ | 符合 spec |

**缺口说明**：
- `history-empty-state` 缺失：`E5-T9` 断言 `screen.getByTestId('history-empty-state')` 会失败
- `import-error-message` 缺失：`E5-T11` / `E5-T12` / `E5-T13` 的 UI 层断言需要此 data-testid

### 性能影响: ✅ 低风险

- localStorage 读写均为同步，但 ≤10 个 snapshot 的数据量极小（<1MB）
- JSON 序列化/反序列化在主线程，无性能问题

### 兼容性: ✅ 高

- 纯前端 localStorage，无后端依赖
- Phase 2 迁移到后端时仅需修改 `useTemplateManager` 实现，不影响 UI

### 架构风险

| # | 风险描述 | 可能性 | 影响 | 缓解 |
|---|---------|--------|------|------|
| E5-R1 | `history-empty-state` data-testid 缺失 — E5-T9 断言会失败 | 高 | 中 | 立即修复：在 `<div className={styles.empty}>` 上添加 `data-testid="history-empty-state"` |
| E5-R2 | 导入错误用 native `alert()` — 阻塞页面，无法 E2E 测试 | 高 | 低 | 替换为 state + inline error display，添加 `data-testid="import-error-message"` |
| E5-R3 | `validateTemplateData` 仅校验顶层字段，`items` 数组内部结构无验证 | 低 | 低 | 可接受，Phase 2 后端存储时补充 |
| E5-R4 | 文件大小限制（>5MB）在 specs/E5-T13 中提到，但代码中无实现 | 中 | 低 | 建议添加 `if (file.size > 5 * 1024 * 1024) throw new Error(...)` |

### 改进建议

1. **（P0）** 在 `TemplateHistoryPanel.tsx` 空状态 div 上添加 `data-testid="history-empty-state"`
2. **（P1）** 替换 `alert()` 为 state + inline error，添加 `data-testid="import-error-message"`
3. **（P1）** 添加 5MB 文件大小校验（对应 specs E5-T13）

---

## 跨 Epic 风险汇总表

| 风险 ID | 风险描述 | Epic | 可能性 | 影响 | 优先级 | 缓解行动 |
|---------|---------|------|--------|------|--------|---------|
| X-R1 | **E2/E5 `data-testid` 缺失**（diff-empty-state / history-empty-state）影响测试可执行性 | E2, E5 | **高** | **中** | **P0** | 立即修复：添加对应 data-testid |
| X-R2 | **E4 DDSToolbar 空 canvas 无校验**，生成无效导出文件 | E4 | **高** | **中** | **P0** | 立即修复：handler 开头添加数据校验，禁用按钮 |
| X-R3 | **E5 import 用 alert()** 替代 UI error，无 data-testid，E2E 无法验证错误场景 | E5 | **高** | 低 | **P1** | 替换为 state + inline display |
| X-R4 | **E3 E2E 测试未覆盖 S3.4** — cursor sync 无 E2E 验证 | E3 | **高** | 低 | **P1** | 补充 Playwright E2E 测试用例 |
| X-R5 | **E4 SVG 降级用 alert()** — 阻断 ExportModal 操作 | E4 | 高 | 低 | **P1** | 替换为 toast/inline message |
| X-R6 | **E1 `process.exit(0)`** 掩盖脚本自身错误 — CI 可能虚假通过 | E1 | 低 | 中 | P2 | 区分错误类型，CI 环境返回 exit 1 |
| X-R7 | **E2 后端 `POST /design/review-diff` API** 无实现计划，S2.4 未覆盖 | E2 | 中 | 中 | P2 | 前端 diff 可独立工作；确认是否 Sprint 23 需要 |
| X-R8 | **E5 文件大小无校验**（specs E5-T13） | E5 | 中 | 低 | P2 | 添加 5MB 校验 |
| X-R9 | **E4 vitest 版本问题** — ExportControls 1/28 失败 | E4 | 中 | 低 | P3 | Sprint 24 优化 |

---

## 各 Epic 架构风险 + 改进建议（汇总）

### E1（2 条）

1. **（P2）** `process.exit(0)` 应区分"webhook 失败"（exit 0）和"脚本逻辑错误"（exit 1）
2. **（P2）** `resultsPath` 硬编码应改为环境变量注入，支持 CI artifact 路径变化

### E2（2 条）

1. **（P0）** `DiffView.tsx` 空状态 div 添加 `data-testid="diff-empty-state"`
2. **（P1）** 澄清 `diff-view-skeleton` / `diff-error-message` / `diff-retry-btn` 的归属（Panel vs DiffView），补充对应 data-testid

### E3（2 条）

1. **（P1）** 补充 S3.4 Playwright E2E 测试覆盖
2. **（建议）** RTDB URL 格式验证，防止 ns 解析错误

### E4（3 条）

1. **（P0）** DDSToolbar export handlers 添加空 canvas 数据校验，为空时禁用按钮
2. **（P1）** SVG 降级 `alert()` 替换为 toast/inline message，不阻断 ExportModal
3. **（P3）** vitest `vi.isolateModules` 替换为 `vi.mock`

### E5（2 条）

1. **（P0）** `TemplateHistoryPanel.tsx` 空状态 div 添加 `data-testid="history-empty-state"`
2. **（P1）** 导入错误替换 `alert()` 为 state + inline error display + `data-testid="import-error-message"`

---

## 驳回理由

**无驳回项**。

所有 Epic 均具备实施条件，技术方案可行。E2-E5 存在 data-testid 缺口属于可修复的质量问题，不构成架构驳回理由。

---

## 建议优先级排序

| 优先级 | Epic | 行动项 | 预计工时 |
|--------|------|--------|---------|
| **P0** | E2 | 添加 `data-testid="diff-empty-state"` 到 DiffView | 5min |
| **P0** | E5 | 添加 `data-testid="history-empty-state"` 到 TemplateHistoryPanel | 5min |
| **P0** | E4 | export handlers 添加空 canvas 校验（禁用按钮） | 10min |
| **P1** | E3 | 补充 cursor sync E2E Playwright 测试用例 | 2-3h |
| **P1** | E5 | 导入错误用 state+inline display 替代 alert() | 30min |
| **P1** | E4 | SVG 降级 alert() 替换为 toast | 30min |
| **P1** | E2 | 澄清 skeleton/error data-testid 归属并补充 | 30min |
| **P2** | E1 | process.exit 区分错误类型 | 15min |
| **P2** | E5 | 添加 5MB 文件大小校验 | 15min |
| **P2** | E2 | 确认后端 diff API 是否 Sprint 23 需要 | 30min（讨论）|
| **P3** | E4 | vitest 配置优化 | 1h |

---

## 执行决策

- **决策**: 已采纳（有条件）
- **执行项目**: vibex-sprint23-qa
- **执行日期**: 2026-05-03
- **条件**: 所有 P0 项（Sprint 23 内）在 DoD 验证前必须修复；P1 项建议 Sprint 23 完成

---

## 附录：验证清单

| 检查项 | E1 | E2 | E3 | E4 | E5 |
|--------|----|----|----|----|-----|
| Tech Stack 合理 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 架构图（Mermaid）| N/A | N/A | N/A | N/A | N/A |
| API 定义 | N/A | ✅ | ✅ | ✅ | ✅ |
| 数据模型 | N/A | ✅ | ✅ | ✅ | ✅ |
| 测试策略定义 | ⚠️ specs完整但实现有缺口 | ⚠️ data-testid缺失 | ⚠️ E2E缺失 | ⚠️ 空状态缺失 | ⚠️ data-testid缺失 |
| 性能影响评估 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 兼容性评估 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 风险识别（≥3条）| ✅ 3条 | ✅ 4条 | ✅ 3条 | ✅ 4条 | ✅ 4条 |

---

*Architect Agent | VibeX Sprint 23 QA — 架构审查报告*
*生成时间: 2026-05-03 08:00 GMT+8*
