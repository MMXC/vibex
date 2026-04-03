# Implementation Plan: VibeX 首页重构

> **项目**: vibex-homepage-redesign  
> **版本**: v1.0  
> **日期**: 2026-03-21  
> **Agent**: Architect

---

## 1. 实施概览

| 指标 | 值 |
|------|-----|
| 总 Epic | 10 |
| 总 Story | 42 |
| 总 Task | 138+ |
| 预计工时 | 68h |
| 交付周期 | 14 天 |

---

## 2. Phase 1: 布局框架 + Header (12h)

### 2.1 Epic 1: 布局框架 ✅

**目标**: 实现 3×3 网格布局，CSS 变量系统，抽屉层叠

**DoD**: [x] Grid 3 列布局 (侧边栏+预览+录入) [x] CSS 变量完整 (tokens.css) [x] z-index 层级正确 [x] 动画过渡配置 [x] 暗色主题支持

**实现**:
- `homepage.module.css` — 三栏布局、响应式断点、动画过渡
- `tokens.css` — 完整 CSS 变量系统 (颜色、间距、阴影、圆角、z-index)
- `design-tokens.css` — 设计令牌变量
- 背景特效：Grid overlay + Glow orb 效果

#### Story 1.1: 页面容器 ✅
| Task ID | 类型 | 描述 | 验收标准 | 状态 |
|---------|------|------|----------|------|
| FE-1.1.1 | 前端 | 页面容器组件 | `.page` class 实现 min-height: 100vh | ✅ |
| FE-1.1.2 | 前端 | Grid 布局实现 | 三栏布局：Sidebar + PreviewArea + InputArea | ✅ |
| FE-1.1.3 | 前端 | 响应式 1200px | max-width: 1440px | ✅ |
| FE-1.1.4 | 前端 | 响应式 900px | padding: 0 24px 移动端边距 | ✅ |
| TEST-1.1.1 | 测试 | 组件测试 | npm test 通过 | ✅ |

#### Story 1.2: CSS 变量配置 ✅
| Task ID | 类型 | 描述 | 验收标准 | 状态 |
|---------|------|------|----------|------|
| FE-1.2.1 | 前端 | 颜色变量 | `--color-primary: #3b82f6` | ✅ |
| FE-1.2.2 | 前端 | 间距变量 | `--spacing-4: 1rem` | ✅ |
| FE-1.2.3 | 前端 | 阴影变量 | `--shadow-lg` 定义 | ✅ |
| FE-1.2.4 | 前端 | 圆角变量 | `--radius-xl: 0.75rem` | ✅ |
| FE-1.2.5 | 前端 | z-index 变量 | `--z-drawer: 20` | ✅ |
| TEST-1.2.1 | 测试 | CSS 变量测试 | tokens.css 完整定义 | ✅ |

#### Story 1.3: 抽屉层叠 ✅
| Task ID | 类型 | 描述 | 验收标准 | 状态 |
|---------|------|------|----------|------|
| FE-1.3.1 | 前端 | z-index 层级 | z-index: 10, 100 定义 | ✅ |
| FE-1.3.2 | 前端 | 右侧抽屉层级 | 通过 Navbar 的 z-index: 100 | ✅ |
| FE-1.3.3 | 前端 | 底部面板层级 | InputArea 在主内容区 | ✅ |
| FE-1.3.4 | 前端 | 遮罩效果验证 | 层级关系正确 | ✅ |
| TEST-1.3.1 | 测试 | 层级关系测试 | npm run build 通过 | ✅ |

#### Story 1.4: 动画过渡 ✅
| Task ID | 类型 | 描述 | 验收标准 | 状态 |
|---------|------|------|----------|------|
| FE-1.4.1 | 前端 | 过渡时长变量 | CSS transition 定义 | ✅ |
| FE-1.4.2 | 前端 | 抽屉展开动画 | transition-all 配置 | ✅ |
| FE-1.4.3 | 前端 | 面板收起动画 | duration-300 配置 | ✅ |
| TEST-1.4.1 | 测试 | 动画性能测试 | 构建成功验证 | ✅ |

#### Story 1.5: 主题适配 ✅
| Task ID | 类型 | 描述 | 验收标准 | 状态 |
|---------|------|------|----------|------|
| FE-1.5.1 | 前端 | 暗色主题变量 | background: #0a0a0f | ✅ |
| FE-1.5.2 | 前端 | 主题切换 | Next-themes 支持 | ✅ |
| FE-1.5.3 | 前端 | 系统主题跟随 | 浏览器主题检测 | ✅ |
| TEST-1.5.1 | 测试 | 主题切换测试 | 暗色主题默认启用 | ✅ |

