# Epic 5: Canvas 页面信息架构优化 — Spec

**Epic ID**: E5
**优先级**: P1
**工时**: 9h
**页面集成**: Canvas.tsx / TreePanel.tsx / Drawer 全局组件

---

## 功能点列表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|-------|------|---------|---------|
| E5-S1 | scrollTop 状态规范 | Canvas 页面切换时强制重置 scrollTop = 0；面板切换时重置面板内 scrollTop | `expect(scrollTopAfterNavigation).toBe(0)`；`expect(scrollTopAfterPanelSwitch).toBe(0)` | Canvas.tsx |
| E5-S2 | sticky 工具栏 | 工具栏使用 `position: sticky`，页面滚动时保持可见 | `expect(toolbarStyle.position).toBe('sticky')`；`expect(toolbarVisibleOnScroll).toBe(true)` | Canvas.tsx |
| E5-S3 | Drawer 层级协议 | 定义统一 z-index 层级体系（Drawer < Tooltip < Modal < Toast）；所有 Drawer 使用标准化 props | `expect(zIndex('Drawer')).toBeLessThan(zIndex('Tooltip'))`；`expect(zIndex('Tooltip')).toBeLessThan(zIndex('Modal'))` | 全局 Drawer 组件 |
| E5-S4 | 面板状态隔离 | TreePanel tab 切换时清除前一个面板的选中状态；panelRef 在 unmount 时正确清理 | `expect(activePanelNodeId).not.toBe(prevPanelNodeId)`；`expect(panelRef.current).toBeNull()` after unmount | TreePanel.tsx |
| E5-S5 | 创建 Canvas IA 文档 | 编写 `docs/canvas-information-architecture.md`，记录页面状态规范和组件关系 | 文件存在且包含 scrollTop / z-index / sticky 规范 | — |

---

## 详细验收条件

### E5-S1: scrollTop 状态规范

- [ ] 进入 Canvas 页面时自动将 scrollTop 重置为 0
- [ ] 面板 tab 切换时将对应面板的 scrollTop 重置为 0
- [ ] 使用 `useEffect` 清理 scrollTop：`return () => { container.scrollTop = 0 }`
- [ ] 验收测试：`expect(scrollTopAfterNavigation).toBe(0)` 连续 5 次页面切换均成立

### E5-S2: sticky 工具栏

- [ ] 工具栏 CSS 包含 `position: sticky; top: 0; z-index: 100`
- [ ] 页面内容滚动时工具栏保持可见
- [ ] 工具栏与其他 sticky 元素无 z-index 冲突
- [ ] 验收测试：滚动页面后 `expect(toolbarBoundingBox.top).toBe(0)`

### E5-S3: Drawer 层级协议

- [ ] CSS 变量定义 z-index 层级：
  ```css
  :root {
    --z-drawer: 200;
    --z-tooltip: 300;
    --z-modal: 400;
    --z-toast: 500;
  }
  ```
- [ ] 所有 Drawer 组件统一使用 `--z-drawer`
- [ ] 所有 Modal 统一使用 `--z-modal`
- [ ] 验收测试：`expect(getComputedStyle(drawer).zIndex).toBeLessThan(getComputedStyle(modal).zIndex)`

### E5-S4: 面板状态隔离

- [ ] TreePanel tab 切换时，前一个面板的 `selectedNodeId` 重置
- [ ] 面板 unmount 时 `panelRef` 设为 null
- [ ] 面板切换时 `activeTab` 正确更新
- [ ] 验收测试：`expect(selectedIdsAfterSwitch).toEqual(new Set())`

### E5-S5: Canvas IA 文档

- [ ] 文件路径：`docs/canvas-information-architecture.md`
- [ ] 包含内容：页面状态规范 / 组件关系图 / scrollTop 管理规范 / z-index 层级表
- [ ] 文档格式：Markdown，包含示例代码

---

## 实现注意事项

1. **统一管理**：scrollTop 由 uiStore 统一管理（见 Epic 2 E2-S4）
2. **层级防御**：z-index 使用 CSS 变量集中定义，避免散落硬编码
3. **文档同步**：每次 IA 变更必须同步更新文档
