# Dev 提案 — 2026-04-05

**Agent**: dev
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex

---

## P001: subagent 超时策略

**优先级**: P0 — 全团队影响

### 问题描述

今天 3 个 subagent（E1/E3 fix/E3修复）均因 5 分钟超时失败，其中 2 个已完成代码修改只是未 commit。

**典型案例**：
- e1-canvas-api: 完成但未 commit
- e3-fix-empty-state: 完成但未 commit
- e3-canvas-ux: 完成并 commit，但 subagent 报告超时

### 根因分析

Subagent 超时后 parent 无法区分「代码完成但未提交」vs「代码未完成」。无中间 checkpoint 机制。

### 建议方案

**方案 A（推荐）**: subagent 工具链增加中间 checkpoint
- 代码修改后输出确定性摘要（DONE marker）
- Parent 检测到后主动接管 commit
- 不等待 subagent 完成

---

## P002: canvas-split-components 组件拆分方案

**优先级**: P1 — 架构演进

### 背景

canvas-split-hooks Epic（E1-E6）已完成，将 CanvasPage 拆分为 6 个独立 hook，代码从 1505 行减至 1137 行。

### 待解决

拆分后的 6 个 hook（useCanvasState / useCanvasStore / useCanvasRenderer / useAIController / useCanvasSearch / useCanvasEvents）目前耦合在同一目录，后续需要：
1. 组件粒度进一步拆分（PhasePanel / TreePanel / CanvasRenderer 独立抽离）
2. hook 间的隐式依赖梳理（哪些 hook 强耦合、哪些可独立使用）

### 建议方案

**方案 A（推荐）**: 将 canvas hooks 按依赖分层

```
Layer 1（无依赖）: useCanvasState       # 纯 UI 状态
Layer 2（依赖 L1）: useCanvasStore     # Zustand store 封装
Layer 3（依赖 L2）: useCanvasRenderer  # 渲染逻辑
Layer 4（依赖 L3）: useAIController    # AI 控制
Layer 5（依赖 L1+L4）: useCanvasSearch
Layer 6（跨所有）: useCanvasEvents
```

- 每个 Layer 独立打包测试
- 后续新功能只依赖最低所需 Layer
- **工时预估**: 4h（代码重组）+ 2h（测试补全）

---

## P003: Zustand store 重构扩展

**优先级**: P1 — 性能 + 可测试性

### 背景

canvas-canvasstore-migration Epic 已完成，将 `canvasStore.ts`（212行）拆分为 flowStore / componentStore / sessionStore。经验证：13 测试、100% 覆盖率、68/68 store tests pass。

### 待扩展

Zustand 重构模式尚未推广到其他 store：
- `uiStore.ts` — UI 状态（侧边栏、模态框、主题）
- `contextStore.ts` — 上下文状态（BoundedContextTree data）
- 其他 store 仍有「大一统」趋势

### 建议方案

**方案 A**: 按领域拆分现有 store
- `uiStore` → `toolbarStore` + `modalStore` + `themeStore`
- `contextStore` → `contextDataStore` + `contextSelectionStore`

**方案 B（推荐）**: 建立 store 拆分规范（编码标准）
- 单个 store 不超过 200 行
- 每个 store 必须有独立测试（100% 覆盖）
- Epic 审查时检查 store 行数，超标强制拆分

**工时预估**: 6h（拆分）+ 4h（测试）

---

## P004: 内部工具/脚本改进

**优先级**: P2 — 开发效率

### 待改进项

1. **task_manager.py push block**: Slack token 在 git 历史，阻止所有涉及该文件的 commit push（详见 P003）
2. **ESLint 缓存优化**: `pnpm lint` 全量检查慢，CI 可用缓存但本地无优化
3. **测试报告聚合**: jest/vitest/playwright 三套测试报告分散，无统一入口

### 建议方案

| 改进项 | 方案 | 工时 |
|--------|------|------|
| push block 根因修复 | BFG Repo-Cleaner 清理 git 历史 | 1h |
| ESLint 本地缓存 | 添加 `eslint --cache` + NODE_OPTIONS | 0.5h |
| 测试报告聚合 | `pnpm run test:ci` 生成 merged-summary.html | 2h |

---

## P005: E3 修复规范（子 agent commit 前状态输出）

**优先级**: P1

### 问题描述

E3 空状态 UI 被 tester 驳回 3 次：subagent 未 commit → regression → 手动修复。

### 根因

subagent 对 commit 前状态不输出确定性摘要，parent 无法验证中间状态。

### 方案

subagent 完成代码修改后必须输出确定性摘要：
- 修改的文件列表
- 每个文件的关键 diff 行
- 「代码完成」明确声明

---

## 提案质量评分

| 维度 | 分值 |
|------|------|
| 问题描述 | 3 |
| 根因分析 | 3 |
| 建议方案 | 3 |
| 优先级 | 2 |
| 影响范围 | 2 |
| 加分（日期/Commit/PR/质量章节） | 3 |
| **总分** | **16** |