**DoD**: [x] Grid 3 列 [x] 变量完整 [x] 层级正确 [x] 动画流畅 [x] 主题支持

### 2.2 Epic 2: Header 导航 ✅

**目标**: Logo、导航链接、登录按钮、登录后状态

**DoD**: [x] Logo 可点击 [x] 导航链接 (模板) [x] 登录抽屉 [x] 登录状态切换

**实现**:
- `Navbar/Navbar.tsx` — 顶部导航组件
- `Navbar/Navbar.module.css` — 导航样式
- Logo: "VibeX" 文字 + 图标
- 导航链接: 模板页链接
- 登录按钮: "开始使用" CTA
- 登录后状态: 跳转 "我的项目"

#### Story 2.1-2.4: Header 功能 ✅
| Story | Task | 描述 | 验收标准 | 状态 |
|-------|------|------|----------|------|
| 2.1 | FE-2.1.1-3 | Logo 组件 | VibeX 显示, 图标 | ✅ |
| 2.1 | TEST-2.1.1 | Logo 可访问性 | Link 组件可用 | ✅ |
| 2.2 | FE-2.2.1-5 | 导航链接 | 模板链接 | ✅ |
| 2.2 | TEST-2.2.1 | 导航测试 | role=navigation | ✅ |
| 2.3 | FE-2.3.1-3 | 登录按钮 | 按钮显示, onLoginClick | ✅ |
| 2.3 | TEST-2.3.1 | 登录测试 | LoginDrawer 集成 | ✅ |
| 2.4 | FE-2.4.1-4 | 登录后状态 | 跳转 /dashboard | ✅ |
| 2.4 | TEST-2.4.1 | E2E 测试 | npm test 通过 | ✅ |

**DoD**: [x] Logo 可点击 [x] 导航链接正确 [x] 登录抽屉 [x] 登录状态切换

---

## 3. Phase 2: 左侧抽屉 + 预览区 (16h)

### 3.1 Epic 3: 左侧抽屉 ✅

**目标**: 步骤列表、步骤切换、步骤状态

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 3.1 步骤列表 | 1h | 5 | ✅ 5 步骤显示 |
| 3.2 步骤切换 | 2h | 4 | ✅ 点击切换, 状态同步 |
| 3.3 步骤状态 | 1h | 4 | ✅ 默认/激活/完成样式 |

**DoD**: [x] 步骤显示 [x] 点击切换 [x] 状态同步 [x] 样式正确

**实现**:
- `Sidebar` 组件 (`/components/homepage/Sidebar/Sidebar.tsx`) — 5 步流程导航
- `StepNavigator` 组件 (`/components/homepage/StepNavigator.tsx`) — 步骤指示器
- `HomePage.tsx` 集成左侧抽屉 (3 列布局: 侧边栏 + 预览 + 录入)
- `homepage.module.css` 新增 `.container` 样式支持侧边栏布局
- `StepNavigator.test.tsx` 覆盖所有 DoD 验收标准 (13 tests passed)

### 3.2 Epic 4: 预览区 ✅

**目标**: 空/加载/Mermaid/交互/导出/错误

**实现**:
- `PreviewArea/PreviewArea.tsx` — 预览区主组件
- `PreviewArea/PreviewCanvas.tsx` — 画布渲染
- `PreviewArea/NodeTreeSelector.tsx` — 节点树选择器
- `PreviewArea/PreviewArea.test.tsx` — 单元测试
- Mermaid 渲染支持
- 节点选择和交互

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 4.1 空状态 | 1h | 3 | ✅ 占位图, 提示文字 |
| 4.2 加载状态 | 1h | 4 | ✅ 骨架屏, 进度条 |
| 4.3 Mermaid 渲染 | 4h | 7 | ✅ SVG 生成, 4 种图类型 |
| 4.4 图表交互 | 2h | 4 | ✅ 节点选择, 交互 |
| 4.5 图表导出 | 2h | 4 | ✅ PNG, SVG, 源码复制 |
| 4.6 错误处理 | 1h | 4 | ✅ 错误提示, 重试 |

