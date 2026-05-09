# VibeX Sprint 34 — Analyst Review Report

**Analyst**: analyst
**日期**: 2026-05-09
**项目**: vibex-proposals-sprint34
**验证方法**: 源码审查（+ gstack browser pending）
**状态**: ✅ 问题真实性已验证

---

## 审查结论

| 提案 | 验证结果 | 评级 |
|------|----------|------|
| P001 撤销/重做 | ✅ 确认 | 可采纳 |
| P002 性能基线 | ⚠️ 部分确认 | 可采纳（需调整描述） |
| P003 快捷键 | ⚠️ 基础设施存在，实现不完整 | 可采纳（需调整描述） |
| P004 Webhook | ✅ 确认 | 建议推迟 Sprint 35 |
| P005 移动端 | ✅ 确认 | 建议 P2 |

---

## P001 — 撤销/重做系统

### ✅ 问题真实性验证

**验证方法**: 源码审查 `DDSCanvasStore.ts`

**发现**:
- `DDSCanvasStore`（`src/stores/dds/DDSCanvasStore.ts`）**没有任何 undo/redo 相关代码**
- `useKeyboardShortcuts` hook 已实现完整快捷键绑定（含 `Ctrl+Z` / `Ctrl+Shift+Z`）
- `DDSCanvasPage.tsx` 第 375-380 行：`undoCallback` 和 `redoCallback` 是返回 `false` 的 stub 函数
- 源码注释明确说明："*For DDS canvas, undo/redo will be wired when DDS history is implemented.*"
- `confirmationStore` 有自己的 undo/redo，但仅限 onboarding 流程，不覆盖画布操作

**结论**: 问题真实，优先级 P0 合理。

### 业务场景分析

用户在画布上进行以下操作后无法撤销：
- 添加/删除/移动节点
- 编辑节点属性
- Group 折叠/展开
- 冲突仲裁操作

误操作成本：用户必须手动恢复或重来，在 Group 折叠等复杂操作中尤为痛苦。

### 技术方案选项

#### 方案 A（推荐）：Command Pattern + History Store

```
stores/dds/canvasHistoryStore.ts
├── past: Command[]      // 已执行的命令栈
├── future: Command[]    // 撤销后可重做的栈
├── execute(cmd)         // 执行并入栈
├── undo() → rollback()  // 出栈并回滚
└── redo() → execute()   // 从 future 出栈重做
```

- 每个操作封装为 `Command` 对象（`execute()` + `rollback()`）
- 覆盖：节点增删改、Group 折叠/展开、属性变更、位置移动
- `Ctrl+Z` / `Ctrl+Shift+Z` 绑定到 `historyStore.undo()` / `historyStore.redo()`
- localStorage 持久化（最近 50 步，防止膨胀）
- 通过 Zustand middleware 包装现有 Store action，**不修改现有 action 签名**

**优点**: 精确控制哪些操作可撤销，rollback 语义清晰
**缺点**: 需要为每个操作写 Command 类，工作量中等

#### 方案 B：状态快照 + Diff

```
stores/dds/canvasHistoryStore.ts
├── snapshots: DeepPartial<DDSCanvasState>[]
├── push(snapshot)
├── undo() → restore(snapshots.pop())
└── redo() → restore(futureSnapshots.pop())
```

- 每次状态变更前保存完整快照（使用 Immer 或 `structuredClone`）
- 撤销时直接恢复快照
- **优点**: 无需为每个操作写 Command 类
- **缺点**: 内存占用大，快照粒度粗，无法精确控制单操作撤销

**选择方案 A**。理由：Canvas 操作需要细粒度撤销（如只撤销节点移动而不影响属性变更），Command Pattern 更适合。

### 初步风险识别

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| History 栈内存膨胀 | 中 | 中 | 限制 50 步 + LRU 淘汰 |
| Command 入侵现有 Store action | 中 | 低 | 通过 middleware 包装，不改现有签名 |
| 异步操作（API 调用）撤销 | 低 | 中 | 异步 Command 标记，撤销时发起补偿请求 |

### 验收标准

