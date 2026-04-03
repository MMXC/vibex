# Spec: AIPanel Integration

**文件**: `specs/ai-panel-integration.md`  
**状态**: Pending  
**创建日期**: 2026-03-21

---

## 功能描述

将 AIPanel 组件集成到 HomePage 右侧抽屉区域，显示 AI 思考列表。

## 技术方案

### 组件结构

```tsx
// HomePage.tsx
import AIPanel from '@/components/homepage/AIPanel/AIPanel';

const HomePage: React.FC = () => {
  const { thinkingMessages } = useThinkingMessages();
  
  return (
    <div className="homepage-layout">
      {/* ... existing components ... */}
      <aside className="right-drawer" data-testid="ai-panel">
        <AIPanel messages={thinkingMessages} />
      </aside>
      {/* ... other components ... */}
    </div>
  );
};
```

### 样式规格

| 属性 | 值 |
|------|-----|
| 宽度 | 260px |
| 背景 | #f9fafb |
| 内边距 | 16px |
| 边框 | 左侧 1px solid #e5e7eb |

### 验证标准

```typescript
describe('AIPanel Integration', () => {
  it('should render AIPanel in right drawer', () => {
    render(<HomePage />);
    expect(screen.getByTestId('ai-panel')).toBeInTheDocument();
  });
  
  it('should display all thinking messages', () => {
    const messages = [
      { id: '1', content: '思考中...', status: 'thinking' },
      { id: '2', content: '分析需求', status: 'complete' },
    ];
    
    render(<HomePage thinkingMessages={messages} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
  
  it('should show pulse animation for new items', () => {
    const newItem = { id: 'new', content: '新思考', status: 'thinking' };
    render(<HomePage thinkingMessages={[newItem]} />);
    expect(screen.getByTestId('ai-item-new')).toHaveClass(/pulse-animation/);
  });
});
```

---

**下一步**: 等待 Dev Agent 实现
