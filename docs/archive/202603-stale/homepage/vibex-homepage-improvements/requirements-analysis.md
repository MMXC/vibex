# 首页改进需求分析报告

**项目**: vibex-homepage-improvements
**版本**: 1.0
**日期**: 2026-03-14
**分析者**: Analyst Agent

---

## 执行摘要

VibeX 首页 (`/app/page.tsx`, 1026行) 已实现单页式五步设计流程。经分析，**11项需求中 4项为Bug修复、4项为UI优化、3项为Feature开发**。优先级排序：Bug修复 > UI优化 > Feature。

---

## 1. 需求分类与优先级

| # | 需求 | 类型 | 优先级 | 复杂度 | 预估工时 |
|---|------|------|--------|--------|----------|
| 4 | 修复 design 404 | Bug | P0 | 低 | 0.5h |
| 2 | Step 标题重复问题 | UI | P1 | 低 | 1h |
| 3 | 移除重复诊断模块 | UI | P1 | 低 | 0.5h |
| 6 | 示例交互优化 | UX | P1 | 中 | 2h |
| 5 | 布局可调整 | UI | P2 | 中 | 4h |
| 1 | 中央区域画布展示 | UI | P2 | 高 | 6h |
| 7 | 页面组件关系图 | Feature | P2 | 高 | 8h |
| 8 | 导入自有项目 | Feature | P2 | 高 | 6h |
| 10 | 单页登录抽屉 | Feature | P2 | 中 | 3h |
| 9 | 游客体验优化 | UX | P3 | 中 | 4h |
| 11 | 集成测试覆盖 | Test | P3 | 高 | 8h |

---

## 2. 详细需求分析

### 2.1 #4 修复 design 404 (P0 - Bug)

**问题描述**: 导航栏 `/design` 链接指向不存在的页面

**当前代码** (`page.tsx:466-470`):
```tsx
<Link href="/design" className={styles.navLink}>
  设计
</Link>
```

**实际情况**:
- `/design` 路由存在但无入口页面 (`app/design/*/page.tsx` 都是子路由)
- 根据之前分析，`/design/*` 整个流程无导航入口

**修复方案**:
- **方案A**: 重定向到首页 `href="/"`
- **方案B**: 重定向到确认流程 `href="/confirm"`
- **方案C**: 创建 `/design/page.tsx` 作为入口

**推荐**: 方案B，统一到 `/confirm` 流程

---

### 2.2 #2 Step 标题重复问题 (P1 - UI)

**问题描述**: 页面标题与侧边栏 Step 标签重复

**当前代码** (`page.tsx:529-533`):
```tsx
<h1 className={styles.pageTitle}>Step 1: 需求输入</h1>
<p className={styles.pageSubtitle}>
  描述你的产品需求，AI 将协助你完成完整的设计
</p>
```

**侧边栏代码** (`page.tsx:43-49`):
```tsx
const STEPS = [
  { id: 1, label: '需求输入' },
  { id: 2, label: '限界上下文' },
  // ...
];
```

**问题分析**:
- 侧边栏显示 "1 需求输入"
- 中央标题显示 "Step 1: 需求输入"
- 信息重复，浪费视觉空间

**修复方案**:
- 保留侧边栏步骤标签
- 中央标题改为描述性文字，如 "描述你的产品需求" 或 "需求分析工作台"

---

### 2.3 #3 移除重复诊断模块 (P1 - UI)

**问题描述**: 诊断模块可能存在重复

**当前代码** (`page.tsx:601-609`):
```tsx
{/* 智能诊断功能 - F1.3 诊断 UI 集成 */}
<div className={styles.diagnosisSection}>
  <DiagnosisPanel 
    onAnalyze={(text) => console.log('Diagnosed:', text)}
    onOptimize={(text) => {
      setRequirementText(text);
      console.log('Optimized and applied:', text);
    }}
  />
</div>
```

**检查点**:
1. `DiagnosisPanel` 组件位置: `@/components/diagnosis/DiagnosisPanel`
2. `RequirementInput` 组件是否已集成诊断功能

**修复方案**:
- 如果 `RequirementInput` 已集成诊断，移除独立的 `DiagnosisPanel`
- 如果未集成，保留但需明确职责划分

---

### 2.4 #6 示例交互优化 (P1 - UX)

