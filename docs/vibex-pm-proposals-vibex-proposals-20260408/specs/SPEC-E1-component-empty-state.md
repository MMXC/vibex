# SPEC: E1 — 组件生成空数据兜底

**Epic:** E1 — P0 止血：管道稳定性  
**Stories:** S1.1, S1.2, S1.3, S1.4  
**Owner:** dev  
**Estimated:** 2h

---

## 1. 概述

`generateComponents` API（E3）调用时，若 `flowId` 为空、返回空数组或 HTTP 错误，当前 UI 无明确反馈，用户体验为「点了没反应」。本 Epic 修复三种异常路径。

---

## 2. Story S1.1: flowId 空时禁用按钮

### 2.1 触发条件

- 用户未在 Flow 阶段勾选任何节点，或 `flowId = ''`
- "继续·组件树"按钮尝试触发生成

### 2.2 实现方案

**文件:** `src/pages/CanvasPage.tsx`

```typescript
const canContinueToComponents = flowId !== '' && !componentGenerating;

// 按钮
<button
  disabled={!canContinueToComponents}
  onClick={handleContinueToComponents}
  title={canContinueToComponents ? '继续生成组件树' : '请先在流程树中选择节点'}
>
  继续·组件树
</button>
```

### 2.3 验收标准

```typescript
// 视觉验证
expect(screen.getByText('继续·组件树')).toBeDisabled();
expect(screen.getByText('继续·组件树')).toHaveAttribute('title', '请先在流程树中选择节点');

// 功能验证
expect(canContinueToComponents).toBe(false); // flowId === ''
```

---

## 3. Story S1.2: 空数据 EmptyState UI

### 3.1 触发条件

- 用户点击"继续·组件树"，API 返回 `result.success = true` 但 `result.components.length === 0`

### 3.2 实现方案

**文件:** `src/components/ComponentTree/index.tsx`

```typescript
const handleGenerate = async () => {
  setComponentGenerating(true);
  try {
    const result = await generateComponents({ flowId, flowNodes });
    if (!result.success || !result.components || result.components.length === 0) {
      // 显示 EmptyState
      setShowEmptyState(true);
      setComponentGenerating(false);
      return;
    }
    setComponentStore(result.components);
    setShowEmptyState(false);
  } catch (error) {
    // 错误走 S1.3 路径
  } finally {
    setComponentGenerating(false);
  }
};

// EmptyState 组件
{showEmptyState && (
  <div data-testid="empty-state" className="empty-state">
    <EmptyState
      icon={<AlertTriangleIcon />}
      title="组件生成失败，请重试"
      description="未找到可生成的组件，请检查流程节点选择后重试"
      action={{
        label: '重试',
        onClick: handleGenerate,
      }}
    />
  </div>
)}
```

### 3.3 EmptyState 组件规格

**文件:** `src/components/common/EmptyState/index.tsx`

Props:
```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

样式：居中显示，背景 `#f9fafb`，图标 48px，标题 18px bold，描述 14px gray，间距 16px。

### 3.4 验收标准

```typescript
expect(screen.getByTestId('empty-state')).toBeVisible();
expect(screen.getByText('组件生成失败，请重试')).toBeInTheDocument();
expect(screen.getByText('重试')).toBeInTheDocument();

fireEvent.click(screen.getByText('重试'));
await waitFor(() => {
  expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
});
```

---

## 4. Story S1.3: HTTP 错误 Toast 通知

### 4.1 触发条件

- 用户点击"继续·组件树"，API 返回 HTTP 错误（4xx/5xx）或网络异常

### 4.2 实现方案

**文件:** `src/pages/CanvasPage.tsx`

```typescript
import { toast } from '@/components/ui/toast';

const handleGenerateComponents = async () => {
  setComponentGenerating(true);
  try {
    const result = await generateComponents({ flowId, flowNodes });
    if (!result.success) {
      toast.error('组件生成失败，请重试', { duration: 5000 });
      return;
    }
    // ...
  } catch (error) {
    canvasLogger.error('CanvasPage.handleContinueToComponents', {
      flowId,
      error: error instanceof Error ? error.message : String(error),
    });
    toast.error('组件生成失败，请检查网络后重试', { duration: 5000 });
  } finally {
    setComponentGenerating(false);
  }
};
```

### 4.3 Toast 组件规格

- 类型: `error`（红色边框，错误图标）
- 自动消失: `duration: 5000`（5秒）
- 位置: 右上角
- 内容: 简洁错误描述 + 可选操作链接

### 4.4 验收标准

```typescript
const toastSpy = vi.spyOn(toast, 'error');

fireEvent.click(screen.getByText('继续·组件树'));
await waitFor(() => {
  expect(toastSpy).toHaveBeenCalledWith(
    expect.stringContaining('失败'),
    { duration: 5000 }
  );
});
```

---

## 5. Story S1.4: 单元测试覆盖

### 5.1 测试文件

**文件:** `src/pages/__tests__/CanvasPage.test.tsx`

```typescript
describe('handleContinueToComponents', () => {
  it('should disable button when flowId is empty', () => {
    render(<CanvasPage />);
    expect(screen.getByText('继续·组件树')).toBeDisabled();
  });

  it('should show EmptyState when API returns empty components', async () => {
    mockGenerateComponents.mockResolvedValue({ success: true, components: [] });
    render(<CanvasPage />);
    fireEvent.click(screen.getByText('继续·组件树'));
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeVisible();
    });
  });

  it('should show Toast on HTTP error', async () => {
    mockGenerateComponents.mockRejectedValue(new Error('Network error'));
    const toastSpy = vi.spyOn(toast, 'error');
    render(<CanvasPage />);
    fireEvent.click(screen.getByText('继续·组件树'));
    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
    });
  });
});
```

---

## 6. 依赖与风险

| 项目 | 说明 |
|------|------|
| 依赖 | `EmptyState` 组件（需新建）；`toast` utility（需确认已存在） |
| 风险 | `EmptyState` 组件首次引入，需设计其样式规范 |
| 回滚方案 | 注释掉 EmptyState 渲染逻辑，降级为 alert 对话框 |

---

## 7. 非功能需求

- **性能**: `generateComponents` 调用有 loading 状态（`componentGenerating`），避免重复点击
- **可访问性**: EmptyState 有 `role="alert"`；错误按钮有 `aria-label`
- **日志**: 所有错误路径通过 `canvasLogger.error` 记录
