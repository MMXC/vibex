# PRD: DDD 分析 AI 思考过程可视化

**项目**: vibex-ddd-ai-stream  
**版本**: v1.0  
**日期**: 2026-03-13  
**作者**: Analyst Agent  

---

## 1. 执行摘要

将 DDD 分析过程从"黑盒"转变为"透明"，通过 SSE 流式响应在右侧对话框实时展示 AI 分析思路，提升用户信任度 30%，改善等待体验 50%。

---

## 2. 问题陈述

### 2.1 核心痛点

| ID | 痛点 | 影响 | 频率 |
|----|------|------|------|
| P1 | 用户无法确认 AI 是否真正被调用 | 🔴 高 | 每次分析 |
| P2 | 5-30 秒等待无任何进度反馈 | 🔴 高 | 每次分析 |
| P3 | AI 失败时返回默认值"主业务域"，用户误以为是分析结果 | 🔴 高 | AI 失败时 |
| P4 | 无法看到 AI 的分析思路 | 🟡 中 | 每次分析 |

### 2.2 用户画像

**主要用户**: 开发者/产品经理，使用 VibeX 进行 DDD 需求分析

- 技术背景: 熟悉软件开发
- 期望: 快速获得可靠的领域分析结果
- 痛点: 不确定 AI 分析是否准确，无法追踪分析过程

---

## 3. 功能需求

### F1: SSE 流式 API

#### F1.1 思考事件推送

**描述**: 后端在分析过程中推送思考步骤事件

**验收标准**:
```
AC1.1.1: 调用 POST /api/ddd/bounded-context/stream 后，500ms 内收到首个事件
AC1.1.2: 事件格式为 `event: thinking\ndata: {"step": "analyzing", "message": "..."}\n\n`
AC1.1.3: 包含至少 3 个思考步骤: analyzing, identifying-core, calling-ai
AC1.1.4: message 字段为中文，长度 <= 100 字符
```

**可测试断言**:
```typescript
expect(firstEvent.type).toBe('thinking')
expect(firstEvent.data).toHaveProperty('step')
expect(firstEvent.data).toHaveProperty('message')
expect(Date.now() - startTime).toBeLessThan(500)
```

#### F1.2 上下文增量推送

**描述**: 分析结果逐个推送，而非一次性返回

**验收标准**:
```
AC1.2.1: 每个上下文单独推送一个 context 事件
AC1.2.2: 相邻 context 事件间隔 >= 100ms（动画效果）
AC1.2.3: context 事件包含完整上下文对象: name, type, description
AC1.2.4: type 字段值为 "core" | "supporting" | "generic"
```

**可测试断言**:
```typescript
expect(contextEvents.length).toBeGreaterThan(0)
expect(contextEvents[0].data).toHaveProperty('name')
expect(['core', 'supporting', 'generic']).toContain(contextEvents[0].data.type)
```

#### F1.3 完成事件

**描述**: 分析完成后推送 done 事件，包含完整结果

**验收标准**:
```
AC1.3.1: done 事件包含完整的 boundedContexts 数组
AC1.3.2: done 事件包含 mermaidCode 字段
AC1.3.3: done 事件后连接自动关闭
AC1.3.4: boundedContexts 数组长度 >= 1
```

**可测试断言**:
```typescript
expect(doneEvent.type).toBe('done')
expect(doneEvent.data.boundedContexts.length).toBeGreaterThanOrEqual(1)
expect(doneEvent.data.mermaidCode).toMatch(/graph TD/)
```

#### F1.4 错误事件

**描述**: 分析失败时推送 error 事件

**验收标准**:
```
AC1.4.1: AI 调用失败时推送 error 事件
AC1.4.2: error 事件包含 message 字段说明错误原因
AC1.4.3: error 事件后连接自动关闭
AC1.4.4: HTTP 状态码为 200（SSE 规范）
```

**可测试断言**:
```typescript
expect(errorEvent.type).toBe('error')
expect(errorEvent.data).toHaveProperty('message')
```

