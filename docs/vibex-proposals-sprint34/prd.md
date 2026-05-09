# VibeX Sprint 34 — PRD

**Agent**: pm
**日期**: 2026-05-09
**项目**: vibex-proposals-sprint34
**仓库**: /root/.openclaw/vibex
**文档版本**: v1.0

---

## 1. 背景与目标

Sprint 34 目标：基于 Sprint 1-33 交付成果，修复用户高频痛点（P001 撤销/重做缺失）、建立性能可见性（P002 性能基线）、完善键盘交互（P003 快捷键集成）。P004 Webhook 和 P005 移动端响应式因工时/风险因素建议推迟。

---

## 2. 采纳决策

| 提案 | PM 决策 | 理由 |
|------|---------|------|
| P001 撤销/重做 | ✅ 采纳 | 最高优先级痛点，stub 已存在，ROI 清晰 |
| P002 性能基线 | ✅ 采纳 | 工时低（4h），ROI 高，描述已由 analyst 修正 |
| P003 快捷键系统 | ✅ 采纳 | 与 P001 共享集成工作，拆分不经济 |
| P004 Webhook | ⏸️ 推迟 Sprint 35 | 工时超量，安全/幂等性需专项审计 |
| P005 移动端 | ⏸️ 推迟 P2 | 手势与现有缩放冲突风险高，非 P0 |

---

## 3. 功能详情

### P001: DDS 画布撤销/重做系统

**问题描述**: 用户在 DDS 画布上的所有操作（节点增删改、Group 折叠展开、冲突仲裁）均无法撤销，误操作代价高，尤其 Group 折叠等复杂操作一旦误触只能重来。

**影响范围**: `src/stores/dds/DDSCanvasStore.ts`、`src/pages/DDSCanvasPage.tsx`、`src/hooks/useKeyboardShortcuts.ts`

#### 用户故事

| # | 故事 | 角色 | 行为 | 收益 |
|---|------|------|------|------|
| US-001 | 误操作撤销 | DDS 画布用户 | 在画布上执行任意操作后，按 `Ctrl+Z` | 恢复到操作前状态，无需手动重做 |
| US-002 | 重做恢复 | DDS 画布用户 | 按 `Ctrl+Shift+Z` 或 `Ctrl+Y` | 恢复被撤销的操作 |
| US-003 | 持久化历史 | DDS 画布用户 | 刷新页面后 | 历史记录保留，继续可撤销/重做 |
| US-004 | 历史边界管理 | 系统 | History 栈超过 50 步 | 自动淘汰最旧记录，防止内存膨胀 |

#### 验收标准（粒度细化到可写 expect() 断言）

- [ ] `DDSCanvasPage.tsx` 第 375-380 行的 `undoCallback` 和 `redoCallback` 不再返回 `false`，已连接到 `canvasHistoryStore.undo()` / `canvasHistoryStore.redo()`
- [ ] 添加节点到画布后，`historyStore.past.length` 增 1，`Ctrl+Z` 后节点消失，`Ctrl+Shift+Z` 后节点恢复
- [ ] 删除节点、编辑节点属性、移动节点位置、Group 折叠/展开均支持撤销/重做
- [ ] `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` 全局快捷键在画布页面正常工作
- [ ] 页面刷新后，`historyStore.past` 数据从 localStorage 恢复
- [ ] `historyStore.past.length > 50` 时，自动 `shift()` 淘汰最旧记录
- [ ] 现有 53 个 Canvas 单元测试全部通过

#### 技术方案

**Command Pattern + History Store**：
- `stores/dds/canvasHistoryStore.ts`：双栈结构（past/future），`execute(cmd)` 入栈，`undo()` 出栈回滚，`redo()` 从 future 恢复
- 每个操作封装为 `Command` 对象（`execute()` + `rollback()`）
- 通过 Zustand middleware 包装现有 Store action，不修改现有 action 签名
- localStorage 持久化（限制 50 步）

#### DoD

