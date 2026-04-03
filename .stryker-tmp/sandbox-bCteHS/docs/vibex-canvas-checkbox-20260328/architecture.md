# Architecture: vibex-canvas-checkbox-20260328

**Project**: Checkbox 图标修复（emoji → CSS box-style）
**Architect**: Architect Agent | **Date**: 2026-03-28 | **Status**: ✅

---

## 1. Tech Stack

| 组件 | 说明 |
|------|------|
| CSS | 纯 CSS checkbox，无新依赖 |
| React | 现有 18.x |

---

## 2. Module Design

### 2.1 CheckboxIcon Component

**文件**: `src/components/common/CheckboxIcon.tsx` (新增)

```typescript
interface CheckboxIconProps {
  checked: boolean;
  size?: number;
  className?: string;
}

// 纯 CSS box-style: ☐ / ☑
const CheckboxIcon: React.FC<CheckboxIconProps> = ({ checked, size = 16 }) => (
  <span
    className={clsx('checkbox-icon', checked && 'checkbox-icon--checked')}
    style={{ width: size, height: size }}
    role="checkbox"
    aria-checked={checked}
  />
);
```

### 2.2 Affected Files

需替换 emoji checkbox 的文件：

| 文件 | 组件 |
|------|------|
| `ComponentSelectionStep.tsx` | 自定义 emoji checkbox |
| `NodeSelector.tsx` | 自定义 emoji checkbox |
| `BoundedContextTree.tsx` | 自定义 emoji checkbox |

---

## 3. CSS Design

```css
.checkbox-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--border-color);
  border-radius: 3px;
  background: transparent;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.checkbox-icon--checked {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-icon--checked::after {
  content: '✓';
  color: white;
  font-size: 10px;
  font-weight: bold;
}
```

---

## 4. Implementation Plan

| 任务 | 工时 |
|------|------|
| 创建 `CheckboxIcon.tsx` | 1h |
| 替换 `ComponentSelectionStep` | 0.5h |
| 替换 `NodeSelector` | 0.5h |
| 替换 `BoundedContextTree` | 0.5h |
| 深色模式适配 | 0.5h |
| 无障碍验证（aria-checked）| 0.5h |
| **总计** | **~3.5h** |

---

## 5. Key Files

```
src/components/common/CheckboxIcon.tsx     [新增]
src/components/steps/ComponentSelectionStep.tsx [修改]
src/components/canvas/NodeSelector.tsx         [修改]
src/components/canvas/BoundedContextTree.tsx  [修改]
```
