# E6 Spec: CanvasPage 整合重构

## 重构策略（两阶段）

### Phase 1: 添加 Hook 引用（不删除旧代码）

**目标**: 验证所有 Hook 正常工作后再删除旧代码

```
Step 1: import 5 个新 Hook
Step 2: 逐个替换 CanvasPage 中的使用点
Step 3: 并行运行新旧代码（同一个 state 两份）
Step 4: 对比新旧输出是否一致
Step 5: 全部验证通过后进入 Phase 2
```

### Phase 2: 删除已迁移代码

**目标**: 将 CanvasPage 瘦身为 < 300 行的编排层

```
Step 1: 注释掉旧代码（不删除）
Step 2: 运行完整测试套件
Step 3: 全部通过后真正删除旧代码
Step 4: 最终验证
```

## 重构后 CanvasPage 骨架

```tsx
// CanvasPage.tsx (目标 < 300 行)
export default function CanvasPage() {
  // Hook 组合
  const canvasState = useCanvasState();
  const canvasStore = useCanvasStore();
  const canvasRenderer = useCanvasRenderer();
  const aiController = useAIController();
  const canvasEvents = useCanvasEvents();

  // Render
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

## 验证检查清单

| 检查项 | 验证方式 |
|--------|---------|
| 三树渲染一致 | 对比重构前后截图 |
| 面板折叠正常 | 手动测试三面板 toggle |
| 快捷键正常 | Ctrl+Z/Y/F/? 全覆盖 |
| AI 生成正常 | quickGenerate 流程完整 |
| 冲突处理正常 | mock 409 响应 |
| 移动端正常 | Chrome DevTools mobile |
| 测试套件 | `pnpm test -- --testPathPattern="canvas"` 全部通过 |