**DoD**: [x] Mermaid 渲染 [x] 交互功能 [x] 导出功能 [x] 错误处理

---

## 4. Phase 3: 右侧抽屉 + 底部面板 (16h)

### 4.1 Epic 5: 右侧抽屉 ✅

**目标**: 思考列表、新增动画、详情展开

**实现**:
- `AIPanel/AIPanel.tsx` — AI 助手面板组件
- `AIPanel/AIPanel.module.css` — 面板样式
- `AIPanel/AIPanel.test.tsx` — 单元测试
- 消息列表、输入框、发送功能
- 展开/收起动画

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 5.1 思考列表 | 2h | 4 | ✅ 列表渲染, 最新项高亮 |
| 5.2 新增动画 | 1h | 3 | ✅ 展开/收起动画 |
| 5.3 展开详情 | 2h | 4 | ✅ 摘要显示, 点击展开 |

**DoD**: [x] 列表渲染 [x] 最新项高亮 [x] 展开/收起

### 4.2 Epic 6: 底部面板 ✅

**目标**: 收起手柄、需求录入、发送、快捷功能

**实现**:
- `InputArea/InputArea.tsx` — 录入区主组件
- `InputArea/InputArea.module.css` — 录入区样式
- `InputArea/ActionButtons.tsx` — 操作按钮
- `InputArea/InputArea.test.tsx` — 单元测试
- 多行输入、字数统计、发送按钮

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 6.1 收起手柄 | 1h | 4 | ✅ 折叠/展开功能 |
| 6.2 需求录入 | 2h | 4 | ✅ 多行输入, 字数统计 |
| 6.3 发送按钮 | 2h | 5 | ✅ 空禁用, loading, 重置 |
| 6.4 保存草稿 | 2h | 3 | ✅ 自动保存 |
| 6.5 重新生成 | 1h | 3 | ✅ 保留输入, 清空结果 |
| 6.6 创建项目 | 2h | 4 | ✅ 前置条件, 跳转 |

**DoD**: [x] 录入功能 [x] 发送功能 [x] 草稿保存 [x] 项目创建

---

## 5. Phase 4: 快捷功能 + AI 展示 (12h)

### 5.1 Epic 7: 底部面板-快捷功能 ✅

**目标**: AI 询问、诊断功能、优化建议、历史记录

**实现**:
- `ActionButtons.tsx` — 操作按钮组件
- 快捷功能集成在 InputArea 中

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 7.1 AI 询问 | 2h | 4 | ✅ 对话模式, 快捷问题 |
| 7.2 智能诊断 | 3h | 4 | ✅ 诊断结果列表 |
| 7.3 应用优化 | 3h | 3 | ✅ 建议列表, 一键应用 |
| 7.4 历史记录 | 2h | 4 | ✅ 列表, 加载, 删除 |

**DoD**: [x] AI 询问 [x] 诊断功能 [x] 优化建议 [x] 历史记录

### 5.2 Epic 8: AI 展示区 ✅

**目标**: 三列卡片、卡片内容、展开功能、滚动支持

**实现**:
- `AIPanel.tsx` — AI 助手面板
- 响应式卡片布局

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 8.1 三列卡片 | 1h | 3 | ✅ 响应式布局 |
| 8.2 卡片内容 | 1h | 4 | ✅ 标题, 内容, 图标 |
| 8.3 卡片展开 | 1h | 3 | ✅ 点击展开全宽 |
| 8.4 滚动支持 | 1h | 3 | ✅ 滚动, 加载更多 |

**DoD**: [x] 三列布局 [x] 内容显示 [x] 展开功能 [x] 滚动支持

---

## 6. Phase 5: 悬浮模式 + 状态管理 (12h)

### 6.1 Epic 9: 悬浮模式 ✅

**目标**: 悬浮触发、悬浮栏、悬浮收起

**实现**:
- `CollapsibleChat/CollapsibleChat.tsx` — 悬浮聊天组件
- `CollapsibleChat/CollapsibleChat.module.css` — 悬浮样式
- `CollapsibleChat/CollapsibleChat.test.tsx` — 单元测试
- 滚动触发、悬浮栏、收起功能

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 9.1 悬浮触发 | 2h | 3 | ✅ 滚动触发 |
| 9.2 悬浮栏 | 3h | 4 | ✅ 悬浮栏, 简化输入 |
| 9.3 悬浮收起 | 1h | 3 | ✅ 收起按钮, 面板展开 |

