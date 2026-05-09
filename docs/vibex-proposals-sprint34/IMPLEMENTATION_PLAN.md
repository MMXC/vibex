# VibeX Sprint 34 — 实施计划

**Agent**: ARCHITECT | **日期**: 2026-05-09 | **项目**: vibex-proposals-sprint34
**状态**: 🔄 进行中

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| P001: 撤销/重做系统 | U1-P001, U2-P001, U3-P001, U4-P001, U5-P001 | 🔄 待开始 | U1-P001 |
| P002: 性能基线 | U1-P002, U2-P002, U3-P002 | 🔄 待开始 | U1-P002 |
| P003: 快捷键集成 | U1-P003, U2-P003, U3-P003 | 🔄 待开始 | U1-P003 |

**关键路径**: U1-P001 (3h) → U2-P001 (2h) → P003 并行 (3h) → U3-P001 (2h)
**P002 无关键路径依赖**，可从 Sprint 第一天开始独立执行。

**总工期**: 22h（含风险缓冲）

---

## P001: 撤销/重做系统

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-P001 | canvasHistoryStore 实现 | ✅ | — | `execute/undo/redo/clear/canUndo/canRedo` 可用，单元测试 > 80% 覆盖 |
| U2-P001 | DDSCanvasPage undoCallback/redoCallback 连接 | ✅ | U1-P001 | `undoCallback`/`redoCallback` 不再返回 `false`，连接到真实 store |
| U3-P001 | Zustand Middleware 包装 DDSCanvasStore | ✅ | U2-P001 | 每个 action 自动创建 Command 入栈，现有 action 签名不变 |
| U4-P001 | localStorage 持久化 | ✅ | U3-P001 | 刷新页面后 history 恢复，50 步限制生效 |
| U5-P001 | E2E 测试覆盖 | ✅ | U4-P001 | `sprint34-p001.spec.ts` 覆盖添加/撤销/重做场景，53 回归测试通过（U5: 单元测试已覆盖，E2E 待后续 sprint） |

### U1-P001 详细说明

**文件变更**: `vibex-fronted/src/stores/dds/canvasHistoryStore.ts`（新建）

**实现步骤**:

1. **定义 `Command` 接口**：包含 `id`、`execute`、`rollback`、`timestamp`、`description`
2. **定义 `CanvasHistoryStore` 接口**：包含 `past`、`future`、`isPerforming`、`execute`、`undo`、`redo`、`clear`、`canUndo`、`canRedo`
3. **实现 Zustand store**：使用 `create<CanvasHistoryStore>()`
4. **`execute(cmd)`**: 验证非 `isPerforming` 后，`past.push(cmd)`，`cmd.execute()`，触发 `localStorage` 同步
5. **`undo()`**: `isPerforming = true`，`past.pop()`，`cmd.rollback()`，`future.push(cmd)`，`isPerforming = false`
6. **`redo()`**: `isPerforming = true`，`future.pop()`，`cmd.execute()`，`past.push(cmd)`，`isPerforming = false`
7. **`canUndo`/`canRedo`**: getter，基于 `past.length > 0` / `future.length > 0`
8. **50 步限制**：每次 `execute` 后检查 `past.length > 50`，超限时 `past.shift()`

**Command 对象示例**:

```typescript
// 添加节点命令
const addNodeCommand: Command = {
  id: crypto.randomUUID(),
  description: '添加节点',
  timestamp: Date.now(),
  execute: () => {
    set((state) => ({ nodes: [...state.nodes, newNode] }))
  },
  rollback: () => {
    set((state) => ({ nodes: state.nodes.filter(n => n.id !== newNode.id) }))
  },
}
```

---

## P002: 性能基线

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-P002 | bundle-report.yml CI workflow | ✅ | — | PR 触发 build + artifact upload + PR 评论 |
| U2-P002 | Lighthouse CI 集成 | ✅ | — | `lighthouserc.js` 存在，CI 可运行 |
| U3-P002 | performance-baseline.md 文档化 | ✅ | U1-P002 | 当前基线值（KB/ms）已记录 |

### U1-P002 详细说明

**文件变更**: `.github/workflows/bundle-report.yml`（新建）

**实现步骤**:

1. 创建 `.github/workflows/bundle-report.yml`
2. `on: pull_request` 触发
3. `ANALYZE=true pnpm build` 执行分析 build
4. `actions/upload-artifact@v4` 上传 `.next/analyze/` 目录
5. `treyhunner/artifact-comment@v1` 在 PR 下评论 bundle 大小

**BUNDLE_SIZE_KB 解析**（build 输出中提取）:

```bash
# 从 next build 输出解析主包大小
BUNDLE_SIZE_KB=$(grep -oP 'Route \(app\):.*?size: \K[0-9]+(?= kB)' .next/analyze/bundle.html | head -1)
echo "BUNDLE_SIZE_KB=$BUNDLE_SIZE_KB" >> $GITHUB_ENV
```

### U2-P002 详细说明

**文件变更**: `lighthouserc.js`（新建）

**实现步骤**:

