# PRD: VibeX 首页重构详细设计

> **项目**: vibex-homepage-redesign  
> **版本**: v1.0  
> **日期**: 2026-03-21  
> **Agent**: PM  
> **状态**: Draft → Active  
> **依赖上游**: `analyze-requirements` ✅ PASSED

---

## 执行摘要

基于 V4 原型，完成 VibeX 首页前后端详细设计。10 个 Epic，42 个 Story，138+ 个 Task。

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 布局完成度 | 0% | 100% |
| 功能点覆盖 | 0/42 Story | 42/42 Story |
| Task 验收标准 | 0/138 | 138/138 |
| P0 功能就绪 | 0 | 32 |

---

## Epic-1: 布局框架

**目标**: 实现 3×3 网格布局，CSS 变量系统，抽屉层叠

### Story 1.1: 页面容器

| Task | 类型 | 描述 | 验收标准 | CSS规范 |
|------|------|------|----------|---------|
| FE-1.1.1 | 前端 | 页面容器组件 | `expect(container.className).toContain('page')` | `max-width: var(--container-xl)` |
| FE-1.1.2 | 前端 | Grid布局实现 | `expect(layout.children.length).toBe(9)` | `grid-template-rows: 64px 1fr auto` |
| FE-1.1.3 | 前端 | 响应式断点 | `expect(onResize(1200)).toMatchSnapshot()` | `@media (max-width: 1200px)` |
| FE-1.1.4 | 前端 | 900px断点 | `expect(onResize(900)).toMatchSnapshot()` | 单列布局 |
| TEST-1.1.1 | 测试 | 组件渲染测试 | `expect(screen.getByTestId('page-container')).toBeTruthy()` | - |

**DoD**: [ ] 容器居中 [ ] Grid 9格 [ ] 1200px断点 [ ] 900px断点

---

### Story 1.2: CSS变量配置

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-1.2.1 | 前端 | 颜色变量定义 | `expect(getComputedStyle(el).getPropertyValue('--color-primary')).toBe('#3b82f6')` |
| FE-1.2.2 | 前端 | 间距变量定义 | `expect(getComputedStyle(el).getPropertyValue('--spacing-4')).toBe('1rem')` |
| FE-1.2.3 | 前端 | 阴影变量定义 | `expect(getComputedStyle(el).getPropertyValue('--shadow-lg')).toBeTruthy()` |
| FE-1.2.4 | 前端 | 圆角变量定义 | `expect(getComputedStyle(el).getPropertyValue('--radius-xl')).toBe('0.75rem')` |
| FE-1.2.5 | 前端 | z-index变量定义 | `expect(getComputedStyle(el).getPropertyValue('--z-drawer')).toBe('20')` |
| TEST-1.2.1 | 测试 | CSS变量覆盖测试 | `expect(getComputedStyle(document.documentElement).getPropertyValue('--color-primary')).toBe('#3b82f6')` |

**DoD**: [ ] 颜色 [ ] 间距 [ ] 阴影 [ ] 圆角 [ ] z-index

---

### Story 1.3: 抽屉层叠

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-1.3.1 | 前端 | z-index层级配置 | `expect(leftDrawer.style.zIndex).toBe('20')` |
| FE-1.3.2 | 前端 | 右侧抽屉层级 | `expect(rightDrawer.style.zIndex).toBe('20')` |
| FE-1.3.3 | 前端 | 底部面板层级 | `expect(bottomPanel.style.zIndex).toBe('10')` |
| FE-1.3.4 | 前端 | 遮罩效果验证 | `expect(bottomPanel.style.zIndex).toBeLessThan(leftDrawer.style.zIndex)` |
| TEST-1.3.1 | 测试 | 层级关系测试 | `expect(getZIndex('leftDrawer')).toBeGreaterThan(getZIndex('bottomPanel'))` |

**DoD**: [ ] 抽屉z-index=20 [ ] 底部z-index=10 [ ] 层级关系正确

---

### Story 1.4: 动画过渡

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-1.4.1 | 前端 | 过渡时长变量 | `expect(getComputedStyle(el).getPropertyValue('--transition-fast')).toBe('150ms')` |
| FE-1.4.2 | 前端 | 抽屉展开动画 | `expect(drawer).toHaveClass('transition-all duration-150')` |
| FE-1.4.3 | 前端 | 面板收起动画 | `expect(panel).toHaveClass('transition-height duration-300')` |
| TEST-1.4.1 | 测试 | 动画性能测试 | `expect(performance.now()).toBeLessThan(16.67 * 2)` |

