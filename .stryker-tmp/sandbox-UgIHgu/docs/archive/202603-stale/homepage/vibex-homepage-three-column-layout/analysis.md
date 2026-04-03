# 需求分析: 首页三栏布局恢复

**项目**: vibex-homepage-three-column-layout
**日期**: 2026-03-17
**分析师**: Analyst Agent

---

## 1. 执行摘要

### 目标

恢复首页垂直三栏布局：
- **左栏**: 15% 步骤指示器 (Sidebar)
- **中栏**: 60% 图 + 录入区域 (Preview + Input)
- **右栏**: 25% AI 分析过程 (AIPanel)

### 当前状态

| 检查项 | 当前值 | 期望值 |
|--------|--------|--------|
| 布局结构 | 垂直两栏 (60%+40%) | 三栏 (15%+60%+25%) |
| 步骤指示器 | 集成在 InputArea | 独立左侧栏 |
| AI 分析面板 | 不存在 | 右侧独立栏 |
| 单屏展示 | 不完整 | 完整展示 |

---

## 2. 现状分析

### 2.1 当前布局结构

**HomePage.tsx** (当前):
```tsx
<div className={styles.mainContentVertical}>
  {/* 预览区域 60% */}
  <PreviewArea ... />
  
  {/* 录入区域 40% */}
  <InputArea ... />
</div>
```

**CSS** (homepage.module.css):
```css
.mainContentVertical {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 64px);
}
```

### 2.2 期望的三栏布局

**CSS 已存在** (homepage.module.css):
```css
/* 三栏布局容器 */
.mainContainer {
  display: flex;
  flex: 1;
}

/* 左侧流程指示器 - 15% */
.sidebar {
  width: 15%;
  min-width: 180px;
}

/* 中间主体区域 - 60% */
.content {
  width: 60%;
}

/* 右侧 AI 助手 - 25% */
.aiPanel {
  width: 25%;
  min-width: 280px;
}
```

### 2.3 组件现状

| 组件 | 状态 | 说明 |
|------|------|------|
| Sidebar | ✅ 存在 | `src/components/homepage/Sidebar/Sidebar.tsx` |
| MainContent | ✅ 存在 | 支持三栏布局，需调整使用方式 |
| AIPanel | ✅ 存在 | `src/components/homepage/AIPanel/AIPanel.tsx` |
| ThinkingPanel | ✅ 存在 | `src/components/homepage/ThinkingPanel/ThinkingPanel.tsx` |

### 2.4 改动范围评估

| 文件 | 改动类型 | 影响程度 |
|------|----------|----------|
| `HomePage.tsx` | 结构调整 | 中 - 重构布局 |
| `homepage.module.css` | 可能微调 | 低 - CSS 已存在 |
| `PreviewArea.tsx` | 可能微调 | 低 |
| `InputArea.tsx` | 移除步骤指示器 | 低 |
| `AIPanel.tsx` | 集成 | 低 |

---

## 3. 解决方案

### 3.1 推荐方案：使用 MainContent 组件

**MainContent.tsx** 已支持三栏布局：

```tsx
import { MainContent } from '@/components/homepage';

<MainContent
  currentStep={currentStep}
  onStepClick={handleStepClick}
  steps={STEPS}
  mermaidCode={currentMermaidCode}
  input={<InputArea ... />}
  layout="horizontal"  // 三栏布局
/>
```

**优点**:
- 组件已实现，改动最小
- 支持 `horizontal` (三栏) 和 `vertical` (两栏) 切换
- 内置 StepNavigator

**缺点**:
- 需要集成 AIPanel/ThinkingPanel

### 3.2 备选方案：重构 HomePage.tsx

直接在 HomePage.tsx 中使用三栏布局：

```tsx
<div className={styles.mainContainer}>
  {/* 左栏: 步骤指示器 15% */}
  <Sidebar
    steps={STEPS}
    currentStep={currentStep}
    completedStep={completedStep}
    onStepClick={handleStepClick}
  />
  
  {/* 中栏: 图 + 录入 60% */}
  <div className={styles.content}>
    <PreviewArea ... />
    <InputArea ... />
  </div>
  
  {/* 右栏: AI 分析 25% */}
  <AIPanel ... />
</div>
```

**优点**:
- 完全控制布局
- 符合用户期望

**缺点**:
- 改动较大
- 需要调整样式

---

## 4. 详细实施步骤

### 方案 A: 使用 MainContent (推荐)

**Step 1**: 修改 HomePage.tsx 使用 MainContent