#### F1.5 向后兼容

**描述**: 保留原有 API，新增流式 API

**验收标准**:
```
AC1.5.1: 原 POST /api/ddd/bounded-context 保持不变
AC1.5.2: 新增 POST /api/ddd/bounded-context/stream
AC1.5.3: 两个 API 返回数据结构一致
```

**可测试断言**:
```typescript
// 原 API 仍可用
const legacyResult = await fetch('/api/ddd/bounded-context', { method: 'POST', body: JSON.stringify({ requirementText }) })
expect(legacyResult.status).toBe(200)

// 新 API 可用
const streamResult = await fetch('/api/ddd/bounded-context/stream', { method: 'POST', body: JSON.stringify({ requirementText }) })
expect(streamResult.headers.get('Content-Type')).toBe('text/event-stream')
```

---

### F2: 前端流式接收

#### F2.1 useDDDStream Hook

**描述**: React Hook 封装 SSE 连接和状态管理

**验收标准**:
```
AC2.1.1: 返回 { thinkingMessages, contexts, status, generateContexts, abort }
AC2.1.2: thinkingMessages 为字符串数组，实时更新
AC2.1.3: contexts 为 BoundedContext 数组，增量更新
AC2.1.4: status 为 'idle' | 'thinking' | 'done' | 'error'
AC2.1.5: generateContexts(requirementText) 启动分析
AC2.1.6: abort() 可中断请求
```

**可测试断言**:
```typescript
const { thinkingMessages, contexts, status, generateContexts, abort } = useDDDStream()
expect(status).toBe('idle')
await act(() => generateContexts('用户可以下单购买商品'))
expect(status).toBe('thinking')
abort()
expect(status).toBe('idle')
```

#### F2.2 自动重连

**描述**: 连接断开时自动重连

**验收标准**:
```
AC2.2.1: 连接断开时自动重连，最多 3 次
AC2.2.2: 重连间隔 1s, 2s, 4s（指数退避）
AC2.2.3: 重连失败后 status 设为 'error'
AC2.2.4: 重连成功后继续接收数据
```

**可测试断言**:
```typescript
// 模拟断开
mockDisconnect()
await waitFor(() => expect(reconnectAttempts).toBe(1))
await waitFor(() => expect(status).toBe('thinking')) // 重连成功
```

#### F2.3 请求取消

**描述**: 支持用户主动取消请求

**验收标准**:
```
AC2.3.1: 调用 abort() 后立即停止接收数据
AC2.3.2: abort() 后 status 设为 'idle'
AC2.3.3: abort() 后 thinkingMessages 和 contexts 清空
AC2.3.4: 底层 SSE 连接被正确关闭
```

**可测试断言**:
```typescript
await act(() => generateContexts('test'))
abort()
expect(status).toBe('idle')
expect(thinkingMessages).toHaveLength(0)
expect(contexts).toHaveLength(0)
```

---

### F3: 思考过程 UI

#### F3.1 思考步骤列表

**描述**: 显示 AI 思考步骤的列表

**验收标准**:
```
AC3.1.1: 每个步骤显示状态图标: ✓ 完成, ● 进行中, ○ 等待
AC3.1.2: 当前进行中的步骤有动画效果
AC3.1.3: 步骤按时间顺序从上到下排列
AC3.1.4: 最多显示 10 条历史步骤，超出时滚动
```

**可测试断言**:
```typescript
// 测试组件渲染
render(<ThinkingSteps steps={mockSteps} currentStep={1} />)
expect(screen.getByText(/分析需求/)).toBeInTheDocument()
expect(screen.getByRole('status')).toHaveClass('animate-pulse') // 进行中动画
```

#### F3.2 思考内容展开/收起

**描述**: 支持展开查看完整思考内容

**验收标准**:
```
AC3.2.1: 默认收起，显示步骤摘要（前 50 字符）
AC3.2.2: 点击步骤可展开查看完整内容
AC3.2.3: 再次点击收起
AC3.2.4: 同时只能展开一个步骤
```

