# PRD: VibeX 首页重构 (homepage-redesign-analysis)

**项目**: homepage-redesign-analysis  
**版本**: v1.0  
**PM**: PM Agent  
**日期**: 2026-03-21  
**状态**: Draft  
**依赖**: `docs/homepage-redesign-analysis/analysis.md` (done 2026-03-21)

---

## 问题陈述

当前首页存在以下核心问题，影响用户完成率和产品体验：

1. **P0-B1**: 首页未实现三栏布局，PreviewArea 和 InputArea 未独立分区
2. **P0-B2**: 登录状态未持久化，刷新页面后丢失
3. **P0-B3**: 步骤切换响应慢 (>500ms)，无状态快照支持回退
4. **P0-B4**: AI 分析结果渲染不稳定，Mermaid 大图有性能问题
5. **P0-B5**: 底部面板缺失，AI 思考过程不可见

---

## 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| 首次加载速度 | < 2s (LCP) | Lighthouse |
| 步骤切换延迟 | < 500ms | Performance API |
| AI 首次结果 | < 10s | 计时测试 |
| 状态持久化成功率 | ≥ 90% | E2E 刷新测试 |
| 项目创建成功率 | ≥ 99% | E2E |
| 预览渲染成功率 | ≥ 95% (4种类型) | 单元测试 |
| SSE 重连成功率 | 100% (≤3次) | 断网测试 |

---

## Epic 拆分

### Epic 1: 布局框架
**目标**: 实现 1400px 居中、三栏+底部面板的网格布局  
**功能点**: F1.1–F1.5 | **工作量**: 6h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-1.1 | 页面容器居中 | `expect(wrapper.getBoundingClientRect().width).toBeCloseTo(1400)` |
| ST-1.2 | Grid 三栏布局 | `expect(gridCols).toBe(3)` + `expect(gridRows).toBe(3)` |
| ST-1.3 | 响应式断点 (1200/900px) | 1200px → 两栏；900px → 单栏 |
| ST-1.4 | 抽屉层叠 (z-index) | 底部面板 z-index < 侧边抽屉 < 模态框 |
| ST-1.5 | CSS 主题变量 | 所有颜色/间距/阴影使用 CSS 变量 |

**DoD**: 布局在 1440/1200/900/375px 四种视口下验证通过

---

### Epic 2: Header 导航
**目标**: 实现 Logo、导航链接、登录状态切换  
**功能点**: F2.1–F2.4 | **工作量**: 4h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-2.1 | Logo 显示 | `expect(screen.getByText('VibeX')).toBeInTheDocument()` |
| ST-2.2 | 导航链接 (4个) | `/projects`, `/templates`, `/docs`, `/login` 均可跳转 |
| ST-2.3 | 未登录显示登录按钮 | `expect(getByRole('button', { name: /登录/i })).toBeVisible()` |
| ST-2.4 | 登录后显示用户头像 | `expect(getByAltText('avatar')).toBeVisible()` |

**DoD**: 登录前后 Header 内容正确切换，登录抽屉可正常打开

---

### Epic 3: 左侧抽屉 (步骤导航)
**目标**: 四步流程切换，状态可视化  
**功能点**: F3.1–F3.3 | **工作量**: 4h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-3.1 | 步骤列表渲染 (4步) | `expect(screen.getAllByRole('listitem')).toHaveLength(4)` |
| ST-3.2 | 点击切换步骤 < 500ms | `expect(switchTime).toBeLessThan(500)` |
| ST-3.3 | 步骤状态样式 (默认/激活/完成) | 默认灰色 → 激活蓝色高亮 → 完成绿色勾选 |

**DoD**: 步骤可切换，历史步骤可回退，状态实时同步

---

### Epic 4: 预览区
**目标**: 空状态/加载/渲染全链路支持  
**功能点**: F4.1–F4.6 | **工作量**: 8h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-4.1 | 空状态占位符 | 输入前显示引导文案和图示 |
| ST-4.2 | 加载骨架屏 | `expect(screen.getByTestId('skeleton')).toBeVisible()` |
| ST-4.3 | Mermaid 渲染 (4种类型) | `expect(mermaid.render(' flowchart TD ...')).toBeTruthy()` |
| ST-4.4 | 缩放控制 (50%–200%) | 缩放滑块实时生效 |
| ST-4.5 | 拖拽平移 | 鼠标拖拽可平移画布 |
| ST-4.6 | 导出 PNG/SVG | `expect(exportAs('png')).toBeTruthy()` |

**DoD**: 4种 Mermaid 类型均正确渲染，缩放/拖拽/导出通过 E2E 测试

---

### Epic 5: 右侧抽屉 (AI 思考过程)
**目标**: SSE 流式展示 AI 分析过程  
**功能点**: F5.x | **工作量**: 4h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-5.1 | SSE 连接建立 | `expect(eventSource.readyState).toBe(OPEN)` |
| ST-5.2 | 流式文本逐步显示 | 每 100ms 增量更新一次 |
| ST-5.3 | 连接断开自动重连 (≤3次) | 断网后 `expect(reconnectCount).toBeLessThanOrEqual(3)` |

**DoD**: SSE 连接稳定，断线自动重连，内容流式显示无闪烁

---