```tsx
import { MainContent } from '@/components/homepage';
import { AIPanel } from '@/components/homepage/AIPanel';

export default function HomePage() {
  // ... hooks
  
  return (
    <div className={styles.container}>
      <ParticleBackground />
      <Navbar ... />
      
      <div className={styles.mainContainer}>
        {/* 使用 MainContent 的三栏布局 */}
        <MainContent
          currentStep={currentStep}
          onStepClick={handleStepClick}
          steps={STEPS}
          mermaidCode={currentMermaidCode}
          layout="horizontal"
          input={
            <div className={styles.contentSplit}>
              <PreviewArea ... />
              <InputArea ... />
            </div>
          }
        />
        
        {/* 右侧 AI Panel */}
        <AIPanel
          thinkingMessages={thinkingMessages}
          status={streamStatus}
        />
      </div>
      
      <LoginDrawer ... />
    </div>
  );
}
```

**Step 2**: 调整 CSS

```css
/* 中栏内容分割 */
.contentSplit {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contentSplit .previewArea {
  flex: 0 0 60%;
}

.contentSplit .inputArea {
  flex: 0 0 40%;
}
```

### 方案 B: 自定义三栏布局

**Step 1**: 重构 HomePage.tsx

```tsx
<div className={styles.mainContainer}>
  {/* 左栏: 15% 步骤指示器 */}
  <Sidebar
    steps={STEPS}
    currentStep={currentStep}
    completedStep={completedStep}
    onStepClick={handleStepClick}
  />
  
  {/* 中栏: 60% 预览 + 录入 */}
  <div className={styles.content}>
    <div className={styles.previewSection}>
      <PreviewArea ... />
    </div>
    <div className={styles.inputSection}>
      <InputArea ... />
    </div>
  </div>
  
  {/* 右栏: 25% AI 分析 */}
  <aside className={styles.aiPanel}>
    <AIPanel ... />
  </aside>
</div>
```

**Step 2**: 从 InputArea 移除步骤指示器

InputArea 当前包含步骤指示器，需要移除（已移到 Sidebar）。

---

## 5. 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1.1 | 左栏宽度 15% | 浏览器开发者工具 |
| AC1.2 | 中栏宽度 60% | 浏览器开发者工具 |
| AC1.3 | 右栏宽度 25% | 浏览器开发者工具 |
| AC2.1 | 步骤指示器显示在左栏 | 视觉检查 |
| AC2.2 | 点击步骤可切换 | 交互测试 |
| AC3.1 | AI 分析过程显示在右栏 | 视觉检查 |
| AC4.1 | 单屏完整展示 | 窗口高度测试 |
| AC5.1 | 现有功能不受影响 | 回归测试 |

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 布局错乱 | 中 | 高 | 响应式测试 |
| 功能丢失 | 低 | 高 | 回归测试 |
| 性能下降 | 低 | 中 | 监控渲染时间 |

---

## 7. 实施建议

### 7.1 推荐顺序

1. **立即**: 使用方案 A (MainContent 组件)
2. **备选**: 如果方案 A 不满足需求，使用方案 B

### 7.2 预估工时

| 任务 | 工时 |
|------|------|
| HomePage.tsx 重构 | 2h |
| CSS 调整 | 1h |
| InputArea 调整 | 0.5h |
| 测试验证 | 1h |
| **总计** | **4.5h** |

### 7.3 下一步行动

1. Dev 选择方案 A 或 B
2. 实施布局调整
3. Tester 验证功能
4. Reviewer 代码审查

---

## 附录

### A. 相关文件

**需要修改**:
- `src/components/homepage/HomePage.tsx`
- `src/app/homepage.module.css` (可能)

**需要集成**:
- `src/components/homepage/Sidebar/Sidebar.tsx`
- `src/components/homepage/AIPanel/AIPanel.tsx`
- `src/components/homepage/MainContent.tsx`

**可能调整**:
- `src/components/homepage/InputArea/InputArea.tsx` (移除步骤指示器)

### B. 组件结构图

```
HomePage.tsx
├── ParticleBackground
├── Navbar
└── mainContainer
    ├── Sidebar (15%) ──────────── 步骤指示器
    ├── content (60%)
    │   ├── PreviewArea ─────────── 图表预览
    │   └── InputArea ───────────── 需求录入
    └── AIPanel (25%) ───────────── AI 分析过程
```

### C. CSS 已存在的类

```css
.mainContainer { display: flex; }
.sidebar { width: 15%; }
.content { width: 60%; }
.aiPanel { width: 25%; }
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-three-column-layout/analysis.md`