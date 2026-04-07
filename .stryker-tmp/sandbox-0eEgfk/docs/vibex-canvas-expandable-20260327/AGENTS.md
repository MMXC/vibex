# AGENTS.md: vibex-canvas-expandable-20260327

**Project**: VibeX 卡片画布增强
**Architect**: Architect Agent
**Date**: 2026-03-27

---

## Dev 约束

### 强制规范

1. **ReactFlow v12 升级先行**：先升包 + 全量测试通过，再开发新功能
2. **不引入新依赖**：仅使用 `@xyflow/react` + `zustand` + `dagre`（可选）
3. **TypeScript 严格模式**：禁止 `any`，类型全覆盖
4. **CSS Variable 优先**：展开宽度用 CSS 变量，不硬编码像素值
5. **单元测试路径**：`src/__tests__/canvas/*.test.ts`
6. **E2E 测试路径**：`e2e/canvas-expand.spec.ts`

### 禁止事项

- ❌ 不要修改 `GatewayNode.tsx`（已有功能）
- ❌ 不要修改 `LoopEdge.tsx` / `RelationshipEdge.tsx`（已有功能）
- ❌ 不要修改 `CardTreeRenderer` 的渲染逻辑（只扩展 `onNodesChange`）
- ❌ 不要删除现有 `canvasStore` 的 persist 配置
- ❌ 不要使用 jQuery 或 DOM 直接操作节点位置（用 ReactFlow API）

### 提交规范

```
feat(canvas): 三栏双向展开（E2）
feat(canvas): 卡片拖拽排序（E3）
feat(canvas): 虚线领域框（E4）
chore(deps): 升级 ReactFlow v12
test(canvas): 展开状态单元测试
e2e(canvas): 画布展开集成测试
```

---

## Tester 约束

### E2E 测试要点

1. 每次 `it` 块前加 `await page.reload()` 确保干净状态
2. 热区测试用 `page.hover()` + `page.click()`，不用坐标硬编码
3. localStorage 持久化验证：`await page.reload()` 后断言位置不变
4. 展开动画验证：`await expect(grid).toHaveCSS('transition', /300ms/）`

### 性能基准

- 展开动画: < 300ms
- 拖拽响应: < 16ms (60fps)
- 领域框重算: < 50ms

---

## 关键文件路径

| 文件 | 作用 |
|------|------|
| `src/lib/canvas/canvasStore.ts` | 状态管理（核心） |
| `src/components/canvas/canvas.module.css` | 布局样式 |
| `src/components/canvas/CanvasPage.tsx` | 页面入口 |
| `src/components/canvas/CardTreeRenderer.tsx` | ReactFlow 渲染 |
| `src/components/canvas/groups/BoundedGroup.tsx` | 领域框组件 |
| `src/components/canvas/HoverHotzone.tsx` | 展开热区（新增） |