### Epic 6: 底部面板
**目标**: 需求录入、AI 交互、项目创建  
**功能点**: F6.1–F6.10 | **工作量**: 8h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-6.1 | 收起/展开手柄 (30px) | `expect(collapseHandle.height).toBe(30)` |
| ST-6.2 | 需求录入 TextArea (支持 5000 字) | 粘贴 5000 字不崩溃，滚动正常 |
| ST-6.3 | 发送按钮 | `expect(sendBtn).toBeDisabled()` 当 textarea 为空 |
| ST-6.4 | AI 快捷询问 (预设问题) | 5个预设问题可点击发送 |
| ST-6.5 | 诊断/优化按钮 | 点击后 SSE 返回相关建议 |
| ST-6.6 | 历史记录 | 最近 10 条对话可展开查看 |
| ST-6.7 | 保存草稿 | localStorage 存储，刷新后恢复 |
| ST-6.8 | 重新生成按钮 | 重新触发分析流程 |
| ST-6.9 | 创建项目按钮 | 点击后 POST `/api/v1/projects`，跳转成功 |
| ST-6.10 | 快捷键支持 (Ctrl+Enter 发送) | `expect(handleSend).toHaveBeenCalled()`

**DoD**: 底部面板所有功能可正常使用，交互流畅 60fps

---

### Epic 7: AI 展示区
**目标**: 三列卡片展示 AI 分析结果  
**功能点**: F7.x | **工作量**: 4h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-7.1 | 三列卡片布局 | `expect(cardColumns).toBe(3)` |
| ST-7.2 | 卡片内容填充 | 每个卡片独立获取/展示数据 |
| ST-7.3 | 卡片点击展开详情 | 展开后显示完整分析内容 |

**DoD**: 卡片内容与预览区同步，展开/收起动画流畅

---

### Epic 8: 悬浮模式
**目标**: 滚动时底部面板自动收起  
**功能点**: F8.x | **工作量**: 3h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-8.1 | 滚动触发收起 | 滚动 200px 后面板自动收起 |
| ST-8.2 | 悬浮停止恢复 | 停止滚动 1s 后面板恢复 |

**DoD**: 悬浮交互不影响正常滚动体验，动画无卡顿

---

### Epic 9: 状态管理
**目标**: 状态持久化、快照回退、SSE 连接  
**功能点**: F9.1–F9.4 | **工作量**: 4h

| Story ID | Story | 验收标准 |
|----------|-------|----------|
| ST-9.1 | localStorage 持久化 | 刷新后所有状态字段完整恢复 |
| ST-9.2 | 状态快照 (支持回退) | 保存最近 5 个快照，回退后状态正确 |
| ST-9.3 | SSE 连接管理 | 组件挂载时连接，卸载时断开 |
| ST-9.4 | 错误重连 (指数退避) | 错误后 1s → 2s → 4s 重连 |

**DoD**: Zustand store 覆盖所有首页状态，持久化和快照功能通过单元测试

---

## 优先级矩阵

| Epic | 功能点 | P0/P1/P2 | 人日 | 页面集成 |
|------|--------|----------|------|----------|
| Epic 1: 布局框架 | 5 | P0 | 6h | ✅ |
| Epic 2: Header | 4 | P0 | 4h | ✅ |
| Epic 3: 左侧抽屉 | 3 | P0 | 4h | ✅ |
| Epic 4: 预览区 | 6 | P0 | 8h | ✅ |
| Epic 5: 右侧抽屉 | 3 | P1 | 4h | ✅ |
| Epic 6: 底部面板 | 10 | P0 | 8h | ✅ |
| Epic 7: AI展示区 | 3 | P1 | 4h | ✅ |
| Epic 8: 悬浮模式 | 2 | P2 | 3h | ✅ |
| Epic 9: 状态管理 | 4 | P0 | 4h | ✅ |

**总计**: 32 功能点 | P0: 19个 (22h) | P1: 10个 (8h) | P2: 3个 (3h) | 合计 33h

---

## Sprint 规划

| Sprint | Epic | 目标 | 人日 |
|--------|------|------|------|
| Sprint 1 (5天) | Epic 1, 3, 9 | 可运行的布局+状态管理 | 14h |
| Sprint 2 (3天) | Epic 2, 4 | Header + 预览区 | 12h |
| Sprint 3 (3天) | Epic 6 | 底部面板核心功能 | 8h |
| Sprint 4 (2天) | Epic 5, 7 | SSE + AI展示区 | 8h |
| Sprint 5 (2天) | Epic 8 | 悬浮模式 + 测试优化 | 6h |

---

## 非功能需求 (NFR)

| 类型 | 要求 |
|------|------|
| 性能 | 首屏 < 2s，步骤切换 < 500ms，AI 结果 < 10s |
| 兼容性 | Chrome 90+, Firefox 90+, Safari 14+, Edge 90+ |
| 动画 | 60fps，无主线程阻塞 |
| 状态持久化 | localStorage，刷新恢复 ≥ 90% |
| 可访问性 | 键盘导航，ARIA 标签，色对比度 4.5:1 |
| 移动端 | 基本可用 (iOS 14+ / Android 10+) |

---

## Out of Scope

- 移动端完整适配（仅基本可用）
- 离线模式 (PWA)
- 多语言/国际化
- 深色模式细节优化
- 用户个性化设置

---

## 依赖

| 依赖方 | 依赖项 | 预计就绪 |
|--------|--------|----------|
| 后端 | `/api/v1/analyze/stream` (SSE) | 已实现 |
| 前端 | Mermaid.js v10+ | 已引入 |
| 前端 | Zustand | 已使用 |
| 设计 | 设计稿 (Figma) | 待提供 |

---

**文档版本**: v1.0  
**下一步**: Architect 设计架构 → Dev 开始 Sprint 1