- [ ] `stores/dds/canvasHistoryStore.ts` 存在并通过单元测试
- [ ] `DDSCanvasPage.tsx` 中 `undoCallback`/`redoCallback` 已连接
- [ ] 所有 Canvas 单元测试通过
- [ ] E2E 测试覆盖撤销/重做场景
- [ ] PRD 文档更新验收标准状态

---

### P002: 性能基线建立

**问题描述**: 当前无法量化每次 PR 对 bundle 大小和加载性能的影响。无基线 = 无优化依据 = 效果无法量化。

**影响范围**: `.github/workflows/`、`next.config.ts`、`lighthouserc.js`

#### 用户故事

| # | 故事 | 角色 | 行为 | 收益 |
|---|------|------|------|------|
| US-005 | PR 级 bundle 报告 | 开发者 | 提交 PR 后自动触发 bundle 分析 | 在 PR 评论中看到主包大小变化，无需手动运行 |
| US-006 | 性能回归检测 | 开发者 | PR 触发 Lighthouse CI | Core Web Vitals 回归时 PR 被阻塞，及时发现 |
| US-007 | 性能基线文档 | 所有人 | 查看文档 | 了解当前性能基线，量化优化效果 |

#### 验收标准

- [ ] `.github/workflows/bundle-report.yml` 存在并可在 PR 时触发，bundle report 作为 artifact 自动上传
- [ ] PR 评论中显示主包大小（KB）和对比基准的变化
- [ ] `lighthouserc.js` 存在并定义 Core Web Vitals 基线：LCP < 2.5s、FID < 100ms、CLS < 0.1
- [ ] Lighthouse CI 集成到 PR workflow，基线回归时 PR 失败
- [ ] Bundle 主包大小基线文档化（单位：KB），存储于 `docs/vibex-proposals-sprint34/performance-baseline.md`
- [ ] Dashboard 页面 Lighthouse 基线测试通过（首次通过后记录）

#### 技术方案

- Bundle 分析：GitHub Actions `ANALYZE=true` build，artifact 上传 + PR 评论
- Lighthouse CI：使用 `@lhci/cli`，PR trigger，趋势分析而非单次阻断

#### DoD

- [ ] `bundle-report.yml` workflow 文件存在并可执行
- [ ] Lighthouse CI 配置完成并在 PR 中运行
- [ ] `performance-baseline.md` 文档已产出，记录当前基线值
- [ ] PRD 文档更新验收标准状态

---

### P003: 快捷键系统集成

**问题描述**: `shortcutStore` 和 `useKeyboardShortcuts` 均已完整实现，但未连接——用户在设置页配置的快捷键不生效。`DDSCanvasPage` 传入的 undo/redo 是 stub。

**影响范围**: `src/hooks/useKeyboardShortcuts.ts`、`src/stores/shortcutStore.ts`、`src/pages/DDSCanvasPage.tsx`

#### 用户故事

| # | 故事 | 角色 | 行为 | 收益 |
|---|------|------|------|------|
| US-008 | 自定义快捷键生效 | 高频画布用户 | 在设置页修改 `Ctrl+Z` 为 `Cmd+Z` | 修改后立即生效，无需重新加载 |
| US-009 | 快捷键冲突阻止 | 高频画布用户 | 设置一个已被占用的快捷键 | 看到冲突警告，保存被阻止 |
| US-010 | 画布焦点保护 | 用户 | 光标在输入框中 | 画布快捷键不触发（Esc 除外），不会误操作 |

#### 验收标准

- [ ] `shortcutStore.getState().shortcuts` 驱动 `useKeyboardShortcuts` 的运行时行为（已动态注册）
- [ ] 用户在设置页修改快捷键后，画布中实时生效（无需重新加载页面）
- [ ] 保存冲突快捷键时，UI 显示冲突警告并阻止保存
- [ ] `?` 键打开快捷键帮助面板
- [ ] 焦点在输入框时不触发画布快捷键（Esc 除外）
- [ ] P001 的 `undoCallback`/`redoCallback` 连接也使 `shortcutStore` 中的撤销/重做快捷键生效