**可测试断言**:
```typescript
render(<ThinkingSteps steps={mockSteps} />)
fireEvent.click(screen.getByText(/分析需求/))
expect(screen.getByText(mockSteps[0].fullContent)).toBeVisible()
fireEvent.click(screen.getByText(/分析需求/))
expect(screen.queryByText(mockSteps[0].fullContent)).not.toBeInTheDocument()
```

#### F3.3 进度指示器

**描述**: 显示整体分析进度

**验收标准**:
```
AC3.3.1: 显示当前步骤/总步骤数（如 2/5）
AC3.3.2: 进度条显示百分比
AC3.3.3: 完成时进度条变绿
AC3.3.4: 错误时进度条变红
```

**可测试断言**:
```typescript
render(<ThinkingSteps steps={mockSteps} currentStep={2} totalSteps={5} status="thinking" />)
expect(screen.getByText('2/5')).toBeInTheDocument()
expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
```

---

### F4: 上下文结果展示

#### F4.1 上下文卡片

**描述**: 增量显示识别的限界上下文

**验收标准**:
```
AC4.1.1: 每个上下文显示为独立卡片
AC4.1.2: 卡片包含: 名称、类型标签、描述
AC4.1.3: 类型标签颜色区分: 核心(红)、支撑(蓝)、通用(灰)
AC4.1.4: 新卡片出现时有入场动画
AC4.1.5: 卡片可点击展开查看详情
```

**可测试断言**:
```typescript
render(<ContextCard context={{ name: '订单管理', type: 'core', description: '...' }} />)
expect(screen.getByText('订单管理')).toBeInTheDocument()
expect(screen.getByText('核心域')).toHaveClass('bg-red-100')
```

#### F4.2 卡片入场动画

**描述**: 新上下文出现时的动画效果

**验收标准**:
```
AC4.2.1: 卡片从透明渐变到不透明
AC4.2.2: 动画持续 300ms
AC4.2.3: 多个卡片依次出现，间隔 100ms
AC4.2.4: 动画不阻塞用户交互
```

**可测试断言**:
```typescript
// 测试动画类
const { container } = render(<ContextList contexts={mockContexts} />)
expect(container.querySelector('.animate-fade-in')).toBeInTheDocument()
```

---

### F5: 错误处理

#### F5.1 错误状态显示

**描述**: 分析失败时的错误提示

**验收标准**:
```
AC5.1.1: status 为 'error' 时显示错误面板
AC5.1.2: 显示错误消息
AC5.1.3: 提供"重试"按钮
AC5.1.4: 提供"使用默认值"按钮
```

**可测试断言**:
```typescript
render(<DDDStreamPanel status="error" errorMessage="AI 服务不可用" />)
expect(screen.getByText(/AI 服务不可用/)).toBeInTheDocument()
expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument()
expect(screen.getByRole('button', { name: /使用默认值/ })).toBeInTheDocument()
```

#### F5.2 超时处理

**描述**: 请求超时的处理

**验收标准**:
```
AC5.2.1: 默认超时时间 60 秒
AC5.2.2: 超时后 status 设为 'error'
AC5.2.3: 显示"分析超时，请重试"
AC5.2.4: 提供"重试"按钮
```

**可测试断言**:
```typescript
// 测试超时
jest.useFakeTimers()
await act(() => generateContexts('test'))
jest.advanceTimersByTime(60000)
await waitFor(() => expect(status).toBe('error'))
expect(screen.getByText(/超时/)).toBeInTheDocument()
```

---

### F6: 面板交互

#### F6.1 面板展开/收起

**描述**: 支持折叠右侧面板

**验收标准**:
```
AC6.1.1: 点击面板标题可切换展开/收起
AC6.1.2: 收起状态显示最小化指示器
AC6.1.3: 展开动画流畅（300ms）
AC6.1.4: 状态持久化到 localStorage
```

