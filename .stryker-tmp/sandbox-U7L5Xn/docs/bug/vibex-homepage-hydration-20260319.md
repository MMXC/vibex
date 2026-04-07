# Bug Report: 首页React Hydration错误

## 基本信息
- **项目**: vibex
- **Bug ID**: vibex-homepage-hydration-20260319
- **严重级别**: P0
- **状态**: 待修复
- **发现时间**: 2026-03-19 02:53 GMT+8
- **发现者**: tester

## 问题描述

访问首页 (/) 时，控制台报错 **React Error #310**，导致功能首页组件未正确渲染。

### 错误信息
```
Error: Minified React error #310
at Object.or [as useMemo]
at r0 (HomePage component)
ErrorBoundary caught an error: Error: Minified React error #310
```

### 影响
- 首页功能组件（InputArea、PreviewArea、60/40布局）未渲染
- 用户无法使用核心功能
- Playwright E2E测试失败

### 页面状态
```
URL: https://vibex-app.pages.dev/
Title: VibeX - AI 驱动的产品建模平台
H1: 0, H2: 1
按钮: 2, 输入框: 0, 文本框: 0
错误元素: 0 (但控制台有错误)
```

## 根因分析

**React Error #310** = Hooks调用顺序不一致

### 可疑位置
1. `useHomePage.ts` 第98-99行:
   ```typescript
   const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());
   const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
   ```
   `new Set()` 在服务端和客户端创建不同引用 → Hydration mismatch

2. 其他Hook可能也存在条件调用

## 测试证据

### E2E测试结果
```
测试: 首页加载
结果: FAIL
控制台错误: 2个 React #310错误
页面元素: H1=0, 按钮=2, textarea=0
```

### 截图
- `test-results/screenshots/homepage-areas-1773859817050.png`

## 修复建议

### 方案1: 函数式初始化 (推荐)
```typescript
const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(() => new Set());
const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(() => new Set());
```

### 方案2: 使用useEffect同步
```typescript
const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());
useEffect(() => {
  // 客户端初始化
}, []);
```

### 方案3: 延迟水合
在layout.tsx中使用suppressHydrationWarning

## 相关文件
- `/src/components/homepage/hooks/useHomePage.ts`
- `/src/components/homepage/HomePage.tsx`
- `/src/stores/authStore.ts`

## 复现步骤
1. 访问 https://vibex-app.pages.dev/
2. 打开控制台
3. 观察React #310错误
4. 页面显示落地页而非功能首页