**DoD**: [ ] 150ms快速过渡 [ ] 300ms面板过渡 [ ] 无jank

---

### Story 1.5: 主题适配

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-1.5.1 | 前端 | 暗色主题变量 | `expect(getComputedStyle(el).getPropertyValue('--bg-primary')).toBe('#0f172a')` |
| FE-1.5.2 | 前端 | 主题切换 | `expect(document.documentElement).toHaveClass('dark')` |
| FE-1.5.3 | 前端 | 系统主题跟随 | `expect(window.matchMedia('(prefers-color-scheme: dark)')).toBeTruthy()` |
| TEST-1.5.1 | 测试 | 主题切换测试 | `expect(renderTheme('dark').className).toContain('dark')` |

**DoD**: [ ] 暗色主题 [ ] 亮色主题 [ ] 系统跟随

---

## Epic-2: Header导航

**目标**: Logo、导航链接、登录按钮、登录后状态

### Story 2.1: Logo组件

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-2.1.1 | 前端 | Logo显示 | `expect(screen.getByText('VibeX')).toBeInTheDocument()` |
| FE-2.1.2 | 前端 | 主色高亮 | `expect(logo.querySelector('.highlight')).toHaveTextContent('X')` |
| FE-2.1.3 | 前端 | 点击返回首页 | `expect(history.location.pathname).toBe('/')` |
| TEST-2.1.1 | 测试 | Logo可访问性 | `expect(screen.getByRole('link', {name: /vibex/i})).toHaveAttribute('href', '/')` |

**DoD**: [ ] VibeX文字 [ ] X高亮蓝色 [ ] 可点击

---

### Story 2.2: 导航链接

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-2.2.1 | 前端 | 导航链接渲染 | `expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(4)` |
| FE-2.2.2 | 前端 | 首页链接 | `expect(screen.getByRole('link', {name: /首页/i})).toHaveAttribute('href', '/')` |
| FE-2.2.3 | 前端 | 项目链接 | `expect(screen.getByRole('link', {name: /项目/i})).toHaveAttribute('href', '/projects')` |
| FE-2.2.4 | 前端 | 模板链接 | `expect(screen.getByRole('link', {name: /模板/i})).toHaveAttribute('href', '/templates')` |
| FE-2.2.5 | 前端 | 更新日志链接 | `expect(screen.getByRole('link', {name: /更新日志/i})).toHaveAttribute('href', '/changelog')` |
| TEST-2.2.1 | 测试 | 导航链接测试 | `expect(screen.getByRole('navigation')).toBeInTheDocument()` |

**DoD**: [ ] 4个链接 [ ] 路径正确 [ ] 当前页高亮

---

### Story 2.3: 登录按钮

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-2.3.1 | 前端 | 登录按钮显示 | `expect(screen.getByRole('button', {name: /登录/i})).toBeInTheDocument()` |
| FE-2.3.2 | 前端 | 触发登录抽屉 | `expect(screen.getByRole('dialog')).toBeInTheDocument()` |
| FE-2.3.3 | 前端 | 登录抽屉下推布局 | `expect(bottomPanel.style.transform).toBe('translateY(-400px)')` |
| TEST-2.3.1 | 测试 | 登录按钮点击 | `expect(mockLogin).toHaveBeenCalled()` |

**DoD**: [ ] 按钮显示 [ ] 抽屉打开 [ ] 布局下推

---

### Story 2.4: 登录后状态

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-2.4.1 | 前端 | 用户头像显示 | `expect(screen.getByAltText(/avatar/i)).toBeInTheDocument()` |
| FE-2.4.2 | 前端 | 用户名显示 | `expect(screen.getByText(/用户名/i)).toBeInTheDocument()` |
| FE-2.4.3 | 前端 | 退出按钮 | `expect(screen.getByRole('button', {name: /退出/i})).toBeInTheDocument()` |
| FE-2.4.4 | 前端 | 退出后状态恢复 | `expect(screen.getByRole('button', {name: /登录/i})).toBeInTheDocument()` |
| TEST-2.4.1 | 测试 | 登录状态E2E | `expect(await page.locator('[data-testid="user-avatar"]').isVisible()).toBe(true)` |

**DoD**: [ ] 头像显示 [ ] 用户名 [ ] 退出功能 [ ] 状态恢复

---

## Epic-3: 左侧抽屉

**目标**: 步骤列表、步骤切换、步骤状态

