# Analysis: vibex-canvas-hint-guide

**Goal**: P001 用户引导体系 — 在关键节点插入 Hint 提示，降低用户流失

**Priority**: P0  
**Date**: 2026-03-31  
**Analyst**: analyst  
**Source**: pm-proposals.md P001

---

## 1. 执行摘要

Canvas 引导体系**部分已实现**（BoundedContextTree 空状态有引导文案），但 **ComponentTree 缺引导**，且 **S3（连线图例）和 S4（节点标记 tooltip）完全缺失**。

**推荐方案**: 补充 ComponentTree 引导 + 新增连线图例 + 节点标记 tooltip，合计 ~2h。

---

## 2. 现状分析

### 2.1 已实现的引导

| 位置 | 当前文案 | 评估 |
|------|---------|------|
| BoundedContextTree 空状态 | "暂无限界上下文" + "点击「重新执行」自动生成，或手动新增节点" | ✅ 基本可用 |
| BusinessFlowTree 空步骤 | "暂无步骤（拖拽下方按钮添加）" | ✅ 基本可用 |
| Phase hint | "确认所有上下文节点后，将自动解锁业务流程树" | ✅ 存在 |

### 2.2 缺失的引导

| 缺失项 | 当前状态 | 影响 |
|--------|---------|------|
| ComponentTree 空状态引导 | "暂无组件" + 空 subtext | 🔴 用户不知道如何开始 |
| S3: 连线类型图例 | 完全缺失 | 🔴 用户不理解三种连线样式 |
| S4: start/end 节点标记 tooltip | 完全缺失 | 🔴 用户不理解绿圈/红方的含义 |

### 2.3 已实现 vs 提案对比

| 提案项 | 状态 | 备注 |
|--------|------|------|
| S1: 空状态引导文案 | ⚠️ 部分实现 | BC树 ✅，ComponentTree ❌ |
| S2: Toolbar 悬浮提示 | N/A | Undo/Redo 是键盘快捷键，无 Toolbar 按钮 |
| S3: 连线类型图例 | ❌ 缺失 | 无图例 |
| S4: 节点标记说明 | ❌ 缺失 | 无 tooltip |

---

## 3. 方案对比

### 3.1 S1 补充: ComponentTree 空状态引导

**现状**: `ComponentTree.tsx:1024-1027`
```tsx
<div className={styles.contextTreeEmpty}>
  <span className={styles.emptyIcon}>▣</span>
  <p className={styles.emptyText}>暂无组件</p>
  <p className={styles.emptySubtext}></p>  // ← 空
</div>
```

**修复**: 补充引导文案
```tsx
<p className={styles.emptySubtext}>
  点击「继续·组件树」从已确认流程生成，或手动新增组件
</p>
```

**工时**: 0.5h

### 3.2 S3 新增: 连线类型图例

**实现位置**: CanvasPage.tsx 三栏布局区域

**方案**: 在 FlowTree 面板角落增加小图例
```tsx
<div className={styles.flowLegend} style={{ position: 'absolute', bottom: 8, right: 8 }}>
  <span style={{color:'#60a5fa'}}>─</span> 顺序流
  <span style={{color:'#f59e0b'}}>─┐</span> 分支流
  <span style={{color:'#a78bfa'}}>↺</span> 循环流
</div>
```

**工时**: 0.5h

### 3.3 S4 新增: 节点标记 tooltip

**现状**: Epic3 新增了 start（绿圈）和 end（红方）标记，但无 tooltip

**实现**: 在标记元素上添加 `title` 属性或 `aria-label`
```tsx
<span 
  title="起始节点：流程入口" 
  style={{ color: '#22c55e', fontSize: 16 }}
>●</span>
```

**工时**: 0.5h

### 3.4 S2 替代方案: 键盘快捷键提示面板

**S2 不可行**: Undo/Redo 是键盘快捷键（Ctrl+Z/Ctrl+Shift+Z），无 Toolbar 按钮

**替代方案**: 添加 "?" 快捷键帮助面板
```tsx
// CanvasPage.tsx
const toggleShortcutPanel = useCallback(() => {
  setIsShortcutPanelOpen(v => !v);
}, []);
```

**工时**: 0.5h（替换 S2）

---

## 4. 推荐方案

| 功能 | 工时 | 优先级 |
|------|------|--------|
| S1 补充: ComponentTree 空状态引导 | 0.5h | P0 |
| S2 替代: 快捷键帮助面板 | 0.5h | P1 |
| S3: 连线类型图例 | 0.5h | P1 |
| S4: 节点标记 tooltip | 0.5h | P1 |
| **合计** | **2h** | |

---

## 5. 验收标准

| # | 标准 | 验证方法 |
|---|------|----------|
| 1 | ComponentTree 空状态显示引导文案 | 刷新 canvas，无组件时检查文案 |
| 2 | FlowTree 显示连线类型图例 | 截图验证图例可见 |
| 3 | start/end 节点标记有 tooltip | hover 时显示说明 |
| 4 | "?" 键打开快捷键帮助面板 | 按 ? 键验证 |
| 5 | 三栏 empty state 均显示引导 | gstack screenshot 验证 |

---

## 6. 相关文件

```
vibex-fronted/src/components/canvas/
├── BoundedContextTree.tsx    # S1 ✅ 已实现
├── BusinessFlowTree.tsx      # S3 需增加图例
├── ComponentTree.tsx         # S1 需补充引导 + S4 需增加 tooltip
└── CanvasPage.tsx           # S2 快捷键帮助面板
```

---

## 7. 技术风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 空状态文案与实际功能不符 | 用户困惑 | 上线前用 gstack 验证文案准确性 |
| 图例遮挡 FlowTree 内容 | 布局问题 | 使用 fixed + 透明背景 |