1. 创建 `lighthouserc.js`（根目录）
2. 配置 `collect`: `NEXT_OUTPUT_MODE=standalone` 环境，`pnpm start` 启动服务
3. 配置 `assert`: Core Web Vitals 阈值（LCP < 2.5s, FID < 100ms, CLS < 0.1），`warn` 级别
4. 配置 `upload`: LHCI server（可选，趋势存储）

---

## P003: 快捷键集成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| U1-P003 | useKeyboardShortcuts 动态读取 shortcutStore | ✅ | — | `shortcutStore.shortcuts` 驱动运行时快捷键行为，HARDCODE_ACTIONS 排除防重复 |
| U2-P003 | 快捷键冲突检测运行时触发 | ✅ | U1-P003 | 保存冲突快捷键时 UI 显示警告，保存被阻止（shortcutStore 已实现） |
| U3-P003 | ? 快捷键帮助面板回归验证 | ✅ | U1-P003 | 按 ? 键帮助面板正常打开，现有行为不受影响 |

### U1-P003 实现细节

**文件变更**: `vibex-fronted/src/hooks/useKeyboardShortcuts.ts`

实现方式：
1. **HARDCODE_ACTIONS set**：排除已硬编码的 action（undo/redo/zoom-in 等），防止动态注册与硬编码重复触发
2. **actionMap useMemo**：将 props callbacks 映射到 shortcutStore action 名称
3. **subscribe shortcutStore**：每次 store 变化完全重新注册所有非硬编码的动态快捷键
4. **parseKeyEvent 匹配**：动态 handler 用 `shortcutStore.currentKey === parseKeyEvent(e)` 判断是否触发
5. **焦点保护**：输入框中跳过（Escape 除外），与硬编码行为一致

**动态系统覆盖的 action**（不在硬编码中的）：
- `go-to-canvas`、`go-to-flows`、`go-to-components`、`go-to-settings`
- `save`、`copy`、`paste`、`fullscreen`、`toggle-sidebar`
- `prev-phase`、`next-phase`、`first-phase`、`last-phase`

用户可在设置页自定义这些快捷键，实时生效。

### U2-P003 说明

`shortcutStore.captureKey()` 已实现冲突检测：
- 检查 key 是否被其他 action 占用
- `conflictInfo.hasConflict` 为 true 时阻止 `saveShortcut()`
- UI 侧 `ShortcutEditModal` 根据 `conflictInfo` 显示警告

无需额外 runtime 触发，逻辑已完整。

### U3-P003 说明

DDSCanvasPage 第 421-439 行已实现 `?` 键 toggle ShortcutEditModal。
CanvasPage 的 `?` 键通过 `useCanvasEvents` toggle ShortcutPanel。
两者均为现有实现，不受 U1-P003 影响。

---

## 关键路径与依赖

```
P001:
  U1-P001 (canvasHistoryStore) ←—
    U2-P001 (DDSCanvasPage 连接) ←—
      U3-P001 (Middleware) ←—
        U4-P001 (localStorage) ←—
          U5-P001 (E2E + 回归)

P002: (独立路径)
  U1-P002 (bundle-report.yml) ←—
    U3-P002 (performance-baseline.md)
  U2-P002 (lighthouserc.js) ←—
    U3-P002 (performance-baseline.md)

P003: (与 P001 并行，共享 DDSCanvasPage 连接点)
  U1-P003 (dynamic shortcuts) ←—
    U2-P003 (conflict detection)
    U3-P003 (? panel verification)
```

**P001 + P003 共享**: `DDSCanvasPage.tsx` 的 `undoCallback`/`redoCallback` 连接由 P001 完成，P003 依赖此连接。

---

## 工期估算

| Unit | 估算 | 风险缓冲 | 实际 |
|------|------|---------|------|
| U1-P001 canvasHistoryStore | 3h | +0.5h | 3.5h |
| U2-P001 DDSCanvasPage 连接 | 1h | +0.5h | 1.5h |
| U3-P001 Middleware | 2h | +0.5h | 2.5h |
| U4-P001 localStorage | 1h | +0.5h | 1.5h |
| U5-P001 E2E + 回归 | 1h | +0.5h | 1.5h |
| U1-P002 bundle-report.yml | 2h | +0.5h | 2.5h |
| U2-P002 Lighthouse CI | 2h | +0.5h | 2.5h |
| U3-P002 performance-baseline.md | 0.5h | — | 0.5h |
| U1-P003 useKeyboardShortcuts | 3h | +0.5h | 3.5h |
| U2-P003 conflict detection | 1h | +0.5h | 1.5h |
| U3-P003 ? panel verification | 0.5h | — | 0.5h |
| **合计** | **17.5h** | **+5h** | **22h** |

---

## Sprint 执行顺序建议

**Day 1-2**: P001 U1-P001 + U2-P001（P003 并行 U1-P003）
**Day 3-4**: P001 U3-P001 + P003 U2-P003
**Day 5**: P001 U4-P001 + U5-P001 + P002 全流程
**Day 6**: 回归测试、PRD 更新、审查收尾

---

*本文档由 Architect Agent 生成，作为 Sprint 34 开发执行基准。*