#### 技术方案

- `useKeyboardShortcuts` 改为动态读取 `shortcutStore.getState().shortcuts` 并动态注册/更新监听器
- 复用已有的 `conflictCheckResult` 冲突检测逻辑，在用户编辑时触发

#### DoD

- [ ] `useKeyboardShortcuts` 支持动态快捷键配置
- [ ] 自定义快捷键实时生效
- [ ] 快捷键冲突检测在设置页完整工作
- [ ] PRD 文档更新验收标准状态

---

## 4. 依赖关系图

```
P001: canvasHistoryStore
├── 依赖: DDSCanvasStore（现有，不修改）
├── 依赖: useKeyboardShortcuts（现有，调用 undo/redo）
└── 并行: shortcutStore（无直接依赖，但 P003 共享 useKeyboardShortcuts）

P002: 性能基线
├── 依赖: next.config.ts（现有）
├── 依赖: GitHub Actions（CI 环境）
└── 无其他前端依赖

P003: shortcutStore 集成
├── 依赖: shortcutStore（现有）
├── 依赖: useKeyboardShortcuts（现有）
└── 共享: DDSCanvasPage undo/redo（与 P001 同一连接点）
```

**P001 与 P003 的关键共享点**: `DDSCanvasPage` 的 `undoCallback`/`redoCallback` stub 连接，两者在同一 Sprint 内完成。

---

## 5. 优先级矩阵

| ID | 功能 | RICE 分母计算 | 优先级 |
|----|------|------|--------|
| P001 | 撤销/重做系统 | 影响力高(3) × 触达广(3) × 置信度中(0.8) / 工时高(8h) ≈ 0.9 | **P0** |
| P002 | 性能基线 | 影响力中(2) × 触达中(2) × 置信度高(1) / 工时低(4h) = 1.0 | **P1** |
| P003 | 快捷键集成 | 影响力中(2) × 触达中(2) × 置信度中(0.8) / 工时中(6h) ≈ 0.53 | **P1** |
| P004 | Webhook | 影响力高(3) × 触达窄(1) × 置信度中(0.7) / 工时高(16h) ≈ 0.13 | **P2**（推迟） |
| P005 | 移动端 | 影响力中(2) × 触达窄(1) × 置信度低(0.6) / 工时高(12h) ≈ 0.1 | **P2**（推迟） |

---

## 6. Sprint 34 总工时估算

| 功能 | 估算工时 | 风险缓冲 | 实际工时 |
|------|---------|---------|---------|
| P001 撤销/重做 | 8h | +2h | 10h |
| P002 性能基线 | 4h | +1h | 5h |
| P003 快捷键集成 | 6h | +1h | 7h |
| **合计** | **18h** | **+4h** | **22h** |

---

## 7. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| P001 History 栈内存膨胀 | 中 | 中 | 限制 50 步 + shift() 淘汰 |
| P001 Command 入侵现有 Store action | 中 | 低 | middleware 包装，不改现有签名 |
| P002 Lighthouse 误报（网络波动） | 中 | 低 | 趋势分析，非单次阻断 |
| P003 快捷键与浏览器冲突 | 高 | 低 | 用户可覆盖配置 |
| P003 与 P001 共享 DDSCanvasPage 连接，冲突 | 低 | 中 | 统一 review 评审 |

---

## 8. 执行决策

- **决策**: 已采纳 P001/P002/P003；P004/P005 推迟
- **执行项目**: vibex-proposals-sprint34
- **执行日期**: 待 Coord 决策后启动

---

## 9. 验收状态追踪

| 功能 | 验收标准总数 | 已完成 | 状态 |
|------|------------|--------|------|
| P001 撤销/重做 | 7 | 0 | 🔄 进行中 |
| P002 性能基线 | 6 | 0 | 🔄 进行中 |
| P003 快捷键集成 | 5 | 0 | 🔄 进行中 |

---

*本文档由 PM Agent 基于 Analyst Review Report 生成，作为 Architect Review 的输入。*