### Story 3.1: 步骤列表

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-3.1.1 | 前端 | 步骤列表渲染 | `expect(screen.getAllByTestId('step-item').length).toBe(4)` |
| FE-3.1.2 | 前端 | 步骤1-需求录入 | `expect(screen.getByText(/需求录入/i)).toBeInTheDocument()` |
| FE-3.1.3 | 前端 | 步骤2-上下文 | `expect(screen.getByText(/上下文/i)).toBeInTheDocument()` |
| FE-3.1.4 | 前端 | 步骤3-流程确认 | `expect(screen.getByText(/流程确认/i)).toBeInTheDocument()` |
| FE-3.1.5 | 前端 | 步骤4-项目创建 | `expect(screen.getByText(/项目创建/i)).toBeInTheDocument()` |
| TEST-3.1.1 | 测试 | 步骤数量测试 | `expect(screen.getAllByTestId('step-item')).toHaveLength(4)` |

**DoD**: [ ] 4个步骤 [ ] 标签正确 [ ] 图标显示

---

### Story 3.2: 步骤切换

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-3.2.1 | 前端 | 点击切换步骤 | `expect(screen.getAllByTestId('step-item')[1]).toHaveClass('cursor-pointer')` |
| FE-3.2.2 | 前端 | 状态同步更新 | `expect(useDesignStore.getState().currentStep).toBe(2)` |
| FE-3.2.3 | 前端 | 预览区刷新 | `expect(screen.getByTestId('preview-area')).toHaveAttribute('data-step', '2')` |
| FE-3.2.4 | 前端 | 不可切换未来步骤 | `expect(screen.getAllByTestId('step-item')[3]).toHaveClass('opacity-50')` |
| TEST-3.2.1 | 测试 | 步骤切换测试 | `expect(mockNavigate).toHaveBeenCalledWith(2)` |

**DoD**: [ ] 点击切换 [ ] 状态同步 [ ] 预览刷新 [ ] 前置锁定

---

### Story 3.3: 步骤状态

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-3.3.1 | 前端 | 默认状态样式 | `expect(step).toHaveClass('bg-gray-100')` |
| FE-3.3.2 | 前端 | 激活态样式 | `expect(activeStep).toHaveClass('bg-blue-100')` |
| FE-3.3.3 | 前端 | 完成态绿色勾选 | `expect(completedStep.querySelector('.check-icon')).toBeInTheDocument()` |
| FE-3.3.4 | 前端 | 序号显示 | `expect(screen.getByText('1')).toBeInTheDocument()` |
| TEST-3.3.1 | 测试 | 状态样式测试 | `expect(renderStep('active').className).toMatch(/blue-100/)` |

**DoD**: [ ] 默认灰 [ ] 激活蓝 [ ] 完成绿勾

---

## Epic-4: 预览区

**目标**: 空/加载/Mermaid/交互/导出/错误

### Story 4.1: 空状态

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-4.1.1 | 前端 | 空状态占位图 | `expect(screen.getByTestId('empty-placeholder')).toBeInTheDocument()` |
| FE-4.1.2 | 前端 | 空状态提示文字 | `expect(screen.getByText(/请输入需求/i)).toBeInTheDocument()` |
| FE-4.1.3 | 前端 | 空状态图标 | `expect(screen.getByAltText(/empty illustration/i)).toBeInTheDocument()` |
| TEST-4.1.1 | 测试 | 空状态渲染 | `expect(renderEmpty().className).toContain('empty-state')` |

**DoD**: [ ] 占位图 [ ] 提示文字 [ ] 图标

---

### Story 4.2: 加载状态

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-4.2.1 | 前端 | 骨架屏动画 | `expect(screen.getByTestId('skeleton-screen')).toBeInTheDocument()` |
| FE-4.2.2 | 前端 | 加载文案 | `expect(screen.getByText(/分析中/i)).toBeInTheDocument()` |
| FE-4.2.3 | 前端 | 进度指示器 | `expect(screen.getByRole('progressbar')).toBeInTheDocument()` |
| FE-4.2.4 | 前端 | 过渡平滑 | `expect(container).toHaveClass('animate-pulse')` |
| TEST-4.2.1 | 测试 | 骨架屏测试 | `expect(renderLoading().className).toContain('skeleton')` |

**DoD**: [ ] 骨架屏 [ ] 加载文案 [ ] 进度条 [ ] 动画

---

