# SPEC-F1: CanvasExpandState Store

## 1. Store Slice 定义

```typescript
// 类型定义
interface CanvasExpandState {
  leftExpanded: boolean;
  centerExpanded: boolean;
  rightExpanded: boolean;
  setLeftExpanded: (expanded: boolean) => void;
  setCenterExpanded: (expanded: boolean) => void;
  setRightExpanded: (expanded: boolean) => void;
  toggleLeftExpanded: () => void;
  toggleCenterExpanded: () => void;
  toggleRightExpanded: () => void;
}

// 初始状态
const initialState: Pick<CanvasExpandState, 'leftExpanded' | 'centerExpanded' | 'rightExpanded'> = {
  leftExpanded: false,
  centerExpanded: false,
  rightExpanded: false,
};
```

## 2. 行为规则

- 同一时间最多一栏展开（展开 A 栏时自动折叠 B/C 栏）
- 点击已展开栏的热区 → 折叠
- 点击未展开栏的热区 → 切换展开目标

## 3. CSS 变量映射

```typescript
const EXPAND_COLUMNS = {
  default: '1fr 1fr 1fr',
  left: '1.5fr 0.75fr 0.75fr',
  center: '0.75fr 1.5fr 0.75fr',
  right: '0.75fr 0.75fr 1.5fr',
};
```
