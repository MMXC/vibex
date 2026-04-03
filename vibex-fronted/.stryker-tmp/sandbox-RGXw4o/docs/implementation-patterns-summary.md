# 实现模式总结 - vibex-homepage-modular-refactor

**Agent**: dev  
**日期**: 2026-03-15

---

## 1. 组件拆分模式

### 1.1 目录结构
```
components/homepage/
├── Navbar/           # 独立组件目录
│   ├── Navbar.tsx
│   └── Navbar.module.css
├── Sidebar/
├── PreviewArea/
├── InputArea/
├── AIPanel/
└── hooks/            # 自定义 Hooks 目录
    ├── useHomeState.ts
    ├── useHomeGeneration.ts
    └── useHomePanel.ts
```

### 1.2 组件导出模式
```typescript
// index.ts 统一导出
export { Navbar } from './Navbar/Navbar';
export { Sidebar } from './Sidebar/Sidebar';
export { useHomeState } from './hooks/useHomeState';
```

### 1.3 Props 类型定义
```typescript
// types/homepage.ts 集中定义
export interface NavbarProps {
  isAuthenticated: boolean;
  onLoginClick: () => void;
  title?: string;
}
```

---

## 2. 页面集成模式

### 2.1 入口文件简化
```typescript
// page.tsx - 简化为入口
import HomePage from '@/components/homepage/HomePage';
export default HomePage;
```

### 2.2 业务逻辑封装
```typescript
// HomePage.tsx - 封装所有业务逻辑
export default function HomePage() {
  // 状态定义
  const [state, setState] = useState();
  
  // 业务逻辑
  const handleAction = useCallback(() => {...}, []);
  
  // UI 渲染
  return <div>...</div>;
}
```

---

## 3. Hooks 设计模式

### 3.1 状态管理 Hook
```typescript
export const useHomeState = () => {
  const [state, setState] = useState(initial);
  
  // 业务方法
  const action = useCallback(() => {...}, []);
  
  return { state, action };
};
```

### 3.2 持久化 Hook
```typescript
// useLocalStorage - SSR 安全
export const useLocalStorage = (key, initial) => {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    // client-side logic
  });
  
  // 持久化逻辑
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
};
```

---

## 4. 样式模式

### 4.1 CSS Modules
```typescript
// 组件内使用
import styles from './Component.module.css';

<div className={styles.container}>...</div>
```

### 4.2 响应式断点
```css
/* 移动端优先 */
@media (max-width: 768px) {
  .container { ... }
}
```

---

## 5. 问题解决模式

### 5.1 构建失败 - CSS 路径错误
- **问题**: `Module not found: Can't resolve './homepage.module.css'`
- **解决**: 使用绝对路径 `@/app/homepage.module.css`

### 5.2 TypeScript 类型错误
- **问题**: 函数名拼写错误、参数类型不匹配
- **解决**: 
  1. 检查 Hook 返回类型定义
  2. 统一使用 `any` 类型作为临时绕过
  3. 验证 API 接口签名

---

## 6. 代码组织原则

1. **单一职责**: 每个组件只负责一个功能
2. ** Props 驱动**: 组件通过 Props 接收数据和回调
3. **Hook 抽离**: 业务逻辑抽离到自定义 Hooks
4. **类型集中**: 类型定义集中在 `types/` 目录
5. **样式隔离**: 使用 CSS Modules 避免样式冲突

---

## 7. 经验教训

1. **先创建组件再集成**: 先完成组件开发，再进行页面集成
2. **保持现有功能**: 不破坏现有功能的前提下进行重构
3. **及时验证**: 每完成一个任务就运行 TypeScript 编译检查
4. **文档记录**: 创建开发检查清单记录产出物
