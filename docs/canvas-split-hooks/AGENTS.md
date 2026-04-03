# VibeX CanvasPage 拆分 Hooks — 开发约束

**项目**: canvas-split-hooks
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-03

---

## 1. 角色约束

### 1.1 Dev Agent

**Hook 接口约束**:
- [ ] 每个 Hook 必须导出完整 TypeScript 接口类型
- [ ] handlers 对象必须用 `useMemo` 聚合，避免每次渲染新建引用
- [ ] 所有派生数据（rects、edges、computed values）必须用 `useMemo`
- [ ] Hook 只封装现有 stores，不得创建新的 Zustand store

**重构约束**:
- [ ] Phase 1 不得删除 CanvasPage 旧代码（仅注释）
- [ ] 替换每个使用点时必须验证功能一致
- [ ] 所有 5 个 Hook 引入后再进入 Phase 2
- [ ] Phase 2 删除旧代码前必须 `pnpm test` 全通过

### 1.2 Tester Agent

**测试覆盖约束**:
- [ ] E1 (useCanvasState): 分支覆盖率 > 80%
- [ ] E3 (useCanvasRenderer): 分支覆盖率 > 70%
- [ ] E4 (useAIController): 分支覆盖率 > 70%
- [ ] E5 (useCanvasEvents): 分支覆盖率 > 70%

**回归测试约束**:
- [ ] CanvasPage 重构后必须全量运行 canvas 测试套件
- [ ] 三树渲染、面板折叠、快捷键必须手动验证

### 1.3 Reviewer Agent

**审查约束**:
- [ ] Hook 接口设计需通过 plan-eng-review 评审
- [ ] Phase 1 不得合并（未完成 Hook 引入验证）
- [ ] CanvasPage < 300 行是合并门槛
- [ ] 每个 Epic 独立 commit，便于回滚

---

## 2. 代码规范

### 2.1 Hook 模板

```typescript
// src/hooks/canvas/useCanvasState.ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export interface UseCanvasStateReturn {
  zoomLevel: number;
  isSpacePressed: boolean;
  isPanning: boolean;
  panOffset: { x: number; y: number };
  gridRef: React.RefObject<HTMLDivElement | null>;
  expandMode: 'normal' | 'expand-both' | 'maximize';
  setExpandMode: (mode: 'normal' | 'expand-both' | 'maximize') => void;
  handlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseMove: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleZoomReset: () => void;
    toggleMaximize: () => void;
  };
}

export function useCanvasState(): UseCanvasStateReturn {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [expandMode, setExpandMode] = useState<'normal' | 'expand-both' | 'maximize'>('normal');
  const gridRef = useRef<HTMLDivElement>(null);

  // Space key listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // CSS variables
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.style.setProperty('--canvas-zoom', String(zoomLevel));
      gridRef.current.style.setProperty('--canvas-pan-x', String(panOffset.x));
      gridRef.current.style.setProperty('--canvas-pan-y', String(panOffset.y));
    }
  }, [zoomLevel, panOffset]);

  const handlers = useMemo(() => ({
    handleMouseDown: (e: React.MouseEvent) => { ... },
    handleMouseMove: (e: React.MouseEvent) => { ... },
    handleMouseUp: () => { ... },
    handleZoomIn: () => setZoomLevel(z => Math.min(z * 1.2, 3)),
    handleZoomOut: () => setZoomLevel(z => Math.max(z / 1.2, 0.2)),
    handleZoomReset: () => setZoomLevel(1),
    toggleMaximize: () => setExpandMode(m => m === 'normal' ? 'maximize' : 'normal'),
  }), []);

  return { zoomLevel, isSpacePressed, isPanning, panOffset, gridRef, expandMode, setExpandMode, handlers };
}
```

### 2.2 CanvasPage 目标骨架

```tsx
// CanvasPage.tsx（目标 < 300 行）
export default function CanvasPage() {
  const canvasState = useCanvasState();
  const canvasStore = useCanvasStore();
  const canvasRenderer = useCanvasRenderer();
  const aiController = useAIController();
  const canvasEvents = useCanvasEvents();

  return (
    <div className={styles.page}>
      <PhaseProgressBar />
      <div className={styles.layout}>
        <LeftDrawer ... />
        <CanvasArea
          state={canvasState}
          renderer={canvasRenderer}
          events={canvasEvents}
        />
        <RightPanel ... />
      </div>
      <MessageDrawer />
      {canvasStore.phase === 'prototype' && <PrototypeQueuePanel />}
    </div>
  );
}
```

---

## 3. 禁止事项

- ❌ Hook 内不得创建 Zustand store
- ❌ 派生数据不得跳过 `useMemo`
- ❌ handlers 不得直接定义（需 `useMemo`）
- ❌ Phase 1 不得删除旧代码
- ❌ CanvasPage 行数 > 300 行

---

## 4. 验收门槛

| 指标 | 目标 | 验证方式 |
|------|------|---------|
| CanvasPage 行数 | < 300 | `wc -l` |
| useCanvasState 覆盖率 | > 80% | Jest 覆盖率 |
| useAIController 覆盖率 | > 70% | Jest 覆盖率 |
| useCanvasRenderer 覆盖率 | > 70% | Jest 覆盖率 |
| useCanvasEvents 覆盖率 | > 70% | Jest 覆盖率 |
| 直接 store 引用 | 0 | `grep "useContextStore\|useUIStore"` |
| canvas 测试套件 | 全部通过 | `pnpm test -- --testPathPattern="canvas"` |

---

*开发约束版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*
