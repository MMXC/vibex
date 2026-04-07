# AGENTS.md - 开发约束与任务清单

**项目**: homepage-v4-fix  
**状态**: 进行中  
**创建日期**: 2026-03-21

---

## 🔴 红线约束（不可违反）

| ID | 约束 | 原因 |
|----|------|------|
| **R-1** | 不得破坏现有 6 步流程 (`需求输入 → 限界上下文 → 领域模型 → 需求澄清 → 业务流程 → UI 生成`) | 核心业务逻辑 |
| **R-2** | 不得删除现有 `homepage.module.css` 直到新布局验证通过 | 回滚保护 |
| **R-3** | 不得修改 `useHomePage` hook 中的 `thinkingMessages` 聚合逻辑（除适配器层外） | 状态管理稳定性 |
| **R-4** | 不得修改 `Sidebar` 组件的 `step` 数据结构 | 下游依赖 |
| **R-5** | 不得硬编码 `thinkingMessages` 数据 | 数据必须来自 SSE 流 |
| **R-6** | 浅色主题变量仅在 `homepage-v4.module.css` 中定义，不得修改 `globals.css` | 隔离影响范围 |
| **R-7** | BottomPanel 高度固定 380px，不得使用动态高度 | 设计稿规格 |
| **R-8** | 三栏宽度必须精确：左侧 220px，中央 1fr，右侧 260px | 布局一致性 |
| **R-9** | 不得删除或修改现有测试文件 | 回归保护 |
| **R-10** | 不得在 `PreviewArea` 中引入新的状态管理 | 单一数据源原则 |

---

## 🖥️ Dev 任务清单

### Epic 1: 右侧AI思考列表集成 (P0)

#### ST-1.1: AIPanel 组件适配
**文件**: `src/components/homepage/HomePage.tsx`  
**改动**:
- 移除 `<aside className={styles.aiPanel}><InputArea ... /></aside>`
- 替换为 `<AIPanel isOpen={true} messages={adaptedMessages} onSendMessage={...} />`
- 添加适配器函数：`thinkingMessages: ThinkingStep[]` → `messages: AIMessage[]`

**验收标准**:
```typescript
// 编译通过，无 TS 错误
// AIPanel 正确渲染在右侧 260px 区域
// 无 layout shift
```

#### ST-1.2: thinkingMessages 数据渲染
**文件**: `src/components/homepage/HomePage.tsx` (适配器逻辑)  
**改动**: 创建 `useMemo` 适配器：

```typescript
const adaptedMessages = useMemo(() => {
  return thinkingMessages.map((step, i) => ({
    id: `thinking-${step.step}-${i}`,
    role: 'assistant' as const,
    content: step.message,
  }));
}, [thinkingMessages]);
```

**验收标准**:
```typescript
// AIPanel 中渲染的列表项数量 === thinkingMessages.length
// 每项有蓝色左边框 (border-left: 3px solid #3b82f6)
// 文本内容与 step.message 一致
```

#### ST-1.3: 新项目脉冲动画
**文件**: `src/components/homepage/AIPanel/AIPanel.module.css`  
**改动**: 在 `.message.assistant` 或 `.thinking-item` 添加：

```css
.thinking-item.new {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

**验收标准**:
```typescript
// 新增的 thinking item 有 .new class 时有脉冲动画
// 非新 item 无动画
```

---

### Epic 2: 底部面板组件 (P0)

#### ST-2.1: BottomPanel 目录结构
**目录**: `src/components/homepage/BottomPanel/`  
**创建文件**:
- `BottomPanel.tsx` — 主容器
- `BottomPanel.module.css` — 布局样式（Grid 子项）
- `CollapseHandle.tsx` — 收起手柄
- `ActionBar.tsx` — 操作按钮栏
- `AIDisplay.tsx` — AI展示卡片

#### ST-2.2: 底部面板布局结构
**文件**: `BottomPanel.tsx` + `BottomPanel.module.css`  
**规格**:
- 高度: `380px` 固定
- 内部 flex-column 布局
- `grid-column: 1 / -1; grid-row: 3;` (父级 Grid 定位)

#### ST-2.3: CollapseHandle (30px)
**规格**:
- 高度: `30px`
- 背景: `#f3f4f6`
- 居中文字 `⬆️ 拖动收起`
- 悬停: `background: #dbeafe; color: #3b82f6`

#### ST-2.4: InputArea (80px)
**规格**:
- 高度: `80px`
- 背景: `#ffffff`
- 上边框: `1px solid #e5e7eb`
- 包含: `input-field (flex:1)` + `btn-send (60px)`

#### ST-2.5: ActionBar (50px)
**规格**:
- 高度: `50px`
- 背景: `#ffffff`
- 按钮列表: 💬 AI询问 | 🔍 诊断 | ✨ 优化 | 📜 历史 | (分割线) | 💾 保存 | 🔄 重新生成 | (分割线) | 📁 创建项目(primary)
- 分隔线: `width: 1px; height: 24px; background: #e5e7eb;`