**问题描述**: 示例需求按钮交互不够明显

**当前代码** (`page.tsx:586-594`):
```tsx
<div className={styles.sampleSection}>
  <span className={styles.sampleLabel}>试试这些示例：</span>
  <div className={styles.sampleList}>
    {SAMPLE_REQUIREMENTS.map((sample, idx) => (
      <button
        key={idx}
        className={styles.sampleButton}
        onClick={() => handleSampleClick(sample.desc)}
      >
        {sample.title}
      </button>
    ))}
  </div>
</div>
```

**问题分析**:
1. 点击示例后无视觉反馈
2. 示例与输入框的关系不明确
3. 缺少 "清空" 功能

**修复方案**:
1. 点击后滚动到输入框
2. 添加高亮动画
3. 添加 "使用此示例" 明确提示
4. 添加 "清空输入" 按钮

---

### 2.5 #5 布局可调整 (P2 - UI)

**问题描述**: 三栏布局固定比例，用户无法调整

**当前布局** (`page.tsx:493-499`):
```tsx
{/* 三栏布局 */}
<div className={styles.mainContainer}>
  {/* 左侧：流程指示器 - 15% */}
  <aside className={styles.sidebar}>
  {/* 中间：需求输入/预览 - 60% */}
  <main className={styles.content}>
  {/* 右侧：AI 对话 - 25% */}
  <aside className={styles.chatPanel}>
```

**修复方案**:
1. 添加拖拽分隔条
2. 使用 CSS resize 或自定义拖拽组件
3. 保存用户偏好到 localStorage

**技术实现**:
- 使用 `react-resizable-panels` 或自定义 `useResize` hook
- 最小/最大宽度限制

---

### 2.6 #1 中央区域画布展示 (P2 - UI)

**问题描述**: 中央区域缺少画布式展示

**当前实现**:
- Tab 切换: "需求输入" / "实时预览"
- 预览区域仅显示 Mermaid 图表

**期望效果**:
- 画布式布局，支持多图表同屏
- 类似 Miro/Excalidraw 的无限画布
- 步骤间数据可视化连接

**技术方案**:
- 集成 React Flow 作为画布引擎
- 将 Mermaid 图表转换为 React Flow 节点
- 添加拖拽、缩放、平移功能

**预估工时**: 6-8h

---

### 2.7 #7 页面组件关系图 (P2 - Feature)

**问题描述**: 缺少页面与组件的关系可视化

**当前状态**:
- 已有 `PageTreeDiagram` 组件 (`@/components/page-tree-diagram`)
- 但未在首页使用

**需求描述**:
- 显示生成的页面列表
- 显示每个页面的组件构成
- 支持点击查看详情

**实现位置**: Step 5 项目创建完成后

**技术方案**:
1. 复用现有 `PageTreeDiagram` 组件
2. 扩展为树形结构，支持展开/收起
3. 添加组件详情弹窗

---

### 2.8 #8 导入自有项目 (P2 - Feature)

**问题描述**: 缺少导入现有项目的功能

**当前代码** (`page.tsx:559-580`):
```tsx
{/* GitHub 导入选项 */}
<details className={styles.importOptions}>
  <summary className={styles.importSummary}>
    🐙 从 GitHub 导入项目
  </summary>
  <div className={styles.importContent}>
    <GitHubImport onImport={(text) => {...}} />
  </div>
</details>

{/* Figma 导入选项 */}
<details className={styles.importOptions}>
  <summary className={styles.importSummary}>
    🎨 从 Figma 导入设计
  </summary>
  <div className={styles.importContent}>
    <FigmaImport onImport={(text) => {...}} />
  </div>
</details>
```

**现有功能**:
- ✅ GitHub 导入组件已存在
- ✅ Figma 导入组件已存在

**缺失功能**:
- 导入后的数据处理流程不完整
- 缺少导入状态反馈
- 缺少错误处理

**修复方案**:
1. 完善导入流程
2. 添加加载状态和进度指示
3. 添加错误提示和重试机制

---

### 2.9 #10 单页登录抽屉 (P2 - Feature)

**问题描述**: 登录抽屉已实现但体验待优化

**当前代码** (`page.tsx:458-461`):
```tsx
<LoginDrawer
  isOpen={isLoginDrawerOpen}
  onClose={() => setIsLoginDrawerOpen(false)}
  onSuccess={() => window.location.reload()}
/>
```