- [ ] `DDSCanvasPage.tsx` 中 `undoCallback` 和 `redoCallback` 连接到真实 historyStore
- [ ] 节点增删改支持撤销/重做（单元测试覆盖）
- [ ] Group 折叠/展开支持撤销/重做
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` 全局快捷键正常工作
- [ ] localStorage 持久化：刷新页面后历史记录保留
- [ ] History 栈超过 50 步时自动淘汰旧记录
- [ ] 现有 53 个 Canvas 测试全部通过

---

## P002 — 性能基线建立

### ⚠️ 部分确认（需调整提案描述）

**验证方法**: 源码审查 `next.config.ts` + `package.json`

**发现**:
- `@next/bundle-analyzer` **已安装并配置**（`package.json` 第 98 行）
- `next.config.ts` 使用 `withBundleAnalyzer`，但 `enabled: process.env.ANALYZE === 'true'` — 默认**关闭**
- 需要手动设置 `ANALYZE=true` 才能生成报告，**不是自动化流程**
- **无 Lighthouse CI 集成**
- **无 Core Web Vitals 基线**
- **无 PR-level 性能回归检测**

**结论**: 问题真实，但描述需调整——"bundle 分析工具已存在但未自动化"而非"完全缺失"。根因是缺乏 CI 集成和持续监控机制。

### 业务场景分析

当前无法回答以下问题：
- 每次 PR 对 bundle 大小的影响是多少？
- 首次加载时间是否有变化？
- 复杂画布的 render 性能如何？

无基线 = 无优化依据 = 优化效果无法量化。

### 技术方案选项

#### 方案 A（推荐）：Bundle Analyzer CI 集成 + Lighthouse CI

**Bundle 分析**:
- 在 `.github/workflows/bundle-report.yml` 中集成 `ANALYZE=true` build
- 自动上传 bundle report（作为 GitHub Actions artifact）
- 设置 bundle 预算告警：`totalSize > 500KB` → PR 评论警告

**加载性能基线**:
- 集成 `@lhci/cli`（Lighthouse CI）
- 在 `lighthouserc.js` 中定义 Core Web Vitals 基线：
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- PR trigger 运行 Lighthouse，基线回归 → PR 阻塞

**注意**: 需要 Cloudflare Pages 部署配置（`NEXT_OUTPUT_MODE === 'standalone'` 已就绪）。

#### 方案 B：仅 Bundle Analyzer（轻量级）

- 仅集成 `ANALYZE=true` build 到 PR workflow
- 不引入 Lighthouse CI（成本较高）
- 人工审查 bundle report

**选择方案 A**。Bundle 分析 + Lighthouse CI 总工时约 4h，ROI 高。

### 初步风险识别

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Lighthouse CI 因网络波动误报 | 中 | 低 | 设置合理阈值 + 趋势分析 |
| Bundle 报告artifact 占用存储 | 低 | 低 | 设置 7 天 retention |
| 性能基线制定不合理（过严/过松） | 中 | 中 | 初始基线宽松，迭代收紧 |

### 验收标准

- [ ] `.github/workflows/bundle-report.yml` 存在并可在 PR 时触发
- [ ] Bundle report artifact 自动上传到 GitHub Actions
- [ ] `lighthouserc.js` 定义 Core Web Vitals 基线
- [ ] Lighthouse CI 集成到 PR workflow
- [ ] Dashboard 页面 Lighthouse 基线测试通过
- [ ] Bundle 主包大小基线文档化（单位：KB）

---

## P003 — 快捷键系统

### ⚠️ 部分确认（需调整提案描述）

**验证方法**: 源码审查 `useKeyboardShortcuts.ts` + `shortcutStore.ts`

**发现**:
- `useKeyboardShortcuts` hook **已完整实现**（`src/hooks/useKeyboardShortcuts.ts`，约 250 行）
- 支持的快捷键：`Ctrl+Z`/`Y`（撤销/重做）、`/`（搜索）、`Ctrl+K`（搜索）、`+/-`/`0`（缩放）、`Del`/`N`/`Esc` 等
- 焦点在输入框时不触发快捷键（Esc 除外）——设计合理
- `shortcutStore.ts` **已完整实现**——快捷键配置 UI，支持用户自定义快捷键并持久化
- **问题所在**: `shortcutStore` 定义了 shortcuts，但这些 shortcuts **没有连接到 `useKeyboardShortcuts` hook**
- `DDSCanvasPage` 传入的 `undo`/`redo` 是 stub；`shortcutStore` 的 shortcuts 未被 `useKeyboardShortcuts` 读取

**结论**: 基础设施已存在且质量良好，但未完全连接。需要：
1. 将 `shortcutStore` 的 `currentKey` 配置注入 `useKeyboardShortcuts`
2. 让 `DDSCanvasPage` 的 undo/redo stub 连接真实 historyStore（与 P001 同 Sprint）

### 业务场景分析

高频用户（产品经理、架构师）期望：
- 不用鼠标完成画布编辑（删除、复制、粘贴）
- 快速缩放和导航
- 自定义快捷键以适配个人习惯

当前：部分快捷键已绑定但功能 stub，用户感知是"快捷键有时有效有时无效"。

### 技术方案选项

#### 方案 A（推荐）：shortcutStore 与 useKeyboardShortcuts 集成

- `useKeyboardShortcuts` 改为读取 `shortcutStore.getState().shortcuts` 动态注册快捷键
- 支持用户自定义快捷键实时生效（无需重新加载）
- 快捷键冲突检测已有（`conflictCheckResult`），需在运行时触发

#### 方案 B：固定快捷键（简化）

- 保持 `useKeyboardShortcuts` 硬编码快捷键
- `shortcutStore` 作为仅读配置，不驱动运行时行为
- **缺点**: 用户配置的快捷键不生效，`shortcutStore` 变成"假功能"

**选择方案 A**。`shortcutStore` 已有完整冲突检测逻辑，不集成是对已有投入的浪费。

### 验收标准

- [ ] `shortcutStore` 中配置的 `currentKey` 驱动 `useKeyboardShortcuts` 运行时行为
- [ ] 用户在设置页面修改快捷键后，画布中实时生效
- [ ] 快捷键冲突检测在用户编辑时触发并阻止保存
- [ ] `?` 键打开快捷键帮助面板（当前 DDSCanvasPage 已有 `handleQuestionMark`）
- [ ] 焦点在输入框时不触发画布快捷键（已有，需回归验证）

---

## P004 — Webhook 事件通知

### ✅ 问题真实性验证

**验证方法**: 源码审查 `notifier.ts` + 后端路由扫描

**发现**:
- `notifier.ts` 是**内部 API 变更通知工具**，用于 GitHub PR 评论和 Slack 通知
- `webhookUrl` 字段是通知配置的 destination，**不是用户级 webhook 注册系统**
- 后端无 `webhooks/` API route
- 前端无 Webhook 设置 UI
- 无 webhook 投递队列（BullMQ / SQS）
- 无 HMAC 签名校验
- 无用户可配置的外部 URL 注册

**结论**: 问题真实。"Webhook" 需求需要从零设计实现，不存在"部分实现"。

### 业务场景分析

企业用户需求：
- VibeX 事件 → 触发外部系统（如 CRM、工单系统、数据仓库）
- 典型事件：`project.created`、`canvas.updated`、`project.shared`
- 需要：URL 注册、签名校验、重试机制、投递日志

### 技术方案选项

#### 方案 A（推荐）：事件驱动 Webhook（完整实现）

- `webhookStore`（Prisma model）：`userId`, `url`, `events[]`, `secret`, `active`
- `POST /api/webhooks` — 注册 webhook
- `GET /api/webhooks` — 列出用户的 webhook
- `DELETE /api/webhooks/:id` — 删除
- `POST /api/webhooks/test` — 发送测试事件
- 投递：`BullMQ` job queue + `HMAC-SHA256` 签名（`X-VibeX-Signature` header）
- 重试：指数退避（1s / 3s / 9s），最多 3 次
- Webhook 管理 UI：`/dashboard/settings/webhooks`

#### 方案 B：简化版（Webhooks v1）

- 无 BullMQ，使用 `setTimeout` 重试
- 无 HMAC 校验（仅 HTTPS + IP 白名单）
- 仅支持 `project.created` 和 `project.shared` 事件

**选择方案 A**。企业级需求必须支持签名校验和可靠投递。

### 风险识别（已超出 Sprint 34 工时建议）

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| Webhook 死循环（用户配置的 URL 指向 VibeX API） | 低 | 高 | URL 白名单 + 深度限制 |
| 投递队列阻塞主线程 | 中 | 中 | 必须使用独立 job queue |
| 用户 webhook URL 安全问题 | 中 | 高 | HMAC 签名 + HTTPS 强制 |
| 幂等性设计缺失导致重复投递 | 中 | 中 | 事件 ID + deduplication key |

**建议**: 此提案建议推迟到 Sprint 35，单独进行架构评审（安全审计 + 幂等性设计）。

### 验收标准

- [ ] `Webhook` Prisma model 存在并通过 migration
- [ ] `POST/GET/DELETE /api/webhooks` 端点通过测试
- [ ] HMAC-SHA256 签名正确生成和验证
- [ ] BullMQ job queue 投递成功（含重试）
- [ ] Webhook 管理 UI 完整（创建/测试/删除）
- [ ] `project.created` / `canvas.updated` / `project.shared` 事件投递通过 E2E 测试

---

## P005 — 画布移动端响应式

### ✅ 问题真实性验证

**验证方法**: 源码审查 `DDSFlow.tsx` + CSS 文件

**发现**:
- `DDSFlow.tsx` 中的 `viewport` 状态仅用于计算屏幕坐标（`screenX = position.x * zoom + x`），**不是响应式断点**
- 无 `pinch-to-zoom` / `swipe-pan` 触摸手势
- `DDSScrollContainer.module.css` 无任何 `@media (max-width)` 断点规则
- 画布区域无 `overflow: hidden` 保护，移动端会出现水平溢出
- 无 touch event listener

**结论**: 问题真实，画布在小屏设备上体验差。

### 风险评估

**P005 风险与画布核心交互冲突**：
- React Flow 已有内置缩放逻辑（鼠标滚轮），添加手势时需确保不冲突
- 需要在 `useViewport` 或 `useReactFlow` 的手势处理之上包装自定义逻辑
- 移动端画布操作优先级低于核心桌面体验

**建议**: P2 优先级，Sprint 35 或之后实现。

---

## 综合风险矩阵

| 提案 | 核心风险 | 可能性 | 影响 | 缓解 |
|------|----------|--------|------|------|
| P001 | History 栈内存膨胀 | 中 | 中 | 限制 50 步 |
| P001 | Command 入侵现有 Store | 中 | 低 | middleware 包装 |
| P002 | Lighthouse 误报 | 中 | 低 | 趋势分析，非单次 |
| P003 | 快捷键与浏览器冲突 | 高 | 低 | 可配置覆盖 |
| P004 | Webhook 死循环/幂等性 | 低 | 高 | 白名单+签名 |
| P004 | 工时超量 | 高 | 中 | 拆分为独立 Epic |
| P005 | 手势与现有缩放冲突 | 高 | 中 | 媒体查询条件加载 |

---

## Sprint 34 评审建议

### 采纳组合

**P001 + P002 + P003**（共约 16h）

理由：
- P001 是最高优先级痛点，undo/redo stub 已存在只等连接
- P002 工时低（4h），ROI 极高
- P003 与 P001 共享 `undoCallback`/`redoCallback` 连接工作，拆分需重新对齐
- P004/P005 建议推迟（工时高 / 风险高 / 非 P0）

### 驳回项

**无驳回项**。所有提案问题均真实存在。

---

## 执行决策

- **决策**: 已采纳（P001/P002/P003）
- **执行项目**: vibex-proposals-sprint34
- **执行日期**: 待 Coord 决策

---

*本文档由 Analyst Agent 审查生成，基于 Sprint 1-33 交付成果源码验证。*
