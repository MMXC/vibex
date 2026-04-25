# Spec: E2 — AI Coding Agent 四态 QA 规格

**对应 Epic**: E2 AI Coding Agent QA 验证
**目标验证**: CodingAgent 服务层 + ProtoAttrPanel AI Tab
**验证点**: F2.1 + F2.2 + F2.3

---

## 1. CodingAgent 服务层验证

### 核心验证：非 Stub

**必须验证**: `CodingAgent` 类的 `generateCode` 方法调用了真实服务（sessions_spawn 或 HTTP AI），而非 `mockAgentCall()`。

验证方式：
1. 检查 `src/services/ai-coding/CodingAgent.ts` 或等效文件
2. 代码中不存在 `mockAgentCall` 或 `// TODO: Replace with real agent code` 注释
3. 实际调用了 `sessions_spawn({ runtime: 'acp' })`（方案 A）或 HTTP AI 服务（方案 B）

### 接口验证

```typescript
// GeneratedCode 接口
interface GeneratedCode {
  componentId: string;
  componentName: string;
  code: string;           // 生成的代码字符串
  language: 'tsx' | 'jsx'; // 不是 'unknown'
  model: string;          // 'claude' | 'gpt-4' | 'minimax'
}

// generateCode 返回值验证
const codes = await codingAgent.generateCode([{ id: 'n1', type: 'Button', props: {} }]);
expect(Array.isArray(codes)).toBe(true);
expect(codes.length).toBeGreaterThan(0);
expect(typeof codes[0].code).toBe('string');
expect(codes[0].code.length).toBeGreaterThan(0);
expect(codes[0].language).toMatch(/tsx|jsx/);
expect(codes[0].model).toBeTruthy();
```

---

## 2. ProtoAttrPanel AI 代码 Tab 四态

### 理想态
- ProtoAttrPanel 存在 AI 代码 Tab（role: tab, name: /AI 代码/i）
- Tab 切换后显示：
  - 组件名称 badge
  - AI 模型选择（下拉：Claude / GPT-4 / MiniMax）
  - "生成代码" 按钮（enabled）
  - 代码输出区（testId: `ai-code-output`，语法高亮，等宽字体）
  - "复制代码" 按钮
  - "重新生成" 按钮

### 空状态
- 未生成代码时：显示引导文案 "点击「生成代码」查看 AI 生成的组件代码"
- 禁止只留白

### 加载态
- 生成中：代码区显示骨架屏（testId: `code-skeleton`）+ "正在调用 Claude..." 文案
- 禁止使用纯转圈

### 错误态
- 生成失败：显示红色错误 banner（testId: `code-error-banner`）+ "重新生成" 按钮
- 不覆盖已生成的代码（切换 tab 再回来，代码仍在）

---

## 3. E2 Stub 升级决策验证

### 方案 A: OpenClaw ACP Runtime
```typescript
// 验证 sessions_spawn 被调用（runtime: 'acp'）
expect(sessions_spawn).toHaveBeenCalledWith(expect.objectContaining({
  runtime: 'acp',
  mode: 'session',
}));
```

### 方案 B: HTTP 后端 AI
```typescript
// 验证 HTTP 请求发出
expect(fetch).toHaveBeenCalledWith(
  expect.stringContaining('/api/ai/generate'),
  expect.objectContaining({ method: 'POST' })
);
```

---

## 4. 验证场景汇总

| 场景 | 组件 | 测试 ID / 选择器 | 预期行为 |
|------|------|-----------------|---------|
| 理想态-AI Tab存在 | ProtoAttrPanel | `getByRole('tab', { name: /AI 代码/i })` | Tab 可见 |
| 理想态-生成按钮 | ProtoAttrPanel | `getByRole('button', { name: /生成代码/i })` | 按钮 enabled |
| 空状态-引导文案 | ProtoAttrPanel | `getByText(/点击「生成代码」查看/i)` | 文案存在 |
| 加载态-骨架屏 | ProtoAttrPanel | `getByTestId('code-skeleton')` | 骨架屏可见 |
| 加载态-进度文案 | ProtoAttrPanel | `getByText(/正在调用 Claude/i)` | 文案存在 |
| 错误态-错误banner | ProtoAttrPanel | `getByTestId('code-error-banner')` | 错误提示可见 |
| 理想态-代码输出 | ProtoAttrPanel | `getByTestId('ai-code-output')` | 代码文本可见 |
| 理想态-复制按钮 | ProtoAttrPanel | `getByRole('button', { name: /复制/i })` | 按钮 enabled |
| 非Stub-代码非空 | CodingAgent | `expect(codes[0].code.length).toBeGreaterThan(0)` | 代码有实际内容 |
| 方案A-sessions_spawn | CodingAgent | `expect(sessions_spawn).toHaveBeenCalled()` | 真实调用 |
