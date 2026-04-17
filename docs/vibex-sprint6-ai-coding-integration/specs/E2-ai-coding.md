# Spec: E2 — AI Coding Agent 规格

**对应 Epic**: E2 AI Coding Agent 反馈回路
**目标文件**: 
- `vibex-fronted/src/services/ai-coding/CodingAgent.ts`（新建）
- `vibex-fronted/src/components/prototype/ProtoAttrPanel.tsx`（修改）
**相关**: `vibex-fronted/src/lib/ai/llm-provider.ts`

---

## 1. CodingAgent 服务层规格

### 接口定义

```typescript
// 文件: src/services/ai-coding/CodingAgent.ts

interface GeneratedCode {
  componentId: string;
  componentName: string;
  code: string;        // 生成的代码字符串
  language: 'tsx' | 'jsx' | 'css' | 'html';
  model: string;       // 'claude' | 'gpt-4' | 'minimax'
}

class CodingAgent {
  constructor(private llmProvider: LLMProvider) {}

  async generateCode(components: ProtoNode[]): Promise<GeneratedCode[]> {
    const prompt = this.buildPrompt(components);
    const response = await this.llmProvider.complete({
      model: 'claude',
      messages: [{ role: 'user', content: prompt }],
    });
    return this.parseResponse(response, components);
  }

  private buildPrompt(components: ProtoNode[]): string {
    return `请根据以下原型组件生成 React 代码：
${components.map(c => `- 组件: ${c.type}, 属性: ${JSON.stringify(c.props)}`).join('\n')}
只输出代码，不要其他内容。`;
  }

  private parseResponse(response: string, components: ProtoNode[]): GeneratedCode[] {
    // 简化解析：按组件数量分段
    return components.map((c, i) => ({
      componentId: c.id,
      componentName: c.type,
      code: this.extractCode(response, i),
      language: 'tsx',
      model: 'claude',
    }));
  }
}
```

---

## 2. ProtoAttrPanel AI 代码 Tab

### 理想态
- ProtoAttrPanel 有 3 个 Tab：Props / MockData / AI 代码
- AI 代码 Tab 内容：
  - 组件名称 badge
  - AI 模型选择（Claude / GPT-4 / MiniMax 下拉）
  - "生成代码" 按钮
  - 代码输出区（语法高亮，等宽字体）
  - "复制代码" 按钮
  - "采纳" / "重新生成" 按钮

### 空状态
- 未生成代码时：显示引导文案 "点击「生成代码」查看 AI 生成的组件代码"
- 禁止只留白

### 加载态
- 生成中：代码区显示骨架屏 + "正在生成..." 文案
- 禁止使用纯转圈

### 错误态
- 生成失败：显示错误信息 + "重新生成" 按钮
- 不丢失已生成的代码

---

## 3. AI 代码 Tab 四态规范

### 理想态
- 代码语法高亮（关键词蓝色 / 字符串绿色 / 标签橙色）
- 代码可滚动
- 底部操作栏：复制 / 采纳 / 重新生成

### 空状态
- 引导文案："AI 代码让设计师看到代码长什么样"
- 引导插图（代码图标 SVG）

### 加载态
- 骨架屏（多行灰色代码块）
- 进度文案："正在调用 Claude..."

### 错误态
- 红色错误 banner + 重试按钮
- 不覆盖已生成的代码

---

## 样式约束

- 间距：8 的倍数
- 颜色：使用 Token
- 禁止硬编码
- 代码区：`font-family: 'JetBrains Mono', monospace`
- 代码区背景：`var(--color-code-bg)` token
