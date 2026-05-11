# Spec: E2-ai-coding — AI Coding Agent 四态规格

**对应 Epic**: E2 AI Coding Agent 验证
**组件范围**: CodingAgent 服务层 + ProtoAttrPanel AI Tab
**版本**: 1.0.0

---

## 1. CodingAgent 服务层规格

### 1.1 接口定义

```typescript
// GeneratedCode 接口
interface GeneratedCode {
  componentId: string;      // 非空
  componentName: string;   // 非空
  code: string;            // 生成的代码字符串，非空，长度 > 0
  language: 'tsx' | 'jsx'; // 不是 'unknown'，不是空字符串
  model: string;           // 'claude' | 'gpt-4' | 'minimax'，非空
}

// CodingAgent 主方法
async function createCodingSession(params: {
  context: ProtoNode[];
}): Promise<CodingAgentSession>;

// CodingAgentSession
interface CodingAgentSession {
  id: string;
  context: ProtoNode[];
  codes: GeneratedCode[];
  status: 'idle' | 'generating' | 'done' | 'error';
}
```

### 1.2 非 Stub 要求

**关键约束**: CodingAgent 实现必须调用真实 AI 服务，禁止使用 `mockAgentCall()` 或任何形式的硬编码返回。

**验证方式**（静态分析）：
- `src/services/ai-coding/CodingAgent.ts` 或等效文件
- 代码中不存在 `mockAgentCall` 字符串
- 代码中不存在 `// TODO: Replace with real agent` 或等效 TODO 注释

**方案 A — OpenClaw ACP Runtime**:
```typescript
// 调用方式：使用 sessions_spawn({ runtime: 'acp', mode: 'session' })
// 不接受 mock 实现
```

**方案 B — HTTP 后端 AI**:
```typescript
// 调用方式：fetch('/api/ai/generate', { method: 'POST' })
// 不接受 mock 实现
```

---

## 2. ProtoAttrPanel AI 代码 Tab 四态

### 2.1 理想态 (ideal)

**触发条件**: 用户选中画布组件，切换到 AI 代码 Tab，代码已生成完毕

**UI 元素**:
- Tab 切换按钮（`role="tab"`，`name="AI 代码"`，`aria-selected: true`）
- 组件名称 badge（`testId="component-name-badge"`，显示如 "Button 组件"）
- AI 模型选择下拉（`testId="model-selector"`，选项: "Claude" / "GPT-4" / "MiniMax"，默认 "Claude"）
- "生成代码" 按钮（`testId="generate-btn"`，enabled）
- 代码输出区（`testId="ai-code-output"`，`role="code"`）：
  - 语法高亮（`var(--color-code-keyword, #7C3AED)` 等）
  - 等宽字体（`font-family: 'JetBrains Mono', monospace`）
  - 行号（可选）
- "复制代码" 按钮（`testId="copy-btn"`，显示 "复制" / "已复制 ✓"）
- "重新生成" 按钮（`testId="regenerate-btn"`，secondary 样式）

**情绪引导文案**: "代码已生成，点击复制即可使用"

**间距规范（8倍数）**:
- Tab 内容区内边距: `padding: 16px`
- badge 与模型选择间距: `gap: 8px`
- 模型选择与生成按钮间距: `gap: 8px`
- 代码输出区内边距: `padding: 16px`
- 按钮间距: `gap: 8px`

**颜色 Token**:
- Tab 激活背景: `var(--color-primary, #4F46E5)`
- Tab 文字激活: `var(--color-on-primary, #FFFFFF)`
- Tab 未激活: `var(--color-text-secondary, #6B7280)`
- 代码背景: `var(--color-code-bg, #1F2937)`
- 代码文字: `var(--color-code-text, #F9FAFB)`

---

### 2.2 空状态 (empty)

**触发条件**: 用户切换到 AI 代码 Tab，尚未生成代码

**UI 元素**:
- Tab 激活显示
- 组件名称 badge（显示当前选中组件名）
- AI 模型选择下拉（保持可切换）
- "生成代码" 按钮（enabled）
- **引导文案**（`testId="empty-hint"`）："点击「生成代码」查看 AI 生成的组件代码"
- 禁止纯空白区域

**情绪引导文案**: "还没生成过代码 — 点一下试试？"

**间距规范**: 同 ideal

**颜色 Token**: 同 ideal，引导文案使用 `var(--color-text-muted, #9CA3AF)`

