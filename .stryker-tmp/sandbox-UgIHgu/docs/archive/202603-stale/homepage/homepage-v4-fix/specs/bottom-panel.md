# Spec: Bottom Panel Component

**文件**: `specs/bottom-panel.md`  
**状态**: Pending  
**创建日期**: 2026-03-21

---

## 功能描述

新增底部面板组件，固定高度 380px，包含收起手柄、需求录入区、操作按钮栏、AI展示区。

## 组件结构

```
BottomPanel (380px)
├── Handle (30px) - 收起/展开拖拽手柄
├── InputArea (80px) - 需求输入框
├── ActionButtons (50px) - 操作按钮栏
└── AICardGrid (flex: 1) - AI展示卡片网格
    ├── AICard
    ├── AICard
    └── AICard
```

## 技术方案

### 组件接口

```tsx
interface BottomPanelProps {
  isCollapsed?: boolean;
  onToggle: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  aiCards: AICardData[];
}

interface AICardData {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
}
```

### 样式规格

| 区域 | 高度 | 说明 |
|------|------|------|
| Handle | 30px | 顶部拖拽手柄 |
| InputArea | 80px | 需求输入框 |
| ActionButtons | 50px | 按钮栏 |
| AICardGrid | flex: 1 | 3列卡片网格 |

### CSS Grid 布局

```css
.bottom-panel {
  display: grid;
  grid-template-rows: 30px 80px 50px 1fr;
  height: 380px;
  background: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border);
}

.ai-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}
```

### 验证标准

```typescript
describe('BottomPanel', () => {
  it('should render with correct height', () => {
    render(<BottomPanel {...props} />);
    const panel = screen.getByTestId('bottom-panel');
    expect(panel).toHaveStyle({ height: '380px' });
  });
  
  it('should have 4 child sections', () => {
    render(<BottomPanel {...props} />);
    expect(screen.getByTestId('handle')).toBeVisible();
    expect(screen.getByTestId('input-area')).toBeVisible();
    expect(screen.getByTestId('action-buttons')).toBeVisible();
    expect(screen.getByTestId('ai-card-grid')).toBeVisible();
  });
  
  it('should render 3-column card grid', () => {
    render(<BottomPanel {...props} aiCards={mockCards} />);
    const grid = screen.getByTestId('ai-card-grid');
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
  });
  
  it('should toggle collapse state', () => {
    const onToggle = jest.fn();
    render(<BottomPanel {...props} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('handle'));
    expect(onToggle).toHaveBeenCalled();
  });
});
```

---

**下一步**: 等待 Dev Agent 实现