### Story 4.3: Mermaid渲染

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-4.3.1 | 前端 | Mermaid容器挂载 | `expect(document.querySelector('.mermaid'))).toBeInTheDocument()` |
| FE-4.3.2 | 前端 | SVG生成成功 | `expect(document.querySelector('.mermaid svg')).toBeInTheDocument()` |
| FE-4.3.3 | 前端 | 限界上下文图 | `expect(mermaidCode).toContain('graph TD')` |
| FE-4.3.4 | 前端 | 领域模型图 | `expect(mermaidCode).toContain('classDiagram')` |
| FE-4.3.5 | 前端 | 流程图渲染 | `expect(mermaidCode).toContain('flowchart')` |
| TEST-4.3.1 | 测试 | Mermaid渲染测试 | `expect(renderMermaid('graph TD; A-->B').querySelector('svg')).toBeInTheDocument()` |
| TEST-4.3.2 | 测试 | 渲染错误捕获 | `expect(console.error).not.toHaveBeenCalled()` |

**DoD**: [ ] 容器挂载 [ ] SVG生成 [ ] 4种图类型 [ ] 无console.error

---

### Story 4.4: 图表交互

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-4.4.1 | 前端 | 双指缩放 | `expect(container).toHaveClass('touch-pinch-zoom')` |
| FE-4.4.2 | 前端 | 拖动平移 | `expect(container).toHaveClass('cursor-grab')` |
| FE-4.4.3 | 前端 | 双击全屏 | `expect(screen.getByRole('dialog', {name: /全屏预览/i})).toBeInTheDocument()` |
| FE-4.4.4 | 前端 | 全屏关闭 | `expect(screen.getByRole('button', {name: /关闭/i})).toBeInTheDocument()` |
| TEST-4.4.1 | 测试 | 缩放测试 | `expect(fireEvent.dblclick(container)).toBe(true)` |

**DoD**: [ ] 缩放 [ ] 平移 [ ] 全屏

---

### Story 4.5: 图表导出

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-4.5.1 | 前端 | 右键菜单 | `expect(screen.getByText(/导出为PNG/i)).toBeInTheDocument()` |
| FE-4.5.2 | 前端 | PNG导出 | `expect(mockDownload).toHaveBeenCalledWith('diagram.png')` |
| FE-4.5.3 | 前端 | SVG导出 | `expect(mockDownload).toHaveBeenCalledWith('diagram.svg')` |
| FE-4.5.4 | 前端 | Mermaid源码复制 | `expect(mockClipboard).toHaveBeenCalled()` |
| TEST-4.5.1 | 测试 | 导出功能测试 | `expect(mockDownload).toHaveBeenCalled()` |

**DoD**: [ ] PNG [ ] SVG [ ] 源码复制

---

### Story 4.6: 错误处理

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-4.6.1 | 前端 | 错误提示 | `expect(screen.getByText(/渲染失败/i)).toBeInTheDocument()` |
| FE-4.6.2 | 前端 | 红色错误样式 | `expect(errorMsg).toHaveClass('text-red-500')` |
| FE-4.6.3 | 前端 | 重试按钮 | `expect(screen.getByRole('button', {name: /重试/i})).toBeInTheDocument()` |
| FE-4.6.4 | 前端 | 重试功能 | `expect(mockRetry).toHaveBeenCalled()` |
| TEST-4.6.1 | 测试 | 错误状态测试 | `expect(renderError().className).toContain('error')` |

**DoD**: [ ] 错误提示 [ ] 重试按钮 [ ] 功能正常

---

## Epic-5: 右侧抽屉

**目标**: 思考列表、新增动画、详情展开

### Story 5.1: 思考列表

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-5.1.1 | 前端 | 思考列表渲染 | `expect(screen.getByTestId('thinking-list')).toBeInTheDocument()` |
| FE-5.1.2 | 前端 | 最新项蓝色边框 | `expect(latestItem).toHaveClass('border-l-4 border-blue-500')` |
| FE-5.1.3 | 前端 | 列表滚动 | `expect(container).toHaveClass('overflow-y-auto')` |
| FE-5.1.4 | 前端 | 时间戳显示 | `expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument()` |
| TEST-5.1.1 | 测试 | 列表渲染测试 | `expect(screen.getAllByTestId('thinking-item')).toHaveLength(3)` |

**DoD**: [ ] 列表渲染 [ ] 最新项高亮 [ ] 可滚动

---

### Story 5.2: 新增动画

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-5.2.1 | 前端 | 呼吸动画 | `expect(newItem).toHaveClass('animate-pulse')` |
| FE-5.2.2 | 前端 | 动画持续3秒 | `expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000)` |
| FE-5.2.3 | 前端 | 动画结束后移除 | `expect(newItem.className).not.toContain('animate-pulse')` |
| TEST-5.2.1 | 测试 | 动画测试 | `expect(renderNewItem().className).toContain('animate-pulse')` |

