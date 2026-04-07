# Spec: F3 原有功能回归验证

## F3.1 领域模型生成功能回归

### 回归范围
验证以下功能在修复后行为与 2026-03-16（commit 005279b）保持一致：
- 限界上下文生成 → 图表渲染
- 领域模型生成 → 图表渲染（核心）
- 业务流程生成 → 图表渲染

### 测试用例
```typescript
describe('回归测试: 领域模型生成', () => {
  it('生成后图表正确渲染', async () => {
    render(<DomainModelPage />);
    fireEvent.click(screen.getByTestId('generate-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('domain-model-chart')).toBeVisible();
    });
  });
  
  it('mermaidCode 格式正确', async () => {
    const { container } = render(<MermaidChart code="graph TD; A-->B;" />);
    await waitForMermaid();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg.querySelectorAll('g.node')).toHaveLength(2);
  });
  
  it('npm test 全量通过', () => {
    const result = execSync('npm test -- --passWithNoTests', { cwd: '/root/.openclaw/vibex' });
    expect(result.status).toBe(0);
  });
  
  it('npm build 无 TypeScript 错误', () => {
    const result = execSync('npx tsc --noEmit', { cwd: '/root/.openclaw/vibex' });
    expect(result.status).toBe(0);
  });
});
```

### 验证命令
```bash
# 1. 单元测试
cd /root/.openclaw/vibex && npm test

# 2. 类型检查
cd /root/.openclaw/vibex && npx tsc --noEmit

# 3. 构建验证
cd /root/.openclaw/vibex && npm run build
```

---

*Spec by PM Agent | 2026-03-29*
