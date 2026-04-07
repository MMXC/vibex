# 首页布局修复需求分析

**项目**: vibex-homepage-layout-fix  
**分析师**: Analyst Agent  
**日期**: 2026-03-17  
**状态**: ✅ 分析完成

---

## 执行摘要

**问题**: 首页模块化重构后，布局与原始需求不符，预览区域和需求录入区域未按预期分离显示。

**核心需求**: 
1. 预览区域占中央区域 60%，固定展示
2. 需求录入区域占中央区域 40%，固定展示
3. 节点勾选功能支持

**推荐方案**: 调整 `content` 区域为上下分栏布局，使用 `splitContainer` 样式类实现。

---

## 一、问题诊断

### 1.1 当前布局状态

**文件**: `src/app/homepage.module.css`

```
当前布局:
┌─────────────────────────────────────────────────┐
│                    Navbar                        │
├────────┬─────────────────────────┬──────────────┤
│        │                         │              │
│ Sidebar│       Content           │   AI Panel   │
│  (15%) │        (60%)            │    (25%)     │
│        │  [Tab切换: 预览/录入]    │              │
│        │                         │              │
└────────┴─────────────────────────┴──────────────┘
```

**问题**:
1. 预览在 Tab 切换中，非固定展示
2. 需求录入在 Tab 内容区域
3. 用户需要切换 Tab 才能查看预览

### 1.2 目标布局

```
目标布局:
┌─────────────────────────────────────────────────┐
│                    Navbar                        │
├────────┬─────────────────────────┬──────────────┤
│        │    预览区域 (60%)        │              │
│        │  [Mermaid 图表渲染]      │              │
│ Sidebar├─────────────────────────┤   AI Panel   │
│  (15%) │    需求录入区域 (40%)    │    (25%)     │
│        │  [输入框 + 示例 + 按钮]   │              │
└────────┴─────────────────────────┴──────────────┘
```

### 1.3 已有样式分析

**已定义的样式类**:
| 类名 | 用途 | 状态 |
|------|------|------|
| `.splitContainer` | 水平分栏容器 | ✅ 已定义 |
| `.previewArea` | 预览区域样式 | ✅ 已定义 |
| `.inputArea` | 录入区域样式 | ✅ 已定义 |
| `.resizeHandle` | 拖拽分隔线 | ✅ 已定义 |

**问题**: 样式已定义但未被正确应用到组件中。

---

## 二、根因分析

### 2.1 组件结构问题

**文件**: `src/components/homepage/HomePage.tsx`

```tsx
// 当前结构
<div className={styles.mainContent}>
  <Sidebar ... />
  <main className={styles.content}>
    <StepContainer />  // 内部使用 Tab 切换
  </main>
</div>
```

**问题**:
- `StepContainer` 内部使用 Tab 切换，预览和录入分离
- 未使用已定义的 `splitContainer` 布局

### 2.2 布局方向问题

**已定义**: `.splitContainer` 使用 `flex-direction: row`（水平分栏）

**需求**: 垂直分栏（预览在上，录入在下）

**根因**: 样式类定义方向与需求不符

---

## 三、解决方案

### 3.1 方案 A：调整 CSS 样式（推荐）

**修改**: `homepage.module.css`

```css
/* 新增垂直分栏容器 */
.splitContainerVertical {
  display: flex;
  flex-direction: column;  /* 垂直分栏 */
  width: 100%;
  height: 100%;
  gap: 16px;
}

/* 预览区域 - 60% */
.previewArea {
  flex: 6;  /* 6/10 = 60% */
  min-height: 300px;
}

/* 录入区域 - 40% */
.inputArea {
  flex: 4;  /* 4/10 = 40% */
  min-height: 200px;
}
```

### 3.2 方案 B：调整组件结构

**修改**: `HomePage.tsx`

```tsx
// 目标结构
<div className={styles.mainContent}>
  <Sidebar ... />
  <main className={styles.content}>
    <div className={styles.splitContainerVertical}>
      <div className={styles.previewArea}>
        <PreviewCanvas ... />
      </div>
      <div className={styles.inputArea}>
        <InputArea ... />
      </div>
    </div>
  </main>
</div>
```

### 3.3 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| A: CSS 修改 | 改动最小 | 需同步调整组件 | ⭐⭐⭐⭐ |
| B: 组件重构 | 结构更清晰 | 改动较大 | ⭐⭐⭐ |

**推荐方案 A**，增量修改。

---

## 四、技术风险

### 4.1 风险矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 布局影响响应式 | 🟡 中 | 中 | 保留现有响应式媒体查询 |
| 组件依赖关系 | 🟢 低 | 低 | 检查 StepContainer 依赖 |
| 样式冲突 | 🟢 低 | 低 | 使用 CSS Modules 隔离 |

### 4.2 兼容性考虑

**保留响应式布局**:
```css
@media (max-width: 768px) {
  .splitContainerVertical {
    flex-direction: column;  /* 移动端保持垂直 */
  }
  
  .previewArea, .inputArea {
    flex: none;
    width: 100%;
  }
}
```

---

## 五、验收标准

### 5.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| LF-001 | 预览区域固定展示，占中央区域 60% | 浏览器检查布局 |
| LF-002 | 需求录入区域固定展示，占中央区域 40% | 浏览器检查布局 |
| LF-003 | 预览区域显示 Mermaid 图表 | 输入需求后验证 |
| LF-004 | 录入区域包含输入框、示例、按钮 | 视觉验证 |
| LF-005 | 响应式布局正常 | 窄屏测试 |

### 5.2 回归测试

- [ ] Sidebar 功能正常
- [ ] AI Panel 功能正常
- [ ] 五步流程导航正常
- [ ] 移动端布局正常

---

## 六、工作量估算

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| 1 | CSS 样式调整 | 0.5 天 |
| 2 | 组件结构调整 | 0.5 天 |
| 3 | 测试验证 | 0.5 天 |
| **总计** | | **1.5 天** |

---

## 七、下一步行动

1. **Dev**: 实现 CSS 样式调整
2. **Tester**: 验证布局效果
3. **Reviewer**: 代码审查

---

## 八、分析检查清单

- [x] 问题定位：布局结构与需求不符
- [x] 根因分析：样式已定义但未正确应用
- [x] 技术方案：CSS 调整 + 组件结构调整
- [x] 风险评估：响应式兼容、组件依赖
- [x] 验收标准：5 条可测试条件
- [x] 工作量估算：1.5 天

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-layout-fix/analysis.md`