#### ST-2.6: AIDisplay (flex 3列卡片)
**规格**:
- `display: grid; grid-template-columns: repeat(3, 1fr);`
- `gap: 12px; padding: 12px 15px;`
- 三张卡片: 🔍 智能诊断 | ✨ 应用优化 | 💬 AI对话澄清

**验收标准**: 所有子组件在 1200px+ 宽度下正确显示

---

### Epic 3: 布局与主题调整 (P1)

#### ST-3.1: Grid 布局实现
**文件**: `src/app/homepage-v4.module.css` (新建)  
**核心 CSS**:

```css
.page {
  display: grid;
  grid-template-rows: 50px 1fr 380px;
  grid-template-columns: 220px 1fr 260px;
  min-height: 100vh;
}
.header { grid-column: 1 / -1; }
.leftDrawer { grid-column: 1; grid-row: 2; }
.preview { grid-column: 2; grid-row: 2; }
.rightDrawer { grid-column: 3; grid-row: 2; }
.bottomPanel { grid-column: 1 / -1; grid-row: 3; }
```

#### ST-3.2: 浅色主题变量
**文件**: `src/app/homepage-v4.module.css`  
**CSS Variables** (按设计稿):

```css
.page {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-muted: #dbeafe;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-tertiary: #f3f4f6;
  --color-border: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  background: var(--color-bg-secondary);
}
```

#### ST-3.3: HomePage 布局迁移
**文件**: `src/components/homepage/HomePage.tsx`  
**改动**:
- 导入 `styles from '@/app/homepage-v4.module.css'`
- 将 `className={styles.container}` 替换为 `className={styles.page}`
- 调整子元素 className 对应新 CSS

---

### Epic 4: 视觉一致性验证 (P1)

#### ST-4.1: 三栏宽度验证
**验收**: 左侧 220px，右侧 260px，中央自适应  
**测试断言**: `expect(leftDrawer).toHaveStyle({ width: '220px' })`

#### ST-4.2: 左侧抽屉背景色
**验收**: 背景 `#f9fafb`  
**测试断言**: `expect(leftDrawer).toHaveStyle({ backgroundColor: '#f9fafb' })`

#### ST-4.3: 预览区渐变背景
**验收**: `linear-gradient(135deg, #fff 0%, #f9fafb 100%)`  
**测试断言**: `expect(preview).toHaveStyle({ background: expect.stringContaining('linear-gradient') })`

---

## ✅ Tester 任务清单

### 测试环境
- 路径: `vibex-fronted/`
- 测试框架: Jest + React Testing Library
- 命令: `npm test`

### Epic 1 测试用例

#### TC-1.1: AIPanel 集成验证
```typescript
describe('Epic 1: AIPanel 集成', () => {
  it('AC-P0-1: AIPanel 组件已渲染', () => {
    render(<HomePage />);
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();
  });

  it('AC-P0-2: AI 思考列表渲染数量匹配', () => {
    const { thinkingMessages } = result.current;
    const items = screen.getAllByRole('listitem', { name: /AI思考/ });
    expect(items).toHaveLength(thinkingMessages.length);
  });

  it('AC-P0-5: 新项目有脉冲动画', () => {
    render(<HomePage />);
    const newItem = screen.getByText('正在分析...');
    expect(newItem.closest('[class*="thinking"]')).toHaveClass(/new/);
    // 验证 CSS animation 存在
    const computed = window.getComputedStyle(newItem.closest('[class*="thinking"]'));
    expect(computed.animation).toContain('pulse');
  });
});
```

### Epic 2 测试用例

#### TC-2.1: 底部面板结构
```typescript
describe('Epic 2: 底部面板', () => {
  it('AC-P0-3: 底部面板高度 380px', () => {
    render(<BottomPanel />);
    const panel = screen.getByTestId('bottom-panel');
    expect(panel).toHaveStyle({ height: '380px' });
  });

  it('ST-2.2: 收起手柄高度 30px', () => {
    render(<BottomPanel />);
    const handle = screen.getByTestId('collapse-handle');
    expect(handle).toHaveStyle({ height: '30px' });
  });

  it('ST-2.3: 需求录入区高度 80px', () => {
    render(<BottomPanel />);
    const inputArea = screen.getByTestId('input-area');
    expect(inputArea).toHaveStyle({ height: '80px' });
  });

  it('ST-2.4: 操作按钮栏高度 50px', () => {
    render(<BottomPanel />);
    const actionBar = screen.getByTestId('action-bar');
    expect(actionBar).toHaveStyle({ height: '50px' });
  });

  it('ST-2.5: AI展示区 3列网格', () => {
    render(<BottomPanel />);
    const display = screen.getByTestId('ai-display');
    expect(display).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
  });

  it('底部面板 4 个子组件全部可见', () => {
    render(<BottomPanel />);
    expect(screen.getByTestId('collapse-handle')).toBeVisible();
    expect(screen.getByTestId('input-area')).toBeVisible();
    expect(screen.getByTestId('action-bar')).toBeVisible();
    expect(screen.getByTestId('ai-display')).toBeVisible();
  });
});
```