**可测试断言**:
```typescript
render(<DDDStreamPanel />)
fireEvent.click(screen.getByText(/AI 思考过程/))
expect(screen.getByTestId('panel-content')).not.toBeVisible()
expect(localStorage.getItem('ddd-panel-collapsed')).toBe('true')
```

#### F6.2 响应式布局

**描述**: 适配移动端

**验收标准**:
```
AC6.2.1: 桌面端: 右侧固定面板，宽度 320px
AC6.2.2: 平板端: 底部抽屉，高度 40vh
AC6.2.3: 移动端: 全屏模态框
AC6.2.4: 断点: md (768px), lg (1024px)
```

**可测试断言**:
```typescript
// 测试响应式类
render(<DDDStreamPanel />)
const panel = screen.getByTestId('ddd-stream-panel')
expect(panel).toHaveClass('lg:w-80') // 桌面端
expect(panel).toHaveClass('md:h-[40vh]') // 平板端
```

---

## 4. 用户故事

### US1: 查看分析进度

**作为** 开发者  
**我想要** 实时看到 AI 的分析过程  
**以便于** 确认 AI 正在工作，了解分析思路  

**验收标准**:
```
Given 我在需求页面输入了需求描述
When 我点击"开始分析"
Then 我看到"正在分析需求..."出现在右侧面板
And 我看到进度指示器显示当前步骤
And 我可以展开查看详细的思考内容
```

### US2: 理解分析结果

**作为** 产品经理  
**我想要** 看到 AI 是如何得出分析结果的  
**以便于** 判断结果是否合理，决定是否采纳  

**验收标准**:
```
Given AI 正在分析我的需求
When AI 识别出一个限界上下文
Then 我看到一个新卡片出现在右侧面板
And 卡片上标注了类型（核心域/支撑域/通用域）
And 我可以点击卡片查看详细说明
```

### US3: 处理分析错误

**作为** 开发者  
**我想要** 在分析失败时知道原因  
**以便于** 调整需求描述或重试  

**验收标准**:
```
Given AI 分析过程中发生错误
When 我看到错误提示
Then 我能理解错误原因（超时/服务不可用/需求不清晰）
And 我可以点击"重试"重新分析
And 我可以选择"使用默认值"跳过 AI 分析
```

### US4: 中断分析

**作为** 开发者  
**我想要** 随时中断正在进行的分析  
**以便于** 调整需求描述后重新开始  

**验收标准**:
```
Given AI 正在分析我的需求
When 我点击"暂停"按钮
Then 分析立即停止
And 面板恢复到初始状态
And 我可以修改需求描述
And 我可以重新开始分析
```

---

## 5. 优先级矩阵

### 5.1 功能优先级

| 功能 | 价值 | 工作量 | 优先级 | 迭代 |
|------|------|--------|--------|------|
| F1.1 思考事件推送 | 高 | 0.5天 | P0 | M1 |
| F1.2 上下文增量推送 | 高 | 0.5天 | P0 | M1 |
| F1.3 完成事件 | 高 | 0.25天 | P0 | M1 |
| F1.4 错误事件 | 高 | 0.25天 | P0 | M1 |
| F1.5 向后兼容 | 中 | 0.25天 | P1 | M1 |
| F2.1 useDDDStream Hook | 高 | 0.5天 | P0 | M1 |
| F2.2 自动重连 | 中 | 0.25天 | P2 | M2 |
| F2.3 请求取消 | 高 | 0.25天 | P0 | M1 |
| F3.1 思考步骤列表 | 高 | 0.5天 | P0 | M1 |
| F3.2 思考内容展开 | 低 | 0.25天 | P3 | M2 |
| F3.3 进度指示器 | 中 | 0.25天 | P1 | M1 |
| F4.1 上下文卡片 | 高 | 0.5天 | P0 | M1 |
| F4.2 卡片入场动画 | 低 | 0.25天 | P3 | M2 |
| F5.1 错误状态显示 | 高 | 0.25天 | P0 | M1 |
| F5.2 超时处理 | 高 | 0.25天 | P0 | M1 |
| F6.1 面板展开/收起 | 中 | 0.25天 | P2 | M2 |
| F6.2 响应式布局 | 中 | 0.5天 | P2 | M2 |