**DoD**: [ ] pulse动画 [ ] 3秒后消失

---

### Story 5.3: 展开详情

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-5.3.1 | 前端 | 折叠态显示摘要 | `expect(screen.getByText(/^\w{50}/)).toBeInTheDocument()` |
| FE-5.3.2 | 前端 | 点击展开 | `expect(fireEvent.click(detailItem)).toBe(true)` |
| FE-5.3.3 | 前端 | 展开为多行 | `expect(expandedItem).toHaveClass('h-auto')` |
| FE-5.3.4 | 前端 | 收起功能 | `expect(fireEvent.click(expandedItem)).toBe(false)` |
| TEST-5.3.1 | 测试 | 展开测试 | `expect(renderDetail(true).className).toContain('expanded')` |

**DoD**: [ ] 摘要显示 [ ] 点击展开 [ ] 展开高度自适应

---

## Epic-6: 底部面板-录入

**目标**: 收起手柄、需求录入、发送、快捷功能

### Story 6.1: 收起手柄

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-6.1.1 | 前端 | 手柄显示 | `expect(screen.getByTestId('collapse-handle')).toBeInTheDocument()` |
| FE-6.1.2 | 前端 | 拖动调整高度 | `expect(fireEvent.mouseDown(handle)).toBe(true)` |
| FE-6.1.3 | 前端 | 双击完全收起 | `expect(fireEvent.dblclick(handle)).toBe(true)` |
| FE-6.1.4 | 前端 | 双击展开 | `expect(fireEvent.dblclick(handle)).toBe(false)` |
| TEST-6.1.1 | 测试 | 收起展开测试 | `expect(mockToggle).toHaveBeenCalled()` |

**DoD**: [ ] 手柄显示 [ ] 拖动调整 [ ] 双击切换

---

### Story 6.2: 需求录入

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-6.2.1 | 前端 | 多行文本输入 | `expect(screen.getByRole('textbox')).toBeInTheDocument()` |
| FE-6.2.2 | 前端 | 2-4行自动增高 | `expect(textarea.rows).toBeGreaterThanOrEqual(2)` |
| FE-6.2.3 | 前端 | placeholder提示 | `expect(textarea).toHaveAttribute('placeholder', /输入需求/i)` |
| FE-6.2.4 | 前端 | 字数统计 | `expect(screen.getByText(/\d+\/\d+/)).toBeInTheDocument()` |
| TEST-6.2.1 | 测试 | 输入测试 | `expect(fireEvent.change(textarea, {target: {value: 'test'}})).toBe(true)` |

**DoD**: [ ] 多行输入 [ ] 自动增高 [ ] 字数统计

---

### Story 6.3: 发送按钮

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-6.3.1 | 前端 | 发送按钮显示 | `expect(screen.getByRole('button', {name: /发送/i})).toBeInTheDocument()` |
| FE-6.3.2 | 前端 | 空内容禁用 | `expect(sendButton).toBeDisabled()` |
| FE-6.3.3 | 前端 | 有内容启用 | `expect(sendButton).not.toBeDisabled()` |
| FE-6.3.4 | 前端 | 发送中loading | `expect(sendButton).toHaveTextContent(/发送中/)` |
| FE-6.3.5 | 前端 | 发送成功后重置 | `expect(textarea).toHaveValue('')` |
| TEST-6.3.1 | 测试 | 发送测试 | `expect(fireEvent.click(sendButton)).toBe(true)` |

**DoD**: [ ] 空禁用 [ ] 有内容启用 [ ] loading状态 [ ] 重置

---

### Story 6.4: 保存草稿

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-6.4.1 | 前端 | 保存草稿按钮 | `expect(screen.getByRole('button', {name: /保存草稿/i})).toBeInTheDocument()` |
| FE-6.4.2 | 前端 | 自动保存 | `expect(mockAutoSave).toHaveBeenCalled()` |
| FE-6.4.3 | 前端 | 草稿恢复 | `expect(textarea).toHaveValue(savedContent)` |
| TEST-6.4.1 | 测试 | 草稿持久化测试 | `expect(localStorage.setItem).toHaveBeenCalledWith('draft', expect.any(String))` |

**DoD**: [ ] 手动保存 [ ] 自动保存 [ ] 恢复

---

### Story 6.5: 重新生成

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-6.5.1 | 前端 | 重新生成按钮 | `expect(screen.getByRole('button', {name: /重新生成/i})).toBeInTheDocument()` |
| FE-6.5.2 | 前端 | 保留输入内容 | `expect(textarea).toHaveValue(originalInput)` |
| FE-6.5.3 | 前端 | 清空当前结果 | `expect(screen.getByTestId('preview-area')).toHaveClass('empty')` |
| TEST-6.5.1 | 测试 | 重新生成测试 | `expect(mockRegenerate).toHaveBeenCalled()` |

