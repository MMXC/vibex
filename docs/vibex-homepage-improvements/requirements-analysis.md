# 首页 10 项改进需求分析报告

**项目**: vibex-homepage-improvements  
**分析师**: Analyst Agent  
**日期**: 2026-03-14  
**状态**: 分析完成

---

## 1. 执行摘要

**核心发现**: 10 项需求中，**2 项 Critical**（布局核心问题）、**4 项 High**（用户体验关键）、**3 项 Medium**（功能优化）、**1 项 Low**（Nice-to-have）。建议分 3 批实施，首批聚焦布局和交互优化。

**预估总工作量**: 5-7 人日

---

## 2. 需求评估总览

| # | 需求 | 优先级 | 复杂度 | 技术可行性 | 预估工作量 |
|---|------|--------|--------|------------|-----------|
| 1 | 中央区域画布展示 | 🔴 Critical | 中 | ✅ 可行 | 1 人日 |
| 2 | Step 标题重复 | 🟡 Medium | 低 | ✅ 简单 | 0.25 人日 |
| 3 | 移除重复模块 | 🟠 High | 低 | ✅ 简单 | 0.25 人日 |
| 4 | 修复 design 页面 404 | 🔴 Critical | 低 | ✅ 简单 | 0.5 人日 |
| 5 | 布局调整（画布/录入区可调整） | 🟠 High | 高 | ⚠️ 需评估 | 1.5 人日 |
| 6 | 示例交互优化 | 🟠 High | 中 | ✅ 可行 | 0.5 人日 |
| 7 | 页面组件关系图 | 🟡 Medium | 中 | ✅ 已有组件 | 0.5 人日 |
| 8 | 导入自有项目 | 🟡 Medium | 高 | ⚠️ 需新 API | 2 人日 |
| 9 | 游客体验优化（缓存示例） | 🟠 High | 中 | ✅ 可行 | 0.5 人日 |
| 10 | 单页登录（抽屉式） | 🟢 Low | 中 | ✅ 有组件 | 0.5 人日 |

---

## 3. 详细需求分析

### 3.1 🔴 R1: 中央区域画布展示

**用户描述**: 上画布下需求，上画布可渐进式渲染后台返回的各图形

**现状分析**:
- 当前布局：三栏（Sidebar 15% + Content 60% + AI Panel 25%）
- Preview 区域在 Tab 切换中，非固定展示
- Mermaid 图表已有渐进式渲染能力

**技术方案**:
```tsx
// 建议布局调整
┌──────────────────────────────┐
│      PREVIEW 画布 (上)       │  ← 固定，可调整高度
│   [Mermaid 图表渐进渲染]      │
├──────────────────────────────┤
│      INPUT 区域 (下)         │  ← 固定
│   [需求输入框 + 导入选项]     │
└──────────────────────────────┘
```

**实施要点**:
1. 移除 Tab 切换，改为上下分区
2. 添加拖拽分割条，支持调整画布高度
3. 保持渐进式渲染逻辑

**风险**: 可能影响现有 Preview 交互流程

---

### 3.2 🟡 R2: Step 标题重复

**用户描述**: Step 1-5 标题和 placeholder 内容重复，建议只保留 placeholder

**现状分析**:
```tsx
// 当前代码 (page.tsx)
const STEPS = [
  { id: 1, label: '需求输入' },
  { id: 2, label: '限界上下文' },
  // ...
];
```

**问题定位**:
- Sidebar 步骤标签与 Content 区域标题重复
- 占用不必要的空间

**技术方案**:
```tsx
// 方案 A: 精简 Sidebar
const STEPS = [
  { id: 1, label: '①', tooltip: '需求输入' },
  { id: 2, label: '②', tooltip: '限界上下文' },
  // ...
];

// 方案 B: 移除 Content 标题，只保留 Sidebar
// 保留步骤说明在 placeholder 中
```

**建议**: 方案 B，移除重复标题

---

### 3.3 🟠 R3: 移除重复模块

**用户描述**: 下面保留了'开始诊断 一键优化'输入框，整合后不需要

**现状分析**:
- 诊断面板组件已存在
- 可能存在重复的输入区域

**技术方案**:
1. 确认重复区域位置
2. 移除冗余组件
3. 保留统一的 RequirementInput 组件

**风险**: 需确认诊断功能是否依赖该输入框

---

### 3.4 🔴 R4: 修复 design 页面 404

**用户描述**: 顶部导航 design 页面 404

**问题定位**:
```bash
# 文件检查结果
/src/app/design/page.tsx  # ❌ 不存在
/src/app/design/*/page.tsx  # ✅ 子页面存在
```

**根本原因**: `/design` 路由没有 `page.tsx`，只有子路由

**技术方案**:
```tsx
// 新建 /src/app/design/page.tsx
export default function DesignPage() {
  // 方案 A: 重定向到首页
  redirect('/');
  
  // 方案 B: 显示设计入口页
  return <DesignLanding />;
}
```

**建议**: 方案 A，重定向到首页

---

### 3.5 🟠 R5: 布局调整（画布/录入区可调整）

**用户描述**: 中央区域画布和录入区域建议顶宽并可调整大小

**现状分析**:
- 当前固定比例布局
- 用户无法自定义区域大小

**技术方案**:
```tsx
// 使用 react-resizable-panels 或自定义拖拽
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

<PanelGroup direction="vertical">
  <Panel defaultSize={60} minSize={30}>
    <PreviewCanvas />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={40} minSize={20}>
    <InputArea />
  </Panel>
</PanelGroup>
```

**依赖**: 需安装 `react-resizable-panels` 或实现自定义拖拽

---

### 3.6 🟠 R6: 示例交互优化