### 5.2 迭代规划

```
M1 (核心功能) - 2.5 天
├── F1.1 思考事件推送
├── F1.2 上下文增量推送
├── F1.3 完成事件
├── F1.4 错误事件
├── F2.1 useDDDStream Hook
├── F2.3 请求取消
├── F3.1 思考步骤列表
├── F3.3 进度指示器
├── F4.1 上下文卡片
├── F5.1 错误状态显示
└── F5.2 超时处理

M2 (体验优化) - 1.5 天
├── F1.5 向后兼容
├── F2.2 自动重连
├── F3.2 思考内容展开
├── F4.2 卡片入场动画
├── F6.1 面板展开/收起
└── F6.2 响应式布局
```

---

## 6. 技术约束

### 6.1 技术栈约束

| 约束 | 说明 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 后端 | Hono (Cloudflare Workers) |
| 状态管理 | Zustand (已有) |
| UI 组件 | Shadcn/ui (已有) |
| 动画 | Tailwind CSS + Framer Motion (可选) |
| 类型 | TypeScript strict mode |

### 6.2 API 设计约束

```typescript
// 请求
POST /api/ddd/bounded-context/stream
Content-Type: application/json
Body: { requirementText: string }

// 响应
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

// 事件类型
type ThinkingEvent = {
  type: 'thinking'
  data: { step: string; message: string }
}

type ContextEvent = {
  type: 'context'
  data: BoundedContext
}

type DoneEvent = {
  type: 'done'
  data: { boundedContexts: BoundedContext[]; mermaidCode: string }
}

type ErrorEvent = {
  type: 'error'
  data: { message: string; code?: string }
}
```

### 6.3 兼容性约束

| 约束 | 说明 |
|------|------|
| 浏览器 | Chrome 90+, Firefox 88+, Safari 14+ |
| 移动端 | iOS 14+, Android 10+ |
| 网络代理 | 支持 SSE 穿透 |
| 降级策略 | 不支持 SSE 时回退到原 API |

### 6.4 性能约束

| 指标 | 目标 | 测试方法 |
|------|------|----------|
| 首字节响应 | < 500ms | `expect(ttfb).toBeLessThan(500)` |
| 思考事件间隔 | 100-500ms | `expect(interval).toBeWithin(100, 500)` |
| 上下文推送间隔 | >= 100ms | `expect(interval).toBeGreaterThanOrEqual(100)` |
| 总响应时间 | 与原 API 相同 ±10% | `expect(totalTime).toBeWithin(legacyTime * 0.9, legacyTime * 1.1)` |

---

## 7. 边界条件

### 7.1 输入边界

| 字段 | 最小值 | 最大值 | 边界处理 |
|------|--------|--------|----------|
| requirementText | 10 字符 | 10000 字符 | 过短提示，过长截断 |

### 7.2 输出边界

| 场景 | 处理 |
|------|------|
| AI 返回空结果 | 推送 error 事件，提示"无法分析，请补充需求描述" |
| AI 返回超时 | 60 秒后推送 error 事件，提示超时 |
| AI 服务不可用 | 立即推送 error 事件，提示服务不可用 |
| 网络断开 | 前端检测连接断开，显示重连按钮 |

### 7.3 并发边界

| 场景 | 处理 |
|------|------|
| 同一用户同时发起多个分析 | 后发请求中断前一个请求 |
| SSE 连接数超限 | 返回 429，提示稍后重试 |

---

## 8. 测试策略

### 8.1 单元测试