**DoD**: [ ] 保留输入 [ ] 清空结果

---

### Story 6.6: 创建项目

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-6.6.1 | 前端 | 创建按钮显示 | `expect(screen.getByRole('button', {name: /创建项目/i})).toBeInTheDocument()` |
| FE-6.6.2 | 前端 | 需先生成数据 | `expect(createButton).toBeDisabled()` |
| FE-6.6.3 | 前端 | 生成后启用 | `expect(createButton).not.toBeDisabled()` |
| FE-6.6.4 | 前端 | 跳转项目页 | `expect(window.location.pathname).toBe('/projects/new')` |
| TEST-6.6.1 | 测试 | 创建项目E2E | `expect(await page.locator('button:has-text("创建项目")').click()).toBe(true)` |

**DoD**: [ ] 按钮显示 [ ] 前置条件 [ ] 跳转

---

## Epic-7: 底部面板-快捷功能

**目标**: AI询问、智能诊断、应用优化、历史记录

### Story 7.1: AI询问

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-7.1.1 | 前端 | AI询问按钮 | `expect(screen.getByRole('button', {name: /AI询问/i})).toBeInTheDocument()` |
| FE-7.1.2 | 前端 | 打开对话模式 | `expect(screen.getByRole('dialog')).toBeInTheDocument()` |
| FE-7.1.3 | 前端 | 快捷问题列表 | `expect(screen.getAllByTestId('quick-question').length).toBeGreaterThan(0)` |
| FE-7.1.4 | 前端 | 发送问题 | `expect(mockSendQuestion).toHaveBeenCalled()` |
| TEST-7.1.1 | 测试 | 对话测试 | `expect(renderDialog().className).toContain('dialog')` |

**DoD**: [ ] 按钮 [ ] 对话框 [ ] 快捷问题 [ ] 发送

---

### Story 7.2: 智能诊断

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-7.2.1 | 前端 | 诊断按钮 | `expect(screen.getByRole('button', {name: /智能诊断/i})).toBeInTheDocument()` |
| FE-7.2.2 | 前端 | 诊断进度 | `expect(screen.getByText(/诊断中/i)).toBeInTheDocument()` |
| FE-7.2.3 | 前端 | 诊断结果 | `expect(screen.getByText(/诊断完成/i)).toBeInTheDocument()` |
| FE-7.2.4 | 前端 | 问题列表 | `expect(screen.getAllByTestId('issue-item').length).toBeGreaterThan(0)` |
| TEST-7.2.1 | 测试 | 诊断功能测试 | `expect(mockDiagnose).toHaveBeenCalled()` |

**DoD**: [ ] 诊断按钮 [ ] 进度 [ ] 结果列表

---

### Story 7.3: 应用优化

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-7.3.1 | 前端 | 优化按钮 | `expect(screen.getByRole('button', {name: /应用优化/i})).toBeInTheDocument()` |
| FE-7.3.2 | 前端 | 优化建议列表 | `expect(screen.getAllByTestId('suggestion-item').length).toBeGreaterThan(0)` |
| FE-7.3.3 | 前端 | 一键应用 | `expect(mockApplySuggestion).toHaveBeenCalled()` |
| TEST-7.3.1 | 测试 | 优化测试 | `expect(renderSuggestions()).toHaveLength(3)` |

**DoD**: [ ] 按钮 [ ] 建议列表 [ ] 应用

---

### Story 7.4: 历史记录

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-7.4.1 | 前端 | 历史按钮 | `expect(screen.getByRole('button', {name: /历史记录/i})).toBeInTheDocument()` |
| FE-7.4.2 | 前端 | 历史列表 | `expect(screen.getAllByTestId('history-item').length).toBeGreaterThan(0)` |
| FE-7.4.3 | 前端 | 加载历史 | `expect(mockLoadHistory).toHaveBeenCalled()` |
| FE-7.4.4 | 前端 | 删除历史 | `expect(mockDeleteHistory).toHaveBeenCalled()` |
| TEST-7.4.1 | 测试 | 历史测试 | `expect(renderHistory()).toHaveLength(5)` |

**DoD**: [ ] 按钮 [ ] 列表 [ ] 加载 [ ] 删除

---

## Epic-8: AI展示区

**目标**: 三列卡片、卡片内容、展开、滚动