**用户描述**: 点击示例需要点一下实时预览再点击回来才能看到示例需求

**问题定位**:
```tsx
// 当前代码逻辑
const handleSampleClick = (desc: string) => {
  setRequirementText(desc);
  // ❌ 没有自动切换到输入 Tab
};
```

**技术方案**:
```tsx
const handleSampleClick = (desc: string) => {
  setRequirementText(desc);
  setActiveTab('input');  // ✅ 自动切换到输入 Tab
  // 或直接触发预览更新
  generatePreviewMermaid(desc);
};
```

**风险**: 需确认用户期望的行为

---

### 3.7 🟡 R7: 页面组件关系图

**用户描述**: 扩展5步流程里面要加入页面组件关系图

**现状分析**:
- 已有 `PageTreeDiagram` 组件
- 当前未集成到 5 步流程中

**技术方案**:
```tsx
// 扩展 STEPS
const STEPS = [
  { id: 1, label: '需求输入' },
  { id: 2, label: '限界上下文' },
  { id: 3, label: '领域模型' },
  { id: 4, label: '业务流程' },
  { id: 4.5, label: '页面组件' },  // ← 新增
  { id: 5, label: '项目创建' },
];
```

**依赖**: 需要后端 API 支持页面组件关系生成

---

### 3.8 🟡 R8: 导入自有项目

**用户描述**: 首页应该添加导入自己的项目功能

**现状分析**:
- 已有 GitHub/Figma 导入组件
- 但缺少「导入已有项目」入口

**技术方案**:
```tsx
// 新增导入入口
<div className={styles.importSection}>
  <GitHubImport />
  <FigmaImport />
  <ProjectImport />  {/* ← 新增 */}
</div>
```

**依赖**: 
- 需要新的 API 支持项目导入
- 需要解析项目结构

**风险**: 工作量较大，建议后续迭代

---

### 3.9 🟠 R9: 游客体验优化（缓存示例）

**用户描述**: 对未登录用户展示完整示例（缓存结果而不是重新请求AI）

**现状分析**:
- 游客可以输入需求，但每次都请求 AI
- 浪费资源，响应慢

**技术方案**:
```tsx
// 方案 A: 预生成示例结果
const CACHED_EXAMPLES = {
  '在线教育平台': { contexts: [...], models: [...], flow: '...' },
  '项目管理工具': { contexts: [...], models: [...], flow: '...' },
  '电商网站': { contexts: [...], models: [...], flow: '...' },
};

// 方案 B: LocalStorage 缓存
const getCachedResult = (text: string) => {
  const cache = localStorage.getItem(`example_${hash(text)}`);
  return cache ? JSON.parse(cache) : null;
};
```

**建议**: 方案 A，预生成示例数据

---

### 3.10 🟢 R10: 单页登录（抽屉式）

**用户描述**: 点击开始使用跳到 auth 页不符合单页流程，建议顶部导航推出 60px 登录抽屉

**现状分析**:
- 已有 `LoginDrawer` 组件
- 当前跳转 `/auth` 页面

**技术方案**:
```tsx
// 使用现有 LoginDrawer
<button onClick={() => setIsLoginDrawerOpen(true)}>
  开始使用
</button>

<LoginDrawer 
  isOpen={isLoginDrawerOpen} 
  onClose={() => setIsLoginDrawerOpen(false)} 
/>
```

**依赖**: 确认 LoginDrawer 已正确实现

---

## 4. 分批实施方案

### Phase 1: Critical 修复（1 人日）
| # | 需求 | 工作量 |
|---|------|--------|
| R4 | 修复 design 页面 404 | 0.5 人日 |
| R1 | 中央区域画布展示（基础版） | 0.5 人日 |

### Phase 2: High 优先级（3 人日）
| # | 需求 | 工作量 |
|---|------|--------|
| R3 | 移除重复模块 | 0.25 人日 |
| R5 | 布局调整（可拖拽） | 1.5 人日 |
| R6 | 示例交互优化 | 0.5 人日 |
| R9 | 游客体验优化 | 0.5 人日 |

### Phase 3: Medium/Low 优化（2 人日）
| # | 需求 | 工作量 |
|---|------|--------|
| R2 | Step 标题重复 | 0.25 人日 |
| R7 | 页面组件关系图 | 0.5 人日 |
| R10 | 单页登录 | 0.5 人日 |
| R8 | 导入自有项目（可选） | 2 人日 |

---

## 5. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 布局调整影响响应式 | 中 | 高 | 保持最小宽度约束 |
| 移除模块影响功能 | 低 | 中 | 确认依赖关系后移除 |
| 新依赖包增加包体积 | 中 | 低 | 使用 Tree-shaking |
| 游客缓存数据过期 | 低 | 低 | 设置合理过期时间 |

---

## 6. 验收标准

### Phase 1 验收
- [ ] `/design` 路由正常访问（重定向或展示页面）
- [ ] 画布区域固定在输入区域上方
- [ ] 画布支持渐进式渲染

### Phase 2 验收
- [ ] 无重复的输入/诊断模块
- [ ] 画布和输入区域可拖拽调整
- [ ] 点击示例立即显示内容
- [ ] 游客点击示例使用缓存数据

### Phase 3 验收
- [ ] 步骤标题无重复
- [ ] 5 步流程包含页面组件关系图
- [ ] 点击「开始使用」弹出登录抽屉

---

## 7. 建议下一步

1. **PM**: 根据本报告制定详细 PRD
2. **Architect**: 评估布局调整技术方案
3. **Dev**: 评估 react-resizable-panels 依赖

---

*分析完成时间: 2026-03-14 15:35*  
*Analyst Agent*