**现有状态**:
- ✅ `LoginDrawer` 组件已存在
- ✅ 支持登录/注册切换

**优化点**:
1. 触发时机优化（当前在生成按钮点击时触发）
2. 登录后无缝继续操作（当前 `window.location.reload()` 会丢失状态）
3. 支持社交登录（微信、GitHub）

**修复方案**:
1. 登录成功后不刷新页面，仅更新认证状态
2. 保留用户的输入和进度
3. 添加社交登录按钮

---

### 2.10 #9 游客体验优化 (P3 - UX)

**问题描述**: 未登录用户无法体验核心功能

**当前逻辑** (`page.tsx:264-270`):
```tsx
const handleGenerate = () => {
  if (!isAuthenticated) {
    setIsLoginDrawerOpen(true);
    return;
  }
  // ...
};
```

**问题分析**:
- 游客点击任何生成按钮都会弹出登录
- 无法预览 AI 生成效果
- 转化率可能受影响

**优化方案**:
1. **方案A**: 允许游客生成一次预览，查看效果后再要求登录
2. **方案B**: 提供 Demo 模式，展示预设的生成结果
3. **方案C**: 游客模式限制功能，但允许基本体验

**推荐**: 方案B，提供 Demo 模式

---

### 2.11 #11 集成测试覆盖 (P3 - Test)

**问题描述**: 首页缺乏集成测试

**当前测试** (`page.test.tsx`):
- 存在测试文件但覆盖不完整
- 需要检查具体测试用例

**测试范围**:
1. 五步流程完整走通
2. 各组件渲染正确
3. API 调用 mock
4. 错误处理

**目标覆盖率**: > 70%

---

## 3. 依赖关系

```
#4 修复 design 404 ─────────────────────────────────────┐
                                                         │
#2 Step 标题重复 ──┬──────────────────────────────────────┤
                  │                                      │
#3 移除重复诊断 ──┘                                      │
                                                         │
#6 示例交互优化 ─────────────────────────────────────────┤
                                                         │
#5 布局可调整 ───────────────────────────────────────────┤
                                                         │
#1 中央画布展示 ─────────────────────────────────────────┤
                                                         │
#7 页面组件关系图 ──┬────────────────────────────────────┤
                  │                                    │
#8 导入自有项目 ───┤                                    │
                  │                                    │
#10 单页登录抽屉 ──┘                                    │
                                                       │
#9 游客体验优化 ────────────────────────────────────────┤
                                                       │
#11 集成测试覆盖 ←──────────────────────────────────────┘
```

---

## 4. 技术栈确认

| 需求 | 涉及技术 | 现有依赖 |
|------|----------|----------|
| #1 画布展示 | React Flow | ✅ 已安装 |
| #5 布局调整 | react-resizable-panels 或自定义 | ❌ 需安装或自实现 |
| #7 关系图 | React Flow + Mermaid | ✅ 已有 |
| #8 导入 | GitHub API, Figma API | ⚠️ 需确认 |
| #10 登录抽屉 | LoginDrawer 组件 | ✅ 已有 |
| #11 测试 | Jest, RTL | ✅ 已有 |

---

## 5. 风险评估

| 风险 | 影响需求 | 缓解措施 |
|------|----------|----------|
| React Flow 与 Mermaid 集成复杂 | #1, #7 | 使用现有 `MermaidPreview` 组件 |
| 登录状态管理跨组件 | #10 | 使用 Zustand 统一管理 |
| 游客模式数据安全 | #9 | 限制功能，不存储敏感数据 |
| 布局调整影响响应式 | #5 | 设置最小宽度，移动端禁用 |

---

## 6. 结论

**推荐实施顺序**:

| 阶段 | 需求 | 预计工时 |
|------|------|----------|
| **Phase 1: Bug修复** | #4, #2, #3 | 2h |
| **Phase 2: UX优化** | #6, #5 | 6h |
| **Phase 3: UI增强** | #1 | 6h |
| **Phase 4: Feature开发** | #7, #8, #10 | 17h |
| **Phase 5: 体验优化** | #9 | 4h |
| **Phase 6: 测试** | #11 | 8h |

**总计**: 43h

---

*报告完成时间: 2026-03-14 16:05 (GMT+8)*
*Analyst Agent*