---

### 2.3 加载态 (loading)

**触发条件**: 用户点击"生成代码"，等待 AI 返回期间

**UI 元素**:
- Tab 保持激活
- "生成代码" 按钮（disabled，文字变为 "生成中..."）
- 代码输出区显示骨架屏（`testId="code-skeleton"`，`role="progressbar"`）
- 进度文案（`testId="generating-hint"`）："正在调用 Claude..."
- 模型选择（disabled，防止中途切换）

**情绪引导文案**: "Claude 正在思考，马上就好..."

**间距规范**: 同 ideal

**颜色 Token**:
- 骨架屏背景: `var(--color-skeleton, #F3F4F6)`
- 骨架屏动画: `@keyframes shimmer`，颜色在 `var(--color-skeleton)` 和 `var(--color-skeleton-end, #E5E7EB)` 间渐变
- 进度文案: `var(--color-text-secondary, #6B7280)`

---

### 2.4 错误态 (error)

**触发条件**: AI 生成失败（网络错误 / API 超时 / 响应格式异常）

**UI 元素**:
- 错误 Banner（`testId="code-error-banner"`，`role="alert"`）：
  - 红色背景 `var(--color-error-bg, #FEF2F2)`
  - 红色左边框 `border-left: 4px solid var(--color-error, #EF4444)`
  - 错误文案: "代码生成失败，请检查网络后重试"
- "重新生成" 按钮（`testId="regenerate-btn"`，enabled）
- **不覆盖已生成的代码**：切换 Tab 再回来，代码仍在（如有）
- 错误状态保持 Banner，直到用户点击"重新生成"或切换 Tab

**情绪引导文案**: "出问题了，但代码没丢 — 点重试试试"

**间距规范**:
- Banner 内边距: `padding: 12px 16px`
- Banner 与内容区间距: `gap: 16px`

**颜色 Token**:
- 错误 Banner 背景: `var(--color-error-bg, #FEF2F2)`
- 错误 Banner 边框: `var(--color-error, #EF4444)`
- 错误 Banner 文字: `var(--color-error, #EF4444)`

---

## 3. 验收标准

### QA 验证点映射

| 验证点 | 组件 | 态 | 测试断言 |
|--------|------|---|---------|
| F2.1 | CodingAgent | — | `expect(Array.isArray(codes)).toBe(true)` |
| F2.1 | CodingAgent | — | `expect(codes[0].code.length).toBeGreaterThan(0)` |
| F2.1 | CodingAgent | — | `expect(codes[0].language).toMatch(/tsx\|jsx/)` |
| F2.1 | CodingAgent | — | `expect(sourceCode).not.toMatch(/mockAgentCall/)` |
| F2.2 | ProtoAttrPanel | ideal | `expect(getByRole('tab', { name: /AI 代码/i })).toBeVisible()` |
| F2.2 | ProtoAttrPanel | ideal | `expect(getByTestId('ai-code-output')).toBeVisible()` |
| F2.2 | ProtoAttrPanel | empty | `expect(getByTestId('empty-hint')).toHaveTextContent(/点击.*生成代码.*查看/i)` |
| F2.2 | ProtoAttrPanel | loading | `expect(getByTestId('code-skeleton')).toBeVisible()` |
| F2.2 | ProtoAttrPanel | loading | `expect(getByTestId('generating-hint')).toHaveTextContent(/正在调用 Claude/i)` |
| F2.2 | ProtoAttrPanel | error | `expect(getByTestId('code-error-banner')).toBeVisible()` |

---

## 4. 设计约束

### 通用约束

- **间距**: 所有间距使用 8 倍数（`8px / 16px / 24px`），禁止硬编码非 8 倍数间距
- **颜色**: 所有颜色通过 CSS Custom Properties（Token）引用，禁止硬编码 hex 值
- **字体**: 代码输出使用等宽字体（`JetBrains Mono` / `Fira Code` / `monospace`）
- **动画时长**: `var(--duration-fast, 150ms)` / `var(--duration-base, 300ms)`

### 四态设计原则

- **ideal**: 代码清晰可读，复制按钮自明
- **empty**: 给出明确行动引导，禁止留白
- **loading**: 骨架屏 + 具体进度文案，禁止纯 spinner
- **error**: 错误 Banner 可辨认，保留重试路径，不丢已有内容
