# 首页关键 Bug 分析报告

**项目**: vibex-homepage-critical-bugs
**日期**: 2026-03-15
**优先级**: 🔴 P0 紧急

---

## 1. 问题清单

### Bug 1: 进度条未展示 🔴 P0
- **现象**: 分析过程中没有进度条显示
- **期望**: 显示分析步骤进度（1/5, 2/5...）
- **根因**: 代码中没有进度条组件
- **位置**: `page.tsx` 无进度条实现

### Bug 2: 分析步骤未逐个渲染 🔴 P0
- **现象**: 步骤切换没有动态渲染效果
- **期望**: 每个步骤完成后逐步显示
- **根因**: 步骤切换逻辑存在，但无渐进渲染

### Bug 3: 限界上下文图未渲染 🔴 P0
- **现象**: 点击生成后画布区域空白
- **期望**: 显示 Mermaid 图表
- **根因**: 需检查 `contextMermaidCode` 是否正确获取

### Bug 4: 面板最小化逻辑错误 🔴 P0
- **现象**: 
  - 最小化后没有自适应填充
  - 没有展开按钮动画
- **期望**: 
  - 一个面板最小化，另一个自动填充
  - 最小化后变成展开按钮（动画效果）

---

## 2. 影响分析

| Bug | 影响 | 用户可继续 |
|-----|------|------------|
| 进度条缺失 | 用户不知道进度 | 否 |
| 步骤未渲染 | 体验差 | 是 |
| 限界上下文图缺失 | 无法继续后续步骤 | 否 |
| 面板逻辑错误 | 体验差 | 是 |

---

## 3. 解决方案

### Bug 1: 添加进度条组件
```tsx
// 新增 StepProgress 组件
<StepProgress 
  currentStep={currentStep} 
  totalSteps={5}
  status={streamStatus}
/>
```

### Bug 2: 步骤渐进渲染
- 添加 CSS 动画
- 步骤完成时触发渲染

### Bug 3: 检查限界上下文 API
- 确认后端返回 `contextMermaidCode`
- 添加错误处理

### Bug 4: 面板自适应逻辑
```tsx
// 最小化逻辑改进
const handleMinimize = (panelId: string) => {
  setMinimizedPanel(panelId);
  // 另一个面板自动填充
  if (panelId === 'preview') {
    setPanelSizes([0, 100]);
  } else {
    setPanelSizes([100, 0]);
  }
};

// 展开按钮
{minimizedPanel === 'preview' && (
  <button className={styles.expandBtn} onClick={() => handleExpand('preview')}>
    ▶ 展开预览
  </button>
)}
```

---

## 4. 风险评估

| 风险 | 概率 | 缓解措施 |
|------|------|----------|
| 修复引入新 Bug | 中 | 分步修复，每步验证 |
| 后端 API 问题 | 低 | 添加降级处理 |

---

## 5. 实施建议

立即开始修复，按优先级：
1. Bug 3 (限界上下文) - 阻塞流程
2. Bug 1 (进度条) - 用户体验
3. Bug 4 (面板) - 用户体验
4. Bug 2 (步骤渲染) - 优化项

**预计工时**: 1 天