### Epic 3 测试用例

#### TC-3.1: Grid 布局
```typescript
describe('Epic 3: 布局与主题', () => {
  it('三栏布局宽度正确', () => {
    render(<HomePage />);
    const leftDrawer = screen.getByTestId('left-drawer');
    const rightDrawer = screen.getByTestId('right-drawer');
    expect(leftDrawer).toHaveStyle({ width: '220px' });
    expect(rightDrawer).toHaveStyle({ width: '260px' });
  });

  it('浅色主题背景色', () => {
    render(<HomePage />);
    const page = screen.getByTestId('homepage-page');
    expect(page).toHaveStyle({ backgroundColor: '#f9fafb' });
  });
});
```

### Epic 4 测试用例

#### TC-4.1: 视觉一致性
```typescript
describe('Epic 4: 视觉一致性', () => {
  it('AC-P1-1: 左侧抽屉浅色背景 #f9fafb', () => {
    render(<HomePage />);
    const left = screen.getByTestId('left-drawer');
    expect(left).toHaveStyle({ backgroundColor: '#f9fafb' });
  });

  it('AC-P1-2: 预览区有渐变背景', () => {
    render(<HomePage />);
    const preview = screen.getByTestId('preview-area');
    const bg = preview.style.background ||
      window.getComputedStyle(preview).background;
    expect(bg).toContain('linear-gradient');
  });
});
```

### 回归测试（必须全部通过）

| ID | 测试描述 | 断言 |
|----|----------|------|
| RG-1 | 现有 Sidebar 步骤点击正常工作 | 点击 Step 2 后 currentStep === 2 |
| RG-2 | 预览区 Mermaid 图表正常渲染 | PreviewArea 包含 Mermaid 组件 |
| RG-3 | 现有 InputArea 提交功能正常 | onSubmit 被调用 |
| RG-4 | SSE thinkingMessages 数据流正常 | thinkingMessages 更新后 UI 响应 |
| RG-5 | 页面加载性能 < 2s | Lighthouse TTI < 2s |

---

## 👁️ Reviewer 检查清单

### 代码质量
- [ ] TypeScript 类型完整，无 `any` 类型（除明确标注外）
- [ ] CSS 变量命名遵循 `--color-*` 规范
- [ ] 组件职责单一，每个文件 < 300 行
- [ ] 无重复代码（抽取复用组件/hooks）
- [ ] import 语句排序正确（React → 第三方 → 内部）
- [ ] console.log / console.error 清理（生产代码中无）

### 架构检查
- [ ] 新建 `BottomPanel` 目录结构符合规范
- [ ] `homepage-v4.module.css` 与 `homepage.module.css` 并存，未删除旧文件
- [ ] Grid 布局使用 `grid-column: 1 / -1` 正确定位 header/bottom
- [ ] 浅色主题变量仅在首页 CSS 文件中定义
- [ ] AIPanel 适配器逻辑正确处理空数组边界情况

### 功能检查
- [ ] AIPanel 在 260px 宽度内正常渲染
- [ ] thinkingMessages 数量变化时 AIPanel 实时更新
- [ ] 底部面板 4 个子区域高度正确
- [ ] 三栏布局在 1200px+ 宽度下无溢出
- [ ] 浅色主题切换后无深色残留

### 回归检查
- [ ] 现有 6 步流程点击正常
- [ ] `useHomePage` hook 中 `thinkingMessages` 聚合逻辑未被改动
- [ ] Sidebar 步骤项数量仍为 6
- [ ] PreviewArea Mermaid 渲染正常
- [ ] InputArea 提交逻辑未被影响

### 安全检查
- [ ] 无 XSS 风险（用户输入通过 React 自动转义）
- [ ] 无硬编码密码或密钥
- [ ] CSS 无 `!important` 滥用（最多 3 处）

### 测试覆盖
- [ ] 每个 Story 至少有 1 个测试用例
- [ ] 回归测试全部通过
- [ ] 测试文件在 `__tests__/` 或 `*.test.tsx` 中

---

## 📊 Dev → Tester → Reviewer 交接标准

### Dev 交付标准
- [ ] 所有 Story 的代码改动已提交到分支
- [ ] 编译通过: `npm run build` 无错误
- [ ] 类型检查通过: `npx tsc --noEmit` 无错误
- [ ] 单元测试通过: `npm test` 覆盖率不降低
- [ ] 产出物: PR 链接 + 变更文件清单

### Tester 验证标准
- [ ] P0 验收标准全部通过
- [ ] P1 验收标准全部通过
- [ ] 回归测试全部通过
- [ ] 无新的 console.error / warning
- [ ] 产出物: 测试报告 + bug 列表（如有）

### Reviewer 放行标准
- [ ] 代码质量检查清单 100% 通过
- [ ] 架构检查清单 100% 通过
- [ ] 功能检查清单 100% 通过
- [ ] 回归检查清单 100% 通过
- [ ] 安全检查清单 100% 通过
- [ ] 测试覆盖检查清单 100% 通过
- [ ] 产出物: Approved + 修改建议（如有）