### Story 8.1: 三列卡片

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-8.1.1 | 前端 | 三列布局 | `expect(container.children.length).toBe(3)` |
| FE-8.1.2 | 前端 | 响应式两列 | `expect(onResize(1000)).toHaveClass('grid-cols-2')` |
| FE-8.1.3 | 前端 | 响应式单列 | `expect(onResize(600)).toHaveClass('grid-cols-1')` |
| TEST-8.1.1 | 测试 | 列数测试 | `expect(container.children).toHaveLength(3)` |

**DoD**: [ ] 三列 [ ] 1000px两列 [ ] 600px单列

---

### Story 8.2: 卡片内容

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-8.2.1 | 前端 | 卡片标题 | `expect(screen.getByTestId('card-title')).toBeInTheDocument()` |
| FE-8.2.2 | 前端 | 卡片内容 | `expect(screen.getByTestId('card-content')).toBeInTheDocument()` |
| FE-8.2.3 | 前端 | 卡片图标 | `expect(screen.getByAltText(/icon/i)).toBeInTheDocument()` |
| FE-8.2.4 | 前端 | 卡片标签 | `expect(screen.getAllByTestId('card-tag').length).toBeGreaterThan(0)` |
| TEST-8.2.1 | 测试 | 内容测试 | `expect(renderCard().textContent).toContain('标题')` |

**DoD**: [ ] 标题 [ ] 内容 [ ] 图标 [ ] 标签

---

### Story 8.3: 卡片展开

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-8.3.1 | 前端 | 点击展开卡片 | `expect(fireEvent.click(card)).toBe(true)` |
| FE-8.3.2 | 前端 | 展开为全宽 | `expect(expandedCard).toHaveClass('col-span-3')` |
| FE-8.3.3 | 前端 | 收起功能 | `expect(fireEvent.click(expandedCard)).toBe(false)` |
| TEST-8.3.1 | 测试 | 展开测试 | `expect(renderCard(true).className).toContain('col-span-3')` |

**DoD**: [ ] 点击展开 [ ] 全宽 [ ] 收起

---

### Story 8.4: 滚动支持

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-8.4.1 | 前端 | 卡片区域滚动 | `expect(container).toHaveClass('overflow-y-auto')` |
| FE-8.4.2 | 前端 | 滚动条样式 | `expect(container).toHaveClass('scrollbar-thin')` |
| FE-8.4.3 | 前端 | 滚动到底部加载 | `expect(mockLoadMore).toHaveBeenCalled()` |
| TEST-8.4.1 | 测试 |滚动测试 | `expect(fireEvent.scroll(container)).toBe(true)` |

**DoD**: [ ] 滚动 [ ] 样式 [ ] 加载更多

---

## Epic-9: 悬浮模式

**目标**: 悬浮触发、悬浮栏、悬浮收起

### Story 9.1: 悬浮触发

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-9.1.1 | 前端 | 滚动检测 | `expect(fireEvent.scroll(previewArea)).toBe(true)` |
| FE-9.1.2 | 前端 | 滚动超过200px触发 | `expect(mockTriggerFloat).toHaveBeenCalled()` |
| FE-9.1.3 | 前端 | 顶部提示条 | `expect(screen.getByTestId('float-hint')).toBeInTheDocument()` |
| TEST-9.1.1 | 测试 | 触发测试 | `expect(fireEvent.scroll(window, {target: {scrollY: 300}})).toBe(true)` |

**DoD**: [ ] 滚动检测 [ ] 阈值触发 [ ] 提示条

---

### Story 9.2: 悬浮栏

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-9.2.1 | 前端 | 缩小为60px栏 | `expect(floatingBar).toHaveClass('h-[60px]')` |
| FE-9.2.2 | 前端 | 简化录入框 | `expect(screen.getByTestId('mini-input')).toBeInTheDocument()` |
| FE-9.2.3 | 前端 | 收起按钮 | `expect(screen.getByRole('button', {name: /收起/i})).toBeInTheDocument()` |
| FE-9.2.4 | 前端 | 固定底部 | `expect(floatingBar).toHaveClass('fixed bottom-0')` |
| TEST-9.2.1 | 测试 | 悬浮栏测试 | `expect(renderFloatingBar().className).toContain('fixed')` |

**DoD**: [ ] 60px高度 [ ] 简化输入 [ ] 固定底部

---

### Story 9.3: 悬浮收起

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-9.3.1 | 前端 | 点击收起按钮 | `expect(fireEvent.click(collapseBtn)).toBe(true)` |
| FE-9.3.2 | 前端 | 底部面板展开 | `expect(bottomPanel).toHaveClass('h-auto')` |
| FE-9.3.3 | 前端 | 悬浮栏隐藏 | `expect(floatingBar).not.toBeInTheDocument()` |
| TEST-9.3.1 | 测试 | 收起测试 | `expect(mockCollapse).toHaveBeenCalled()` |