| 模块 | 测试重点 | 覆盖率目标 |
|------|----------|-----------|
| useDDDStream Hook | 状态转换、事件处理、取消重连 | 90% |
| ThinkingSteps 组件 | 渲染、动画、交互 | 85% |
| ContextCard 组件 | 渲染、动画 | 80% |
| SSE 解析工具 | 边界条件 | 95% |

### 8.2 集成测试

```typescript
describe('DDD Stream API', () => {
  it('should emit thinking events before done', async () => {
    const events = await collectEvents('/api/ddd/bounded-context/stream', { requirementText: '...' })
    const thinkingEvents = events.filter(e => e.type === 'thinking')
    const doneEvent = events.find(e => e.type === 'done')
    
    expect(thinkingEvents.length).toBeGreaterThan(0)
    expect(doneEvent).toBeDefined()
    expect(events.indexOf(doneEvent)).toBeGreaterThan(events.indexOf(thinkingEvents[0]))
  })
  
  it('should emit context events incrementally', async () => {
    const events = await collectEvents('/api/ddd/bounded-context/stream', { requirementText: '...' })
    const contextEvents = events.filter(e => e.type === 'context')
    
    expect(contextEvents.length).toBeGreaterThan(0)
    // 验证间隔
    for (let i = 1; i < contextEvents.length; i++) {
      const interval = contextEvents[i].timestamp - contextEvents[i-1].timestamp
      expect(interval).toBeGreaterThanOrEqual(100)
    }
  })
})
```

### 8.3 E2E 测试

```typescript
test('用户可以看到 AI 思考过程', async ({ page }) => {
  await page.goto('/projects/new')
  await page.fill('[data-testid="requirement-input"]', '用户可以下单购买商品')
  await page.click('[data-testid="start-analysis"]')
  
  // 验证思考步骤出现
  await expect(page.locator('[data-testid="thinking-step"]')).toBeVisible()
  
  // 验证上下文卡片增量出现
  const cards = page.locator('[data-testid="context-card"]')
  await expect(cards.first()).toBeVisible({ timeout: 5000 })
  
  // 验证完成状态
  await expect(page.locator('[data-testid="status-done"]')).toBeVisible({ timeout: 30000 })
})
```

---

## 9. 发布计划

### 9.1 阶段发布

| 阶段 | 内容 | 灰度比例 | 观察期 |
|------|------|----------|--------|
| Alpha | M1 功能，仅限开发测试 | 0% | 1 天 |
| Beta | M1 + M2 功能，内部用户 | 10% | 2 天 |
| GA | 全量发布 | 100% | - |

### 9.2 回滚方案

```bash
# 回滚到原 API
# 前端切换到 /api/ddd/bounded-context（非 stream）
# 1 分钟内完成回滚
```

---

## 10. 成功指标

| 指标 | 当前值 | 目标值 | 测量方法 |
|------|--------|--------|----------|
| 用户信任度 | 60% | 90% | 用户调研 |
| 等待体验评分 | 3.2/5 | 4.5/5 | 用户反馈 |
| AI 调用确认率 | 30% | 95% | 事件追踪 |
| 分析完成率 | 85% | 95% | 事件追踪 |
| 平均等待感知时间 | 30s | 15s | 用户反馈 |

---

## 11. 附录

### A. 数据结构

```typescript
// 限界上下文
interface BoundedContext {
  name: string
  type: 'core' | 'supporting' | 'generic'
  description: string
  capabilities?: string[]
  entities?: string[]
}

// 思考步骤
interface ThinkingStep {
  id: string
  step: string
  message: string
  fullContent?: string
  status: 'pending' | 'in-progress' | 'done' | 'error'
  timestamp: number
}

// SSE 事件
type DDDStreamEvent = ThinkingEvent | ContextEvent | DoneEvent | ErrorEvent
```

### B. 参考

- [Server-Sent Events 规范](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [ChatGPT 思考过程设计](https://openai.com/chatgpt)
- [Claude 思考过程设计](https://anthropic.com/claude)

---

**产出物路径**: `docs/output/ddd-ai-stream-prd.md`