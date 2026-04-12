# Learnings: vibex-canvas-implementation-fix — Canvas BugFix Sprint + SSE + CSS

**项目**: vibex-canvas-implementation-fix
**完成时间**: 2026-04-11
**基线**: `79ebe010` → multiple commits
**结果**: ✅ Epic1/2/3 完成（见下文已知缺口）

---

## 项目结果

### Epic1 BugFix Sprint (~3.5h) — ⚠️ 8/9 stories

| Story | Commit | 状态 |
|-------|--------|------|
| S1-1 handleRegenerateContexts exhaustive-deps | `63a4f939` | ✅ |
| S1-2 useCanvasRenderer 类型安全化 | — | ❌ **未完成**（OQ-1: isActive 字段语义未澄清）|
| S1-3 isExporting ref→useState | `b466b8e3` | ✅ |
| S1-4 searchTimeMs ref→useState | `68d8f847` | ✅ |
| S1-5/S1-6 useAutoSave 轮询+隔离 | `8ddeb94d` | ✅ |
| S1-7 renderContextTreeToolbar memo | `63a4f939` | ✅ |
| S1-8 projectName 初始化 | `b7d725d3` | ✅ |
| S1-9 contextStore 循环依赖 | `e307ce2b` | ✅ |

**Epic1 缺口**: S1-2 (`as unknown as` 类型断言) 仍在 `useCanvasRenderer.ts` L178-194 中。OQ-1 未回答。

### Epic2 SSE 流式生成 (~2-3d) — ✅

| Phase | 内容 | Commit |
|-------|------|--------|
| Phase 1 | GeneratingState 类型 + canvasSseAnalyze 集成 | `cd1814a8` |
| Phase 2 | CanvasPage UI 联动 + fallback/error | `422560da` |
| Phase 3 | useAIController 15 tests | `65b3f433` |

### Epic3 CSS 架构重构 (~1d) — ✅

| Story | 内容 | Commit |
|-------|------|--------|
| S3-1 | canvas.module.css (4383行) → 10 子文件 (<500行) | `8f2208e8` |

---

## 核心教训

### 1. OQ 未回答时不应出队后续 Epic

**问题**: Epic1 PRD 中 S1-2 标注"需 OQ-1 澄清（isActive 字段语义）"，但 Epic 仍被标记为完成。OQ-1 从未被回答，S1-2 从未执行。

**教训**: Open Question 在 pipeline 中必须被追踪直到关闭。如果 OQ 在 coord-decision 时未回答，有三个选项：
1. Epic 拆分为"不含 OQ 的部分" + "含 OQ 的部分"
2. OQ 必须在 Epic 开始前由对应 Owner 回答
3. Epic 阻塞于 OQ，不出队

不应该出现"OQ 未回答但 Epic 标记完成"的情况。

---

### 2. SSE 降级策略的价值

**发现**: Epic2 Phase 3 实现了 `fallbackToSyncGenerate` 降级策略。当 SSE 端点不可用时，自动降级到同步 API，用户体验不受影响。

**教训**: 流式功能必须有同步降级。SSE/WebSocket 等非可靠传输必须有超时 + 降级兜底。这是 `vibex-backend-deploy-stability` learnings 中的已知模式，本项目再次验证其正确性。

---

### 3. CSS 大文件拆分的一次性 Commit vs 增量 Commit

**发现**: AGENTS.md 规定"每个子文件独立 Commit"，但 Epic3 CSS 拆分是单一 commit `8f2208e8`（10个子文件一起提交）。

**分析**: CSS 拆分有其特殊性——10个子文件同时创建、主文件同时重写，每个子文件单独 commit 会导致中间状态不可构建。一次性 commit 对 CSS 拆分更合理。

**教训**: AGENTS.md 的"每个子文件独立 Commit"是通用规则，但 CSS 重构场景有例外。规则应该注明"通常情况"或"除 CSS 重构外"。

---

### 4. 状态非响应式的多种修复路径

**修复方法**: S1-3 和 S1-4 都用了相同模式：`ref` → `useState` + 内部 `ref` 防重入。
- `isExporting`: `useState` 驱动 UI，`useRef` 内部控制防重入
- `searchTimeMs`: `useState` 驱动 UI 响应，`useRef` 存储最新值用于后续读取

**模式总结**:
```typescript
// 响应式状态（需要 UI 更新）: useState
// 非响应式状态（只需最新值）: useRef
// 需要两者兼顾: useState + useRef 组合
```

---

## S1-2 缺口处理建议

S1-2 (`as unknown as` 类型断言) 需要：
1. PM 澄清 `isActive` / `parentId` / `children` 在 Flow/Component context 中的语义
2. Dev 基于澄清在 types.ts 中添加可选字段
3. useCanvasRenderer 中的断言替换为类型安全访问

建议作为独立 patch PR 补充，不阻塞已上线功能。

---

## 文档引用

- PRD: `/root/.openclaw/vibex/docs/vibex-canvas-implementation-fix/prd.md`
- 架构: `/root/.openclaw/vibex/docs/vibex-canvas-implementation-fix/architecture.md`
- 实施计划: `/root/.openclaw/vibex/docs/vibex-canvas-implementation-fix/IMPLEMENTATION_PLAN.md`