**DoD**: [ ] 收起按钮 [ ] 面板展开 [ ] 悬浮栏隐藏

---

## Epic-10: 状态管理

**目标**: 状态持久化、状态快照、SSE连接、错误重连

### Story 10.1: 状态持久化

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-10.1.1 | 前端 | localStorage保存 | `expect(localStorage.setItem).toHaveBeenCalledWith('homepage-state', expect.any(String))` |
| FE-10.1.2 | 前端 | 刷新页面恢复 | `expect(screen.getByTestId('preview-area')).toHaveAttribute('data-loaded', 'true')` |
| FE-10.1.3 | 前端 | 状态序列化 | `expect(JSON.parse(localStorage.getItem('homepage-state'))).toBeObject()` |
| TEST-10.1.1 | 测试 | 持久化测试 | `expect(store.getState()).toEqual(savedState)` |

**DoD**: [ ] 保存 [ ] 恢复 [ ] 序列化

---

### Story 10.2: 状态快照

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-10.2.1 | 前端 | 切换前保存快照 | `expect(mockSaveSnapshot).toHaveBeenCalled()` |
| FE-10.2.2 | 前端 | 支持回退 | `expect(mockRestoreSnapshot).toHaveBeenCalled()` |
| FE-10.2.3 | 前端 | 快照列表 | `expect(screen.getAllByTestId('snapshot-item').length).toBeGreaterThan(0)` |
| TEST-10.2.1 | 测试 | 快照测试 | `expect(store.getState().snapshots).toHaveLength(3)` |

**DoD**: [ ] 自动保存 [ ] 回退 [ ] 快照列表

---

### Story 10.3: SSE连接

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-10.3.1 | 前端 | 建立连接 | `expect(mockEventSource).toHaveBeenCalledWith('/api/v1/analyze/stream')` |
| FE-10.3.2 | 前端 | 接收数据 | `expect(mockOnMessage).toHaveBeenCalled()` |
| FE-10.3.3 | 前端 | 连接状态显示 | `expect(screen.getByTestId('sse-status')).toHaveClass('connected')` |
| TEST-10.3.1 | 测试 | SSE测试 | `expect(mockAddEventListener).toHaveBeenCalledWith('message')` |

**DoD**: [ ] 连接 [ ] 接收 [ ] 状态显示

---

### Story 10.4: 错误重连

| Task | 类型 | 描述 | 验收标准 |
|------|------|------|----------|
| FE-10.4.1 | 前端 | 断开检测 | `expect(mockOnError).toHaveBeenCalled()` |
| FE-10.4.2 | 前端 | 自动重连 | `expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000)` |
| FE-10.4.3 | 前端 | 3次重试 | `expect(retryCount).toBe(3)` |
| FE-10.4.4 | 前端 | 重试失败提示 | `expect(screen.getByText(/连接失败/i)).toBeInTheDocument()` |
| TEST-10.4.1 | 测试 | 重连测试 | `expect(mockReconnect).toHaveBeenCalledTimes(3)` |

**DoD**: [ ] 断开检测 [ ] 自动重连 [ ] 3次重试 [ ] 失败提示

---

## 优先级矩阵

| 优先级 | Epic | Story数 | Task数 | 预计工时 |
|--------|------|---------|--------|----------|
| P0 | Epic 1-6 | 24 | 72 | 40h |
| P1 | Epic 7-8 | 8 | 24 | 16h |
| P2 | Epic 9-10 | 7 | 21 | 12h |
| **合计** | **10** | **42** | **138** | **68h** |

---

## 实施计划

| 阶段 | Epic | 预计工时 | 交付 |
|------|------|----------|------|
| Phase 1 | Epic 1 (布局) + Epic 2 (Header) | 12h | 静态页面 |
| Phase 2 | Epic 3 (左侧抽屉) + Epic 4 (预览区) | 16h | 核心功能 |
| Phase 3 | Epic 5 (右侧抽屉) + Epic 6 (底部面板) | 16h | 完整录入 |
| Phase 4 | Epic 7 (快捷功能) + Epic 8 (AI展示) | 12h | 增强功能 |
| Phase 5 | Epic 9 (悬浮) + Epic 10 (状态) | 12h | 收尾优化 |

---

*PRD 产出物 - PM Agent | vibex-homepage-redesign*
