# Implementation Plan: VibeX 系统性风险治理路线图

**项目**: vibex-proposals-summary-20260402_061709
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## Sprint 排期

| Sprint | Epic | 工时 | 优先级 |
|--------|------|------|--------|
| Sprint 0 | CI 基线修复 | 2.5h | P0 |
| Sprint 1 | 用户体验统一 | 11-12h | P0 |
| Sprint 2 | 架构基础 | 10-14h | P0 |
| Sprint 3 | Store 完整拆分 | 8-12h | P1 |
| Sprint 4 | E2E + 性能 | 18-25h | P2 |
| **总计** | | **49.5-65.5h** | |

---

## Sprint 0: CI 基线修复（2.5h）

### 步骤 0.1: TypeScript 错误清零

```bash
cd vibex-fronted && npm run build 2>&1 | grep "error TS"
# 分类修复：TS6133(未使用) / TS2322(类型) / TS1005(语法)
```

### 步骤 0.2: DOMPurify XSS 修复

```json
// package.json 添加 overrides
{
  "overrides": {
    "dompurify": "3.3.3"
  }
}
```

### 步骤 0.3: Jest 稳定性配置

```javascript
// jest.config.js
{
  maxWorkers: 2,
  workerIdleMemoryLimit: '512MB',
  testTimeout: 10000,
}
```

---

## Sprint 1: 用户体验统一（11-12h）

### 步骤 1.1: 三树 checkbox 位置统一

```typescript
// BoundedContextTree.tsx — 删除 selectionCheckbox，保留 confirmCheckbox
// ComponentTree.tsx — checkbox 移到 type badge 前
// BusinessFlowTree.tsx — 保持现状（已正确）
```

### 步骤 1.2: 确认状态绿色 ✓ 反馈

```tsx
{node.status === 'confirmed' && (
  <span className={styles.confirmedBadge}>
    <svg ...>✓</svg>
  </span>
)}
```

### 步骤 1.3: 移除 nodeUnconfirmed 黄色边框

```css
/* canvas.module.css */
.nodeUnconfirmed {
  border: 2px solid var(--color-border);
}
```

### 步骤 1.4: window.confirm → toast

```typescript
// useFeedback hook
const feedback = useFeedback();
feedback.show({ token: FeedbackToken.Warning, message: '确认删除？', undoAction: restore });
```

### 步骤 1.5: UI 变更清单

在 `CONTRIBUTING.md` 添加 UI 变更 checklist。

---

## Sprint 2: 架构基础（10-14h）

### 步骤 2.1: canvasStore Phase1 — contextStore

```typescript
// src/lib/canvas/contextStore.ts
export const useContextStore = create()(
  devtools(
    persist((set) => ({
      contextNodes: [],
      addContextNode: (draft) => { /* ... */ },
      confirmContextNode: (id) => { /* ... */ },
    }), { name: 'vibex-context-store' })
  )
);
```

### 步骤 2.2: vitest 快慢分离

```javascript
// jest.config.js
{
  projects: [
    { displayName: 'fast', testMatch: ['**/*.test.ts'] },
    { displayName: 'slow', testMatch: ['**/*.integration.test.ts'] },
  ]
}
```

### 步骤 2.3: 子 store 单元测试

每个 store 创建独立测试文件，覆盖率目标 ≥ 70%。

---

## Sprint 3: Store 完整拆分（8-12h）

### 步骤 3.1: flowStore + componentStore + uiStore

将剩余状态字段迁移到对应子 store。

### 步骤 3.2: canvasStore 降为代理层

```typescript
// canvasStore.ts — 最终形态（<200行）
export const useCanvasStore = () => ({
  contextNodes: useContextStore(s => s.contextNodes),
  confirmContextNode: useContextStore(s => s.confirmContextNode),
  flowNodes: useFlowStore(s => s.flowNodes),
  // ...
});
```

### 步骤 3.3: 循环依赖检测

```bash
npm run lint -- --rule 'import/no-cycle: error'
```

---

## Sprint 4: E2E + 性能（18-25h）

### 步骤 4.1: Playwright Journey E2E

```bash
npx playwright test --project=chromium e2e/journey-*.spec.ts
```

### 步骤 4.2: 拖拽性能优化

```typescript
// rAF 节流
const handleMouseMove = useCallback((e) => {
  rafId.current = requestAnimationFrame(() => {
    setDragPosition({ x: e.clientX, y: e.clientY });
  });
}, []);
```

### 步骤 4.3: ReactFlow 交互验证

确保节点拖拽、连线功能正常。

---

## 验收清单

### Sprint 0
- [ ] npm run build 退出码 0
- [ ] DOMPurify 版本 ≥ 3.3.3
- [ ] vitest 通过率 > 95%

### Sprint 1
- [ ] 三树 checkbox 位置一致
- [ ] 确认节点显示绿色 ✓
- [ ] nodeUnconfirmed 无黄色边框
- [ ] window.confirm = 0
- [ ] CONTRIBUTING.md 包含 UI 变更清单

### Sprint 2
- [ ] contextStore < 300 行
- [ ] vitest 单元测试 < 60s
- [ ] 子 store 覆盖率 ≥ 70%

### Sprint 3
- [ ] canvasStore < 200 行
- [ ] 4 个独立 store 各有测试
- [ ] 无循环依赖

### Sprint 4
- [ ] 3 个 Journey E2E 通过率 ≥ 90%
- [ ] 拖拽帧率 ≥ 55fps
- [ ] ReactFlow 交互正常
