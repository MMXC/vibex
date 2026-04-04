# Implementation Plan — tree-toolbar-consolidation

**项目**: tree-toolbar-consolidation
**日期**: 2026-04-04
**仓库**: /root/.openclaw/vibex
**总工时**: 4h

---

## Sprint 1: E1 — TreeToolbar 集成到 TreePanel Header

### 负责人
Dev Agent

### 任务分解

| 任务 | 描述 | 工时 | 依赖 |
|------|------|------|------|
| E1-T1 | TreePanel 新增 `headerActions` slot | 1h | 无 |
| E1-T2 | 创建 `useTreeToolbarActions` hook | 1h | 无 |
| E1-T3 | CanvasPage 三处调用迁移（context/flow/component） | 1.5h | E1-T1, T2 |
| E1-T4 | CSS 调整（Header 按钮尺寸 + 折叠菜单） | 0.5h | E1-T3 |

### E1-T1 详细步骤

```typescript
// E1-T1: TreePanel.tsx

// 1. 新增 headerActions prop
interface TreePanelProps {
  // ... existing
  headerActions?: React.ReactNode;
}

// 2. Header 渲染 headerActions
<div className={styles.treePanelHeader}>
  {/* 现有 header 内容 */}
  {headerActions && (
    <div
      data-testid="tree-panel-header-actions"
      className={styles.treePanelHeaderActions}
    >
      {headerActions}
    </div>
  )}
</div>

// 3. 折叠时隐藏 headerActions
<div className={styles.treePanelHeader} data-collapsed={isCollapsed}>
  {headerActions && !isCollapsed && (
    <div data-testid="tree-panel-header-actions" ...>
      {headerActions}
    </div>
  )}
</div>
```

### E1-T2 详细步骤

```typescript
// E1-T2: @/hooks/canvas/useTreeToolbarActions.ts

// 1. 创建 hook 文件
export function useTreeToolbarActions(treeType: TreeType): TreeToolbarActions {
  // 根据 treeType 选择 store
  const contextStore = useContextStore();
  const flowStore = useFlowStore();
  const componentStore = useComponentStore();

  const store = treeType === 'context' ? contextStore :
                treeType === 'flow'    ? flowStore :
                componentStore;

  const onSelectAll = useCallback(() => {
    const nodesKey = `${treeType}Nodes` as 'contextNodes' | 'flowNodes' | 'componentNodes';
    const nodes = store[nodesKey];
    store.setNodes?.(nodes.map(n => ({ ...n, isActive: true })));
  }, [treeType, store]);

  // ... onDeselectAll, onClear 类似
  return { onSelectAll, onDeselectAll, onClear, onContinue: undefined };
}
```

### E1-T3 详细步骤

```typescript
// E1-T3: CanvasPage.tsx

// 1. context 树（L515 附近）
const contextActions = useTreeToolbarActions('context');
<TreePanel
  treeType="context"
  headerActions={
    <>
      <ToolbarButton onClick={contextActions.onSelectAll} title="全选">
        全选
      </ToolbarButton>
      <ToolbarButton onClick={contextActions.onDeselectAll} title="取消全选">
        取消
      </ToolbarButton>
      <ToolbarButton onClick={contextActions.onClear} title="清空">
        清空
      </ToolbarButton>
      {canContinue && (
        <ToolbarButton onClick={contextActions.onContinue} variant="primary">
          继续
        </ToolbarButton>
      )}
    </>
  }
>
  <BoundedContextTree />
</TreePanel>

// 2. flow 树（L566）- 无继续按钮
const flowActions = useTreeToolbarActions('flow');
// 同上结构，无继续按钮

// 3. component 树（L592）- 无继续按钮
const componentActions = useTreeToolbarActions('component');
// 同上结构，无继续按钮

// 4. 移除原来的 actions prop（TreePanel body 内）
```

### E1-T4 CSS 详细步骤

```css
/* canvas.module.css - 添加以下样式 */

/* Header 操作区容器 */
.treePanelHeaderActions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

/* Header 内按钮（紧凑尺寸） */
.treePanelHeader .toolbarBtn {
  min-height: 32px;
  min-width: 32px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
}

/* 移动端 */
@media (max-width: 768px) {
  .treePanelHeader {
    flex-wrap: wrap;
    gap: 4px;
  }
  .treePanelHeader .toolbarBtn {
    min-height: 36px;
    min-width: 36px;
    padding: 4px 6px;
  }
}
```

---

## 交付物

```
vibex-fronted/src/
├── components/canvas/
│   ├── TreePanel.tsx                    # 已修改（+ headerActions）
│   └── CanvasPage.tsx                    # 已修改（+ hook 调用）
├── hooks/canvas/
│   └── useTreeToolbarActions.ts          # 新增
├── __tests__/
│   ├── treePanel-headerActions.test.tsx  # 新增（E1-S1）
│   └── useTreeToolbarActions.test.ts     # 新增（E1-S2）
└── e2e/canvas/
    └── treeToolbar-header.spec.ts        # 新增（E1-S3）
```

---

## 验收检查清单

- [ ] TreePanel `headerActions` prop 渲染到 Header 右侧
- [ ] 折叠状态下 `headerActions` 不可见
- [ ] `useTreeToolbarActions` hook 返回 4 个 action 函数
- [ ] context Header 显示：全选 / 取消 / 清空 / 继续（4个按钮）
- [ ] flow Header 显示：全选 / 取消 / 清空（3个按钮）
- [ ] component Header 显示：全选 / 取消 / 清空（3个按钮）
- [ ] Header 按钮 min-height 32px，PC 和移动端可访问性达标
- [ ] Playwright E2E：三树 Header 按钮可见

---

## 回滚计划

```bash
git checkout HEAD -- \
  vibex-fronted/src/components/canvas/TreePanel.tsx \
  vibex-fronted/src/components/canvas/CanvasPage.tsx \
  vibex-fronted/src/hooks/canvas/useTreeToolbarActions.ts \
  vibex-fronted/src/app/canvas/canvas.module.css
```

---

*本文档由 Architect Agent 生成于 2026-04-04 20:28 GMT+8*
