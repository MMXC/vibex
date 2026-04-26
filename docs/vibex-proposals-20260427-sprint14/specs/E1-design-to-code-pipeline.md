# S14-E1 Spec: Design-to-Code Pipeline 串联

## Epic 概述

设计师在 Canvas 上完成组件设计，通过 CodeGen 生成 TSX 骨架后，直接将设计上下文发送给 AI Agent，无需手动复制粘贴。

## 推荐方案

**方案 A：按钮注入模式**
- CodeGenPanel 增加 "Send to AI Agent" 按钮
- `agentStore.injectContext()` 接收 generatedCode + designNode context
- 路由跳转 `/design/canvas?agentSession=new`

## 用户故事

### US-E1.1: 设计师一键发送设计上下文到 AI Agent
**作为**产品设计师，**我希望**点击一个按钮就把 CodeGen 生成的代码和设计节点上下文发送给 AI Agent，**这样**我不需要懂代码也能获得可用的组件实现。

**验收标准**:
- expect(CodeGenPanel).toHaveButton('Send to AI Agent')
- expect(agentStore.injectContext).toHaveBeenCalledWith(expect.objectContaining({ type: 'codegen', generatedCode: expect.any(String), nodes: expect.any(Array) }))
- expect(navigate).toHaveBeenCalledWith('/design/canvas?agentSession=new')

### US-E1.2: AI Agent 接收并展示注入的上下文
**作为**AI Agent，**我希望**在启动时能读取 URL 参数 `agentSession=new` 并加载注入的设计上下文，**这样**我收到的消息输入框就预填充了代码片段。

**验收标准**:
- expect(useAgentContext).toHaveBeenCalledWith({ sessionId: 'new', source: 'codegen' })
- expect(messageInput).toHaveValueContaining('// Generated from Canvas')

### US-E1.3: 大型 Canvas 节点截断保护
**作为**CodeGenPanel，**我希望**当选中的 Canvas 节点超过 200 个时同步显示警告，**这样**用户知道 AI Agent 无法接收完整上下文。

**验收标准**:
- Given 201 selected nodes, when CodeGenPanel renders, then expect(warningBanner).toBeVisible()
- expect(warningBanner).toHaveTextContent(/200.*nodes.*truncated/i)

## 技术规格

### CodeGenPanel 修改
```typescript
interface CodeGenContext {
  type: 'codegen';
  generatedCode: string;
  nodes: DesignNode[];
  schemaVersion: string;
  exportedAt: string; // ISO timestamp
}
```

### 依赖
- S13-E1 (CodeGenPanel) 必须已实施
- AI Agent session store 必须支持 `injectContext()`

## Definition of Done

- [ ] CodeGenPanel 有 "Send to AI Agent" 按钮，data-testid="codegen-send-to-agent-btn"
- [ ] 点击按钮后 AI Agent 页面能接收并展示设计上下文
- [ ] 200+ 节点时显示截断警告（E2E 覆盖）
- [ ] `agentStore.injectContext` 有单元测试（valid/invalid context 各一条）
- [ ] 集成测试：`选择节点 → CodeGen → Send to AI Agent → 验证 context 注入`
- [ ] feature flag `FEATURE_DESIGN_TO_CODE_PIPELINE` 控制功能开关