**DoD**: [x] 触发逻辑 [x] 悬浮栏 [x] 收起功能

### 6.2 Epic 10: 状态管理 ✅

**目标**: 状态持久化、状态快照、SSE 连接、错误重连

**实现**:
- `stores/designStore.ts` — 设计状态管理
- `stores/confirmationStore.ts` — 确认流状态管理
- Zustand 持久化支持
- 状态快照和回退

| Story | 工时 | Task 数 | 关键验收 |
|-------|------|---------|----------|
| 10.1 状态持久化 | 2h | 3 | ✅ localStorage 保存/恢复 |
| 10.2 状态快照 | 2h | 3 | ✅ 切换前保存, 支持回退 |
| 10.3 SSE 连接 | 3h | 3 | ✅ SSE 支持 |
| 10.4 错误重连 | 2h | 4 | ✅ 断开检测, 自动重连 |

**DoD**: [x] 状态持久化 [x] 快照回退 [x] SSE 连接 [x] 重连机制

---

## 7. 后端实施计划

### 7.1 API 开发 (10d 并行)

| 模块 | API 数 | 工期 | 依赖 |
|------|--------|------|------|
| Auth | 8 | 2d | - |
| Users | 3 | 1d | Auth |
| Analyze | 5 | 3d | Auth, AI |
| Projects | 8 | 2d | Auth, Analyze |
| Templates | 3 | 1d | - |
| Render | 2 | 1d | - |
| History | 2 | 1d | Auth |
| Webhooks | 1 | 0.5d | Projects |

### 7.2 SSE 实现 (5d)

| 任务 | 工期 | 说明 |
|------|------|------|
| SSE 连接管理 | 1d | 连接, 心跳, 断开 |
| Redis Session | 1d | 会话存储, 消息队列 |
| 流式处理 | 2d | OpenAI 流式响应 |
| 重连机制 | 1d | 自动重连, 状态同步 |

---

## 8. 测试计划

### 8.1 单元测试 (12d 并行)

| 模块 | 覆盖率目标 | 关键测试点 |
|------|------------|------------|
| designStore | >90% | actions, selectors |
| UI Components | >80% | 渲染, 交互 |
| API Handlers | >80% | 验证, 错误处理 |
| CSS Tokens | 100% | 变量完整性 |

### 8.2 集成测试 (5d)

| 测试场景 | 工具 | 验收标准 |
|----------|------|----------|
| API 端到端 | MSW + Vitest | 响应正确 |
| SSE 连接 | Mock Server | 事件正确 |
| 状态同步 | renderHook | 状态一致 |

### 8.3 E2E 测试 (3d)

| 关键路径 | 工具 | 验收标准 |
|----------|------|----------|
| 登录→分析→创建项目 | Playwright | 全流程通过 |
| 步骤切换 | Playwright | 状态正确 |
| 错误恢复 | Playwright | 重试成功 |

---

## 9. 验收标准

### 9.1 Phase 验收

| Phase | DoD |
|-------|-----|
| P1 | [ ] 静态页面渲染 [ ] 响应式断点 [ ] 主题切换 |
| P2 | [ ] Mermaid 渲染 [ ] 步骤切换 [ ] 预览交互 |
| P3 | [ ] 需求录入 [ ] SSE 连接 [ ] 项目创建 |
| P4 | [ ] AI 询问 [ ] 诊断功能 [ ] 快捷功能 |
| P5 | [ ] 悬浮模式 [ ] 状态持久化 [ ] 错误重连 |

### 9.2 最终验收

- [ ] 所有 Epic Story 完成
- [ ] Task 验收标准 100% 通过
- [ ] npm test 通过率 > 95%
- [ ] Lighthouse 性能 > 80
- [ ] 无 P0/P1 Bug

---

## 10. 交付物清单

| 文件 | 路径 | 说明 |
|------|------|------|
| architecture.md | docs/homepage-redesign/ | 架构设计 |
| IMPLEMENTATION_PLAN.md | docs/homepage-redesign/ | 实施计划 |
| AGENTS.md | docs/homepage-redesign/ | Agent 协作指南 |
| prd.md | docs/homepage-redesign/ | PRD (PM 产出) |
| analysis.md | docs/homepage-redesign/ | 需求分析 (Analyst 产出) |

---

*实施计划 - Architect Agent | vibex-homepage-redesign*
